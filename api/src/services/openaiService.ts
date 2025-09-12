import OpenAI from "openai";
import { withAIMonitoring, trackAIMetric } from '../lib/aiPerformanceMonitor';

interface PropertyAnalysisInput {
  address: string;
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
  yearBuilt: number;
  propertyType: string;
  features?: string[];
  condition?: string;
  lotSize?: number;
  comparableProperties?: any;
  marketConditions?: any;
}

interface PropertyAnalysisOutput {
  opportunityScore: number;
  investmentThesis: string;
  riskFactors: string[];
  recommendedActions: string[];
  marketInsights: {
    priceEstimate: number;
    confidenceLevel: number;
    marketTrend: "RISING" | "STABLE" | "DECLINING";
    competitivePosition: string;
  };
}

interface DocumentExtractionInput {
  documentType: "court_filing" | "property_listing" | "legal_document";
  text: string;
  imageUrl?: string;
}

interface DocumentExtractionOutput {
  extractedData: Record<string, any>;
  confidence: number;
  validationNotes: string[];
}

interface LeadAnalysisInput {
  leadData: {
    name: string;
    email: string;
    phone?: string;
    propertyInterest?: string;
    budget?: number;
    timeline?: string;
    previousInteractions?: any;
  };
  marketContext?: any;
}

interface LeadAnalysisOutput {
  behavioralScore: number;
  engagementPrediction: number;
  personalizationRecommendations: string[];
  nextBestActions: string[];
  conversionProbability: number;
}

