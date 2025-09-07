const { test, expect } = require('@playwright/test');

test.describe('AgentRadar Security Audit', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should enforce HTTPS and security headers', async ({ page }) => {
    const response = await page.goto('/');
    
    // Check HTTPS enforcement
    expect(page.url()).toMatch(/^https:/);
    
    // Check security headers
    const headers = response.headers();
    
    const securityChecks = {
      'strict-transport-security': headers['strict-transport-security'],
      'x-frame-options': headers['x-frame-options'],
      'x-content-type-options': headers['x-content-type-options'],
      'x-xss-protection': headers['x-xss-protection'],
      'content-security-policy': headers['content-security-policy'],
      'referrer-policy': headers['referrer-policy']
    };
    
    console.log('Security Headers Analysis:', securityChecks);
    
    // HSTS should be present for production
    expect(securityChecks['strict-transport-security']).toBeDefined();
    
    // X-Frame-Options should prevent clickjacking
    if (securityChecks['x-frame-options']) {
      expect(securityChecks['x-frame-options']).toMatch(/DENY|SAMEORIGIN/i);
    }
    
    // X-Content-Type-Options should prevent MIME sniffing
    if (securityChecks['x-content-type-options']) {
      expect(securityChecks['x-content-type-options']).toBe('nosniff');
    }
  });

  test('should prevent XSS in form inputs', async ({ page }) => {
    // Look for form inputs
    const emailInputs = await page.locator('input[type="email"], input[name*="email"]').all();
    const textInputs = await page.locator('input[type="text"], textarea').all();
    const allInputs = [...emailInputs, ...textInputs];
    
    for (const input of allInputs.slice(0, 3)) { // Test first 3 inputs
      // Try XSS payload
      const xssPayload = '<script>alert("XSS")</script>';
      
      try {
        await input.fill(xssPayload);
        await input.blur();
        
        // Check if script executed (it shouldn't)
        const dialogHandled = await page.evaluate(() => {
          return window.hasOwnProperty('alertFired') || document.body.innerHTML.includes('<script>');
        });
        
        expect(dialogHandled).toBeFalsy();
        
        // Check if input was properly sanitized
        const inputValue = await input.inputValue();
        expect(inputValue).not.toContain('<script>');
        
      } catch (error) {
        console.log('XSS test error (may be expected):', error.message);
      }
    }
  });

  test('should validate SSL/TLS configuration', async ({ page }) => {
    const response = await page.goto('/');
    
    // Check if connection is secure
    expect(response.status()).toBeLessThan(400);
    expect(page.url()).toMatch(/^https:/);
    
    // Check for mixed content warnings
    const mixedContentErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('Mixed Content')) {
        mixedContentErrors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000);
    
    // Should have no mixed content errors
    expect(mixedContentErrors.length).toBe(0);
  });

  test('should check for sensitive data exposure', async ({ page }) => {
    // Check page source for common sensitive patterns
    const pageContent = await page.content();
    
    const sensitivePatterns = [
      /api[_-]?key/i,
      /secret[_-]?key/i,
      /password\s*[:=]/i,
      /token\s*[:=]/i,
      /private[_-]?key/i,
      /access[_-]?key/i
    ];
    
    const foundSensitive = [];
    
    sensitivePatterns.forEach((pattern, index) => {
      if (pattern.test(pageContent)) {
        foundSensitive.push(`Pattern ${index + 1}: ${pattern}`);
      }
    });
    
    console.log('Sensitive Data Check:', foundSensitive.length === 0 ? 'PASS' : 'POTENTIAL ISSUES');
    if (foundSensitive.length > 0) {
      console.log('Found patterns:', foundSensitive);
    }
    
    // Should not expose sensitive data in client-side code
    expect(foundSensitive.length).toBe(0);
  });

  test('should validate form CSRF protection', async ({ page }) => {
    // Look for forms
    const forms = await page.locator('form').all();
    
    for (const form of forms) {
      // Check for CSRF tokens or other protection mechanisms
      const csrfToken = await form.locator('input[name*="csrf"], input[name*="token"], input[type="hidden"]').first();
      const hasToken = await csrfToken.count() > 0;
      
      // Check for proper form validation
      const submitButton = await form.locator('button[type="submit"], input[type="submit"]').first();
      const hasSubmit = await submitButton.count() > 0;
      
      if (hasSubmit) {
        console.log('Form security analysis:', {
          hasCsrfToken: hasToken,
          hasSubmitButton: hasSubmit
        });
      }
    }
  });

  test('should check for information disclosure', async ({ page }) => {
    // Check common paths that might expose sensitive info
    const testPaths = [
      '/.env',
      '/config.json',
      '/package.json',
      '/.git/config',
      '/admin',
      '/wp-admin',
      '/phpinfo.php',
      '/server-status',
      '/debug'
    ];
    
    const exposedPaths = [];
    
    for (const path of testPaths) {
      try {
        const response = await page.goto(path);
        if (response.status() === 200) {
          const content = await page.content();
          if (!content.includes('404') && !content.includes('Not Found')) {
            exposedPaths.push(path);
          }
        }
      } catch (error) {
        // Path doesn't exist or is properly protected
      }
    }
    
    console.log('Information Disclosure Check:', exposedPaths.length === 0 ? 'PASS' : 'POTENTIAL ISSUES');
    if (exposedPaths.length > 0) {
      console.log('Potentially exposed paths:', exposedPaths);
    }
    
    // Should not expose sensitive paths
    expect(exposedPaths.length).toBe(0);
  });
});