const { chromium } = require('@playwright/test');

async function testSites() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const sites = [
    { name: 'Support Site', url: 'https://support.agentradar.app' },
    { name: 'Docs Site', url: 'https://docs.agentradar.app' }
  ];
  
  for (const site of sites) {
    try {
      console.log(`\n🧪 Testing ${site.name}: ${site.url}`);
      
      const response = await page.goto(site.url, { timeout: 10000 });
      
      if (response) {
        const status = response.status();
        console.log(`   • HTTP Status: ${status}`);
        
        if (status === 200) {
          const title = await page.title();
          console.log(`   • Page Title: "${title}"`);
          
          // Check if it's actually the support/docs content or a redirect
          const url = page.url();
          if (url !== site.url) {
            console.log(`   • ⚠️  Redirected to: ${url}`);
          }
          
          // Take screenshot
          const screenshotPath = `/home/mike/claude-projects/active/RealEstateAgent-IntelligenceFeed/${site.name.toLowerCase().replace(' ', '-')}-screenshot.png`;
          await page.screenshot({ 
            path: screenshotPath,
            fullPage: true 
          });
          console.log(`   • Screenshot: ${screenshotPath}`);
          
          console.log(`   • ✅ ${site.name} is accessible`);
        } else {
          console.log(`   • ❌ ${site.name} returned HTTP ${status}`);
        }
      } else {
        console.log(`   • ❌ ${site.name} failed to load`);
      }
      
    } catch (error) {
      console.log(`   • ❌ ${site.name} error: ${error.message}`);
    }
  }
  
  await browser.close();
}

testSites();