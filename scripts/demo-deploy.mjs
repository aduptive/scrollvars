#!/usr/bin/env node
/**
 * Deploys demo/ to Vercel production and re-points the public alias —
 * the alias does NOT follow deploys on its own; forgetting this step was
 * a recurring manual chore. Chain: npm run demo:deploy
 */
import { execSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const demoDir = join(root, 'demo')
const SCOPE = 'aduptives-projects'
const ALIASES = ['scrollvars.dev', 'scrollvars.vercel.app', 'www.scrollvars.dev'] // primary first; the others 308 to it

const run = (cmd) => execSync(cmd, { cwd: demoDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })

console.log('deploying…')
const out = run(`vercel deploy --prod --yes --scope ${SCOPE}`)
const url = out.match(/https:\/\/[a-z0-9-]+-aduptives-projects\.vercel\.app/)?.[0]
if (!url) throw new Error('could not parse deployment URL from vercel output:\n' + out)
console.log('deployed', url)

for (const alias of ALIASES) {
  run(`vercel alias set ${url} ${alias} --scope ${SCOPE}`)
  console.log(`alias → https://${alias}`)
}

// verify the aliases actually serve the new deployment (the .vercel.app one
// is the hard gate; the apex can lag on DNS in its first hours)
for (const alias of ALIASES) {
  try {
    // the alias can take a few seconds to point at the new deployment
    let res
    for (let attempt = 1; ; attempt++) {
      try {
        res = await fetch(`https://${alias}/?deploy=${process.pid}-${attempt}`, { redirect: 'follow' })
        const settled = alias === ALIASES[0] ? res.ok : new URL(res.url).host === ALIASES[0]
        if (settled) break
      } catch (fetchErr) {
        if (attempt >= 6) throw fetchErr // transient TLS/DNS hiccups right after aliasing
      }
      if (attempt >= 6) break
      await new Promise((r) => setTimeout(r, 3000))
    }
    const body = await res.text()
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`)
    if (!body.includes('demo driver (page wiring only')) throw new Error('content marker missing')
    // secondary hosts must 308 to the primary (demo/vercel.json redirects)
    if (alias !== ALIASES[0] && new URL(res.url).host !== ALIASES[0])
      throw new Error(`${alias} did not redirect to ${ALIASES[0]} (landed on ${res.url})`)
    console.log(`verified ${alias}: HTTP 200 + content marker${alias === ALIASES[0] ? '' : ' via redirect'}`)
  } catch (err) {
    if (alias === 'scrollvars.vercel.app') throw new Error(`alias check failed for ${alias}: ${err.message}`)
    console.warn(`warning: ${alias} not verifiable yet (${err.message}) — DNS may still be propagating`)
  }
}
