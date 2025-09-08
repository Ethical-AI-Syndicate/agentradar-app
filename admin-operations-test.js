const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://mike:password@localhost:5432/agentradar"
    }
  }
});

async function testAdminOperationsCenter() {
  try {
    console.log('🧪 Testing Admin Operations Center...\n');

    // Test 1: Create a blog post
    console.log('1. Creating a blog post...');
    const blogPost = await prisma.blogPost.create({
      data: {
        title: 'Welcome to AgentRadar Admin Operations Center',
        slug: 'welcome-admin-operations',
        content: 'This is a comprehensive admin system for managing all business operations.',
        excerpt: 'Admin operations center test post',
        category: 'system',
        tags: ['admin', 'operations', 'test'],
        authorId: 'test-admin-id',
        published: true,
        publishedAt: new Date()
      }
    });
    console.log('✅ Blog post created:', blogPost.id);

    // Test 2: Create a team
    console.log('\n2. Creating a team...');
    const team = await prisma.team.create({
      data: {
        name: 'Admin Team',
        description: 'System administrators',
        permissions: ['admin_access', 'user_management', 'content_management']
      }
    });
    console.log('✅ Team created:', team.id);

    // Test 3: Create an email template
    console.log('\n3. Creating an email template...');
    const emailTemplate = await prisma.emailTemplate.create({
      data: {
        name: 'Welcome Email',
        subject: 'Welcome to AgentRadar!',
        content: '<h1>Welcome!</h1><p>Thank you for joining AgentRadar.</p>',
        category: 'welcome',
        variables: ['user_name', 'login_url'],
        active: true
      }
    });
    console.log('✅ Email template created:', emailTemplate.id);

    // Test 4: Create a system alert
    console.log('\n4. Creating a system alert...');
    const systemAlert = await prisma.systemAlert.create({
      data: {
        type: 'SYSTEM_TEST',
        severity: 2,
        title: 'Admin Operations Center Test',
        message: 'Testing the admin operations center functionality.',
        metadata: { test: true, timestamp: new Date().toISOString() }
      }
    });
    console.log('✅ System alert created:', systemAlert.id);

    // Test 5: Create analytics cache entry
    console.log('\n5. Creating analytics cache entry...');
    const analyticsCache = await prisma.analyticsCache.create({
      data: {
        key: 'test_metric_daily_' + Date.now(),
        data: {
          metric: 'daily_users',
          value: 150,
          date: new Date().toISOString()
        },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
      }
    });
    console.log('✅ Analytics cache entry created:', analyticsCache.id);

    // Test 6: Query operations
    console.log('\n6. Testing queries...');
    const [
      blogPostCount,
      teamCount,
      templateCount,
      alertCount,
      cacheCount
    ] = await Promise.all([
      prisma.blogPost.count(),
      prisma.team.count(),
      prisma.emailTemplate.count(),
      prisma.systemAlert.count(),
      prisma.analyticsCache.count()
    ]);

    console.log('📊 Current counts:');
    console.log(`   Blog posts: ${blogPostCount}`);
    console.log(`   Teams: ${teamCount}`);
    console.log(`   Email templates: ${templateCount}`);
    console.log(`   System alerts: ${alertCount}`);
    console.log(`   Analytics cache entries: ${cacheCount}`);

    console.log('\n🎉 Admin Operations Center test completed successfully!');
    console.log('✅ All core models are working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testAdminOperationsCenter();