import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { COMPONENTS } from '../scripts/fx-data.mjs'
import { REACT18_CANARY } from '../scripts/react18-paths.mjs'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const hooks = ['useTrack', 'useScenes', 'useSlider', 'useCanvasEffect']
const readme = ['README.md', 'docs/guide.md'].map(file => readFileSync(join(root, file), 'utf8')).join('\n')
const blocks = [...readme.matchAll(/^```tsx\r?\n([\s\S]*?)^```\s*$/gm)].map(match => match[1])
const selected = blocks.filter(code => /export function Intro\(/.test(code) || hooks.some(hook => new RegExp(`\\b${hook}(?:<[^>]+>)?\\(`).test(code)) || /from ['"]\.\/components\/fx\//.test(code))

test(`README quick start, guide hook refs and installed Section usage compile unchanged through public exports (React ${process.env.SV_REACT18_DIR ? 18 : 19})`, () => {
  const dir = mkdtempSync(join(tmpdir(), 'sv-docs-types-'))
  try {
    // A consumer containing only the shipped declarations and manifest. No
    // source paths or scrollvars paths aliases can bypass package exports.
    const pkg = join(dir, 'node_modules', 'scrollvars')
    mkdirSync(pkg, { recursive: true })
    cpSync(join(root, 'dist'), join(pkg, 'dist'), { recursive: true })
    cpSync(join(root, 'package.json'), join(pkg, 'package.json'))
    mkdirSync(join(dir, 'components', 'fx'), { recursive: true })
    writeFileSync(join(dir, 'components', 'fx', 'StickySteps.tsx'), COMPONENTS['sticky-steps'].content)
    selected.forEach((code, i) => writeFileSync(join(dir, `readme-${i}.tsx`), code))
    // Consumer bundlers type stylesheet imports as side effects.
    assert.equal(JSON.parse(readFileSync(join(pkg, 'package.json'), 'utf8')).exports['./styles/*.css'], './styles/*.css')
    cpSync(join(root, 'styles'), join(pkg, 'styles'), { recursive: true })
    writeFileSync(join(dir, 'styles.d.ts'), "declare module 'scrollvars/styles/core.css' {}\n")
    const types = join(process.env.SV_REACT18_DIR || root, 'node_modules', '@types', 'react')
    if (process.env.SV_REACT18_DIR) writeFileSync(join(dir, 'canary.ts'), REACT18_CANARY)
    else writeFileSync(join(dir, 'canary.ts'), "import { useRef } from 'react'\nconst ref = useRef<number>(null)\nref.current = 5\n")
    writeFileSync(join(dir, 'tsconfig.json'), JSON.stringify({
      compilerOptions: {
        target: 'ES2020', lib: ['DOM', 'ESNext'], module: 'ESNext', moduleResolution: 'Bundler',
        jsx: 'react-jsx', strict: true, skipLibCheck: true, noEmit: true,
        paths: {
          react: [join(types, 'index.d.ts')],
          'react/jsx-runtime': [join(types, 'jsx-runtime.d.ts')],
          'react/jsx-dev-runtime': [join(types, 'jsx-dev-runtime.d.ts')],
        },
      },
      include: ['*.tsx', '*.d.ts', 'canary.ts', 'components/**/*.tsx'],
    }, null, 2))
    const result = spawnSync(join(root, 'node_modules', '.bin', 'tsc'), ['--project', 'tsconfig.json'], { cwd: dir, encoding: 'utf8' })
    // TypeScript can exit non-zero without printing a diagnostic. The exit
    // status, including a spawn failure/signal (null), is the gate itself.
    assert.equal(result.status, 0, `README tsc exit ${result.status}: ${result.error || ''}\n${result.stdout || ''}${result.stderr || ''}`)
    for (const hook of hooks) assert.ok(selected.some(code => new RegExp(`\\b${hook}(?:<[^>]+>)?\\(`).test(code)), `${hook} snippet was extracted`)
    assert.ok(selected.some(code => code.includes("from './components/fx/StickySteps'")), 'installed Section usage was extracted')
    assert.ok(selected.some(code => code.includes('export function Intro(')), 'README quick start was extracted')
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

// ---- round 16 item 14: AGENTS.md's own object-literal --sv-* style snippet
// is inline prose, not a fenced ```tsx block the fixture above scans, so it
// is extracted separately here: it must compile EXACTLY as documented (the
// cast the library itself uses for `style={{ '--sv-*' }}`, an excess
// property against React.CSSProperties otherwise), agents writing TSX are
// the audience of this file.
test(`AGENTS.md's --sv-order style snippet type-checks as written (React ${process.env.SV_REACT18_DIR ? 18 : 19})`, () => {
  const agents = readFileSync(join(root, 'AGENTS.md'), 'utf8')
  const snippet = agents.match(/style=\{\{ '--sv-order': i \} as React\.CSSProperties\}/)
  assert.ok(snippet, 'AGENTS.md no longer has the documented --sv-order snippet verbatim')
  const dir = mkdtempSync(join(tmpdir(), 'sv-docs-agents-types-'))
  try {
    writeFileSync(join(dir, 'agents-order.tsx'),
      `import * as React from 'react'\nfunction Item({ i }: { i: number }) {\n  return <div ${snippet[0]} />\n}\n`)
    const types = join(process.env.SV_REACT18_DIR || root, 'node_modules', '@types', 'react')
    writeFileSync(join(dir, 'tsconfig.json'), JSON.stringify({
      compilerOptions: {
        target: 'ES2020', lib: ['DOM', 'ESNext'], module: 'ESNext', moduleResolution: 'Bundler',
        jsx: 'react-jsx', strict: true, skipLibCheck: true, noEmit: true,
        paths: {
          react: [join(types, 'index.d.ts')],
          'react/jsx-runtime': [join(types, 'jsx-runtime.d.ts')],
          'react/jsx-dev-runtime': [join(types, 'jsx-dev-runtime.d.ts')],
        },
      },
      include: ['*.tsx'],
    }, null, 2))
    const result = spawnSync(join(root, 'node_modules', '.bin', 'tsc'), ['--project', 'tsconfig.json'], { cwd: dir, encoding: 'utf8' })
    assert.equal(result.status, 0, `AGENTS.md snippet tsc exit ${result.status}: ${result.error || ''}\n${result.stdout || ''}${result.stderr || ''}`)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})
