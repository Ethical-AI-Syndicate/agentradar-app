import axios, { AxiosInstance, AxiosResponse } from "axios";
import { createLogger } from "../../utils/logger";
import { CacheManager } from "../cache/cacheManager";

interface RepiersConfig {
  apiKey: string;
  endpoint: string;
  region: string;
  rateLimitRPM?: number;
  timeout?: number;
  retries?: number;
}

interface CustomMLSConfig {
  name: string;
  endpoint: string;
  authentication: {
    type: "bearer" | "apikey" | "oauth" | "basic";
    token?: string;
    apiKey?: string;
    clientId?: string;
    clientSecret?: string;
    username?: string;
    password?: string;
  };
  mapping: {
    listingId: string;
    address: string;
    city: string;
    price: string;
    bedrooms: string;
    bathrooms: string;
    propertyType: string;
    listingDate: string;
    status: string;
    photos?: string;
    coordinates?: {
      lat: string;
      lng: string;
    };
  };
  rateLimitRPM?: number;
  timeout?: number;
}

interface PropertyListing {
  id: string;
  address: string;
  city: string;
  province: string;
  postalCode?: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  squareFootage?: number;
  propertyType: string;
  listingDate: Date;
  daysOnMarket: number;
  status: string;
  description?: string;
  photos: string[];
  coordinates?: {
    lat: number;
    lng: number;
  };
  mlsNumber?: string;
  provider: string;
  lastUpdated: Date;
}

interface SearchCriteria {
  city?: string;
  province?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  propertyType?: string;
  maxResults?: number;
  offset?: number;
}

export class RepiersMlsService {
  private logger = createLogger();
  private cache: CacheManager;
  private repliesClient: AxiosInstance;
  private customProviders: Map<string, CustomMLSProvider> = new Map();
  private rateLimiters: Map<string, RateLimiter> = new Map();

