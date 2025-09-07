#!/usr/bin/env node
/**
 * Product Catalog Seeding Script
 * Sets up Stripe-integrated subscription products for AgentRadar
 */

const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

const products = [
  {
    name: 'Free Plan',
    description: 'Get started with basic property alerts',
    stripePriceId: 'free_plan', // This won\'t be used for Stripe checkout
    price: 0.00,
    currency: 'usd',
    interval: 'month',
    tier: 'FREE',
    features: [
      '5 property alerts per month',
      'Basic email notifications',
      'Power of sale alerts',
      'Community support'
    ],
    maxAlerts: 5,
    maxUsers: 1,
    isActive: true,
    isPopular: false,
    displayOrder: 1
  },
  {
    name: 'Solo Agent',
    description: 'Perfect for individual real estate professionals',
    stripePriceId: 'price_solo_agent_monthly', // Replace with actual Stripe price ID
    price: 49.00,
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
    displayOrder: 2
  },
  {
    name: 'Professional',
    description: 'For established agents who need more capacity',
    stripePriceId: 'price_professional_monthly', // Replace with actual Stripe price ID
    price: 149.00,
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
    displayOrder: 3
  },
  {
    name: 'Team Enterprise',
    description: 'For teams and brokerages',
    stripePriceId: 'price_team_enterprise_monthly', // Replace with actual Stripe price ID
    price: 399.00,
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
    displayOrder: 4
  },
  {
    name: 'White Label',
    description: 'Complete white-label solution for brokerages',
    stripePriceId: 'price_white_label_monthly', // Replace with actual Stripe price ID
    price: 999.00,
    currency: 'usd',
    interval: 'month',
    tier: 'WHITE_LABEL',
    features: [
      'Everything in Team Enterprise',
      'White-label branding',
      'Custom domain',
      'Advanced customization',
      'Priority development queue',
      'Dedicated infrastructure',
      'Custom training & onboarding',
      '24/7 premium support'
    ],
    maxAlerts: null, // Unlimited
    maxUsers: null, // Unlimited
    isActive: true,
    isPopular: false,
    displayOrder: 5
  }
];

async function seedProducts() {
  console.log('🌱 Seeding AgentRadar product catalog...');

  try {
    // Clear existing products
    await prisma.product.deleteMany({});
    console.log('🧹 Cleared existing products');

    // Create new products
    for (const productData of products) {
      const product = await prisma.product.create({
        data: productData
      });
      console.log(`✅ Created product: ${product.name} ($${product.price}/${product.interval})`);
    }

    console.log(`\n🎉 Successfully seeded ${products.length} products`);
    console.log('\n📋 Product Summary:');
    
    const createdProducts = await prisma.product.findMany({
      orderBy: { displayOrder: 'asc' }
    });

    createdProducts.forEach(product => {
      console.log(`  - ${product.name}: $${product.price}/${product.interval} (${product.tier})`);
    });

    console.log('\n⚠️  Remember to update Stripe price IDs with actual values from your Stripe dashboard');
    
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding script
if (require.main === module) {
  seedProducts()
    .then(() => {
      console.log('\n✅ Product catalog seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Product catalog seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedProducts };