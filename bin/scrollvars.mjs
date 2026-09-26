#!/usr/bin/env node
/**
 * ScrollVars CLI, shadcn-style effect installer.
 *
 *   npx scrollvars list                       show available effects
 *   npx scrollvars add coverflow-slider       write the component into ./components/fx
 *   npx scrollvars add marquee --dir src/ui   choose the folder
 *   … --force                                 overwrite an existing file
 *
 * The CLI is dumb on purpose: it fetches the registry from the fx site, so
 * the effect library grows without republishing this package.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { homedir } from 'node:os'

// An explicit override (a private registry) must never fall through to the
// public one on error: that would silently install a public component under
// the slug a private registry meant to replace. The fallback is only for
// the DEFAULT host going down, so it is gated on whether the env var was
// actually set, not on what REGISTRY happens to equal.
const REGISTRY_OVERRIDE = process.env.SCROLLVARS_REGISTRY
const REGISTRY = REGISTRY_OVERRIDE || 'https://scrollvars.dev/fx/registry.json'
// an independent host: the committed copy on GitHub (scrollvars.vercel.app only redirects to scrollvars.dev)
const REGISTRY_FALLBACK = 'https://raw.githubusercontent.com/aduptive/scrollvars/main/demo/fx/registry.json'

const args = process.argv.slice(2)
const flags = new Set(args.filter((a) => a.startsWith('--')))
const dirFlag = args.indexOf('--dir')
const dir = dirFlag >= 0 ? args[dirFlag + 1] : 'components/fx'
if (dirFlag >= 0 && (!dir || dir.startsWith('--'))) {
  console.error('--dir needs a folder, e.g. --dir src/components/fx')
  process.exit(1)
}
// a flag's value (`--dir src/ui`) is not a positional: `add --dir src/ui marquee` works
const positional = args.filter((a, i) => !a.startsWith('--') && !(dirFlag >= 0 && i === dirFlag + 1))
const [command, slug] = positional

function installedVersion() {
  try {
    return JSON.parse(readFileSync(join(process.cwd(), 'node_modules', 'scrollvars', 'package.json'), 'utf8')).version
  } catch {
    return null
  }
}
function olderThan(a, b) {
  const parse = value => /^(\d+)\.(\d+)\.(\d+)(?:-([\w.-]+))?(?:\+[\w.-]+)?$/.exec(value)
  const pa = parse(a), pb = parse(b)
  if (!pa || !pb) return false
  for (let i = 1; i <= 3; i++) if (Number(pa[i]) !== Number(pb[i])) return Number(pa[i]) < Number(pb[i])
  if (!pa[4] || !pb[4]) return !!pa[4] && !pb[4]
  const preA = pa[4].split('.'), preB = pb[4].split('.')
  for (let i = 0; i < Math.max(preA.length, preB.length); i++) {
    if (preA[i] === preB[i]) continue
    if (preA[i] === undefined || preB[i] === undefined) return preA[i] === undefined
    const numA = /^\d+$/.test(preA[i]), numB = /^\d+$/.test(preB[i])
    if (numA !== numB) return numA
    return numA ? Number(preA[i]) < Number(preB[i]) : preA[i] < preB[i]
  }
  return false
}

async function loadRegistry() {
  if (REGISTRY.startsWith('/') || REGISTRY.startsWith('.')) {
    return JSON.parse(readFileSync(REGISTRY, 'utf8'))
  }
  try {
    const res = await fetch(REGISTRY)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (err) {
    // SCROLLVARS_REGISTRY set: this IS a private registry, so its failure is
    // the whole story. Falling back to the public one here would write a
    // public component under the same slug a private registry meant to own.
    if (REGISTRY_OVERRIDE) throw new Error(`SCROLLVARS_REGISTRY (${REGISTRY_OVERRIDE}) failed: ${err.message}`)
    const res = await fetch(REGISTRY_FALLBACK)
    if (!res.ok) throw new Error(`registry fetch failed on both hosts: ${err.message} / HTTP ${res.status}`)
    return res.json()
  }
}

function usage() {
  console.log(`ScrollVars fx installer

  npx scrollvars list
  npx scrollvars add <effect> [--dir components/fx] [--force]
  npx scrollvars skill [--global] [--force]

Gallery: https://scrollvars.dev/fx/`)
}

// The skill this package ships (files: ["skills", ...] in package.json),
// read from THIS installed copy, never fetched: the installed version's
// skill always matches the installed library. Codex reads project skills
// from .agents/skills (scanned from CWD up to the repo root) and user
// skills from ~/.agents/skills; Claude Code reads project skills from
// .claude/skills and user skills from ~/.claude/skills. Verified against
// https://developers.openai.com/codex/build-skills ("Where Codex loads
// local skills") on 2026-09-25.
function installSkill() {
  const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
  const source = readFileSync(join(packageRoot, 'skills', 'scrollvars', 'SKILL.md'), 'utf8')
  const base = flags.has('--global') ? homedir() : process.cwd()
  const targets = [join(base, '.claude', 'skills', 'scrollvars', 'SKILL.md'), join(base, '.agents', 'skills', 'scrollvars', 'SKILL.md')]
  let failed = false
  for (const target of targets) {
    if (existsSync(target)) {
      const current = readFileSync(target, 'utf8')
      if (current === source) {
        console.log(`= ${target} (already up to date)`)
        continue
      }
      if (!flags.has('--force')) {
        console.error(`${target} exists and differs from the shipped skill. Pass --force to overwrite`)
        failed = true
        continue
      }
    }
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, source)
    console.log(`✓ ${target}`)
  }
  if (failed) process.exit(1)
}

if (command === 'skill') {
  installSkill()
  process.exit(0)
}

// only the commands that need the registry pay for the network round trip:
// `add` with no slug prints usage below, and must do that even offline
// (ADU-354 item 13), not fail on a registry it never needed.
const registry = command === 'list' || (command === 'add' && slug)
  ? await loadRegistry().catch((e) => {
      console.error('could not load the effect registry:', e.message)
      process.exit(1)
    })
  : null

if (command === 'list') {
  const width = Math.max(...registry.effects.map((e) => e.slug.length))
  for (const e of registry.effects) {
    console.log(`  ${e.slug.padEnd(width)}  ${e.tagline}`)
  }
  console.log(`\n  npx scrollvars add <slug>   ·   pages: https://scrollvars.dev/fx/`)
} else if (command === 'add' && slug) {
  const effect = registry.effects.find((e) => e.slug === slug)
  if (!effect) {
    console.error(`unknown effect "${slug}". Run \`npx scrollvars list\``)
    process.exit(1)
  }
  // registry data is remote: a filename is a bare name, never a path
  if (!/^[\w.-]+$/.test(effect.file) || effect.file.includes('..')) {
    console.error(`registry entry "${slug}" has an invalid file name: ${effect.file}`)
    process.exit(1)
  }
  // resolve, not join: an absolute --dir must be used as-is, not appended
  // to cwd (join('/a', '/b') is '/a/b', resolve('/a', '/b') is '/b')
  const target = join(resolve(process.cwd(), dir), effect.file)
  if (existsSync(target) && !flags.has('--force')) {
    console.error(`${join(dir, effect.file)} already exists. Pass --force to overwrite`)
    process.exit(1)
  }
  mkdirSync(resolve(process.cwd(), dir), { recursive: true })
  writeFileSync(target, effect.content)
  const req = effect.requires || {}
  const styles = (req.styles || []).map((n) => `import 'scrollvars/styles/${n}.css'`)
  const deps = Object.entries(req.deps || {}).map(([name, range]) => `${name}@"${range}"`)
  const installed = installedVersion()
  const versionNote = !installed
    ? `npm i scrollvars${req.min ? `@^${req.min}` : ''}`
    : req.min && olderThan(installed, req.min)
      ? `scrollvars ${installed} is installed; this effect needs ${req.min}+ (npm i scrollvars@latest)`
      : `scrollvars ${installed} ok${req.min ? ` (needs ${req.min}+)` : ''}`
  console.log(`✓ ${join(dir, effect.file)}

requires:
  ${versionNote}${deps.length ? `\n  npm i ${deps.join(' ')}` : ''}
  ${styles.length ? styles.join('\n  ') : '(no stylesheet)'}   in the root layout
  <ScrollVarsBoot /> once, first child of <body> (scrollvars/react)${req.tailwind ? '\n  Tailwind utilities: required (or ship your own CSS)' : ''}

docs for this effect: ${effect.page}`)
} else {
  usage()
  process.exit(command ? 1 : 0)
}
