const { chromium } = require('@playwright/test');

async function testStatusMonitorCSS() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log('🧪 Testing status monitor CSS rendering...\n');
    
    // Test production URL
    console.log('📍 Navigating to https://status.agentradar.app');
    await page.goto('https://status.agentradar.app');
    await page.waitForLoadState('networkidle');
    
    // Check for proper styling
    const hasStyledElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      let styledCount = 0;
      let totalElements = elements.length;
      
      for (let element of elements) {
        const styles = window.getComputedStyle(element);
        // Check if element has meaningful styling beyond default browser styles
        if (
          styles.color !== 'rgb(0, 0, 0)' ||
          styles.backgroundColor !== 'rgba(0, 0, 0, 0)' ||
          styles.fontFamily !== 'Times' ||
          styles.padding !== '0px' ||
          styles.margin !== '0px' ||
          styles.borderWidth !== '0px' ||
          styles.borderRadius !== '0px'
        ) {
          styledCount++;
        }
      }
      
      return {
        total: totalElements,
        styled: styledCount,
        percentage: Math.round((styledCount / totalElements) * 100)
      };
    });
    
    // Check for gradient background (key indicator of proper Tailwind CSS)
    const hasGradientBg = await page.evaluate(() => {
      const body = document.body;
      const styles = window.getComputedStyle(body);
      return styles.background.includes('gradient') || 
             styles.backgroundImage.includes('gradient') ||
             body.className.includes('gradient') ||
             document.querySelector('.bg-gradient-to-br') !== null;
    });
    
    // Check page title
    const title = await page.title();
    
    // Take screenshot for visual inspection
    await page.screenshot({ 
      path: '/home/mike/claude-projects/active/RealEstateAgent-IntelligenceFeed/status-monitor/test-screenshot.png',
      fullPage: true 
    });
    
    // Results
    console.log('\n📊 CSS Analysis Results:');
    console.log(`   • Page Title: "${title}"`);
    console.log(`   • Total Elements: ${hasStyledElements.total}`);
    console.log(`   • Styled Elements: ${hasStyledElements.styled}`);
    console.log(`   • Styling Percentage: ${hasStyledElements.percentage}%`);
    console.log(`   • Has Gradient Background: ${hasGradientBg ? '✅ YES' : '❌ NO'}`);
    console.log('   • Screenshot saved: test-screenshot.png');
    
    if (hasStyledElements.percentage > 50 && hasGradientBg) {
      console.log('\n✅ CSS FIX VERIFIED: Status monitor is properly styled!');
      return true;
    } else {
      console.log('\n❌ CSS STILL BROKEN: Status monitor lacks proper styling');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

testStatusMonitorCSS().then(success => {
  process.exit(success ? 0 : 1);
});