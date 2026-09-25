#!/usr/bin/env node
// Tiny static server for the perf lab, no dependencies. Serves demo/ (so
// /bench/lab/index.html and /fx/sv.js resolve the same way they do on
// scrollvars.dev), logs every `result?` request into
// demo/bench/lab/results/<browser>-<timestamp>.json, and every `ping?`
// request to stdout as progress.
//
//   node demo/bench/lab/serve.mjs [--port=8080]
//
// Then open http://<this Mac's LAN or Tailscale IP>:8080/bench/lab/ on any
// device on the same network. Plain http: fine for a lab, not for anything else.
import { createServer } from 'node:http'
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, extname, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..', '..') // demo/
const resultsDir = join(here, 'results')
if (!existsSync(resultsDir)) mkdirSync(resultsDir, { recursive: true })

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const eq = a.indexOf('=')
  return eq === -1 ? [a.replace(/^--/, ''), true] : [a.slice(2, eq), a.slice(eq + 1)]
}))
const PORT = +(args.port || 8080)

const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.mjs': 'application/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.gif': 'image/gif' }

// chunked payloads arrive as several GETs sharing an id; reassembled once
// every part has arrived
const pending = new Map()

const browserSlug = (ua = '') => {
  if (/Firefox\//.test(ua)) return 'firefox'
  if (/Edg\//.test(ua)) return 'edge'
  if (/CriOS\//.test(ua)) return 'chrome-ios'
  if (/FxiOS\//.test(ua)) return 'firefox-ios'
  if (/Chrome\//.test(ua)) return 'chrome'
  if (/Version\/.*Safari\//.test(ua)) return 'safari'
  return 'unknown'
}

const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://x')
  const pathname = decodeURIComponent(url.pathname)

  if (pathname === '/bench/lab/ping' || pathname === '/bench/lab/result' && url.searchParams.has('ping')) {
    console.log(`[ping] ${url.search}`)
    res.writeHead(204).end()
    return
  }

  if (pathname === '/bench/lab/result') {
    const id = url.searchParams.get('id')
    const part = url.searchParams.get('part') || '1of1'
    const data = url.searchParams.get('data') || ''
    const [i, n] = part.split('of').map(Number)
    if (!id || !Number.isInteger(i) || !Number.isInteger(n)) { res.writeHead(400).end(); return }
    const entry = pending.get(id) || { parts: new Array(n).fill(''), got: 0, n }
    if (!entry.parts[i - 1]) entry.got++
    entry.parts[i - 1] = data
    pending.set(id, entry)
    if (entry.got === n) {
      pending.delete(id)
      try {
        const payload = JSON.parse(entry.parts.join(''))
        const browser = browserSlug(payload.env?.userAgent)
        const file = join(resultsDir, `${browser}-${id}.json`)
        writeFileSync(file, JSON.stringify(payload, null, 2))
        console.log(`[result] wrote ${file}`)
      } catch (err) {
        console.error(`[result] failed to parse payload ${id}: ${err.message}`)
      }
    }
    res.writeHead(204).end()
    return
  }

  const rel = normalize(pathname.replace(/\/$/, '/index.html')).replace(/^(\.\.[/\\])+/, '')
  const filePath = join(root, rel)
  if (!filePath.startsWith(root)) { res.writeHead(403).end(); return }
  try {
    const body = readFileSync(filePath)
    res.writeHead(200, { 'content-type': TYPES[extname(filePath)] || 'application/octet-stream' })
    res.end(body)
  } catch {
    res.writeHead(404).end('not found')
  }
})

server.listen(PORT, () => {
  console.log(`Perf lab serving demo/ at http://localhost:${PORT}/bench/lab/`)
  console.log(`Results land in ${resultsDir}`)
})
