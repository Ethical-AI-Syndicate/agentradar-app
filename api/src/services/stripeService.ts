import Stripe from 'stripe';
import { prisma } from '../lib/database';

export interface SubscriptionProduct {
  id: string;
  name: string;
  price: number;
  priceId: string;
  interval: 'month' | 'year';
  features: string[];
  maxUsers?: number;
  maxAlerts?: number;
  maxProperties?: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  monthlyPriceId: string;
  yearlyPriceId: string;
  features: string[];
  limits: {
    users: number;
    alerts: number;
    properties: number;
    aiAnalysis: number;
    reports: number;
  };
  isPopular?: boolean;
}

export interface PaymentResult {
  success: boolean;
  clientSecret?: string;
  subscriptionId?: string;
  customerId?: string;
  error?: string;
  paymentIntentId?: string;
}

export interface WebhookEvent {
  type: string;
  data: any;
  created: number;
}

export class StripeService {
  private stripe: Stripe;
  
  // Predefined subscription plans
  public readonly subscriptionPlans: SubscriptionPlan[] = [
    {
      id: 'solo_agent',
      name: 'Solo Agent',
      description: 'Perfect for individual real estate professionals',
      monthlyPrice: 197,
      yearlyPrice: 1970, // 10% discount
      monthlyPriceId: 'price_solo_agent_monthly',
      yearlyPriceId: 'price_solo_agent_yearly',
      features: [
        'AI Property Analysis',
        'Market Predictions',
        'Lead Intelligence',
        'CMA Generation',
        'Email Alerts',
        'Mobile App Access',
        'Basic Support'
      ],
      limits: {
        users: 1,
        alerts: 100,
        properties: 500,
        aiAnalysis: 50,
        reports: 10
      }
    },
    {
      id: 'team_pro',
      name: 'Team Pro',
      description: 'Ideal for small real estate teams',
      monthlyPrice: 497,
      yearlyPrice: 4970, // 10% discount
      monthlyPriceId: 'price_team_pro_monthly',
      yearlyPriceId: 'price_team_pro_yearly',
      features: [
        'Everything in Solo Agent',
        'Team Collaboration',
        'Advanced Analytics',
        'White-label Options',
        'Priority Support',
        'Custom Integrations',
        'Bulk Operations'
      ],
      limits: {
        users: 5,
        alerts: 500,
        properties: 2500,
        aiAnalysis: 200,
        reports: 50
      },
      isPopular: true
    },
    {
      id: 'brokerage',
      name: 'Brokerage Enterprise',
      description: 'Complete solution for real estate brokerages',
      monthlyPrice: 1997,
      yearlyPrice: 19970, // 10% discount
      monthlyPriceId: 'price_brokerage_monthly',
      yearlyPriceId: 'price_brokerage_yearly',
      features: [
        'Everything in Team Pro',
        'Unlimited Users',
        'Full White-labeling',
        'API Access',
        'Dedicated Support',
        'Custom Development',
        'Training & Onboarding'
      ],
      limits: {
        users: -1, // Unlimited
        alerts: -1, // Unlimited
        properties: -1, // Unlimited
        aiAnalysis: -1, // Unlimited
        reports: -1 // Unlimited
      }
    }
  ];

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2024-04-10'
    });
  }

  /**
   * Create a new customer in Stripe
   */
  async createCustomer(
    email: string,
    name?: string,
    metadata?: Record<string, string>
  ): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name: name || email.split('@')[0],
        metadata: {
          source: 'agentradar',
          ...metadata
        }
      });

      return customer;
    } catch (error) {
      console.error('Stripe customer creation error:', error);
      throw new Error(`Failed to create customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create subscription for a customer
   */
  async createSubscription(
    customerId: string,
    planId: string,
    interval: 'month' | 'year' = 'month'
  ): Promise<PaymentResult> {
    try {
      const plan = this.subscriptionPlans.find(p => p.id === planId);
      if (!plan) {
        throw new Error(`Invalid plan ID: ${planId}`);
      }

      const priceId = interval === 'month' ? plan.monthlyPriceId : plan.yearlyPriceId;

      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{
          price: priceId
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription'
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          plan_id: planId,
          interval: interval,
          source: 'agentradar'
        }
      });

      const invoice = subscription.latest_invoice as Stripe.Invoice;
      const paymentIntent = (invoice as any).payment_intent as Stripe.PaymentIntent;

      return {
        success: true,
        clientSecret: paymentIntent.client_secret || undefined,
        subscriptionId: subscription.id,
        customerId: customerId,
        paymentIntentId: paymentIntent.id
      };

    } catch (error) {
      console.error('Stripe subscription creation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Subscription creation failed'
      };
    }
  }

  /**
   * Update subscription plan
   */
  async updateSubscription(
    subscriptionId: string,
    newPlanId: string,
    interval: 'month' | 'year' = 'month'
  ): Promise<PaymentResult> {
    try {
      const plan = this.subscriptionPlans.find(p => p.id === newPlanId);
      if (!plan) {
        throw new Error(`Invalid plan ID: ${newPlanId}`);
      }

      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      const newPriceId = interval === 'month' ? plan.monthlyPriceId : plan.yearlyPriceId;

      const updatedSubscription = await this.stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: subscription.items.data[0].id,
          price: newPriceId
        }],
        metadata: {
          plan_id: newPlanId,
          interval: interval,
          updated_at: new Date().toISOString()
        }
      });

      return {
        success: true,
        subscriptionId: updatedSubscription.id,
        customerId: updatedSubscription.customer as string
      };

    } catch (error) {
      console.error('Stripe subscription update error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Subscription update failed'
      };
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    immediately: boolean = false
  ): Promise<PaymentResult> {
    try {
      let subscription;
      
      if (immediately) {
        subscription = await this.stripe.subscriptions.cancel(subscriptionId);
      } else {
        subscription = await this.stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true
        });
      }

      return {
        success: true,
        subscriptionId: subscription.id,
        customerId: subscription.customer as string
      };

    } catch (error) {
      console.error('Stripe subscription cancellation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Subscription cancellation failed'
      };
    }
  }

  /**
   * Retrieve customer's subscriptions
   */
  async getCustomerSubscriptions(customerId: string): Promise<Stripe.Subscription[]> {
    try {
      const subscriptions = await this.stripe.subscriptions.list({
        customer: customerId,
        status: 'all',
        expand: ['data.latest_invoice', 'data.items.data.price']
      });

      return subscriptions.data;
    } catch (error) {
      console.error('Error fetching customer subscriptions:', error);
      return [];
    }
  }

  /**
   * Create payment intent for one-time payments
   */
  async createPaymentIntent(
    amount: number,
    currency: string = 'usd',
    customerId?: string,
    metadata?: Record<string, string>
  ): Promise<PaymentResult> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        customer: customerId,
        automatic_payment_methods: {
          enabled: true
        },
        metadata: {
          source: 'agentradar',
          ...metadata
        }
      });

      return {
        success: true,
        clientSecret: paymentIntent.client_secret || undefined,
        paymentIntentId: paymentIntent.id,
        customerId: customerId
      };

    } catch (error) {
      console.error('Stripe payment intent creation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment intent creation failed'
      };
    }
  }

  /**
   * Handle webhook events
   */
  async handleWebhook(
    rawBody: string,
    signature: string
  ): Promise<WebhookEvent | null> {
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        throw new Error('STRIPE_WEBHOOK_SECRET not configured');
      }

      const event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret
      );

      // Process different event types
      switch (event.type) {
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        default:
          console.log(`Unhandled webhook event type: ${event.type}`);
      }

      return {
        type: event.type,
        data: event.data.object,
        created: event.created
      };

    } catch (error) {
      console.error('Webhook processing error:', error);
      return null;
    }
  }

  /**
   * Get customer's current usage for billing
   */
  async getCustomerUsage(customerId: string): Promise<{
    users: number;
    alerts: number;
    properties: number;
    aiAnalysis: number;
    reports: number;
  }> {
    try {
      // This would query your database for actual usage
      // For now, returning mock data
      return {
        users: 1,
        alerts: 25,
        properties: 150,
        aiAnalysis: 12,
        reports: 3
      };
    } catch (error) {
      console.error('Error fetching customer usage:', error);
      return {
        users: 0,
        alerts: 0,
        properties: 0,
        aiAnalysis: 0,
        reports: 0
      };
    }
  }

  /**
   * Check if customer has exceeded plan limits
   */
  async checkPlanLimits(
    customerId: string,
    planId: string
  ): Promise<{
    withinLimits: boolean;
    usage: any;
    limits: any;
    overages: string[];
  }> {
    const plan = this.subscriptionPlans.find(p => p.id === planId);
    if (!plan) {
      return {
        withinLimits: false,
        usage: {},
        limits: {},
        overages: ['Invalid plan']
      };
    }

    const usage = await this.getCustomerUsage(customerId);
    const overages: string[] = [];

    // Check each limit (skip unlimited plans with -1 limits)
    Object.entries(plan.limits).forEach(([key, limit]) => {
      if (limit !== -1 && usage[key as keyof typeof usage] > limit) {
        overages.push(`${key}: ${usage[key as keyof typeof usage]}/${limit}`);
      }
    });

    return {
      withinLimits: overages.length === 0,
      usage,
      limits: plan.limits,
      overages
    };
  }

  /**
   * Private webhook handler methods
   */
  private async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    console.log('Subscription created:', subscription.id);
    
    // Update user subscription status in database
    // This would typically update your user model with subscription details
    const customerId = subscription.customer as string;
    const planId = subscription.metadata?.plan_id;
    
    // TODO: Update database with subscription info
    console.log(`Customer ${customerId} subscribed to plan ${planId}`);
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    console.log('Subscription updated:', subscription.id);
    
    // Handle plan changes, payment method updates, etc.
    const customerId = subscription.customer as string;
    const planId = subscription.metadata?.plan_id;
    
    // TODO: Update database with new subscription details
    console.log(`Customer ${customerId} updated subscription to ${planId}`);
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    console.log('Subscription cancelled:', subscription.id);
    
    // Handle subscription cancellation
    const customerId = subscription.customer as string;
    
    // TODO: Update user access and database
    console.log(`Customer ${customerId} subscription cancelled`);
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    console.log('Payment succeeded:', invoice.id);
    
    // Handle successful payment
    const customerId = invoice.customer as string;
    const amount = invoice.amount_paid / 100; // Convert from cents
    
    // TODO: Update payment history and extend access
    console.log(`Customer ${customerId} paid $${amount}`);
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    console.log('Payment failed:', invoice.id);
    
    // Handle failed payment
    const customerId = invoice.customer as string;
    
    // TODO: Send payment failure notifications, suspend access if needed
    console.log(`Payment failed for customer ${customerId}`);
  }

  /**
   * Generate customer portal URL for subscription management
   */
  async createPortalSession(
    customerId: string,
    returnUrl: string
  ): Promise<string> {
    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl
      });

      return session.url;
    } catch (error) {
      console.error('Portal session creation error:', error);
      throw new Error('Failed to create portal session');
    }
  }

  /**
   * Create Stripe Checkout session
   */
  async createCheckoutSession(
    planId: string,
    interval: 'month' | 'year',
    customerEmail: string,
    successUrl: string,
    cancelUrl: string,
    metadata?: Record<string, string>
  ): Promise<string> {
    try {
      const plan = this.subscriptionPlans.find(p => p.id === planId);
      if (!plan) {
        throw new Error(`Invalid plan ID: ${planId}`);
      }

      const priceId = interval === 'month' ? plan.monthlyPriceId : plan.yearlyPriceId;

      const session = await this.stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{
          price: priceId,
          quantity: 1
        }],
        customer_email: customerEmail,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          plan_id: planId,
          interval: interval,
          source: 'agentradar',
          ...metadata
        },
        subscription_data: {
          metadata: {
            plan_id: planId,
            interval: interval
          }
        }
      });

      return session.url || '';
    } catch (error) {
      console.error('Checkout session creation error:', error);
      throw new Error('Failed to create checkout session');
    }
  }

  /**
   * Get subscription analytics
   */
  async getSubscriptionAnalytics(days: number = 30): Promise<{
    totalRevenue: number;
    newSubscriptions: number;
    cancelledSubscriptions: number;
    churnRate: number;
    planDistribution: Record<string, number>;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // This would query your database for actual analytics
      // For now, returning mock analytics
      return {
        totalRevenue: 15750.00,
        newSubscriptions: 12,
        cancelledSubscriptions: 2,
        churnRate: 14.3,
        planDistribution: {
          'solo_agent': 8,
          'team_pro': 3,
          'brokerage': 1
        }
      };
    } catch (error) {
      console.error('Error fetching subscription analytics:', error);
      return {
        totalRevenue: 0,
        newSubscriptions: 0,
        cancelledSubscriptions: 0,
        churnRate: 0,
        planDistribution: {}
      };
    }
  }
}

export const stripeService = new StripeService();