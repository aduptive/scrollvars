// Compare the actual public responses with this checkout's generated release files.
import { readFile } from 'node:fs/promises'

const base = new URL(process.argv[2] ?? 'https://scrollvars.dev/')
const demo = new URL('../demo/', import.meta.url)
const sitemap = await readFile(new URL('sitemap.xml', demo), 'utf8')
const routes = new Set(['/sitemap.xml', '/docs/', '/llms.txt', '/a11y/', '/fx/llms.txt', '/fx/registry.json'])
for (const [, location] of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
  routes.add(new URL(location).pathname)
}
for (const route of routes) {
  const file = route.slice(1) + (route.endsWith('/') ? 'index.html' : '')
  const expected = await readFile(new URL(file, demo))
  const response = await fetch(new URL(route, base), {
    redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(30000),
  })
  if (!response.ok || !expected.equals(Buffer.from(await response.arrayBuffer()))) {
    throw new Error(`Published ${route} differs from demo/${file} (HTTP ${response.status}). Deploy this release's docs and retry.`)
  }
  console.log(`Verified ${route}`)
}
