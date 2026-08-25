#!/usr/bin/env node
/**
 * scrollvars CLI — shadcn-style effect installer.
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

const REGISTRY = process.env.SCROLLVARS_REGISTRY || 'https://scrollvars.vercel.app/fx/registry.json'

const args = process.argv.slice(2)
const flags = new Set(args.filter((a) => a.startsWith('--')))
const positional = args.filter((a) => !a.startsWith('--'))
const dirFlag = args.indexOf('--dir')
const dir = dirFlag >= 0 ? args[dirFlag + 1] : 'components/fx'
const [command, slug] = positional

async function loadRegistry() {
  if (REGISTRY.startsWith('/') || REGISTRY.startsWith('.')) {
    return JSON.parse(readFileSync(REGISTRY, 'utf8'))
  }
  const res = await fetch(REGISTRY)
  if (!res.ok) throw new Error(`registry fetch failed: HTTP ${res.status}`)
  return res.json()
}

function usage() {
  console.log(`scrollvars fx installer

  npx scrollvars list
  npx scrollvars add <effect> [--dir components/fx] [--force]

Gallery: https://scrollvars.vercel.app/fx/`)
}

const registry = await loadRegistry().catch((e) => {
  console.error('could not load the effect registry:', e.message)
  process.exit(1)
})

if (command === 'list') {
  const width = Math.max(...registry.effects.map((e) => e.slug.length))
  for (const e of registry.effects) {
    console.log(`  ${e.slug.padEnd(width)}  ${e.tagline}`)
  }
  console.log(`\n  npx scrollvars add <slug>   ·   pages: https://scrollvars.vercel.app/fx/`)
} else if (command === 'add' && slug) {
  const effect = registry.effects.find((e) => e.slug === slug)
  if (!effect) {
    console.error(`unknown effect "${slug}" — run \`npx scrollvars list\``)
    process.exit(1)
  }
  const target = join(process.cwd(), dir, effect.file)
  if (existsSync(target) && !flags.has('--force')) {
    console.error(`${join(dir, effect.file)} already exists — pass --force to overwrite`)
    process.exit(1)
  }
  mkdirSync(join(process.cwd(), dir), { recursive: true })
  writeFileSync(target, effect.content)
  console.log(`✓ ${join(dir, effect.file)}

next steps:
  1. npm i scrollvars            (if you haven't)
  2. import the stylesheet noted at the top of the file (root layout)
  3. add <ScrollVarsBoot /> once in your layout (scrollvars/react)

docs for this effect: ${effect.page}`)
} else {
  usage()
  process.exit(command ? 1 : 0)
}
