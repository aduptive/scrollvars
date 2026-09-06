#!/usr/bin/env node
// Type-checks the React layer (src/react, plus whatever it pulls in from
// src/core and src/canvas) against the isolated React 18 @types instead of
// the root's React 19 ones, proving the same source satisfies both majors'
// types. TypeScript 7 in this repo has no `baseUrl`, so the redirect is a
// `paths` entry, relative to this generated tsconfig's own folder, pointing
// `react` / `react/jsx-runtime` / `react/jsx-dev-runtime` straight at the
// React 18 install's @types files.
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { REACT18_ROOT, REACT18_MODULES } from './react18-paths.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const configDir = join(REACT18_ROOT, 'tsc')
mkdirSync(configDir, { recursive: true })

const rel = (p) => relative(configDir, p).split(sep).join('/')
const typesReact = join(REACT18_MODULES, '@types', 'react')

// Canary: useRef<T>(null) returns a read-only RefObject under React 18's
// types, a mutable one under React 19's. `@ts-expect-error` flips the
// direction of the proof: it is itself an error ("unused directive") if the
// following line does NOT fail, so this file stays green only when the
// paths redirect below is genuinely serving React 18 types, and turns the
// whole tsc run red if it silently fell back to the root's React 19 ones.
writeFileSync(
  join(configDir, 'canary.ts'),
  `import { useRef } from 'react'\nconst ref = useRef<number>(null)\n// @ts-expect-error react18-tsc: proves React 18 types are really loaded (readonly current)\nref.current = 5\n`
)

writeFileSync(
  join(configDir, 'tsconfig.json'),
  JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2020',
        lib: ['DOM', 'ESNext'],
        module: 'ESNext',
        moduleResolution: 'Bundler',
        jsx: 'react-jsx',
        strict: true,
        skipLibCheck: true,
        noEmit: true,
        paths: {
          react: [rel(join(typesReact, 'index.d.ts'))],
          'react/jsx-runtime': [rel(join(typesReact, 'jsx-runtime.d.ts'))],
          'react/jsx-dev-runtime': [rel(join(typesReact, 'jsx-dev-runtime.d.ts'))],
        },
      },
      include: [rel(join(root, 'src')) + '/**/*', 'canary.ts'],
    },
    null,
    2
  )
)

try {
  execFileSync(join(root, 'node_modules', '.bin', 'tsc'), ['--project', 'tsconfig.json'], {
    cwd: configDir,
    stdio: 'inherit',
  })
} catch {
  console.error('react18-tsc: src/react fails to type-check under React 18 types')
  process.exit(1)
}
console.log('react18-tsc: src type-checks under React 18 types')
