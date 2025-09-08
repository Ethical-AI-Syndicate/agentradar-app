import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout as sleep } from 'node:timers/promises';
import { fetchOntarioCourtBulletins, saveCourtFilings } from './ontario-court-bulletins.js';
import { prisma } from './db.js';

// Ensure fetchOntarioCourtBulletins throws when network request fails
// Uses Node's built-in test runner mock utilities

test('fetchOntarioCourtBulletins throws on HTTP error', async () => {
  mock.method(global, 'fetch', async () => ({ ok: false, status: 500, statusText: 'Internal Server Error' }));
  await assert.rejects(fetchOntarioCourtBulletins(), /Failed to fetch bulletin: 500 Internal Server Error/);
  mock.restoreAll();
});

test('saveCourtFilings upserts each filing with limited concurrency', async () => {
  const filings = Array.from({ length: 6 }, (_, i) => ({
    title: `Case ${i + 1}`,
    url: `https://example.com/${i + 1}.pdf`
  }));
  const calls = [];
  let active = 0;
  let maxActive = 0;
  const originalModel = prisma.courtCase;
  prisma.courtCase = { upsert: async () => {} };
  mock.method(prisma.courtCase, 'upsert', async args => {
    active++;
    maxActive = Math.max(maxActive, active);
    calls.push(args);
    await sleep(5); // simulate latency
    active--;
  });
  await saveCourtFilings(filings, { concurrency: 2 });
  assert.equal(calls.length, filings.length);
  assert(maxActive <= 2);
  // ensure each call includes expected fields
  const publishDates = [];
  calls.forEach((call, idx) => {
    assert.deepEqual(call.where, { guid: filings[idx].url });
    const payload = call.update.title ? call.update : call.create;
    assert.equal(payload.title, filings[idx].title);
    assert.equal(payload.caseUrl, filings[idx].url);
    publishDates.push(payload.publishDate);
  });
  assert(publishDates.every(d => d.getTime() === publishDates[0].getTime()));
  mock.restoreAll();
  prisma.courtCase = originalModel;
});
