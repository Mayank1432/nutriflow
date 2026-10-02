import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const dist = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const swPath = join(dist, 'sw.js')

const listFiles = (dir) => readdirSync(dir).flatMap((name) => {
  const full = join(dir, name)
  return statSync(full).isDirectory() ? listFiles(full) : [full]
})

const files = listFiles(dist)
  .map((full) => relative(dist, full).split(sep).join('/'))
  .filter((path) => path !== 'sw.js' && !path.endsWith('.map'))
  .sort()

const hash = createHash('sha256')
for (const path of files) {
  hash.update(path)
  hash.update(readFileSync(join(dist, path)))
}
const buildHash = hash.digest('hex').slice(0, 10)

const urls = ['./', ...files.map((path) => `./${path}`)]
let source = readFileSync(swPath, 'utf8')
if (!source.includes('__BUILD_HASH__') || !source.includes('__PRECACHE_URLS__')) {
  console.error('sw.js placeholders not found. Build aborted.')
  process.exit(1)
}
source = source
  .replaceAll('__BUILD_HASH__', buildHash)
  .replace('__PRECACHE_URLS__', () => JSON.stringify(urls, null, 2))
writeFileSync(swPath, source)
console.log(`Service worker updated: cache nutriflow-react-${buildHash}, ${urls.length} precached URLs.`)