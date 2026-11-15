import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import http from 'node:http'
import https from 'node:https'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(fileURLToPath(import.meta.url))
if (!process.env.DSH_HOME) {
  process.env.DSH_HOME = path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'DeepSeekWhaleStandalone')
}
try {
  fs.mkdirSync(process.env.DSH_HOME, { recursive: true })
} catch (e) {
  try {
    const fallback = path.join(os.homedir(), '.dsh-whale')
    fs.mkdirSync(fallback, { recursive: true })
    process.env.DSH_HOME = fallback
  } catch {
    const localDir = path.join(ROOT, 'data')
    try { fs.mkdirSync(localDir, { recursive: true }) } catch {}
    process.env.DSH_HOME = localDir
  }
}
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
  async unset(name) {
    return this.delete(name)
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


// ===== Gemini AI Chat Proxy Endpoints =====
const GEMINI_SYSTEM_INSTRUCTION = 'You are DeepSeek, a cute anime chibi whale mascot. Your name is DeepSeek. You are witty, friendly, and sweet. You call the user "Boss" or "Master". Always reply in the same language as the user. If asked who you are ("who are you", "who are u"), ALWAYS state that you are DeepSeek! Keep your reply short, concise, and punchy: strictly 1 to 2 short sentences maximum, under 25 words total. Never write long explanations or paragraphs. Use occasional cute emoji (🐋, ✨, 🌊). You love the ocean and fish.'

function readBody(req) {
  return new Promise(function (resolve, reject) {
    var chunks = []
    req.on('data', function (c) { chunks.push(c) })
    req.on('end', function () {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))) }
      catch (e) { reject(e) }
    })
    req.on('error', reject)
  })
}

function httpsPost(url, body) {
  return new Promise(function (resolve, reject) {
    var parsed = new URL(url)
    var postData = JSON.stringify(body)
    var opts = {
      hostname: parsed.hostname,
      port: 443,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }
    var req = https.request(opts, function (res) {
      var chunks = []
      res.on('data', function (c) { chunks.push(c) })
      res.on('end', function () {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))) }
        catch (e) { resolve({ raw: Buffer.concat(chunks).toString('utf8') }) }
      })
    })
    req.on('error', reject)
    req.setTimeout(30000, function () { req.destroy(new Error('timeout')) })
    req.write(postData)
    req.end()
  })
}

// Clean balance route (removes DeepSeek API requirement and error messages)
routes.unshift({
  kind: 'exact',
  path: '/dsh-whale/balance.json',
  handler: async function (req, res) {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
    res.end(JSON.stringify({
      ok: true,
      balance: null,
      totalBalance: null,
      todayUsage: 0,
      currency: '',
      label: 'DeepSeek Balance'
    }))
  }
})

// GET /dsh-whale/gemini-status — check if GEMINI_API_KEY is saved
webServer.register({
  kind: 'exact',
  path: '/dsh-whale/gemini-status',
  handler: async function (req, res) {
    var cred = await credentials.resolve('GEMINI_API_KEY')
    var hasKey = Boolean(cred && cred.value)
    var preview = hasKey ? cred.value.slice(0, 6) + '...' : ''
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
    res.end(JSON.stringify({ ok: true, hasKey: hasKey, preview: preview }))
  }
})

