#!/usr/bin/env node
/**
 * Create Live Stripe Products
 * This script creates products in LIVE MODE using live keys
 */

const Stripe = require('stripe');
const { PrismaClient } = require('../src/generated/prisma');
require('dotenv').config();

// Force live mode
const LIVE_STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
if (!LIVE_STRIPE_KEY || !LIVE_STRIPE_KEY.includes('live')) {
  console.error('❌ ERROR: STRIPE_SECRET_KEY must be a live key (sk_live_...)');
  process.exit(1);
}

const stripe = new Stripe(LIVE_STRIPE_KEY);
const prisma = new PrismaClient();

const products = [
  {
    name: 'Solo Agent',
    description: 'Perfect for individual real estate professionals - lifetime early adopter pricing!',
    regularPrice: 97.00,
    earlyAdopterPrice: 49.00,
    currency: 'usd',
    interval: 'month',
    tier: 'SOLO_AGENT',
    features: [
      '100 property alerts per month',
      'Email & SMS notifications', 
      'Power of Sale, Estate Sales, Development alerts',
      'Priority support',
      'Advanced filtering',
      'Mobile app access',
      'Lifetime early adopter pricing'
    ],
    maxAlerts: 100,
    maxUsers: 1,
    isActive: true,
    isPopular: true,
    displayOrder: 1
  },
  {
    name: 'Professional',
    description: 'For established agents who need more capacity - lifetime early adopter pricing!',
    regularPrice: 197.00,
    earlyAdopterPrice: 97.00,
    currency: 'usd',
    interval: 'month',
    tier: 'PROFESSIONAL',
    features: [
      '500 property alerts per month',
      'All notification types (Email, SMS, Push)',
      'All alert types',
      'Priority support',
      'Advanced analytics dashboard',
      'API access for integrations',
      'Custom alert criteria',
      'Export capabilities',
      'Lifetime early adopter pricing'
    ],
    maxAlerts: 500,
    maxUsers: 1,
    isActive: true,
    isPopular: false,
    displayOrder: 2
  },
  {
    name: 'Team Enterprise',
    description: 'For teams and brokerages - lifetime early adopter pricing!',
    regularPrice: 497.00,
    earlyAdopterPrice: 297.00,
    currency: 'usd',
    interval: 'month',
    tier: 'TEAM_ENTERPRISE',
    features: [
      'Unlimited property alerts',
      'All notification types',
      'All alert types (Power of Sale, Estate, Development)',
      'Priority support',
      'Team management dashboard',
      'Advanced analytics & reporting',
      'Full API access',
      'Custom integrations',
      'Dedicated account manager',
      'White-label options',
      'Lifetime early adopter pricing'
    ],
    maxAlerts: null,
    maxUsers: 10,
    isActive: true,
    isPopular: false,
    displayOrder: 3
  }
];

