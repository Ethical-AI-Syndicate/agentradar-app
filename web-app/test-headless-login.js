const { chromium } = require('playwright');

async function testHeadlessLogin() {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    ignoreHTTPSErrors: true
  });
  
  const page = await context.newPage();
  
  try {
    console.log('🚀 Testing admin login flow...');
    
    // Navigate to admin login page
    console.log('📍 Navigating to login page...');
    await page.goto('https://admin.agentradar.app/login?redirect=%2Fadmin', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('✅ Login page loaded');
    
    // Wait for form to be visible
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    
    console.log('📝 Filling login form...');
    await page.fill('input[type="email"]', 'mike.holownych@agentradar.app');
    await page.fill('input[type="password"]', 'admin123');
    
    console.log('🔐 Submitting login form...');
    
    // Listen for network requests
    const loginRequest = page.waitForResponse(response => 
      response.url().includes('/api/auth/login') && response.status() === 200
    );
    
    await page.click('button[type="submit"]');
    
    // Wait for login API response
    const loginResponse = await loginRequest;
    const loginData = await loginResponse.json();
    
    console.log('🔍 Login API response received');
    console.log('   Success:', loginData.success);
    console.log('   Has token:', !!loginData.token);
    console.log('   User role:', loginData.user?.role);
    
    if (loginData.success) {
      console.log('⏳ Waiting for redirect...');
      
      // Wait for navigation to complete
      await page.waitForURL(url => 
        url.includes('/admin') || url.includes('/dashboard'), 
        { timeout: 10000 }
      );
      
      const finalURL = page.url();
      console.log('🎯 Final URL:', finalURL);
      
      if (finalURL.includes('/admin') || finalURL.includes('/dashboard')) {
        console.log('✅ LOGIN TEST PASSED - Successfully logged in and redirected');
        
        // Check if we can see admin content
        const pageTitle = await page.title();
        console.log('📄 Page title:', pageTitle);
        
        // Check for admin-specific content
        const adminContent = await page.$('text=Admin Dashboard');
        if (adminContent) {
          console.log('🎛️  Admin Dashboard content detected');
        }
        
      } else {
        console.log('❌ LOGIN TEST FAILED - Wrong redirect destination');
      }
    } else {
      console.log('❌ LOGIN TEST FAILED - Login API returned error');
    }
    
  } catch (error) {
    console.error('❌ LOGIN TEST FAILED - Exception:', error.message);
    
    // Get current page info for debugging
    const currentURL = page.url();
    const pageTitle = await page.title().catch(() => 'Unknown');
    
    console.log('🔍 Debug info:');
    console.log('   Current URL:', currentURL);
    console.log('   Page title:', pageTitle);
    
    // Check for error messages on page
    const errorElements = await page.$$('.text-red-600, .text-red-500, [role="alert"]');
    for (const element of errorElements) {
      const errorText = await element.textContent();
      if (errorText && errorText.trim()) {
        console.log('   Error on page:', errorText.trim());
      }
    }
    
  } finally {
    await browser.close();
  }
}

testHeadlessLogin();