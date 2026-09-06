// Entry point for `node --import ./scripts/react18-register.mjs`: registers
// the resolve hook in react18-hooks.mjs before anything else loads, so every
// later `import 'react'` / `import 'react-dom/...'` in this process (test
// files, the built dist, esbuild-bundled CLI fixtures) resolves against the
// isolated React 18 install instead of the root's React 19.
import { register } from 'node:module'

register('./react18-hooks.mjs', import.meta.url)
