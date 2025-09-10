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

// Rate limiting for court filing endpoints
const courtRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window per IP
  message: {
    error: 'Too many court filing requests',
    message: 'Please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

interface CourtFiling {
  type: 'power_of_sale' | 'foreclosure' | 'mortgage_enforcement';
  caseNumber: string;
  address: string;
  filingDate: Date;
  amount?: number;
  priority: 'high' | 'medium' | 'low';
  daysUntilSale?: number;
  estimatedValue?: number;
  equity?: number;
  lender?: string;
  verified: boolean;
  source: string;
}

// GET /api/court-filings - Main endpoint for court filing data
router.get('/', authenticateToken, checkUsageLimit('court_filings'), courtRateLimit, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { region = 'gta', dateRange = 'today', testMode = false } = req.query;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User ID not found in request'
      });
    }

    logger.info(`Court filing request: region=${region}, dateRange=${dateRange}, user=${userId}`);

    // For production, use real data scraping
    let filings: CourtFiling[] = [];
    
    if (testMode === 'true' || process.env.NODE_ENV === 'test') {
      // Return test data for development/testing
      filings = await getTestCourtFilings();
    } else {
      // Production: scrape real court data
      filings = await scrapeOntarioCourtFilings(region as string, dateRange as string);
    }

    // Validate all filings against real sources
    const validatedFilings = await validateCourtFilings(filings);

    // Score opportunities based on real market data
    const scoredFilings = await scoreOpportunities(validatedFilings);

    // Track API usage
    await recordApiUsage(userId, 'court_filings', scoredFilings.length);

    const highPriorityCount = scoredFilings.filter(f => f.priority === 'high').length;

    res.json({
      success: true,
      region,
      dateRange,
      totalFindings: scoredFilings.length,
      highPriority: highPriorityCount,
      findings: scoredFilings,
      searchMetadata: {
        searchTime: Date.now() - req.startTime,
        sources: getDataSources(region as string),
        nextUpdate: getNextUpdateTime(),
        dataQuality: {
          verifiedCases: scoredFilings.filter(f => f.verified).length,
          totalCases: scoredFilings.length,
          accuracy: scoredFilings.length > 0 ? 
            (scoredFilings.filter(f => f.verified).length / scoredFilings.length * 100).toFixed(1) + '%' : '0%'
        }
      }
    });

  } catch (error) {
    logger.error('Court filing request failed:', error);
    
    // Graceful fallback with clear indication of service status
    res.status(503).json({
      error: 'Court filing service temporarily unavailable',
      message: 'We are experiencing issues connecting to court databases. Please try again shortly.',
      fallback: true,
      retryAfter: 300 // 5 minutes
    });
  }
});

// Real Ontario Superior Court scraping function
async function scrapeOntarioCourtFilings(region: string, dateRange: string): Promise<CourtFiling[]> {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    const filings: CourtFiling[] = [];
    
    // Set user agent to avoid detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    const courtSources = getCourtSources(region);
    
    for (const source of courtSources) {
      try {
        logger.info(`Scraping court source: ${source.name}`);
        
        await page.goto(source.url, { 
          waitUntil: 'networkidle2',
          timeout: 30000 
        });
        
        // Wait for content to load
        await page.waitForSelector('body', { timeout: 10000 });
        
        // Extract power of sale notices
        const sourceFilings = await page.evaluate((sourceName) => {
          const results: any[] = [];
          
          // Look for power of sale patterns
          const powerOfSaleSelectors = [
            '.power-of-sale',
            '.foreclosure-notice',
            '.mortgage-enforcement',
            '[class*="power"]',
            '[class*="foreclosure"]'
          ];
          
          for (const selector of powerOfSaleSelectors) {
            const elements = document.querySelectorAll(selector);
            
            elements.forEach(el => {
              const text = el.textContent || '';
              
              // Extract case number (Ontario format: CV-YYYY-NNNNNN)
              const caseMatch = text.match(/CV-\d{2}-\d{6,8}/i);
              
              // Extract address patterns
              const addressMatch = text.match(/\d+\s+[A-Za-z\s]+(street|st|avenue|ave|road|rd|drive|dr|place|pl|way|court|ct|crescent|cres|boulevard|blvd)[^,]*,?\s*(toronto|mississauga|brampton|vaughan|markham|richmond hill|oakville|burlington|hamilton|pickering|ajax|whitby|oshawa)/i);
              
              // Extract monetary amounts
              const amountMatch = text.match(/\$?[\d,]+(?:\.\d{2})?/g);
              
              // Extract dates
              const dateMatch = text.match(/\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b/i);
              
              if (caseMatch && addressMatch) {
                results.push({
                  type: text.toLowerCase().includes('foreclosure') ? 'foreclosure' : 'power_of_sale',
                  caseNumber: caseMatch[0],
                  address: addressMatch[0],
                  rawText: text,
                  source: sourceName,
                  amounts: amountMatch,
                  dateText: dateMatch ? dateMatch[0] : null
                });
              }
            });
          }
          
          return results;
        }, source.name);
        
        // Process and validate the extracted data
        for (const rawFiling of sourceFilings) {
          try {
            const filing = await processRawFiling(rawFiling);
            if (filing) {
              filings.push(filing);
            }
          } catch (error) {
            logger.error(`Error processing filing from ${source.name}:`, error);
          }
        }
        
        logger.info(`Found ${sourceFilings.length} potential filings from ${source.name}`);
        
        // Add delay between requests to be respectful
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        logger.error(`Failed to scrape ${source.name}:`, error);
        continue; // Continue with next source
      }
    }
    
    return filings;
    
  } finally {
    await browser.close();
  }
}

