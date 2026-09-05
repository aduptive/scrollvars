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
import { join } from 'node:path'

const REGISTRY = process.env.SCROLLVARS_REGISTRY || 'https://scrollvars.dev/fx/registry.json'
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
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) < (pb[i] || 0)
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
    if (REGISTRY === REGISTRY_FALLBACK) throw err
    const res = await fetch(REGISTRY_FALLBACK)
    if (!res.ok) throw new Error(`registry fetch failed on both hosts: ${err.message} / HTTP ${res.status}`)
    return res.json()
  }
}

function usage() {
  console.log(`ScrollVars fx installer

  npx scrollvars list
  npx scrollvars add <effect> [--dir components/fx] [--force]

Gallery: https://scrollvars.dev/fx/`)
}

// only the commands that need the registry pay for the network round trip
const registry = command !== 'list' && command !== 'add' ? null : await loadRegistry().catch((e) => {
  console.error('could not load the effect registry:', e.message)
  process.exit(1)
})

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
  const target = join(process.cwd(), dir, effect.file)
  if (existsSync(target) && !flags.has('--force')) {
    console.error(`${join(dir, effect.file)} already exists. Pass --force to overwrite`)
    process.exit(1)
  }
  mkdirSync(join(process.cwd(), dir), { recursive: true })
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
  <ScrollVarsBoot /> once, first child of <body> (scrollvars/react)

docs for this effect: ${effect.page}`)
} else {
  usage()
  process.exit(command ? 1 : 0)
}
