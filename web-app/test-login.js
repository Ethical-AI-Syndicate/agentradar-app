/**
 * Test the login flow to debug authentication issues
 */

const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login API...');
    
    const response = await axios.post('https://admin.agentradar.app/api/auth/login', {
      email: 'mike.holownych@agentradar.app',
      password: 'admin123'
    });
    
    console.log('Login Response:');
    console.log('Status:', response.status);
    console.log('Success:', response.data.success);
    console.log('Token present:', !!response.data.token);
    console.log('User present:', !!response.data.user);
    console.log('User role:', response.data.user?.role);
    console.log('User email:', response.data.user?.email);
    
    // Test token validation
    if (response.data.token) {
      console.log('\nTesting token validation...');
      
      const authResponse = await axios.get('https://admin.agentradar.app/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${response.data.token}`
        }
      });
      
      console.log('Auth validation status:', authResponse.status);
      console.log('User from /auth/me:', authResponse.data.user?.email);
    }
    
  } catch (error) {
    console.error('Login test failed:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.error);
  }
}

testLogin();