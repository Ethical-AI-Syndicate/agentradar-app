import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { fetchOntarioCourtBulletins, saveCourtFilings } from './ontario-court-bulletins.js';
import { prisma } from './db.js';

// Ensure fetchOntarioCourtBulletins throws when network request fails
// Uses Node's built-in test runner mock utilities

test('fetchOntarioCourtBulletins throws on HTTP error', async () => {
  mock.method(global, 'fetch', async () => ({ ok: false, status: 500, statusText: 'Internal Server Error' }));
  await assert.rejects(fetchOntarioCourtBulletins(), /Failed to fetch bulletin: 500 Internal Server Error/);
  mock.restoreAll();
});

test('saveCourtFilings upserts each filing', async () => {
  const filings = [
    { title: 'One', url: 'https://example.com/1.pdf' },
    { title: 'Two', url: 'https://example.com/2.pdf' }
  ];
  const calls = [];
  const originalModel = prisma.courtCase;
  prisma.courtCase = { upsert: async () => {} };
  mock.method(prisma.courtCase, 'upsert', async args => {
    calls.push(args);
  });
  await saveCourtFilings(filings);
  assert.equal(calls.length, filings.length);
  // ensure each call includes expected fields
  const publishDates = [];
  calls.forEach((call, idx) => {
    assert.deepEqual(call.where, { guid: filings[idx].url });
    const payload = call.update.title ? call.update : call.create;
    assert.equal(payload.title, filings[idx].title);
    assert.equal(payload.caseUrl, filings[idx].url);
    publishDates.push(payload.publishDate);
  });
  // all publish dates should be identical
  assert(publishDates.every(d => d.getTime() === publishDates[0].getTime()));
  mock.restoreAll();
  prisma.courtCase = originalModel;
});
