import express from 'express';
import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';
import { rateLimit } from 'express-rate-limit';
import validateRequest from '../middleware/validation';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Rate limiting for chatbot - more restrictive to prevent abuse
const chatbotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: { error: 'Too many chatbot requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation schema
const chatMessageSchema = z.object({
  message: z.string().min(1, 'Message is required').max(1000, 'Message too long'),
  conversationId: z.string().optional(),
  context: z.string().optional()
});

// Knowledge base for RAG - in production this would be a vector database
const knowledgeBase = {
  pricing: `AgentRadar offers flexible pricing tiers:
    - Solo Agent: $197/month (regular price) - Up to 500 property alerts/month, basic geographic filtering, email and SMS notifications
    - Professional: $197/month (regular price) - Unlimited property alerts, advanced filtering, real-time notifications, AI opportunity scoring
    - Team Enterprise: Custom pricing starting at $1,997/month - Everything in Professional plus unlimited team members, custom branding, API access, dedicated support
    - White Label: Custom pricing for brokerages - Full platform deployment with custom domain and branding
    All plans include early adopter lifetime 50% discount currently available.`,
  
  features: `AgentRadar provides comprehensive real estate intelligence:
    - Power of Sale monitoring across Ontario courts
    - Estate sale and probate property tracking
    - Development application monitoring for 5 municipalities
    - AI-powered opportunity scoring (0-100 scale)
    - Real-time alerts via email, SMS, and push notifications
    - Advanced geographic filtering and property criteria
    - Mobile and web platform access
    - Integration with major CRMs through API
    - Analytics dashboard with market insights
    - Blockchain property records for immutable history
    - AR virtual tours with AI staging
    - Predictive analytics with 6 AI models`,
  
  technology: `AgentRadar uses cutting-edge technology:
    - AI document processing with GPT-4 Vision for legal document extraction
    - Real-time WebSocket infrastructure with Redis scaling
    - Multi-level caching system (L1/L2/L3) for performance
    - PostgreSQL database with Prisma ORM
    - Next.js 15 frontend with TypeScript
    - Node.js Express API backend
    - React Native mobile app (Expo)
    - Stripe payment processing
    - MLS integration with Repliers + bring-your-own-MLS
    - OpenAI integration for property analysis and insights`,
  
  company: `AgentRadar is a real estate intelligence platform founded by Mike Holownych. 
    We specialize in providing early access to property opportunities through court filing monitoring,
    estate sales tracking, and municipal development applications. Our mission is to give real estate
    professionals a competitive advantage through advanced AI and data analytics.
    
    Current status: Phase 3 Production Launch Ready with all core systems operational.
    Seeking pre-seed funding: $500K - $1.2M for Canadian expansion.`,
  
  support: `AgentRadar provides comprehensive support:
    - Email support for all users
    - Live chat during business hours (9 AM - 6 PM EST)
    - Video onboarding sessions for new users
    - Detailed help center and documentation
    - API documentation for enterprise integrations
    - Priority support for Team Enterprise and White Label clients
    - Direct access to founder Mike Holownych for enterprise clients
    - 30-day money-back guarantee on all plans`,
  
  integrations: `AgentRadar offers extensive integration capabilities:
    - RESTful API for custom integrations
    - Webhook notifications for real-time updates
    - CRM integration support (Salesforce, HubSpot, etc.)
    - MLS integration with major providers
    - Export capabilities (CSV, Excel, JSON)
    - White-label deployment options
    - SSO integration for enterprise accounts
    - Custom field mapping for data imports
    - Third-party real estate tool integrations`
};

// Function to find relevant context from knowledge base using simple keyword matching
// In production, this would use vector embeddings and similarity search
function findRelevantContext(query: string): string {
  const lowerQuery = query.toLowerCase();
  let relevantSections: string[] = [];
  
  // Check for pricing-related keywords
  if (lowerQuery.includes('price') || lowerQuery.includes('cost') || lowerQuery.includes('pricing') || 
      lowerQuery.includes('plan') || lowerQuery.includes('subscription') || lowerQuery.includes('tier')) {
    relevantSections.push(knowledgeBase.pricing);
  }
  
  // Check for feature-related keywords
  if (lowerQuery.includes('feature') || lowerQuery.includes('alert') || lowerQuery.includes('court') ||
      lowerQuery.includes('power of sale') || lowerQuery.includes('estate') || lowerQuery.includes('ai') ||
      lowerQuery.includes('scoring') || lowerQuery.includes('notification') || lowerQuery.includes('filtering')) {
    relevantSections.push(knowledgeBase.features);
  }
  
  // Check for technology keywords
  if (lowerQuery.includes('technology') || lowerQuery.includes('tech') || lowerQuery.includes('api') ||
      lowerQuery.includes('integration') || lowerQuery.includes('mobile') || lowerQuery.includes('app') ||
      lowerQuery.includes('platform') || lowerQuery.includes('database') || lowerQuery.includes('openai')) {
    relevantSections.push(knowledgeBase.technology);
  }
  
  // Check for company info keywords
  if (lowerQuery.includes('company') || lowerQuery.includes('founder') || lowerQuery.includes('mike') ||
      lowerQuery.includes('about') || lowerQuery.includes('mission') || lowerQuery.includes('funding') ||
      lowerQuery.includes('investment') || lowerQuery.includes('investor')) {
    relevantSections.push(knowledgeBase.company);
  }
  
  // Check for support keywords
  if (lowerQuery.includes('support') || lowerQuery.includes('help') || lowerQuery.includes('contact') ||
      lowerQuery.includes('assistance') || lowerQuery.includes('documentation') || lowerQuery.includes('onboarding')) {
    relevantSections.push(knowledgeBase.support);
  }
  
  // Check for integration keywords
  if (lowerQuery.includes('integration') || lowerQuery.includes('crm') || lowerQuery.includes('webhook') ||
      lowerQuery.includes('export') || lowerQuery.includes('white label') || lowerQuery.includes('sso')) {
    relevantSections.push(knowledgeBase.integrations);
  }
  
  // If no specific context found, provide general context
  if (relevantSections.length === 0) {
    relevantSections.push(knowledgeBase.features, knowledgeBase.pricing);
  }
  
  // Remove duplicates and join
  return [...new Set(relevantSections)].join('\n\n');
}

// System prompt for the AI assistant
const systemPrompt = `You are AgentRadar's AI assistant, an expert in real estate intelligence and the AgentRadar platform. You help users understand our services, pricing, features, and how to get started.

Key guidelines:
1. Be helpful, professional, and enthusiastic about real estate opportunities
2. Always use the provided context to answer questions accurately
3. If you don't know something specific, admit it and offer to connect them with support
4. Focus on the value AgentRadar provides to real estate professionals
5. Be concise but informative in your responses
6. Encourage users to try our free trial or contact sales for custom solutions
7. Use Canadian terminology (e.g., "power of sale" not "foreclosure")
8. Mention specific features like court filing monitoring, AI opportunity scoring, etc.

If asked about competitors, focus on AgentRadar's unique advantages:
- Early access to opportunities 6-12 months before MLS
- AI-powered document analysis and opportunity scoring
- Comprehensive Ontario court filing coverage
- Real-time notifications and mobile platform
- White-label solutions for brokerages

Always maintain a professional but friendly tone.`;

router.use(chatbotLimiter);

// Chat endpoint
router.post('/chat', validateRequest(chatMessageSchema), async (req, res) => {
  try {
    const { message, conversationId, context } = req.body;

    // Find relevant context using RAG
    const relevantContext = findRelevantContext(message);
    
    // Combine user-provided context with RAG context
    const fullContext = context ? `${context}\n\n${relevantContext}` : relevantContext;

    // Create the conversation with OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using the faster, cost-effective model
      messages: [
        {
          role: "system",
          content: `${systemPrompt}

Context from knowledge base:
${fullContext}

Use this context to answer the user's question accurately. If the context doesn't contain relevant information, use your general knowledge about real estate but clearly indicate when you're going beyond the provided context.`
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    });

    const assistantMessage = completion.choices[0]?.message?.content;

    if (!assistantMessage) {
      throw new Error('No response generated from OpenAI');
    }

    // Log the conversation (optional - for analytics)
    try {
      // Store conversation in database for analytics and improvement
      // This is optional and can be disabled for privacy
      await prisma.$executeRaw`
        INSERT INTO chatbot_conversations (conversation_id, user_message, assistant_message, context_used, created_at)
        VALUES (${conversationId || 'anonymous'}, ${message}, ${assistantMessage}, ${relevantContext}, NOW())
        ON CONFLICT DO NOTHING
      `;
    } catch (dbError) {
      // Don't fail the request if logging fails
      console.error('Failed to log conversation:', dbError);
    }

    res.json({
      success: true,
      data: {
        message: assistantMessage,
        conversationId: conversationId || `conv_${Date.now()}`,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Chatbot error:', error);
    
    // Fallback response if OpenAI fails
    const fallbackResponse = `I'm having trouble connecting right now, but I'd be happy to help! AgentRadar provides real estate intelligence through court filing monitoring and AI-powered opportunity scoring. 

For immediate assistance:
• Pricing questions: Plans start at $197/month with early adopter discounts
• Free trial: 14 days with no credit card required  
• Support: Contact support@agentradar.app
• Demo: Schedule a call with our founder Mike Holownych

What specific information can I help you find?`;

    res.json({
      success: true,
      data: {
        message: fallbackResponse,
        conversationId: req.body.conversationId || `conv_${Date.now()}`,
        timestamp: new Date().toISOString(),
        fallback: true
      }
    });
  }
});

// Health check for chatbot service
router.get('/health', async (req, res) => {
  try {
    // Test OpenAI connection
    const testCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Test message" }],
      max_tokens: 10
    });

    res.json({
      success: true,
      status: 'healthy',
      openai: 'connected',
      model: 'gpt-4o-mini',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: 'OpenAI connection failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Get conversation history (if stored)
router.get('/conversations/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    const conversations = await prisma.$queryRaw`
      SELECT user_message, assistant_message, created_at 
      FROM chatbot_conversations 
      WHERE conversation_id = ${conversationId}
      ORDER BY created_at ASC
      LIMIT 50
    `;

    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    res.json({
      success: true,
      data: [],
      note: 'Conversation history not available'
    });
  }
});

export default router;