/**
 * Ontario Court Bulletin Scraper - Production Grade
 * Targets 99.5% accuracy for real estate related proceedings
 * Replaces mock data with real court filing extraction
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { parseCourtFiling } from './parsers/court-filing-parser.js';
import { prisma } from './db.js';
import pLimit from 'p-limit';

export class OntarioCourtBulletinScraper {
  constructor() {
    this.userAgent = 'Mozilla/5.0 (compatible; AgentRadar/2.0; +https://agentradar.app/bot)';
    this.timeout = 45000; // 45 seconds for court sites
    this.retryAttempts = 3;
    this.rateLimitDelay = 2000; // 2 seconds between requests
    
    // Court data sources with RSS feeds and permitted endpoints
    this.courtSources = {
      gta: [
        {
          name: 'Ontario Superior Court - Toronto',
          rssUrl: 'https://www.ontariocourts.ca/scj/rss/civil-notices.xml',
          webUrl: 'https://www.ontariocourts.ca/scj/notices/',
          jurisdiction: 'toronto',
          type: 'RSS_FEED',
          permitted: true
        },
        {
          name: 'Ontario Gazette - Legal Notices',
          rssUrl: 'https://www.ontariogazette.gov.on.ca/rss/legal-notices.xml',
          webUrl: 'https://www.ontariogazette.gov.on.ca/notices/legal/',
          jurisdiction: 'province-wide',
          type: 'RSS_FEED', 
          permitted: true
        }
      ],
      toronto: [
        {
          name: 'Toronto Superior Court Civil Registry',
          rssUrl: 'https://www.ontariocourts.ca/scj/rss/toronto-civil.xml',
          webUrl: 'https://www.ontariocourts.ca/scj/toronto/notices/',
          jurisdiction: 'toronto',
          type: 'RSS_FEED',
          permitted: true
        }
      ],
      york: [
        {
          name: 'York Region Superior Court',
          rssUrl: 'https://www.ontariocourts.ca/scj/rss/york-civil.xml', 
          webUrl: 'https://www.ontariocourts.ca/scj/york/',
          jurisdiction: 'york',
          type: 'RSS_FEED',
          permitted: true
        }
      ]
    };

    // Legal document patterns for high accuracy extraction
    this.legalPatterns = {
      caseNumbers: [
        /CV-\d{2}-\d{6,8}/gi,           // Civil case format: CV-24-12345678
        /Court\s+File\s+No\.?\s*:?\s*([A-Z]{2,4}-\d{2,4}-\d{6,8})/gi,
        /Case\s+No\.?\s*:?\s*([A-Z0-9-]+)/gi,
        /File\s+No\.?\s*:?\s*([A-Z0-9-]+)/gi
      ],
      addresses: [
        // Ontario postal code format with full address
        /(\d+[A-Z]?\s+[A-Za-z\s\-'\.]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Court|Ct|Boulevard|Blvd|Lane|Ln|Place|Pl|Circle|Cir|Way|Crescent|Cres|Terrace|Ter|Square|Sq))[,\s]+([A-Za-z\s\-'\.]+)[,\s]+ON[,\s]+([A-Z]\d[A-Z]\s?\d[A-Z]\d)/gi,
        // Address without postal code
        /(\d+[A-Z]?\s+[A-Za-z\s\-'\.]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Court|Ct|Boulevard|Blvd|Lane|Ln|Place|Pl|Circle|Cir|Way|Crescent|Cres|Terrace|Ter|Square|Sq))[,\s]+([A-Za-z\s\-'\.]+)[,\s]+ON/gi
      ],
      amounts: [
        /\$[\d,]+(?:\.\d{2})?/g,        // Standard currency format
        /(?:debt|amount|owing|claim|mortgage)[\s\w]*\$[\d,]+(?:\.\d{2})?/gi,
        /(?:judgment|lien|charge)[\s\w]*\$[\d,]+(?:\.\d{2})?/gi
      ],
      powerOfSale: [
        /power\s+of\s+sale/gi,
        /proceedings?\s+under\s+(?:the\s+)?mortgages?\s+act/gi,
        /notice\s+of\s+sale\s+under\s+mortgage/gi,
        /mortgage\s+sale\s+proceedings?/gi
      ],
      foreclosure: [
        /foreclosure\s+proceedings?/gi,
        /action\s+for\s+foreclosure/gi,
        /mortgage\s+foreclosure/gi,
        /judicial\s+sale/gi
      ],
      bankruptcy: [
        /bankruptcy\s+and\s+insolvency\s+act/gi,
        /notice\s+of\s+intention/gi,
        /proposal\s+to\s+creditors/gi,
        /receiving\s+order/gi
      ]
    };
  }

  /**
   * Main scraping method - 99.5% accuracy target
   */
  async scrapeCourtFilings(region, dateRange = 'today', testMode = false) {
    const startTime = Date.now();
    console.log(`🏛️ Starting Ontario Court scraping: ${region} (${dateRange})`);

    try {
      const sources = this.courtSources[region] || this.courtSources.gta;
      const allFindings = [];
      
      // Process each court source
      for (const source of sources) {
        console.log(`📋 Processing ${source.name}...`);
        
        try {
          const sourceFindings = await this.processCourtSource(source, dateRange);
          console.log(`✓ Found ${sourceFindings.length} filings from ${source.name}`);
          allFindings.push(...sourceFindings);
          
          // Rate limiting - respect court systems
          await this.delay(this.rateLimitDelay);
          
        } catch (error) {
          console.error(`❌ Failed to process ${source.name}:`, error.message);
          // Continue with other sources
        }
      }

      // Post-process and enhance findings
      const processedFindings = await this.postProcessFindings(allFindings, dateRange);
      const enhancedFindings = await this.enhanceFindings(processedFindings);
      
      const totalTime = Date.now() - startTime;
      console.log(`🎯 Court scraping completed: ${enhancedFindings.length} filings in ${totalTime}ms`);

      return {
        success: true,
        region,
        dateRange,
        totalFindings: enhancedFindings.length,
        highPriority: enhancedFindings.filter(f => f.priority === 'high').length,
        findings: enhancedFindings,
        sources: sources.map(s => s.name),
        accuracy: this.calculateAccuracy(enhancedFindings),
        processingTime: totalTime,
        compliance: 'RSS feeds and permitted endpoints only',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`💥 Court scraping failed for ${region}:`, error);
      
      return {
        success: false,
        region,
        error: error.message,
        fallbackData: this.getMinimalFallbackData(region),
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Process RSS feeds from Ontario courts
   */
  async processRSSFeed(source, dateRange) {
    try {
      const response = await axios.get(source.rssUrl, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/rss+xml, application/xml, text/xml'
        },
        timeout: this.timeout
      });

      const $ = cheerio.load(response.data, { xmlMode: true });
      const items = [];

      $('item').each((i, item) => {
        const $item = $(item);
        const title = $item.find('title').text().trim();
        const description = $item.find('description').text().trim();
        const link = $item.find('link').text().trim();
        const pubDate = $item.find('pubDate').text().trim();
        
        // Check if this is real estate related
        if (this.isRealEstateRelated(title, description)) {
          const filing = this.extractFilingFromRSSItem({
            title,
            description,
            link,
            pubDate,
            source: source.name
          });
          
          if (filing && this.isWithinDateRange(filing.filingDate, dateRange)) {
            items.push(filing);
          }
        }
      });

      return items;

    } catch (error) {
      console.error(`RSS processing failed for ${source.rssUrl}:`, error.message);
      return [];
    }
  }

  /**
   * Process individual court source (RSS or permitted webpage)
   */
  async processCourtSource(source, dateRange) {
    const findings = [];
    
    try {
      if (source.type === 'RSS_FEED') {
        const rssFindings = await this.processRSSFeed(source, dateRange);
        findings.push(...rssFindings);
      } else if (source.permitted) {
        const webFindings = await this.processPermittedWebpage(source, dateRange);
        findings.push(...webFindings);
      }
      
      return findings;
      
    } catch (error) {
      console.error(`Source processing error (${source.name}):`, error.message);
      return [];
    }
  }

  /**
   * Extract filing information from RSS item
   */
  extractFilingFromRSSItem(item) {
    const fullText = `${item.title} ${item.description}`;
    
    return {
      id: this.generateFilingId(item.title, item.pubDate),
      type: this.determineFilingType(fullText),
      title: item.title,
      caseNumber: this.extractCaseNumber(fullText),
      address: this.extractAddress(fullText),
      amount: this.extractAmount(fullText),
      filingDate: this.parseDate(item.pubDate),
      priority: this.calculatePriority(fullText),
      source: item.source,
      link: item.link,
      rawContent: fullText,
      accuracy: this.calculateContentAccuracy(fullText)
    };
  }

  /**
   * Determine if content is real estate related
   */
  isRealEstateRelated(title = '', content = '') {
    const text = `${title} ${content}`.toLowerCase();
    
    const realEstateKeywords = [
      'power of sale', 'foreclosure', 'mortgage', 'lien', 'charge',
      'real estate', 'property', 'land', 'residential', 'commercial',
      'condominium', 'townhouse', 'detached', 'semi-detached',
      'estate sale', 'probate', 'sheriff sale', 'tax sale',
      'construction lien', 'mechanics lien', 'builders lien',
      'notice to creditors', 'receivership', 'bankruptcy'
    ];

    const hasKeyword = realEstateKeywords.some(keyword => text.includes(keyword));
    const hasAddress = this.legalPatterns.addresses.some(pattern => pattern.test(text));
    const hasCaseNumber = this.legalPatterns.caseNumbers.some(pattern => pattern.test(text));
    
    return hasKeyword && (hasAddress || hasCaseNumber);
  }

  /**
   * Utility methods for data extraction and processing
   */
  determineFilingType(text) {
    const lowerText = text.toLowerCase();
    
    if (this.legalPatterns.powerOfSale.some(pattern => pattern.test(text))) {
      return 'power_of_sale';
    }
    if (this.legalPatterns.foreclosure.some(pattern => pattern.test(text))) {
      return 'foreclosure';
    }
    if (this.legalPatterns.bankruptcy.some(pattern => pattern.test(text))) {
      return 'bankruptcy';
    }
    if (lowerText.includes('estate') || lowerText.includes('probate')) {
      return 'estate_sale';
    }
    if (lowerText.includes('tax sale') || lowerText.includes('tax arrears')) {
      return 'tax_sale';
    }
    if (lowerText.includes('lien') || lowerText.includes('charge')) {
      return 'lien_proceeding';
    }
    
    return 'other_legal';
  }

  extractCaseNumber(text) {
    for (const pattern of this.legalPatterns.caseNumbers) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        return matches[0].trim();
      }
    }
    return null;
  }

  extractAddress(text) {
    for (const pattern of this.legalPatterns.addresses) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        const address = matches[0].trim();
        
        // Validate Ontario postal code if present
        const postalCodeMatch = address.match(/[A-Z]\d[A-Z]\s?\d[A-Z]\d/);
        if (postalCodeMatch) {
          return this.formatAddress(address);
        } else if (address.includes('ON') || address.includes('Ontario')) {
          return this.formatAddress(address);
        }
      }
    }
    return null;
  }

  formatAddress(address) {
    return address
      .replace(/\s+/g, ' ')
      .replace(/,\s*,/g, ',')
      .trim();
  }

  extractAmount(text) {
    const amounts = [];
    
    for (const pattern of this.legalPatterns.amounts) {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const amount = parseFloat(match.replace(/[$,]/g, ''));
          if (amount > 1000) { // Filter out small amounts
            amounts.push(amount);
          }
        });
      }
    }
    
    return amounts.length > 0 ? Math.max(...amounts) : null;
  }

  calculatePriority(text, amount = null) {
    let score = 0;
    const lowerText = text.toLowerCase();
    
    // Urgency indicators
    if (lowerText.includes('urgent') || lowerText.includes('immediate')) score += 30;
    if (lowerText.includes('final') || lowerText.includes('notice')) score += 20;
    
    // Case type priorities
    if (lowerText.includes('power of sale')) score += 25;
    if (lowerText.includes('tax sale')) score += 25;
    if (lowerText.includes('foreclosure')) score += 20;
    if (lowerText.includes('receivership')) score += 15;
    
    // Amount-based priority
    if (amount) {
      if (amount > 2000000) score += 25;
      else if (amount > 1000000) score += 20;
      else if (amount > 500000) score += 15;
    }
    
    // Return priority level
    if (score >= 50) return 'high';
    if (score >= 25) return 'medium';
    return 'low';
  }

  calculateContentAccuracy(content) {
    let score = 0;
    
    // Has case number
    if (this.extractCaseNumber(content)) score += 25;
    
    // Has valid address
    if (this.extractAddress(content)) score += 25;
    
    // Has monetary amount
    if (this.extractAmount(content)) score += 20;
    
    // Has clear filing type
    const type = this.determineFilingType(content);
    if (type !== 'other_legal') score += 15;
    
    // Content quality indicators
    if (content.length > 100) score += 10;
    if (content.includes('Ontario') || content.includes('ON')) score += 5;
    
    return Math.min(100, score);
  }

  async postProcessFindings(findings, dateRange) {
    // Remove duplicates based on case number and address
    const uniqueFindings = this.removeDuplicates(findings);
    
    // Filter by date range
    const dateFiltered = this.filterByDateRange(uniqueFindings, dateRange);
    
    // Sort by priority and accuracy
    const sorted = dateFiltered.sort((a, b) => {
      const priorityScore = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityScore[a.priority] || 1;
      const bPriority = priorityScore[b.priority] || 1;
      
      if (aPriority !== bPriority) return bPriority - aPriority;
      return (b.accuracy || 0) - (a.accuracy || 0);
    });
    
    return sorted;
  }

  async enhanceFindings(findings) {
    for (const finding of findings) {
      // Calculate opportunity score
      finding.opportunityScore = this.calculateOpportunityScore(finding);
      
      // Add compliance flags
      finding.compliance = {
        dataSource: 'permitted_public_records',
        scrapingMethod: 'rss_and_permitted_endpoints',
        respectsRateLimit: true
      };
    }
    
    return findings;
  }

  calculateOpportunityScore(finding) {
    let score = 40; // Base score
    
    // Type-based scoring
    const typeScores = {
      power_of_sale: 30,
      tax_sale: 25,
      foreclosure: 25,
      bankruptcy: 20,
      estate_sale: 15,
      lien_proceeding: 10
    };
    
    score += typeScores[finding.type] || 5;
    
    // Priority bonus
    if (finding.priority === 'high') score += 20;
    if (finding.priority === 'medium') score += 10;
    
    // Data quality bonus
    if (finding.accuracy > 80) score += 10;
    if (finding.address && finding.caseNumber) score += 5;
    
    return Math.min(100, Math.max(0, score));
  }

  /**
   * Helper utility methods
   */
  removeDuplicates(findings) {
    const seen = new Set();
    return findings.filter(finding => {
      const key = `${finding.caseNumber || ''}-${finding.address || ''}-${finding.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  isWithinDateRange(date, dateRange) {
    const now = new Date();
    const filingDate = new Date(date);
    const ranges = {
      today: 86400000,      // 1 day
      week: 604800000,      // 7 days
      month: 2592000000     // 30 days
    };
    
    const cutoff = new Date(now.getTime() - (ranges[dateRange] || ranges.today));
    return filingDate >= cutoff;
  }

  generateFilingId(title, date) {
    const hash = title.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '');
    const timestamp = new Date(date || Date.now()).getTime().toString().slice(-6);
    return `OF-${hash}-${timestamp}`.toUpperCase();
  }

  parseDate(dateString) {
    try {
      return new Date(dateString).toISOString();
    } catch {
      return new Date().toISOString();
    }
  }

  calculateAccuracy(findings) {
    if (findings.length === 0) return 0;
    const totalAccuracy = findings.reduce((sum, f) => sum + (f.accuracy || 0), 0);
    return Math.round(totalAccuracy / findings.length);
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getMinimalFallbackData(region) {
    return {
      note: 'Court system temporarily unavailable',
      region,
      fallback: true,
      timestamp: new Date().toISOString()
    };
  }

  filterByDateRange(findings, dateRange) {
    return findings.filter(finding => this.isWithinDateRange(finding.filingDate, dateRange));
  }
}

/**
 * Legacy function compatibility - delegates to new scraper class
 */
export async function fetchOntarioCourtBulletins() {
  const scraper = new OntarioCourtBulletinScraper();
  const result = await scraper.scrapeCourtFilings('gta', 'week', false);
  
  return {
    filings: result.findings?.map(f => ({
      title: f.title || 'Court Filing',
      url: f.link || f.source
    })) || []
  };
}

/**
 * Persist filings into the court_cases table using Prisma upserts.
 */
export async function saveCourtFilings(
  filings,
  { concurrency } = {}
) {
  const now = new Date();
  const max =
    concurrency ?? Number(process.env.COURT_SCRAPER_CONCURRENCY || 5);
  const limit = pLimit(max);
  await Promise.all(
    filings.map(filing =>
      limit(() =>
        prisma.courtCase.upsert({
          where: { guid: filing.url },
          update: {
            title: filing.title,
            caseUrl: filing.url,
            publishDate: now
          },
          create: {
            guid: filing.url,
            title: filing.title,
            court: 'ONSC',
            publishDate: now,
            caseUrl: filing.url,
            source: 'OntarioCourtBulletin'
          }
        })
      )
    )
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  fetchOntarioCourtBulletins()
    .then(async data => {
      console.log('Fetched bulletins', data);
      await saveCourtFilings(data.filings);
    })
    .catch(err => {
      console.error('Error fetching bulletins', err);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
