// Court Processing Orchestrator
// Coordinates polling, NER, classification, and alert generation

import { PrismaClient } from '../generated/prisma';
import { logger } from '../utils/logger';
import CourtBulletinPoller from './courtBulletinPoller';
import NERProcessor from './nerProcessor';
import CaseClassifier from './caseClassifier';
import { ProcessingType, ProcessingStatus, AlertType, DataSource } from '../generated/prisma';

export class CourtProcessingOrchestrator {
  private prisma: PrismaClient;
  private bulletinPoller: CourtBulletinPoller;
  private nerProcessor: NERProcessor;
  private caseClassifier: CaseClassifier;
  
  private processingInterval: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor() {
    this.prisma = new PrismaClient();
    this.bulletinPoller = new CourtBulletinPoller();
    this.nerProcessor = new NERProcessor();
    this.caseClassifier = new CaseClassifier();
  }

  /**
   * Start the complete court processing system
   */
  public async start(): Promise<void> {
    logger.info('Starting Court Processing Orchestrator');

    // Start bulletin polling
    this.bulletinPoller.startPolling();

    // Start processing pipeline (runs every 5 minutes)
    this.processingInterval = setInterval(() => {
      this.runProcessingPipeline();
    }, 5 * 60 * 1000);

    // Run initial processing
    await this.runProcessingPipeline();

    logger.info('Court Processing Orchestrator started successfully');
  }

  /**
   * Stop the processing system
   */
  public async stop(): Promise<void> {
    logger.info('Stopping Court Processing Orchestrator');

    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    logger.info('Court Processing Orchestrator stopped');
  }

