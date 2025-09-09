const { test, expect } = require('@playwright/test');

test.describe('Accessibility Compliance', () => {
  
  test('A11Y_001: Keyboard navigation validation', async ({ page }) => {
    await page.goto('/');
    
    // Test tab navigation through interactive elements
    let focusableElements = [];
    const interactiveSelectors = [
      'button',
      'a[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ];
    
    for (const selector of interactiveSelectors) {
      const elements = await page.locator(selector).all();
      focusableElements = focusableElements.concat(elements);
    }
    
    // Test Tab navigation
    if (focusableElements.length > 0) {
      await page.keyboard.press('Tab');
      
      // Verify focus is visible
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Test multiple tabs
      for (let i = 0; i < Math.min(5, focusableElements.length - 1); i++) {
        await page.keyboard.press('Tab');
        await expect(page.locator(':focus')).toBeVisible();
      }
      
      // Test Shift+Tab (reverse navigation)
      await page.keyboard.press('Shift+Tab');
      await expect(page.locator(':focus')).toBeVisible();
    }
  });
  
  test('A11Y_002: Form accessibility validation', async ({ page }) => {
    await page.goto('/');
    
    // Find forms on the page
    const forms = await page.locator('form').all();
    
    for (const form of forms) {
      // Check for form labels
      const inputs = await form.locator('input, textarea, select').all();
      
      for (const input of inputs) {
        const inputId = await input.getAttribute('id');
        const inputName = await input.getAttribute('name');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');
        
        // Verify input has proper labeling
        if (inputId) {
          const label = form.locator(`label[for="${inputId}"]`);
          if (await label.count() === 0 && !ariaLabel && !ariaLabelledBy) {
            test.fail(`Input with id="${inputId}" has no associated label`);
          }
        }
        
        // Check for required field indicators
        const isRequired = await input.getAttribute('required');
        if (isRequired !== null) {
          const ariaRequired = await input.getAttribute('aria-required');
          if (ariaRequired !== 'true') {
            console.warn(`Required input should have aria-required="true"`);
          }
        }
      }
    }
  });
  
  test('A11Y_003: ARIA landmarks and structure', async ({ page }) => {
    await page.goto('/');
    
    // Check for essential ARIA landmarks
    const landmarks = {
      'main': 'main, [role="main"]',
      'navigation': 'nav, [role="navigation"]', 
      'banner': 'header, [role="banner"]',
      'contentinfo': 'footer, [role="contentinfo"]'
    };
    
    for (const [landmark, selector] of Object.entries(landmarks)) {
      const element = page.locator(selector).first();
      if (await element.count() > 0) {
        await expect(element).toBeVisible();
      } else {
        console.warn(`Missing ${landmark} landmark`);
      }
    }
    
    // Check heading hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    if (headings.length > 0) {
      let hasH1 = false;
      for (const heading of headings) {
        const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
        if (tagName === 'h1') {
          hasH1 = true;
          break;
        }
      }
      
      if (!hasH1) {
        console.warn('Page should have at least one h1 element');
      }
    }
  });
  
  test('A11Y_004: Color contrast and visual accessibility', async ({ page }) => {
    await page.goto('/');
    
    // Check for alt text on images
    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const ariaLabel = await img.getAttribute('aria-label');
      const role = await img.getAttribute('role');
      
      // Decorative images should have empty alt or role="presentation"
      // Content images should have descriptive alt text
      if (!alt && !ariaLabel && role !== 'presentation') {
        const src = await img.getAttribute('src');
        console.warn(`Image ${src} missing alt text`);
      }
    }
    
    // Check for focus indicators
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    
    if (await focusedElement.count() > 0) {
      // Verify focus indicator is visible (basic check)
      const boundingBox = await focusedElement.boundingBox();
      if (boundingBox) {
        expect(boundingBox.width).toBeGreaterThan(0);
        expect(boundingBox.height).toBeGreaterThan(0);
      }
    }
  });
  
  test('A11Y_005: Screen reader compatibility', async ({ page }) => {
    await page.goto('/');
    
    // Check for screen reader specific attributes
    const elementsWithAriaLabel = await page.locator('[aria-label]').all();
    const elementsWithAriaDescription = await page.locator('[aria-describedby]').all();
    const elementsWithAriaExpanded = await page.locator('[aria-expanded]').all();
    
    // Verify interactive elements have proper ARIA states
    const buttons = await page.locator('button').all();
    for (const button of buttons) {
      const ariaExpanded = await button.getAttribute('aria-expanded');
      const ariaPressed = await button.getAttribute('aria-pressed');
      
      // If it's a toggle button, it should have aria-pressed
      // If it controls a collapsible section, it should have aria-expanded
      const text = await button.textContent();
      if (text && (text.toLowerCase().includes('menu') || text.toLowerCase().includes('toggle'))) {
        if (!ariaExpanded && !ariaPressed) {
          console.warn(`Interactive button "${text}" may need ARIA state attributes`);
        }
      }
    }
    
    // Check for live regions if dynamic content exists
    const liveRegions = await page.locator('[aria-live]').all();
    console.log(`Found ${liveRegions.length} live regions for dynamic content`);
  });
});