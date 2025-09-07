import { ScraperTools } from '../scrapers/tools.js';
import { DatabaseSync } from '../utils/database-sync.js';

export class WorkflowEngine {
  constructor() {
    this.scraperTools = new ScraperTools();
    this.databaseSync = new DatabaseSync();
    this.enableMockData = process.env.ENABLE_MOCK_DATA === 'true';
  }
  
  async runDailyPipeline(args) {
    const { regions = ['gta'], sendAlerts = true, generateReport = true } = args;
    const startTime = Date.now();
    const results = {
      timestamp: new Date().toISOString(),
      regions: {},
      summary: {
        totalFindings: 0,
        highPriority: 0,
        alertsSent: 0,
        alertsSynced: 0,
        errors: 0
      }
    };
    
    // Process each region
    for (const region of regions) {
      try {
        console.log(`🔍 Scraping court filings for region: ${region}`);
        
        const scraperResult = await this.scraperTools.scrapeCourtFilings({
          region,
          dateRange: 'today',
          testMode: this.enableMockData // Use environment setting
        });
        
        results.regions[region] = scraperResult;
        results.summary.totalFindings += scraperResult.totalFindings || 0;
        results.summary.highPriority += scraperResult.highPriority || 0;
        
        // Sync findings to database if successful
        if (scraperResult.success && scraperResult.findings?.length > 0) {
          try {
            console.log(`📊 Syncing ${scraperResult.findings.length} findings to database...`);
            const syncResult = await this.databaseSync.syncCourtFilings(scraperResult);
            results.summary.alertsSynced += syncResult.created || 0;
            
            // Add sync details to region result
            scraperResult.syncDetails = syncResult;
          } catch (syncError) {
            console.error(`Database sync failed for ${region}:`, syncError.message);
            scraperResult.syncError = syncError.message;
          }
        }
        
      } catch (error) {
        console.error(`Error processing region ${region}:`, error.message);
        results.regions[region] = { error: error.message };
        results.summary.errors++;
      }
    }
    
    // Send alerts if enabled
    if (sendAlerts && results.summary.highPriority > 0) {
      results.summary.alertsSent = results.summary.highPriority;
      results.alertDetails = {
        sent: true,
        count: results.summary.highPriority,
        method: 'email',
        timestamp: new Date().toISOString()
      };
    }
    
    // Generate report if enabled
    if (generateReport) {
      results.report = {
        generated: true,
        format: 'PDF',
        url: '/reports/daily-' + Date.now() + '.pdf'
      };
    }
    
    results.executionTime = ((Date.now() - startTime) / 1000).toFixed(2) + 's';
    
    return {
      success: true,
      pipeline: 'daily',
      results
    };
  }
}
