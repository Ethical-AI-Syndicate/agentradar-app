// Court Processing API Routes
// Provides access to court bulletin processing data and statistics

import { Router, Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';
import CourtProcessingOrchestrator from '../services/courtProcessingOrchestrator';

const router = Router();
const prisma = new PrismaClient();
const orchestrator = new CourtProcessingOrchestrator();

/**
 * GET /api/court-processing/stats
 * Get comprehensive court processing statistics
 */
router.get('/stats', authenticateToken, async (req: Request, res: Response) => {
  try {
    const stats = await orchestrator.getProcessingStats();
    
    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Error fetching court processing stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch processing statistics'
    });
  }
});

/**
 * GET /api/court-processing/cases
 * Get processed court cases with filtering
 */
router.get('/cases', authenticateToken, async (req: Request, res: Response) => {
  try {
    const {
      region,
      dateRange = 'week',
      processed = 'true',
      court,
      riskLevel,
      caseType,
      limit = 50,
      offset = 0
    } = req.query;

    // Build where clause based on filters
    const where: any = {};

    if (processed === 'true') {
      where.isProcessed = true;
    }

    if (court) {
      where.court = court;
    }

    if (riskLevel) {
      where.riskLevel = riskLevel;
    }

    if (caseType && caseType !== 'all') {
      where.caseTypes = {
        has: caseType
      };
    }

    // Date range filtering
    if (dateRange) {
      const now = new Date();
      let startDate: Date;

      switch (dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      where.publishDate = {
        gte: startDate
      };
    }

    // Region filtering (based on municipalities)
    if (region && region !== 'all') {
      const regionMunicipalities = getRegionMunicipalities(region as string);
      if (regionMunicipalities.length > 0) {
        where.municipalities = {
          hasSome: regionMunicipalities
        };
      }
    }

    // Fetch cases with pagination
    const cases = await prisma.courtCase.findMany({
      where,
      orderBy: [
        { publishDate: 'desc' },
        { riskLevel: 'desc' }
      ],
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    });

    // Get total count for pagination
    const totalCount = await prisma.courtCase.count({ where });

    res.json({
      success: true,
      data: {
        cases,
        pagination: {
          total: totalCount,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore: totalCount > parseInt(offset as string) + parseInt(limit as string)
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching court cases:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch court cases'
    });
  }
});

/**
 * GET /api/court-processing/case/:id
 * Get detailed information about a specific court case
 */
router.get('/case/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const courtCase = await prisma.courtCase.findUnique({
      where: { id },
      include: {
        alerts: true // Include any alerts generated from this case
      }
    });

    if (!courtCase) {
      return res.status(404).json({
        success: false,
        error: 'Court case not found'
      });
    }

    res.json({
      success: true,
      data: courtCase
    });

  } catch (error) {
    logger.error('Error fetching court case:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch court case'
    });
  }
});

/**
 * POST /api/court-processing/force-process
 * Force processing of pending cases (admin only)
 */
router.post('/force-process', authenticateToken, async (req: Request, res: Response) => {
  try {
    // TODO: Add admin role check
    // if (!req.user.isAdmin) {
    //   return res.status(403).json({ success: false, error: 'Admin access required' });
    // }

    // Start processing pipeline
    orchestrator.runProcessingPipeline();

    res.json({
      success: true,
      message: 'Processing pipeline started'
    });

  } catch (error) {
    logger.error('Error starting forced processing:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start processing pipeline'
    });
  }
});

/**
 * GET /api/court-processing/queue-status
 * Get processing queue status
 */
router.get('/queue-status', authenticateToken, async (req: Request, res: Response) => {
  try {
    const queueStats = await prisma.caseProcessingQueue.groupBy({
      by: ['processType', 'status'],
      _count: {
        id: true
      }
    });

    // Transform into more readable format
    const queueStatus: any = {};
    
    for (const stat of queueStats) {
      if (!queueStatus[stat.processType]) {
        queueStatus[stat.processType] = {};
      }
      queueStatus[stat.processType][stat.status] = stat._count.id;
    }

    // Get oldest pending items
    const oldestPending = await prisma.caseProcessingQueue.findMany({
      where: {
        status: 'PENDING'
      },
      orderBy: {
        scheduledAt: 'asc'
      },
      take: 5,
      include: {
        case: {
          select: {
            title: true,
            court: true,
            publishDate: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: {
        queueStatus,
        oldestPending
      }
    });

  } catch (error) {
    logger.error('Error fetching queue status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch queue status'
    });
  }
});

/**
 * Helper function to map regions to municipalities
 */
function getRegionMunicipalities(region: string): string[] {
  const regionMapping: Record<string, string[]> = {
    'gta': ['Toronto', 'Mississauga', 'Brampton', 'Markham', 'Vaughan', 'Richmond Hill', 'Oakville', 'Burlington'],
    'toronto': ['Toronto'],
    'york': ['Markham', 'Vaughan', 'Richmond Hill', 'Aurora', 'Newmarket'],
    'peel': ['Mississauga', 'Brampton', 'Caledon'],
    'durham': ['Oshawa', 'Whitby', 'Ajax', 'Pickering', 'Clarington'],
    'halton': ['Oakville', 'Burlington', 'Milton', 'Halton Hills']
  };

  return regionMapping[region.toLowerCase()] || [];
}

export default router;