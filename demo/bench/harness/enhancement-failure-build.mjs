// Called by render-installed after the real CLI writes StickySteps to a
// fresh directory. Both server and client use that exact installed file.
import { build } from 'esbuild'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync, realpathSync } from 'node:fs'
import assert from 'node:assert/strict'
import { loadComponent, renderStatic, resolveScrollvars } from '../../../scripts/fx-render.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
export async function buildFailureFixture(installedPath, styles) {
  const source = `import * as React from 'react'
import { StickySteps } from ${JSON.stringify(installedPath)}
import { ScrollVarsBoot } from 'scrollvars/react'
import * as SV from 'scrollvars'
export function FailureApp({ empty = false, images = false }) {
  const [shown, show] = React.useState(!empty)
  const [generation, remount] = React.useState(0)
  React.useEffect(() => {
    window.failureControl = { SV, show, remount: () => remount(n => n + 1) }
    window.failureHydrated = true
  }, [])
  const image = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900"><rect width="1200" height="900" fill="teal"/></svg>')
  return <><ScrollVarsBoot nonce="sv-fixture" />{shown && <StickySteps key={generation} nonce="sv-fixture" steps={images ? [0, 1, 2].map(i => ({
    title: 'Image step ' + i, text: 'A short description.', media: <img src={image} alt={'Shot ' + i} />
  })) : [
    { title: 'First step', text: 'First description', media: <a href="#after">First media link</a> },
    { title: 'Second step', text: 'Second description', media: <a href="#after">Second media link</a> },
    { title: 'Third step', text: 'Third description', media: <a href="#after">Third media link</a> }
  ]} />}</>
}
`
  const App = await loadComponent('enhancement-failure', { file: 'EnhancementFailure.tsx', content: source })
  const requireReact = createRequire(join(process.env.SV_REACT18_DIR || root, 'package.json'))
  const result = await build({
    stdin: { contents: source + `\nimport { hydrateRoot } from 'react-dom/client'\nhydrateRoot(document.getElementById('app'), <FailureApp empty={new URLSearchParams(location.search).get('case') === 'empty'} images={new URLSearchParams(location.search).get('case') === 'images'} />)`, loader: 'tsx', resolveDir: root },
    bundle: true, write: false, format: 'iife', platform: 'browser', jsx: 'automatic',
    define: { 'process.env.NODE_ENV': '"production"' },
    plugins: [resolveScrollvars, { name: 'steps-acquisition-probe', setup(api) {
      api.onLoad({ filter: /\.tsx$/ }, args => {
        // realpath both sides: macOS hands mkdtemp a /var/folders path while
        // esbuild resolves /private/var, so a plain compare never matched
        // locally and the fault was silently not injected (lead, round 13)
        if (realpathSync(args.path) !== realpathSync(installedPath)) return
        // Instrument only the installed Section's acquisition boundaries.
        // The driver and Boot retain the real globals in these four cases.
        let contents = readFileSync(installedPath, 'utf8')
        const token = /\bonMotionChange\b(?=[^\n]*from 'scrollvars')/g
        assert.equal([...contents.matchAll(token)].length, 1)
        contents = contents.replace(token, 'onMotionChange as subscribeMotion')
        const statusToken = /onStatus: value => \{/g
        assert.equal([...contents.matchAll(statusToken)].length, 1)
        contents = contents.replace(statusToken, 'onStatus: value => { window.stepsStatuses.push(value);')
        contents += `\nconst MutationObserver = window.StepsMutationObserver;
          const onMotionChange = (fn) => {
            const stop = subscribeMotion(fn); window.stepsSubscriptions++;
            let live = true;
            return () => { if (live) { live = false; window.stepsSubscriptions--; stop(); } };
          };`
        return { contents, loader: 'tsx' }
      })
    } }, { name: 'fixture-react-major', setup(api) {
      api.onResolve({ filter: /^react(?:-dom)?(?:\/.*)?$/ }, args => ({ path: requireReact.resolve(args.path) }))
    } }],
  })
  return { styles, markup: renderStatic(App, {}), emptyMarkup: renderStatic(App, { empty: true }), imageMarkup: renderStatic(App, { images: true }), script: result.outputFiles[0].text }
}