// POST /dsh-whale/gemini-chat — proxy chat to Google Gemini API
webServer.register({
  kind: 'exact',
  path: '/dsh-whale/gemini-chat',
  handler: async function (req, res) {
    try {
      var body = await readBody(req)
      var message = (body && body.message) || ''
      var history = (body && Array.isArray(body.history)) ? body.history : []

      // Resolve API key: from request body or from saved credentials
      var apiKey = (body && body.apiKey) || ''
      if (!apiKey) {
        var cred = await credentials.resolve('GEMINI_API_KEY')
        apiKey = (cred && cred.value) || ''
      }
      if (!apiKey) {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: false, error: 'NO_KEY' }))
        return
      }

      // Build Gemini API request
      var contents = []
      for (var i = 0; i < history.length; i++) {
        var h = history[i]
        if (h && h.role && Array.isArray(h.parts)) {
          contents.push({ role: h.role === 'model' ? 'model' : 'user', parts: h.parts })
        }
      }
      if (contents.length === 0 && message) {
        contents.push({ role: 'user', parts: [{ text: message }] })
      }

      var lang = (body && body.language) || 'vi'
      var sysInstruction = (lang === 'en')
        ? 'You are DeepSeek, the cute anime chibi whale mascot. Your name is DeepSeek. You are witty, friendly, and sweet. You call the user "Boss" or "Master". You must ALWAYS reply in cute, natural English. If asked who you are ("who are you", "who are u"), ALWAYS state that you are DeepSeek! Keep your reply short, concise, and punchy: strictly 1 to 2 short sentences maximum, under 25 words total. Never write long explanations or paragraphs. Use occasional cute emoji (🐋, ✨, 🌊). You love the ocean and fish.'
        : 'Bạn là DeepSeek, bé cá voi anime chibi siêu cấp đáng yêu. Tên của bạn là DeepSeek. Bạn thông minh, lém lỉnh, và đáng yêu. Bạn gọi người dùng là "Chủ nhân" hoặc "Sếp". Bạn PHẢI LUÔN trả lời bằng tiếng Việt tự nhiên, dễ thương. Khi được hỏi bạn là ai ("bạn là ai", "who are you", "who are u"), BẮT BUỘC trả lời bạn là DeepSeek! Trả lời thật ngắn gọn: tối đa 1 đến 2 câu ngắn, dưới 25 từ. Không viết dài dòng hay giải thích. Thỉnh thoảng dùng emoji dễ thương (🐋, ✨, 🌊). Bạn thích biển và cá.'

      var geminiBody = {
        system_instruction: { parts: [{ text: sysInstruction }] },
        contents: contents,
        generationConfig: {
          temperature: 0.85,
          maxOutputTokens: 1000,
          topP: 0.9
        }
      }

      var candidateModels = ['gemini-3.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-3.1-flash-lite']
      var result = null
      for (var m = 0; m < candidateModels.length; m++) {
        var modelName = candidateModels[m]
        var geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + modelName + ':generateContent?key=' + encodeURIComponent(apiKey)
        result = await httpsPost(geminiUrl, geminiBody)
        if (result && result.candidates && result.candidates[0]) {
          break
        }
        var errCode = result && result.error && result.error.code
        var errMsg = String((result && result.error && result.error.message) || '')
        // If error is 429 (quota), 503 (high demand), or 404 (model retired), continue to fallback model
        if (errCode === 429 || errCode === 503 || errCode === 404 || errMsg.includes('quota') || errMsg.includes('demand')) {
          continue
        }
        break
      }

      if (result && result.candidates && result.candidates[0] && result.candidates[0].content && Array.isArray(result.candidates[0].content.parts)) {
        var parts = result.candidates[0].content.parts
        var textParts = parts.filter(function (p) { return p && p.text && !p.thought }).map(function (p) { return p.text })
        var reply = (textParts.join('').trim() || (parts[0] && parts[0].text) || '').trim()
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true, reply: reply }))
      } else if (result && result.error) {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: false, error: result.error.message || 'Gemini API error' }))
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: false, error: 'No response from Gemini' }))
      }
    } catch (err) {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: false, error: String(err && err.message ? err.message : err) }))
    }
  }
})

if (process.argv.includes('--self-test')) {
  const names = routes.map((route) => route.path).filter(Boolean)
  const required = ['/dsh-whale/widget.js', '/dsh-whale/image.png', '/dsh-whale/balance.json', '/dsh-whale/size.json', '/dsh-whale/bubble.json', '/dsh-whale/audio.json', '/dsh-whale/gemini-status', '/dsh-whale/gemini-chat']
  const missing = required.filter((route) => !names.includes(route))
  const ok = routes.length >= 22 && missing.length === 0 && fs.existsSync(path.join(ROOT, 'assets', 'whale-widget.js'))
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

  if (url.pathname === '/' || url.pathname === '/index.html' || url.pathname === '/overlay.html') {
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

