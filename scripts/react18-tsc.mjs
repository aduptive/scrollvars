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
import { REACT18_ROOT, react18TypesPaths, REACT18_CANARY } from './react18-paths.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const configDir = join(REACT18_ROOT, 'tsc')
mkdirSync(configDir, { recursive: true })

const rel = (p) => relative(configDir, p).split(sep).join('/')

writeFileSync(join(configDir, 'canary.ts'), REACT18_CANARY)

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
        paths: react18TypesPaths(configDir),
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
