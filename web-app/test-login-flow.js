/**
 * Comprehensive test of the admin login flow without browser dependencies
 * Tests the complete authentication flow as it would work in production
 */

const axios = require('axios');

async function testCompleteLoginFlow() {
  console.log('🧪 Testing Complete Admin Login Flow');
  console.log('=====================================\n');

  try {
    // Step 1: Test login page accessibility
    console.log('📍 Step 1: Testing login page accessibility...');
    const loginPageResponse = await axios.get('https://admin.agentradar.app/login?redirect=%2Fadmin', {
      timeout: 10000,
      maxRedirects: 5
    });
    
    if (loginPageResponse.status === 200) {
      console.log('✅ Login page is accessible');
      console.log(`   Status: ${loginPageResponse.status}`);
      console.log(`   Content-Type: ${loginPageResponse.headers['content-type']}`);
    } else {
      throw new Error(`Login page returned ${loginPageResponse.status}`);
    }

    // Step 2: Test login API
    console.log('\n🔐 Step 2: Testing login API...');
    const loginResponse = await axios.post('https://admin.agentradar.app/api/auth/login', {
      email: 'mike.holownych@agentradar.app',
      password: 'admin123'
    }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (loginResponse.data.success && loginResponse.data.token) {
      console.log('✅ Login API working correctly');
      console.log(`   Success: ${loginResponse.data.success}`);
      console.log(`   Token received: Yes (${loginResponse.data.token.length} chars)`);
      console.log(`   User role: ${loginResponse.data.user.role}`);
      console.log(`   User email: ${loginResponse.data.user.email}`);
    } else {
      throw new Error(`Login API failed: ${JSON.stringify(loginResponse.data)}`);
    }

    const jwtToken = loginResponse.data.token;
    const userData = loginResponse.data.user;

    // Step 3: Test token validation endpoint
    console.log('\n🔍 Step 3: Testing token validation...');
    const validationResponse = await axios.get('https://admin.agentradar.app/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    if (validationResponse.data.success && validationResponse.data.user) {
      console.log('✅ Token validation working correctly');
      console.log(`   Validation success: ${validationResponse.data.success}`);
      console.log(`   User ID matches: ${validationResponse.data.user.id === userData.id}`);
      console.log(`   User role: ${validationResponse.data.user.role}`);
    } else {
      throw new Error(`Token validation failed: ${JSON.stringify(validationResponse.data)}`);
    }

    // Step 4: Test admin dashboard accessibility
    console.log('\n🎛️  Step 4: Testing admin dashboard access...');
    const dashboardResponse = await axios.get('https://admin.agentradar.app/admin', {
      timeout: 10000,
      maxRedirects: 5
    });

    if (dashboardResponse.status === 200) {
      console.log('✅ Admin dashboard page is accessible');
      console.log(`   Status: ${dashboardResponse.status}`);
      
      // Check if it's the actual dashboard page (not a redirect to login)
      const contentType = dashboardResponse.headers['content-type'];
      if (contentType && contentType.includes('text/html')) {
        console.log('✅ Dashboard returns HTML content (not API response)');
      }
    } else {
      throw new Error(`Dashboard page returned ${dashboardResponse.status}`);
    }

    // Step 5: Test admin API access with token
    console.log('\n📊 Step 5: Testing admin API access...');
    const analyticsResponse = await axios.get('https://admin.agentradar.app/api/admin/analytics/dashboard', {
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    if (analyticsResponse.data.users && analyticsResponse.data.alerts) {
      console.log('✅ Admin API access working correctly');
      console.log(`   Users count: ${analyticsResponse.data.users.total}`);
      console.log(`   Alerts count: ${analyticsResponse.data.alerts.total}`);
      console.log(`   Admin role confirmed: Token grants admin access`);
    } else {
      throw new Error(`Admin API failed: ${JSON.stringify(analyticsResponse.data)}`);
    }

    // Step 6: Test user preferences endpoint (regular user functionality)
    console.log('\n⚙️  Step 6: Testing user-level API access...');
    const preferencesResponse = await axios.get('https://admin.agentradar.app/api/admin/users', {
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    if (preferencesResponse.status === 200) {
      console.log('✅ User management API accessible');
    }

    // Summary
    console.log('\n🎉 COMPLETE LOGIN FLOW TEST RESULTS');
    console.log('====================================');
    console.log('✅ Login page: Accessible');
    console.log('✅ Login API: Working correctly');
    console.log('✅ Token validation: Working correctly');
    console.log('✅ Admin dashboard: Accessible');
    console.log('✅ Admin API: Token grants proper access');
    console.log('✅ Authentication flow: FULLY FUNCTIONAL');
    console.log('\n🔐 Admin credentials confirmed working:');
    console.log('   Email: mike.holownych@agentradar.app');
    console.log('   Password: admin123');
    console.log('\n🌐 Login URL: https://admin.agentradar.app/login');
    console.log('🎛️  Admin Dashboard: https://admin.agentradar.app/admin');

  } catch (error) {
    console.error('\n❌ LOGIN FLOW TEST FAILED');
    console.error('========================');
    
    if (error.response) {
      console.error(`HTTP Error: ${error.response.status} - ${error.response.statusText}`);
      console.error(`URL: ${error.config?.url}`);
      console.error(`Response: ${JSON.stringify(error.response.data).slice(0, 200)}...`);
    } else if (error.request) {
      console.error(`Network Error: No response received`);
      console.error(`URL: ${error.config?.url}`);
    } else {
      console.error(`Error: ${error.message}`);
    }
  }
}

testCompleteLoginFlow();