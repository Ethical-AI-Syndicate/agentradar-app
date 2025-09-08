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
  const controller = new AbortController();
  const timeoutMs = Number(process.env.COURT_SCRAPER_TIMEOUT_MS || 10000);
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(BULLETIN_URL, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`Failed to fetch bulletin: ${res.status} ${res.statusText}`);
    }
    const html = await res.text();
    return parseCourtFiling(html);
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Timed out fetching bulletin');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Persist filings into the court_cases table using Prisma upserts.
 * @param {{title: string, url: string}[]} filings
 * @param {{concurrency?: number}} [options] Optional settings. Defaults to
 * COURT_SCRAPER_CONCURRENCY env var or 5 if not provided.
 */
export async function saveCourtFilings(
  filings,
  { concurrency } = {}
) {
  const now = new Date();
  const max =
    concurrency ?? Number(process.env.COURT_SCRAPER_CONCURRENCY || 5);
  const limit = pLimit(max);
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
