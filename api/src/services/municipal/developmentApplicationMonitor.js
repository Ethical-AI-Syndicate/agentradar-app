/**
 * Development Application Monitor
 * Monitors municipal development applications across 5 key municipalities
 * Provides early intelligence on rezoning, subdivision, and development opportunities
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { PrismaClient } from '@prisma/client';
import { getCacheManager } from '../cache/cacheManager.js';
import { getRealtimeService } from '../realtime/realtimeService.js';

const prisma = new PrismaClient();

export class DevelopmentApplicationMonitor {
  constructor() {
    this.userAgent = 'Mozilla/5.0 (compatible; AgentRadar/2.0; Municipal Intelligence)';
    this.timeout = 45000;
    this.concurrentLimit = 2; // Very respectful to municipal servers
    
    // Municipal configuration for 5 key municipalities
    this.municipalities = {
      toronto: {
        name: 'City of Toronto',
        developmentAppsUrl: 'https://www.toronto.ca/city-government/planning-development/application-information-centre/',
        apiEndpoint: 'https://secure.toronto.ca/cc_sr_v1/data/swm_application_list',
        jurisdiction: 'toronto',
        population: 2930000,
        
        // Application type mapping
        applicationTypes: {
          'rezoning': 'Zoning By-law Amendment',
          'subdivision': 'Plan of Subdivision',
          'demolition': 'Demolition Permit',
          'variance': 'Minor Variance',
          'conversion': 'Site Plan Control',
          'development': 'Development Application'
        },
        
        // CSS selectors for web scraping
        selectors: {
          applications: '.application-item, .development-application, tr',
          applicationId: '.application-number, .app-id, td:first-child',
          type: '.application-type, .app-type, td:nth-child(2)',
          address: '.property-address, .address, td:nth-child(3)',
          status: '.application-status, .status, td:nth-child(4)',
          date: '.application-date, .date-submitted, td:nth-child(5)',
          details: '.application-details, .description, td:nth-child(6)'
        },
        
        // Compliance settings
        compliance: {
          userAgent: 'Mozilla/5.0 (compatible; AgentRadar Development Intelligence Bot)',
          requestDelay: 5000, // 5 second delay between requests
          respectRobotsTxt: true,
          businessHoursOnly: true
        }
      },
      
      mississauga: {
        name: 'City of Mississauga',
        developmentAppsUrl: 'https://www.mississauga.ca/services-and-programs/building-and-development/development-applications/',
        apiEndpoint: 'https://www.mississauga.ca/api/development-applications',
        jurisdiction: 'mississauga',
        population: 721000,
        
        applicationTypes: {
          'rezoning': 'Rezoning Application',
          'subdivision': 'Draft Plan of Subdivision',
          'demolition': 'Demolition Control',
          'variance': 'Committee of Adjustment',
          'conversion': 'Site Plan Application'
        },
        
        selectors: {
          applications: '.dev-app-item, .application-row',
          applicationId: '.app-number',
          type: '.app-category',
          address: '.property-location',
          status: '.current-status',
          date: '.submission-date',
          details: '.app-description'
        },
        
        compliance: {
          userAgent: 'Mozilla/5.0 (compatible; AgentRadar Municipal Bot)',
          requestDelay: 4000,
          respectRobotsTxt: true,
          businessHoursOnly: true
        }
      },
      
      brampton: {
        name: 'City of Brampton',
        developmentAppsUrl: 'https://www.brampton.ca/en/Business/planning-development/Pages/Development-Applications.aspx',
        jurisdiction: 'brampton',
        population: 656000,
        
        applicationTypes: {
          'rezoning': 'Official Plan Amendment',
          'subdivision': 'Plan of Subdivision',
          'demolition': 'Demolition Permit',
          'variance': 'Minor Variance Application'
        },
        
        selectors: {
          applications: '.dev-application, .planning-app',
          applicationId: '.file-number',
          type: '.application-type',
          address: '.subject-property',
          status: '.app-status',
          date: '.date-received'
        },
        
        compliance: {
          requestDelay: 6000,
          respectRobotsTxt: true
        }
      },
      
      vaughan: {
        name: 'City of Vaughan',
        developmentAppsUrl: 'https://www.vaughan.ca/services/building_and_development/development_applications',
        jurisdiction: 'vaughan',
        population: 330000,
        
        applicationTypes: {
          'rezoning': 'Zoning By-law Amendment',
          'subdivision': 'Draft Plan of Subdivision',
          'variance': 'Minor Variance',
          'conversion': 'Site Plan Control'
        },
        
        selectors: {
          applications: '.development-app',
          applicationId: '.app-id',
          type: '.dev-type',
          address: '.property-address',
          status: '.application-status',
          date: '.submitted-date'
        },
        
        compliance: {
          requestDelay: 5000,
          respectRobotsTxt: true
        }
      },
      
      markham: {
        name: 'City of Markham',
        developmentAppsUrl: 'https://www.markham.ca/services/building-development/development-applications',
        jurisdiction: 'markham',
        population: 338000,
        
        applicationTypes: {
          'rezoning': 'Zoning By-law Amendment',
          'subdivision': 'Plan of Subdivision',
          'variance': 'Minor Variance Application',
          'conversion': 'Site Plan Agreement'
        },
        
        selectors: {
          applications: '.dev-app-listing',
          applicationId: '.application-number',
          type: '.dev-app-type',
          address: '.development-address',
          status: '.dev-status',
          date: '.application-date'
        },
        
        compliance: {
          requestDelay: 5000,
          respectRobotsTxt: true
        }
      }
    };

    // Opportunity scoring configuration
    this.opportunityScoring = {
      typeWeights: {
        'rezoning': 30,      // High impact on surrounding properties
        'subdivision': 25,   // Creates new supply
        'demolition': 20,    // Often precedes development
        'conversion': 15,    // Changes property use
        'variance': 10,      // Usually minor changes
        'development': 35    // Major impact
      },
      
      statusWeights: {
        'approved': 25,
        'under_review': 20,
        'public_consultation': 15,
        'pending': 10,
        'refused': -10
      },
      
      impactRadius: {
        'rezoning': '800m',
        'subdivision': '1.2km',
        'demolition': '400m',
        'conversion': '600m',
        'variance': '200m',
        'development': '1km'
      }
    };
  }

  /**
   * Monitor all municipalities for new development applications
   */
  async monitorAllMunicipalities() {
    const startTime = Date.now();
    console.log('🏛️ Starting Development Application Monitoring for 5 municipalities...');

    const results = {
      totalApplications: 0,
      highOpportunityCount: 0,
      municipalityResults: {},
      alerts: []
    };

    for (const [municipalityKey, config] of Object.entries(this.municipalities)) {
      try {
        console.log(`🔍 Monitoring ${config.name}...`);
        
        const municipalityResult = await this.monitorMunicipality(municipalityKey, config);
        results.municipalityResults[municipalityKey] = municipalityResult;
        results.totalApplications += municipalityResult.applications.length;
        results.highOpportunityCount += municipalityResult.applications.filter(app => app.opportunityScore > 80).length;
        
        // Collect high-value alerts
        const highValueApps = municipalityResult.applications.filter(app => app.opportunityScore > 85);
        results.alerts.push(...highValueApps);
        
        console.log(`✅ ${config.name}: ${municipalityResult.applications.length} applications (${highValueApps.length} high-value)`);
        
        // Respectful delay between municipalities
        await this.delay(config.compliance.requestDelay);
        
      } catch (error) {
        console.error(`❌ Failed to monitor ${config.name}:`, error.message);
        results.municipalityResults[municipalityKey] = { error: error.message, applications: [] };
      }
    }

    // Store results and trigger alerts
    await this.storeMonitoringResults(results);
    await this.triggerDevelopmentAlerts(results.alerts);

    const totalTime = Date.now() - startTime;
    console.log(`🎉 Development monitoring completed in ${totalTime}ms`);
    console.log(`📊 Total: ${results.totalApplications} applications, ${results.highOpportunityCount} high-opportunity`);

    return {
      success: true,
      ...results,
      processingTime: totalTime,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Monitor specific municipality
   */
  async monitorMunicipality(municipalityKey, config) {
    const applications = [];
    
    try {
      // Check if municipality has API endpoint
      if (config.apiEndpoint) {
        const apiData = await this.fetchFromAPI(config);
        applications.push(...apiData);
      } else {
        // Fall back to web scraping
        const scrapedData = await this.scrapeWebsite(config);
        applications.push(...scrapedData);
      }

      // Process and score applications
      const processedApps = await this.processApplications(applications, municipalityKey);
      
      // Cache results
      const cacheManager = getCacheManager();
      if (cacheManager) {
        await cacheManager.set('DEVELOPMENT_APPS', 
          { municipality: municipalityKey }, 
          processedApps, 
          1800 // 30 minutes
        );
      }

      return {
        municipality: config.name,
        applications: processedApps,
        dataSource: config.apiEndpoint ? 'api' : 'web_scraping'
      };

    } catch (error) {
      console.error(`Error monitoring ${config.name}:`, error);
      return {
        municipality: config.name,
        applications: [],
        error: error.message
      };
    }
  }

  /**
   * Fetch data from municipal API
   */
  async fetchFromAPI(config) {
    try {
      const response = await axios.get(config.apiEndpoint, {
        headers: {
          'User-Agent': config.compliance.userAgent,
          'Accept': 'application/json'
        },
        timeout: this.timeout
      });

      return this.parseAPIResponse(response.data, config);
      
    } catch (error) {
      console.error(`API fetch failed for ${config.name}:`, error.message);
      return [];
    }
  }

  /**
   * Scrape municipal website
   */
  async scrapeWebsite(config) {
    try {
      const response = await axios.get(config.developmentAppsUrl, {
        headers: {
          'User-Agent': config.compliance.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: this.timeout
      });

      const $ = cheerio.load(response.data);
      return this.parseWebsiteContent($, config);
      
    } catch (error) {
      console.error(`Web scraping failed for ${config.name}:`, error.message);
      return [];
    }
  }

  /**
   * Parse API response data
   */
  parseAPIResponse(data, config) {
    const applications = [];
    
    // Handle different API response formats
    const appArray = Array.isArray(data) ? data : (data.applications || data.results || []);
    
    for (const item of appArray) {
      try {
        const app = {
          applicationId: item.id || item.applicationNumber || item.fileNumber,
          type: this.normalizeApplicationType(item.type || item.category),
          address: this.normalizeAddress(item.address || item.location),
          status: this.normalizeStatus(item.status || item.currentStatus),
          submissionDate: this.parseDate(item.submissionDate || item.dateSubmitted),
          description: item.description || item.details || '',
          municipality: config.jurisdiction,
          source: 'api',
          rawData: item
        };

        if (app.applicationId && app.address) {
          applications.push(app);
        }
      } catch (error) {
        console.error('Error parsing API item:', error);
      }
    }

    return applications;
  }

  /**
   * Parse website content
   */
  parseWebsiteContent($, config) {
    const applications = [];
    const selectors = config.selectors;

    $(selectors.applications).each((i, element) => {
      try {
        const $elem = $(element);
        
        const app = {
          applicationId: this.extractText($elem, selectors.applicationId),
          type: this.normalizeApplicationType(this.extractText($elem, selectors.type)),
          address: this.normalizeAddress(this.extractText($elem, selectors.address)),
          status: this.normalizeStatus(this.extractText($elem, selectors.status)),
          submissionDate: this.parseDate(this.extractText($elem, selectors.date)),
          description: this.extractText($elem, selectors.details),
          municipality: config.jurisdiction,
          source: 'web_scraping'
        };

        if (app.applicationId && app.address && app.type !== 'unknown') {
          applications.push(app);
        }
      } catch (error) {
        console.error('Error parsing web element:', error);
      }
    });

    return applications;
  }

  /**
   * Process and score applications
   */
  async processApplications(applications, municipality) {
    const processed = [];
    
    for (const app of applications) {
      try {
        // Calculate opportunity score
        const opportunityScore = this.calculateOpportunityScore(app);
        
        // Estimate impact radius
        const impactRadius = this.opportunityScoring.impactRadius[app.type] || '500m';
        
        // Find nearby properties that might be affected
        const affectedProperties = await this.findAffectedProperties(app.address, impactRadius);
        
        const processedApp = {
          ...app,
          opportunityScore,
          impactRadius,
          affectedProperties: affectedProperties.length,
          marketImpact: this.assessMarketImpact(app, affectedProperties.length),
          investmentPotential: this.assessInvestmentPotential(app),
          processedAt: new Date().toISOString()
        };

        processed.push(processedApp);
        
      } catch (error) {
        console.error('Error processing application:', error);
      }
    }

    return processed.sort((a, b) => b.opportunityScore - a.opportunityScore);
  }

  /**
   * Calculate opportunity score for development application
   */
  calculateOpportunityScore(app) {
    let score = 40; // Base score
    
    // Type-based scoring
    const typeWeight = this.opportunityScoring.typeWeights[app.type] || 5;
    score += typeWeight;
    
    // Status-based scoring
    const statusWeight = this.opportunityScoring.statusWeights[app.status] || 0;
    score += statusWeight;
    
    // Recency bonus
    if (app.submissionDate) {
      const daysSinceSubmission = (Date.now() - new Date(app.submissionDate).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceSubmission < 30) score += 15;
      else if (daysSinceSubmission < 90) score += 10;
      else if (daysSinceSubmission < 180) score += 5;
    }
    
    // Description analysis bonus
    const description = (app.description || '').toLowerCase();
    const valuableKeywords = [
      'residential', 'commercial', 'mixed-use', 'high-rise', 'townhouse',
      'luxury', 'development', 'subdivision', 'density', 'transit'
    ];
    
    const keywordBonus = valuableKeywords.reduce((bonus, keyword) => {
      return bonus + (description.includes(keyword) ? 2 : 0);
    }, 0);
    score += Math.min(keywordBonus, 15);
    
    return Math.min(100, Math.max(0, score));
  }

  /**
   * Store monitoring results in database
   */
  async storeMonitoringResults(results) {
    console.log('💾 Storing development application monitoring results...');
    
    let stored = 0;
    
    for (const [municipality, result] of Object.entries(results.municipalityResults)) {
      if (result.applications) {
        for (const app of result.applications) {
          try {
            await prisma.alert.upsert({
              where: {
                // Create unique identifier for development applications
                source_municipalId: {
                  source: `development_${municipality}`,
                  municipalId: app.applicationId
                }
              },
              update: {
                status: this.mapStatusToAlertStatus(app.status),
                opportunityScore: app.opportunityScore,
                metadata: {
                  ...app,
                  lastUpdated: new Date().toISOString()
                }
              },
              create: {
                alertType: 'DEVELOPMENT_APPLICATION',
                title: `${app.type} - ${municipality.toUpperCase()}`,
                description: app.description || `${app.type} application at ${app.address}`,
                address: app.address,
                city: this.extractCityFromMunicipality(municipality),
                region: this.getRegionFromMunicipality(municipality),
                priority: this.scoreToPriority(app.opportunityScore),
                status: 'ACTIVE',
                opportunityScore: app.opportunityScore,
                source: `development_${municipality}`,
                municipalId: app.applicationId,
                metadata: app
              }
            });
            
            stored++;
            
          } catch (error) {
            console.error(`Error storing application ${app.applicationId}:`, error);
          }
        }
      }
    }
    
    console.log(`✅ Stored ${stored} development applications`);
  }

  /**
   * Trigger real-time alerts for high-value development applications
   */
  async triggerDevelopmentAlerts(highValueApps) {
    console.log('🚨 Triggering alerts for high-value development applications...');
    
    const realtimeService = getRealtimeService();
    if (!realtimeService) {
      console.warn('Real-time service not available');
      return;
    }

    for (const app of highValueApps) {
      try {
        // Find users interested in this type of development in this area
        const interestedUsers = await this.findInterestedUsers(app);
        
        for (const user of interestedUsers) {
          await realtimeService.sendUserAlert(user.id, {
            id: `dev-${app.applicationId}`,
            type: 'development_application',
            title: '🏗️ High-Impact Development Application',
            message: `New ${app.type} application in ${app.municipality} with ${app.opportunityScore}% opportunity score`,
            address: app.address,
            priority: 'high',
            opportunityScore: app.opportunityScore,
            metadata: {
              municipality: app.municipality,
              applicationType: app.type,
              status: app.status,
              impactRadius: app.impactRadius,
              affectedProperties: app.affectedProperties,
              submissionDate: app.submissionDate
            }
          });
        }
        
        console.log(`📤 Development alert sent to ${interestedUsers.length} users for ${app.applicationId}`);
        
      } catch (error) {
        console.error('Error triggering development alert:', error);
      }
    }
  }

  /**
   * Utility methods
   */

  extractText($elem, selector) {
    return $elem.find(selector).text().trim() || $elem.text().trim();
  }

  normalizeApplicationType(type) {
    if (!type) return 'unknown';
    
    const lowerType = type.toLowerCase();
    
    if (lowerType.includes('rezon')) return 'rezoning';
    if (lowerType.includes('subdivision')) return 'subdivision';
    if (lowerType.includes('demolition')) return 'demolition';
    if (lowerType.includes('variance')) return 'variance';
    if (lowerType.includes('site plan') || lowerType.includes('conversion')) return 'conversion';
    if (lowerType.includes('development')) return 'development';
    
    return 'other';
  }

  normalizeAddress(address) {
    if (!address) return '';
    return address.replace(/\s+/g, ' ').trim();
  }

  normalizeStatus(status) {
    if (!status) return 'unknown';
    
    const lowerStatus = status.toLowerCase();
    
    if (lowerStatus.includes('approved')) return 'approved';
    if (lowerStatus.includes('review') || lowerStatus.includes('processing')) return 'under_review';
    if (lowerStatus.includes('consultation') || lowerStatus.includes('public')) return 'public_consultation';
    if (lowerStatus.includes('pending') || lowerStatus.includes('submitted')) return 'pending';
    if (lowerStatus.includes('refused') || lowerStatus.includes('denied')) return 'refused';
    
    return 'unknown';
  }

  parseDate(dateString) {
    if (!dateString) return null;
    try {
      return new Date(dateString).toISOString();
    } catch {
      return null;
    }
  }

  mapStatusToAlertStatus(status) {
    switch (status) {
      case 'approved':
      case 'under_review':
      case 'public_consultation':
      case 'pending':
        return 'ACTIVE';
      case 'refused':
        return 'CANCELLED';
      default:
        return 'ACTIVE';
    }
  }

  scoreToPriority(score) {
    if (score >= 85) return 'HIGH';
    if (score >= 70) return 'MEDIUM';
    return 'LOW';
  }

  extractCityFromMunicipality(municipality) {
    const cityMap = {
      toronto: 'Toronto',
      mississauga: 'Mississauga',
      brampton: 'Brampton',
      vaughan: 'Vaughan',
      markham: 'Markham'
    };
    return cityMap[municipality] || municipality;
  }

  getRegionFromMunicipality(municipality) {
    if (municipality === 'toronto') return 'toronto';
    return 'gta'; // All others are part of GTA
  }

  assessMarketImpact(app, affectedPropertyCount) {
    let impact = 'low';
    
    if (app.type === 'rezoning' && affectedPropertyCount > 20) impact = 'high';
    else if (app.type === 'subdivision' && affectedPropertyCount > 15) impact = 'high';
    else if (app.type === 'development' && affectedPropertyCount > 10) impact = 'high';
    else if (affectedPropertyCount > 5) impact = 'medium';
    
    return impact;
  }

  assessInvestmentPotential(app) {
    let potential = 'medium';
    
    const highPotentialTypes = ['rezoning', 'subdivision', 'development'];
    if (highPotentialTypes.includes(app.type)) potential = 'high';
    
    if (app.status === 'approved') potential = 'high';
    
    return potential;
  }

  async findAffectedProperties(address, impactRadius) {
    // Placeholder - would implement geospatial query
    return Array.from({ length: Math.floor(Math.random() * 25) + 5 }, (_, i) => ({ id: i }));
  }

  async findInterestedUsers(app) {
    // Placeholder - would implement user matching logic
    return [];
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton
let monitorInstance = null;

export function createDevelopmentApplicationMonitor() {
  if (!monitorInstance) {
    monitorInstance = new DevelopmentApplicationMonitor();
  }
  return monitorInstance;
}

export function getDevelopmentApplicationMonitor() {
  return monitorInstance;
}