// Named Entity Recognition (NER) Processor
// Extracts addresses, parties, statutes, and municipalities from court cases

import { PrismaClient } from '../generated/prisma';
import { ProcessingStatus, ProcessingType } from '../generated/prisma';
import { logger } from '../utils/logger';

interface NERResult {
  addresses: string[];
  municipalities: string[];
  parties: string[];
  statutes: string[];
}

export class NERProcessor {
  private prisma: PrismaClient;

  // Ontario municipalities patterns
  private ontarioMunicipalities = [
    'Toronto', 'Ottawa', 'Mississauga', 'Brampton', 'Hamilton', 'London',
    'Markham', 'Vaughan', 'Kitchener', 'Windsor', 'Richmond Hill', 'Oakville',
    'Burlington', 'Sudbury', 'Oshawa', 'Barrie', 'St. Catharines', 'Cambridge',
    'Kingston', 'Whitby', 'Guelph', 'Thunder Bay', 'Waterloo', 'Brantford',
    'Pickering', 'Niagara Falls', 'Peterborough', 'Kawartha Lakes', 'Ajax',
    'Milton', 'Carleton Place', 'North Bay', 'Welland', 'Belleville', 'Sarnia',
    'Sault Ste. Marie', 'Norfolk County', 'Chatham-Kent', 'Georgina'
  ];

  // Real estate related statutes
  private realEstateStatutes = [
    'Construction Act', 'Construction Lien Act', 'Planning Act', 'Condominium Act',
    'Ontario New Home Warranties Plan Act', 'Real Estate and Business Brokers Act',
    'Bankruptcy and Insolvency Act', 'BIA', 'Courts of Justice Act',
    'Mortgages Act', 'Registry Act', 'Land Titles Act', 'Building Code Act',
    'Ontario Building Code', 'Environmental Protection Act', 'Clean Water Act',
    'Ontario Water Resources Act', 'Aggregates Resources Act'
  ];

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Process pending NER extraction jobs
   */
  public async processPendingJobs(): Promise<void> {
    try {
      const pendingJobs = await this.prisma.caseProcessingQueue.findMany({
        where: {
          processType: ProcessingType.NER_EXTRACTION,
          status: ProcessingStatus.PENDING
        },
        include: {
          case: true
        },
        orderBy: [
          { priority: 'desc' },
          { scheduledAt: 'asc' }
        ],
        take: 10 // Process up to 10 jobs at a time
      });

      logger.info(`Processing ${pendingJobs.length} NER extraction jobs`);

      for (const job of pendingJobs) {
        await this.processNERJob(job);
      }

    } catch (error) {
      logger.error('Error processing NER jobs:', error);
    }
  }

