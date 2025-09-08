import { parseCourtFiling } from './parsers/court-filing-parser.js';
import { prisma } from './db.js';

const BULLETIN_URL = 'https://www.ontariocourts.ca/scj/civil/weekly-court-lists/';

export async function fetchOntarioCourtBulletins() {
  const res = await fetch(BULLETIN_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch bulletin: ${res.status} ${res.statusText}`);
  }
  const html = await res.text();
  return parseCourtFiling(html);
}

// Persist filings into court_cases table with basic metadata
export async function saveCourtFilings(filings) {
  for (const filing of filings) {
    await prisma.courtCase.upsert({
      where: { guid: filing.url },
      update: {},
      create: {
        guid: filing.url,
        title: filing.title,
        court: 'ONSC',
        publishDate: new Date(),
        caseUrl: filing.url,
        source: 'OntarioCourtBulletin'
      }
    });
  }
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
