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
const ALIASES = ['scrollvars.dev', 'scrollvars.vercel.app'] // primary first

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
    const res = await fetch(`https://${alias}/?deploy=${process.pid}`, { redirect: 'follow' })
    const body = await res.text()
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`)
    if (!body.includes('demo driver (this page')) throw new Error('content marker missing')
    console.log(`verified ${alias}: HTTP 200 + content marker`)
  } catch (err) {
    if (alias === 'scrollvars.vercel.app') throw new Error(`alias check failed for ${alias}: ${err.message}`)
    console.warn(`warning: ${alias} not verifiable yet (${err.message}) — DNS may still be propagating`)
  }
}
