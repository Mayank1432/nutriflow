const { test, expect } = require('@playwright/test');

const CACHE_NAME = 'protein-planner-v0.5.3';
const TEST_KEY = 'pwa_smoke_test_key';

function absoluteUrl(baseURL, path) {
  return new URL(path, baseURL).toString();
}

function normalizedPathname(url) {
  return new URL(url).pathname.replace(/\/{2,}/g, '/');
}

function homeCachePaths(baseURL) {
  const basePath = new URL(baseURL).pathname.replace(/\/{2,}/g, '/');
  const basePathWithSlash = basePath.endsWith('/') ? basePath : `${basePath}/`;
  const basePathWithoutSlash = basePathWithSlash === '/' ? '/' : basePathWithSlash.replace(/\/$/, '');
  return new Set([
    '/',
    '/index.html',
    '/protein-diet-planner/',
    '/protein-diet-planner/index.html',
    basePathWithSlash,
    `${basePathWithSlash}index.html`,
    basePathWithoutSlash,
    `${basePathWithoutSlash}/index.html`
  ]);
}

function hasCachedPath(cachedPathnames, expectedPath) {
  return cachedPathnames.some(pathname => pathname === `/${expectedPath}` || pathname.endsWith(`/${expectedPath}`));
}

test('hosted PWA app shell works online and offline', async ({ page, context, request, baseURL }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto('./', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: 'Protein Diet Planner' })).toBeVisible();

  const manifestResponse = await request.get(absoluteUrl(baseURL, './manifest.json'));
  expect(manifestResponse.status()).toBe(200);
  const manifest = await manifestResponse.json();
  expect(manifest.name).toBe('Protein Diet Planner');
  expect(manifest.short_name).toBe('Protein Planner');
  expect(manifest.start_url).toBeTruthy();
  expect(manifest.scope).toBeTruthy();
  expect(manifest.display).toBe('standalone');
  expect(manifest.icons.some(icon => icon.sizes === '192x192' && icon.src.includes('icon-192.png'))).toBe(true);
  expect(manifest.icons.some(icon => icon.sizes === '512x512' && icon.src.includes('icon-512.png'))).toBe(true);

  for (const path of ['./sw.js', './icons/icon-192.png', './icons/icon-512.png']) {
    const response = await request.get(absoluteUrl(baseURL, path));
    expect(response.status(), `${path} should load`).toBe(200);
  }

  const serviceWorkerUrl = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    return (registration.active || registration.waiting || registration.installing).scriptURL;
  });
  expect(serviceWorkerUrl).toContain('sw.js');

  await page.waitForFunction(cacheName => caches.keys().then(keys => keys.includes(cacheName)), CACHE_NAME);
  const cachedUrls = await page.evaluate(async cacheName => {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    return requests.map(request => request.url);
  }, CACHE_NAME);

  const cachedPathnames = cachedUrls.map(normalizedPathname);
  expect(cachedPathnames.some(pathname => homeCachePaths(baseURL).has(pathname))).toBe(true);
  for (const expected of ['js/storage.js', 'manifest.json', 'icons/icon-192.png', 'icons/icon-512.png']) {
    expect(hasCachedPath(cachedPathnames, expected), `${expected} should be cached`).toBe(true);
  }

  await page.evaluate(([key, value]) => localStorage.setItem(key, value), [TEST_KEY, 'ok']);
  await page.reload({ waitUntil: 'networkidle' });
  await expect.poll(() => page.evaluate(key => localStorage.getItem(key), TEST_KEY)).toBe('ok');

  await page.getByRole('button', { name: /Weekly Plan/ }).click();
  await expect(page.locator('#view-week')).toBeVisible();
  await page.getByRole('button', { name: /History/ }).click();
  await expect(page.locator('#view-history')).toBeVisible();
  await page.getByRole('button', { name: /Today/ }).click();
  await expect(page.locator('#view-today')).toBeVisible();

  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Protein Diet Planner' })).toBeVisible();
  await context.setOffline(false);
  await page.evaluate(key => localStorage.removeItem(key), TEST_KEY);

  expect(errors).toEqual([]);
});
