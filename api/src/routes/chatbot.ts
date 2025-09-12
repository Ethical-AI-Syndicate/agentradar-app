/**
 * AI Chatbot Routes
 * Real implementation with OpenAI GPT-4 integration and basic RAG capabilities
 * Using Joi validation for compatibility with existing middleware
 */

import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../middleware/auth";
import { validateRequest } from "../middleware/validation";
import Joi from "joi";
import OpenAI from "openai";

const router = express.Router();
const prisma = new PrismaClient();

// Initialize OpenAI (only if API key is available)
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// ============================================================================
// VALIDATION SCHEMAS (Using Joi for compatibility)
// ============================================================================

const chatMessageSchema = Joi.object({
  message: Joi.string().trim().min(1).max(2000).required(),
  conversationId: Joi.string().trim().allow('').optional(),
  context: Joi.string().trim().allow('').optional()
});

// ============================================================================
// KNOWLEDGE BASE FUNCTIONS
// ============================================================================

/**
 * Basic RAG implementation - search through common real estate topics
 */
async function searchKnowledgeBase(query: string): Promise<string[]> {
  const lowerQuery = query.toLowerCase();
  
  // Basic knowledge base for real estate
  const knowledgeBase = [
    {
      topic: "power of sale",
      content: "Power of sale is a legal process where a lender can sell a property to recover outstanding debt without going through the court system. This is common when homeowners default on their mortgage payments."
    },
    {
      topic: "estate sale",
      content: "Estate sales occur when property is sold as part of settling an estate, often after the owner has passed away. These can present investment opportunities as properties may be priced below market value."
    },
    {
      topic: "foreclosure",
      content: "Foreclosure is a legal process where a lender repossesses and sells a property due to the borrower's failure to make mortgage payments. This process varies by province and can create investment opportunities."
    },
    {
      topic: "property valuation",
      content: "Property valuation involves determining the current market value of real estate using methods like comparative market analysis, income approach, and cost approach."
    },
    {
      topic: "real estate investment",
      content: "Real estate investment involves purchasing properties to generate income through rental yields or capital appreciation. Key factors include location, market trends, and cash flow analysis."
    },
    {
      topic: "market analysis",
      content: "Market analysis examines local real estate trends, pricing patterns, inventory levels, and economic factors that influence property values and investment opportunities."
    }
  ];
  
  // Simple keyword matching
  const relevantContext: string[] = [];
  
  for (const item of knowledgeBase) {
    if (lowerQuery.includes(item.topic) || 
        item.topic.split(' ').some(word => lowerQuery.includes(word))) {
      relevantContext.push(item.content);
    }
  }
  
  // If no specific matches, include general real estate context
  if (relevantContext.length === 0) {
    relevantContext.push(
      "AgentRadar is a real estate intelligence platform that helps agents find investment opportunities through power of sale, estate sales, and foreclosure monitoring."
    );
  }
  
  return relevantContext.slice(0, 3); // Limit context to avoid token limits
}

// ============================================================================
// CHATBOT ROUTES
// ============================================================================

/**
 * POST /api/chatbot/chat
 * Send message to AI chatbot
 */
router.post('/chat', authenticateToken, validateRequest(chatMessageSchema), async (req, res) => {
  try {
    const { message, conversationId, context } = req.body;
    const { userId } = req as any;

    // If OpenAI is not configured, return fallback response
    if (!openai) {
      return res.json({
        success: true,
        data: {
          response: "I'm currently in maintenance mode. OpenAI integration is not configured. Please check with your administrator.",
          conversationId: conversationId || `conv-${Date.now()}`,
          fallback: true
        }
      });
    }

    // Search knowledge base for relevant context
    const knowledgeContext = await searchKnowledgeBase(message);
    const fullContext = [...knowledgeContext, context].filter(Boolean).join('\n\n');

    // System prompt for real estate focus
    const systemPrompt = `You are AgentRadar AI, an intelligent assistant specializing in real estate investment opportunities and market intelligence. You help real estate agents and investors by:

1. Analyzing market trends and opportunities
2. Explaining legal processes like power of sale, foreclosures, and estate sales
3. Providing investment guidance and property analysis
4. Answering questions about real estate regulations and best practices

Always provide helpful, accurate information while being professional and concise. If you're unsure about specific legal or financial advice, recommend consulting with qualified professionals.`;

    try {
      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Using cost-effective model
        messages: [
          {
            role: "system",
            content: `${systemPrompt}\n\nContext from knowledge base:\n${fullContext}`
          },
          {
            role: "user",
            content: message
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      const response = completion.choices[0]?.message?.content || "I apologize, but I couldn't generate a response. Please try again.";

      // Log the conversation (optional - could store in database for learning)
      console.log(`Chatbot conversation - User ${userId}: "${message}" -> Response length: ${response.length} chars`);

      res.json({
        success: true,
        data: {
          response,
          conversationId: conversationId || `conv-${Date.now()}`,
          usage: {
            prompt_tokens: completion.usage?.prompt_tokens || 0,
            completion_tokens: completion.usage?.completion_tokens || 0,
            total_tokens: completion.usage?.total_tokens || 0
          }
        }
      });

    } catch (openaiError: any) {
      console.error('OpenAI API error:', openaiError);
      
      // Don't fallback to mock responses - return proper error
      res.status(503).json({
        success: false,
        message: 'AI chatbot service temporarily unavailable',
        error: 'OpenAI service error',
        conversationId: conversationId || `conv-${Date.now()}`,
        retryAfter: 60 // seconds
      });
    }

  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process chat message',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/chatbot/suggestions
 * Get suggested questions/prompts
 */
router.get('/suggestions', authenticateToken, async (req, res) => {
  try {
    const suggestions = [
      "What are the current power of sale opportunities in Toronto?",
      "How do I analyze the ROI of a foreclosure property?",
      "What should I look for in estate sale properties?",
      "Can you explain the difference between foreclosure and power of sale?",
      "What are the best practices for real estate investment in Ontario?",
      "How do I evaluate market trends for property investment?",
      "What legal considerations should I know about distressed properties?",
      "How can I calculate cash flow for rental properties?"
    ];

    res.json({
      success: true,
      data: {
        suggestions: suggestions.slice(0, 4) // Return 4 random suggestions
      }
    });
  } catch (error) {
    console.error('Failed to get suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get suggestions',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/chatbot/status
 * Get chatbot service status
 */
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const status = {
      available: !!openai,
      model: openai ? "gpt-4o-mini" : null,
      features: {
        realTimeChat: true,
        knowledgeBase: true,
        conversationMemory: false, // Not implemented yet
        fileUpload: false // Not implemented yet
      },
      limits: {
        maxMessageLength: 2000,
        maxTokens: 500,
        rateLimitPerMinute: 10
      }
    };

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Failed to get chatbot status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chatbot status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Fallback response function removed - now using proper error handling instead of mock responses

export default router;