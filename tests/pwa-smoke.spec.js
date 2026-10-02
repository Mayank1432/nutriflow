const fs = require('fs');
const { test, expect } = require('@playwright/test');

const REACT_CACHE_PREFIX = 'nutriflow-react-';

function absoluteUrl(baseURL, path) {
  return new URL(path, baseURL).toString();
}

function hasCachedPath(cachedPathnames, expectedPath) {
  return cachedPathnames.some(pathname => pathname.endsWith(`/${expectedPath}`));
}

test('React PWA works online and offline', async ({ page, context, request, baseURL }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto('./', { waitUntil: 'networkidle' });
  await expect(page).toHaveTitle('NutriFlow');
  await expect(page.getByRole('heading', { level: 1, name: 'Today' })).toBeVisible();

  // Manifest
  const manifestUrl = absoluteUrl(baseURL, './manifest.json');
  const manifestResponse = await request.get(manifestUrl);
  expect(manifestResponse.status()).toBe(200);
  const manifest = await manifestResponse.json();
  expect(manifest.name).toBe('NutriFlow');
  expect(manifest.short_name).toBe('NutriFlow');
  expect(manifest.id).toBe('./');
  expect(manifest.start_url).toBe('./');
  expect(manifest.scope).toBe('./');
  expect(manifest.display).toBe('standalone');
  expect(manifest.icons.some(icon => icon.sizes === '192x192' && icon.purpose === 'any')).toBe(true);
  expect(manifest.icons.some(icon => icon.sizes === '512x512' && icon.purpose === 'any')).toBe(true);
  expect(manifest.icons.some(icon => icon.purpose === 'maskable')).toBe(true);
  for (const icon of manifest.icons) {
    const response = await request.get(absoluteUrl(manifestUrl, icon.src));
    expect(response.status(), `${icon.src} should load`).toBe(200);
  }
  const appleIcon = await request.get(absoluteUrl(baseURL, './icons/apple-touch-icon.png'));
  expect(appleIcon.status()).toBe(200);

  // Service worker and cache
  const swResponse = await request.get(absoluteUrl(baseURL, './sw.js'));
  expect(swResponse.status()).toBe(200);
  const serviceWorkerUrl = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    return (registration.active || registration.waiting || registration.installing).scriptURL;
  });
  expect(serviceWorkerUrl).toContain('sw.js');
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

  await page.waitForFunction(prefix => caches.keys().then(keys => keys.some(key => key.startsWith(prefix))), REACT_CACHE_PREFIX);
  const cacheNames = await page.evaluate(() => caches.keys());
  const reactCaches = cacheNames.filter(name => name.startsWith(REACT_CACHE_PREFIX));
  expect(reactCaches).toHaveLength(1);
  expect(cacheNames.filter(name => name.startsWith('nutriflow-') && !name.startsWith(REACT_CACHE_PREFIX))).toEqual([]);

  const cachedPathnames = await page.evaluate(async cacheName => {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    return requests.map(cachedRequest => new URL(cachedRequest.url).pathname);
  }, reactCaches[0]);
  expect(cachedPathnames.some(pathname => pathname.endsWith('/index.html') || pathname.endsWith('/'))).toBe(true);
  expect(cachedPathnames.some(pathname => /\/assets\/.+\.js$/.test(pathname)), 'a JS asset should be cached').toBe(true);
  for (const expected of ['manifest.json', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png']) {
    expect(hasCachedPath(cachedPathnames, expected), `${expected} should be cached`).toBe(true);
  }
  expect(cachedPathnames.some(pathname => pathname.includes('/classic/'))).toBe(false);

  // Navigation
  const primaryNav = page.getByRole('navigation', { name: 'Primary navigation' });
  for (const [tab, heading] of [['Weekly', 'Weekly Planner'], ['History', 'History'], ['Analytics', 'Analytics'], ['Today', 'Today']]) {
    await primaryNav.getByRole('button', { name: tab }).click();
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
  }

  // Backup export end to end
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('dialog', { name: 'Navigation menu' }).getByRole('button', { name: 'Backup & Restore' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Backup & Restore' })).toBeVisible();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download backup' }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^nutriflow-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const backup = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
  expect(backup.appFamily).toBe('nutriflow_react');
  expect(backup.backupVersion).toBe(1);
  expect(backup.history).toBeTruthy();
  await primaryNav.getByRole('button', { name: 'Today' }).click();

  // Offline reload
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1, name: 'Today' })).toBeVisible();
  await context.setOffline(false);

  expect(errors).toEqual([]);
});

test('archived Vanilla app loads at /classic/ without its own service worker', async ({ page, request, baseURL }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));

  await page.goto('classic/', { waitUntil: 'networkidle' });
  await expect(page).toHaveTitle('NutriFlow');
  await expect(page.getByRole('heading', { name: /NutriFlow/ })).toBeVisible();
  await expect(page.locator('#view-today')).toBeVisible();

  await page.getByRole('button', { name: /Weekly Plan/ }).click();
  await expect(page.locator('#view-week')).toBeVisible();
  await page.getByRole('button', { name: /History/ }).click();
  await expect(page.locator('#view-history')).toBeVisible();
  await page.getByRole('button', { name: /Today/ }).click();
  await expect(page.locator('#view-today')).toBeVisible();

  for (const path of ['classic/sw.js', 'classic/manifest.json']) {
    const response = await request.get(absoluteUrl(baseURL, path));
    expect(response.status(), `${path} should not exist in the archive`).toBe(404);
  }

  expect(errors).toEqual([]);
});