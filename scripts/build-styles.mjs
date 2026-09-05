#!/usr/bin/env node
// styles.css is GENERATED: the aggregate of styles/*.css, kept for
// backwards compatibility. Edit the parts, never the aggregate.
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const PARTS = ['core.css', 'pin.css', 'slider.css', 'tilt.css', 'state.css', 'ui.css']
const banner =
  '/* ScrollVars — AGGREGATE stylesheet (generated from styles/*.css by\n' +
  ' * scripts/build-styles.mjs — edit the parts, not this file).\n' +
  ' * Modular imports ship less: styles/core.css alone covers entrances. */\n\n'
const body = PARTS.map((p) => readFileSync(join(root, 'styles', p), 'utf8')).join('\n')
writeFileSync(join(root, 'styles.css'), banner + body)
console.log('styles.css regenerated from', PARTS.join(', '))
