/**
 * Database Sync Utility
 * Syncs MCP scraped data with the main API database
 */

import axios from 'axios';

export class DatabaseSync {
  constructor() {
    this.apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:4000/api';
    this.adminToken = process.env.ADMIN_TOKEN || null;
  }
  
  async syncCourtFilings(scrapedData) {
    const alerts = [];
    
    for (const finding of scrapedData.findings) {
      try {
        // Transform scraping data to alert format
        const alert = await this.transformToAlert(finding, 'COURT_FILING');
        alerts.push(alert);
      } catch (error) {
        console.error(`Error transforming finding:`, error.message);
      }
    }
    
    // Batch create alerts
    if (alerts.length > 0) {
      const result = await this.createAlerts(alerts);
      console.log(`✓ Synced ${alerts.length} court filings to database`);
      return result;
    }
    
    return { created: 0, message: 'No new alerts to sync' };
  }
  
  async transformToAlert(finding, source) {
    // Calculate priority level based on opportunity score
    let priority = 'LOW';
    if (finding.opportunityScore >= 70) priority = 'HIGH';
    else if (finding.opportunityScore >= 40) priority = 'MEDIUM';
    
    // Determine alert type
    let alertType = 'DISTRESSED_PROPERTY';
    if (finding.type === 'estate_sale') alertType = 'ESTATE_SALE';
    if (finding.type === 'tax_sale') alertType = 'TAX_SALE';
    if (finding.type === 'foreclosure') alertType = 'FORECLOSURE';
    
    // Extract location data
    const location = this.parseAddress(finding.address);
    
    const alert = {
      alertType,
      priority,
      title: this.generateAlertTitle(finding),
      description: this.generateAlertDescription(finding),
      
      // Location data
      address: finding.address || 'Address not specified',
      city: location.city || 'Toronto',
      province: location.province || 'ON',
      postalCode: location.postalCode || null,
      coordinates: null, // Would integrate with geocoding service
      
      // Financial data
      price: finding.amount || null,
      estimatedValue: finding.marketData?.estimatedValue || null,
      
      // Metadata
      source,
      sourceUrl: finding.url || null,
      externalId: finding.caseNumber || null,
      opportunityScore: finding.opportunityScore || 0,
      
      // Dates
      discoveredAt: new Date(),
      eventDate: finding.filingDate ? new Date(finding.filingDate) : new Date(),
      expiresAt: finding.daysUntilSale ? 
        new Date(Date.now() + finding.daysUntilSale * 24 * 60 * 60 * 1000) : 
        new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // Default 90 days
      
      // Additional data
      metadata: {
        caseNumber: finding.caseNumber,
        lender: finding.lender,
        daysUntilSale: finding.daysUntilSale,
        marketData: finding.marketData,
        rawContent: finding.rawContent ? finding.rawContent.substring(0, 500) : null,
        fallbackData: finding.fallback || false
      },
      
      status: 'ACTIVE'
    };
    
    return alert;
  }
  
  generateAlertTitle(finding) {
    const type = finding.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    const location = this.parseAddress(finding.address).city || 'GTA';
    
    if (finding.amount) {
      return `${type} - ${location} - $${finding.amount.toLocaleString()}`;
    }
    
    return `${type} - ${location}`;
  }
  
  generateAlertDescription(finding) {
    const parts = [];
    
    if (finding.address) {
      parts.push(`Property: ${finding.address}`);
    }
    
    if (finding.amount && finding.marketData?.estimatedValue) {
      const discount = Math.round((1 - finding.amount / finding.marketData.estimatedValue) * 100);
      parts.push(`Potential ${discount}% below market value`);
    }
    
    if (finding.daysUntilSale) {
      parts.push(`${finding.daysUntilSale} days until sale`);
    }
    
    if (finding.caseNumber) {
      parts.push(`Case: ${finding.caseNumber}`);
    }
    
    if (finding.opportunityScore) {
      parts.push(`Opportunity Score: ${finding.opportunityScore}/100`);
    }
    
    return parts.join(' • ');
  }
  
  parseAddress(address) {
    if (!address || address === 'Address not specified') {
      return { city: null, province: null, postalCode: null };
    }
    
    // Simple address parsing - in production would use a proper geocoding service
    const parts = address.split(',').map(p => p.trim());
    const city = parts.length >= 2 ? parts[parts.length - 2] : 'Toronto';
    const province = parts.length >= 3 ? parts[parts.length - 1].split(' ')[0] : 'ON';
    
    const postalMatch = address.match(/[A-Z]\d[A-Z]\s*\d[A-Z]\d/i);
    const postalCode = postalMatch ? postalMatch[0] : null;
    
    return { city, province, postalCode };
  }
  
  async createAlerts(alerts) {
    try {
      const response = await axios.post(`${this.apiBaseUrl}/admin/alerts/batch`, {
        alerts
      }, {
        headers: this.getAuthHeaders(),
        timeout: 30000
      });
      
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        // API endpoint doesn't exist yet - would need to be created
        console.warn('Batch alerts endpoint not available - storing locally');
        return this.storeAlertsLocally(alerts);
      }
      
      throw new Error(`Failed to sync alerts: ${error.message}`);
    }
  }
  
  getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'AgentRadar-MCP/1.0'
    };
    
    if (this.adminToken) {
      headers['Authorization'] = `Bearer ${this.adminToken}`;
    }
    
    return headers;
  }
  
  async storeAlertsLocally(alerts) {
    // Fallback: store in local JSON file for now
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `scraped-alerts-${timestamp}.json`;
    const filepath = path.join(process.cwd(), 'data', filename);
    
    try {
      await fs.mkdir(path.join(process.cwd(), 'data'), { recursive: true });
      await fs.writeFile(filepath, JSON.stringify(alerts, null, 2));
      
      console.log(`✓ Stored ${alerts.length} alerts locally: ${filename}`);
      return { created: alerts.length, localFile: filename };
    } catch (error) {
      console.error('Failed to store alerts locally:', error.message);
      return { created: 0, error: error.message };
    }
  }
  
  async getAlertStats() {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/alerts/stats`, {
        headers: this.getAuthHeaders()
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to get alert stats:', error.message);
      return null;
    }
  }
}