  /**
   * Process a single NER extraction job
   */
  private async processNERJob(job: any): Promise<void> {
    try {
      // Mark job as in progress
      await this.prisma.caseProcessingQueue.update({
        where: { id: job.id },
        data: {
          status: ProcessingStatus.IN_PROGRESS,
          startedAt: new Date(),
          attempts: job.attempts + 1
        }
      });

      logger.debug(`Processing NER extraction for case ${job.case.id}`);

      // Extract entities from case text
      const nerResult = await this.extractEntities(job.case);

      // Update court case with extracted data
      await this.prisma.courtCase.update({
        where: { id: job.case.id },
        data: {
          addresses: nerResult.addresses,
          municipalities: nerResult.municipalities,
          parties: nerResult.parties,
          statutes: nerResult.statutes,
          nerProcessed: true
        }
      });

      // Mark job as completed
      await this.prisma.caseProcessingQueue.update({
        where: { id: job.id },
        data: {
          status: ProcessingStatus.COMPLETED,
          completedAt: new Date()
        }
      });

      logger.info(`Completed NER extraction for case ${job.case.id}`);

    } catch (error) {
      logger.error(`Failed NER extraction for job ${job.id}:`, error);

      // Handle failure
      const shouldRetry = job.attempts < job.maxAttempts;
      
      await this.prisma.caseProcessingQueue.update({
        where: { id: job.id },
        data: {
          status: shouldRetry ? ProcessingStatus.PENDING : ProcessingStatus.FAILED,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      if (!shouldRetry) {
        logger.error(`Max attempts reached for NER job ${job.id}`);
      }
    }
  }

  /**
   * Extract entities from court case text
   */
  private async extractEntities(courtCase: any): Promise<NERResult> {
    const text = `${courtCase.title} ${courtCase.summary || ''} ${courtCase.fullText || ''}`;
    
    const result: NERResult = {
      addresses: [],
      municipalities: [],
      parties: [],
      statutes: []
    };

    // Extract addresses using regex patterns
    result.addresses = this.extractAddresses(text);
    
    // Extract Ontario municipalities
    result.municipalities = this.extractMunicipalities(text);
    
    // Extract party names (plaintiff/defendant patterns)
    result.parties = this.extractParties(text, courtCase.title);
    
    // Extract statute references
    result.statutes = this.extractStatutes(text);

    logger.debug(`Extracted entities for case ${courtCase.id}:`, {
      addresses: result.addresses.length,
      municipalities: result.municipalities.length,
      parties: result.parties.length,
      statutes: result.statutes.length
    });

    return result;
  }

  /**
   * Extract addresses from text using regex patterns
   */
  private extractAddresses(text: string): string[] {
    const addresses: Set<string> = new Set();
    
    // Canadian address patterns
    const patterns = [
      // Street address with postal code
      /\\b\\d+\\s+[A-Za-z\\s]+\\s+(Street|St\\.?|Avenue|Ave\\.?|Road|Rd\\.?|Drive|Dr\\.?|Boulevard|Blvd\\.?)\\s*,?\\s*[A-Za-z\\s]*,?\\s*ON\\s+[A-Z]\\d[A-Z]\\s*\\d[A-Z]\\d\\b/gi,
      
      // Street address without postal code but with ON
      /\\b\\d+\\s+[A-Za-z\\s]+\\s+(Street|St\\.?|Avenue|Ave\\.?|Road|Rd\\.?|Drive|Dr\\.?|Boulevard|Blvd\\.?)\\s*,?\\s*[A-Za-z\\s]*,?\\s*Ontario\\b/gi,
      
      // Property descriptions with lot and plan
      /\\bLot\\s+\\d+\\s*,?\\s*Plan\\s+\\w+\\s*,?\\s*[A-Za-z\\s]*,?\\s*Ontario\\b/gi,
      
      // Concession and lot descriptions
      /\\b(East|West|North|South)\\s+(Half|Part)\\s+of\\s+Lot\\s+\\d+\\s*,?\\s*Concession\\s+\\w+\\s*,?\\s*[A-Za-z\\s]*\\b/gi
    ];

    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleaned = match.trim().replace(/\\s+/g, ' ');
          if (cleaned.length > 10) { // Filter out very short matches
            addresses.add(cleaned);
          }
        });
      }
    });

    return Array.from(addresses);
  }

  /**
   * Extract Ontario municipalities from text
   */
  private extractMunicipalities(text: string): string[] {
    const municipalities: Set<string> = new Set();
    
    this.ontarioMunicipalities.forEach(municipality => {
      const regex = new RegExp(`\\\\b${municipality}\\\\b`, 'gi');
      if (regex.test(text)) {
        municipalities.add(municipality);
      }
    });

    return Array.from(municipalities);
  }

  /**
   * Extract party names from case title and text
   */
  private extractParties(text: string, title: string): string[] {
    const parties: Set<string> = new Set();
    
    // Extract from case title (typically "A v. B" or "A and B v. C")
    const titlePatterns = [
      // Standard "A v. B" pattern
      /^(.+?)\\s+v\\.\\s+(.+?)$/gi,
      
      // "A and B v. C" pattern  
      /^(.+?)\\s+and\\s+(.+?)\\s+v\\.\\s+(.+?)$/gi,
      
      // "Re: A" pattern
      /^Re:\\s*(.+?)$/gi
    ];

    titlePatterns.forEach(pattern => {
      const matches = pattern.exec(title);
      if (matches) {
        for (let i = 1; i < matches.length; i++) {
          const party = matches[i].trim();
          if (party && party.length > 2) {
            // Clean up party names
            const cleanedParty = party
              .replace(/\\bet\\s+al\\.?/gi, '') // Remove "et al"
              .replace(/\\(.*?\\)/g, '') // Remove parenthetical content
              .trim();
            
            if (cleanedParty.length > 2) {
              parties.add(cleanedParty);
            }
          }
        }
      }
    });

    return Array.from(parties);
  }

  /**
   * Extract statute references from text
   */
  private extractStatutes(text: string): string[] {
    const statutes: Set<string> = new Set();
    
    this.realEstateStatutes.forEach(statute => {
      const regex = new RegExp(`\\\\b${statute.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\\\b`, 'gi');
      if (regex.test(text)) {
        statutes.add(statute);
      }
    });

    // Also look for section references (e.g., "s. 15 of the Construction Act")
    const sectionPattern = /\\bs\\.?\\s*\\d+\\s+of\\s+the\\s+([A-Za-z\\s]+Act)/gi;
    let match;
    while ((match = sectionPattern.exec(text)) !== null) {
      const actName = match[1].trim();
      if (this.realEstateStatutes.some(statute => statute.toLowerCase() === actName.toLowerCase())) {
        statutes.add(`${match[0]} (${actName})`);
      }
    }

    return Array.from(statutes);
  }

  /**
   * Get NER processing statistics
   */
  public async getNERStats(): Promise<any> {
    const [totalCases, nerProcessed, nerPending, nerFailed] = await Promise.all([
      this.prisma.courtCase.count(),
      this.prisma.courtCase.count({ where: { nerProcessed: true } }),
      this.prisma.caseProcessingQueue.count({
        where: {
          processType: ProcessingType.NER_EXTRACTION,
          status: ProcessingStatus.PENDING
        }
      }),
      this.prisma.caseProcessingQueue.count({
        where: {
          processType: ProcessingType.NER_EXTRACTION,
          status: ProcessingStatus.FAILED
        }
      })
    ]);

    return {
      totalCases,
      nerProcessed,
      nerPending,
      nerFailed,
      nerProcessingRate: nerProcessed / Math.max(totalCases, 1)
    };
  }
}

export default NERProcessor;