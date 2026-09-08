#!/usr/bin/env node
/**
 * Deploys demo/ to Vercel production and re-points the public alias —
 * the alias does NOT follow deploys on its own; forgetting this step was
 * a recurring manual chore. Chain: npm run demo:deploy
 */
import { execSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const demoDir = join(root, 'demo')
const SCOPE = 'aduptives-projects'
// primary first; scrollvars.vercel.app 308s to it via demo/vercel.json. NEVER alias www here:
// aliasing www to a deployment makes Vercel flip the apex into a redirect to www (a loop with
// the domain-level www → apex redirect). www is a domain redirect in Vercel, not an alias.
const ALIASES = ['scrollvars.dev', 'scrollvars.vercel.app']

const run = (cmd) => execSync(cmd, { cwd: demoDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })

console.log('deploying…')
const deploymentId = randomUUID()
writeFileSync(join(demoDir, 'deploy-id.txt'), deploymentId)
const out = run(`vercel deploy --prod --yes --scope ${SCOPE}`)
const url = out.match(/https:\/\/[a-z0-9-]+-aduptives-projects\.vercel\.app/)?.[0]
if (!url) throw new Error('could not parse deployment URL from vercel output:\n' + out)
console.log('deployed', url)

for (const alias of ALIASES) {
  run(`vercel alias set ${url} ${alias} --scope ${SCOPE}`)
  console.log(`alias → https://${alias}`)
}

// A fresh identifier prevents an old, otherwise healthy deployment passing.
for (const alias of ALIASES) {
  try {
    // the alias can take a few seconds to point at the new deployment
    let res
    for (let attempt = 1; ; attempt++) {
      try {
        res = await fetch(`https://${alias}/deploy-id.txt?deploy=${deploymentId}-${attempt}`, { redirect: 'follow' })
        const body = await res.text()
        const settled = res.ok && body === deploymentId && new URL(res.url).host === ALIASES[0]
        if (settled) break
        if (attempt >= 6) throw new Error('alias still serves a different deployment')
      } catch (fetchErr) {
        if (attempt >= 6) throw fetchErr // transient TLS/DNS hiccups right after aliasing
      }
      if (attempt >= 6) break
      await new Promise((r) => setTimeout(r, 3000))
    }
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`)
    // secondary hosts must 308 to the primary (demo/vercel.json redirects)
    if (alias !== ALIASES[0] && new URL(res.url).host !== ALIASES[0])
      throw new Error(`${alias} did not redirect to ${ALIASES[0]} (landed on ${res.url})`)
    console.log(`verified ${alias}: deployment ${deploymentId}${alias === ALIASES[0] ? '' : ' via redirect'}`)
  } catch (err) {
    throw new Error(`alias check failed for ${alias}: ${err.message}`)
  }
}
