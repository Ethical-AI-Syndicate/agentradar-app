import { Router } from 'express';
import { createLogger } from '../utils/logger';
import { PrismaClient, AlertType, Priority } from "@prisma/client"

const router = Router();
const logger = createLogger();
const prisma = new PrismaClient();

// GET /api/properties/saved
router.get('/saved', async (req, res, next) => {
  try {
    const {
      userId,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      tags
    } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter conditions
    const where: any = {
      userId: userId as string
    };

    // Filter by tags if provided
    if (tags) {
      const tagList = Array.isArray(tags) ? tags : [tags];
      where.tags = {
        hasSome: tagList as string[]
      };
    }

    // Get saved properties with pagination
    const [savedProperties, total] = await Promise.all([
      prisma.savedProperty.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          [sortBy as string]: sortOrder === 'desc' ? 'desc' : 'asc'
        }
      }),
      prisma.savedProperty.count({ where })
    ]);

    logger.info(`Retrieved ${savedProperties.length} saved properties for user ${userId}`);
    
    res.json({
      savedProperties,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    logger.error('Error fetching saved properties:', error);
    return next(error);
  }
});

// POST /api/properties/:alertId/save
router.post('/:alertId/save', async (req, res, next) => {
  try {
    const { alertId } = req.params;
    const { userId, notes, tags } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Check if alert exists
    const alert = await prisma.alert.findUnique({
      where: { id: alertId }
    });

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    // Check if property is already saved
    const existingSave = await prisma.savedProperty.findUnique({
      where: {
        userId_alertId: {
          userId: userId,
          alertId: alertId
        }
      }
    });

    if (existingSave) {
      return res.status(409).json({ 
        error: 'Property already saved',
        savedProperty: existingSave
      });
    }

    // Create saved property
    const savedProperty = await prisma.savedProperty.create({
      data: {
        userId: userId,
        alertId: alertId,
        notes: notes || null,
        tags: tags || []
      }
    });

    logger.info(`Property ${alertId} saved by user ${userId}`);
    
    res.status(201).json({
      success: true,
      message: 'Property saved successfully',
      savedProperty
    });
  } catch (error) {
    logger.error(`Error saving property ${req.params.alertId}:`, error);
    return next(error);
  }
});

// DELETE /api/properties/:alertId/save
router.delete('/:alertId/save', async (req, res, next) => {
  try {
    const { alertId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Delete the saved property
    try {
      await prisma.savedProperty.delete({
        where: {
          userId_alertId: {
            userId: userId,
            alertId: alertId
          }
        }
      });

      logger.info(`Property ${alertId} unsaved by user ${userId}`);
      
      res.json({
        success: true,
        message: 'Property unsaved successfully'
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Saved property not found' });
      }
      throw error;
    }
  } catch (error) {
    logger.error(`Error unsaving property ${req.params.alertId}:`, error);
    return next(error);
  }
});

// PUT /api/properties/saved/:id/notes
router.put('/saved/:id/notes', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId, notes } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Update the saved property notes (with ownership check)
    try {
      const updatedProperty = await prisma.savedProperty.update({
        where: {
          id: id,
          userId: userId  // Ensure user owns this saved property
        },
        data: {
          notes: notes
        }
      });

      logger.info(`Property notes updated for saved property ${id} by user ${userId}`);
      
      res.json({
        success: true,
        message: 'Property notes updated successfully',
        savedProperty: updatedProperty
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Saved property not found or access denied' });
      }
      throw error;
    }
  } catch (error) {
    logger.error(`Error updating property notes ${req.params.id}:`, error);
    return next(error);
  }
});

// PUT /api/properties/saved/:id/tags
router.put('/saved/:id/tags', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId, tags } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!Array.isArray(tags)) {
      return res.status(400).json({ error: 'Tags must be an array' });
    }

    // Validate tags (basic string validation)
    const validTags = tags.filter(tag => 
      typeof tag === 'string' && 
      tag.trim().length > 0 && 
      tag.trim().length <= 50
    ).map(tag => tag.trim());

    // Update the saved property tags (with ownership check)
    try {
      const updatedProperty = await prisma.savedProperty.update({
        where: {
          id: id,
          userId: userId  // Ensure user owns this saved property
        },
        data: {
          tags: validTags
        }
      });

      logger.info(`Property tags updated for saved property ${id} by user ${userId}`);
      
      res.json({
        success: true,
        message: 'Property tags updated successfully',
        savedProperty: updatedProperty,
        validatedTags: validTags
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Saved property not found or access denied' });
      }
      throw error;
    }
  } catch (error) {
    logger.error(`Error updating property tags ${req.params.id}:`, error);
    return next(error);
  }
});

// GET /api/properties/search
router.get('/search', async (req, res, next) => {
  try {
    const {
      q,
      city,
      minPrice,
      maxPrice,
      type,
      priority,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build search conditions
    const where: any = {};

    // Text search across title, address, and description
    if (q) {
      where.OR = [
        { title: { contains: q as string, mode: 'insensitive' } },
        { address: { contains: q as string, mode: 'insensitive' } },
        { description: { contains: q as string, mode: 'insensitive' } }
      ];
    }

    // City filter
    if (city) {
      where.city = { contains: city as string, mode: 'insensitive' };
    }

    // Price range filters (estimatedValue is in cents)
    if (minPrice || maxPrice) {
      where.estimatedValue = {};
      if (minPrice) where.estimatedValue.gte = parseFloat(minPrice as string) * 100; // Convert to cents
      if (maxPrice) where.estimatedValue.lte = parseFloat(maxPrice as string) * 100; // Convert to cents
    }

    // Property type filter
    if (type && Object.values(AlertType).includes(type as AlertType)) {
      where.alertType = type as AlertType;
    }

    // Priority filter
    if (priority && Object.values(Priority).includes(priority as Priority)) {
      where.priority = priority as Priority;
    }

    // Only show active alerts
    where.status = 'ACTIVE';

    // Search alerts with filters and pagination
    const [alerts, total] = await Promise.all([
      prisma.alert.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          [sortBy as string]: sortOrder === 'desc' ? 'desc' : 'asc'
        }
      }),
      prisma.alert.count({ where })
    ]);

    logger.info(`Property search completed: ${alerts.length} results found`);
    
    res.json({
      alerts,
      searchQuery: {
        q,
        city,
        minPrice,
        maxPrice,
        type,
        priority
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    logger.error('Error searching properties:', error);
    return next(error);
  }
});

export default router;