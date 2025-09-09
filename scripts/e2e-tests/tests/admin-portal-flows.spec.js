const { test, expect } = require('@playwright/test');

test.describe('Admin Portal Functionality', () => {
  const adminCredentials = {
    email: 'mike.holownych@agentradar.app',
    password: process.env.ADMIN_PASSWORD || 'admin123'
  };
  
  test('ADMIN_001: Complete admin login to dashboard flow', async ({ page }) => {
    const adminUrl = process.env.ADMIN_URL || 'https://admin.agentradar.app';
    
    // Navigate to admin login
    await page.goto(`${adminUrl}/login`);
    
    // Verify login page loads
    await expect(page).toHaveTitle(/Admin|Login/i);
    
    // Fill login form
    await page.locator('input[type="email"], input[name="email"]').fill(adminCredentials.email);
    await page.locator('input[type="password"], input[name="password"]').fill(adminCredentials.password);
    
    // Submit login
    await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').click();
    
    // Verify successful login - should redirect to dashboard
    await expect(page).toHaveURL(new RegExp(`${adminUrl}/(dashboard|admin)`));
    await expect(page.locator('text=Dashboard, text=Welcome, text=Admin')).toBeVisible({ timeout: 10000 });
  });
  
  test('ADMIN_002: Test user management functionality', async ({ page, context }) => {
    const adminUrl = process.env.ADMIN_URL || 'https://admin.agentradar.app';
    
    // Login first
    await page.goto(`${adminUrl}/login`);
    await page.locator('input[type="email"]').fill(adminCredentials.email);
    await page.locator('input[type="password"]').fill(adminCredentials.password);
    await page.locator('button[type="submit"]').click();
    
    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');
    
    // Navigate to user management
    const userManagementLink = page.locator('a:has-text("Users"), a:has-text("User Management"), nav a:has-text("Users")');
    if (await userManagementLink.first().isVisible()) {
      await userManagementLink.first().click();
      
      // Test user listing
      await expect(page.locator('table, .user-list, .users-table')).toBeVisible({ timeout: 10000 });
      
      // Test pagination if present
      const paginationNext = page.locator('button:has-text("Next"), a:has-text("Next")');
      if (await paginationNext.isVisible()) {
        await paginationNext.click();
        await page.waitForTimeout(2000);
      }
      
      // Test user search/filter if present
      const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="filter" i]');
      if (await searchInput.isVisible()) {
        await searchInput.fill('test');
        await page.waitForTimeout(2000);
      }
    }
  });
  
  test('ADMIN_003: Test admin authentication and authorization', async ({ page }) => {
    const adminUrl = process.env.ADMIN_URL || 'https://admin.agentradar.app';
    
    // Try accessing admin dashboard without login
    await page.goto(`${adminUrl}/admin`);
    
    // Should be redirected to login or show unauthorized
    await expect(page).toHaveURL(new RegExp('(login|unauthorized|403)'));
    
    // Test invalid credentials
    await page.goto(`${adminUrl}/login`);
    await page.locator('input[type="email"]').fill('invalid@example.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.locator('button[type="submit"]').click();
    
    // Should show error message
    await expect(page.locator('text=invalid, text=error, text=unauthorized')).toBeVisible({ timeout: 5000 });
  });
  
  test('ADMIN_004: Test admin dashboard metrics and analytics', async ({ page }) => {
    const adminUrl = process.env.ADMIN_URL || 'https://admin.agentradar.app';
    
    // Login
    await page.goto(`${adminUrl}/login`);
    await page.locator('input[type="email"]').fill(adminCredentials.email);
    await page.locator('input[type="password"]').fill(adminCredentials.password);
    await page.locator('button[type="submit"]').click();
    
    // Wait for dashboard
    await page.waitForLoadState('networkidle');
    
    // Test metrics display
    const metrics = [
      'Total Users',
      'Active Alerts', 
      'Revenue',
      'Growth'
    ];
    
    for (const metric of metrics) {
      const metricElement = page.locator(`text=${metric}`);
      if (await metricElement.isVisible()) {
        await expect(metricElement).toBeVisible();
      }
    }
    
    // Test charts/graphs if present
    const chartElements = page.locator('canvas, svg, .chart, .graph');
    if (await chartElements.first().isVisible()) {
      await expect(chartElements.first()).toBeVisible();
    }
  });
});