import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import http from 'node:http'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(fileURLToPath(import.meta.url))
if (!process.env.DSH_HOME) {
  process.env.DSH_HOME = path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'DeepSeekWhaleStandalone')
}
fs.mkdirSync(process.env.DSH_HOME, { recursive: true })
const credentialFile = path.join(process.env.DSH_HOME, 'credentials.json')

function readCredentials() {
  try {
    const value = JSON.parse(fs.readFileSync(credentialFile, 'utf8'))
    return value && typeof value === 'object' ? value : {}
  } catch {
    return {}
  }
}
function writeCredentials(value) {
  fs.writeFileSync(credentialFile, JSON.stringify(value, null, 2), { encoding: 'utf8', mode: 0o600 })
}

const routes = []
const disposers = []
const noOpDisposer = () => {}
const credentials = {
  async resolve(name) {
    const envValue = process.env[String(name || '')]
    const val = envValue || readCredentials()[String(name || '')] || ''
    if (!val) return null
    return { value: String(val), toString() { return String(val) } }
  },
  async set(name, value) {
    if (!name) return false
    const data = readCredentials()
    data[String(name)] = String(value)
    writeCredentials(data)
    return true
  },
  async delete(name) {
    const data = readCredentials()
    delete data[String(name || '')]
    writeCredentials(data)
    return true
  },
}
const webServer = {
  register(route) {
    routes.push(route)
    const disposer = () => {
      const index = routes.indexOf(route)
      if (index >= 0) routes.splice(index, 1)
    }
    disposers.push(disposer)
    return disposer
  },
  tapIndex() {
    return noOpDisposer
  },
}
const ctx = {
  webServer,
  credentials,
  get() { return null },
  on() { return noOpDisposer },
  effect(cleanupFactory) {
    try {
      const cleanup = cleanupFactory()
      return typeof cleanup === 'function' ? cleanup : noOpDisposer
    } catch {
      return noOpDisposer
    }
  },
}
const root = {
  on() { return noOpDisposer },
  effect(cleanupFactory) {
    try {
      const cleanup = cleanupFactory()
      return typeof cleanup === 'function' ? cleanup : noOpDisposer
    } catch {
      return noOpDisposer
    }
  },
  inject(_services, callback) {
    callback(ctx)
  },
}

const { default: plugin } = await import('./lib/index.js')
plugin.apply(root)

if (process.argv.includes('--self-test')) {
  const names = routes.map((route) => route.path).filter(Boolean)
  const required = ['/dsh-whale/widget.js', '/dsh-whale/image.png', '/dsh-whale/balance.json', '/dsh-whale/size.json', '/dsh-whale/bubble.json', '/dsh-whale/audio.json']
  const missing = required.filter((route) => !names.includes(route))
  const ok = routes.length >= 20 && missing.length === 0 && fs.existsSync(path.join(ROOT, 'assets', 'whale-widget.js'))
  console.log(JSON.stringify({ ok, routeCount: routes.length, missing }))
  process.exit(ok ? 0 : 1)
}

function sendFile(res, file, type) {
  try {
    const bytes = fs.readFileSync(file)
    const headers = {
      'Content-Type': type,
      'Cache-Control': 'no-store',
      'Content-Length': String(bytes.length),
    }
    if (type && type.startsWith('text/html')) {
      headers['Content-Security-Policy'] = "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: http://127.0.0.1:*;"
    }
    res.writeHead(200, headers)
    res.end(bytes)
  } catch {
    res.writeHead(404)
    res.end('Not found')
  }
}

function routeMatches(route, pathname) {
  return route && route.kind === 'exact' && route.path === pathname
}

function serveRoute(req, res, pathname) {
  const route = routes.find((candidate) => routeMatches(candidate, pathname))
  if (!route || typeof route.handler !== 'function') return false
  Promise.resolve(route.handler(req, res)).catch((error) => {
    if (!res.writableEnded) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end(String(error && error.message ? error.message : error))
    }
  })
  return true
}

const server = http.createServer((req, res) => {
  let url
  try { url = new URL(req.url || '/', 'http://' + (req.headers.host || '127.0.0.1')) } catch {
    res.writeHead(400)
    res.end('Bad request')
    return
  }

  if (url.pathname === '/' || url.pathname === '/index.html') {
    // If the DSHW_OVERLAY env flag is set (Electron mode), serve overlay.html instead
    const htmlFile = process.env.DSHW_OVERLAY === '1' ? 'overlay.html' : 'index.html'
    sendFile(res, path.join(ROOT, htmlFile), 'text/html; charset=utf-8')
    return
  }
  if (serveRoute(req, res, url.pathname)) return
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
  res.end('Not found')
})

const requestedPort = Number(process.env.DSHW_PORT || 0)
server.listen(requestedPort, '127.0.0.1', () => {
  const address = server.address()
  const port = address && typeof address === 'object' ? address.port : requestedPort
  process.stdout.write(JSON.stringify({ ok: true, port, dataDir: process.env.DSH_HOME }) + '\n')
})

function shutdown() {
  for (const dispose of disposers.splice(0)) {
    try { dispose() } catch {}
  }
  server.close(() => process.exit(0))
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

