const axios = require('axios');
const Redis = require('redis');
const { createLogger } = require('../../utils/logger');
const CacheManager = require('../cache/cacheManager');

class MLSIntegrationHub {
  constructor() {
    this.logger = createLogger();
    this.cache = CacheManager;
    this.integrations = new Map();
    this.rateLimiters = new Map();
    this.syncQueues = new Map();
    this.webhookEndpoints = new Map();
    
    this.supportedMLSProviders = [
      'TREB', 'CREA', 'CRMLS', 'NWMLS', 'BRIGHT_MLS', 'STELLAR_MLS',
      'REALTOR_CA', 'ICREALESTATE', 'ZOLO', 'HOUSESIGMA'
    ];
    
    this.supportedCRMProviders = [
      'SALESFORCE', 'HUBSPOT', 'CHIME', 'WISE_AGENT', 'TOP_PRODUCER',
      'FOLLOW_UP_BOSS', 'REAL_GEEKS', 'KVCORE', 'PLACESTER'
    ];

    this.initializeIntegrations();
  }

  async initializeIntegrations() {
    try {
      this.logger.info('Initializing MLS/CRM Integration Hub...');
      
      const integrationConfigs = await this.loadIntegrationConfigs();
      
      for (const config of integrationConfigs) {
        await this.setupIntegration(config);
      }
      
      this.setupWebhookServer();
      this.startSyncScheduler();
      
      this.logger.info(`Integration Hub initialized with ${this.integrations.size} active integrations`);
      
    } catch (error) {
      this.logger.error('Failed to initialize Integration Hub:', error);
      throw error;
    }
  }

  async loadIntegrationConfigs() {
    return [
      {
        id: 'treb_mls',
        provider: 'TREB',
        type: 'MLS',
        enabled: process.env.TREB_ENABLED === 'true',
        config: {
          baseUrl: 'https://api.treb.ca/webapi',
          apiKey: process.env.TREB_API_KEY,
          secret: process.env.TREB_SECRET,
          rateLimitRPM: 100,
          syncIntervalMinutes: 15,
          regions: ['GTA', 'Toronto', 'York', 'Durham', 'Peel', 'Halton']
        }
      },
      {
        id: 'realtor_ca',
        provider: 'REALTOR_CA',
        type: 'MLS',
        enabled: process.env.REALTOR_CA_ENABLED === 'true',
        config: {
          baseUrl: 'https://api.realtor.ca',
          apiKey: process.env.REALTOR_CA_API_KEY,
          rateLimitRPM: 200,
          syncIntervalMinutes: 30,
          regions: ['Ontario', 'BC', 'Alberta', 'Quebec']
        }
      },
      {
        id: 'salesforce_crm',
        provider: 'SALESFORCE',
        type: 'CRM',
        enabled: process.env.SALESFORCE_ENABLED === 'true',
        config: {
          instanceUrl: process.env.SALESFORCE_INSTANCE_URL,
          clientId: process.env.SALESFORCE_CLIENT_ID,
          clientSecret: process.env.SALESFORCE_CLIENT_SECRET,
          username: process.env.SALESFORCE_USERNAME,
          password: process.env.SALESFORCE_PASSWORD,
          securityToken: process.env.SALESFORCE_SECURITY_TOKEN,
          rateLimitRPM: 1000,
          syncIntervalMinutes: 10
        }
      },
      {
        id: 'hubspot_crm',
        provider: 'HUBSPOT',
        type: 'CRM',
        enabled: process.env.HUBSPOT_ENABLED === 'true',
        config: {
          baseUrl: 'https://api.hubapi.com',
          accessToken: process.env.HUBSPOT_ACCESS_TOKEN,
          portalId: process.env.HUBSPOT_PORTAL_ID,
          rateLimitRPM: 1000,
          syncIntervalMinutes: 5
        }
      }
    ];
  }

