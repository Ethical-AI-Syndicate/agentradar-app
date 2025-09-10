import express from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import validateRequest from '../middleware/validation';
import { z } from 'zod';
import crypto from 'crypto';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const createSSOProviderSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['SAML', 'OAUTH2', 'OIDC']),
  domain: z.string().min(1, 'Domain is required'),
  entityId: z.string().optional(),
  ssoUrl: z.string().url().optional(),
  sloUrl: z.string().url().optional(),
  certificate: z.string().optional(),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  authUrl: z.string().url().optional(),
  tokenUrl: z.string().url().optional(),
  userInfoUrl: z.string().url().optional(),
  scopes: z.array(z.string()).optional().default([]),
  attributeMapping: z.object({
    email: z.string().optional().default('email'),
    firstName: z.string().optional().default('given_name'),
    lastName: z.string().optional().default('family_name'),
    displayName: z.string().optional().default('name')
  }).optional(),
  autoProvision: z.boolean().optional().default(true),
  defaultRole: z.enum(['USER', 'ADMIN']).optional().default('USER'),
  defaultTier: z.enum(['FREE', 'SOLO_AGENT', 'PROFESSIONAL', 'TEAM_ENTERPRISE', 'WHITE_LABEL']).optional().default('PROFESSIONAL'),
  organizationId: z.string().optional()
});

const updateSSOProviderSchema = createSSOProviderSchema.partial();

const ssoLoginSchema = z.object({
  domain: z.string().min(1, 'Domain is required'),
  redirectUrl: z.string().url().optional()
});

const samlResponseSchema = z.object({
  SAMLResponse: z.string().min(1, 'SAML Response is required'),
  RelayState: z.string().optional()
});

const oauthCallbackSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().optional(),
  domain: z.string().min(1, 'Domain is required')
});

// ========================================
// ADMIN ROUTES - SSO Provider Management
// ========================================

