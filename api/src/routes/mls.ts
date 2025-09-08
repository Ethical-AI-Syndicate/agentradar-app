import { Router, Request, Response } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { RepiersMlsService } from '../services/integration/repliers-mls-service';
import { CacheManager } from '../services/cache/cacheManager';
import { createLogger } from '../utils/logger';

const router = Router();
const logger = createLogger();

// Initialize MLS service
const mlsService = new RepiersMlsService(
  {
    apiKey: process.env.REPLIERS_API_KEY || '',
    endpoint: process.env.REPLIERS_ENDPOINT || 'https://api.repliers.ca/v1',
    region: process.env.REPLIERS_REGION || 'GTA',
    rateLimitRPM: parseInt(process.env.REPLIERS_RATE_LIMIT || '100'),
    timeout: 30000
  },
  new CacheManager()
);

/**
 * GET /api/mls/search
 * Search properties across all MLS providers
 */
router.get('/search', authenticateToken, async (req: Request, res: Response) => {
  try {
    const {
      city,
      province,
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      propertyType,
      maxResults = 50,
      offset = 0,
      provider // Optional: search specific provider only
    } = req.query;

    const criteria = {
      city: city as string,
      province: province as string,
      minPrice: minPrice ? parseInt(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice as string) : undefined,
      bedrooms: bedrooms ? parseInt(bedrooms as string) : undefined,
      bathrooms: bathrooms ? parseFloat(bathrooms as string) : undefined,
      propertyType: propertyType as string,
      maxResults: parseInt(maxResults as string),
      offset: parseInt(offset as string)
    };

    let results;

    if (provider === 'repliers') {
      // Search only Repliers
      const listings = await mlsService.searchProperties(criteria);
      results = {
        listings,
        total: listings.length,
        provider: 'repliers'
      };
    } else if (provider && provider !== 'repliers') {
      // Search specific custom provider
      const allResults = await mlsService.searchAllProviders(criteria);
      const providerListings = allResults.custom[provider as string] || [];
      results = {
        listings: providerListings,
        total: providerListings.length,
        provider: provider
      };
    } else {
      // Search all providers
      results = await mlsService.searchAllProviders(criteria);
    }

    logger.info(`MLS search completed for user ${req.user?.id}: ${results.total || results.listings?.length} results`);

    res.json({
      success: true,
      data: results,
      criteria: criteria,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('MLS search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search MLS listings',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/mls/listing/:id
 * Get detailed property information
 */
router.get('/listing/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { provider } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Listing ID is required'
      });
    }

    let listing = null;

    if (!provider || provider === 'repliers') {
      // Try Repliers first
      listing = await mlsService.getPropertyDetails(id);
    }

    if (!listing && provider && provider !== 'repliers') {
      // Try custom provider if specified
      // This would need to be implemented in the service
      logger.info(`Custom provider search for listing ${id} not yet implemented`);
    }

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Property listing not found'
      });
    }

    res.json({
      success: true,
      data: listing
    });

  } catch (error) {
    logger.error(`Error fetching listing ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch property details',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/mls/market-stats
 * Get market statistics for a region
 */
router.get('/market-stats', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { region, period = '30d' } = req.query;

    const stats = await mlsService.getMarketStats(region as string, period as string);

    res.json({
      success: true,
      data: stats,
      region: region || 'default',
      period: period
    });

  } catch (error) {
    logger.error('Error fetching market stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch market statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/mls/providers
 * Get status of all MLS providers
 */
router.get('/providers', authenticateToken, async (req: Request, res: Response) => {
  try {
    const status = mlsService.getProvidersStatus();
    
    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    logger.error('Error fetching providers status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch providers status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/mls/providers/custom (Admin only)
 * Add a custom MLS provider (bring-your-own-MLS)
 */
router.post('/providers/custom', requireAdmin, async (req: Request, res: Response) => {
  try {
    const {
      providerId,
      name,
      endpoint,
      authentication,
      mapping,
      rateLimitRPM,
      timeout
    } = req.body;

    if (!providerId || !name || !endpoint || !authentication || !mapping) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: providerId, name, endpoint, authentication, mapping'
      });
    }

    const config = {
      name,
      endpoint,
      authentication,
      mapping,
      rateLimitRPM: rateLimitRPM || 60,
      timeout: timeout || 30000
    };

    await mlsService.addCustomMLSProvider(providerId, config);

    logger.info(`Admin ${req.user?.email} added custom MLS provider: ${providerId}`);

    res.status(201).json({
      success: true,
      message: `Custom MLS provider '${providerId}' added successfully`,
      providerId: providerId
    });

  } catch (error) {
    logger.error('Error adding custom MLS provider:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to add custom MLS provider',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/mls/providers/custom/:providerId (Admin only)
 * Remove a custom MLS provider
 */
router.delete('/providers/custom/:providerId', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { providerId } = req.params;

    if (!providerId) {
      return res.status(400).json({
        success: false,
        message: 'Provider ID is required'
      });
    }

    mlsService.removeCustomMLSProvider(providerId);

    logger.info(`Admin ${req.user?.email} removed custom MLS provider: ${providerId}`);

    res.json({
      success: true,
      message: `Custom MLS provider '${providerId}' removed successfully`
    });

  } catch (error) {
    logger.error(`Error removing custom MLS provider ${req.params.providerId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove custom MLS provider',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/mls/health
 * Health check for all MLS providers
 */
router.get('/health', authenticateToken, async (req: Request, res: Response) => {
  try {
    const health = await mlsService.healthCheck();
    
    const statusCode = health.overall ? 200 : 503;
    
    res.status(statusCode).json({
      success: health.overall,
      data: health,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('MLS health check error:', error);
    res.status(503).json({
      success: false,
      message: 'MLS health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/mls/providers/test (Admin only)
 * Test a custom MLS provider configuration before adding it
 */
router.post('/providers/test', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { endpoint, authentication, mapping } = req.body;

    if (!endpoint || !authentication) {
      return res.status(400).json({
        success: false,
        message: 'endpoint and authentication are required'
      });
    }

    // Create a temporary test client to validate the configuration
    const testConfig = {
      name: 'test-provider',
      endpoint,
      authentication,
      mapping: mapping || {
        listingId: 'id',
        address: 'address',
        city: 'city',
        price: 'price',
        bedrooms: 'bedrooms',
        bathrooms: 'bathrooms',
        propertyType: 'type',
        listingDate: 'listed_date',
        status: 'status'
      }
    };

    // This would create a temporary instance to test
    const testProvider = new (require('../services/integration/repliers-mls-service').CustomMLSProvider)(
      'test',
      testConfig,
      new CacheManager()
    );

    await testProvider.testConnection();

    res.json({
      success: true,
      message: 'MLS provider configuration test passed',
      config: {
        endpoint: testConfig.endpoint,
        authType: testConfig.authentication.type,
        mappingFields: Object.keys(testConfig.mapping).length
      }
    });

  } catch (error) {
    logger.error('MLS provider test failed:', error);
    res.status(400).json({
      success: false,
      message: 'MLS provider configuration test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      suggestions: [
        'Verify the endpoint URL is correct and accessible',
        'Check authentication credentials are valid',
        'Ensure the API returns data in the expected format',
        'Verify rate limiting allows sufficient requests'
      ]
    });
  }
});

/**
 * GET /api/mls/examples/config
 * Get example configurations for common MLS providers
 */
router.get('/examples/config', requireAdmin, async (req: Request, res: Response) => {
  try {
    const examples = {
      'Generic RETS': {
        authentication: {
          type: 'basic',
          username: 'your_username',
          password: 'your_password'
        },
        mapping: {
          listingId: 'ListingKey',
          address: 'UnparsedAddress',
          city: 'City',
          price: 'ListPrice',
          bedrooms: 'BedroomsTotal',
          bathrooms: 'BathroomsTotalInteger',
          propertyType: 'PropertyType',
          listingDate: 'ListingContractDate',
          status: 'MlsStatus',
          photos: 'Photos',
          coordinates: {
            lat: 'Latitude',
            lng: 'Longitude'
          }
        },
        rateLimitRPM: 60
      },
      'Custom API with Bearer Token': {
        authentication: {
          type: 'bearer',
          token: 'your_bearer_token_here'
        },
        mapping: {
          listingId: 'id',
          address: 'street_address',
          city: 'city_name',
          price: 'asking_price',
          bedrooms: 'bedroom_count',
          bathrooms: 'bathroom_count',
          propertyType: 'property_category',
          listingDate: 'date_listed',
          status: 'listing_status',
          photos: 'image_urls',
          coordinates: {
            lat: 'geo.lat',
            lng: 'geo.lng'
          }
        },
        rateLimitRPM: 100
      },
      'API Key Authentication': {
        authentication: {
          type: 'apikey',
          apiKey: 'your_api_key_here'
        },
        mapping: {
          listingId: 'listing_number',
          address: 'property_address',
          city: 'location.city',
          price: 'current_price',
          bedrooms: 'specs.bedrooms',
          bathrooms: 'specs.bathrooms',
          propertyType: 'category',
          listingDate: 'created_at',
          status: 'active_status',
          photos: 'media.photos'
        },
        rateLimitRPM: 120
      }
    };

    res.json({
      success: true,
      data: examples,
      message: 'These are example configurations for common MLS provider types. Customize the mapping based on your specific API response structure.'
    });

  } catch (error) {
    logger.error('Error fetching config examples:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch configuration examples'
    });
  }
});

export default router;