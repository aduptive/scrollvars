#!/usr/bin/env node
/**
 * The install half of the isolated-installation gate (installed-gate.mjs).
 *
 * For every effect in demo/fx/registry.json that ships previewProps it runs
 * the REAL CLI (`node bin/scrollvars.mjs add <slug> --dir .`, with
 * SCROLLVARS_REGISTRY pointed at the committed registry file) into a fresh
 * temp dir, reads back the file the CLI wrote, compiles it against the built
 * dist and renders it with the effect's own previewProps. Compile and render
 * are scripts/fx-render.mjs, the same path the gallery previews use: one
 * render path, not a second one drifting.
 *
 * It prints one JSON payload on stdout:
 *
 *   { react, effects: [{ slug, file, styles, min, markup, previewScript }] }
 *
 * Run it plain for the React the repo installs, and once more through
 * `node --import ../../../scripts/react18-register.mjs` for the isolated
 * React 18: the two payloads are what installed-gate.mjs loads into a real
 * browser, so a component's embedded CSS is proven under both majors and not
 * only under the one that generated demo/fx.
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { version as reactVersion } from 'react'
import { EFFECTS } from '../../../scripts/fx-data.mjs'
import { loadComponent, renderStatic } from '../../../scripts/fx-render.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const registryPath = join(root, 'demo', 'fx', 'registry.json')
const registry = JSON.parse(readFileSync(registryPath, 'utf8'))
// previewProps is the single props source for a Section (the gallery preview
// uses the same object); an effect without one is not renderable here.
const byProps = new Map(EFFECTS.filter((fx) => fx.previewProps).map((fx) => [fx.slug, fx]))

const effects = []
for (const entry of registry.effects) {
  const fx = byProps.get(entry.slug)
  if (!fx) continue
  const dir = mkdtempSync(join(tmpdir(), `sv-install-${entry.slug}-`))
  execFileSync(process.execPath, [join(root, 'bin', 'scrollvars.mjs'), 'add', entry.slug, '--dir', '.'], {
    cwd: dir,
    env: { ...process.env, SCROLLVARS_REGISTRY: registryPath },
    stdio: ['ignore', 'ignore', 'inherit'],
  })
  // what a consumer now has on disk, byte for byte: never COMPONENTS[slug]
  const content = readFileSync(join(dir, entry.file), 'utf8')
  const Component = await loadComponent(entry.slug, { file: entry.file, content })
  effects.push({
    slug: entry.slug,
    file: entry.file,
    styles: entry.requires?.styles ?? [],
    min: entry.requires?.min ?? null,
    markup: renderStatic(Component, fx.previewProps),
    // the attach script the gallery page carries for a component that attaches
    // through a client hook: static markup never hydrates, so this stands in
    previewScript: fx.previewScript ?? '',
  })
}
process.stdout.write(JSON.stringify({ react: reactVersion, effects }))
