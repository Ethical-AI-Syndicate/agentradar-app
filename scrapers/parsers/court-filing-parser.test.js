import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCourtFiling } from './court-filing-parser.js';

test('parseCourtFiling extracts unique PDF links', () => {
  const html = `
    <html><body>
      <a href="/scj/civil/weekly-court-lists/list1.pdf">List 1</a>
      <a href="/scj/civil/weekly-court-lists/list2.pdf">List 2</a>
      <a href="/scj/civil/weekly-court-lists/list1.pdf">Duplicate</a>
    </body></html>`;
  const result = parseCourtFiling(html);
  assert.equal(result.filings.length, 2);
  assert.deepEqual(result.filings, [
    {
      title: 'List 1',
      url: 'https://www.ontariocourts.ca/scj/civil/weekly-court-lists/list1.pdf'
    },
    {
      title: 'List 2',
      url: 'https://www.ontariocourts.ca/scj/civil/weekly-court-lists/list2.pdf'
    }
  ]);
});
