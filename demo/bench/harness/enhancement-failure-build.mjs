// Called by render-installed after the real CLI writes StickySteps to a
// fresh directory. Both server and client use that exact installed file.
import { build } from 'esbuild'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadComponent, renderStatic, resolveScrollvars } from '../../../scripts/fx-render.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
export async function buildFailureFixture(installedPath, styles) {
  const source = `import * as React from 'react'
import { StickySteps } from ${JSON.stringify(installedPath)}
import { ScrollVarsBoot } from 'scrollvars/react'
import * as SV from 'scrollvars'
export function FailureApp({ empty = false }) {
  const [shown, show] = React.useState(!empty)
  const [generation, remount] = React.useState(0)
  React.useEffect(() => {
    window.failureControl = { SV, show, remount: () => remount(n => n + 1) }
    window.failureHydrated = true
  }, [])
  return <><ScrollVarsBoot nonce="sv-fixture" />{shown && <StickySteps key={generation} nonce="sv-fixture" steps={[
    { title: 'First step', text: 'First description', media: <a href="#after">First media link</a> },
    { title: 'Second step', text: 'Second description', media: <a href="#after">Second media link</a> },
    { title: 'Third step', text: 'Third description', media: <a href="#after">Third media link</a> }
  ]} />}</>
}
`
  const App = await loadComponent('enhancement-failure', { file: 'EnhancementFailure.tsx', content: source })
  const requireReact = createRequire(join(process.env.SV_REACT18_DIR || root, 'package.json'))
  const result = await build({
    stdin: { contents: source + `\nimport { hydrateRoot } from 'react-dom/client'\nhydrateRoot(document.getElementById('app'), <FailureApp empty={new URLSearchParams(location.search).get('case') === 'empty'} />)`, loader: 'tsx', resolveDir: root },
    bundle: true, write: false, format: 'iife', platform: 'browser', jsx: 'automatic',
    define: { 'process.env.NODE_ENV': '"production"' },
    plugins: [resolveScrollvars, { name: 'fixture-react-major', setup(api) {
      api.onResolve({ filter: /^react(?:-dom)?(?:\/.*)?$/ }, args => ({ path: requireReact.resolve(args.path) }))
    } }],
  })
  return { styles, markup: renderStatic(App, {}), emptyMarkup: renderStatic(App, { empty: true }), script: result.outputFiles[0].text }
}
