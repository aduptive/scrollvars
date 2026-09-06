#!/usr/bin/env node
// Installs react@18, react-dom@18 and their @types into an isolated
// directory (node_modules/.cache/react18), never the root: `--no-save` plus
// a throwaway package.json in that directory keep the root package.json and
// package-lock.json untouched, so this can run before every
// `npm run test:react18` without ever risking lockfile drift.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { REACT18_ROOT } from './react18-paths.mjs'

mkdirSync(REACT18_ROOT, { recursive: true })
if (!existsSync(join(REACT18_ROOT, 'package.json'))) {
  writeFileSync(join(REACT18_ROOT, 'package.json'), '{\n  "name": "sv-react18",\n  "private": true\n}\n')
}
execFileSync(
  'npm',
  ['install', '--no-save', '--no-audit', '--no-fund', 'react@18', 'react-dom@18', '@types/react@18', '@types/react-dom@18'],
  { cwd: REACT18_ROOT, stdio: 'inherit' }
)
