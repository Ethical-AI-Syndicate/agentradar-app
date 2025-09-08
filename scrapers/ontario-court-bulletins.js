import { parseCourtFiling } from './parsers/court-filing-parser.js';
import { prisma } from './db.js';
import pLimit from 'p-limit';

/**
 * Ontario court bulletin base URL.
 * Can be overridden with BULLETIN_URL env var for testing.
 */
const BULLETIN_URL =
  process.env.BULLETIN_URL ||
  'https://www.ontariocourts.ca/scj/civil/weekly-court-lists/';

/**
 * Fetch the Ontario court bulletin HTML and parse filing links.
 * @returns {Promise<{filings: {title: string, url: string}[]}>}
 */
export async function fetchOntarioCourtBulletins() {
  const res = await fetch(BULLETIN_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch bulletin: ${res.status} ${res.statusText}`);
  }
  const html = await res.text();
  return parseCourtFiling(html);
}

/**
 * Persist filings into the court_cases table using Prisma upserts.
 * @param {{title: string, url: string}[]} filings
 * @param {{concurrency?: number}} [options] Optional settings
 */
export async function saveCourtFilings(filings, { concurrency = 5 } = {}) {
  const now = new Date();
  const limit = pLimit(concurrency);
  await Promise.all(
    filings.map(filing =>
      limit(() =>
        prisma.courtCase.upsert({
          where: { guid: filing.url },
          update: {
            title: filing.title,
            caseUrl: filing.url,
            publishDate: now
          },
          create: {
            guid: filing.url,
            title: filing.title,
            court: 'ONSC',
            publishDate: now,
            caseUrl: filing.url,
            source: 'OntarioCourtBulletin'
          }
        })
      )
    )
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  fetchOntarioCourtBulletins()
    .then(async data => {
      console.log('Fetched bulletins', data);
      await saveCourtFilings(data.filings);
    })
    .catch(err => {
      console.error('Error fetching bulletins', err);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
