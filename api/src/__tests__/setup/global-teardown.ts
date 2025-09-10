/**
 * Global Test Teardown for AgentRadar API
 *
 * Runs once after all tests to clean up the test environment
 */

import { PrismaClient } from "@prisma/client";

export default async function globalTeardown(): Promise<void> {
  console.log("🧹 Starting global test cleanup...");

  try {
    await cleanupDatabase();
    await cleanupRedis();
    await cleanupTempFiles();

    console.log("✅ Global test cleanup completed successfully");
  } catch (error) {
    console.error("❌ Error during global test cleanup:", error);
    // Don't throw the error as it might mask test results
  }
}

async function cleanupDatabase(): Promise<void> {
  try {
    console.log("🗄️  Cleaning up test database...");

    const prisma = new PrismaClient({
      datasources: {
        db: { url: process.env.DATABASE_URL! },
      },
    });

    await prisma.$connect();

    // Clean up all test data in reverse dependency order
    const tablesToClean = [
      "UserAlert",
      "SavedProperty",
      "ActivityLog",
      "SupportTicket",
      "AdminAction",
      "SystemSetting",
      "Alert",
      "AlertPreference",
      "User",
    ];

    console.log("  🔄 Truncating test tables...");
    for (const table of tablesToClean) {
      try {
        await prisma.$executeRawUnsafe(`DELETE FROM "${table}";`);
      } catch (error) {
        console.log(
          `  ⚠️  Warning: Could not clean table ${table}:`,
          (error as Error).message,
        );
      }
    }

    // Reset auto-increment sequences
    console.log("  🔄 Resetting sequences...");
    try {
      await prisma.$executeRawUnsafe(`
        SELECT setval(pg_get_serial_sequence('users', 'id'), 1, false);
        SELECT setval(pg_get_serial_sequence('alerts', 'id'), 1, false);
      `);
    } catch (error) {
      console.log(
        "  ⚠️  Warning: Could not reset sequences:",
        (error as Error).message,
      );
    }

    await prisma.$disconnect();
    console.log("  ✓ Test database cleaned");
  } catch (error) {
    console.error("  ❌ Database cleanup failed:", error);
  }
}

async function cleanupRedis(): Promise<void> {
  try {
    if (!process.env.REDIS_URL || process.env.REDIS_URL.includes("memory://")) {
      console.log("  ✓ Redis cleanup skipped (using memory fallback)");
      return;
    }

    console.log("🔄 Cleaning up Redis...");

    const redis = require("redis");
    const client = redis.createClient({
      url: process.env.REDIS_URL,
    });

    await client.connect();

    // Get all test keys (prefixed with 'test:' or in test database)
    const testKeys = await client.keys("test:*");
    if (testKeys.length > 0) {
      await client.del(testKeys);
      console.log(`  ✓ Removed ${testKeys.length} test keys from Redis`);
    }

    // Flush the test database (assuming db 1 is used for tests)
    await client.flushDb();

    await client.disconnect();
    console.log("  ✓ Redis cleanup completed");
  } catch (error) {
    console.log(
      "  ⚠️  Redis cleanup failed (non-critical):",
      (error as Error).message,
    );
  }
}

async function cleanupTempFiles(): Promise<void> {
  try {
    console.log("🗂️  Cleaning up temporary files...");

    const fs = require("fs").promises;
    const path = require("path");

    const tempDirs = [
      path.join(process.cwd(), "temp"),
      path.join(process.cwd(), "uploads/temp"),
      path.join(process.cwd(), "logs/test"),
      path.join("/tmp", "agentradar-test-*"),
    ];

    for (const tempDir of tempDirs) {
      try {
        // Skip glob patterns for now, handle specific directories
        if (tempDir.includes("*")) continue;

        await fs.access(tempDir);
        await fs.rmdir(tempDir, { recursive: true });
        console.log(`  ✓ Removed temporary directory: ${tempDir}`);
      } catch (error) {
        // Directory doesn't exist or cannot be removed, which is fine
      }
    }

    // Clean up any test log files
    try {
      const logDir = path.join(process.cwd(), "logs");
      await fs.access(logDir);

      const logFiles = await fs.readdir(logDir);
      const testLogFiles = logFiles.filter(
        (file: string) => file.includes("test") || file.includes("spec"),
      );

      for (const logFile of testLogFiles) {
        await fs.unlink(path.join(logDir, logFile));
        console.log(`  ✓ Removed test log file: ${logFile}`);
      }
    } catch (error) {
      // Log directory doesn't exist or cannot be accessed, which is fine
    }

    console.log("  ✓ Temporary files cleanup completed");
  } catch (error) {
    console.log(
      "  ⚠️  Temporary files cleanup failed (non-critical):",
      (error as Error).message,
    );
  }
}

// Additional cleanup for specific test scenarios
export async function cleanupTestScenario(scenarioName: string): Promise<void> {
  console.log(`🧹 Cleaning up test scenario: ${scenarioName}`);

  try {
    const prisma = new PrismaClient();
    await prisma.$connect();

    // Scenario-specific cleanup
    switch (scenarioName) {
      case "load-testing":
        // Clean up large datasets created during load testing
        await prisma.$executeRawUnsafe(`
          DELETE FROM "alerts" WHERE "title" LIKE '%load-test%';
          DELETE FROM "users" WHERE "email" LIKE '%load-test%';
        `);
        break;

      case "security-testing":
        // Clean up any security test artifacts
        await prisma.$executeRawUnsafe(`
          DELETE FROM "users" WHERE "email" LIKE '%security-test%';
          DELETE FROM "activity_logs" WHERE "action" LIKE '%security-test%';
        `);
        break;

      case "performance-testing":
        // Clean up performance test data
        await prisma.$executeRawUnsafe(`
          DELETE FROM "alerts" WHERE "description" LIKE '%perf-test%';
        `);
        break;

      default:
        console.log(
          `  ⚠️  No specific cleanup defined for scenario: ${scenarioName}`,
        );
    }

    await prisma.$disconnect();
    console.log(`  ✓ Scenario cleanup completed: ${scenarioName}`);
  } catch (error) {
    console.error(`  ❌ Scenario cleanup failed for ${scenarioName}:`, error);
  }
}

// Memory usage reporting
export function reportMemoryUsage(): void {
  const usage = process.memoryUsage();
  const formatBytes = (bytes: number) => {
    return `${Math.round((bytes / 1024 / 1024) * 100) / 100} MB`;
  };

  console.log("📊 Memory Usage Report:");
  console.log(`  RSS: ${formatBytes(usage.rss)} (Resident Set Size)`);
  console.log(`  Heap Used: ${formatBytes(usage.heapUsed)}`);
  console.log(`  Heap Total: ${formatBytes(usage.heapTotal)}`);
  console.log(`  External: ${formatBytes(usage.external)}`);
  console.log(`  Array Buffers: ${formatBytes(usage.arrayBuffers || 0)}`);

  // Warn if memory usage is high
  const heapUsedMB = usage.heapUsed / 1024 / 1024;
  if (heapUsedMB > 500) {
    console.log(
      "⚠️  High memory usage detected. Consider investigating memory leaks.",
    );
  }
}

// Export cleanup utilities for individual tests
export const testCleanup = {
  cleanupDatabase,
  cleanupRedis,
  cleanupTempFiles,
  cleanupTestScenario,
  reportMemoryUsage,
};
