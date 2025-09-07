import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { PrismaClient, SubscriptionTier, SubscriptionStatus } from '@prisma/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

const prisma = new PrismaClient();

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('Missing Stripe signature');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log('Received Stripe webhook:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionCancellation(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string;
    
    // Get the customer to find the user
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) {
      console.error('Customer was deleted');
      return;
    }

    const userEmail = customer.email;
    if (!userEmail) {
      console.error('No email found for customer');
      return;
    }

    // Map Stripe subscription to our tiers
    const subscriptionTier = mapStripePriceToTier(subscription.items.data[0]?.price.id);
    const status = mapStripeStatusToOurStatus(subscription.status);

    // Update user in database
    await prisma.user.update({
      where: { email: userEmail },
      data: {
        stripeCustomerId: customerId,
        subscriptionTier,
        subscriptionStatus: status,
        subscriptionId: subscription.id,
        subscriptionCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    });

    console.log(`Updated subscription for user ${userEmail}: ${subscriptionTier} (${status})`);
  } catch (error) {
    console.error('Error handling subscription change:', error);
  }
}

async function handleSubscriptionCancellation(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string;
    
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) return;

    const userEmail = customer.email;
    if (!userEmail) return;

    await prisma.user.update({
      where: { email: userEmail },
      data: {
        subscriptionTier: SubscriptionTier.FREE,
        subscriptionStatus: SubscriptionStatus.CANCELLED,
        subscriptionId: null,
        subscriptionCurrentPeriodEnd: null,
      },
    });

    console.log(`Cancelled subscription for user ${userEmail}`);
  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    const customerId = invoice.customer as string;
    
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) return;

    const userEmail = customer.email;
    if (!userEmail) return;

    // Update subscription status to active
    await prisma.user.update({
      where: { email: userEmail },
      data: {
        subscriptionStatus: SubscriptionStatus.ACTIVE,
      },
    });

    console.log(`Payment succeeded for user ${userEmail}`);
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  try {
    const customerId = invoice.customer as string;
    
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) return;

    const userEmail = customer.email;
    if (!userEmail) return;

    // Update subscription status to past due
    await prisma.user.update({
      where: { email: userEmail },
      data: {
        subscriptionStatus: SubscriptionStatus.PAST_DUE,
      },
    });

    console.log(`Payment failed for user ${userEmail}`);
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string;

    if (!subscriptionId) return;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    await handleSubscriptionChange(subscription);

    console.log(`Checkout completed for customer ${customerId}`);
  } catch (error) {
    console.error('Error handling checkout completion:', error);
  }
}

function mapStripePriceToTier(priceId?: string): SubscriptionTier {
  // Map your Stripe price IDs to subscription tiers
  const priceMap: Record<string, SubscriptionTier> = {
    // Add your actual Stripe price IDs here
    'price_solo_agent': SubscriptionTier.SOLO_AGENT,
    'price_professional': SubscriptionTier.PROFESSIONAL,
    'price_team_enterprise': SubscriptionTier.TEAM_ENTERPRISE,
    'price_white_label': SubscriptionTier.WHITE_LABEL,
  };

  return priceMap[priceId || ''] || SubscriptionTier.FREE;
}

function mapStripeStatusToOurStatus(stripeStatus: string): SubscriptionStatus {
  const statusMap: Record<string, SubscriptionStatus> = {
    'active': SubscriptionStatus.ACTIVE,
    'past_due': SubscriptionStatus.PAST_DUE,
    'canceled': SubscriptionStatus.CANCELLED,
    'incomplete': SubscriptionStatus.INCOMPLETE,
    'incomplete_expired': SubscriptionStatus.CANCELLED,
    'trialing': SubscriptionStatus.TRIALING,
    'unpaid': SubscriptionStatus.PAST_DUE,
  };

  return statusMap[stripeStatus] || SubscriptionStatus.INCOMPLETE;
}