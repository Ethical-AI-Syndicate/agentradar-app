// Next.js API Route - Enterprise Single Sign-On (SSO)
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

let prisma: PrismaClient | null = null;

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

// Authentication helper for admin routes
function authenticateAdmin(request: NextRequest): { success: boolean; userId?: string; error?: string } {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return { success: false, error: 'No token provided' };
  }

  const token = authHeader.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    if (decoded.role !== 'ADMIN') {
      return { success: false, error: 'Admin access required' };
    }
    return { success: true, userId: decoded.userId };
  } catch {
    return { success: false, error: 'Invalid token' };
  }
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const db = getPrisma();

    // GET /api/sso?action=providers - List SSO providers (Admin only)
    if (action === 'providers') {
      const auth = authenticateAdmin(request);
      if (!auth.success) {
        return NextResponse.json({ success: false, error: auth.error }, { status: 401, headers: corsHeaders });
      }

      const providers = await db.sSOProvider.findMany({
        select: {
          id: true,
          name: true,
          type: true,
          domain: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: { users: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return NextResponse.json({
        success: true,
        data: providers,
        message: `Found ${providers.length} SSO providers`
      }, { headers: corsHeaders });
    }

    // GET /api/sso?action=check&domain=example.com - Check if domain has SSO
    if (action === 'check') {
      const domain = searchParams.get('domain');
      if (!domain) {
        return NextResponse.json({ success: false, error: 'Domain parameter required' }, { status: 400, headers: corsHeaders });
      }

      const provider = await db.sSOProvider.findFirst({
        where: { 
          domain: domain.toLowerCase(),
          isActive: true 
        },
        select: {
          id: true,
          name: true,
          type: true,
          domain: true,
          ssoUrl: true
        }
      });

      return NextResponse.json({
        success: true,
        data: {
          hasSso: !!provider,
          provider: provider || null
        }
      }, { headers: corsHeaders });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400, headers: corsHeaders });

  } catch (error) {
    console.error('SSO API error:', error);
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
    const db = getPrisma();

    // POST /api/sso?action=login - Initiate SSO login
    if (action === 'login') {
      const { domain, redirectUrl } = body;
      
      if (!domain) {
        return NextResponse.json({ success: false, error: 'Domain is required' }, { status: 400, headers: corsHeaders });
      }

      const provider = await db.sSOProvider.findFirst({
        where: { 
          domain: domain.toLowerCase(),
          isActive: true 
        }
      });

      if (!provider) {
        return NextResponse.json({ success: false, error: 'SSO not configured for this domain' }, { status: 404, headers: corsHeaders });
      }

      let response: any = {
        success: true,
        providerId: provider.id,
        providerName: provider.name,
        type: provider.type
      };

      // Generate SSO URLs based on provider type
      if (provider.type === 'SAML') {
        const samlRequest = generateSAMLRequest(provider, redirectUrl);
        response.ssoUrl = provider.ssoUrl;
        response.samlRequest = samlRequest;
      } else if (provider.type === 'OAUTH2') {
        const state = crypto.randomBytes(32).toString('hex');
        const oauth2Url = `${provider.ssoUrl}?client_id=${provider.clientId}&redirect_uri=${encodeURIComponent(redirectUrl || 'https://agentradar.app/auth/callback')}&response_type=code&state=${state}`;
        response.ssoUrl = oauth2Url;
        response.state = state;
      } else if (provider.type === 'OIDC') {
        const nonce = crypto.randomBytes(32).toString('hex');
        const oidcUrl = `${provider.ssoUrl}?client_id=${provider.clientId}&redirect_uri=${encodeURIComponent(redirectUrl || 'https://agentradar.app/auth/callback')}&response_type=code&scope=openid email profile&nonce=${nonce}`;
        response.ssoUrl = oidcUrl;
        response.nonce = nonce;
      }

      return NextResponse.json(response, { headers: corsHeaders });
    }

    // POST /api/sso?action=callback - Handle SSO callback
    if (action === 'callback') {
      const { providerId, code, state, samlResponse } = body;
      
      if (!providerId) {
        return NextResponse.json({ success: false, error: 'Provider ID is required' }, { status: 400, headers: corsHeaders });
      }

      const provider = await db.sSOProvider.findUnique({
        where: { id: providerId, isActive: true }
      });

      if (!provider) {
        return NextResponse.json({ success: false, error: 'Invalid provider' }, { status: 404, headers: corsHeaders });
      }

      // Process SSO response based on provider type
      let userInfo: any = {};
      
      if (provider.type === 'SAML' && samlResponse) {
        userInfo = await processSAMLResponse(provider, samlResponse);
      } else if ((provider.type === 'OAUTH2' || provider.type === 'OIDC') && code) {
        userInfo = await processOAuth2Code(provider, code);
      } else {
        return NextResponse.json({ success: false, error: 'Invalid callback data' }, { status: 400, headers: corsHeaders });
      }

      if (!userInfo.email) {
        return NextResponse.json({ success: false, error: 'No email received from SSO provider' }, { status: 400, headers: corsHeaders });
      }

      // Find or create user
      let user = await db.user.findUnique({
        where: { email: userInfo.email }
      });

      if (!user) {
        // Auto-provision new user
        user = await db.user.create({
          data: {
            email: userInfo.email,
            firstName: userInfo.firstName || 'SSO',
            lastName: userInfo.lastName || 'User',
            password: crypto.randomBytes(32).toString('hex'), // Random password (won't be used)
            licenseNumber: 'SSO-AUTO-PROVISIONED',
            role: 'USER',
            subscriptionTier: 'FREE',
            isActive: true,
            ssoProviderId: provider.id
          }
        });
      } else if (!user.ssoProviderId) {
        // Link existing user to SSO provider
        user = await db.user.update({
          where: { id: user.id },
          data: { ssoProviderId: provider.id }
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: '24h' }
      );

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        token,
        message: 'SSO login successful'
      }, { headers: corsHeaders });
    }

    // POST /api/sso?action=create-provider - Create SSO provider (Admin only)
    if (action === 'create-provider') {
      const auth = authenticateAdmin(request);
      if (!auth.success) {
        return NextResponse.json({ success: false, error: auth.error }, { status: 401, headers: corsHeaders });
      }

      const { name, type, domain, ssoUrl, clientId, clientSecret, certificate } = body;
      
      if (!name || !type || !domain || !ssoUrl) {
        return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400, headers: corsHeaders });
      }

      // Check if domain already exists
      const existingProvider = await db.sSOProvider.findFirst({
        where: { domain: domain.toLowerCase() }
      });

      if (existingProvider) {
        return NextResponse.json({ success: false, error: 'SSO provider already exists for this domain' }, { status: 409, headers: corsHeaders });
      }

      const provider = await db.sSOProvider.create({
        data: {
          name,
          type,
          domain: domain.toLowerCase(),
          ssoUrl,
          clientId,
          clientSecret,
          certificate,
          isActive: true
        }
      });

      return NextResponse.json({
        success: true,
        data: {
          id: provider.id,
          name: provider.name,
          type: provider.type,
          domain: provider.domain,
          isActive: provider.isActive
        },
        message: 'SSO provider created successfully'
      }, { status: 201, headers: corsHeaders });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400, headers: corsHeaders });

  } catch (error) {
    console.error('SSO API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error',
      timestamp: new Date().toISOString()
    }, { status: 500, headers: corsHeaders });
  }
}

