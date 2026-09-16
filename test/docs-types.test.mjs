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
const readme = readFileSync(join(root, 'README.md'), 'utf8')
const blocks = [...readme.matchAll(/^```tsx\r?\n([\s\S]*?)^```\s*$/gm)].map(match => match[1])
const selected = blocks.filter(code => hooks.some(hook => new RegExp(`\\b${hook}(?:<[^>]+>)?\\(`).test(code)) || /from ['"]\.\/components\/fx\//.test(code))

test(`README hook refs and installed Section usage compile unchanged through public exports (React ${process.env.SV_REACT18_DIR ? 18 : 19})`, () => {
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
      include: ['*.tsx', 'canary.ts', 'components/**/*.tsx'],
    }, null, 2))
    const result = spawnSync(join(root, 'node_modules', '.bin', 'tsc'), ['--project', 'tsconfig.json'], { cwd: dir, encoding: 'utf8' })
    // TypeScript can exit non-zero without printing a diagnostic. The exit
    // status, including a spawn failure/signal (null), is the gate itself.
    assert.equal(result.status, 0, `README tsc exit ${result.status}: ${result.error || ''}\n${result.stdout || ''}${result.stderr || ''}`)
    for (const hook of hooks) assert.ok(selected.some(code => new RegExp(`\\b${hook}(?:<[^>]+>)?\\(`).test(code)), `${hook} snippet was extracted`)
    assert.ok(selected.some(code => code.includes("from './components/fx/StickySteps'")), 'installed Section usage was extracted')
  } finally { rmSync(dir, { recursive: true, force: true }) }
})
