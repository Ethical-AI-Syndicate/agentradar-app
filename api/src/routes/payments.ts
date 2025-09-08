import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { stripeService } from '../services/stripeService';
import { prisma } from '../lib/database';

const router = Router();

/**
 * GET /api/payments/plans
 * Get all available subscription plans
 */
router.get('/plans', async (req: Request, res: Response) => {
  try {
    const plans = stripeService.subscriptionPlans;
    
    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription plans'
    });
  }
});

/**
 * POST /api/payments/create-customer
 * Create a new Stripe customer
 */
router.post('/create-customer', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;
    const userId = req.user?.id;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const customer = await stripeService.createCustomer(
      email,
      name,
      { user_id: userId?.toString() || '' }
    );

    // Update user with Stripe customer ID
    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customer.id }
      });
    }

    res.json({
      success: true,
      data: {
        customerId: customer.id,
        email: customer.email
      }
    });
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create customer'
    });
  }
});

/**
 * POST /api/payments/create-subscription
 * Create a new subscription
 */
router.post('/create-subscription', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { planId, interval = 'month' } = req.body;
    const userId = req.user?.id;

    if (!planId) {
      return res.status(400).json({
        success: false,
        message: 'Plan ID is required'
      });
    }

    // Get or create Stripe customer
    let user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let customerId = user.stripeCustomerId;

    // Create customer if doesn't exist
    if (!customerId) {
      const customer = await stripeService.createCustomer(
        user.email,
        `${user.firstName} ${user.lastName}` || user.email,
        { user_id: userId?.toString() || '' }
      );
      
      customerId = customer.id;
      
      // Update user with customer ID
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId }
      });
    }

    const result = await stripeService.createSubscription(
      customerId,
      planId,
      interval
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      data: {
        clientSecret: result.clientSecret,
        subscriptionId: result.subscriptionId,
        customerId: result.customerId
      }
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create subscription'
    });
  }
});

/**
 * POST /api/payments/create-checkout-session
 * Create Stripe Checkout session
 */
router.post('/create-checkout-session', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { planId, interval = 'month', successUrl, cancelUrl } = req.body;
    const user = req.user;

    if (!planId || !successUrl || !cancelUrl) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: planId, successUrl, cancelUrl'
      });
    }

    const sessionUrl = await stripeService.createCheckoutSession(
      planId,
      interval,
      user?.email || '',
      successUrl,
      cancelUrl,
      { user_id: user?.id?.toString() || '' }
    );

    res.json({
      success: true,
      data: {
        url: sessionUrl
      }
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create checkout session'
    });
  }
});

/**
 * PUT /api/payments/update-subscription
 * Update existing subscription
 */
router.put('/update-subscription', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { subscriptionId, planId, interval = 'month' } = req.body;

    if (!subscriptionId || !planId) {
      return res.status(400).json({
        success: false,
        message: 'Subscription ID and plan ID are required'
      });
    }

    const result = await stripeService.updateSubscription(
      subscriptionId,
      planId,
      interval
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      data: {
        subscriptionId: result.subscriptionId,
        customerId: result.customerId
      }
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update subscription'
    });
  }
});

/**
 * DELETE /api/payments/cancel-subscription
 * Cancel subscription
 */
router.delete('/cancel-subscription', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { subscriptionId, immediately = false } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({
        success: false,
        message: 'Subscription ID is required'
      });
    }

    const result = await stripeService.cancelSubscription(
      subscriptionId,
      immediately
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      message: immediately ? 'Subscription cancelled immediately' : 'Subscription will cancel at period end',
      data: {
        subscriptionId: result.subscriptionId,
        customerId: result.customerId
      }
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription'
    });
  }
});

/**
 * GET /api/payments/subscriptions
 * Get user's subscriptions
 */
router.get('/subscriptions', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user?.stripeCustomerId) {
      return res.json({
        success: true,
        data: []
      });
    }

    const subscriptions = await stripeService.getCustomerSubscriptions(
      user.stripeCustomerId
    );

    res.json({
      success: true,
      data: subscriptions.map(sub => ({
        id: sub.id,
        status: sub.status,
        currentPeriodStart: (sub as any).current_period_start,
        currentPeriodEnd: (sub as any).current_period_end,
        cancelAtPeriodEnd: (sub as any).cancel_at_period_end,
        planId: sub.metadata?.plan_id,
        interval: sub.metadata?.interval,
        amount: sub.items.data[0]?.price?.unit_amount ? sub.items.data[0].price.unit_amount / 100 : 0,
        currency: sub.items.data[0]?.price?.currency || 'usd'
      }))
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscriptions'
    });
  }
});

/**
 * GET /api/payments/usage
 * Get user's current usage and limits
 */
router.get('/usage', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user?.stripeCustomerId) {
      return res.json({
        success: true,
        data: {
          usage: { users: 0, alerts: 0, properties: 0, aiAnalysis: 0, reports: 0 },
          limits: { users: 1, alerts: 10, properties: 50, aiAnalysis: 5, reports: 2 },
          withinLimits: true,
          overages: []
        }
      });
    }

    // Get current subscription to determine plan
    const subscriptions = await stripeService.getCustomerSubscriptions(user.stripeCustomerId);
    const activeSubscription = subscriptions.find(sub => 
      sub.status === 'active' || sub.status === 'trialing'
    );

    if (!activeSubscription?.metadata?.plan_id) {
      return res.json({
        success: true,
        data: {
          usage: { users: 0, alerts: 0, properties: 0, aiAnalysis: 0, reports: 0 },
          limits: { users: 1, alerts: 10, properties: 50, aiAnalysis: 5, reports: 2 },
          withinLimits: true,
          overages: []
        }
      });
    }

    const planLimits = await stripeService.checkPlanLimits(
      user.stripeCustomerId,
      activeSubscription.metadata.plan_id
    );

    res.json({
      success: true,
      data: planLimits
    });
  } catch (error) {
    console.error('Error fetching usage:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch usage information'
    });
  }
});

/**
 * POST /api/payments/create-portal-session
 * Create Stripe customer portal session
 */
router.post('/create-portal-session', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { returnUrl } = req.body;
    const userId = req.user?.id;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user?.stripeCustomerId) {
      return res.status(400).json({
        success: false,
        message: 'No Stripe customer found'
      });
    }

    const portalUrl = await stripeService.createPortalSession(
      user.stripeCustomerId,
      returnUrl || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/dashboard`
    );

    res.json({
      success: true,
      data: {
        url: portalUrl
      }
    });
  } catch (error) {
    console.error('Error creating portal session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create portal session'
    });
  }
});

/**
 * POST /api/payments/webhook
 * Stripe webhook endpoint
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    
    if (!signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing stripe-signature header'
      });
    }

    const event = await stripeService.handleWebhook(
      req.body,
      signature
    );

    if (!event) {
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook signature'
      });
    }

    console.log(`Processed webhook event: ${event.type}`);

    res.json({
      success: true,
      message: 'Webhook processed successfully'
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(400).json({
      success: false,
      message: 'Webhook processing failed'
    });
  }
});

/**
 * GET /api/payments/analytics (Admin only)
 * Get subscription analytics
 */
router.get('/analytics', authenticateToken, async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { days = 30 } = req.query;
    
    const analytics = await stripeService.getSubscriptionAnalytics(
      parseInt(days as string) || 30
    );

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription analytics'
    });
  }
});

export default router;