  /**
   * Run the complete processing pipeline
   */
  private async runProcessingPipeline(): Promise<void> {
    if (this.isProcessing) {
      logger.debug('Processing pipeline already running - skipping');
      return;
    }

    this.isProcessing = true;
    
    try {
      logger.info('Starting court processing pipeline');

      // Step 1: Process NER extraction jobs
      await this.nerProcessor.processPendingJobs();

      // Step 2: Process case classification jobs  
      await this.caseClassifier.processPendingJobs();

      // Step 3: Process alert generation jobs
      await this.processAlertGeneration();

      // Step 4: Cleanup old processing records
      await this.performCleanup();

      logger.info('Completed court processing pipeline');

    } catch (error) {
      logger.error('Error in processing pipeline:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process alert generation jobs
   */
  private async processAlertGeneration(): Promise<void> {
    try {
      const pendingAlertJobs = await this.prisma.caseProcessingQueue.findMany({
        where: {
          processType: ProcessingType.ALERT_GENERATION,
          status: ProcessingStatus.PENDING
        },
        include: {
          case: true
        },
        orderBy: [
          { priority: 'desc' },
          { scheduledAt: 'asc' }
        ],
        take: 20 // Process up to 20 alert jobs at a time
      });

      logger.info(`Processing ${pendingAlertJobs.length} alert generation jobs`);

      for (const job of pendingAlertJobs) {
        await this.processAlertGenerationJob(job);
      }

    } catch (error) {
      logger.error('Error processing alert generation jobs:', error);
    }
  }

  /**
   * Process a single alert generation job
   */
  private async processAlertGenerationJob(job: any): Promise<void> {
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

      logger.debug(`Processing alert generation for case ${job.case.id}`);

      // Generate alert from court case
      const alert = await this.generateAlertFromCase(job.case);

      if (alert) {
        logger.info(`Generated alert ${alert.id} from court case ${job.case.id}`);
      }

      // Mark job as completed
      await this.prisma.caseProcessingQueue.update({
        where: { id: job.id },
        data: {
          status: ProcessingStatus.COMPLETED,
          completedAt: new Date()
        }
      });

    } catch (error) {
      logger.error(`Failed alert generation for job ${job.id}:`, error);

      // Handle failure
      const shouldRetry = job.attempts < job.maxAttempts;
      
      await this.prisma.caseProcessingQueue.update({
        where: { id: job.id },
        data: {
          status: shouldRetry ? ProcessingStatus.PENDING : ProcessingStatus.FAILED,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }

  /**
   * Generate an alert from a classified court case
   */
  private async generateAlertFromCase(courtCase: any): Promise<any> {
    try {
      // Extract address information for the alert
      const primaryAddress = this.extractPrimaryAddress(courtCase);
      if (!primaryAddress) {
        logger.debug(`No suitable address found for case ${courtCase.id} - skipping alert generation`);
        return null;
      }

      // Determine alert type based on case classification
      const alertType = this.mapCaseTypeToAlertType(courtCase.caseTypes);
      if (!alertType) {
        logger.debug(`No suitable alert type for case ${courtCase.id} - skipping alert generation`);
        return null;
      }

      // Calculate opportunity score based on case type and risk level
      const opportunityScore = this.calculateOpportunityScore(courtCase);

      // Create the alert
      const alert = await this.prisma.alert.create({
        data: {
          title: this.generateAlertTitle(courtCase),
          description: this.generateAlertDescription(courtCase),
          address: primaryAddress.address,
          city: primaryAddress.city,
          province: 'ON',
          postalCode: primaryAddress.postalCode,
          alertType,
          source: DataSource.ONTARIO_COURT_BULLETINS,
          priority: this.mapRiskLevelToPriority(courtCase.riskLevel),
          opportunityScore,
          courtFileNumber: this.extractCourtFileNumber(courtCase),
          courtDate: courtCase.publishDate,
          courtCaseId: courtCase.id,
          propertyType: this.inferPropertyType(courtCase),
          discoveredAt: new Date()
        }
      });

      logger.info(`Created alert ${alert.id} for court case ${courtCase.id}`);
      return alert;

    } catch (error) {
      logger.error(`Failed to generate alert from case ${courtCase.id}:`, error);
      throw error;
    }
  }

  /**
   * Extract primary address from court case
   */
  private extractPrimaryAddress(courtCase: any): { address: string; city: string; postalCode?: string } | null {
    if (!courtCase.addresses || courtCase.addresses.length === 0) {
      return null;
    }

    // Use the first address and try to parse it
    const address = courtCase.addresses[0];
    
    // Try to extract city from municipalities
    const city = courtCase.municipalities && courtCase.municipalities.length > 0 
      ? courtCase.municipalities[0] 
      : 'Ontario';

    // Try to extract postal code from address
    const postalCodeMatch = address.match(/[A-Z]\\d[A-Z]\\s*\\d[A-Z]\\d/);
    const postalCode = postalCodeMatch ? postalCodeMatch[0] : undefined;

    return {
      address: address.replace(/[A-Z]\\d[A-Z]\\s*\\d[A-Z]\\d/, '').trim(), // Remove postal code from address
      city,
      postalCode
    };
  }

  /**
   * Map case types to alert types
   */
  private mapCaseTypeToAlertType(caseTypes: any[]): AlertType | null {
    if (!caseTypes || caseTypes.length === 0) {
      return null;
    }

    // Priority mapping - return the highest priority alert type found
    const typeMapping = {
      'POWER_OF_SALE': AlertType.POWER_OF_SALE,
      'FORECLOSURE': AlertType.POWER_OF_SALE,
      'BIA_PROCEEDING': AlertType.PROBATE_FILING,
      'RECEIVERSHIP': AlertType.PROBATE_FILING,
      'PLANNING': AlertType.DEVELOPMENT_APPLICATION,
      'OLT_APPEAL': AlertType.DEVELOPMENT_APPLICATION,
      'PLANNING_ACT': AlertType.DEVELOPMENT_APPLICATION
    };

    for (const caseType of caseTypes) {
      if (typeMapping[caseType as keyof typeof typeMapping]) {
        return typeMapping[caseType as keyof typeof typeMapping];
      }
    }

    return AlertType.POWER_OF_SALE; // Default fallback
  }

  /**
   * Generate alert title from court case
   */
  private generateAlertTitle(courtCase: any): string {
    const address = courtCase.addresses && courtCase.addresses.length > 0 
      ? courtCase.addresses[0].split(',')[0] // Take first part of address
      : 'Property';

    const caseTypeText = courtCase.caseTypes && courtCase.caseTypes.length > 0
      ? courtCase.caseTypes[0].replace(/_/g, ' ').toLowerCase().replace(/\\b\\w/g, l => l.toUpperCase())
      : 'Legal Proceeding';

    return `${caseTypeText} - ${address}`;
  }

  /**
   * Generate alert description from court case
   */
  private generateAlertDescription(courtCase: any): string {
    const parts = [];
    
    if (courtCase.summary) {
      parts.push(courtCase.summary);
    }
    
    if (courtCase.parties && courtCase.parties.length > 0) {
      parts.push(`Parties: ${courtCase.parties.slice(0, 2).join(', ')}`);
    }
    
    if (courtCase.statutes && courtCase.statutes.length > 0) {
      parts.push(`Related Statutes: ${courtCase.statutes.slice(0, 2).join(', ')}`);
    }
    
    parts.push(`Court: ${courtCase.court}`);
    parts.push(`Published: ${new Date(courtCase.publishDate).toLocaleDateString()}`);
    
    return parts.join(' | ');
  }

  /**
   * Calculate opportunity score based on case characteristics
   */
  private calculateOpportunityScore(courtCase: any): number {
    let score = 50; // Base score

    // Adjust based on risk level
    switch (courtCase.riskLevel) {
      case 'HIGH':
      case 'CRITICAL':
        score += 30;
        break;
      case 'MEDIUM':
        score += 15;
        break;
      default:
        break;
    }

    // Adjust based on case types
    const highOpportunityCases = ['POWER_OF_SALE', 'FORECLOSURE', 'RECEIVERSHIP', 'BIA_PROCEEDING'];
    if (courtCase.caseTypes && courtCase.caseTypes.some((type: string) => highOpportunityCases.includes(type))) {
      score += 20;
    }

    // Adjust based on municipalities (major cities = higher opportunity)
    const majorCities = ['Toronto', 'Ottawa', 'Mississauga', 'Brampton', 'Hamilton'];
    if (courtCase.municipalities && courtCase.municipalities.some((city: string) => majorCities.includes(city))) {
      score += 10;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Map risk level to priority
   */
  private mapRiskLevelToPriority(riskLevel: string): any {
    switch (riskLevel) {
      case 'CRITICAL':
        return 'URGENT';
      case 'HIGH':
        return 'HIGH';
      case 'MEDIUM':
        return 'MEDIUM';
      default:
        return 'LOW';
    }
  }

  /**
   * Extract court file number from case
   */
  private extractCourtFileNumber(courtCase: any): string | undefined {
    // Try to extract from title or summary
    const text = `${courtCase.title} ${courtCase.summary || ''}`;
    const fileNumberMatch = text.match(/\\b\\d{2,4}[-\\s]?\\d{4,6}\\b/);
    return fileNumberMatch ? fileNumberMatch[0] : undefined;
  }

  /**
   * Infer property type from case information
   */
  private inferPropertyType(courtCase: any): string | undefined {
    const text = `${courtCase.title} ${courtCase.summary || ''}`.toLowerCase();
    
    if (text.includes('condominium') || text.includes('condo')) {
      return 'Condominium';
    }
    if (text.includes('commercial') || text.includes('office') || text.includes('retail')) {
      return 'Commercial';
    }
    if (text.includes('residential') || text.includes('house') || text.includes('home')) {
      return 'Residential';
    }
    if (text.includes('land') || text.includes('vacant') || text.includes('lot')) {
      return 'Land';
    }
    
    return 'Mixed Use'; // Default fallback
  }

  /**
   * Perform cleanup of old records
   */
  private async performCleanup(): Promise<void> {
    try {
      // Clean up old processing queue items
      await this.bulletinPoller.cleanupProcessingQueue();

      logger.debug('Performed routine cleanup');
    } catch (error) {
      logger.error('Error during cleanup:', error);
    }
  }

  /**
   * Get comprehensive processing statistics
   */
  public async getProcessingStats(): Promise<any> {
    const [pollingStats, nerStats, classificationStats] = await Promise.all([
      this.bulletinPoller.getProcessingStats(),
      this.nerProcessor.getNERStats(),
      this.caseClassifier.getClassificationStats()
    ]);

    const alertsGenerated = await this.prisma.alert.count({
      where: {
        source: DataSource.ONTARIO_COURT_BULLETINS
      }
    });

    const queueStats = await this.prisma.caseProcessingQueue.groupBy({
      by: ['processType', 'status'],
      _count: true
    });

    return {
      polling: pollingStats,
      ner: nerStats,
      classification: classificationStats,
      alertsGenerated,
      queue: queueStats,
      systemStatus: {
        isProcessing: this.isProcessing,
        lastProcessingRun: new Date()
      }
    };
  }
}

export default CourtProcessingOrchestrator;