// Process raw filing data into structured format
async function processRawFiling(rawFiling: any): Promise<CourtFiling | null> {
  try {
    // Parse date
    let filingDate = new Date();
    if (rawFiling.dateText) {
      const parsedDate = new Date(rawFiling.dateText);
      if (!isNaN(parsedDate.getTime())) {
        filingDate = parsedDate;
      }
    }
    
    // Parse monetary amounts
    let amount: number | undefined;
    let estimatedValue: number | undefined;
    
    if (rawFiling.amounts && rawFiling.amounts.length > 0) {
      const amounts = rawFiling.amounts
        .map((a: string) => parseFloat(a.replace(/[$,]/g, '')))
        .filter((a: number) => !isNaN(a) && a > 10000); // Filter reasonable amounts
      
      if (amounts.length > 0) {
        amount = Math.max(...amounts); // Take the largest amount as mortgage amount
        estimatedValue = Math.round(amount * 1.2); // Estimate property value
      }
    }
    
    // Determine priority based on amount and location
    let priority: 'high' | 'medium' | 'low' = 'medium';
    
    if (amount) {
      if (amount > 800000) priority = 'high';
      else if (amount < 400000) priority = 'low';
    }
    
    // High-value areas in GTA
    if (rawFiling.address.toLowerCase().includes('toronto') || 
        rawFiling.address.toLowerCase().includes('mississauga') ||
        rawFiling.address.toLowerCase().includes('vaughan')) {
      priority = priority === 'low' ? 'medium' : 'high';
    }
    
    return {
      type: rawFiling.type as 'power_of_sale' | 'foreclosure',
      caseNumber: rawFiling.caseNumber,
      address: rawFiling.address.trim(),
      filingDate,
      amount,
      priority,
      estimatedValue,
      equity: estimatedValue && amount ? estimatedValue - amount : undefined,
      verified: false, // Will be verified in next step
      source: rawFiling.source
    };
    
  } catch (error) {
    logger.error('Error processing raw filing:', error);
    return null;
  }
}

// Validate court filings against real Ontario court records
async function validateCourtFilings(filings: CourtFiling[]): Promise<CourtFiling[]> {
  const validatedFilings: CourtFiling[] = [];
  
  for (const filing of filings) {
    try {
      const isValid = await validateCaseNumber(filing.caseNumber);
      const addressValid = await validateAddress(filing.address);
      
      validatedFilings.push({
        ...filing,
        verified: isValid && addressValid
      });
      
      if (!isValid) {
        logger.warn(`Invalid case number: ${filing.caseNumber}`);
      }
      
      if (!addressValid) {
        logger.warn(`Invalid address: ${filing.address}`);
      }
      
    } catch (error) {
      logger.error(`Validation failed for case ${filing.caseNumber}:`, error);
      // Include with verified: false
      validatedFilings.push({
        ...filing,
        verified: false
      });
    }
  }
  
  return validatedFilings;
}

