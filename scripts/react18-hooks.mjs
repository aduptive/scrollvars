// A node --import loader hook (see react18-register.mjs) that redirects
// `react` and `react-dom` (and every subpath: react-dom/server, jsx-runtime,
// etc.) to the isolated React 18 install for the lifetime of the process, so
// the built dist and test/react.test.mjs + test/cli-components.test.mjs run
// against a different React major with no source change.
//
// The trick: resolve the specifier as if the importing file lived directly
// inside the React 18 install's own node_modules. Node's ancestor lookup
// then finds that directory as a real node_modules and resolves through the
// target package's own package.json "exports" map (so react-dom/server picks
// server.node.js exactly like a real install would), instead of us having to
// hand-list every subpath file.
import { pathToFileURL } from 'node:url'
import { join } from 'node:path'
import { REACT18_MODULES } from './react18-paths.mjs'

const fakeParent = pathToFileURL(join(REACT18_MODULES, '__scrollvars-react18-probe__.mjs')).href

export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'react' || specifier === 'react-dom' || specifier.startsWith('react/') || specifier.startsWith('react-dom/')) {
    return nextResolve(specifier, { ...context, parentURL: fakeParent })
  }
  return nextResolve(specifier, context)
}
