import { prisma } from './db.js';
import pLimit from 'p-limit';

const TORONTO_DEV_APPS_URL =
  process.env.TORONTO_DEV_APPS_URL ||
  'https://www.toronto.ca/devapps/api/projects.json';

export async function fetchTorontoDevelopmentApplications() {
  const controller = new AbortController();
  const timeoutMs = Number(process.env.DEV_APP_TIMEOUT_MS || 10000);
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(TORONTO_DEV_APPS_URL, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(
        `Failed to fetch development applications: ${res.status} ${res.statusText}`
      );
    }
    const json = await res.json();
    const apps = Array.isArray(json.applications)
      ? json.applications.map(app => ({
          id: app.id,
          address: app.address,
          municipality: 'Toronto'
        }))
      : [];
    return { applications: apps };
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Timed out fetching development applications');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export async function saveDevelopmentApplications(
  applications,
  { concurrency } = {}
) {
  const now = new Date();
  const max = concurrency ?? Number(process.env.DEV_APP_CONCURRENCY || 5);
  const limit = pLimit(max);
  await Promise.all(
    applications.map(app =>
      limit(() =>
        prisma.developmentApplication.upsert({
          where: { guid: String(app.id) },
          update: {
            address: app.address,
            municipality: app.municipality,
            publishDate: now
          },
          create: {
            guid: String(app.id),
            address: app.address,
            municipality: app.municipality,
            publishDate: now
          }
        })
      )
    )
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  fetchTorontoDevelopmentApplications()
    .then(async data => {
      console.log('Fetched development applications', data);
      await saveDevelopmentApplications(data.applications);
    })
    .catch(err => {
      console.error('Error fetching development applications', err);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
