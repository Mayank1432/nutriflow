import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const site = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'site')
const problems = []
const check = (condition, message) => { if (!condition) problems.push(message) }
const read = (path) => readFileSync(join(site, path), 'utf8')

for (const path of [
  'index.html',
  'manifest.json',
  'sw.js',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png',
  'classic/index.html',
  'classic/js/storage.js',
]) {
  check(existsSync(join(site, path)), `missing: ${path}`)
}
check(
  existsSync(join(site, 'assets')) && readdirSync(join(site, 'assets')).some((name) => name.endsWith('.js')),
  'missing: assets/*.js',
)
for (const path of ['classic/sw.js', 'classic/manifest.json']) {
  check(!existsSync(join(site, path)), `must not exist: ${path}`)
}

if (existsSync(join(site, 'index.html'))) {
  const html = read('index.html')
  check(html.includes('rel="manifest"'), 'index.html has no manifest link')
  check(!/(?:src|href)="\/(?!\/)/.test(html), 'index.html contains a root-absolute path (breaks under /nutriflow/)')
  check(html.includes('<title>NutriFlow</title>'), 'index.html title is not NutriFlow')
}

if (existsSync(join(site, 'manifest.json'))) {
  try {
    const manifest = JSON.parse(read('manifest.json'))
    check(manifest.name === 'NutriFlow' && manifest.short_name === 'NutriFlow', 'manifest name is not NutriFlow')
    check(manifest.start_url === './' && manifest.scope === './', 'manifest start_url/scope must be ./')
    check(manifest.display === 'standalone', 'manifest display must be standalone')
    for (const size of ['192x192', '512x512']) {
      check(manifest.icons?.some((icon) => icon.sizes === size), `manifest has no ${size} icon`)
    }
    for (const icon of manifest.icons ?? []) {
      check(existsSync(join(site, icon.src)), `manifest icon does not exist: ${icon.src}`)
    }
  } catch {
    problems.push('manifest.json is not valid JSON')
  }
}

if (existsSync(join(site, 'sw.js'))) {
  const sw = read('sw.js')
  check(!sw.includes('__BUILD_HASH__') && !sw.includes('__PRECACHE_URLS__'), 'sw.js still has placeholders')
  check(/nutriflow-react-[0-9a-f]{10}/.test(sw), 'sw.js has no build-hash cache name')
  const match = sw.match(/const PRECACHE_URLS = (\[[\s\S]*?\])\r?\n/)
  if (!match) {
    problems.push('sw.js has no PRECACHE_URLS list')
  } else {
    const urls = JSON.parse(match[1])
    check(urls.includes('./index.html'), 'precache list lacks ./index.html')
    check(urls.some((url) => url.startsWith('./assets/') && url.endsWith('.js')), 'precache list lacks a JS asset')
    for (const url of urls) {
      if (url === './') continue
      check(existsSync(join(site, url)), `precached file does not exist: ${url}`)
    }
  }
}

if (problems.length > 0) {
  console.error('Site check failed:')
  problems.forEach((problem) => console.error(` - ${problem}`))
  process.exit(1)
}
console.log('Site check passed.')