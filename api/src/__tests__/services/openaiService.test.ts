import { openAIService } from '../../services/openaiService';

// Mock the OpenAI module
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn()
        }
      }
    }))
  };
});

describe('OpenAI Service', () => {
  let mockOpenAI: any;
  
  beforeAll(() => {
    // Set up environment variable for testing
    process.env.OPENAI_API_KEY = 'test-key';
  });

  beforeEach(() => {
    const OpenAI = require('openai').default;
    mockOpenAI = new OpenAI();
    jest.clearAllMocks();
  });

  describe('Property Analysis', () => {
    it('should analyze property opportunity with valid input', async () => {
      // Mock successful OpenAI response
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              opportunityScore: 85,
              investmentThesis: 'Strong investment opportunity in growing market',
              riskFactors: ['Market volatility', 'Interest rate sensitivity'],
              recommendedActions: ['Schedule inspection', 'Research comparable sales'],
              marketInsights: {
                priceEstimate: 875000,
                confidenceLevel: 0.9,
                marketTrend: 'RISING',
                competitivePosition: 'Above market average'
              }
            })
          }
        }],
        usage: {
          total_tokens: 500
        }
      });

      const propertyInput = {
        address: '123 Test Street, Toronto, ON',
        bedrooms: 3,
        bathrooms: 2,
        squareFootage: 2000,
        yearBuilt: 2010,
        propertyType: 'RESIDENTIAL',
        features: ['garage', 'fireplace'],
        condition: 'GOOD'
      };

      const result = await openAIService.analyzePropertyOpportunity(propertyInput);

      expect(result).toBeDefined();
      expect(result.opportunityScore).toBe(85);
      expect(result.investmentThesis).toBe('Strong investment opportunity in growing market');
      expect(result.riskFactors).toHaveLength(2);
      expect(result.recommendedActions).toHaveLength(2);
      expect(result.marketInsights.marketTrend).toBe('RISING');
      expect(result.marketInsights.priceEstimate).toBe(875000);
    });

    it('should handle OpenAI API errors gracefully', async () => {
      // Mock API error
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('API Error'));

      const propertyInput = {
        address: '123 Test Street, Toronto, ON',
        bedrooms: 3,
        bathrooms: 2,
        squareFootage: 2000,
        yearBuilt: 2010,
        propertyType: 'RESIDENTIAL'
      };

      const result = await openAIService.analyzePropertyOpportunity(propertyInput);

      // Should return fallback analysis
      expect(result).toBeDefined();
      expect(result.opportunityScore).toBeGreaterThanOrEqual(0);
      expect(result.opportunityScore).toBeLessThanOrEqual(100);
      expect(result.marketInsights.priceEstimate).toBeGreaterThan(0);
    });

    it('should validate opportunity score range', async () => {
      // Mock response with invalid score
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              opportunityScore: 150, // Invalid score > 100
              investmentThesis: 'Test thesis',
              riskFactors: [],
              recommendedActions: [],
              marketInsights: {
                priceEstimate: 500000,
                confidenceLevel: 0.8,
                marketTrend: 'STABLE',
                competitivePosition: 'Market average'
              }
            })
          }
        }],
        usage: { total_tokens: 300 }
      });

      const propertyInput = {
        address: '123 Test Street, Toronto, ON',
        bedrooms: 2,
        bathrooms: 1,
        squareFootage: 1500,
        yearBuilt: 2005,
        propertyType: 'CONDO'
      };

      const result = await openAIService.analyzePropertyOpportunity(propertyInput);

      // Should cap at 100
      expect(result.opportunityScore).toBe(100);
    });

    it('should validate market trend values', async () => {
      // Mock response with invalid market trend
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              opportunityScore: 75,
              investmentThesis: 'Test thesis',
              riskFactors: [],
              recommendedActions: [],
              marketInsights: {
                priceEstimate: 600000,
                confidenceLevel: 0.7,
                marketTrend: 'INVALID_TREND', // Invalid trend
                competitivePosition: 'Test position'
              }
            })
          }
        }],
        usage: { total_tokens: 250 }
      });

      const propertyInput = {
        address: '456 Test Avenue, Toronto, ON',
        bedrooms: 4,
        bathrooms: 3,
        squareFootage: 2500,
        yearBuilt: 2015,
        propertyType: 'RESIDENTIAL'
      };

      const result = await openAIService.analyzePropertyOpportunity(propertyInput);

      // Should default to 'STABLE'
      expect(result.marketInsights.marketTrend).toBe('STABLE');
    });
  });

  describe('Document Extraction', () => {
    it('should extract data from text documents', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              data: {
                propertyAddress: '789 Legal Street',
                salePrice: 950000,
                saleDate: '2024-03-15',
                plaintiffName: 'Test Bank',
                defendantName: 'John Doe'
              },
              confidence: 0.95,
              validationNotes: ['All key fields extracted successfully']
            })
          }
        }],
        usage: { total_tokens: 400 }
      });

      const documentInput = {
        documentType: 'court_filing' as const,
        text: 'STATEMENT OF CLAIM - Property at 789 Legal Street to be sold for $950,000 on March 15, 2024...'
      };

      const result = await openAIService.extractDocumentData(documentInput);

      expect(result.extractedData.propertyAddress).toBe('789 Legal Street');
      expect(result.extractedData.salePrice).toBe(950000);
      expect(result.confidence).toBe(0.95);
      expect(result.validationNotes).toHaveLength(1);
    });

    it('should handle document extraction errors', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('Document processing failed'));

      const documentInput = {
        documentType: 'legal_document' as const,
        text: 'Invalid document text'
      };

      const result = await openAIService.extractDocumentData(documentInput);

      expect(result.extractedData).toEqual({});
      expect(result.confidence).toBe(0);
      expect(result.validationNotes[0]).toContain('manual review required');
    });
  });

  describe('Lead Analysis', () => {
    it('should analyze lead conversion potential', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              behavioralScore: 80,
              engagementPrediction: 85,
              personalizationRecommendations: ['Focus on family features', 'Emphasize school district quality'],
              nextBestActions: ['Schedule property viewing', 'Send market analysis'],
              conversionProbability: 0.75
            })
          }
        }],
        usage: { total_tokens: 350 }
      });

      const leadInput = {
        leadData: {
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '416-555-0123',
          propertyInterest: '3-bedroom house',
          budget: 850000,
          timeline: '3-6 months'
        }
      };

      const result = await openAIService.analyzeLead(leadInput);

      expect(result.behavioralScore).toBe(80);
      expect(result.engagementPrediction).toBe(85);
      expect(result.personalizationRecommendations).toHaveLength(2);
      expect(result.nextBestActions).toHaveLength(2);
      expect(result.conversionProbability).toBe(0.75);
    });

    it('should provide fallback analysis when AI fails', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('Lead analysis failed'));

      const leadInput = {
        leadData: {
          name: 'Test Lead',
          email: 'test@example.com',
          budget: 750000,
          timeline: 'immediate'
        }
      };

      const result = await openAIService.analyzeLead(leadInput);

      expect(result.behavioralScore).toBeGreaterThanOrEqual(0);
      expect(result.behavioralScore).toBeLessThanOrEqual(100);
      expect(result.engagementPrediction).toBeGreaterThanOrEqual(0);
      expect(result.nextBestActions.length).toBeGreaterThan(0);
    });
  });

  describe('Usage Tracking', () => {
    it('should track API usage and costs', () => {
      const initialStats = openAIService.getUsageStats();
      
      expect(initialStats).toHaveProperty('requestCount');
      expect(initialStats).toHaveProperty('dailySpent');
      expect(initialStats).toHaveProperty('budgetRemaining');
      expect(initialStats).toHaveProperty('budgetUtilization');
      
      expect(initialStats.budgetUtilization).toBeGreaterThanOrEqual(0);
      expect(initialStats.budgetUtilization).toBeLessThanOrEqual(100);
    });

    it('should handle missing OpenAI API key', () => {
      // Temporarily remove API key
      const originalKey = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      expect(() => {
        // This would be called in a new instance
        const { OpenAIService } = require('../../services/openaiService');
        new OpenAIService();
      }).toThrow('OPENAI_API_KEY environment variable is required');

      // Restore API key
      process.env.OPENAI_API_KEY = originalKey;
    });
  });

  describe('Market Report Generation', () => {
    it('should generate comprehensive market reports', async () => {
      const mockReport = 'Comprehensive market analysis for Toronto shows strong growth potential...';
      
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: mockReport
          }
        }],
        usage: { total_tokens: 800 }
      });

      const result = await openAIService.generateMarketReport(
        'Toronto',
        '6 months',
        { averagePrice: 850000, inventory: 2500 }
      );

      expect(result).toBe(mockReport);
    });

    it('should handle market report generation failures', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('Report generation failed'));

      const result = await openAIService.generateMarketReport(
        'Toronto',
        '3 months',
        { averagePrice: 800000 }
      );

      expect(result).toContain('Market report generation failed');
    });
  });
});