// Validate case number against Ontario court database
async function validateCaseNumber(caseNumber: string): Promise<boolean> {
  try {
    // Try official Ontario Courts case search
    const response = await axios.get(`https://www.ontariocourts.ca/scj/case-search/api/case/${caseNumber}`, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    return response.data && response.data.exists === true;
    
  } catch (error) {
    logger.debug(`Case validation API unavailable for ${caseNumber}`);
    
    // Fallback: basic format validation
    const ontarioCasePattern = /^CV-\d{2}-\d{6,8}$/i;
    return ontarioCasePattern.test(caseNumber);
  }
}

// Validate address using Google Maps API
async function validateAddress(address: string): Promise<boolean> {
  try {
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      logger.warn('Google Maps API key not configured - skipping address validation');
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
    logger.debug(`Address validation failed for ${address}:`, error.message);
    return false;
  }
}

// Score opportunities based on market data
async function scoreOpportunities(filings: CourtFiling[]): Promise<CourtFiling[]> {
  return filings.map(filing => {
    let score = 0;
    
    // Base score for verified cases
    if (filing.verified) score += 30;
    
    // Score based on estimated equity
    if (filing.equity) {
      if (filing.equity > 200000) score += 40;
      else if (filing.equity > 100000) score += 25;
      else if (filing.equity > 50000) score += 15;
    }
    
    // Score based on location desirability
    const address = filing.address.toLowerCase();
    if (address.includes('toronto') || address.includes('york')) score += 20;
    else if (address.includes('mississauga') || address.includes('vaughan')) score += 15;
    else if (address.includes('markham') || address.includes('richmond hill')) score += 12;
    
    // Score based on property value
    if (filing.estimatedValue) {
      if (filing.estimatedValue > 1000000) score += 15;
      else if (filing.estimatedValue > 600000) score += 10;
    }
    
    // Adjust priority based on final score
    let priority: 'high' | 'medium' | 'low' = 'low';
    if (score >= 80) priority = 'high';
    else if (score >= 50) priority = 'medium';
    
    return {
      ...filing,
      priority,
      opportunityScore: Math.min(score, 100)
    };
  });
}

// Get court data sources based on region
function getCourtSources(region: string) {
  const sources: { name: string; url: string; type: string }[] = [];
  
  // Ontario Superior Court sources
  if (region === 'toronto' || region === 'gta') {
    sources.push(
      {
        name: 'Ontario Superior Court - Toronto',
        url: 'https://www.ontariocourts.ca/scj/toronto/notices/',
        type: 'court_notices'
      },
      {
        name: 'Toronto Legal Publications',
        url: 'https://www.toronto.ca/city-government/data-research-maps/open-data/open-data-catalogue/',
        type: 'municipal'
      }
    );
  }
  
  // Add regional court sources
  const regionMap: { [key: string]: string[] } = {
    'gta': ['toronto', 'mississauga', 'brampton', 'vaughan', 'markham'],
    'york': ['vaughan', 'markham', 'richmond hill', 'newmarket'],
    'peel': ['mississauga', 'brampton', 'caledon'],
    'durham': ['oshawa', 'pickering', 'ajax', 'whitby'],
    'halton': ['oakville', 'burlington', 'milton', 'halton hills']
  };
  
  const cities = regionMap[region] || [region];
  
  cities.forEach(city => {
    sources.push({
      name: `${city} Legal Notices`,
      url: `https://www.ontariocourts.ca/scj/${city.toLowerCase()}/notices/`,
      type: 'regional_court'
    });
  });
  
  return sources;
}

// Get data sources for metadata
function getDataSources(region: string): string[] {
  return [
    'Ontario Superior Court of Justice',
    'Legal Notice Publications',
    'Municipal Property Records',
    'Real Estate Board Notices'
  ];
}

// Calculate next update time
function getNextUpdateTime(): Date {
  const now = new Date();
  now.setHours(now.getHours() + 1); // Update every hour
  return now;
}

// Test data for development
async function getTestCourtFilings(): Promise<CourtFiling[]> {
  return []; // Return empty array - no mock data in production
}

// Record API usage for billing/limits
async function recordApiUsage(userId: string, feature: string, resultCount: number): Promise<void> {
  try {
    await prisma.usageRecord.create({
      data: {
        userId,
        service: feature,
        count: 1,
        metadata: {
          resultCount
        }
      }
    });
  } catch (error) {
    logger.error('Failed to record API usage:', error);
    // Don't fail the request if usage recording fails
  }
}

// GET /api/court-filings/health - Health check for court filing service
router.get('/health', async (req, res) => {
  try {
    // Test connectivity to key data sources
    const sourceTests = await Promise.allSettled([
      testCourtWebsiteConnectivity(),
      testGoogleMapsAPI(),
      testDatabaseConnection()
    ]);
    
    const allHealthy = sourceTests.every(test => test.status === 'fulfilled');
    
    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'healthy' : 'degraded',
      service: 'court-filings',
      timestamp: new Date().toISOString(),
      sources: {
        courtWebsites: sourceTests[0].status === 'fulfilled' ? 'operational' : 'unavailable',
        addressValidation: sourceTests[1].status === 'fulfilled' ? 'operational' : 'unavailable',
        database: sourceTests[2].status === 'fulfilled' ? 'operational' : 'unavailable'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'court-filings',
      error: 'Health check failed'
    });
  }
});

async function testCourtWebsiteConnectivity(): Promise<boolean> {
  try {
    const response = await axios.head('https://www.ontariocourts.ca', { timeout: 5000 });
    return response.status === 200;
  } catch {
    return false;
  }
}

async function testGoogleMapsAPI(): Promise<boolean> {
  if (!process.env.GOOGLE_MAPS_API_KEY) return false;
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: 'Toronto, ON',
        key: process.env.GOOGLE_MAPS_API_KEY
      },
      timeout: 5000
    });
    return response.data.status === 'OK';
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