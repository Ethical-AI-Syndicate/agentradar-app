import { RepiersMlsService } from '../../services/integration/repliers-mls-service';
import { CacheManager } from '../../services/cache/cacheManager';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock CacheManager
jest.mock('../../services/cache/cacheManager');
const MockedCacheManager = CacheManager as jest.MockedClass<typeof CacheManager>;

describe('RepiersMlsService', () => {
  let mlsService: RepiersMlsService;
  let mockCacheManager: jest.Mocked<CacheManager>;
  let mockAxiosInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock cache manager
    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
      getStats: jest.fn(),
      healthCheck: jest.fn()
    } as any;

    // Setup mock axios instance
    mockAxiosInstance = {
      post: jest.fn(),
      get: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      }
    };

    mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance);

    // Initialize service
    mlsService = new RepiersMlsService(
      {
        apiKey: 'test-api-key',
        endpoint: 'https://api.test.com',
        region: 'Test Region',
        rateLimitRPM: 100
      },
      mockCacheManager
    );
  });

  describe('searchProperties', () => {
    it('should return cached results when available', async () => {
      const cachedResults = [
        {
          id: '1',
          address: '123 Test St',
          city: 'Toronto',
          province: 'ON',
          price: 500000,
          bedrooms: 3,
          bathrooms: 2,
          propertyType: 'Detached',
          listingDate: new Date(),
          daysOnMarket: 5,
          status: 'Active',
          photos: [],
          provider: 'repliers',
          lastUpdated: new Date()
        }
      ];

      mockCacheManager.get.mockResolvedValue(cachedResults);

      const criteria = { city: 'Toronto', maxResults: 10 };
      const results = await mlsService.searchProperties(criteria);

      expect(results).toEqual(cachedResults);
      expect(mockCacheManager.get).toHaveBeenCalledWith(
        expect.stringContaining('repliers:search:')
      );
      expect(mockAxiosInstance.post).not.toHaveBeenCalled();
    });

    it('should fetch from API when no cached results', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      
      const apiResponse = {
        data: {
          listings: [
            {
              id: '1',
              address: '123 Test St',
              city: 'Toronto',
              province: 'ON',
              price: '500000',
              bedrooms: '3',
              bathrooms: '2',
              property_type: 'Detached',
              listing_date: '2024-01-01',
              status: 'Active',
              photos: []
            }
          ]
        }
      };

      mockAxiosInstance.post.mockResolvedValue(apiResponse);

      const criteria = { city: 'Toronto', maxResults: 10 };
      const results = await mlsService.searchProperties(criteria);

      expect(results).toHaveLength(1);
      expect(results[0].address).toBe('123 Test St');
      expect(results[0].provider).toBe('repliers');
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/search', {
        region: 'Test Region',
        ...criteria,
        limit: 10
      });
      expect(mockCacheManager.set).toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockAxiosInstance.post.mockRejectedValue(new Error('API Error'));

      const criteria = { city: 'Toronto' };
      
      await expect(mlsService.searchProperties(criteria))
        .rejects.toThrow('Repliers search failed: API Error');
    });

    it('should apply correct rate limiting', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockAxiosInstance.post.mockResolvedValue({ data: { listings: [] } });

      // Make multiple requests quickly
      const promises = [
        mlsService.searchProperties({ city: 'Toronto' }),
        mlsService.searchProperties({ city: 'Vancouver' }),
        mlsService.searchProperties({ city: 'Calgary' })
      ];

      await Promise.all(promises);

      // Verify all requests went through (rate limiter should allow them within the limit)
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(3);
    });
  });

  describe('getPropertyDetails', () => {
    it('should return cached property details when available', async () => {
      const cachedProperty = {
        id: '123',
        address: '123 Test St',
        city: 'Toronto',
        province: 'ON',
        price: 500000,
        bedrooms: 3,
        bathrooms: 2,
        propertyType: 'Detached',
        listingDate: new Date(),
        daysOnMarket: 5,
        status: 'Active',
        photos: [],
        provider: 'repliers',
        lastUpdated: new Date()
      };

      mockCacheManager.get.mockResolvedValue(cachedProperty);

      const result = await mlsService.getPropertyDetails('123');

      expect(result).toEqual(cachedProperty);
      expect(mockCacheManager.get).toHaveBeenCalledWith('repliers:listing:123');
      expect(mockAxiosInstance.get).not.toHaveBeenCalled();
    });

    it('should fetch from API when not cached', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      
      const apiResponse = {
        data: {
          id: '123',
          address: '123 Test St',
          city: 'Toronto',
          price: '500000',
          bedrooms: '3',
          bathrooms: '2',
          property_type: 'Detached',
          listing_date: '2024-01-01',
          status: 'Active'
        }
      };

      mockAxiosInstance.get.mockResolvedValue(apiResponse);

      const result = await mlsService.getPropertyDetails('123');

      expect(result).toBeDefined();
      expect(result?.id).toBe('123');
      expect(result?.provider).toBe('repliers');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/listings/123');
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'repliers:listing:123',
        result,
        3600
      );
    });

    it('should return null for 404 errors', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      const error = new Error('Not Found');
      (error as any).response = { status: 404 };
      mockAxiosInstance.get.mockRejectedValue(error);

      const result = await mlsService.getPropertyDetails('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('addCustomMLSProvider', () => {
    it('should successfully add a custom MLS provider', async () => {
      const config = {
        name: 'Custom MLS',
        endpoint: 'https://custom-mls.com/api',
        authentication: {
          type: 'bearer' as const,
          token: 'test-token'
        },
        mapping: {
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

      // Mock successful connection test
      jest.spyOn(mlsService as any, 'createCustomMLSProvider')
        .mockImplementation(() => ({
          testConnection: jest.fn().mockResolvedValue(true)
        }));

      await expect(mlsService.addCustomMLSProvider('custom1', config))
        .resolves.not.toThrow();
    });

    it('should handle failed connection tests', async () => {
      const config = {
        name: 'Failing MLS',
        endpoint: 'https://failing-mls.com/api',
        authentication: {
          type: 'bearer' as const,
          token: 'invalid-token'
        },
        mapping: {
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

      // Mock failed connection test
      jest.spyOn(mlsService as any, 'createCustomMLSProvider')
        .mockImplementation(() => ({
          testConnection: jest.fn().mockRejectedValue(new Error('Connection failed'))
        }));

      await expect(mlsService.addCustomMLSProvider('failing', config))
        .rejects.toThrow('Connection failed');
    });
  });

  describe('searchAllProviders', () => {
    it('should search across Repliers and custom providers', async () => {
      // Mock Repliers search
      mockCacheManager.get.mockResolvedValue(null);
      mockAxiosInstance.post.mockResolvedValue({
        data: { listings: [{ id: 'repliers-1', address: 'Repliers Property' }] }
      });

      // Add a mock custom provider
      const customProvider = {
        searchProperties: jest.fn().mockResolvedValue([
          { id: 'custom-1', address: 'Custom Property', provider: 'custom' }
        ]),
        isHealthy: jest.fn().mockReturnValue(true),
        getName: jest.fn().mockReturnValue('Custom MLS'),
        getEndpoint: jest.fn().mockReturnValue('https://custom.com')
      };

      (mlsService as any).customProviders.set('custom1', customProvider);

      const results = await mlsService.searchAllProviders({ city: 'Toronto' });

      expect(results.repliers).toHaveLength(1);
      expect(results.custom.custom1).toHaveLength(1);
      expect(results.total).toBe(2);
    });

    it('should handle provider failures gracefully', async () => {
      // Mock Repliers failure
      mockCacheManager.get.mockResolvedValue(null);
      mockAxiosInstance.post.mockRejectedValue(new Error('Repliers down'));

      // Add a failing custom provider
      const failingProvider = {
        searchProperties: jest.fn().mockRejectedValue(new Error('Custom down')),
        isHealthy: jest.fn().mockReturnValue(false),
        getName: jest.fn().mockReturnValue('Failing MLS'),
        getEndpoint: jest.fn().mockReturnValue('https://failing.com')
      };

      (mlsService as any).customProviders.set('failing', failingProvider);

      const results = await mlsService.searchAllProviders({ city: 'Toronto' });

      expect(results.repliers).toHaveLength(0);
      expect(results.custom.failing).toHaveLength(0);
      expect(results.total).toBe(0);
    });
  });

  describe('getProvidersStatus', () => {
    it('should return status of all providers', () => {
      // Add a mock custom provider
      const customProvider = {
        isHealthy: jest.fn().mockReturnValue(true),
        getName: jest.fn().mockReturnValue('Custom MLS'),
        getEndpoint: jest.fn().mockReturnValue('https://custom.com')
      };

      (mlsService as any).customProviders.set('custom1', customProvider);

      const status = mlsService.getProvidersStatus();

      expect(status.repliers.status).toBe('active');
      expect(status.repliers.region).toBe('Test Region');
      expect(status.custom.custom1.status).toBe('active');
      expect(status.custom.custom1.name).toBe('Custom MLS');
    });
  });

  describe('healthCheck', () => {
    it('should check health of all providers', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: { status: 'ok' } });

      const health = await mlsService.healthCheck();

      expect(health.repliers).toBe(true);
      expect(health.overall).toBe(true);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/health');
    });

    it('should handle health check failures', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Health check failed'));

      const health = await mlsService.healthCheck();

      expect(health.repliers).toBe(false);
      expect(health.overall).toBe(false);
    });
  });
});