  async setupIntegration(config) {
    if (!config.enabled) {
      this.logger.info(`Integration ${config.id} is disabled, skipping...`);
      return;
    }

    try {
      const integration = {
        id: config.id,
        provider: config.provider,
        type: config.type,
        config: config.config,
        status: 'initializing',
        lastSync: null,
        errorCount: 0,
        totalSynced: 0,
        client: null
      };

      if (config.type === 'MLS') {
        integration.client = await this.createMLSClient(config);
      } else if (config.type === 'CRM') {
        integration.client = await this.createCRMClient(config);
      }

      await this.testIntegration(integration);
      
      integration.status = 'active';
      this.integrations.set(config.id, integration);
      
      this.setupRateLimiter(config.id, config.config.rateLimitRPM);
      this.setupSyncQueue(config.id, config.config.syncIntervalMinutes);

      this.logger.info(`Successfully set up ${config.type} integration: ${config.id}`);
      
    } catch (error) {
      this.logger.error(`Failed to setup integration ${config.id}:`, error);
      
      const failedIntegration = {
        id: config.id,
        provider: config.provider,
        type: config.type,
        status: 'failed',
        error: error.message,
        lastAttempt: new Date()
      };
      
      this.integrations.set(config.id, failedIntegration);
    }
  }

  async createMLSClient(config) {
    switch (config.provider) {
      case 'TREB':
        return this.createTREBClient(config.config);
      case 'REALTOR_CA':
        return this.createRealtorCAClient(config.config);
      default:
        throw new Error(`Unsupported MLS provider: ${config.provider}`);
    }
  }

