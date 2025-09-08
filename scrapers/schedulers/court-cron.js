import cron from 'node-cron';
import { fetchOntarioCourtBulletins } from '../ontario-court-bulletins.js';

// Run every day at 8am Toronto time
cron.schedule(
  '0 8 * * *',
  async () => {
    console.log('Running Ontario court bulletin scraper');
    try {
      const data = await fetchOntarioCourtBulletins();
      console.log(`Fetched ${data.filings.length} filings`);
      // TODO: persist data into database and trigger downstream processing
    } catch (err) {
      console.error('Scraper failed', err);
    }
  },
  {
    timezone: 'America/Toronto'
  }
);
