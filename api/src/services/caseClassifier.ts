// Real Estate Case Classification Service
// Classifies court cases into real estate categories and risk levels

import { PrismaClient } from '../generated/prisma';
import { ProcessingStatus, ProcessingType, RealEstateCaseType, RiskLevel } from '../generated/prisma';
import { logger } from '../utils/logger';

interface ClassificationResult {
  caseTypes: RealEstateCaseType[];
  riskLevel: RiskLevel;
  confidence: number;
  reasoning: string[];
}

interface ClassificationRule {
  caseType: RealEstateCaseType;
  keywords: string[];
  patterns: RegExp[];
  weight: number;
  riskLevel: RiskLevel;
}

export class CaseClassifier {
  private prisma: PrismaClient;
  private classificationRules: ClassificationRule[];

  constructor() {
    this.prisma = new PrismaClient();
    this.initializeClassificationRules();
  }

  /**
   * Initialize classification rules for real estate cases
   */
  private initializeClassificationRules(): void {
    this.classificationRules = [
      // Power of Sale / Foreclosure
      {
        caseType: RealEstateCaseType.POWER_OF_SALE,
        keywords: ['power of sale', 'foreclosure', 'mortgage default', 'notice of sale', 'final order for sale'],
        patterns: [
          /power\\s+of\\s+sale/gi,
          /foreclosure\\s+proceedings?/gi,
          /mortgage\\s+default/gi,
          /notice\\s+of\\s+sale/gi
        ],
        weight: 10,
        riskLevel: RiskLevel.HIGH
      },
      {
        caseType: RealEstateCaseType.FORECLOSURE,
        keywords: ['foreclosure', 'mortgage action', 'default judgment', 'judicial sale'],
        patterns: [
          /foreclosure\\s+action/gi,
          /mortgage\\s+action/gi,
          /judicial\\s+sale/gi,
          /default\\s+judgment/gi
        ],
        weight: 10,
        riskLevel: RiskLevel.HIGH
      },

      // Construction Liens
      {
        caseType: RealEstateCaseType.CONSTRUCTION_LIEN,
        keywords: ['construction lien', 'builders lien', 'mechanics lien', 'construction act'],
        patterns: [
          /construction\\s+(lien|act)/gi,
          /builders?\\s+lien/gi,
          /mechanics?\\s+lien/gi,
          /holdback/gi
        ],
        weight: 9,
        riskLevel: RiskLevel.MEDIUM
      },
      {
        caseType: RealEstateCaseType.LIEN,
        keywords: ['lien', 'charge', 'encumbrance', 'security interest'],
        patterns: [
          /\\blien\\b/gi,
          /\\bcharge\\b/gi,
          /security\\s+interest/gi,
          /encumbrance/gi
        ],
        weight: 7,
        riskLevel: RiskLevel.MEDIUM
      },

      // Condominium
      {
        caseType: RealEstateCaseType.CONDO,
        keywords: ['condominium', 'condo', 'common elements', 'condo corporation', 'maintenance fees'],
        patterns: [
          /condominium/gi,
          /\\bcondo\\b/gi,
          /common\\s+elements/gi,
          /maintenance\\s+fees?/gi,
          /condo\\s+corp/gi
        ],
        weight: 8,
        riskLevel: RiskLevel.LOW
      },

      // Receivership
      {
        caseType: RealEstateCaseType.RECEIVERSHIP,
        keywords: ['receiver', 'receivership', 'court appointed receiver', 'interim receiver'],
        patterns: [
          /receiver(ship)?/gi,
          /court\\s+appointed\\s+receiver/gi,
          /interim\\s+receiver/gi
        ],
        weight: 9,
        riskLevel: RiskLevel.HIGH
      },

      // Planning and Development
      {
        caseType: RealEstateCaseType.PLANNING,
        keywords: ['planning act', 'zoning', 'subdivision', 'site plan', 'development'],
        patterns: [
          /planning\\s+act/gi,
          /zoning\\s+(by-?law|appeal)/gi,
          /subdivision/gi,
          /site\\s+plan/gi,
          /development\\s+(application|permit)/gi
        ],
        weight: 6,
        riskLevel: RiskLevel.LOW
      },
      {
        caseType: RealEstateCaseType.OLT_APPEAL,
        keywords: ['ontario land tribunal', 'olt', 'land tribunal', 'planning appeal'],
        patterns: [
          /ontario\\s+land\\s+tribunal/gi,
          /\\bolt\\b/gi,
          /land\\s+tribunal/gi,
          /planning\\s+appeal/gi
        ],
        weight: 8,
        riskLevel: RiskLevel.MEDIUM
      },

      // Environmental
      {
        caseType: RealEstateCaseType.ENVIRONMENTAL,
        keywords: ['environmental', 'contamination', 'remediation', 'environmental protection act'],
        patterns: [
          /environmental\\s+(protection\\s+act|assessment|contamination)/gi,
          /soil\\s+contamination/gi,
          /remediation/gi,
          /hazardous\\s+waste/gi
        ],
        weight: 7,
        riskLevel: RiskLevel.HIGH
      },

      // BIA Proceedings
      {
        caseType: RealEstateCaseType.BIA_PROCEEDING,
        keywords: ['bankruptcy', 'insolvency', 'bia', 'assignment in bankruptcy', 'proposal'],
        patterns: [
          /bankruptcy\\s+and\\s+insolvency\\s+act/gi,
          /\\bbia\\b/gi,
          /assignment\\s+in\\s+bankruptcy/gi,
          /consumer\\s+proposal/gi,
          /\\bbankruptcy\\b/gi
        ],
        weight: 9,
        riskLevel: RiskLevel.HIGH
      },

      // Labour/Employment Convictions
      {
        caseType: RealEstateCaseType.LABOUR_CONVICTION,
        keywords: ['employment standards', 'labour relations', 'workplace safety', 'occupational health'],
        patterns: [
          /employment\\s+standards\\s+act/gi,
          /labour\\s+relations\\s+act/gi,
          /workplace\\s+safety/gi,
          /occupational\\s+health/gi,
          /ministry\\s+of\\s+labour/gi
        ],
        weight: 5,
        riskLevel: RiskLevel.MEDIUM
      },

      // Planning Act
      {
        caseType: RealEstateCaseType.PLANNING_ACT,
        keywords: ['planning act', 'part lot control', 'consent', 'severance'],
        patterns: [
          /planning\\s+act/gi,
          /part\\s+lot\\s+control/gi,
          /consent\\s+(application|to\\s+sever)/gi,
          /severance/gi
        ],
        weight: 6,
        riskLevel: RiskLevel.LOW
      }
    ];
  }

