import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'react-app', 'dist')
const site = join(root, 'site')

if (!existsSync(join(dist, 'index.html'))) {
  console.error('react-app/dist is missing. Run the React build first.')
  process.exit(1)
}

rmSync(site, { recursive: true, force: true })
cpSync(dist, site, { recursive: true })

// Frozen Vanilla archive: index.html and js/storage.js only.
// No service worker and no manifest, so it never competes with the React worker.
mkdirSync(join(site, 'classic', 'js'), { recursive: true })
cpSync(join(root, 'index.html'), join(site, 'classic', 'index.html'))
cpSync(join(root, 'js', 'storage.js'), join(site, 'classic', 'js', 'storage.js'))

console.log('Assembled site/: React at the root, Vanilla archive at classic/.')