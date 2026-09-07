// Entry point for `node --import ./scripts/react18-register.mjs`: registers
// the resolve hook in react18-hooks.mjs before anything else loads, so every
// later `import 'react'` / `import 'react-dom/...'` in this process (test
// files, the built dist, esbuild-bundled CLI fixtures) resolves against the
// isolated React 18 install instead of the root's React 19.
//
// Also sets SV_REACT18_DIR: the runtime redirect above only covers module
// resolution inside THIS process. test/cli-components.test.mjs spawns tsc as
// a subprocess to type-check the installed fixtures, and a subprocess never
// sees a --import hook of its parent, so it needs its own signal to redirect
// react's @types the same way; SV_REACT18_DIR is that signal (its value is
// read straight from react18-paths.mjs, never duplicated).
import { register } from 'node:module'
import { REACT18_ROOT } from './react18-paths.mjs'

process.env.SV_REACT18_DIR = REACT18_ROOT
register('./react18-hooks.mjs', import.meta.url)
