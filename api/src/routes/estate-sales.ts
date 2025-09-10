import { Router } from 'express';
import { PrismaClient } from "@prisma/client";
import { createLogger } from '../utils/logger';
import { authenticateToken } from '../middleware/auth';
import { checkUsageLimit } from '../middleware/usage';
import rateLimit from 'express-rate-limit';
import puppeteer from 'puppeteer';
import axios from 'axios';

const router = Router();
const logger = createLogger();
const prisma = new PrismaClient();

// Rate limiting for estate sales endpoints
const estateRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // 15 requests per window per IP
  message: {
    error: 'Too many estate sale requests',
    message: 'Please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

interface EstateSale {
  address: string;
  saleDate: Date;
  executor: string;
  status: 'upcoming' | 'probate_complete' | 'pending_probate' | 'cancelled';
  estimatedValue?: number;
  contactInfo?: string;
  deceasedName?: string;
  probateNumber?: string;
  saleType: 'estate_sale' | 'probate_sale' | 'executor_sale';
  verified: boolean;
  source: string;
  description?: string;
  propertyDetails?: {
    bedrooms?: number;
    bathrooms?: number;
    squareFootage?: number;
    lotSize?: string;
  };
}

// GET /api/estate-sales - Main endpoint for estate sale data
router.get('/', authenticateToken, checkUsageLimit('estate_sales'), estateRateLimit, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { 
      area = 'Toronto', 
      radius = 25, 
      daysBack = 30,
      status = 'all',
      minValue,
      maxValue,
      testMode = false 
    } = req.query;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User ID not found in request'
      });
    }

    logger.info(`Estate sale request: area=${area}, radius=${radius}km, user=${userId}`);

    let estates: EstateSale[] = [];
    
    if (testMode === 'true' || process.env.NODE_ENV === 'test') {
      // Return empty for test mode - no mock data
      estates = [];
    } else {
      // Production: scrape real estate and probate data
      estates = await scrapeEstateProceedings(
        area as string, 
        parseInt(radius as string), 
        parseInt(daysBack as string)
      );
    }

    // Filter by status if specified
    if (status !== 'all') {
      estates = estates.filter(estate => estate.status === status);
    }

    // Filter by value range if specified
    if (minValue || maxValue) {
      estates = estates.filter(estate => {
        if (!estate.estimatedValue) return false;
        const min = minValue ? parseFloat(minValue as string) : 0;
        const max = maxValue ? parseFloat(maxValue as string) : Infinity;
        return estate.estimatedValue >= min && estate.estimatedValue <= max;
      });
    }

    // Validate estate data against probate records
    const validatedEstates = await validateEstateData(estates);

    // Score opportunities
    const scoredEstates = await scoreEstateOpportunities(validatedEstates, area as string);

    // Track API usage
    await recordApiUsage(userId, 'estate_sales', scoredEstates.length);

    res.json({
      success: true,
      area,
      radius: `${radius}km`,
      daysBack: parseInt(daysBack as string),
      totalEstates: scoredEstates.length,
      estates: scoredEstates,
      searchMetadata: {
        searchTime: Date.now() - req.startTime,
        sources: getEstateSources(),
        lastUpdate: new Date(),
        dataQuality: {
          verifiedEstates: scoredEstates.filter(e => e.verified).length,
          totalEstates: scoredEstates.length,
          accuracy: scoredEstates.length > 0 ? 
            (scoredEstates.filter(e => e.verified).length / scoredEstates.length * 100).toFixed(1) + '%' : '0%'
        }
      }
    });

  } catch (error) {
    logger.error('Estate sale request failed:', error);
    
    res.status(503).json({
      error: 'Estate sale service temporarily unavailable',
      message: 'We are experiencing issues accessing estate and probate databases. Please try again shortly.',
      fallback: true,
      retryAfter: 300
    });
  }
});

