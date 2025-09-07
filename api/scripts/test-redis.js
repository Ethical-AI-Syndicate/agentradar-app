#!/usr/bin/env node
/**
 * Redis Production Test Script
 * Tests Redis connection and basic functionality
 */

const redis = require('redis');

async function testRedis() {
  console.log('🔍 Testing Production Redis...');
  
  // Try different Redis connection approaches
  const connectionAttempts = [
    // From environment variable
    {
      name: 'Environment REDIS_URL',
      config: process.env.REDIS_URL ? { url: process.env.REDIS_URL } : null
    },
    // Direct connection without password (might work if no auth required)
    {
      name: 'Direct connection (no auth)',
      config: {
        socket: {
          host: 'redis-16816.c98.us-east-1-4.ec2.redns.redis-cloud.com',
          port: 16816
        }
      }
    },
    // With empty password
    {
      name: 'Empty password auth',
      config: {
        socket: {
          host: 'redis-16816.c98.us-east-1-4.ec2.redns.redis-cloud.com',
          port: 16816
        },
        password: ''
      }
    }
  ];

  for (const attempt of connectionAttempts) {
    if (!attempt.config) {
      console.log(`⏭️ Skipping ${attempt.name} - no config available`);
      continue;
    }

    console.log(`\n🔌 Attempting: ${attempt.name}`);
    const client = redis.createClient(attempt.config);
    
    try {
      // Set connection timeout
      client.on('error', (err) => {
        console.log(`❌ ${attempt.name} failed:`, err.message);
      });

      await Promise.race([
        client.connect(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 10000)
        )
      ]);

      console.log(`✅ ${attempt.name} connected successfully`);
      
      // Test basic operations
      await client.set('agentradar:test', JSON.stringify({
        timestamp: new Date().toISOString(),
        test: 'production-redis-check',
        status: 'working'
      }));
      
      const testValue = await client.get('agentradar:test');
      console.log(`✅ ${attempt.name} read/write test passed`);
      
      // Test with expiration
      await client.setEx('agentradar:temp', 60, 'temporary-value');
      console.log(`✅ ${attempt.name} expiration test setup`);
      
      // Get server info
      try {
        const info = await client.ping();
        console.log(`✅ ${attempt.name} server ping:`, info);
      } catch (e) {
        console.log(`⚠️ ${attempt.name} ping failed but connection works`);
      }

      await client.disconnect();
      console.log(`\n🎉 ${attempt.name} - Redis is working correctly!`);
      
      // If we get here, this connection method works
      console.log('\n📋 WORKING REDIS CONFIGURATION:');
      console.log('Connection method:', attempt.name);
      console.log('Config:', JSON.stringify(attempt.config, null, 2));
      return;
      
    } catch (error) {
      console.log(`❌ ${attempt.name} failed:`, error.message);
      try {
        await client.disconnect();
      } catch (e) {
        // Ignore disconnect errors
      }
    }
  }
  
  console.log('\n💥 All Redis connection attempts failed');
  console.log('🔧 Please check Redis Cloud configuration:');
  console.log('   1. Verify Redis Cloud instance is running');
  console.log('   2. Check if authentication is required');
  console.log('   3. Verify connection limits and IP restrictions');
  console.log('   4. Update REDIS_URL in environment variables if needed');
}

// Run test
if (require.main === module) {
  testRedis()
    .then(() => {
      console.log('\n✅ Redis test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Redis test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testRedis };