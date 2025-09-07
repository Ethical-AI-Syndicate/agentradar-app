// Court Bulletin Polling Service
// Complies with CanLII RSS feed terms - only uses RSS/decision feeds
// Does NOT scrape Daily Court Lists or Ministry tools

import { PrismaClient } from '../generated/prisma';
import { Parser } from 'rss-parser';
import { logger } from '../utils/logger';
import { CourtType, RealEstateCaseType, ProcessingType, ProcessingStatus } from '../generated/prisma';

interface CourtFeed {
  court: CourtType;
  url: string;
  enabled: boolean;
}

interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
  guid: string;
  description?: string;
  content?: string;
}

export class CourtBulletinPoller {
  private prisma: PrismaClient;
  private parser: Parser;
  private courtFeeds: CourtFeed[];
  private pollingInterval: number;

  constructor() {
    this.prisma = new PrismaClient();
    this.parser = new Parser({
      customFields: {
        item: ['guid', 'description', 'content']
      }
    });

    // Only use permitted RSS feeds - NO scraping of prohibited sites
    this.courtFeeds = [
      {
        court: CourtType.ONSC,
        url: process.env.COURT_BULLETIN_URL || 'https://www.canlii.org/en/on/onsc/rss_new.xml',
        enabled: true
      },
      {
        court: CourtType.ONCA,
        url: process.env.ONCA_FEED_URL || 'https://www.canlii.org/en/on/onca/rss_new.xml',
        enabled: true
      },
      {
        court: CourtType.ONCJ,
        url: process.env.ONCJ_FEED_URL || 'https://www.canlii.org/en/on/oncj/rss_new.xml',
        enabled: true
      },
      {
        court: CourtType.ONSCDC,
        url: process.env.ONSCDC_FEED_URL || 'https://www.canlii.org/en/on/onscdc/rss_new.xml',
        enabled: true
      },
      {
        court: CourtType.OLT,
        url: process.env.OLT_FEED_URL || 'https://www.canlii.org/en/on/onolt/rss_new.xml',
        enabled: true
      }
    ];

    // Poll every 30-60 minutes as specified
    this.pollingInterval = (parseInt(process.env.COURT_POLLING_INTERVAL || '45') * 60 * 1000);
  }

  /**
   * Start the court bulletin polling service
   */
  public startPolling(): void {
    logger.info('Starting Court Bulletin Polling Service');
    logger.info(`Polling interval: ${this.pollingInterval / (60 * 1000)} minutes`);

    // Initial poll
    this.pollAllFeeds();

    // Set up recurring polling
    setInterval(() => {
      this.pollAllFeeds();
    }, this.pollingInterval);
  }

  /**
   * Poll all enabled court feeds
   */
  private async pollAllFeeds(): Promise<void> {
    logger.info('Starting court feed polling cycle');

    for (const feed of this.courtFeeds) {
      if (feed.enabled) {
        try {
          await this.pollCourtFeed(feed);
        } catch (error) {
          logger.error(`Error polling ${feed.court} feed:`, error);
        }
      }
    }

    logger.info('Completed court feed polling cycle');
  }

  /**
   * Poll a specific court feed
   */
  private async pollCourtFeed(feed: CourtFeed): Promise<void> {
    try {
      logger.debug(`Polling ${feed.court} feed: ${feed.url}`);

      const rss = await this.parser.parseURL(feed.url);
      
      if (!rss.items || rss.items.length === 0) {
        logger.warn(`No items found in ${feed.court} feed`);
        return;
      }

      logger.info(`Retrieved ${rss.items.length} items from ${feed.court} feed`);

      // Process each RSS item
      for (const item of rss.items as RSSItem[]) {
        try {
          await this.processRSSItem(item, feed);
        } catch (error) {
          logger.error(`Error processing RSS item ${item.guid}:`, error);
        }
      }

    } catch (error) {
      logger.error(`Failed to poll ${feed.court} feed:`, error);
      throw error;
    }
  }

