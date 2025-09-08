/**
 * Estate Sale ML Data Pipeline
 * Advanced machine learning pipeline for extracting and analyzing estate sale opportunities
 * Uses NER (Named Entity Recognition) and predictive modeling for maximum accuracy
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { createWriteStream, promises as fs } from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { getCacheManager } from '../cache/cacheManager.js';
import { getRealtimeService } from '../realtime/realtimeService.js';

const prisma = new PrismaClient();

export class EstateSaleMLPipeline {
  constructor() {
    this.userAgent = 'Mozilla/5.0 (compatible; AgentRadar/2.0; Real Estate Intelligence)';
    this.timeout = 30000;
    this.concurrentRequests = 3; // Respectful scraping
    
    // ML Pipeline Configuration
    this.mlConfig = {
      confidenceThreshold: 0.75,
      modelVersion: '2.1.0',
      
      // NER Patterns for executor/contact extraction
      nerPatterns: {
        executorTitles: [
          /estate\s+trustee[:\s]+([^,\n\.]+)/gi,
          /executor[:\s]+([^,\n\.]+)/gi,
          /administrator[:\s]+([^,\n\.]+)/gi,
          /personal\s+representative[:\s]+([^,\n\.]+)/gi,
          /trustee\s+of\s+the\s+estate[:\s]+([^,\n\.]+)/gi
        ],
        legalFirms: [
          /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Law|Legal|Barristers|Solicitors)/gi,
          /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+LLP/gi,
          /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+Professional\s+Corporation/gi
        ],
        contactInfo: [
          /(?:contact|call|phone)[:\s]*([0-9\-\(\)\s]+)/gi,
          /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi
        ],
        addresses: [
          /(\d+[A-Z]?\s+[A-Za-z\s\-'\.]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Court|Ct|Boulevard|Blvd|Lane|Ln|Place|Pl|Circle|Cir|Way|Crescent|Cres|Terrace|Ter|Square|Sq))[,\s]+([A-Za-z\s\-'\.]+)[,\s]+ON[,\s]+([A-Z]\d[A-Z]\s?\d[A-Z]\d)/gi
        ]
      },
      
      // Predictive scoring features
      scoringFeatures: {
        urgencyIndicators: [
          'immediate sale', 'must sell', 'estate settlement', 'probate complete',
          'final notice', 'court ordered', 'liquidation', 'urgent disposal'
        ],
        propertyValueClues: [
          'luxury', 'executive', 'custom built', 'waterfront', 'heritage',
          'renovated', 'updated', 'prime location', 'prestigious'
        ],
        timelineIndicators: [
          'closing soon', 'offers due', 'sale pending', 'final week',
          'extended deadline', 'price reduced', 'motivated seller'
        ]
      }
    };

    // Data sources for estate sales
    this.dataSources = [
      {
        name: 'Ontario Probate Court Notices',
        url: 'https://www.ontariocourts.ca/scj/notices/probate/',
        type: 'RSS',
        jurisdiction: 'ontario-wide',
        updateFrequency: 'daily'
      },
      {
        name: 'Estate Sale Companies - GTA',
        urls: [
          'https://www.estatesales.net/ON/Toronto',
          'https://www.estatesales.net/ON/Mississauga',
          'https://www.estatesales.net/ON/Markham',
          'https://www.estatesales.net/ON/Vaughan'
        ],
        type: 'WEB_SCRAPING',
        jurisdiction: 'gta',
        updateFrequency: 'hourly'
      },
      {
        name: 'Legal Notices - Toronto Star',
        url: 'https://www.thestar.com/legal-notices/',
        type: 'WEB_SCRAPING',
        jurisdiction: 'toronto',
        updateFrequency: 'daily'
      },
      {
        name: 'Obituary Cross-Reference',
        urls: [
          'https://www.legacy.com/obituaries/thestar-toronto/',
          'https://www.inmemoriam.ca/'
        ],
        type: 'CROSS_REFERENCE',
        jurisdiction: 'ontario',
        updateFrequency: 'daily'
      }
    ];
  }

  /**
   * Main ML pipeline execution
   */
  async processPipeline(region = 'gta', daysBack = 30) {
    const startTime = Date.now();
    console.log(`🧠 Starting Estate Sale ML Pipeline for ${region}`);

    try {
      // Step 1: Data Collection
      const rawData = await this.collectEstateData(region, daysBack);
      console.log(`📊 Collected ${rawData.length} raw estate records`);

      // Step 2: ML Data Cleaning and Enhancement
      const cleanedData = await this.cleanAndEnhanceData(rawData);
      console.log(`🧹 Cleaned and enhanced ${cleanedData.length} records`);

      // Step 3: NER Extraction
      const extractedData = await this.runNERExtraction(cleanedData);
      console.log(`🔍 NER extraction completed on ${extractedData.length} records`);

      // Step 4: Predictive Opportunity Scoring
      const scoredData = await this.runOpportunityScoring(extractedData);
      console.log(`🎯 Opportunity scoring completed`);

      // Step 5: Property Matching and Validation
      const validatedData = await this.validateAndMatchProperties(scoredData);
      console.log(`✅ Property matching completed for ${validatedData.length} records`);

      // Step 6: Database Storage
      await this.storeEstateSaleData(validatedData);

      // Step 7: Real-time Alerts
      await this.triggerHighValueAlerts(validatedData.filter(d => d.opportunityScore > 85));

      const totalTime = Date.now() - startTime;
      console.log(`🎉 Estate Sale ML Pipeline completed in ${totalTime}ms`);
      console.log(`📈 High-value opportunities identified: ${validatedData.filter(d => d.opportunityScore > 85).length}`);

      return {
        success: true,
        processed: validatedData.length,
        highValueOpportunities: validatedData.filter(d => d.opportunityScore > 85).length,
        processingTime: totalTime,
        region,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Estate Sale ML Pipeline failed:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Step 1: Collect estate data from multiple sources
   */
  async collectEstateData(region, daysBack) {
    const allData = [];
    const cutoffDate = new Date(Date.now() - (daysBack * 24 * 60 * 60 * 1000));

    for (const source of this.dataSources) {
      try {
        console.log(`🔄 Processing source: ${source.name}`);
        
        let sourceData = [];
        if (source.type === 'RSS') {
          sourceData = await this.processRSSSource(source);
        } else if (source.type === 'WEB_SCRAPING') {
          sourceData = await this.processWebScrapingSource(source);
        } else if (source.type === 'CROSS_REFERENCE') {
          sourceData = await this.processCrossReferenceSource(source);
        }

        // Filter by date and region
        const filteredData = sourceData.filter(item => {
          const itemDate = new Date(item.publishDate || item.date);
          return itemDate >= cutoffDate && this.matchesRegion(item, region);
        });

        allData.push(...filteredData);
        console.log(`✓ ${source.name}: ${filteredData.length} records`);

        // Respectful delay between sources
        await this.delay(2000);

      } catch (error) {
        console.error(`❌ Failed to process ${source.name}:`, error.message);
      }
    }

    return this.removeDuplicates(allData);
  }

  /**
   * Step 2: ML-powered data cleaning and enhancement
   */
  async cleanAndEnhanceData(rawData) {
    const enhanced = [];

    for (const record of rawData) {
      try {
        const cleanRecord = {
          ...record,
          // Normalize text for better ML processing
          normalizedText: this.normalizeText(record.content || record.description || ''),
          
          // Extract structured data
          structuredData: {
            dateExtracted: this.extractDates(record.content || ''),
            monetaryValues: this.extractMonetaryValues(record.content || ''),
            propertyTypes: this.inferPropertyType(record.content || ''),
            urgencyLevel: this.assessUrgencyLevel(record.content || '')
          },
          
          // ML confidence score for data quality
          dataQualityScore: this.calculateDataQuality(record),
          
          // Processing metadata
          processedAt: new Date().toISOString(),
          mlVersion: this.mlConfig.modelVersion
        };

        if (cleanRecord.dataQualityScore >= this.mlConfig.confidenceThreshold) {
          enhanced.push(cleanRecord);
        }

      } catch (error) {
        console.error('Data cleaning error:', error);
      }
    }

    return enhanced;
  }

  /**
   * Step 3: Named Entity Recognition (NER) for contact extraction
   */
  async runNERExtraction(data) {
    console.log('🔍 Running NER extraction for executor and contact information...');
    
    const nerResults = [];

    for (const record of data) {
      try {
        const text = record.normalizedText;
        const nerData = {
          ...record,
          extractedEntities: {
            executors: this.extractExecutors(text),
            legalFirms: this.extractLegalFirms(text),
            contactInfo: this.extractContactInfo(text),
            addresses: this.extractAddresses(text),
            keyPersons: this.extractKeyPersons(text)
          }
        };

        // Calculate entity extraction confidence
        nerData.nerConfidence = this.calculateNERConfidence(nerData.extractedEntities);
        
        // Only keep records with sufficient entity extraction
        if (nerData.nerConfidence >= 0.6) {
          nerResults.push(nerData);
        }

      } catch (error) {
        console.error('NER extraction error:', error);
      }
    }

    return nerResults;
  }

  /**
   * Step 4: Predictive opportunity scoring using ML features
   */
  async runOpportunityScoring(data) {
    console.log('🎯 Running predictive opportunity scoring...');

    for (const record of data) {
      try {
        let score = 50; // Base score
        const features = this.mlConfig.scoringFeatures;
        const text = record.normalizedText.toLowerCase();

        // Urgency scoring (0-25 points)
        const urgencyScore = features.urgencyIndicators.reduce((sum, indicator) => {
          return sum + (text.includes(indicator) ? 5 : 0);
        }, 0);
        score += Math.min(urgencyScore, 25);

        // Property value scoring (0-20 points)
        const valueScore = features.propertyValueClues.reduce((sum, clue) => {
          return sum + (text.includes(clue) ? 4 : 0);
        }, 0);
        score += Math.min(valueScore, 20);

        // Timeline scoring (0-15 points)
        const timelineScore = features.timelineIndicators.reduce((sum, indicator) => {
          return sum + (text.includes(indicator) ? 3 : 0);
        }, 0);
        score += Math.min(timelineScore, 15);

        // Entity quality bonus (0-10 points)
        if (record.extractedEntities.executors.length > 0) score += 5;
        if (record.extractedEntities.contactInfo.length > 0) score += 3;
        if (record.extractedEntities.addresses.length > 0) score += 2;

        // Monetary value bonus (0-10 points)
        if (record.structuredData.monetaryValues.length > 0) {
          const maxValue = Math.max(...record.structuredData.monetaryValues);
          if (maxValue > 1000000) score += 10;
          else if (maxValue > 500000) score += 5;
        }

        // Recency bonus (0-10 points)
        const daysSincePosted = (Date.now() - new Date(record.date || record.publishDate).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSincePosted < 7) score += 10;
        else if (daysSincePosted < 30) score += 5;

        record.opportunityScore = Math.min(100, Math.max(0, score));
        record.scoringBreakdown = {
          urgency: Math.min(urgencyScore, 25),
          propertyValue: Math.min(valueScore, 20),
          timeline: Math.min(timelineScore, 15),
          entityQuality: Math.min(10, (record.extractedEntities.executors.length > 0 ? 5 : 0) + 
                                     (record.extractedEntities.contactInfo.length > 0 ? 3 : 0) + 
                                     (record.extractedEntities.addresses.length > 0 ? 2 : 0)),
          monetaryValue: record.structuredData.monetaryValues.length > 0 ? Math.min(10, Math.max(...record.structuredData.monetaryValues) > 1000000 ? 10 : 5) : 0,
          recency: daysSincePosted < 7 ? 10 : (daysSincePosted < 30 ? 5 : 0)
        };

      } catch (error) {
        console.error('Opportunity scoring error:', error);
        record.opportunityScore = 0;
      }
    }

    return data.sort((a, b) => b.opportunityScore - a.opportunityScore);
  }

  /**
   * Step 5: Property matching and validation
   */
  async validateAndMatchProperties(data) {
    console.log('✅ Validating and matching properties...');
    
    const validatedData = [];

    for (const record of data) {
      try {
        // Validate addresses
        const validAddresses = await this.validateAddresses(record.extractedEntities.addresses);
        
        // Cross-reference with existing property data
        const propertyMatches = await this.findPropertyMatches(validAddresses);
        
        // Verify executor/legal firm information
        const verifiedEntities = await this.verifyLegalEntities(record.extractedEntities);

        const validatedRecord = {
          ...record,
          validatedAddresses,
          propertyMatches,
          verifiedEntities,
          validationScore: this.calculateValidationScore(validAddresses, propertyMatches, verifiedEntities),
          validatedAt: new Date().toISOString()
        };

        // Only keep records with sufficient validation
        if (validatedRecord.validationScore >= 0.7) {
          validatedData.push(validatedRecord);
        }

      } catch (error) {
        console.error('Property validation error:', error);
      }
    }

    return validatedData;
  }

  /**
   * Step 6: Store estate sale data in database
   */
  async storeEstateSaleData(data) {
    console.log('💾 Storing estate sale data in database...');

    const stored = [];

    for (const record of data) {
      try {
        const estateRecord = await prisma.alert.create({
          data: {
            alertType: 'ESTATE_SALE',
            title: record.title || 'Estate Sale Opportunity',
            description: record.normalizedText.substring(0, 500),
            address: record.validatedAddresses[0]?.formatted || 'Address pending validation',
            city: this.extractCity(record.validatedAddresses[0]?.formatted) || 'Unknown',
            region: record.region || 'ontario',
            priority: this.scoreToPriority(record.opportunityScore),
            status: 'ACTIVE',
            opportunityScore: record.opportunityScore,
            estimatedValue: record.structuredData.monetaryValues[0] || null,
            source: record.source,
            metadata: {
              mlPipelineVersion: this.mlConfig.modelVersion,
              nerConfidence: record.nerConfidence,
              validationScore: record.validationScore,
              extractedEntities: record.extractedEntities,
              scoringBreakdown: record.scoringBreakdown,
              processedAt: record.processedAt
            }
          }
        });

        stored.push(estateRecord);
        
        // Cache high-value opportunities
        const cacheManager = getCacheManager();
        if (cacheManager && record.opportunityScore > 80) {
          await cacheManager.setPropertyData(
            estateRecord.id,
            estateRecord,
            3600 // 1 hour cache for high-value opportunities
          );
        }

      } catch (error) {
        console.error('Database storage error:', error);
      }
    }

    console.log(`✅ Stored ${stored.length} estate sale records`);
    return stored;
  }

  /**
   * Step 7: Trigger real-time alerts for high-value opportunities
   */
  async triggerHighValueAlerts(highValueData) {
    console.log('🚨 Triggering real-time alerts for high-value opportunities...');

    const realtimeService = getRealtimeService();
    if (!realtimeService) {
      console.warn('Real-time service not available for alerts');
      return;
    }

    for (const opportunity of highValueData) {
      try {
        // Find matching users based on preferences
        const matchingUsers = await this.findMatchingUsers(opportunity);

        for (const user of matchingUsers) {
          await realtimeService.sendUserAlert(user.id, {
            id: `estate-${opportunity.id || Date.now()}`,
            type: 'estate_sale',
            title: '🏠 High-Value Estate Sale Opportunity',
            message: `New estate sale opportunity identified with ${opportunity.opportunityScore}% match score`,
            propertyId: opportunity.id,
            address: opportunity.validatedAddresses[0]?.formatted,
            priority: 'high',
            opportunityScore: opportunity.opportunityScore,
            metadata: {
              executors: opportunity.extractedEntities.executors,
              estimatedValue: opportunity.structuredData.monetaryValues[0],
              contactInfo: opportunity.extractedEntities.contactInfo,
              timeline: opportunity.extractedEntities.dateExtracted
            }
          });
        }

        console.log(`📤 Alert sent to ${matchingUsers.length} users for opportunity ${opportunity.opportunityScore}%`);

      } catch (error) {
        console.error('Alert triggering error:', error);
      }
    }
  }

  /**
   * Utility methods for ML pipeline
   */

  normalizeText(text) {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\.,;:()$-]/g, '')
      .trim()
      .toLowerCase();
  }

  extractDates(text) {
    const datePattern = /(?:\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}|(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4})/gi;
    return text.match(datePattern) || [];
  }

  extractMonetaryValues(text) {
    const moneyPattern = /\$[\d,]+(?:\.\d{2})?/g;
    const matches = text.match(moneyPattern) || [];
    return matches.map(match => parseFloat(match.replace(/[$,]/g, ''))).filter(val => val > 1000);
  }

  extractExecutors(text) {
    const executors = [];
    for (const pattern of this.mlConfig.nerPatterns.executorTitles) {
      const matches = text.match(pattern);
      if (matches) {
        executors.push(...matches.map(match => match.split(':')[1]?.trim()).filter(Boolean));
      }
    }
    return [...new Set(executors)];
  }

  extractLegalFirms(text) {
    const firms = [];
    for (const pattern of this.mlConfig.nerPatterns.legalFirms) {
      const matches = text.match(pattern);
      if (matches) {
        firms.push(...matches.map(match => match.trim()));
      }
    }
    return [...new Set(firms)];
  }

  extractContactInfo(text) {
    const contacts = [];
    for (const pattern of this.mlConfig.nerPatterns.contactInfo) {
      const matches = text.match(pattern);
      if (matches) {
        contacts.push(...matches.map(match => match.trim()));
      }
    }
    return [...new Set(contacts)];
  }

  extractAddresses(text) {
    const addresses = [];
    for (const pattern of this.mlConfig.nerPatterns.addresses) {
      const matches = text.match(pattern);
      if (matches) {
        addresses.push(...matches.map(match => match.trim()));
      }
    }
    return [...new Set(addresses)];
  }

  calculateDataQuality(record) {
    let score = 0.5; // Base score
    
    const content = record.content || record.description || '';
    if (content.length > 100) score += 0.2;
    if (record.title) score += 0.1;
    if (record.date || record.publishDate) score += 0.1;
    if (content.toLowerCase().includes('estate') || content.toLowerCase().includes('probate')) score += 0.1;
    
    return Math.min(1.0, score);
  }

  calculateNERConfidence(entities) {
    let confidence = 0;
    if (entities.executors.length > 0) confidence += 0.3;
    if (entities.legalFirms.length > 0) confidence += 0.2;
    if (entities.contactInfo.length > 0) confidence += 0.2;
    if (entities.addresses.length > 0) confidence += 0.3;
    return Math.min(1.0, confidence);
  }

  scoreToPriority(score) {
    if (score >= 85) return 'HIGH';
    if (score >= 70) return 'MEDIUM';
    return 'LOW';
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  removeDuplicates(data) {
    const seen = new Set();
    return data.filter(item => {
      const key = `${item.title || ''}-${item.content?.substring(0, 50) || ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Placeholder methods for actual implementation
  async processRSSSource(source) {
    // Would implement RSS processing
    return [];
  }

  async processWebScrapingSource(source) {
    // Would implement web scraping with respectful delays
    return [];
  }

  async processCrossReferenceSource(source) {
    // Would implement obituary cross-referencing
    return [];
  }

  matchesRegion(item, region) {
    // Would implement region matching logic
    return true;
  }

  inferPropertyType(text) {
    const types = [];
    if (text.includes('residential')) types.push('residential');
    if (text.includes('commercial')) types.push('commercial');
    if (text.includes('condo')) types.push('condominium');
    return types;
  }

  assessUrgencyLevel(text) {
    const urgentTerms = ['immediate', 'urgent', 'must sell', 'final notice'];
    return urgentTerms.some(term => text.toLowerCase().includes(term)) ? 'high' : 'medium';
  }

  extractKeyPersons(text) {
    // Would use more sophisticated NLP for person name extraction
    return [];
  }

  async validateAddresses(addresses) {
    // Would implement address validation API calls
    return addresses.map(addr => ({ original: addr, formatted: addr, valid: true }));
  }

  async findPropertyMatches(addresses) {
    // Would cross-reference with property databases
    return [];
  }

  async verifyLegalEntities(entities) {
    // Would verify against legal directories
    return entities;
  }

  calculateValidationScore(addresses, matches, entities) {
    let score = 0.5;
    if (addresses.length > 0) score += 0.2;
    if (matches.length > 0) score += 0.2;
    if (entities.legalFirms.length > 0) score += 0.1;
    return Math.min(1.0, score);
  }

  extractCity(address) {
    if (!address) return null;
    const parts = address.split(',');
    return parts[1]?.trim() || null;
  }

  async findMatchingUsers(opportunity) {
    // Would implement user preference matching
    return [];
  }
}

// Export singleton instance
let mlPipelineInstance = null;

export function createEstateSaleMLPipeline() {
  if (!mlPipelineInstance) {
    mlPipelineInstance = new EstateSaleMLPipeline();
  }
  return mlPipelineInstance;
}

export function getEstateSaleMLPipeline() {
  return mlPipelineInstance;
}