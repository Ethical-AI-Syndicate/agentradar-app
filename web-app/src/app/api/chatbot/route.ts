// Next.js API Route - AI Chatbot with OpenAI Integration
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import OpenAI from 'openai';

let prisma: PrismaClient | null = null;
let openai: OpenAI | null = null;

function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });
  }
  return prisma;
}

function getOpenAI() {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return openai;
}

// Authentication helper
function authenticateToken(request: NextRequest): { success: boolean; userId?: string; error?: string } {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return { success: false, error: 'No token provided' };
  }

  const token = authHeader.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return { success: true, userId: decoded.userId };
  } catch {
    return { success: false, error: 'Invalid token' };
  }
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    const auth = authenticateToken(request);
    if (!auth.success) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 401, headers: corsHeaders });
    }

    const db = getPrisma();

    // GET /api/chatbot?action=history - Chat history
    if (action === 'history') {
      const limit = parseInt(searchParams.get('limit') || '20');
      const conversations = await db.chatConversation.findMany({
        where: { userId: auth.userId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 10
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: limit
      });

      return NextResponse.json({
        success: true,
        data: conversations,
        message: `Found ${conversations.length} conversations`
      }, { headers: corsHeaders });
    }

    // GET /api/chatbot?action=conversation&id=ID - Specific conversation
    if (action === 'conversation') {
      const conversationId = searchParams.get('id');
      if (!conversationId) {
        return NextResponse.json({ success: false, error: 'Conversation ID required' }, { status: 400, headers: corsHeaders });
      }

      const conversation = await db.chatConversation.findFirst({
        where: { 
          id: conversationId,
          userId: auth.userId 
        },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' }
          }
        }
      });

      if (!conversation) {
        return NextResponse.json({ success: false, error: 'Conversation not found' }, { status: 404, headers: corsHeaders });
      }

      return NextResponse.json({
        success: true,
        data: conversation
      }, { headers: corsHeaders });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400, headers: corsHeaders });

  } catch (error) {
    console.error('Chatbot API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error',
      timestamp: new Date().toISOString()
    }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const body = await request.json();

    const auth = authenticateToken(request);
    if (!auth.success) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 401, headers: corsHeaders });
    }

    const db = getPrisma();

    // POST /api/chatbot?action=chat - Send message
    if (action === 'chat') {
      const { message, conversationId } = body;
      
      if (!message) {
        return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400, headers: corsHeaders });
      }

      // Find or create conversation
      let conversation;
      if (conversationId) {
        conversation = await db.chatConversation.findFirst({
          where: { id: conversationId, userId: auth.userId }
        });
        if (!conversation) {
          return NextResponse.json({ success: false, error: 'Conversation not found' }, { status: 404, headers: corsHeaders });
        }
      } else {
        conversation = await db.chatConversation.create({
          data: {
            userId: auth.userId!,
            title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      }

      // Save user message
      await db.chatMessage.create({
        data: {
          conversationId: conversation.id,
          role: 'user',
          content: message,
          createdAt: new Date()
        }
      });

      try {
        // Get conversation history for context
        const messages = await db.chatMessage.findMany({
          where: { conversationId: conversation.id },
          orderBy: { createdAt: 'asc' },
          take: 10
        });

        // Build knowledge base context
        const knowledgeContext = `
Real Estate Market Intelligence:
- AgentRadar provides power of sale alerts, estate sales, and development applications
- We track property opportunities across GTA, Toronto, York, Peel, Durham, and Halton regions
- Our AI analyzes property investment potential with opportunity scoring (0-100)
- We offer MLS integration with Repliers and bring-your-own-MLS support
- Subscription tiers: Solo Agent ($197/month), Team Pro ($497/month), Brokerage ($1997/month)

Platform Features:
- Real-time property alerts with intelligent matching
- AI-powered property analysis using GPT-4
- Learning Management System for agent training
- Enterprise SSO for white-label solutions
- Comprehensive admin dashboard and user management
        `.trim();

        const systemPrompt = `You are AgentRadar's AI Assistant, an expert real estate intelligence advisor. You help real estate professionals maximize opportunities and make informed decisions.

Key capabilities:
- Property market analysis and investment guidance
- Real estate regulations and compliance advice
- Platform feature assistance and training
- Market trend insights and opportunity identification

Always be professional, knowledgeable, and helpful. Focus on actionable insights for real estate professionals.`;

        // Prepare OpenAI messages
        const openaiMessages = [
          {
            role: "system" as const,
            content: `${systemPrompt}\n\nContext:\n${knowledgeContext}`
          },
          ...messages.map(msg => ({
            role: msg.role as "user" | "assistant",
            content: msg.content
          }))
        ];

        const ai = getOpenAI();
        const completion = await ai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: openaiMessages,
          max_tokens: 500,
          temperature: 0.7
        });

        const aiResponse = completion.choices[0].message.content || 'I apologize, but I was unable to generate a response. Please try again.';

        // Save AI response
        await db.chatMessage.create({
          data: {
            conversationId: conversation.id,
            role: 'assistant',
            content: aiResponse,
            createdAt: new Date()
          }
        });

        // Update conversation timestamp
        await db.chatConversation.update({
          where: { id: conversation.id },
          data: { updatedAt: new Date() }
        });

        return NextResponse.json({
          success: true,
          data: {
            conversationId: conversation.id,
            message: aiResponse,
            timestamp: new Date().toISOString()
          }
        }, { headers: corsHeaders });

      } catch (aiError) {
        console.error('OpenAI error:', aiError);
        
        // Fallback response
        const fallbackResponse = "I'm having trouble processing your request right now. Our real estate intelligence platform offers property alerts, market analysis, and agent training. How can I help you with your real estate business today?";
        
        await db.chatMessage.create({
          data: {
            conversationId: conversation.id,
            role: 'assistant',
            content: fallbackResponse,
            createdAt: new Date()
          }
        });

        return NextResponse.json({
          success: true,
          data: {
            conversationId: conversation.id,
            message: fallbackResponse,
            timestamp: new Date().toISOString(),
            fallback: true
          }
        }, { headers: corsHeaders });
      }
    }

    // POST /api/chatbot?action=new-conversation - Start new conversation
    if (action === 'new-conversation') {
      const conversation = await db.chatConversation.create({
        data: {
          userId: auth.userId!,
          title: 'New Conversation',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        data: conversation,
        message: 'New conversation created'
      }, { status: 201, headers: corsHeaders });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400, headers: corsHeaders });

  } catch (error) {
    console.error('Chatbot API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error',
      timestamp: new Date().toISOString()
    }, { status: 500, headers: corsHeaders });
  }
}