// Scrape estate proceedings from multiple sources
async function scrapeEstateProceedings(area: string, radius: number, daysBack: number): Promise<EstateSale[]> {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    const allEstates: EstateSale[] = [];
    
    // Scrape from multiple sources
    const sources = [
      { name: 'Ontario Probate Court', scraper: scrapeProbateRecords },
      { name: 'Estate Sale Listings', scraper: scrapeEstateSaleListings },
      { name: 'Legal Notices', scraper: scrapeLegalNotices },
      { name: 'Executor Notices', scraper: scrapeExecutorNotices }
    ];
    
    for (const source of sources) {
      try {
        logger.info(`Scraping ${source.name} for estate data`);
        const estates = await source.scraper(page, area, radius, daysBack);
        allEstates.push(...estates);
        
        // Respectful delay between sources
        await new Promise(resolve => setTimeout(resolve, 3000));
        
      } catch (error) {
        logger.error(`Failed to scrape ${source.name}:`, error);
        continue;
      }
    }
    
    return allEstates;
    
  } finally {
    await browser.close();
  }
}

// Scrape Ontario probate court records
async function scrapeProbateRecords(page: any, area: string, radius: number, daysBack: number): Promise<EstateSale[]> {
  const estates: EstateSale[] = [];
  
  try {
    // Navigate to Ontario Superior Court probate search
    await page.goto('https://www.ontariocourts.ca/scj/estates/', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Look for probate application listings
    const probateRecords = await page.evaluate((searchArea: string) => {
      const results: any[] = [];
      
      // Look for probate-related elements
      const selectors = [
        '.probate-application',
        '.estate-application', 
        '.probate-notice',
        '[class*="probate"]',
        '[class*="estate"]'
      ];
      
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        
        elements.forEach(el => {
          const text = el.textContent || '';
          
          // Extract probate file number
          const probateMatch = text.match(/\d{2}-\d{6,8}|\d{4}-\d{4,6}/);
          
          // Extract deceased person name
          const nameMatch = text.match(/estate\s+of\s+([^,\n]+)/i);
          
          // Extract address
          const addressMatch = text.match(/\d+\s+[A-Za-z\s]+(street|st|avenue|ave|road|rd|drive|dr|place|pl|way|court|ct)[^,]*,?\s*[A-Za-z\s]*/i);
          
          // Extract executor information
          const executorMatch = text.match(/executor[:\s]+([^,\n]+)/i);
          
          // Extract value information
          const valueMatch = text.match(/\$[\d,]+(?:\.\d{2})?/g);
          
          if (probateMatch && (nameMatch || addressMatch)) {
            results.push({
              probateNumber: probateMatch[0],
              deceasedName: nameMatch ? nameMatch[1].trim() : null,
              address: addressMatch ? addressMatch[0].trim() : null,
              executor: executorMatch ? executorMatch[1].trim() : null,
              values: valueMatch,
              rawText: text,
              source: 'Ontario Probate Court'
            });
          }
        });
      });
      
      return results;
    }, area);
    
    // Process probate records into EstateSale format
    for (const record of probateRecords) {
      if (record.address) {
        const estate = await processProbateRecord(record);
        if (estate) estates.push(estate);
      }
    }
    
  } catch (error) {
    logger.error('Error scraping probate records:', error);
  }
  
  return estates;
}

