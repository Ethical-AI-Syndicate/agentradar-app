#!/usr/bin/env node
/**
 * Stripe Product Creation Script
 * Creates products and prices directly in Stripe and updates local database
 */

const Stripe = require('stripe');
const { PrismaClient } = require('../src/generated/prisma');
require('dotenv').config({ path: '../.env' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const prisma = new PrismaClient();

const products = [
  {
    name: 'Solo Agent',
    description: 'Perfect for individual real estate professionals',
    price: 97.00,
    earlyAdopterPrice: 49.00,
    currency: 'usd',
    interval: 'month',
    tier: 'SOLO_AGENT',
    features: [
      '100 property alerts per month',
      'Email & SMS notifications',
      'All alert types (Power of Sale, Estate Sales, Development)',
      'Priority support',
      'Advanced filtering',
      'Mobile app access'
    ],
    maxAlerts: 100,
    maxUsers: 1,
    isActive: true,
    isPopular: true,
    displayOrder: 1
  },
  {
    name: 'Professional',
    description: 'For established agents who need more capacity',
    price: 197.00,
    earlyAdopterPrice: 97.00,
    currency: 'usd',
    interval: 'month',
    tier: 'PROFESSIONAL',
    features: [
      '500 property alerts per month',
      'All notification types',
      'All alert types',
      'Priority support',
      'Advanced analytics',
      'API access',
      'Custom alert criteria',
      'Export capabilities'
    ],
    maxAlerts: 500,
    maxUsers: 1,
    isActive: true,
    isPopular: false,
    displayOrder: 2
  },
  {
    name: 'Team Enterprise',
    description: 'For teams and brokerages',
    price: 497.00,
    earlyAdopterPrice: 297.00,
    currency: 'usd',
    interval: 'month',
    tier: 'TEAM_ENTERPRISE',
    features: [
      'Unlimited property alerts',
      'All notification types',
      'All alert types',
      'Priority support',
      'Team management dashboard',
      'Advanced analytics & reporting',
      'API access',
      'Custom integrations',
      'Dedicated account manager'
    ],
    maxAlerts: null, // Unlimited
    maxUsers: 10,
    isActive: true,
    isPopular: false,
    displayOrder: 3
  }
];

async function createStripeProducts() {
  console.log('🚀 Creating products and prices in Stripe...');

  const createdProducts = [];

  try {
    for (const productData of products) {
      console.log(`\n📦 Creating Stripe product: ${productData.name}`);

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

      console.log(`✅ Created product: ${stripeProduct.id}`);

      // Create regular price
      const regularPrice = await stripe.prices.create({
        product: stripeProduct.id,
        unit_amount: Math.round(productData.price * 100), // Convert to cents
        currency: productData.currency,
        recurring: {
          interval: productData.interval,
        },
        metadata: {
          type: 'regular',
          tier: productData.tier,
        },
      });

      console.log(`✅ Created regular price: ${regularPrice.id} ($${productData.price}/${productData.interval})`);

      // Create early adopter price
      const earlyAdopterPrice = await stripe.prices.create({
        product: stripeProduct.id,
        unit_amount: Math.round(productData.earlyAdopterPrice * 100), // Convert to cents
        currency: productData.currency,
        recurring: {
          interval: productData.interval,
        },
        metadata: {
          type: 'early_adopter',
          tier: productData.tier,
        },
      });

      console.log(`✅ Created early adopter price: ${earlyAdopterPrice.id} ($${productData.earlyAdopterPrice}/${productData.interval})`);

      createdProducts.push({
        ...productData,
        stripeProductId: stripeProduct.id,
        stripePriceId: regularPrice.id,
        earlyAdopterPriceId: earlyAdopterPrice.id,
      });
    }

    return createdProducts;

  } catch (error) {
    console.error('❌ Error creating Stripe products:', error);
    throw error;
  }
}

async function createWebhookEndpoint() {
  console.log('\n🔗 Creating Stripe webhook endpoint...');

  try {
    // First, list existing webhooks to avoid duplicates
    const existingWebhooks = await stripe.webhookEndpoints.list({
      limit: 100,
    });

    const webhookUrl = 'https://web-8nqhr6vk6-ethical-ai-consulting-syndicate.vercel.app/api/webhooks/stripe';
    const existingWebhook = existingWebhooks.data.find(
      webhook => webhook.url === webhookUrl
    );

    if (existingWebhook) {
      console.log(`✅ Webhook endpoint already exists: ${existingWebhook.id}`);
      console.log(`📍 URL: ${existingWebhook.url}`);
      return existingWebhook;
    }

    // Create new webhook endpoint
    const webhook = await stripe.webhookEndpoints.create({
      url: webhookUrl,
      enabled_events: [
        'customer.subscription.created',
        'customer.subscription.updated',
        'customer.subscription.deleted',
        'invoice.payment_succeeded',
        'invoice.payment_failed',
        'payment_intent.succeeded',
        'payment_intent.payment_failed',
      ],
    });

    console.log(`✅ Created webhook endpoint: ${webhook.id}`);
    console.log(`📍 URL: ${webhook.url}`);
    console.log(`🔐 Secret: ${webhook.secret}`);
    console.log('\n⚠️  IMPORTANT: Update your .env file with:');
    console.log(`STRIPE_WEBHOOK_SECRET=${webhook.secret}`);

    return webhook;

  } catch (error) {
    console.error('❌ Error creating webhook endpoint:', error);
    throw error;
  }
}

async function updateDatabase(products) {
  console.log('\n💾 Updating local database with Stripe products...');

  try {
    // Clear existing products
    await prisma.product.deleteMany({});
    console.log('🧹 Cleared existing products');

    // Create new products in database
    for (const productData of products) {
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

      console.log(`✅ Created database record: ${product.name} (ID: ${product.id})`);
    }

    console.log(`\n🎉 Successfully updated database with ${products.length} products`);

  } catch (error) {
    console.error('❌ Error updating database:', error);
    throw error;
  }
}

async function main() {
  console.log('🌟 AgentRadar Stripe Product Setup');
  console.log('=====================================\n');

  try {
    // Verify Stripe connection
    const account = await stripe.accounts.retrieve();
    console.log(`🏪 Connected to Stripe account: ${account.display_name || account.id}`);
    console.log(`💳 Live mode: ${!account.livemode ? '❌ TEST MODE' : '✅ LIVE MODE'}`);

    if (!account.livemode) {
      console.log('\n⚠️  WARNING: Running in test mode. Products will be created in test environment.');
    }

    // Create products in Stripe
    const createdProducts = await createStripeProducts();

    // Create webhook endpoint
    const webhook = await createWebhookEndpoint();

    // Update local database
    await updateDatabase(createdProducts);

    console.log('\n✅ Setup Complete!');
    console.log('\n📋 Summary:');
    console.log(`  - Products created in Stripe: ${createdProducts.length}`);
    console.log(`  - Webhook endpoint: ${webhook.id}`);
    console.log(`  - Database records: ${createdProducts.length}`);

    console.log('\n🔧 Next Steps:');
    console.log('1. Update .env with the webhook secret shown above');
    console.log('2. Test the webhook endpoint with Stripe CLI or dashboard');
    console.log('3. Test checkout flow with the new products');

  } catch (error) {
    console.error('\n💥 Setup failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n✨ All done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { createStripeProducts, createWebhookEndpoint, updateDatabase };