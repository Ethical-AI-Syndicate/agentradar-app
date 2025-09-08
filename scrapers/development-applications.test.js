import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout as sleep } from 'node:timers/promises';
import {
  fetchTorontoDevelopmentApplications,
  saveDevelopmentApplications
} from './development-applications.js';
import { prisma } from './db.js';

// Ensure fetchTorontoDevelopmentApplications throws when network request fails
test('fetchTorontoDevelopmentApplications throws on HTTP error', async () => {
  mock.method(global, 'fetch', async () => ({
    ok: false,
    status: 500,
    statusText: 'Internal Server Error'
  }));
  await assert.rejects(
    fetchTorontoDevelopmentApplications(),
    /Failed to fetch development applications: 500 Internal Server Error/
  );
  mock.restoreAll();
});

test('fetchTorontoDevelopmentApplications times out based on DEV_APP_TIMEOUT_MS', async () => {
  const payload = { applications: [] };
  const originalEnv = process.env.DEV_APP_TIMEOUT_MS;
  process.env.DEV_APP_TIMEOUT_MS = '1';
  mock.method(global, 'fetch', (_, { signal } = {}) =>
    new Promise((resolve, reject) => {
      signal.addEventListener('abort', () =>
        reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }))
      );
      setTimeout(() => resolve({ ok: true, json: async () => payload }), 50);
    })
  );
  await assert.rejects(
    fetchTorontoDevelopmentApplications(),
    /Timed out fetching development applications/
  );
  mock.restoreAll();
  if (originalEnv === undefined) {
    delete process.env.DEV_APP_TIMEOUT_MS;
  } else {
    process.env.DEV_APP_TIMEOUT_MS = originalEnv;
  }
});

test('fetchTorontoDevelopmentApplications uses TORONTO_DEV_APPS_URL override', async () => {
  const payload = { applications: [] };
  const originalEnv = process.env.TORONTO_DEV_APPS_URL;
  process.env.TORONTO_DEV_APPS_URL = 'https://override.example.com/devapps';
  mock.method(global, 'fetch', async url => {
    assert.equal(url, 'https://override.example.com/devapps');
    return { ok: true, json: async () => payload };
  });
  const mod = await import('./development-applications.js?override');
  await mod.fetchTorontoDevelopmentApplications();
  mock.restoreAll();
  if (originalEnv === undefined) {
    delete process.env.TORONTO_DEV_APPS_URL;
  } else {
    process.env.TORONTO_DEV_APPS_URL = originalEnv;
  }
});

test('saveDevelopmentApplications upserts each application with limited concurrency', async () => {
  const apps = Array.from({ length: 4 }, (_, i) => ({
    id: i + 1,
    address: `Address ${i + 1}`,
    municipality: 'Toronto'
  }));
  const calls = [];
  let active = 0;
  let maxActive = 0;
  const originalModel = prisma.developmentApplication;
  prisma.developmentApplication = { upsert: async () => {} };
  mock.method(prisma.developmentApplication, 'upsert', async args => {
    active++;
    maxActive = Math.max(maxActive, active);
    calls.push(args);
    await sleep(5);
    active--;
  });
  await saveDevelopmentApplications(apps, { concurrency: 2 });
  assert.equal(calls.length, apps.length);
  assert(maxActive <= 2);
  const publishDates = [];
  calls.forEach((call, idx) => {
    assert.deepEqual(call.where, { guid: String(apps[idx].id) });
    const payload = call.update.address ? call.update : call.create;
    assert.equal(payload.address, apps[idx].address);
    assert.equal(payload.municipality, apps[idx].municipality);
    publishDates.push(payload.publishDate);
  });
  assert(publishDates.every(d => d.getTime() === publishDates[0].getTime()));
  mock.restoreAll();
  prisma.developmentApplication = originalModel;
});

test('saveDevelopmentApplications respects DEV_APP_CONCURRENCY env var', async () => {
  const apps = Array.from({ length: 3 }, (_, i) => ({
    id: i + 1,
    address: `Address ${i + 1}`,
    municipality: 'Toronto'
  }));
  const calls = [];
  let active = 0;
  let maxActive = 0;
  const originalModel = prisma.developmentApplication;
  const originalEnv = process.env.DEV_APP_CONCURRENCY;
  process.env.DEV_APP_CONCURRENCY = '1';
  prisma.developmentApplication = { upsert: async () => {} };
  mock.method(prisma.developmentApplication, 'upsert', async args => {
    active++;
    maxActive = Math.max(maxActive, active);
    calls.push(args);
    await sleep(5);
    active--;
  });
  await saveDevelopmentApplications(apps);
  assert.equal(calls.length, apps.length);
  assert(maxActive <= 1);
  mock.restoreAll();
  prisma.developmentApplication = originalModel;
  if (originalEnv === undefined) {
    delete process.env.DEV_APP_CONCURRENCY;
  } else {
    process.env.DEV_APP_CONCURRENCY = originalEnv;
  }
});