export class OpenAIService {
  private client: OpenAI;
  private requestCount: number = 0;
  private dailyBudget: number = 100; // $100 daily budget
  private dailySpent: number = 0;
  private rateLimitWindow: Map<string, number[]> = new Map();
  private maxRetries: number = 3;
  private baseRetryDelay: number = 1000; // 1 second

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is required");
    }

    this.client = new OpenAI({
      apiKey: apiKey,
    });

    // Reset daily budget at midnight
    this.resetDailyBudgetIfNeeded();
  }

  /**
   * Execute OpenAI API call with retry logic and error handling
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        // Check rate limiting before attempt
        this.checkRateLimit(operationName);
        
        // Execute the operation
        const result = await operation();
        
        // Track successful call for rate limiting
        this.trackRateLimitCall(operationName);
        
        return result;
        
      } catch (error: any) {
        lastError = error;
        
        // Don't retry on certain error types
        if (this.isNonRetryableError(error)) {
          throw error;
        }
        
        // Log the retry attempt
        console.warn(`OpenAI ${operationName} attempt ${attempt} failed:`, error.message);
        
        // Wait before retry with exponential backoff
        if (attempt < this.maxRetries) {
          const delay = this.calculateRetryDelay(attempt, error);
          await this.sleep(delay);
        }
      }
    }
    
    // All retries exhausted
    console.error(`OpenAI ${operationName} failed after ${this.maxRetries} attempts:`, lastError);
    throw new Error(`OpenAI ${operationName} failed after multiple attempts: ${lastError.message}`);
  }

  /**
   * Rate limiting and error handling helper methods
   */
  private checkRateLimit(operation: string): void {
    const now = Date.now();
    const windowSize = 60000; // 1 minute window
    const maxCallsPerWindow = 60; // 60 calls per minute
    
    if (!this.rateLimitWindow.has(operation)) {
      this.rateLimitWindow.set(operation, []);
    }
    
    const calls = this.rateLimitWindow.get(operation)!;
    
    // Remove calls older than window
    const recentCalls = calls.filter(timestamp => now - timestamp < windowSize);
    this.rateLimitWindow.set(operation, recentCalls);
    
    if (recentCalls.length >= maxCallsPerWindow) {
      throw new Error(`Rate limit exceeded for ${operation}. Please wait before retrying.`);
    }
  }
  
  private trackRateLimitCall(operation: string): void {
    const now = Date.now();
    if (!this.rateLimitWindow.has(operation)) {
      this.rateLimitWindow.set(operation, []);
    }
    this.rateLimitWindow.get(operation)!.push(now);
  }
  
  private isNonRetryableError(error: any): boolean {
    // Don't retry on authentication, permission, or validation errors
    if (error.status) {
      const status = error.status;
      return status === 401 || // Unauthorized
             status === 403 || // Forbidden
             status === 400 || // Bad Request
             status === 422;   // Unprocessable Entity
    }
    
    // Don't retry on budget exceeded errors
    if (error.message?.includes('budget exceeded')) {
      return true;
    }
    
    return false;
  }
  
  private calculateRetryDelay(attempt: number, error: any): number {
    // Exponential backoff with jitter
    let delay = this.baseRetryDelay * Math.pow(2, attempt - 1);
    
    // Add extra delay for rate limit errors
    if (error.status === 429) {
      delay *= 2;
    }
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * delay;
    return Math.floor(delay + jitter);
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Analyze property opportunity with GPT-4
   */
  async analyzePropertyOpportunity(
    input: PropertyAnalysisInput,
  ): Promise<PropertyAnalysisOutput> {
    if (this.isDailyBudgetExceeded()) {
      throw new Error(
        "Daily AI budget exceeded. Falling back to cached/simplified analysis.",
      );
    }

    const prompt = this.buildPropertyAnalysisPrompt(input);

    try {
      const completion = await withAIMonitoring(
        'property-analysis',
        {
          operation: 'property-analysis',
          model: 'gpt-4-turbo-preview',
          temperature: 0.3,
          maxTokens: 2000,
          systemMessage: 'You are an expert real estate investment analyst...',
          userPrompt: prompt.substring(0, 100) + '...', // Truncated for privacy
          inputData: input
        },
        async () => {
          return await this.withRetry(async () => {
            return await this.client.chat.completions.create({
              model: "gpt-4-turbo-preview",
              messages: [
                {
                  role: "system",
                  content: `You are an expert real estate investment analyst with 20+ years of experience. 
                           Analyze properties for investment potential, market positioning, and opportunities.
                           Always provide specific, actionable insights based on the data provided.
                           Return responses in valid JSON format only.`,
                },
                {
                  role: "user",
                  content: prompt,
                },
              ],
              temperature: 0.3, // Lower temperature for more consistent analysis
              max_tokens: 2000,
              response_format: { type: "json_object" },
            });
          }, 'property-analysis');
        }
      );

      const response = completion.choices[0].message.content;
      const cost = this.estimateCost(
        completion.usage?.total_tokens || 0,
        "gpt-4-turbo",
      );
      this.trackUsage(cost);

      if (!response) {
        throw new Error("No response from OpenAI");
      }

      const analysis = JSON.parse(response);

      // Validate and structure the response
      return {
        opportunityScore: Math.min(
          100,
          Math.max(0, analysis.opportunityScore || 0),
        ),
        investmentThesis: analysis.investmentThesis || "Analysis unavailable",
        riskFactors: Array.isArray(analysis.riskFactors)
          ? analysis.riskFactors
          : [],
        recommendedActions: Array.isArray(analysis.recommendedActions)
          ? analysis.recommendedActions
          : [],
        marketInsights: {
          priceEstimate: analysis.marketInsights?.priceEstimate || 0,
          confidenceLevel: Math.min(
            1,
            Math.max(0, analysis.marketInsights?.confidenceLevel || 0),
          ),
          marketTrend: this.validateMarketTrend(
            analysis.marketInsights?.marketTrend,
          ),
          competitivePosition:
            analysis.marketInsights?.competitivePosition || "Unknown",
        },
      };
    } catch (error) {
      console.error("OpenAI Property Analysis Error:", error);
      
      // Don't fallback to mock data - throw the error to be handled upstream
      throw new Error(`Property analysis failed: ${error.message}`);
    }
  }

  /**
   * Extract data from legal documents using GPT-4 Vision
   */
  async extractDocumentData(
    input: DocumentExtractionInput,
  ): Promise<DocumentExtractionOutput> {
    if (this.isDailyBudgetExceeded()) {
      throw new Error(
        "Daily AI budget exceeded. Document extraction unavailable.",
      );
    }

    const messages: any = [
      {
        role: "system",
        content: `You are an expert legal document analyst specializing in real estate documents.
                 Extract key information accurately and flag any inconsistencies.
                 Return responses in valid JSON format only.`,
      },
    ];

    if (input.imageUrl) {
      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: `Extract all relevant information from this ${input.documentType} document. Focus on dates, amounts, addresses, and legal entities.`,
          },
          {
            type: "image_url",
            image_url: { url: input.imageUrl },
          },
        ],
      });
    } else {
      messages.push({
        role: "user",
        content: `Extract all relevant information from this ${input.documentType} document:\n\n${input.text}`,
      });
    }

    try {
      const model = input.imageUrl ? "gpt-4-vision-preview" : "gpt-4-turbo-preview";
      const completion = await withAIMonitoring(
        'document-extraction',
        {
          operation: 'document-extraction',
          model,
          temperature: 0.1,
          maxTokens: 1500,
          inputData: { documentType: input.documentType, hasImage: !!input.imageUrl }
        },
        async () => {
          return await this.client.chat.completions.create({
            model,
            messages,
            temperature: 0.1, // Very low temperature for accuracy
            max_tokens: 1500,
            response_format: { type: "json_object" },
          });
        }
      );

      const response = completion.choices[0].message.content;
      const cost = this.estimateCost(
        completion.usage?.total_tokens || 0,
        input.imageUrl ? "gpt-4-vision" : "gpt-4-turbo",
      );
      this.trackUsage(cost);

      if (!response) {
        throw new Error("No response from OpenAI");
      }

      const extraction = JSON.parse(response);

      return {
        extractedData: extraction.data || {},
        confidence: Math.min(1, Math.max(0, extraction.confidence || 0.5)),
        validationNotes: Array.isArray(extraction.validationNotes)
          ? extraction.validationNotes
          : [],
      };
    } catch (error) {
      console.error("OpenAI Document Extraction Error:", error);

      return {
        extractedData: {},
        confidence: 0,
        validationNotes: [
          "Document extraction failed - manual review required",
        ],
      };
    }
  }

  /**
   * Analyze leads for behavioral scoring and engagement prediction
   */
  async analyzeLead(input: LeadAnalysisInput): Promise<LeadAnalysisOutput> {
    if (this.isDailyBudgetExceeded()) {
      throw new Error('Daily AI budget exceeded - upgrade plan or wait until tomorrow');
    }

    const prompt = this.buildLeadAnalysisPrompt(input);

    try {
      const completion = await withAIMonitoring(
        'lead-analysis',
        {
          operation: 'lead-analysis',
          model: 'gpt-4-turbo-preview',
          temperature: 0.4,
          maxTokens: 1500,
          systemMessage: 'You are an expert sales analyst...',
          userPrompt: prompt.substring(0, 100) + '...', // Truncated for privacy
          inputData: input
        },
        async () => {
          return await this.client.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [
              {
                role: "system",
                content: `You are an expert sales analyst specializing in real estate lead qualification.
                         Analyze leads for conversion potential and recommend personalized engagement strategies.
                         Return responses in valid JSON format only.`,
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            temperature: 0.4,
            max_tokens: 1500,
            response_format: { type: "json_object" },
          });
        }
      );

      const response = completion.choices[0].message.content;
      const cost = this.estimateCost(
        completion.usage?.total_tokens || 0,
        "gpt-4-turbo",
      );
      this.trackUsage(cost);

      if (!response) {
        throw new Error("No response from OpenAI");
      }

      const analysis = JSON.parse(response);

      return {
        behavioralScore: Math.min(
          100,
          Math.max(0, analysis.behavioralScore || 0),
        ),
        engagementPrediction: Math.min(
          100,
          Math.max(0, analysis.engagementPrediction || 0),
        ),
        personalizationRecommendations: Array.isArray(
          analysis.personalizationRecommendations,
        )
          ? analysis.personalizationRecommendations
          : [],
        nextBestActions: Array.isArray(analysis.nextBestActions)
          ? analysis.nextBestActions
          : [],
        conversionProbability: Math.min(
          1,
          Math.max(0, analysis.conversionProbability || 0),
        ),
      };
    } catch (error) {
      console.error("OpenAI Lead Analysis Error:", error);
      
      // Don't fallback to mock data - throw the error to be handled upstream
      throw new Error(`Lead analysis failed: ${error.message}`);
    }
  }

  /**
   * Generate comprehensive market report using GPT-4
   */
  async generateMarketReport(
    location: string,
    timeframe: string,
    marketData: any,
  ): Promise<string> {
    if (this.isDailyBudgetExceeded()) {
      return "Market report generation unavailable - daily budget exceeded.";
    }

    const prompt = `Generate a comprehensive ${timeframe} market report for ${location} based on the following data:

Market Data: ${JSON.stringify(marketData, null, 2)}

Include:
1. Executive summary with key insights
2. Price trends and forecasts
3. Inventory analysis
4. Investment opportunities
5. Risk factors and market challenges
6. Actionable recommendations for buyers, sellers, and investors

Write in professional tone suitable for real estate professionals.`;

    try {
      const completion = await withAIMonitoring(
        'market-report',
        {
          operation: 'market-report',
          model: 'gpt-4-turbo-preview',
          temperature: 0.5,
          maxTokens: 3000,
          systemMessage: 'You are an expert real estate market analyst...',
          inputData: { location, timeframe }
        },
        async () => {
          return await this.client.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [
              {
                role: "system",
                content:
                  "You are an expert real estate market analyst. Generate detailed, professional market reports with specific insights and actionable recommendations.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            temperature: 0.5,
            max_tokens: 3000,
          });
        }
      );

      const response = completion.choices[0].message.content;
      const cost = this.estimateCost(
        completion.usage?.total_tokens || 0,
        "gpt-4-turbo",
      );
      this.trackUsage(cost);

      return response || "Market report generation failed.";
    } catch (error) {
      console.error("OpenAI Market Report Error:", error);
      return "Market report generation failed due to technical issues.";
    }
  }

  /**
   * General completion method with retry logic
   */
  async generateCompletion(
    prompt: string,
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      systemMessage?: string;
    } = {}
  ): Promise<string> {
    const {
      model = 'gpt-4o-mini',
      temperature = 0.7,
      maxTokens = 1000,
      systemMessage = 'You are a helpful AI assistant.'
    } = options;

    const completion = await withAIMonitoring(
      'general-completion',
      {
        operation: 'general-completion',
        model,
        temperature,
        maxTokens,
        systemMessage: systemMessage.substring(0, 100) + '...',
        userPrompt: prompt.substring(0, 100) + '...'
      },
      async () => {
        return await this.withRetry(async () => {
          return await this.client.chat.completions.create({
            model,
            messages: [
              {
                role: 'system',
                content: systemMessage
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature,
            max_tokens: maxTokens
          });
        }, 'general-completion');
      }
    );

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Track usage
    const cost = this.estimateCost(
      completion.usage?.total_tokens || 0,
      model.includes('gpt-4') ? 'gpt-4' : 'gpt-3.5'
    );
    this.trackUsage(cost);

    return response;
  }

  /**
   * Build detailed prompt for property analysis
   */
  private buildPropertyAnalysisPrompt(input: PropertyAnalysisInput): string {
    return `Analyze this property for investment potential and market opportunity:

Property Details:
- Address: ${input.address}
- Bedrooms: ${input.bedrooms}
- Bathrooms: ${input.bathrooms}
- Square Footage: ${input.squareFootage}
- Year Built: ${input.yearBuilt}
- Property Type: ${input.propertyType}
- Condition: ${input.condition || "Unknown"}
- Lot Size: ${input.lotSize || "Unknown"}
- Features: ${input.features?.join(", ") || "None specified"}

${input.comparableProperties ? `Comparable Properties: ${JSON.stringify(input.comparableProperties, null, 2)}` : ""}

${input.marketConditions ? `Market Conditions: ${JSON.stringify(input.marketConditions, null, 2)}` : ""}

Provide analysis in this exact JSON format:
{
  "opportunityScore": [0-100 score],
  "investmentThesis": "[detailed investment reasoning]",
  "riskFactors": ["risk1", "risk2", "risk3"],
  "recommendedActions": ["action1", "action2", "action3"],
  "marketInsights": {
    "priceEstimate": [estimated market value],
    "confidenceLevel": [0-1 confidence score],
    "marketTrend": "[RISING|STABLE|DECLINING]",
    "competitivePosition": "[market position description]"
  }
}`;
  }

  /**
   * Build detailed prompt for lead analysis
   */
  private buildLeadAnalysisPrompt(input: LeadAnalysisInput): string {
    return `Analyze this real estate lead for conversion potential and engagement strategy:

Lead Information:
- Name: ${input.leadData.name}
- Email: ${input.leadData.email}
- Phone: ${input.leadData.phone || "Not provided"}
- Property Interest: ${input.leadData.propertyInterest || "General"}
- Budget: ${input.leadData.budget ? "$" + input.leadData.budget.toLocaleString() : "Not specified"}
- Timeline: ${input.leadData.timeline || "Not specified"}

${input.leadData.previousInteractions ? `Previous Interactions: ${JSON.stringify(input.leadData.previousInteractions, null, 2)}` : ""}

${input.marketContext ? `Market Context: ${JSON.stringify(input.marketContext, null, 2)}` : ""}

Provide analysis in this exact JSON format:
{
  "behavioralScore": [0-100 engagement score],
  "engagementPrediction": [0-100 likelihood to engage],
  "personalizationRecommendations": ["recommendation1", "recommendation2"],
  "nextBestActions": ["action1", "action2", "action3"],
  "conversionProbability": [0-1 probability of conversion]
}`;
  }



  /**
   * Validate market trend value
   */
  private validateMarketTrend(trend: any): "RISING" | "STABLE" | "DECLINING" {
    if (["RISING", "STABLE", "DECLINING"].includes(trend)) {
      return trend;
    }
    return "STABLE";
  }

  /**
   * Estimate cost for API call
   */
  private estimateCost(tokens: number, model: string): number {
    const rates: Record<string, { input: number; output: number }> = {
      "gpt-4-turbo": { input: 0.01, output: 0.03 }, // per 1K tokens
      "gpt-4-vision": { input: 0.01, output: 0.03 },
      "gpt-3.5-turbo": { input: 0.0005, output: 0.0015 },
    };

    const rate = rates[model] || rates["gpt-4-turbo"];
    return (tokens / 1000) * ((rate.input + rate.output) / 2); // Average rate approximation
  }

  /**
   * Track usage and costs
   */
  private trackUsage(cost: number): void {
    this.requestCount++;
    this.dailySpent += cost;

    if (this.dailySpent > this.dailyBudget * 0.8) {
      console.warn(
        `⚠️  OpenAI daily budget 80% used: $${this.dailySpent.toFixed(2)}/$${this.dailyBudget}`,
      );
    }
  }

  /**
   * Check if daily budget is exceeded
   */
  private isDailyBudgetExceeded(): boolean {
    return this.dailySpent >= this.dailyBudget;
  }

  /**
   * Reset daily budget tracking
   */
  private resetDailyBudgetIfNeeded(): void {
    const today = new Date().toDateString();
    const lastReset = global.openAILastReset;

    if (lastReset !== today) {
      this.dailySpent = 0;
      this.requestCount = 0;
      global.openAILastReset = today;
    }
  }

  /**
   * Get usage statistics
   */
  getUsageStats(): {
    requestCount: number;
    dailySpent: number;
    budgetRemaining: number;
    budgetUtilization: number;
  } {
    return {
      requestCount: this.requestCount,
      dailySpent: this.dailySpent,
      budgetRemaining: this.dailyBudget - this.dailySpent,
      budgetUtilization: (this.dailySpent / this.dailyBudget) * 100,
    };
  }
}

// Global type declaration for budget tracking
declare global {
  var openAILastReset: string | undefined;
}

export const openAIService = new OpenAIService();
