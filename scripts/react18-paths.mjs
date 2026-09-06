// Shared location for the isolated React 18 install used by
// `npm run test:react18` and the CI `test-react-18` job. Lives under
// `node_modules/.cache` so it is always gitignored and never touches the
// root package.json / package-lock.json (those stay pinned to React 19).
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
export const REACT18_ROOT = join(root, 'node_modules', '.cache', 'react18')
export const REACT18_MODULES = join(REACT18_ROOT, 'node_modules')

// The `paths` entries a generated tsconfig needs to redirect `react` /
// `react/jsx-runtime` / `react/jsx-dev-runtime` to the isolated React 18
// install's @types instead of the root's React 19 ones. TypeScript 7 has no
// `baseUrl`, so every entry is relative to `configDir` (the folder the
// generated tsconfig.json itself lives in). Shared by react18-tsc.mjs (checks
// src/) and the cli-components tsc gate (checks the installed fixtures)
// so both redirects come from one source instead of two copies drifting.
export function react18TypesPaths(configDir) {
  const typesReact = join(REACT18_MODULES, '@types', 'react')
  const rel = (p) => relative(configDir, p).split(sep).join('/')
  return {
    react: [rel(join(typesReact, 'index.d.ts'))],
    'react/jsx-runtime': [rel(join(typesReact, 'jsx-runtime.d.ts'))],
    'react/jsx-dev-runtime': [rel(join(typesReact, 'jsx-dev-runtime.d.ts'))],
  }
}

// Canary: useRef<T>(null) returns a read-only RefObject under React 18's
// types, a mutable one under React 19's. `@ts-expect-error` flips the
// direction of the proof: it is itself an error ("unused directive") if the
// following line does NOT fail, so a tsc run stays green only when the
// paths redirect above is genuinely serving React 18 types, and goes red if
// it silently fell back to the root's React 19 ones.
export const REACT18_CANARY = `import { useRef } from 'react'\nconst ref = useRef<number>(null)\n// @ts-expect-error react18-tsc: proves React 18 types are really loaded (readonly current)\nref.current = 5\n`
