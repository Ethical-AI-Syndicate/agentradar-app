const { test, expect } = require('@playwright/test');

test.describe('AgentRadar Accessibility Audit', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    const headingLevels = [];
    
    for (const heading of headings) {
      const tagName = await heading.evaluate(el => el.tagName);
      const text = await heading.textContent();
      const level = parseInt(tagName.charAt(1));
      
      headingLevels.push({ level, text: text?.trim(), tagName });
    }
    
    console.log('Heading hierarchy:', headingLevels);
    
    // Should have at least one H1
    const h1Count = headingLevels.filter(h => h.level === 1).length;
    expect(h1Count).toBeGreaterThan(0);
    expect(h1Count).toBeLessThanOrEqual(1); // Ideally only one H1
    
    // Check logical progression (no skipping levels)
    for (let i = 1; i < headingLevels.length; i++) {
      const current = headingLevels[i].level;
      const previous = headingLevels[i - 1].level;
      const diff = current - previous;
      
      // Should not skip more than 1 level
      expect(diff).toBeLessThanOrEqual(1);
    }
  });

  test('should have alt text for images', async ({ page }) => {
    const images = await page.locator('img').all();
    const imageResults = [];
    
    for (const img of images) {
      const src = await img.getAttribute('src');
      const alt = await img.getAttribute('alt');
      const ariaLabel = await img.getAttribute('aria-label');
      const role = await img.getAttribute('role');
      
      imageResults.push({
        src: src || 'No src',
        hasAlt: !!alt,
        altText: alt || 'None',
        hasAriaLabel: !!ariaLabel,
        isDecorative: role === 'presentation' || alt === ''
      });
    }
    
    console.log('Image accessibility analysis:', imageResults);
    
    // All non-decorative images should have alt text or aria-label
    const imagesNeedingAlt = imageResults.filter(img => 
      !img.isDecorative && !img.hasAlt && !img.hasAriaLabel
    );
    
    expect(imagesNeedingAlt.length).toBe(0);
  });

  test('should have proper form labels and accessibility', async ({ page }) => {
    const inputs = await page.locator('input, textarea, select').all();
    const formResults = [];
    
    for (const input of inputs) {
      const type = await input.getAttribute('type');
      const id = await input.getAttribute('id');
      const name = await input.getAttribute('name');
      const placeholder = await input.getAttribute('placeholder');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      
      // Check for associated label
      let hasLabel = false;
      if (id) {
        const label = await page.locator(`label[for="${id}"]`).count();
        hasLabel = label > 0;
      }
      
      formResults.push({
        type: type || 'text',
        hasId: !!id,
        hasName: !!name,
        hasLabel: hasLabel,
        hasPlaceholder: !!placeholder,
        hasAriaLabel: !!ariaLabel,
        hasAriaLabelledBy: !!ariaLabelledBy,
        accessible: hasLabel || ariaLabel || ariaLabelledBy
      });
    }
    
    console.log('Form accessibility analysis:', formResults);
    
    // All form inputs should be accessible
    const inaccessibleInputs = formResults.filter(input => !input.accessible);
    expect(inaccessibleInputs.length).toBe(0);
  });

  test('should have sufficient color contrast', async ({ page }) => {
    // Get text elements and their computed styles
    const textElements = await page.locator('p, h1, h2, h3, h4, h5, h6, span, a, button, label').all();
    const contrastIssues = [];
    
    for (const element of textElements.slice(0, 10)) { // Test first 10 for performance
      try {
        const styles = await element.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            fontSize: computed.fontSize
          };
        });
        
        const text = await element.textContent();
        if (text && text.trim().length > 0) {
          // Basic contrast check (simplified)
          const colorMatch = styles.color.match(/rgb\((\d+), (\d+), (\d+)\)/);
          const bgMatch = styles.backgroundColor.match(/rgb\((\d+), (\d+), (\d+)\)/);
          
          if (colorMatch && bgMatch) {
            const [, r1, g1, b1] = colorMatch.map(Number);
            const [, r2, g2, b2] = bgMatch.map(Number);
            
            // Calculate relative luminance (simplified)
            const getLuminance = (r, g, b) => {
              const [rs, gs, bs] = [r, g, b].map(c => {
                c = c / 255;
                return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
              });
              return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
            };
            
            const l1 = getLuminance(r1, g1, b1);
            const l2 = getLuminance(r2, g2, b2);
            const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
            
            const fontSize = parseFloat(styles.fontSize);
            const isLargeText = fontSize >= 24 || (fontSize >= 18); // Simplified
            const minRatio = isLargeText ? 3 : 4.5; // WCAG AA standards
            
            if (ratio < minRatio) {
              contrastIssues.push({
                text: text.trim().substring(0, 50),
                ratio: ratio.toFixed(2),
                required: minRatio,
                fontSize: styles.fontSize,
                color: styles.color,
                backgroundColor: styles.backgroundColor
              });
            }
          }
        }
      } catch (error) {
        // Skip elements that can't be analyzed
      }
    }
    
    console.log('Color contrast analysis:', {
      totalChecked: Math.min(textElements.length, 10),
      issuesFound: contrastIssues.length,
      issues: contrastIssues
    });
    
    // Should have minimal contrast issues
    expect(contrastIssues.length).toBeLessThanOrEqual(2);
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Test Tab navigation
    const focusableElements = [];
    
    // Start tabbing through the page
    for (let i = 0; i < 20; i++) { // Test first 20 tab stops
      await page.keyboard.press('Tab');
      
      const focused = await page.evaluateHandle(() => document.activeElement);
      const tagName = await focused.evaluate(el => el.tagName);
      const className = await focused.evaluate(el => el.className);
      const id = await focused.evaluate(el => el.id);
      
      focusableElements.push({
        tagName,
        className,
        id,
        tabIndex: i + 1
      });
      
      // Check if element is visible
      const isVisible = await focused.evaluate(el => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
      
      expect(isVisible).toBeTruthy();
    }
    
    console.log('Keyboard navigation analysis:', focusableElements);
    
    // Should have reasonable number of focusable elements
    expect(focusableElements.length).toBeGreaterThan(5);
  });

  test('should have proper ARIA attributes', async ({ page }) => {
    // Check for ARIA landmarks
    const landmarks = await page.locator('[role="main"], [role="banner"], [role="navigation"], [role="contentinfo"], [role="complementary"]').count();
    console.log('ARIA landmarks found:', landmarks);
    
    // Check for ARIA labels on interactive elements
    const buttons = await page.locator('button').all();
    const buttonResults = [];
    
    for (const button of buttons) {
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const ariaDescribedBy = await button.getAttribute('aria-describedby');
      
      buttonResults.push({
        hasText: !!text && text.trim().length > 0,
        hasAriaLabel: !!ariaLabel,
        hasAriaDescribedBy: !!ariaDescribedBy,
        accessible: !!text?.trim() || !!ariaLabel
      });
    }
    
    console.log('Button accessibility analysis:', buttonResults);
    
    // All buttons should be accessible
    const inaccessibleButtons = buttonResults.filter(btn => !btn.accessible);
    expect(inaccessibleButtons.length).toBe(0);
  });

  test('should handle focus indicators properly', async ({ page }) => {
    // Test focus indicators on interactive elements
    const interactiveElements = await page.locator('button, a, input, select, textarea').all();
    
    for (const element of interactiveElements.slice(0, 5)) { // Test first 5
      await element.focus();
      
      // Check if focus indicator is visible
      const focusStyles = await element.evaluate(el => {
        const computed = window.getComputedStyle(el, ':focus');
        return {
          outline: computed.outline,
          outlineColor: computed.outlineColor,
          outlineWidth: computed.outlineWidth,
          boxShadow: computed.boxShadow
        };
      });
      
      const hasFocusIndicator = focusStyles.outline !== 'none' || 
                               focusStyles.boxShadow !== 'none' ||
                               focusStyles.outlineWidth !== '0px';
      
      expect(hasFocusIndicator).toBeTruthy();
    }
  });
});