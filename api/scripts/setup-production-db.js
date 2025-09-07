#!/usr/bin/env node
/**
 * Production Database Setup Script
 * Sets up Neon production database with admin user and initial data
 */

const { PrismaClient } = require('../src/generated/prisma');
const bcrypt = require('bcryptjs');

// Use production database URL directly
const PRODUCTION_DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_MkmTsgf5hRL6@ep-damp-band-ado7eaqx-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function setupProductionDatabase() {
  console.log('🚀 Setting up AgentRadar Production Database...');
  console.log('📍 Database:', PRODUCTION_DATABASE_URL.split('@')[1]?.split('/')[0] || 'Unknown');
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: PRODUCTION_DATABASE_URL
      }
    }
  });

  try {
    // Test connection
    console.log('🔌 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Check if admin user exists
    console.log('👤 Checking for admin user...');
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'mike.holownych@agentradar.app' }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email);
      console.log('   Role:', existingAdmin.role);
      console.log('   Subscription:', existingAdmin.subscriptionTier);
      console.log('   Email Verified:', existingAdmin.isEmailVerified);
      
      // Update password if needed
      const newPasswordHash = await bcrypt.hash('AdminAccess2024!', 10);
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          password: newPasswordHash,
          role: 'ADMIN',
          subscriptionTier: 'WHITE_LABEL',
          isActive: true
        }
      });
      console.log('🔐 Admin password updated');
      
    } else {
      console.log('👨‍💼 Creating admin user...');
      
      const hashedPassword = await bcrypt.hash('AdminAccess2024!', 10);
      
      const adminUser = await prisma.user.create({
        data: {
          email: 'mike.holownych@agentradar.app',
          password: hashedPassword,
          firstName: 'Mike',
          lastName: 'Holownych',
          role: 'ADMIN',
          subscriptionTier: 'WHITE_LABEL',
          isActive: true,
          alertPreferences: {
            create: {
              alertTypes: ['POWER_OF_SALE', 'ESTATE_SALE', 'DEVELOPMENT_APPLICATION'],
              cities: ['Toronto', 'Mississauga', 'Brampton', 'Vaughan', 'Markham', 'Oakville'],
              emailNotifications: true,
              smsNotifications: true,
              pushNotifications: true,
              maxAlertsPerDay: 100,
              minOpportunityScore: 70,
              minPriority: 'MEDIUM'
            }
          }
        },
        include: {
          alertPreferences: true
        }
      });
      
      console.log('✅ Admin user created successfully:');
      console.log('   Email: mike.holownych@agentradar.app');
      console.log('   Password: AdminAccess2024!');
      console.log('   Role:', adminUser.role);
      console.log('   Subscription:', adminUser.subscriptionTier);
    }

    // Create sample alerts for testing
    console.log('📋 Setting up sample alerts...');
    
    const alertsCount = await prisma.alert.count();
    
    if (alertsCount === 0) {
      const sampleAlerts = [
        {
          alertType: 'POWER_OF_SALE',
          priority: 'HIGH',
          title: 'Power of Sale - Prime Toronto Location',
          description: 'Foreclosure proceeding initiated for luxury condo in downtown Toronto. Property value estimated at $850,000.',
          address: '123 Bay Street, Toronto, ON',
          city: 'Toronto',
          postalCode: 'M5J 2R8',
          opportunityScore: 85,
          estimatedValue: 85000000, // In cents
          status: 'ACTIVE',
          source: 'ONTARIO_COURT_BULLETINS',
          propertyType: 'Condominium',
          bedrooms: 2,
          bathrooms: 2,
          courtFileNumber: 'CV-24-12345',
          courtDate: new Date('2024-09-15')
        },
        {
          alertType: 'ESTATE_SALE',
          priority: 'MEDIUM',
          title: 'Estate Sale - Mississauga Family Home',
          description: 'Probate estate sale for 4-bedroom family home in desirable Mississauga neighborhood.',
          address: '456 Maple Avenue, Mississauga, ON',
          city: 'Mississauga',
          postalCode: 'L5B 3M8',
          opportunityScore: 78,
          estimatedValue: 120000000, // In cents
          status: 'ACTIVE',
          source: 'ESTATE_FILINGS',
          propertyType: 'Detached House',
          bedrooms: 4,
          bathrooms: 3,
          lotSize: '50x120 ft',
          probateNumber: 'EST-24-5678',
          executorName: 'Jane Smith, Lawyer'
        },
        {
          alertType: 'DEVELOPMENT_APPLICATION',
          priority: 'URGENT',
          title: 'Rezoning Application - Brampton Development',
          description: 'Major rezoning application for 50-unit residential development. Potential impact on surrounding property values.',
          address: '789 Queen Street, Brampton, ON',
          city: 'Brampton',
          postalCode: 'L6W 2B5',
          opportunityScore: 92,
          estimatedValue: 1500000000, // In cents
          status: 'ACTIVE',
          source: 'MUNICIPAL_APPLICATIONS',
          applicationNumber: 'A24-987',
          timelineMonths: 12
        }
      ];

      for (const alertData of sampleAlerts) {
        await prisma.alert.create({ data: alertData });
      }
      
      console.log(`✅ Created ${sampleAlerts.length} sample alerts`);
    } else {
      console.log(`✅ Database already has ${alertsCount} alerts`);
    }

    // Create system settings
    console.log('⚙️ Setting up system settings...');
    
    const systemSettings = [
      { key: 'MAINTENANCE_MODE', value: 'false', description: 'Enable/disable maintenance mode' },
      { key: 'ALERT_PROCESSING_ENABLED', value: 'true', description: 'Enable/disable alert processing' },
      { key: 'EMAIL_NOTIFICATIONS_ENABLED', value: 'true', description: 'Enable/disable email notifications' },
      { key: 'MAX_ALERTS_PER_USER_DAILY', value: '100', description: 'Maximum alerts per user per day' },
      { key: 'API_RATE_LIMIT_REQUESTS_PER_MINUTE', value: '60', description: 'API rate limit per minute' }
    ];

    for (const setting of systemSettings) {
      await prisma.systemSetting.upsert({
        where: { key: setting.key },
        update: {},
        create: setting
      });
    }
    
    console.log('✅ System settings configured');

    // Summary
    const totalUsers = await prisma.user.count();
    const totalAlerts = await prisma.alert.count();
    const totalSettings = await prisma.systemSetting.count();
    
    console.log('\n🎉 Production Database Setup Complete!');
    console.log('=' * 50);
    console.log(`👥 Total Users: ${totalUsers}`);
    console.log(`📋 Total Alerts: ${totalAlerts}`);
    console.log(`⚙️ System Settings: ${totalSettings}`);
    console.log('\n🔐 Admin Login Credentials:');
    console.log('   Email: mike.holownych@agentradar.app');
    console.log('   Password: AdminAccess2024!');
    console.log('   URL: https://admin.agentradar.app');
    console.log('\n🚀 Production Environment Ready!');

  } catch (error) {
    console.error('❌ Production database setup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run setup if called directly
if (require.main === module) {
  setupProductionDatabase()
    .then(() => {
      console.log('✅ Setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Setup failed:', error.message);
      process.exit(1);
    });
}

module.exports = { setupProductionDatabase };