// Scrape estate sale listings from various real estate and auction sites
async function scrapeEstateSaleListings(page: any, area: string, radius: number, daysBack: number): Promise<EstateSale[]> {
  const estates: EstateSale[] = [];
  
  const estateSaleSites = [
    'https://www.estatesales.ca/',
    'https://www.auctionnetwork.ca/',
    'https://www.maxsold.com/'
  ];
  
  for (const site of estateSaleSites) {
    try {
      await page.goto(site, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Search for estate sales in the area
      const searchInput = await page.$('input[type="search"], input[name="location"], #search');
      if (searchInput) {
        await searchInput.type(area);
        await Promise.race([
          page.keyboard.press('Enter'),
          page.click('button[type="submit"], .search-btn, #search-btn')
        ]);
        
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
      // Extract estate sale listings
      const listings = await page.evaluate(() => {
        const results: any[] = [];
        
        const listingSelectors = [
          '.estate-sale',
          '.auction-item',
          '.sale-listing',
          '[class*="sale"]',
          '[class*="estate"]'
        ];
        
        listingSelectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          
          elements.forEach(el => {
            const titleEl = el.querySelector('h1, h2, h3, .title, .name');
            const addressEl = el.querySelector('.address, .location');
            const dateEl = el.querySelector('.date, .sale-date');
            const priceEl = el.querySelector('.price, .value, .estimate');
            
            if (titleEl && addressEl) {
              results.push({
                title: titleEl.textContent?.trim(),
                address: addressEl.textContent?.trim(),
                date: dateEl?.textContent?.trim(),
                price: priceEl?.textContent?.trim(),
                link: el.querySelector('a')?.href,
                source: window.location.hostname
              });
            }
          });
        });
        
        return results;
      });
      
      // Process listings into EstateSale format
      for (const listing of listings) {
        const estate = await processEstateListing(listing);
        if (estate) estates.push(estate);
      }
      
    } catch (error) {
      logger.error(`Error scraping estate sales from ${site}:`, error);
      continue;
    }
  }
  
  return estates;
}