  /**
   * Process pending classification jobs
   */
  public async processPendingJobs(): Promise<void> {
    try {
      const pendingJobs = await this.prisma.caseProcessingQueue.findMany({
        where: {
          processType: ProcessingType.CASE_CLASSIFICATION,
          status: ProcessingStatus.PENDING
        },
        include: {
          case: true
        },
        orderBy: [
          { priority: 'desc' },
          { scheduledAt: 'asc' }
        ],
        take: 15 // Process up to 15 jobs at a time
      });

      logger.info(`Processing ${pendingJobs.length} case classification jobs`);

      for (const job of pendingJobs) {
        await this.processClassificationJob(job);
      }

    } catch (error) {
      logger.error('Error processing classification jobs:', error);
    }
  }

  /**
   * Process a single classification job
   */
  private async processClassificationJob(job: any): Promise<void> {
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

      logger.debug(`Processing classification for case ${job.case.id}`);

      // Classify the case
      const classification = await this.classifyCase(job.case);

      // Update court case with classification
      await this.prisma.courtCase.update({
        where: { id: job.case.id },
        data: {
          caseTypes: classification.caseTypes,
          riskLevel: classification.riskLevel,
          classified: true,
          metadata: {
            ...job.case.metadata,
            classification: {
              confidence: classification.confidence,
              reasoning: classification.reasoning,
              classifiedAt: new Date()
            }
          }
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

      logger.info(`Completed classification for case ${job.case.id}: ${classification.caseTypes.join(', ')} (${classification.riskLevel})`);

      // Queue for alert generation if high risk or relevant case types
      if (this.shouldGenerateAlert(classification)) {
        await this.queueAlertGeneration(job.case.id);
      }

    } catch (error) {
      logger.error(`Failed classification for job ${job.id}:`, error);

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
        logger.error(`Max attempts reached for classification job ${job.id}`);
      }
    }
  }

  /**
   * Classify a court case into real estate categories
   */
  private async classifyCase(courtCase: any): Promise<ClassificationResult> {
    const text = `${courtCase.title} ${courtCase.summary || ''} ${courtCase.fullText || ''}`.toLowerCase();
    
    const scores: Map<RealEstateCaseType, number> = new Map();
    const reasoning: string[] = [];
    let totalScore = 0;

    // Apply classification rules
    for (const rule of this.classificationRules) {
      let ruleScore = 0;

      // Check keywords
      for (const keyword of rule.keywords) {
        if (text.includes(keyword.toLowerCase())) {
          ruleScore += rule.weight * 0.5;
          reasoning.push(`Found keyword: "${keyword}"`);
        }
      }

      // Check regex patterns
      for (const pattern of rule.patterns) {
        if (pattern.test(text)) {
          ruleScore += rule.weight * 0.8;
          reasoning.push(`Matched pattern for ${rule.caseType}`);
        }
      }

      if (ruleScore > 0) {
        scores.set(rule.caseType, (scores.get(rule.caseType) || 0) + ruleScore);
        totalScore += ruleScore;
      }
    }

    // Determine case types (those with significant scores)
    const threshold = Math.max(3, totalScore * 0.15); // Minimum threshold or 15% of total
    const caseTypes: RealEstateCaseType[] = [];
    let maxRiskLevel = RiskLevel.LOW;

    for (const [caseType, score] of scores.entries()) {
      if (score >= threshold) {
        caseTypes.push(caseType);
        
        // Update risk level based on highest risk case type
        const rule = this.classificationRules.find(r => r.caseType === caseType);
        if (rule && this.compareRiskLevels(rule.riskLevel, maxRiskLevel) > 0) {
          maxRiskLevel = rule.riskLevel;
        }
      }
    }

    // Calculate confidence based on score distribution
    const confidence = Math.min(1, totalScore / 20); // Scale to 0-1

    return {
      caseTypes,
      riskLevel: maxRiskLevel,
      confidence,
      reasoning
    };
  }

  /**
   * Compare risk levels (returns > 0 if level1 > level2)
   */
  private compareRiskLevels(level1: RiskLevel, level2: RiskLevel): number {
    const levels = [RiskLevel.LOW, RiskLevel.MEDIUM, RiskLevel.HIGH, RiskLevel.CRITICAL];
    return levels.indexOf(level1) - levels.indexOf(level2);
  }

  /**
   * Determine if case should generate an alert
   */
  private shouldGenerateAlert(classification: ClassificationResult): boolean {
    // Generate alerts for high-risk cases or specific case types
    const alertableCaseTypes = [
      RealEstateCaseType.POWER_OF_SALE,
      RealEstateCaseType.FORECLOSURE,
      RealEstateCaseType.RECEIVERSHIP,
      RealEstateCaseType.BIA_PROCEEDING,
      RealEstateCaseType.ENVIRONMENTAL
    ];

    return (
      classification.riskLevel === RiskLevel.HIGH ||
      classification.riskLevel === RiskLevel.CRITICAL ||
      classification.caseTypes.some(type => alertableCaseTypes.includes(type))
    );
  }

  /**
   * Queue case for alert generation
   */
  private async queueAlertGeneration(caseId: string): Promise<void> {
    try {
      await this.prisma.caseProcessingQueue.create({
        data: {
          caseId,
          processType: ProcessingType.ALERT_GENERATION,
          status: ProcessingStatus.PENDING,
          priority: 8 // High priority for alerts
        }
      });

      logger.debug(`Queued case ${caseId} for alert generation`);
    } catch (error) {
      logger.error(`Failed to queue case ${caseId} for alert generation:`, error);
    }
  }

  /**
   * Get classification statistics
   */
  public async getClassificationStats(): Promise<any> {
    const [totalCases, classified, classificationPending, classificationFailed] = await Promise.all([
      this.prisma.courtCase.count(),
      this.prisma.courtCase.count({ where: { classified: true } }),
      this.prisma.caseProcessingQueue.count({
        where: {
          processType: ProcessingType.CASE_CLASSIFICATION,
          status: ProcessingStatus.PENDING
        }
      }),
      this.prisma.caseProcessingQueue.count({
        where: {
          processType: ProcessingType.CASE_CLASSIFICATION,
          status: ProcessingStatus.FAILED
        }
      })
    ]);

    // Get case type distribution
    const caseTypeStats = await this.prisma.courtCase.groupBy({
      by: ['caseTypes'],
      where: { classified: true },
      _count: true
    });

    // Get risk level distribution  
    const riskLevelStats = await this.prisma.courtCase.groupBy({
      by: ['riskLevel'],
      where: { classified: true },
      _count: true
    });

    return {
      totalCases,
      classified,
      classificationPending,
      classificationFailed,
      classificationRate: classified / Math.max(totalCases, 1),
      caseTypeDistribution: caseTypeStats,
      riskLevelDistribution: riskLevelStats
    };
  }
}

export default CaseClassifier;