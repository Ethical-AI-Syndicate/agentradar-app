import { parseCourtFiling } from './parsers/court-filing-parser.js';

const BULLETIN_URL = 'https://www.ontariocourts.ca/scj/civil/weekly-court-lists/';

export async function fetchOntarioCourtBulletins() {
  const res = await fetch(BULLETIN_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch bulletin: ${res.status} ${res.statusText}`);
  }
  const html = await res.text();
  return parseCourtFiling(html);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  fetchOntarioCourtBulletins()
    .then(data => {
      console.log('Fetched bulletins', data);
    })
    .catch(err => {
      console.error('Error fetching bulletins', err);
      process.exitCode = 1;
    });
}
