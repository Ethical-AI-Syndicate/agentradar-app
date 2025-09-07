#!/usr/bin/env node
/**
 * AgentRadar MCP Server
 * Main server file for Model Context Protocol integration
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema, 
  ListToolsRequestSchema 
} from '@modelcontextprotocol/sdk/types.js';
import { ScraperTools } from '../scrapers/tools.js';
import { PropertyAnalyzer } from '../scrapers/analyzer.js';
import { SystemMonitor } from '../monitoring/monitor.js';
import { DeploymentManager } from '../deployment/manager.js';
import { WorkflowEngine } from '../chains/workflow-engine.js';
import { db } from '../database/database.js';

class AgentRadarMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'agentradar-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );
    
    // Initialize components
    this.scraperTools = new ScraperTools();
    this.propertyAnalyzer = new PropertyAnalyzer();
    this.systemMonitor = new SystemMonitor();
    this.deploymentManager = new DeploymentManager();
    this.workflowEngine = new WorkflowEngine();
    
    this.setupHandlers();
    this.logStartup();
    
    // Initialize database
    this.initDatabase();
  }
  
  async initDatabase() {
    try {
      await db.init();
      console.error('[AgentRadar] Database initialized successfully');
      
      // Optional: Run cleanup on startup
      await db.cleanupExpiredCache();
      console.error('[AgentRadar] Cache cleanup completed');
    } catch (error) {
      console.error('[AgentRadar] Database initialization failed:', error.message);
    }
  }
  
  logStartup() {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] AgentRadar MCP Server v1.0.0`);
    console.error(`[${timestamp}] Ready for connections`);
  }

  setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'scrape_court_filings',
          description: 'Scrape power of sale and foreclosure filings from Ontario courts',
          inputSchema: {
            type: 'object',
            properties: {
              region: {
                type: 'string',
                description: 'Region to scrape',
                enum: ['gta', 'toronto', 'york', 'peel', 'durham', 'halton']
              },
              dateRange: {
                type: 'string',
                description: 'Date range for filings',
                enum: ['today', 'week', 'month'],
                default: 'today'
              },
              testMode: {
                type: 'boolean',
                description: 'Run in test mode with mock data',
                default: false
              }
            },
            required: ['region']
          }
        },
        {
          name: 'analyze_property',
          description: 'Analyze a property for investment potential and market value',
          inputSchema: {
            type: 'object',
            properties: {
              address: {
                type: 'string',
                description: 'Property address to analyze'
              },
              includeComps: {
                type: 'boolean',
                description: 'Include comparable properties',
                default: true
              },
              checkLiens: {
                type: 'boolean',
                description: 'Check for liens and encumbrances',
                default: true
              },
              historicalData: {
                type: 'boolean',
                description: 'Include historical price data',
                default: false
              }
            },
            required: ['address']
          }
        },
        {
          name: 'get_system_status',
          description: 'Get current system status and operational metrics',
          inputSchema: {
            type: 'object',
            properties: {
              detailed: {
                type: 'boolean',
                description: 'Include detailed metrics',
                default: false
              }
            }
          }
        },
        {
          name: 'search_estate_sales',
          description: 'Search for estate sales and probate properties',
          inputSchema: {
            type: 'object',
            properties: {
              area: {
                type: 'string',
                description: 'Area to search (city or neighborhood)'
              },
              radius: {
                type: 'number',
                description: 'Search radius in kilometers',
                default: 5
              },
              daysBack: {
                type: 'number',
                description: 'Number of days to search back',
                default: 30
              }
            },
            required: ['area']
          }
        },
        {
          name: 'monitor_development_apps',
          description: 'Monitor municipal development applications for opportunity indicators',
          inputSchema: {
            type: 'object',
            properties: {
              municipality: {
                type: 'string',
                description: 'Municipality to monitor',
                enum: ['toronto', 'mississauga', 'brampton', 'vaughan', 'markham', 'oakville']
              },
              types: {
                type: 'array',
                description: 'Application types to monitor',
                items: {
                  type: 'string',
                  enum: ['rezoning', 'demolition', 'subdivision', 'variance', 'conversion']
                },
                default: ['all']
              }
            },
            required: ['municipality']
          }
        },
        {
          name: 'daily_pipeline',
          description: 'Run the complete daily data acquisition and alert generation pipeline',
          inputSchema: {
            type: 'object',
            properties: {
              regions: {
                type: 'array',
                description: 'Regions to include in pipeline',
                items: { type: 'string' },
                default: ['gta']
              },
              sendAlerts: {
                type: 'boolean',
                description: 'Send alerts for high-priority findings',
                default: true
              },
              generateReport: {
                type: 'boolean',
                description: 'Generate summary report',
                default: true
              }
            }
          }
        },
        {
          name: 'deploy_component',
          description: 'Deploy AgentRadar component to specified environment',
          inputSchema: {
            type: 'object',
            properties: {
              component: {
                type: 'string',
                description: 'Component to deploy',
                enum: ['web', 'api', 'scrapers', 'all']
              },
              environment: {
                type: 'string',
                description: 'Target environment',
                enum: ['development', 'staging', 'production'],
                default: 'staging'
              },
              runTests: {
                type: 'boolean',
                description: 'Run tests before deployment',
                default: true
              }
            },
            required: ['component']
          }
        },
        {
          name: 'generate_market_report',
          description: 'Generate comprehensive market analysis report',
          inputSchema: {
            type: 'object',
            properties: {
              region: {
                type: 'string',
                description: 'Region for analysis'
              },
              period: {
                type: 'string',
                description: 'Analysis period',
                enum: ['week', 'month', 'quarter'],
                default: 'month'
              },
              metrics: {
                type: 'array',
                description: 'Metrics to include',
                items: {
                  type: 'string',
                  enum: ['inventory', 'prices', 'dom', 'absorption', 'trends']
                },
                default: ['all']
              }
            },
            required: ['region']
          }
        }
      ]
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const timestamp = new Date().toISOString();
      
      console.error(`[${timestamp}] Executing tool: ${name}`);
      
      try {
        let result;
        
        switch (name) {
          case 'scrape_court_filings':
            result = await this.scraperTools.scrapeCourtFilings(args);
            break;
            
          case 'analyze_property':
            result = await this.propertyAnalyzer.analyze(args);
            break;
            
          case 'get_system_status':
            result = await this.systemMonitor.getStatus(args);
            break;
            
          case 'search_estate_sales':
            result = await this.scraperTools.searchEstateSales(args);
            break;
            
          case 'monitor_development_apps':
            result = await this.scraperTools.monitorDevelopmentApps(args);
            break;
            
          case 'daily_pipeline':
            result = await this.workflowEngine.runDailyPipeline(args);
            break;
            
          case 'deploy_component':
            result = await this.deploymentManager.deploy(args);
            break;
            
          case 'generate_market_report':
            result = await this.propertyAnalyzer.generateMarketReport(args);
            break;
            
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
        
        console.error(`[${timestamp}] Tool ${name} completed successfully`);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        console.error(`[${timestamp}] Error in ${name}:`, error.message);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: true,
                message: error.message,
                tool: name,
                timestamp
              }, null, 2)
            }
          ],
          isError: true
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('[AgentRadar] MCP Server running on stdio transport');
  }
}

// Start the server
const server = new AgentRadarMCPServer();
server.run().catch(console.error);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('\n[AgentRadar] Shutting down gracefully...');
  process.exit(0);
});