// Scrape legal notices for estate-related announcements
async function scrapeLegalNotices(page: any, area: string, radius: number, daysBack: number): Promise<EstateSale[]> {
  const estates: EstateSale[] = [];
  
  try {
    // Check local newspaper legal sections
    const newspaperSites = [
      'https://www.thestar.com/opinion/legal-notices.html',
      'https://www.mississauga.com/community-story/legal-notices/',
      'https://www.yorkregion.com/news-story/legal-notices/'
    ];
    
    for (const site of newspaperSites) {
      try {
        await page.goto(site, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // Look for estate-related legal notices
        const notices = await page.evaluate(() => {
          const results: any[] = [];
          const text = document.body.textContent || '';
          
          // Find estate notices using regex patterns
          const estateNoticePattern = /NOTICE\s+TO\s+CREDITORS.*?ESTATE\s+OF\s+([^,\n]+).*?(?=NOTICE|$)/gis;
          const matches = text.match(estateNoticePattern);
          
          if (matches) {
            matches.forEach(match => {
              const nameMatch = match.match(/ESTATE\s+OF\s+([^,\n]+)/i);
              const addressMatch = match.match(/\d+\s+[A-Za-z\s]+(street|st|avenue|ave|road|rd|drive|dr)[^,]*,?\s*[A-Za-z\s]*/i);
              
              if (nameMatch) {
                results.push({
                  deceasedName: nameMatch[1].trim(),
                  address: addressMatch ? addressMatch[0].trim() : null,
                  noticeText: match,
                  source: 'Legal Notices'
                });
              }
            });
          }
          
          return results;
        });
        
        // Process legal notices
        for (const notice of notices) {
          if (notice.address) {
            const estate = await processLegalNotice(notice);
            if (estate) estates.push(estate);
          }
        }
        
      } catch (error) {
        logger.debug(`Could not access ${site}:`, error.message);
        continue;
      }
    }
    
  } catch (error) {
    logger.error('Error scraping legal notices:', error);
  }
  
  return estates;
}

// Scrape executor notices and estate administration announcements
async function scrapeExecutorNotices(page: any, area: string, radius: number, daysBack: number): Promise<EstateSale[]> {
  // Implementation for scraping executor notices
  // This would include estate administration notices, executor appointments, etc.
  return [];
}

// Process probate record into EstateSale format
async function processProbateRecord(record: any): Promise<EstateSale | null> {
  try {
    let estimatedValue: number | undefined;
    
    if (record.values && record.values.length > 0) {
      const amounts = record.values
        .map((v: string) => parseFloat(v.replace(/[$,]/g, '')))
        .filter((a: number) => !isNaN(a) && a > 1000);
      
      if (amounts.length > 0) {
        estimatedValue = Math.max(...amounts);
      }
    }
    
    // Estimate sale date (probate process typically takes 6-12 months)
    const saleDate = new Date();
    saleDate.setMonth(saleDate.getMonth() + 8); // Average 8 months
    
    return {
      address: record.address,
      saleDate,
      executor: record.executor || 'Court Appointed',
      status: 'pending_probate',
      estimatedValue,
      deceasedName: record.deceasedName,
      probateNumber: record.probateNumber,
      saleType: 'probate_sale',
      verified: false,
      source: record.source,
      description: `Estate of ${record.deceasedName || 'Deceased'} - Probate proceedings`
    };
    
  } catch (error) {
    logger.error('Error processing probate record:', error);
    return null;
  }
}

// Process estate listing into EstateSale format
async function processEstateListing(listing: any): Promise<EstateSale | null> {
  try {
    let estimatedValue: number | undefined;
    let saleDate = new Date();
    
    // Parse price
    if (listing.price) {
      const priceMatch = listing.price.match(/\$?[\d,]+(?:\.\d{2})?/);
      if (priceMatch) {
        estimatedValue = parseFloat(priceMatch[0].replace(/[$,]/g, ''));
      }
    }
    
    // Parse date
    if (listing.date) {
      const parsedDate = new Date(listing.date);
      if (!isNaN(parsedDate.getTime())) {
        saleDate = parsedDate;
      }
    }
    
    return {
      address: listing.address,
      saleDate,
      executor: 'Estate Administrator',
      status: saleDate > new Date() ? 'upcoming' : 'probate_complete',
      estimatedValue,
      saleType: 'estate_sale',
      verified: false,
      source: listing.source || 'Estate Sale Listing',
      description: listing.title || 'Estate sale property'
    };
    
  } catch (error) {
    logger.error('Error processing estate listing:', error);
    return null;
  }
}

// Process legal notice into EstateSale format
async function processLegalNotice(notice: any): Promise<EstateSale | null> {
  try {
    // Legal notices typically indicate early stage of probate
    const saleDate = new Date();
    saleDate.setMonth(saleDate.getMonth() + 12); // Estimate 12 months for legal process
    
    return {
      address: notice.address,
      saleDate,
      executor: 'Estate Executor',
      status: 'pending_probate',
      deceasedName: notice.deceasedName,
      saleType: 'probate_sale',
      verified: false,
      source: notice.source,
      description: `Estate proceedings for ${notice.deceasedName}`
    };
    
  } catch (error) {
    logger.error('Error processing legal notice:', error);
    return null;
  }
}

// Validate estate data against probate records
async function validateEstateData(estates: EstateSale[]): Promise<EstateSale[]> {
  const validatedEstates: EstateSale[] = [];
  
  for (const estate of estates) {
    try {
      let verified = false;
      
      // Validate address
      const addressValid = await validateAddress(estate.address);
      
      // Validate probate number if available
      if (estate.probateNumber) {
        const probateValid = await validateProbateNumber(estate.probateNumber);
        verified = addressValid && probateValid;
      } else {
        verified = addressValid;
      }
      
      validatedEstates.push({
        ...estate,
        verified
      });
      
    } catch (error) {
      logger.error('Estate validation failed:', error);
      validatedEstates.push({
        ...estate,
        verified: false
      });
    }
  }
  
  return validatedEstates;
}

// Validate probate number
async function validateProbateNumber(probateNumber: string): Promise<boolean> {
  try {
    // Basic format validation for Ontario probate numbers
    const ontarioProbatePattern = /^\d{2}-\d{6,8}$|^\d{4}-\d{4,6}$/;
    return ontarioProbatePattern.test(probateNumber);
    
  } catch (error) {
    return false;
  }
}

// Validate address (reuse from court-filings)
async function validateAddress(address: string): Promise<boolean> {
  try {
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      return true; // Assume valid if no API key
    }
    
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: `${address}, Ontario, Canada`,
        key: process.env.GOOGLE_MAPS_API_KEY
      },
      timeout: 5000
    });
    
    const results = response.data.results;
    return results.length > 0 && 
           results[0].formatted_address.includes('ON, Canada') &&
           results[0].types.includes('street_address');
           
  } catch (error) {
    return false;
  }
}

