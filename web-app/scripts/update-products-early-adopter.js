#!/usr/bin/env node
/**
 * Update Products with Early Adopter Pricing
 * Updates local database with correct pricing structure (no FREE plan)
 */

const { PrismaClient } = require('../src/generated/prisma');
require('dotenv').config();

const prisma = new PrismaClient();

const correctProducts = [
  {
    name: 'Solo Agent',
    description: 'Perfect for individual real estate professionals - lifetime early adopter pricing!',
    stripePriceId: 'price_1S4gluAaYYsUE6cm9HpIe9UH', // Early adopter price from previous run
    price: 49.00, // Early adopter price (was $97)
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
      '🎉 Lifetime early adopter pricing ($49 instead of $97)'
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
    stripePriceId: 'price_1S4gluAaYYsUE6cmty4rxNjX', // Early adopter price
    price: 97.00, // Early adopter price (was $197)
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
      '🎉 Lifetime early adopter pricing ($97 instead of $197)'
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
    stripePriceId: 'price_1S4glvAaYYsUE6cmM79LuGCs', // Early adopter price
    price: 297.00, // Early adopter price (was $497)
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
      '🎉 Lifetime early adopter pricing ($297 instead of $497)'
    ],
    maxAlerts: null, // Unlimited
    maxUsers: 10,
    isActive: true,
    isPopular: false,
    displayOrder: 3
  }
];

async function updateDatabase() {
  console.log('🚀 Updating AgentRadar Products - Early Adopter Pricing');
  console.log('======================================================\n');

  try {
    // Clear existing products (including FREE plan)
    console.log('🧹 Removing existing products (including FREE plan)...');
    const deletedCount = await prisma.product.deleteMany({});
    console.log(`   ✅ Removed ${deletedCount.count} products\n`);

    // Create new products with early adopter pricing
    console.log('💰 Creating products with early adopter pricing...');
    
    for (const productData of correctProducts) {
      const product = await prisma.product.create({
        data: productData
      });

      console.log(`✅ ${product.name}`);
      console.log(`   💵 Early Adopter Price: $${product.price}/month`);
      console.log(`   🆔 Stripe Price ID: ${product.stripePriceId}`);
      console.log(`   📊 Tier: ${product.tier}`);
      console.log(`   🎯 Max Alerts: ${product.maxAlerts || 'Unlimited'}`);
      console.log(`   👥 Max Users: ${product.maxUsers || 'Unlimited'}\n`);
    }

    // Verify final state
    const finalProducts = await prisma.product.findMany({
      orderBy: { displayOrder: 'asc' }
    });

    console.log('🎉 SUCCESS! Updated product catalog:');
    console.log('=====================================');
    
    finalProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} - $${product.price}/${product.interval}`);
      console.log(`   Tier: ${product.tier}`);
      console.log(`   Popular: ${product.isPopular ? '⭐ YES' : 'No'}`);
      console.log(`   Features: ${product.features.length} features\n`);
    });

    console.log(`Total Products: ${finalProducts.length}`);
    console.log('✅ No FREE plan included');
    console.log('💎 All prices are early adopter lifetime pricing');
    console.log('\n🔥 Ready for production checkout!');

  } catch (error) {
    console.error('❌ Error updating database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
if (require.main === module) {
  updateDatabase()
    .then(() => {
      console.log('\n✨ Database update complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Update failed:', error);
      process.exit(1);
    });
}

module.exports = { updateDatabase };