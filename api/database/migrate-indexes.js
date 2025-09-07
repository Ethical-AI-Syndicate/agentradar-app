#!/usr/bin/env node

/**
 * Database Index Migration Script
 * Applies critical performance indexes identified in Phase 1 assessment
 * Expected performance improvement: 3-5x query performance
 * 
 * Usage: node migrate-indexes.js [environment]
 * Environment: development | staging | production
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Environment validation
const environment = process.argv[2] || 'development';
const validEnvironments = ['development', 'staging', 'production'];

if (!validEnvironments.includes(environment)) {
  console.error(`❌ Invalid environment: ${environment}`);
  console.error(`✅ Valid environments: ${validEnvironments.join(', ')}`);
  process.exit(1);
}

// Load environment-specific configuration
require('dotenv').config({ 
  path: path.join(__dirname, `../.env.${environment}`) 
});

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

const prisma = new PrismaClient({
  log: ['info', 'warn', 'error'],
});

// Migration tracking
const MIGRATION_NAME = '001_add_critical_indexes';
const MIGRATION_VERSION = '1.0.0';

async function checkMigrationStatus() {
  try {
    // Check if migration tracking table exists
    await prisma.$queryRaw`
      CREATE TABLE IF NOT EXISTS _migration_history (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        version VARCHAR(50) NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        environment VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'COMPLETED'
      );
    `;

    // Check if this migration has already been applied
    const existingMigration = await prisma.$queryRaw`
      SELECT * FROM _migration_history 
      WHERE name = ${MIGRATION_NAME} AND environment = ${environment}
    `;

    return Array.isArray(existingMigration) && existingMigration.length > 0;
  } catch (error) {
    console.error('❌ Error checking migration status:', error);
    throw error;
  }
}

async function recordMigration(status = 'COMPLETED') {
  try {
    await prisma.$queryRaw`
      INSERT INTO _migration_history (name, version, environment, status)
      VALUES (${MIGRATION_NAME}, ${MIGRATION_VERSION}, ${environment}, ${status})
      ON CONFLICT (name) DO UPDATE SET
        version = ${MIGRATION_VERSION},
        applied_at = CURRENT_TIMESTAMP,
        status = ${status}
    `;
  } catch (error) {
    console.error('❌ Error recording migration:', error);
    throw error;
  }
}

async function createIndexes() {
  const indexes = [
    {
      name: 'idx_alerts_status_priority',
      sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alerts_status_priority ON alerts(status, priority)',
      description: 'Alert filtering performance - Expected 5x improvement'
    },
    {
      name: 'idx_alerts_city_type',
      sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alerts_city_type ON alerts(city, "alertType")',
      description: 'Geographic alert filtering - Expected 3x improvement'
    },
    {
      name: 'idx_alerts_opportunity_score',
      sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alerts_opportunity_score ON alerts("opportunityScore" DESC)',
      description: 'Alert scoring performance - Expected 4x improvement'
    },
    {
      name: 'idx_alerts_created_at',
      sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alerts_created_at ON alerts("createdAt" DESC)',
      description: 'Time-based queries optimization'
    },
    {
      name: 'idx_alerts_location',
      sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alerts_location ON alerts(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL',
      description: 'Geographic proximity searches'
    },
    {
      name: 'idx_user_alerts_user_created',
      sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_alerts_user_created ON user_alerts("userId", "createdAt" DESC)',
      description: 'User dashboard performance - Expected 8x improvement'
    },
    {
      name: 'idx_user_alerts_notified',
      sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_alerts_notified ON user_alerts("userId", "isNotified", "notifiedAt")',
      description: 'Notification system optimization'
    },
    {
      name: 'idx_user_alerts_bookmarked',
      sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_alerts_bookmarked ON user_alerts("userId", "isBookmarked") WHERE "isBookmarked" = true',
      description: 'Bookmarked alerts retrieval'
    },
    {
      name: 'idx_alert_preferences_user',
      sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alert_preferences_user ON alert_preferences("userId")',
      description: 'Alert matching algorithm performance'
    },
    {
      name: 'idx_alert_preferences_active',
      sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alert_preferences_active ON alert_preferences("userId") WHERE "alertTypes" IS NOT NULL',
      description: 'Active preferences filtering'
    },
    {
      name: 'idx_activity_logs_user_created',
      sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_logs_user_created ON activity_logs("userId", "createdAt" DESC)',
      description: 'Admin dashboard user activity tracking'
    },
    {
      name: 'idx_support_tickets_status',
      sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_support_tickets_status ON support_tickets(status, priority)',
      description: 'Support ticket management'
    },
    {
      name: 'idx_support_tickets_assigned',
      sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_support_tickets_assigned ON support_tickets("assignedToId") WHERE "assignedToId" IS NOT NULL',
      description: 'Admin assignment workflows'
    },
    {
      name: 'idx_court_cases_processed',
      sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_court_cases_processed ON court_cases("isProcessed", "nerProcessed")',
      description: 'Court data processing pipeline'
    },
    {
      name: 'idx_users_active_role',
      sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active_role ON users("isActive", role) WHERE "isActive" = true',
      description: 'Active user queries optimization'
    },
    {
      name: 'idx_users_subscription_tier',
      sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_subscription_tier ON users("subscriptionTier", "isActive")',
      description: 'Subscription tier queries'
    },
    {
      name: 'idx_users_stripe_customer',
      sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_stripe_customer ON users("stripeCustomerId") WHERE "stripeCustomerId" IS NOT NULL',
      description: 'Stripe customer lookups'
    }
  ];

  console.log(`\n📊 Creating ${indexes.length} performance indexes for ${environment} environment...\n`);

  const results = {
    successful: [],
    failed: [],
    skipped: []
  };

  for (let i = 0; i < indexes.length; i++) {
    const index = indexes[i];
    const progress = `[${i + 1}/${indexes.length}]`;
    
    try {
      console.log(`${progress} Creating ${index.name}...`);
      
      // Check if index already exists
      const existingIndex = await prisma.$queryRaw`
        SELECT indexname FROM pg_indexes 
        WHERE indexname = ${index.name}
      `;
      
      if (Array.isArray(existingIndex) && existingIndex.length > 0) {
        console.log(`   ⏭️  Index ${index.name} already exists - skipping`);
        results.skipped.push(index);
        continue;
      }

      // Create the index
      const startTime = Date.now();
      await prisma.$executeRawUnsafe(index.sql);
      const duration = Date.now() - startTime;

      console.log(`   ✅ ${index.name} created in ${duration}ms`);
      console.log(`   📝 ${index.description}`);
      results.successful.push({ ...index, duration });

      // Add a small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`   ❌ Failed to create ${index.name}:`, error.message);
      results.failed.push({ ...index, error: error.message });

      // In production, we might want to continue with other indexes
      if (environment === 'production') {
        console.log('   ⚠️  Continuing with remaining indexes...');
        continue;
      } else {
        throw error;
      }
    }
  }

  return results;
}

async function validateIndexes() {
  console.log('\n🔍 Validating created indexes...\n');

  try {
    const indexStats = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_scan as index_scans,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched
      FROM pg_stat_user_indexes 
      WHERE indexname LIKE 'idx_%'
      ORDER BY indexname;
    `;

    if (Array.isArray(indexStats) && indexStats.length > 0) {
      console.log('📈 Index Statistics:');
      indexStats.forEach(stat => {
        console.log(`   📊 ${stat.indexname}: ${stat.index_scans || 0} scans, ${stat.tuples_read || 0} reads`);
      });
    } else {
      console.log('📊 Index statistics will be available after queries are executed');
    }

    // Check total indexes created
    const totalIndexes = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM pg_indexes 
      WHERE indexname LIKE 'idx_%'
    `;

    console.log(`\n✅ Total performance indexes: ${totalIndexes[0]?.count || 0}`);

  } catch (error) {
    console.error('❌ Error validating indexes:', error);
  }
}

async function generateReport(results) {
  const report = {
    migration: MIGRATION_NAME,
    version: MIGRATION_VERSION,
    environment: environment,
    timestamp: new Date().toISOString(),
    summary: {
      total: results.successful.length + results.failed.length + results.skipped.length,
      successful: results.successful.length,
      failed: results.failed.length,
      skipped: results.skipped.length,
      totalDuration: results.successful.reduce((sum, idx) => sum + idx.duration, 0)
    },
    results: results
  };

  // Save report to file
  const reportPath = path.join(__dirname, `migration-report-${environment}-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('\n📋 Migration Summary:');
  console.log(`   ✅ Successful: ${report.summary.successful}`);
  console.log(`   ❌ Failed: ${report.summary.failed}`);
  console.log(`   ⏭️  Skipped: ${report.summary.skipped}`);
  console.log(`   ⏱️  Total Duration: ${report.summary.totalDuration}ms`);
  console.log(`   📄 Report saved: ${reportPath}`);

  return report;
}

async function main() {
  console.log('🚀 AgentRadar Database Index Migration');
  console.log(`📦 Environment: ${environment}`);
  console.log(`🔗 Database: ${process.env.DATABASE_URL?.split('@')[1] || 'configured'}`);
  console.log(`📅 Started: ${new Date().toISOString()}`);

  try {
    // Connect to database
    console.log('\n🔌 Connecting to database...');
    await prisma.$connect();
    console.log('✅ Database connection established');

    // Check if migration already applied
    console.log('\n🔍 Checking migration status...');
    const alreadyApplied = await checkMigrationStatus();
    
    if (alreadyApplied) {
      console.log('⚠️  Migration already applied. Use --force to reapply.');
      if (!process.argv.includes('--force')) {
        console.log('✋ Migration skipped. Run with --force to reapply.');
        process.exit(0);
      }
    }

    // Apply indexes
    const results = await createIndexes();

    // Record migration
    await recordMigration(
      results.failed.length > 0 ? 'PARTIAL' : 'COMPLETED'
    );

    // Validate indexes
    await validateIndexes();

    // Generate report
    await generateReport(results);

    if (results.failed.length > 0) {
      console.log('\n⚠️  Migration completed with errors');
      process.exit(1);
    } else {
      console.log('\n🎉 Migration completed successfully!');
      console.log('💡 Expected performance improvements:');
      console.log('   • Alert queries: 3-5x faster');
      console.log('   • User dashboard: 8x faster');
      console.log('   • Admin operations: 4x faster');
      console.log('   • Alert matching: 5x faster');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    
    // Record failure
    try {
      await recordMigration('FAILED');
    } catch (recordError) {
      console.error('❌ Failed to record migration failure:', recordError);
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle script interruption
process.on('SIGINT', async () => {
  console.log('\n🛑 Migration interrupted by user');
  await prisma.$disconnect();
  process.exit(1);
});

// Run migration
if (require.main === module) {
  main();
}

module.exports = { main, createIndexes, validateIndexes };