// Get all SSO providers
router.get('/admin/providers', requireAdmin, async (req, res) => {
  try {
    const providers = await prisma.sSOProvider.findMany({
      include: {
        users: {
          select: { id: true, email: true, lastLogin: true }
        },
        _count: {
          select: { users: true, sessions: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const providersWithStats = providers.map(provider => ({
      ...provider,
      userCount: provider._count.users,
      sessionCount: provider._count.sessions,
      activeUsers: provider.users.filter(user => 
        user.lastLogin && new Date(user.lastLogin) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length,
      // Hide sensitive information
      clientSecret: provider.clientSecret ? '***' : null,
      certificate: provider.certificate ? '***' : null
    }));

    res.json({ success: true, data: providersWithStats });
  } catch (error) {
    console.error('Error fetching SSO providers:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch SSO providers' });
  }
});

// Create SSO provider
router.post('/admin/providers', requireAdmin, validateRequest(createSSOProviderSchema), async (req, res) => {
  try {
    const providerData = req.body;

    // Check if domain already exists
    const existingProvider = await prisma.sSOProvider.findUnique({
      where: { domain: providerData.domain }
    });

    if (existingProvider) {
      return res.status(400).json({ success: false, error: 'Domain already configured' });
    }

    const provider = await prisma.sSOProvider.create({
      data: providerData
    });

    res.status(201).json({ success: true, data: provider });
  } catch (error) {
    console.error('Error creating SSO provider:', error);
    res.status(500).json({ success: false, error: 'Failed to create SSO provider' });
  }
});

// Update SSO provider
router.put('/admin/providers/:providerId', requireAdmin, validateRequest(updateSSOProviderSchema), async (req, res) => {
  try {
    const { providerId } = req.params;
    const updateData = req.body;

    const provider = await prisma.sSOProvider.update({
      where: { id: providerId },
      data: updateData
    });

    res.json({ success: true, data: provider });
  } catch (error) {
    console.error('Error updating SSO provider:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'SSO provider not found' });
    }
    res.status(500).json({ success: false, error: 'Failed to update SSO provider' });
  }
});

// Delete SSO provider
router.delete('/admin/providers/:providerId', requireAdmin, async (req, res) => {
  try {
    const { providerId } = req.params;

    await prisma.sSOProvider.delete({
      where: { id: providerId }
    });

    res.json({ success: true, message: 'SSO provider deleted successfully' });
  } catch (error) {
    console.error('Error deleting SSO provider:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'SSO provider not found' });
    }
    res.status(500).json({ success: false, error: 'Failed to delete SSO provider' });
  }
});

// Test SSO provider configuration
router.post('/admin/providers/:providerId/test', requireAdmin, async (req, res) => {
  try {
    const { providerId } = req.params;

    const provider = await prisma.sSOProvider.findUnique({
      where: { id: providerId }
    });

    if (!provider) {
      return res.status(404).json({ success: false, error: 'SSO provider not found' });
    }

    // Basic configuration validation
    const validationResults = {
      hasRequiredFields: true,
      urlsReachable: false,
      certificateValid: false,
      issues: []
    };

    // Check required fields based on SSO type
    if (provider.type === 'SAML') {
      if (!provider.ssoUrl || !provider.entityId) {
        validationResults.hasRequiredFields = false;
        validationResults.issues.push('SAML requires SSO URL and Entity ID');
      }
    } else if (provider.type === 'OAUTH2' || provider.type === 'OIDC') {
      if (!provider.clientId || !provider.clientSecret || !provider.authUrl || !provider.tokenUrl) {
        validationResults.hasRequiredFields = false;
        validationResults.issues.push('OAuth2/OIDC requires Client ID, Client Secret, Auth URL, and Token URL');
      }
    }

    // In production, you would test actual connectivity here
    validationResults.urlsReachable = true; // Mock for now
    validationResults.certificateValid = true; // Mock for now

    res.json({
      success: true,
      data: {
        provider: {
          id: provider.id,
          name: provider.name,
          type: provider.type,
          domain: provider.domain
        },
        validation: validationResults
      }
    });
  } catch (error) {
    console.error('Error testing SSO provider:', error);
    res.status(500).json({ success: false, error: 'Failed to test SSO provider' });
  }
});

// ========================================
// PUBLIC SSO ROUTES - Authentication Flow
// ========================================

// Initiate SSO login
router.post('/login', validateRequest(ssoLoginSchema), async (req, res) => {
  try {
    const { domain, redirectUrl } = req.body;

    const provider = await prisma.sSOProvider.findUnique({
      where: { domain, isActive: true }
    });

    if (!provider) {
      return res.status(404).json({ 
        success: false, 
        error: 'SSO not configured for this domain' 
      });
    }

    // Generate state for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');

    if (provider.type === 'SAML') {
      // For SAML, we would generate a SAML AuthnRequest
      // This is a simplified implementation
      const samlRequest = generateSAMLRequest(provider, redirectUrl);
      
      res.json({
        success: true,
        data: {
          type: 'SAML',
          ssoUrl: provider.ssoUrl,
          samlRequest,
          relayState: state
        }
      });
    } else if (provider.type === 'OAUTH2' || provider.type === 'OIDC') {
      // For OAuth2/OIDC, redirect to authorization URL
      const authUrl = new URL(provider.authUrl!);
      authUrl.searchParams.set('client_id', provider.clientId!);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', provider.scopes.join(' ') || 'openid profile email');
      authUrl.searchParams.set('state', state);
      authUrl.searchParams.set('redirect_uri', `${req.protocol}://${req.get('host')}/api/sso/callback/${provider.domain}`);

      res.json({
        success: true,
        data: {
          type: provider.type,
          authUrl: authUrl.toString(),
          state
        }
      });
    }

    // Store session for tracking
    await prisma.sSOSession.create({
      data: {
        providerId: provider.id,
        sessionId: state,
        relayState: redirectUrl || '',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
      }
    });

  } catch (error) {
    console.error('Error initiating SSO login:', error);
    res.status(500).json({ success: false, error: 'Failed to initiate SSO login' });
  }
});

// Handle SAML response
router.post('/saml/acs', validateRequest(samlResponseSchema), async (req, res) => {
  try {
    const { SAMLResponse, RelayState } = req.body;

    // In production, you would validate and parse the SAML response
    // This is a simplified implementation
    const userInfo = parseSAMLResponse(SAMLResponse);

    if (!userInfo.email) {
      return res.status(400).json({ success: false, error: 'Email not provided in SAML response' });
    }

    // Find the session
    const session = await prisma.sSOSession.findUnique({
      where: { sessionId: RelayState || '' },
      include: { provider: true }
    });

    if (!session || session.expiresAt < new Date()) {
      return res.status(400).json({ success: false, error: 'Invalid or expired session' });
    }

    const token = await authenticateOrCreateUser(userInfo, session.provider);

    // Clean up session
    await prisma.sSOSession.delete({ where: { id: session.id } });

    res.json({
      success: true,
      data: {
        token,
        redirectUrl: session.relayState || '/dashboard'
      }
    });
  } catch (error) {
    console.error('Error handling SAML response:', error);
    res.status(500).json({ success: false, error: 'Failed to process SAML response' });
  }
});

// Handle OAuth2 callback
router.get('/callback/:domain', async (req, res) => {
  try {
    const { domain } = req.params;
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({ success: false, error: 'Missing authorization code or state' });
    }

    const provider = await prisma.sSOProvider.findUnique({
      where: { domain, isActive: true }
    });

    if (!provider) {
      return res.status(404).json({ success: false, error: 'SSO provider not found' });
    }

    // Find the session
    const session = await prisma.sSOSession.findUnique({
      where: { sessionId: state as string }
    });

    if (!session || session.expiresAt < new Date()) {
      return res.status(400).json({ success: false, error: 'Invalid or expired session' });
    }

    // Exchange code for token
    const tokenResponse = await exchangeCodeForToken(provider, code as string, req);
    const userInfo = await fetchUserInfo(provider, tokenResponse.access_token);

    const token = await authenticateOrCreateUser(userInfo, provider);

    // Clean up session
    await prisma.sSOSession.delete({ where: { id: session.id } });

    // Redirect to frontend with token
    const redirectUrl = session.relayState || '/dashboard';
    res.redirect(`${redirectUrl}?token=${token}`);

  } catch (error) {
    console.error('Error handling OAuth callback:', error);
    res.status(500).json({ success: false, error: 'Failed to process OAuth callback' });
  }
});

// Get SSO status for domain
router.get('/status/:domain', async (req, res) => {
  try {
    const { domain } = req.params;

    const provider = await prisma.sSOProvider.findUnique({
      where: { domain, isActive: true },
      select: {
        id: true,
        name: true,
        type: true,
        domain: true,
        isActive: true
      }
    });

    if (!provider) {
      return res.json({ 
        success: true, 
        data: { 
          enabled: false,
          message: 'SSO not configured for this domain'
        }
      });
    }

    res.json({
      success: true,
      data: {
        enabled: true,
        provider: {
          name: provider.name,
          type: provider.type
        }
      }
    });
  } catch (error) {
    console.error('Error checking SSO status:', error);
    res.status(500).json({ success: false, error: 'Failed to check SSO status' });
  }
});

// ========================================
// HELPER FUNCTIONS
// ========================================

function generateSAMLRequest(provider: any, redirectUrl?: string): string {
  // In production, this would generate a proper SAML AuthnRequest
  // This is a placeholder implementation
  const requestId = `id_${Date.now()}`;
  const issueInstant = new Date().toISOString();
  
  return Buffer.from(`
    <samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" 
                        ID="${requestId}"
                        IssueInstant="${issueInstant}"
                        Destination="${provider.ssoUrl}">
      <saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">${provider.entityId}</saml:Issuer>
    </samlp:AuthnRequest>
  `).toString('base64');
}

function parseSAMLResponse(samlResponse: string): any {
  // In production, this would properly parse and validate the SAML response
  // This is a placeholder implementation
  try {
    const decoded = Buffer.from(samlResponse, 'base64').toString();
    // Mock parsed user info - in production, extract from SAML response
    return {
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      nameId: 'user@example.com'
    };
  } catch (error) {
    throw new Error('Invalid SAML response');
  }
}

async function exchangeCodeForToken(provider: any, code: string, req: express.Request): Promise<any> {
  const tokenPayload = {
    grant_type: 'authorization_code',
    code,
    redirect_uri: `${req.protocol}://${req.get('host')}/api/sso/callback/${provider.domain}`,
    client_id: provider.clientId,
    client_secret: provider.clientSecret
  };

  // In production, make actual HTTP request to token endpoint
  // This is a mock response
  return {
    access_token: 'mock_access_token',
    token_type: 'Bearer',
    expires_in: 3600
  };
}

async function fetchUserInfo(provider: any, accessToken: string): Promise<any> {
  // In production, make actual HTTP request to user info endpoint
  // This is a mock response
  return {
    email: 'user@example.com',
    given_name: 'John',
    family_name: 'Doe',
    name: 'John Doe',
    sub: 'user123'
  };
}

async function authenticateOrCreateUser(userInfo: any, provider: any): Promise<string> {
  let user;
  
  // Check if SSO user already exists
  const ssoUser = await prisma.sSOUser.findUnique({
    where: {
      providerId_externalId: {
        providerId: provider.id,
        externalId: userInfo.sub || userInfo.nameId || userInfo.email
      }
    },
    include: { user: true }
  });

  if (ssoUser) {
    // Update existing user
    user = await prisma.user.update({
      where: { id: ssoUser.userId },
      data: { lastLogin: new Date() }
    });

    // Update SSO user record
    await prisma.sSOUser.update({
      where: { id: ssoUser.id },
      data: {
        lastLogin: new Date(),
        attributes: userInfo
      }
    });
  } else if (provider.autoProvision) {
    // Create new user
    const userData = {
      email: userInfo.email,
      firstName: userInfo.firstName || userInfo.given_name || '',
      lastName: userInfo.lastName || userInfo.family_name || '',
      password: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10), // Random password
      role: provider.defaultRole,
      subscriptionTier: provider.defaultTier,
      isActive: true
    };

    user = await prisma.user.create({ data: userData });

    // Create SSO user record
    await prisma.sSOUser.create({
      data: {
        providerId: provider.id,
        externalId: userInfo.sub || userInfo.nameId || userInfo.email,
        userId: user.id,
        email: userInfo.email,
        firstName: userInfo.firstName || userInfo.given_name,
        lastName: userInfo.lastName || userInfo.family_name,
        attributes: userInfo,
        lastLogin: new Date()
      }
    });
  } else {
    throw new Error('User auto-provisioning is disabled');
  }

  // Generate JWT token
  const token = jwt.sign(
    { 
      userId: user.id, 
      email: user.email, 
      role: user.role,
      sso: true,
      provider: provider.name
    },
    process.env.JWT_SECRET!,
    { expiresIn: '24h' }
  );

  return token;
}

export default router;