  constructor(
    private repliesConfig: RepiersConfig,
    private cacheManager: CacheManager,
  ) {
    this.cache = cacheManager;

    // Initialize Repliers client
    this.repliesClient = axios.create({
      baseURL: this.repliesConfig.endpoint,
      timeout: this.repliesConfig.timeout || 30000,
      headers: {
        Authorization: `Bearer ${this.repliesConfig.apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "AgentRadar-MLS-Integration/1.0",
      },
    });

    this.setupInterceptors();
    this.setupRateLimiter("repliers", this.repliesConfig.rateLimitRPM || 100);

    this.logger.info("Repliers MLS Service initialized");
  }

  private setupInterceptors(): void {
    // Request interceptor for rate limiting
    this.repliesClient.interceptors.request.use(async (config) => {
      await this.checkRateLimit("repliers");
      return config;
    });

    // Response interceptor for error handling and caching
    this.repliesClient.interceptors.response.use(
      (response: AxiosResponse) => {
        this.logger.debug(
          `Repliers API request succeeded: ${response.config.url}`,
        );
        return response;
      },
      (error) => {
        this.logger.error(
          `Repliers API request failed: ${error.response?.status} ${error.response?.statusText}`,
        );
        return Promise.reject(error);
      },
    );
  }

  private setupRateLimiter(providerId: string, rateLimitRPM: number): void {
    this.rateLimiters.set(providerId, {
      requests: 0,
      windowStart: Date.now(),
      limit: rateLimitRPM,
      windowMs: 60000,
    });
  }

  private async checkRateLimit(providerId: string): Promise<void> {
    const limiter = this.rateLimiters.get(providerId);
    if (!limiter) return;

    const now = Date.now();

    if (now - limiter.windowStart >= limiter.windowMs) {
      limiter.requests = 0;
      limiter.windowStart = now;
    }

    if (limiter.requests >= limiter.limit) {
      const waitTime = limiter.windowMs - (now - limiter.windowStart);
      this.logger.warn(
        `Rate limit reached for ${providerId}, waiting ${waitTime}ms`,
      );
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      return this.checkRateLimit(providerId);
    }

    limiter.requests++;
  }

  /**
   * Search properties using Repliers MLS
   */
  async searchProperties(criteria: SearchCriteria): Promise<PropertyListing[]> {
    try {
      const cacheKey = `repliers:search:${JSON.stringify(criteria)}`;
      const cached = await this.cache.get(cacheKey);

      if (cached) {
        this.logger.debug("Returning cached search results");
        return cached;
      }

      const response = await this.repliesClient.post("/search", {
        region: this.repliesConfig.region,
        ...criteria,
        limit: criteria.maxResults || 50,
      });

      const listings = this.mapRepliersListings(response.data.listings || []);

      // Cache results for 15 minutes
      await this.cache.set(cacheKey, listings, 900);

      this.logger.info(`Found ${listings.length} listings via Repliers`);
      return listings;
    } catch (error) {
      this.logger.error("Error searching Repliers listings:", error);
      throw new Error(`Repliers search failed: ${(error as Error).message}`);
    }
  }

  /**
   * Get detailed property information by listing ID
   */
  async getPropertyDetails(listingId: string): Promise<PropertyListing | null> {
    try {
      const cacheKey = `repliers:listing:${listingId}`;
      const cached = await this.cache.get(cacheKey);

      if (cached) {
        return cached;
      }

      const response = await this.repliesClient.get(`/listings/${listingId}`);
      const listing = this.mapRepliersListing(response.data);

      // Cache for 1 hour
      await this.cache.set(cacheKey, listing, 3600);

      return listing;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }

      this.logger.error(
        `Error fetching listing details for ${listingId}:`,
        error,
      );
      throw new Error(
        `Failed to fetch listing details: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Get market statistics for a region
   */
  async getMarketStats(region?: string, period = "30d"): Promise<any> {
    try {
      const targetRegion = region || this.repliesConfig.region;
      const cacheKey = `repliers:stats:${targetRegion}:${period}`;
      const cached = await this.cache.get(cacheKey);

      if (cached) {
        return cached;
      }

      const response = await this.repliesClient.get("/market-stats", {
        params: { region: targetRegion, period },
      });

      const stats = response.data;

      // Cache for 2 hours
      await this.cache.set(cacheKey, stats, 7200);

      return stats;
    } catch (error) {
      this.logger.error(`Error fetching market stats:`, error);
      throw new Error(
        `Failed to fetch market stats: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Add a custom MLS provider (bring-your-own-MLS)
   */
  async addCustomMLSProvider(
    providerId: string,
    config: CustomMLSConfig,
  ): Promise<void> {
    try {
      const provider = new CustomMLSProvider(providerId, config, this.cache);
      await provider.testConnection();

      this.customProviders.set(providerId, provider);
      this.setupRateLimiter(providerId, config.rateLimitRPM || 60);

      this.logger.info(`Added custom MLS provider: ${providerId}`);
    } catch (error) {
      this.logger.error(
        `Failed to add custom MLS provider ${providerId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Remove a custom MLS provider
   */
  removeCustomMLSProvider(providerId: string): void {
    this.customProviders.delete(providerId);
    this.rateLimiters.delete(providerId);
    this.logger.info(`Removed custom MLS provider: ${providerId}`);
  }

  /**
   * Search across all configured providers (Repliers + custom)
   */
  async searchAllProviders(criteria: SearchCriteria): Promise<{
    repliers: PropertyListing[];
    custom: { [providerId: string]: PropertyListing[] };
    total: number;
  }> {
    const results = {
      repliers: [] as PropertyListing[],
      custom: {} as { [providerId: string]: PropertyListing[] },
      total: 0,
    };

    // Search Repliers
    try {
      results.repliers = await this.searchProperties(criteria);
      results.total += results.repliers.length;
    } catch (error) {
      this.logger.error("Repliers search failed:", error);
    }

    // Search custom providers
    const customSearches = Array.from(this.customProviders.entries()).map(
      async ([providerId, provider]) => {
        try {
          await this.checkRateLimit(providerId);
          const listings = await provider.searchProperties(criteria);
          results.custom[providerId] = listings;
          results.total += listings.length;
        } catch (error) {
          this.logger.error(
            `Custom provider ${providerId} search failed:`,
            error,
          );
          results.custom[providerId] = [];
        }
      },
    );

    await Promise.allSettled(customSearches);

    return results;
  }

  /**
   * Get status of all MLS providers
   */
  getProvidersStatus(): {
    repliers: { status: string; region: string; rateLimitRPM: number };
    custom: {
      [providerId: string]: { status: string; name: string; endpoint: string };
    };
  } {
    return {
      repliers: {
        status: "active",
        region: this.repliesConfig.region,
        rateLimitRPM: this.repliesConfig.rateLimitRPM || 100,
      },
      custom: Object.fromEntries(
        Array.from(this.customProviders.entries()).map(([id, provider]) => [
          id,
          {
            status: provider.isHealthy() ? "active" : "error",
            name: provider.getName(),
            endpoint: provider.getEndpoint(),
          },
        ]),
      ),
    };
  }

  /**
   * Map Repliers API response to standardized PropertyListing format
   */
  private mapRepliersListings(listings: any): PropertyListing[] {
    return listings.map((listing) => this.mapRepliersListing(listing));
  }

  private mapRepliersListing(listing: any): PropertyListing {
    return {
      id: listing.id || listing.listing_id,
      address: listing.address || listing.street_address,
      city: listing.city,
      province: listing.province || listing.state || "ON",
      postalCode: listing.postal_code || listing.zip_code,
      price: parseFloat(listing.price) || 0,
      bedrooms: parseInt(listing.bedrooms) || 0,
      bathrooms: parseFloat(listing.bathrooms) || 0,
      squareFootage: parseInt(listing.square_footage) || undefined,
      propertyType: listing.property_type || listing.type,
      listingDate: new Date(listing.listing_date || listing.listed_date),
      daysOnMarket: parseInt(listing.days_on_market) || 0,
      status: listing.status || "Active",
      description: listing.description || listing.remarks,
      photos: listing.photos || listing.images || [],
      coordinates:
        listing.coordinates || listing.location
          ? {
              lat: parseFloat(
                listing.coordinates?.lat || listing.location?.latitude,
              ),
              lng: parseFloat(
                listing.coordinates?.lng || listing.location?.longitude,
              ),
            }
          : undefined,
      mlsNumber: listing.mls_number || listing.mls_id,
      provider: "repliers",
      lastUpdated: new Date(),
    };
  }

  /**
   * Health check for the service
   */
  async healthCheck(): Promise<{
    repliers: boolean;
    customProviders: { [providerId: string]: boolean };
    overall: boolean;
  }> {
    const health = {
      repliers: false,
      customProviders: {} as { [providerId: string]: boolean },
      overall: false,
    };

    // Test Repliers connection
    try {
      await this.repliesClient.get("/health");
      health.repliers = true;
    } catch (error) {
      this.logger.error("Repliers health check failed:", error);
    }

    // Test custom providers
    for (const [providerId, provider] of this.customProviders.entries()) {
      health.customProviders[providerId] = provider.isHealthy();
    }

    health.overall =
      health.repliers || Object.values(health.customProviders).some((h) => h);

    return health;
  }
}

/**
 * Custom MLS Provider class for bring-your-own-MLS functionality
 */
class CustomMLSProvider {
  private client: AxiosInstance;
  private healthy = false;
  private lastHealthCheck = 0;

  constructor(
    private providerId: string,
    private config: CustomMLSConfig,
    private cache: CacheManager,
  ) {
    this.client = axios.create({
      baseURL: config.endpoint,
      timeout: config.timeout || 30000,
      headers: this.buildAuthHeaders(),
    });
  }

  private buildAuthHeaders(): any {
    const headers: any = {
      "Content-Type": "application/json",
      "User-Agent": `AgentRadar-Custom-MLS/${this.providerId}/1.0`,
    };

    switch (this.config.authentication.type) {
      case "bearer":
        headers["Authorization"] = `Bearer ${this.config.authentication.token}`;
        break;
      case "apikey":
        headers["X-API-Key"] = this.config.authentication.apiKey;
        break;
      case "basic":
        const credentials = Buffer.from(
          `${this.config.authentication.username}:${this.config.authentication.password}`,
        ).toString("base64");
        headers["Authorization"] = `Basic ${credentials}`;
        break;
    }

    return headers;
  }

  async testConnection(): Promise<void> {
    try {
      // Try a minimal search to test connectivity
      await this.client.get("/search", {
        params: { limit: 1 },
      });
      this.healthy = true;
      this.lastHealthCheck = Date.now();
    } catch (error) {
      throw new Error(
        `Custom MLS provider ${this.providerId} connection test failed: ${(error as Error).message}`,
      );
    }
  }

  async searchProperties(criteria: SearchCriteria): Promise<PropertyListing[]> {
    try {
      const response = await this.client.get("/search", {
        params: this.mapSearchCriteria(criteria),
      });

      return this.mapCustomListings(response.data);
    } catch (error) {
      throw new Error(
        `Custom provider ${this.providerId} search failed: ${(error as Error).message}`,
      );
    }
  }

  private mapSearchCriteria(criteria: SearchCriteria): any {
    const mapped: any = {};

    if (criteria.city) mapped.city = criteria.city;
    if (criteria.minPrice) mapped.min_price = criteria.minPrice;
    if (criteria.maxPrice) mapped.max_price = criteria.maxPrice;
    if (criteria.bedrooms) mapped.bedrooms = criteria.bedrooms;
    if (criteria.bathrooms) mapped.bathrooms = criteria.bathrooms;
    if (criteria.propertyType) mapped.property_type = criteria.propertyType;
    if (criteria.maxResults) mapped.limit = criteria.maxResults;
    if (criteria.offset) mapped.offset = criteria.offset;

    return mapped;
  }

  private mapCustomListings(data: any): PropertyListing[] {
    const listings = Array.isArray(data)
      ? data
      : data.listings || data.results || [];

    return listings.map((listing: any) => this.mapCustomListing(listing));
  }

  private mapCustomListing(listing: any): PropertyListing {
    const mapping = this.config.mapping;

    return {
      id: this.getFieldValue(listing, mapping.listingId),
      address: this.getFieldValue(listing, mapping.address),
      city: this.getFieldValue(listing, mapping.city),
      province: "ON", // Default, could be made configurable
      price: parseFloat(this.getFieldValue(listing, mapping.price)) || 0,
      bedrooms: parseInt(this.getFieldValue(listing, mapping.bedrooms)) || 0,
      bathrooms:
        parseFloat(this.getFieldValue(listing, mapping.bathrooms)) || 0,
      propertyType: this.getFieldValue(listing, mapping.propertyType),
      listingDate: new Date(this.getFieldValue(listing, mapping.listingDate)),
      daysOnMarket: this.calculateDaysOnMarket(
        this.getFieldValue(listing, mapping.listingDate),
      ),
      status: this.getFieldValue(listing, mapping.status) || "Active",
      photos: mapping.photos
        ? this.getFieldValue(listing, mapping.photos) || []
        : [],
      coordinates: mapping.coordinates
        ? {
            lat: parseFloat(
              this.getFieldValue(listing, mapping.coordinates.lat),
            ),
            lng: parseFloat(
              this.getFieldValue(listing, mapping.coordinates.lng),
            ),
          }
        : undefined,
      provider: this.providerId,
      lastUpdated: new Date(),
    };
  }

  private getFieldValue(obj: any, path: string): any {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  }

  private calculateDaysOnMarket(listingDate: string): number {
    const listed = new Date(listingDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - listed.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  isHealthy(): boolean {
    const now = Date.now();
    // Consider provider healthy if last check was within 5 minutes
    return this.healthy && now - this.lastHealthCheck < 300000;
  }

  getName(): string {
    return this.config.name;
  }

  getEndpoint(): string {
    return this.config.endpoint;
  }
}

interface RateLimiter {
  requests: number;
  windowStart: number;
  limit: number;
  windowMs: number;
}

export default RepiersMlsService;