// Helper functions for SSO processing
function generateSAMLRequest(provider: any, redirectUrl?: string): string {
  // Simplified SAML request generation
  const requestId = crypto.randomBytes(16).toString('hex');
  const timestamp = new Date().toISOString();
  
  return `<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" 
    ID="${requestId}" 
    Version="2.0" 
    IssueInstant="${timestamp}" 
    Destination="${provider.ssoUrl}"
    AssertionConsumerServiceURL="${redirectUrl || 'https://agentradar.app/auth/saml/callback'}">
    <saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">AgentRadar</saml:Issuer>
  </samlp:AuthnRequest>`;
}

async function processSAMLResponse(provider: any, samlResponse: string): Promise<any> {
  // Simplified SAML response processing
  // In production, use proper SAML library for parsing and validation
  const decodedResponse = Buffer.from(samlResponse, 'base64').toString();
  
  // Extract email from SAML response (simplified)
  const emailMatch = decodedResponse.match(/<saml:AttributeValue[^>]*>([^<]*@[^<]*)<\/saml:AttributeValue>/);
  const email = emailMatch ? emailMatch[1] : null;
  
  return {
    email,
    firstName: 'SAML',
    lastName: 'User'
  };
}

async function processOAuth2Code(provider: any, code: string): Promise<any> {
  // Simplified OAuth2/OIDC code exchange
  // In production, implement proper token exchange and user info retrieval
  return {
    email: 'oauth.user@example.com',
    firstName: 'OAuth',
    lastName: 'User'
  };
}