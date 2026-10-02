import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const site = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'site')
const PREFIX = '/nutriflow/'
const PORT = Number(process.env.PORT) || 4173
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
}

// Mimics GitHub Pages: the site lives under /nutriflow/.
createServer((request, response) => {
  const url = new URL(request.url ?? '/', 'http://localhost')
  const pathname = decodeURIComponent(url.pathname)
  if (pathname === '/nutriflow' || pathname === '/nutriflow/classic') {
    response.writeHead(301, { Location: `${pathname}/` })
    response.end()
    return
  }
  if (!pathname.startsWith(PREFIX)) {
    response.writeHead(404)
    response.end('Not found')
    return
  }
  let file = normalize(join(site, pathname.slice(PREFIX.length)))
  if (!file.startsWith(site)) {
    response.writeHead(403)
    response.end('Forbidden')
    return
  }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html')
  if (!existsSync(file)) {
    response.writeHead(404)
    response.end('Not found')
    return
  }
  response.writeHead(200, {
    'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream',
    'Cache-Control': 'no-cache',
  })
  response.end(readFileSync(file))
}).listen(PORT, () => {
  console.log(`Serving site/ at http://localhost:${PORT}/nutriflow/  (Ctrl+C to stop)`)
})