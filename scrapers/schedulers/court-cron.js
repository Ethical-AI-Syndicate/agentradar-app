import cron from 'node-cron';
import { fetchOntarioCourtBulletins, saveCourtFilings } from '../ontario-court-bulletins.js';
import { prisma } from '../db.js';

// Run every day at 8am Toronto time
cron.schedule(
  '0 8 * * *',
  async () => {
    console.log('Running Ontario court bulletin scraper');
    try {
      const data = await fetchOntarioCourtBulletins();
      await saveCourtFilings(data.filings);
      console.log(`Saved ${data.filings.length} filings`);
    } catch (err) {
      console.error('Scraper failed', err);
    }
  },
  {
    timezone: 'America/Toronto'
  }
);

async function shutdown() {
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
