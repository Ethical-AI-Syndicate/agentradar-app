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
  assert.deepEqual(calls[0].where, { guid: filings[0].url });
  assert.deepEqual(calls[1].create.title, filings[1].title);
  mock.restoreAll();
  prisma.courtCase = originalModel;
});