describe('Data Mapping', () => {
  let mlsService: RepiersMlsService;
  let mockCacheManager: jest.Mocked<CacheManager>;

  beforeEach(() => {
    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
      getStats: jest.fn(),
      healthCheck: jest.fn()
    } as any;

    mlsService = new RepiersMlsService(
      {
        apiKey: 'test-key',
        endpoint: 'https://test.com',
        region: 'Test'
      },
      mockCacheManager
    );
  });

  it('should correctly map Repliers API response format', () => {
    const repliersData = {
      id: '12345',
      address: '123 Main St',
      city: 'Toronto',
      province: 'ON',
      postal_code: 'M5V 3A8',
      price: '750000',
      bedrooms: '3',
      bathrooms: '2.5',
      square_footage: '1800',
      property_type: 'Townhouse',
      listing_date: '2024-01-15',
      days_on_market: '10',
      status: 'Active',
      description: 'Beautiful townhouse',
      photos: ['photo1.jpg', 'photo2.jpg'],
      coordinates: {
        lat: '43.6426',
        lng: '-79.3871'
      },
      mls_number: 'C12345'
    };

    const mapped = (mlsService as any).mapRepliersListing(repliersData);

    expect(mapped).toEqual({
      id: '12345',
      address: '123 Main St',
      city: 'Toronto',
      province: 'ON',
      postalCode: 'M5V 3A8',
      price: 750000,
      bedrooms: 3,
      bathrooms: 2.5,
      squareFootage: 1800,
      propertyType: 'Townhouse',
      listingDate: expect.any(Date),
      daysOnMarket: 10,
      status: 'Active',
      description: 'Beautiful townhouse',
      photos: ['photo1.jpg', 'photo2.jpg'],
      coordinates: {
        lat: 43.6426,
        lng: -79.3871
      },
      mlsNumber: 'C12345',
      provider: 'repliers',
      lastUpdated: expect.any(Date)
    });
  });

  it('should handle missing optional fields gracefully', () => {
    const minimalData = {
      id: '12345',
      address: '123 Main St',
      city: 'Toronto',
      price: '500000',
      bedrooms: '2',
      bathrooms: '1',
      property_type: 'Condo',
      listing_date: '2024-01-15',
      status: 'Active'
    };

    const mapped = (mlsService as any).mapRepliersListing(minimalData);

    expect(mapped.province).toBe('ON'); // Default
    expect(mapped.postalCode).toBeUndefined();
    expect(mapped.squareFootage).toBeUndefined();
    expect(mapped.description).toBeUndefined();
    expect(mapped.photos).toEqual([]);
    expect(mapped.coordinates).toBeUndefined();
    expect(mapped.mlsNumber).toBeUndefined();
  });
});