// Shared location for the isolated React 18 install used by
// `npm run test:react18` and the CI `test-react-18` job. Lives under
// `node_modules/.cache` so it is always gitignored and never touches the
// root package.json / package-lock.json (those stay pinned to React 19).
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
export const REACT18_ROOT = join(root, 'node_modules', '.cache', 'react18')
export const REACT18_MODULES = join(REACT18_ROOT, 'node_modules')
