import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { fetchOntarioCourtBulletins } from './ontario-court-bulletins.js';

// Ensure fetchOntarioCourtBulletins throws when network request fails
// Uses Node's built-in test runner mock utilities

test('fetchOntarioCourtBulletins throws on HTTP error', async () => {
  mock.method(global, 'fetch', async () => ({ ok: false, status: 500, statusText: 'Internal Server Error' }));
  await assert.rejects(fetchOntarioCourtBulletins(), /Failed to fetch bulletin: 500 Internal Server Error/);
  mock.restoreAll();
});