async function main() {
  console.log('🔥 Creating LIVE AgentRadar Products in Stripe');
  console.log('===============================================\n');

  try {
    // Verify we're in live mode
    const account = await stripe.accounts.retrieve();
    console.log(`🏪 Stripe Account: ${account.display_name || account.id}`);
    console.log(`💳 Mode: ${account.livemode ? '🟢 LIVE MODE' : '🔴 TEST MODE'}`);
    
    if (!account.livemode) {
      console.error('\n❌ ERROR: Account is in test mode but we need live mode!');
      console.error('Make sure you are using live keys (sk_live_...)');
      process.exit(1);
    }

    console.log('\n✅ Confirmed: Creating products in LIVE MODE\n');

    const createdProducts = [];

    for (const productData of products) {
      console.log(`📦 Creating: ${productData.name}`);
      
      // Create Stripe product
      const stripeProduct = await stripe.products.create({
        name: productData.name,
        description: productData.description,
        metadata: {
          tier: productData.tier,
          maxAlerts: productData.maxAlerts?.toString() || 'unlimited',
          maxUsers: productData.maxUsers?.toString() || 'unlimited',
        },
      });

      console.log(`   ✅ Product ID: ${stripeProduct.id}`);

      // Create early adopter price (this will be the main price we use)
      const earlyAdopterPrice = await stripe.prices.create({
        product: stripeProduct.id,
        unit_amount: Math.round(productData.earlyAdopterPrice * 100),
        currency: productData.currency,
        recurring: { interval: productData.interval },
        nickname: `${productData.name} - Early Adopter`,
        metadata: {
          type: 'early_adopter',
          tier: productData.tier,
          originalPrice: productData.regularPrice.toString(),
        },
      });

      console.log(`   💰 Early Adopter Price: ${earlyAdopterPrice.id} ($${productData.earlyAdopterPrice}/month)`);

      // Create regular price (for future reference)
      const regularPrice = await stripe.prices.create({
        product: stripeProduct.id,
        unit_amount: Math.round(productData.regularPrice * 100),
        currency: productData.currency,
        recurring: { interval: productData.interval },
        nickname: `${productData.name} - Regular`,
        metadata: {
          type: 'regular',
          tier: productData.tier,
        },
      });

      console.log(`   💸 Regular Price: ${regularPrice.id} ($${productData.regularPrice}/month)\n`);

      createdProducts.push({
        ...productData,
        stripeProductId: stripeProduct.id,
        stripePriceId: earlyAdopterPrice.id, // Use early adopter as main price
        regularPriceId: regularPrice.id,
        price: productData.earlyAdopterPrice, // Store early adopter price
      });
    }

    // Create webhook
    console.log('🔗 Creating webhook endpoint...');
    
    const webhookUrl = 'https://web-8nqhr6vk6-ethical-ai-consulting-syndicate.vercel.app/api/webhooks/stripe';
    
    // Check for existing webhooks
    const existingWebhooks = await stripe.webhookEndpoints.list({ limit: 100 });
    const existingWebhook = existingWebhooks.data.find(w => w.url === webhookUrl);
    
    let webhook;
    if (existingWebhook) {
      console.log(`✅ Using existing webhook: ${existingWebhook.id}`);
      webhook = existingWebhook;
    } else {
      webhook = await stripe.webhookEndpoints.create({
        url: webhookUrl,
        enabled_events: [
          'customer.subscription.created',
          'customer.subscription.updated', 
          'customer.subscription.deleted',
          'invoice.payment_succeeded',
          'invoice.payment_failed',
          'checkout.session.completed',
        ],
      });
      console.log(`✅ Created webhook: ${webhook.id}`);
    }

    // Update database
    console.log('\n💾 Updating database...');
    
    await prisma.product.deleteMany({});
    console.log('🧹 Cleared existing products');

    for (const productData of createdProducts) {
      const product = await prisma.product.create({
        data: {
          name: productData.name,
          description: productData.description,
          stripePriceId: productData.stripePriceId,
          price: productData.price,
          currency: productData.currency,
          interval: productData.interval,
          tier: productData.tier,
          features: productData.features,
          maxAlerts: productData.maxAlerts,
          maxUsers: productData.maxUsers,
          isActive: productData.isActive,
          isPopular: productData.isPopular,
          displayOrder: productData.displayOrder,
        },
      });
      
      console.log(`✅ Database: ${product.name} ($${product.price}/${product.interval})`);
    }

    console.log('\n🎉 SUCCESS! Live products created');
    console.log('\n📋 Summary:');
    createdProducts.forEach(p => {
      console.log(`   ${p.name}: $${p.price}/month (was $${p.regularPrice})`);
      console.log(`     Price ID: ${p.stripePriceId}`);
    });
    
    console.log(`\n🔐 Webhook Secret: ${webhook.secret}`);
    console.log('\n⚠️  Update your production .env with:');
    console.log(`STRIPE_WEBHOOK_SECRET=${webhook.secret}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();