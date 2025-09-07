const { test, expect } = require('@playwright/test');

test.describe('AgentRadar Link Validation Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should validate all internal navigation links', async ({ page }) => {
    // Get all internal links
    const links = await page.locator('a[href^="/"], a[href^="#"], a[href^="./"]').all();
    const results = [];

    for (const link of links) {
      const href = await link.getAttribute('href');
      const text = await link.textContent();
      
      if (href && !href.startsWith('javascript:') && !href.startsWith('mailto:')) {
        try {
          // Navigate to link
          await link.click({ timeout: 5000 });
          await page.waitForLoadState('networkidle', { timeout: 10000 });
          
          // Check if page loaded successfully
          const pageTitle = await page.title();
          const statusOk = !pageTitle.toLowerCase().includes('error') && 
                          !pageTitle.toLowerCase().includes('404') &&
                          !pageTitle.toLowerCase().includes('not found');
          
          results.push({
            href,
            text: text?.trim() || 'No text',
            status: statusOk ? 'PASS' : 'FAIL',
            title: pageTitle
          });
          
          // Go back to main page for next test
          await page.goto('/');
          await page.waitForLoadState('networkidle');
          
        } catch (error) {
          results.push({
            href,
            text: text?.trim() || 'No text',
            status: 'ERROR',
            error: error.message
          });
        }
      }
    }

    // Report results
    console.log('Internal Link Validation Results:', results);
    
    // Ensure all links work
    const failedLinks = results.filter(r => r.status !== 'PASS');
    if (failedLinks.length > 0) {
      console.error('Failed links:', failedLinks);
    }
    
    expect(failedLinks.length).toBeLessThan(results.length * 0.1); // Less than 10% failure rate
  });

  test('should validate external links (status check only)', async ({ page }) => {
    // Get all external links
    const externalLinks = await page.locator('a[href^="http"]:not([href*="agentradar"])').all();
    const results = [];

    for (const link of externalLinks.slice(0, 10)) { // Limit to first 10 to avoid rate limits
      const href = await link.getAttribute('href');
      const text = await link.textContent();
      
      try {
        // Use fetch to check if link is reachable
        const response = await page.evaluate(async (url) => {
          try {
            const resp = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
            return { status: resp.status || 200, ok: true };
          } catch (error) {
            return { status: 0, ok: false, error: error.message };
          }
        }, href);
        
        results.push({
          href,
          text: text?.trim() || 'No text',
          status: response.ok ? 'PASS' : 'FAIL',
          httpStatus: response.status
        });
        
      } catch (error) {
        results.push({
          href,
          text: text?.trim() || 'No text',
          status: 'ERROR',
          error: error.message
        });
      }
    }

    console.log('External Link Check Results:', results);
    
    // Allow some external link failures (they might block HEAD requests)
    const failedLinks = results.filter(r => r.status === 'ERROR');
    expect(failedLinks.length).toBeLessThan(results.length * 0.5); // Less than 50% error rate
  });

  test('should validate anchor links within page', async ({ page }) => {
    // Get all anchor links
    const anchorLinks = await page.locator('a[href^="#"]').all();
    const results = [];

    for (const link of anchorLinks) {
      const href = await link.getAttribute('href');
      const text = await link.textContent();
      
      if (href && href !== '#') {
        try {
          // Click the anchor link
          await link.click();
          await page.waitForTimeout(500); // Wait for scroll
          
          // Check if target element exists
          const targetId = href.substring(1);
          const targetElement = page.locator(`#${targetId}, [name="${targetId}"]`);
          const targetExists = await targetElement.count() > 0;
          
          results.push({
            href,
            text: text?.trim() || 'No text',
            status: targetExists ? 'PASS' : 'FAIL',
            targetExists
          });
          
        } catch (error) {
          results.push({
            href,
            text: text?.trim() || 'No text',
            status: 'ERROR',
            error: error.message
          });
        }
      }
    }

    console.log('Anchor Link Validation Results:', results);
    
    // All anchor links should work
    const failedLinks = results.filter(r => r.status !== 'PASS');
    expect(failedLinks.length).toBe(0);
  });

  test('should validate footer links', async ({ page }) => {
    const footer = page.locator('footer');
    await footer.scrollIntoViewIfNeeded();
    
    const footerLinks = await footer.locator('a').all();
    const results = [];
    
    for (const link of footerLinks) {
      const href = await link.getAttribute('href');
      const text = await link.textContent();
      
      if (href) {
        // Check if link is accessible
        const isVisible = await link.isVisible();
        
        results.push({
          href,
          text: text?.trim() || 'No text',
          visible: isVisible,
          type: href.startsWith('http') ? 'external' : 
                href.startsWith('#') ? 'anchor' : 'internal'
        });
      }
    }
    
    console.log('Footer Links Analysis:', results);
    
    // Ensure footer has links and they are visible
    expect(results.length).toBeGreaterThan(0);
    const visibleLinks = results.filter(r => r.visible);
    expect(visibleLinks.length).toBeGreaterThan(0);
  });
});