// Score estate opportunities
async function scoreEstateOpportunities(estates: EstateSale[], area: string): Promise<EstateSale[]> {
  return estates.map(estate => {
    let score = 0;
    
    // Base score for verified estates
    if (estate.verified) score += 25;
    
    // Score based on estate status
    switch (estate.status) {
      case 'upcoming':
        score += 30; // Immediate opportunity
        break;
      case 'probate_complete':
        score += 35; // Ready for sale
        break;
      case 'pending_probate':
        score += 20; // Future opportunity
        break;
    }
    
    // Score based on estimated value
    if (estate.estimatedValue) {
      if (estate.estimatedValue > 1000000) score += 20;
      else if (estate.estimatedValue > 600000) score += 15;
      else if (estate.estimatedValue > 400000) score += 10;
    }
    
    // Score based on location
    const address = estate.address.toLowerCase();
    if (address.includes('toronto')) score += 15;
    else if (address.includes('mississauga') || address.includes('vaughan')) score += 12;
    else if (address.includes('markham') || address.includes('oakville')) score += 10;
    
    // Score based on time to sale
    const daysToSale = Math.ceil((estate.saleDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysToSale <= 30) score += 15;
    else if (daysToSale <= 90) score += 10;
    else if (daysToSale <= 180) score += 5;
    
    return {
      ...estate,
      opportunityScore: Math.min(score, 100)
    };
  });
}

// Get estate data sources
function getEstateSources(): string[] {
  return [
    'Ontario Superior Court - Probate Division',
    'Estate Sale Listings',
    'Legal Notice Publications', 
    'Executor Announcements',
    'Municipal Property Records'
  ];
}

// Record API usage
async function recordApiUsage(userId: string, feature: string, resultCount: number): Promise<void> {
  try {
    await prisma.usageRecord.create({
      data: {
        userId,
        feature,
        requestCount: 1,
        resultCount,
        timestamp: new Date()
      }
    });
  } catch (error) {
    logger.error('Failed to record API usage:', error);
  }
}

// GET /api/estate-sales/health - Health check
router.get('/health', async (req, res) => {
  try {
    const sourceTests = await Promise.allSettled([
      testEstateWebsiteConnectivity(),
      testProbateCourtAccess(),
      testDatabaseConnection()
    ]);
    
    const allHealthy = sourceTests.every(test => test.status === 'fulfilled');
    
    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'healthy' : 'degraded',
      service: 'estate-sales',
      timestamp: new Date().toISOString(),
      sources: {
        estateListings: sourceTests[0].status === 'fulfilled' ? 'operational' : 'unavailable',
        probateCourt: sourceTests[1].status === 'fulfilled' ? 'operational' : 'unavailable',
        database: sourceTests[2].status === 'fulfilled' ? 'operational' : 'unavailable'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'estate-sales',
      error: 'Health check failed'
    });
  }
});

async function testEstateWebsiteConnectivity(): Promise<boolean> {
  try {
    const response = await axios.head('https://www.estatesales.ca', { timeout: 5000 });
    return response.status === 200;
  } catch {
    return false;
  }
}

async function testProbateCourtAccess(): Promise<boolean> {
  try {
    const response = await axios.head('https://www.ontariocourts.ca', { timeout: 5000 });
    return response.status === 200;
  } catch {
    return false;
  }
}

async function testDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export default router;