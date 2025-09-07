const { chromium } = require('playwright');

async function testAdminLogin() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('Testing admin login on production...');
    
    // Navigate to admin login page
    await page.goto('https://admin.agentradar.app/login?redirect=%2Fadmin');
    
    console.log('Page loaded, current URL:', page.url());
    
    // Fill in the login form
    await page.fill('input[type="email"]', 'mike.holownych@agentradar.app');
    await page.fill('input[type="password"]', 'admin123');
    
    console.log('Filled login form');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    console.log('Clicked submit, waiting for response...');
    
    // Wait for navigation or error
    await page.waitForTimeout(5000);
    
    const currentURL = page.url();
    console.log('Current URL after login:', currentURL);
    
    // Check for error messages
    const errorElement = await page.$('.text-red-600');
    if (errorElement) {
      const errorText = await errorElement.textContent();
      console.log('Login error:', errorText);
    }
    
    // Check if we're redirected to dashboard/admin
    if (currentURL.includes('/admin') && !currentURL.includes('/login')) {
      console.log('✅ Login successful - redirected to admin dashboard');
    } else if (currentURL.includes('/dashboard')) {
      console.log('✅ Login successful - redirected to dashboard');
    } else {
      console.log('❌ Login failed - still on login page or unexpected URL');
    }
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'login-test-result.png' });
    console.log('Screenshot saved as login-test-result.png');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
}

testAdminLogin();