  async createTREBClient(config) {
    return {
      baseUrl: config.baseUrl,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'X-API-Secret': config.secret,
        'Content-Type': 'application/json'
      },
      
      async searchListings(criteria) {
        const response = await axios.post(`${this.baseUrl}/listings/search`, {
          ...criteria,
          includePhotos: true,
          includeDetails: true
        }, { headers: this.headers });
        
        return response.data;
      },
      
      async getListingDetails(mlsNumber) {
        const response = await axios.get(
          `${this.baseUrl}/listings/${mlsNumber}`,
          { headers: this.headers }
        );
        return response.data;
      },
      
      async getMarketStats(region, period) {
        const response = await axios.get(
          `${this.baseUrl}/market/stats`,
          { 
            params: { region, period },
            headers: this.headers 
          }
        );
        return response.data;
      }
    };
  }

  async createRealtorCAClient(config) {
    return {
      baseUrl: config.baseUrl,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      
      async searchProperties(criteria) {
        const response = await axios.post(`${this.baseUrl}/Listing.svc/PropertySearch_Post`, 
          criteria, 
          { headers: this.headers }
        );
        return response.data;
      },
      
      async getPropertyDetails(propertyId) {
        const response = await axios.get(
          `${this.baseUrl}/Listing.svc/PropertyDetails/${propertyId}`,
          { headers: this.headers }
        );
        return response.data;
      }
    };
  }

  async createCRMClient(config) {
    switch (config.provider) {
      case 'SALESFORCE':
        return this.createSalesforceClient(config.config);
      case 'HUBSPOT':
        return this.createHubSpotClient(config.config);
      default:
        throw new Error(`Unsupported CRM provider: ${config.provider}`);
    }
  }

  async createSalesforceClient(config) {
    const auth = await this.authenticateSalesforce(config);
    
    return {
      instanceUrl: config.instanceUrl,
      accessToken: auth.access_token,
      
      async createLead(leadData) {
        const response = await axios.post(
          `${this.instanceUrl}/services/data/v57.0/sobjects/Lead/`,
          leadData,
          { headers: { 'Authorization': `Bearer ${this.accessToken}` } }
        );
        return response.data;
      },
      
      async updateContact(contactId, data) {
        const response = await axios.patch(
          `${this.instanceUrl}/services/data/v57.0/sobjects/Contact/${contactId}`,
          data,
          { headers: { 'Authorization': `Bearer ${this.accessToken}` } }
        );
        return response.data;
      },
      
      async getOpportunities(criteria) {
        const soql = this.buildSOQL('Opportunity', criteria);
        const response = await axios.get(
          `${this.instanceUrl}/services/data/v57.0/query?q=${encodeURIComponent(soql)}`,
          { headers: { 'Authorization': `Bearer ${this.accessToken}` } }
        );
        return response.data;
      }
    };
  }

  async createHubSpotClient(config) {
    return {
      baseUrl: config.baseUrl,
      accessToken: config.accessToken,
      portalId: config.portalId,
      
      async createContact(contactData) {
        const response = await axios.post(
          `${this.baseUrl}/crm/v3/objects/contacts`,
          { properties: contactData },
          { headers: { 'Authorization': `Bearer ${this.accessToken}` } }
        );
        return response.data;
      },
      
      async updateDeal(dealId, data) {
        const response = await axios.patch(
          `${this.baseUrl}/crm/v3/objects/deals/${dealId}`,
          { properties: data },
          { headers: { 'Authorization': `Bearer ${this.accessToken}` } }
        );
        return response.data;
      },
      
      async getContacts(criteria) {
        const response = await axios.get(
          `${this.baseUrl}/crm/v3/objects/contacts`,
          { 
            params: criteria,
            headers: { 'Authorization': `Bearer ${this.accessToken}` }
          }
        );
        return response.data;
      }
    };
  }

  async testIntegration(integration) {
    try {
      if (integration.type === 'MLS') {
        const testSearch = await integration.client.searchListings({
          maxResults: 1,
          priceMin: 100000,
          priceMax: 200000
        });
        
        if (!testSearch || !testSearch.listings) {
          throw new Error('MLS test search failed - no results structure');
        }
        
      } else if (integration.type === 'CRM') {
        if (integration.provider === 'SALESFORCE') {
          await integration.client.getOpportunities({ limit: 1 });
        } else if (integration.provider === 'HUBSPOT') {
          await integration.client.getContacts({ limit: 1 });
        }
      }
      
      this.logger.info(`Integration test passed for ${integration.id}`);
      
    } catch (error) {
      this.logger.error(`Integration test failed for ${integration.id}:`, error);
      throw error;
    }
  }

  setupRateLimiter(integrationId, rateLimitRPM) {
    const limiter = {
      requests: 0,
      windowStart: Date.now(),
      limit: rateLimitRPM,
      windowMs: 60000 // 1 minute
    };
    
    this.rateLimiters.set(integrationId, limiter);
  }

  async checkRateLimit(integrationId) {
    const limiter = this.rateLimiters.get(integrationId);
    if (!limiter) return true;
    
    const now = Date.now();
    
    if (now - limiter.windowStart >= limiter.windowMs) {
      limiter.requests = 0;
      limiter.windowStart = now;
    }
    
    if (limiter.requests >= limiter.limit) {
      const waitTime = limiter.windowMs - (now - limiter.windowStart);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.checkRateLimit(integrationId);
    }
    
    limiter.requests++;
    return true;
  }

  setupSyncQueue(integrationId, intervalMinutes) {
    const queue = {
      id: integrationId,
      interval: intervalMinutes * 60 * 1000,
      lastRun: null,
      running: false,
      tasks: []
    };
    
    this.syncQueues.set(integrationId, queue);
  }

  startSyncScheduler() {
    setInterval(async () => {
      for (const [integrationId, queue] of this.syncQueues.entries()) {
        const now = Date.now();
        const shouldRun = !queue.lastRun || (now - queue.lastRun >= queue.interval);
        
        if (shouldRun && !queue.running) {
          queue.running = true;
          try {
            await this.runSync(integrationId);
            queue.lastRun = now;
          } catch (error) {
            this.logger.error(`Sync failed for ${integrationId}:`, error);
          } finally {
            queue.running = false;
          }
        }
      }
    }, 30000); // Check every 30 seconds
  }

  async runSync(integrationId) {
    const integration = this.integrations.get(integrationId);
    if (!integration || integration.status !== 'active') {
      return;
    }

    this.logger.info(`Starting sync for ${integrationId}...`);
    
    try {
      if (integration.type === 'MLS') {
        await this.syncMLSData(integration);
      } else if (integration.type === 'CRM') {
        await this.syncCRMData(integration);
      }
      
      integration.lastSync = new Date();
      integration.errorCount = 0;
      
    } catch (error) {
      integration.errorCount++;
      this.logger.error(`Sync error for ${integrationId}:`, error);
      
      if (integration.errorCount >= 5) {
        integration.status = 'error';
        this.logger.error(`Integration ${integrationId} disabled due to repeated failures`);
      }
    }
  }

  async syncMLSData(integration) {
    await this.checkRateLimit(integration.id);
    
    const regions = integration.config.regions || ['GTA'];
    const syncedCount = 0;
    
    for (const region of regions) {
      try {
        const criteria = {
          region: region,
          maxResults: 100,
          sortBy: 'ListingDate',
          sortOrder: 'desc',
          modifiedSince: integration.lastSync || new Date(Date.now() - 24 * 60 * 60 * 1000)
        };
        
        const listings = await integration.client.searchListings(criteria);
        
        for (const listing of listings.listings || []) {
          await this.processMLSListing(listing, integration.provider, region);
          syncedCount++;
        }
        
        const marketStats = await integration.client.getMarketStats(region, '30d');
        await this.processMarketStats(marketStats, region, integration.provider);
        
      } catch (error) {
        this.logger.error(`Error syncing MLS data for region ${region}:`, error);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    integration.totalSynced += syncedCount;
    this.logger.info(`Synced ${syncedCount} MLS records for ${integration.id}`);
  }

  async processMLSListing(listing, provider, region) {
    try {
      const processedListing = {
        mlsNumber: listing.mlsNumber || listing.id,
        address: listing.address,
        city: listing.city || region,
        province: listing.province || 'ON',
        postalCode: listing.postalCode,
        price: listing.price,
        bedrooms: listing.bedrooms,
        bathrooms: listing.bathrooms,
        squareFootage: listing.squareFootage,
        propertyType: listing.propertyType,
        listingDate: listing.listingDate,
        daysOnMarket: listing.daysOnMarket,
        status: listing.status,
        description: listing.description,
        photos: listing.photos || [],
        provider: provider,
        region: region,
        lastUpdated: new Date(),
        coordinates: {
          lat: listing.latitude,
          lng: listing.longitude
        }
      };
      
      const cacheKey = `mls_listing:${provider}:${listing.mlsNumber}`;
      await this.cache.set(cacheKey, processedListing, 3600); // 1 hour TTL
      
      await this.analyzeListingForAlerts(processedListing);
      
    } catch (error) {
      this.logger.error('Error processing MLS listing:', error);
    }
  }

  async analyzeListingForAlerts(listing) {
    try {
      const alertCriteria = {
        priceBelow: listing.price * 0.8, // 20% below asking
        quickSale: listing.daysOnMarket < 7,
        priceReduction: false, // Would need historical data
        distressedSale: listing.description?.toLowerCase().includes('motivated') ||
                       listing.description?.toLowerCase().includes('must sell'),
        highROI: listing.propertyType === 'Investment' || listing.city === 'Toronto'
      };
      
      let opportunityScore = 0;
      const reasons = [];
      
      if (alertCriteria.quickSale) {
        opportunityScore += 25;
        reasons.push('Quick sale opportunity - less than 7 days on market');
      }
      
      if (alertCriteria.distressedSale) {
        opportunityScore += 20;
        reasons.push('Motivated seller indicated');
      }
      
      if (alertCriteria.highROI) {
        opportunityScore += 15;
        reasons.push('High ROI potential location/type');
      }
      
      if (opportunityScore >= 30) {
        const alert = {
          alertType: 'MLS_OPPORTUNITY',
          priority: opportunityScore >= 50 ? 'HIGH' : 'MEDIUM',
          title: `MLS Opportunity: ${listing.address}`,
          description: reasons.join('; '),
          address: listing.address,
          city: listing.city,
          opportunityScore: opportunityScore,
          estimatedValue: listing.price,
          sourceData: {
            mlsNumber: listing.mlsNumber,
            provider: listing.provider,
            listingDate: listing.listingDate,
            daysOnMarket: listing.daysOnMarket
          },
          metadata: {
            bedrooms: listing.bedrooms,
            bathrooms: listing.bathrooms,
            squareFootage: listing.squareFootage,
            propertyType: listing.propertyType
          }
        };
        
        await this.createOpportunityAlert(alert);
      }
      
    } catch (error) {
      this.logger.error('Error analyzing listing for alerts:', error);
    }
  }

  async createOpportunityAlert(alertData) {
    try {
      const existingAlert = await this.cache.get(`alert:${alertData.sourceData.mlsNumber}`);
      if (existingAlert) {
        return; // Avoid duplicates
      }
      
      // This would integrate with the main alert system
      const alert = {
        ...alertData,
        id: `mls_${alertData.sourceData.mlsNumber}_${Date.now()}`,
        createdAt: new Date(),
        status: 'ACTIVE',
        source: 'MLS_INTEGRATION'
      };
      
      await this.cache.set(`alert:${alertData.sourceData.mlsNumber}`, alert, 86400); // 24 hours
      
      // Emit to WebSocket for real-time notifications
      if (global.socketService) {
        global.socketService.broadcastToChannel('market_alerts', {
          type: 'new_mls_opportunity',
          alert: alert
        });
      }
      
      this.logger.info(`Created MLS opportunity alert: ${alert.id}`);
      
    } catch (error) {
      this.logger.error('Error creating opportunity alert:', error);
    }
  }

  async syncCRMData(integration) {
    await this.checkRateLimit(integration.id);
    
    try {
      if (integration.provider === 'SALESFORCE') {
        await this.syncSalesforceData(integration);
      } else if (integration.provider === 'HUBSPOT') {
        await this.syncHubSpotData(integration);
      }
    } catch (error) {
      this.logger.error(`CRM sync error for ${integration.id}:`, error);
      throw error;
    }
  }

  async syncSalesforceData(integration) {
    try {
      const opportunities = await integration.client.getOpportunities({
        fields: ['Id', 'Name', 'StageName', 'Amount', 'CloseDate', 'Account.Name'],
        modifiedSince: integration.lastSync || new Date(Date.now() - 24 * 60 * 60 * 1000)
      });
      
      for (const opportunity of opportunities.records || []) {
        await this.processCRMOpportunity(opportunity, 'SALESFORCE');
      }
      
      this.logger.info(`Synced ${opportunities.records?.length || 0} Salesforce opportunities`);
      
    } catch (error) {
      this.logger.error('Error syncing Salesforce data:', error);
      throw error;
    }
  }

  async syncHubSpotData(integration) {
    try {
      const deals = await integration.client.getContacts({
        properties: ['firstname', 'lastname', 'email', 'phone', 'company'],
        limit: 100
      });
      
      for (const contact of deals.results || []) {
        await this.processCRMContact(contact, 'HUBSPOT');
      }
      
      this.logger.info(`Synced ${deals.results?.length || 0} HubSpot contacts`);
      
    } catch (error) {
      this.logger.error('Error syncing HubSpot data:', error);
      throw error;
    }
  }

  async processCRMOpportunity(opportunity, provider) {
    try {
      const processedOpp = {
        id: opportunity.Id,
        name: opportunity.Name,
        stage: opportunity.StageName,
        amount: opportunity.Amount,
        closeDate: opportunity.CloseDate,
        accountName: opportunity.Account?.Name,
        provider: provider,
        lastUpdated: new Date()
      };
      
      const cacheKey = `crm_opportunity:${provider}:${opportunity.Id}`;
      await this.cache.set(cacheKey, processedOpp, 1800); // 30 minutes TTL
      
    } catch (error) {
      this.logger.error('Error processing CRM opportunity:', error);
    }
  }

  async getIntegrationStatus() {
    const status = {
      totalIntegrations: this.integrations.size,
      activeIntegrations: 0,
      failedIntegrations: 0,
      integrations: []
    };
    
    for (const [id, integration] of this.integrations.entries()) {
      if (integration.status === 'active') {
        status.activeIntegrations++;
      } else if (integration.status === 'failed' || integration.status === 'error') {
        status.failedIntegrations++;
      }
      
      status.integrations.push({
        id: integration.id,
        provider: integration.provider,
        type: integration.type,
        status: integration.status,
        lastSync: integration.lastSync,
        totalSynced: integration.totalSynced || 0,
        errorCount: integration.errorCount || 0
      });
    }
    
    return status;
  }

  async enableIntegration(integrationId) {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`);
    }
    
    integration.status = 'active';
    integration.errorCount = 0;
    
    this.logger.info(`Enabled integration: ${integrationId}`);
  }

  async disableIntegration(integrationId) {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`);
    }
    
    integration.status = 'disabled';
    
    this.logger.info(`Disabled integration: ${integrationId}`);
  }

  async manualSync(integrationId) {
    const integration = this.integrations.get(integrationId);
    if (!integration || integration.status !== 'active') {
      throw new Error(`Cannot sync inactive integration: ${integrationId}`);
    }
    
    await this.runSync(integrationId);
    return { success: true, message: `Manual sync completed for ${integrationId}` };
  }

  setupWebhookServer() {
    // Webhook endpoints for real-time data updates
    this.webhookEndpoints.set('/webhook/mls/treb', this.handleTREBWebhook.bind(this));
    this.webhookEndpoints.set('/webhook/crm/salesforce', this.handleSalesforceWebhook.bind(this));
    this.webhookEndpoints.set('/webhook/crm/hubspot', this.handleHubSpotWebhook.bind(this));
  }

  async handleTREBWebhook(payload) {
    try {
      if (payload.event === 'listing.updated' || payload.event === 'listing.new') {
        const listing = payload.data;
        await this.processMLSListing(listing, 'TREB', listing.region);
        this.logger.info(`Processed TREB webhook: ${payload.event} for ${listing.mlsNumber}`);
      }
    } catch (error) {
      this.logger.error('Error processing TREB webhook:', error);
    }
  }

  async handleSalesforceWebhook(payload) {
    try {
      if (payload.sobjectType === 'Opportunity') {
        await this.processCRMOpportunity(payload.newValue, 'SALESFORCE');
        this.logger.info(`Processed Salesforce webhook for opportunity: ${payload.newValue.Id}`);
      }
    } catch (error) {
      this.logger.error('Error processing Salesforce webhook:', error);
    }
  }

  async handleHubSpotWebhook(payload) {
    try {
      for (const event of payload.events || []) {
        if (event.subscriptionType === 'contact.creation' || event.subscriptionType === 'contact.change') {
          const contact = event.objectId;
          const hubspotIntegration = this.integrations.get('hubspot_crm');
          if (hubspotIntegration && hubspotIntegration.status === 'active') {
            const contactData = await hubspotIntegration.client.getContacts({ contactId: contact });
            await this.processCRMContact(contactData, 'HUBSPOT');
          }
        }
      }
    } catch (error) {
      this.logger.error('Error processing HubSpot webhook:', error);
    }
  }
}

module.exports = MLSIntegrationHub;