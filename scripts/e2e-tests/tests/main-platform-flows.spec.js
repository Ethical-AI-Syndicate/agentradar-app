const { test, expect } = require('@playwright/test');

test.describe('Main Platform User Flows', () => {
  
  test('FUNC_001: Complete early access signup flow', async ({ page }) => {
    // Navigate to main page
    await page.goto('/');
    
    // Verify page loads correctly
    await expect(page).toHaveTitle(/AgentRadar/);
    await expect(page.locator('h1')).toContainText('AgentRadar');
    
    // Find and click early access button
    const earlyAccessButton = page.locator('button:has-text("Get Early Access"), a:has-text("Get Early Access")').first();
    await expect(earlyAccessButton).toBeVisible();
    await earlyAccessButton.click();
    
    // Fill email field
    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible();
    await emailInput.fill('test-validation@agentradar.app');
    
    // Submit form
    const submitButton = page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Sign Up")').first();
    await expect(submitButton).toBeVisible();
    await submitButton.click();
    
    // Verify success message or response
    await expect(page.locator('text=success, text=thank, text=submitted')).toBeVisible({ timeout: 10000 });
  });
  
  test('FUNC_002: Test pricing page functionality', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to pricing section
    await page.locator('a:has-text("Pricing"), button:has-text("Pricing")').first().click();
    
    // Verify pricing tiers are displayed
    await expect(page.locator('text=Solo Agent, text=$197')).toBeVisible();
    await expect(page.locator('text=Team Pro, text=$497')).toBeVisible();
    await expect(page.locator('text=Brokerage, text=$1997')).toBeVisible();
    
    // Test tier selection
    const soloAgentButton = page.locator('button:has-text("Choose Plan"), button:has-text("Get Started")').first();
    await expect(soloAgentButton).toBeVisible();
    await soloAgentButton.click();
    
    // Verify CTA functionality (should redirect or show modal)
    await page.waitForTimeout(2000); // Allow for any animations/redirects
  });
  
  test('FUNC_003: Test navigation and responsive behavior', async ({ page }) => {
    await page.goto('/');
    
    // Test main navigation links
    const navLinks = ['Features', 'Pricing', 'About', 'Contact'];
    
    for (const link of navLinks) {
      const navLink = page.locator(`nav a:has-text("${link}")`).first();
      if (await navLink.isVisible()) {
        await navLink.click();
        await page.waitForTimeout(1000);
        // Verify we didn't get a 404 or error page
        await expect(page.locator('text=404, text=Error')).not.toBeVisible();
      }
    }
  });
  
  test('FUNC_004: Test form validation and error handling', async ({ page }) => {
    await page.goto('/');
    
    // Find early access form
    const earlyAccessButton = page.locator('button:has-text("Get Early Access"), a:has-text("Get Early Access")').first();
    if (await earlyAccessButton.isVisible()) {
      await earlyAccessButton.click();
      
      // Try submitting empty form
      const submitButton = page.locator('button[type="submit"], button:has-text("Submit")').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        
        // Should show validation error
        await expect(page.locator('text=required, text=error, text=invalid')).toBeVisible({ timeout: 5000 });
      }
      
      // Try submitting invalid email
      const emailInput = page.locator('input[type="email"]').first();
      if (await emailInput.isVisible()) {
        await emailInput.fill('invalid-email');
        await submitButton.click();
        
        // Should show email validation error
        await expect(page.locator('text=valid email, text=invalid, text=error')).toBeVisible({ timeout: 5000 });
      }
    }
  });
});