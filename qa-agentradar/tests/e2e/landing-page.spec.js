const { test, expect } = require('@playwright/test');

test.describe('AgentRadar Landing Page - Core Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('should load successfully with all critical elements', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/AgentRadar/);
    
    // Verify hero section
    const heroHeading = page.locator('h1').first();
    await expect(heroHeading).toBeVisible();
    await expect(heroHeading).toContainText('6-12 months before MLS');
    
    // Check primary CTA button
    const primaryCTA = page.getByRole('button', { name: /get early access/i });
    await expect(primaryCTA).toBeVisible();
    
    // Verify navigation menu
    const navigation = page.locator('nav');
    await expect(navigation).toBeVisible();
    
    // Check for pricing section
    const pricingSection = page.locator('text=Pricing').first();
    await expect(pricingSection).toBeVisible();
  });

  test('should display pricing plans correctly', async ({ page }) => {
    // Navigate to pricing section
    await page.getByText('Pricing').first().click();
    
    // Verify pricing plans exist
    const soloAgent = page.locator('text=Solo Agent');
    const professional = page.locator('text=Professional');
    const teamEnterprise = page.locator('text=Team Enterprise');
    
    await expect(soloAgent).toBeVisible();
    await expect(professional).toBeVisible();
    await expect(teamEnterprise).toBeVisible();
    
    // Check for early adopter discount
    const discount = page.locator('text=50% Off');
    await expect(discount).toBeVisible();
  });

  test('should handle FAQ section interactions', async ({ page }) => {
    // Find FAQ section
    const faqSection = page.locator('text=FAQ').first();
    await faqSection.scrollIntoViewIfNeeded();
    
    // Find first FAQ question and click
    const faqQuestion = page.locator('[role="button"]').filter({ hasText: /what|how|when|why/i }).first();
    if (await faqQuestion.count() > 0) {
      await faqQuestion.click();
      
      // Verify answer appears
      const faqAnswer = page.locator('[data-state="open"], .expanded').first();
      await expect(faqAnswer).toBeVisible();
    }
  });

  test('should validate early access form', async ({ page }) => {
    // Find and click early access CTA
    const earlyAccessBtn = page.getByRole('button', { name: /get early access/i }).first();
    await earlyAccessBtn.click();
    
    // Wait for form to appear (modal or inline)
    await page.waitForTimeout(1000);
    
    // Look for email input field
    const emailInput = page.locator('input[type="email"], input[name*="email"], input[placeholder*="email"]').first();
    
    if (await emailInput.count() > 0) {
      // Test invalid email validation
      await emailInput.fill('invalid-email');
      const submitBtn = page.locator('button[type="submit"], button:has-text("submit"), button:has-text("join")').first();
      await submitBtn.click();
      
      // Check for validation message
      const validationMsg = page.locator('text=valid email, text=required, .error').first();
      await expect(validationMsg).toBeVisible();
      
      // Test valid email
      await emailInput.fill('test@example.com');
      await submitBtn.click();
      
      // Look for success state or thank you message
      const successMsg = page.locator('text=thank you, text=success, text=received').first();
      if (await successMsg.count() > 0) {
        await expect(successMsg).toBeVisible();
      }
    }
  });

  test('should be mobile responsive', async ({ page, isMobile }) => {
    if (isMobile) {
      // Check mobile navigation (hamburger menu)
      const mobileMenu = page.locator('button[aria-label*="menu"], .hamburger, [data-testid="mobile-menu"]').first();
      if (await mobileMenu.count() > 0) {
        await mobileMenu.click();
        
        // Verify mobile menu opens
        const mobileNav = page.locator('.mobile-nav, [data-state="open"], .menu-open').first();
        await expect(mobileNav).toBeVisible();
      }
      
      // Check that content is properly sized for mobile
      const heroSection = page.locator('h1').first();
      const boundingBox = await heroSection.boundingBox();
      expect(boundingBox.width).toBeLessThanOrEqual(400);
    }
  });
});

test.describe('AgentRadar Navigation Tests', () => {
  test('should navigate to all main sections', async ({ page }) => {
    await page.goto('/');
    
    // Test Features navigation
    const featuresLink = page.getByText('Features').first();
    if (await featuresLink.count() > 0) {
      await featuresLink.click();
      await page.waitForLoadState('networkidle');
      // Verify features content loads
      const featuresContent = page.locator('text=feature, text=capability, text=tool').first();
      await expect(featuresContent).toBeVisible();
    }
    
    // Test Pricing navigation
    await page.goto('/');
    const pricingLink = page.getByText('Pricing').first();
    if (await pricingLink.count() > 0) {
      await pricingLink.click();
      await page.waitForLoadState('networkidle');
      // Verify pricing content
      const pricingContent = page.locator('text=plan, text=price, text=$').first();
      await expect(pricingContent).toBeVisible();
    }
  });
});

test.describe('AgentRadar Performance Tests', () => {
  test('should load within performance thresholds', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should load in less than 5 seconds
    expect(loadTime).toBeLessThan(5000);
    
    // Check for core web vitals indicators
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          resolve(entries.map(entry => ({
            name: entry.name,
            value: entry.value,
            rating: entry.rating
          })));
        }).observe({ entryTypes: ['navigation', 'paint'] });
        
        // Fallback timeout
        setTimeout(() => resolve([]), 2000);
      });
    });
    
    console.log('Performance metrics:', metrics);
  });
});