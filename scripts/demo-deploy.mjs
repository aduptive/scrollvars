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
const ALIAS = 'scrollvars.vercel.app'

const run = (cmd) => execSync(cmd, { cwd: demoDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })

console.log('deploying…')
const out = run(`vercel deploy --prod --yes --scope ${SCOPE}`)
const url = out.match(/https:\/\/demo-[a-z0-9]+-aduptives-projects\.vercel\.app/)?.[0]
if (!url) throw new Error('could not parse deployment URL from vercel output:\n' + out)
console.log('deployed', url)

run(`vercel alias set ${url} ${ALIAS} --scope ${SCOPE}`)
console.log(`alias → https://${ALIAS}`)

// verify the alias actually serves the new deployment
const res = await fetch(`https://${ALIAS}/?deploy=${process.pid}`, { redirect: 'follow' })
const body = await res.text()
if (res.status !== 200) throw new Error(`alias check failed: HTTP ${res.status}`)
if (!body.includes('scrollvars core')) throw new Error('alias check failed: content marker missing')
console.log('verified: HTTP 200 + content marker')