  /**
   * Process a single RSS item - de-duplicate by GUID
   */
  private async processRSSItem(item: RSSItem, feed: CourtFeed): Promise<void> {
    const guid = item.guid || item.link;
    
    if (!guid) {
      logger.warn('RSS item missing GUID and link - skipping');
      return;
    }

    // Check if case already exists (de-duplication)
    const existingCase = await this.prisma.courtCase.findUnique({
      where: { guid }
    });

    if (existingCase) {
      logger.debug(`Case ${guid} already exists - skipping`);
      return;
    }

    // Extract neutral citation from title if available
    const neutralCitation = this.extractNeutralCitation(item.title);
    
    // Create new court case record
    const courtCase = await this.prisma.courtCase.create({
      data: {
        guid,
        title: item.title,
        neutralCitation,
        court: feed.court,
        publishDate: new Date(item.pubDate),
        caseUrl: item.link,
        summary: item.description,
        source: feed.url,
        metadata: {
          originalRSSItem: item
        }
      }
    });

    logger.info(`Created new court case: ${courtCase.id} (${feed.court})`);

    // Queue for NER processing if enabled
    if (process.env.NER_PROCESSING_ENABLED === 'true') {
      await this.queueForProcessing(courtCase.id, ProcessingType.NER_EXTRACTION);
    }

    // Queue for case classification if enabled  
    if (process.env.CASE_CLASSIFICATION_ENABLED === 'true') {
      await this.queueForProcessing(courtCase.id, ProcessingType.CASE_CLASSIFICATION);
    }
  }

  /**
   * Extract neutral citation from case title
   */
  private extractNeutralCitation(title: string): string | null {
    // Pattern for neutral citations (e.g., 2024 ONSC 123)
    const citationPattern = /\\b\\d{4}\\s+(ONSC|ONCA|ONCJ|ONSCDC|OLT)\\s+\\d+\\b/i;
    const match = title.match(citationPattern);
    return match ? match[0] : null;
  }

  /**
   * Queue a court case for processing
   */
  private async queueForProcessing(caseId: string, processType: ProcessingType): Promise<void> {
    try {
      await this.prisma.caseProcessingQueue.create({
        data: {
          caseId,
          processType,
          status: ProcessingStatus.PENDING,
          priority: this.getProcessingPriority(processType)
        }
      });

      logger.debug(`Queued case ${caseId} for ${processType} processing`);
    } catch (error) {
      logger.error(`Failed to queue case ${caseId} for processing:`, error);
    }
  }

  /**
   * Get processing priority based on type
   */
  private getProcessingPriority(processType: ProcessingType): number {
    switch (processType) {
      case ProcessingType.NER_EXTRACTION:
        return 7; // High priority for data extraction
      case ProcessingType.CASE_CLASSIFICATION:
        return 6; // Medium-high priority for classification  
      case ProcessingType.RISK_ASSESSMENT:
        return 5; // Medium priority
      case ProcessingType.ALERT_GENERATION:
        return 8; // Highest priority for user alerts
      default:
        return 5; // Default medium priority
    }
  }

  /**
   * Get processing statistics
   */
  public async getProcessingStats(): Promise<any> {
    const [totalCases, processedCases, pendingNER, pendingClassification] = await Promise.all([
      this.prisma.courtCase.count(),
      this.prisma.courtCase.count({ where: { isProcessed: true } }),
      this.prisma.caseProcessingQueue.count({ 
        where: { 
          processType: ProcessingType.NER_EXTRACTION,
          status: ProcessingStatus.PENDING
        }
      }),
      this.prisma.caseProcessingQueue.count({
        where: {
          processType: ProcessingType.CASE_CLASSIFICATION, 
          status: ProcessingStatus.PENDING
        }
      })
    ]);

    return {
      totalCases,
      processedCases,
      pendingNER,
      pendingClassification,
      processingRate: processedCases / Math.max(totalCases, 1)
    };
  }

  /**
   * Cleanup old processed queue items
   */
  public async cleanupProcessingQueue(): Promise<void> {
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    
    const deleted = await this.prisma.caseProcessingQueue.deleteMany({
      where: {
        status: ProcessingStatus.COMPLETED,
        completedAt: {
          lt: cutoffDate
        }
      }
    });

    logger.info(`Cleaned up ${deleted.count} old processing queue items`);
  }
}

export default CourtBulletinPoller;