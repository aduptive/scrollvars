// Acceptance owns the artifact and consumer boundary. No source/dist aliases.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
// Data only. Runtime, styles and components always come from the consumer.
import { EFFECTS } from '../../../scripts/fx-data.mjs'

export const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
export const registryPath = join(repo, 'demo/fx/registry.json')
const npm = (args, cwd, env = {}) => execFileSync('npm', args, {
  cwd, env: { ...process.env, ...env }, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024,
  stdio: ['ignore', 'pipe', 'pipe'],
})
export function artifactHashes(tarball) {
  return {
    tarballSha512: 'sha512-' + createHash('sha512').update(readFileSync(tarball)).digest('base64'),
    registrySha256: createHash('sha256').update(readFileSync(registryPath)).digest('hex'),
  }
}
export function packWorktree(destination) {
  const [packed] = JSON.parse(npm(['pack', '--json', '--pack-destination', destination, '--cache', join(destination, '.npm-cache')], repo))
  const tarball = join(destination, packed.filename)
  assert.equal(artifactHashes(tarball).tarballSha512, packed.integrity)
  return { tarball, integrity: packed.integrity, cwd: repo }
}
export function resolveConsumerImport(dir, specifier) {
  const path = realpathSync(createRequire(join(dir, 'package.json')).resolve(specifier))
  // Do not realpath the expected package root: a symlink to the repo must fail.
  const expected = join(realpathSync(dir), 'node_modules/scrollvars')
  const rel = relative(expected, path)
  assert(rel && rel !== '..' && !rel.startsWith('..' + sep) && !isAbsolute(rel), `${specifier} resolves outside consumer: ${path}`)
  return path
}
export function installConsumer({ tarball, major, parent = tmpdir() }) {
  const dir = mkdtempSync(join(parent, `sv-packed-react${major}-`))
  npm(['init', '-y'], dir)
  const roots = [repo, join(repo, 'node_modules/.cache/react18')]
  const local = roots.find(root => ['react', 'react-dom'].every(name => {
    const file = join(root, 'node_modules', name, 'package.json')
    return existsSync(file) && JSON.parse(readFileSync(file)).version.startsWith(`${major}.`)
  }))
  const dependencies = [], copied = new Set()
  const copyDependency = name => {
    if (copied.has(name)) return
    copied.add(name)
    const path = join(local, 'node_modules', name)
    const pkg = JSON.parse(readFileSync(join(path, 'package.json')))
    dependencies.push(`file:${path}`)
    for (const child of Object.keys(pkg.dependencies || {})) copyDependency(child)
  }
  if (local) { copyDependency('react'); copyDependency('react-dom') }
  else dependencies.push(`react@${major}`, `react-dom@${major}`)
  const args = ['install', '--install-links', '--no-audit', '--no-fund', '--ignore-scripts',
    ...(local ? ['--cache', join(dir, '.npm-cache')] : []), tarball, ...dependencies]
  try { npm([...args, '--offline'], dir) } catch (error) {
    if (!/ENOTCACHED|cache mode is 'only-if-cached'/.test(String(error.stderr))) throw error
    console.log(`React ${major}: npm cache miss; registry access is required`)
    npm([...args, '--prefer-offline'], dir)
  }
  const require = createRequire(join(dir, 'package.json'))
  const react = require('react/package.json').version
  assert.equal(Number(react.split('.')[0]), major)
  assert.equal(require('react-dom/package.json').version, react)
  for (const name of ['react', 'react-dom', 'react-dom/server', 'react-dom/client']) {
    assert(realpathSync(require.resolve(name)).startsWith(realpathSync(dir) + sep), `${name} must be copied into the consumer`)
  }
  const registry = JSON.parse(readFileSync(registryPath, 'utf8'))
  const slugs = [...EFFECTS.filter(fx => fx.previewProps).map(fx => fx.slug), 'marquee']
  const entries = slugs.map(slug => {
    const entry = registry.effects.find(fx => fx.slug === slug)
    assert(entry, `registry missing ${slug}`)
    return entry
  })
  const resolutions = new Map()
  const guard = specifier => {
    const path = resolveConsumerImport(dir, specifier)
    if (!resolutions.has(specifier)) console.log(`resolve React ${react}: ${specifier} -> ${path}`)
    resolutions.set(specifier, path)
    return path
  }
  guard('scrollvars/package.json')
  assert.equal(realpathSync(join(dir, 'node_modules/.bin/scrollvars')), join(realpathSync(dir), 'node_modules/scrollvars/bin/scrollvars.mjs'))
  const cliOutput = {}
  for (const entry of entries) {
    cliOutput[entry.slug] = execFileSync('npx', ['--no-install', 'scrollvars', 'add', entry.slug, '--dir', '.'], {
      cwd: dir, env: { ...process.env, SCROLLVARS_REGISTRY: registryPath }, encoding: 'utf8',
    })
    console.log(cliOutput[entry.slug].trim())
    assert.deepEqual(readFileSync(join(dir, entry.file)), Buffer.from(entry.content), `${entry.slug}: CLI byte parity`)
  }
  return { dir, react, entries, cliOutput, resolutions, guard }
}

export async function buildConsumer(consumer) {
  const { dir, entries, guard } = consumer
  const imports = entries.map((entry, index) => {
    const names = [...entry.content.matchAll(/export function (\w+)/g)]
    assert.equal(names.length, 1, `${entry.slug}: one component export`)
    return `import { ${names[0][1]} as C${index} } from './${entry.file}'`
  }).join('\n')
  const sections = entries.filter(entry => entry.slug !== 'marquee').map(entry => {
    const index = entries.indexOf(entry)
    const props = { ...EFFECTS.find(fx => fx.slug === entry.slug).previewProps }
    delete props.className // gallery chrome is not a consumer dependency
    const expression = entry.slug === 'sticky-steps'
      ? `{...${JSON.stringify(props)}} steps={${JSON.stringify(props.steps)}.map((s, i) => ({...s, media: <a href="#after">Media {i + 1}</a>}))}`
      : `{...${JSON.stringify(props)}}`
    const id = entry.slug === 'sticky-steps' ? 'failed-section' : entry.slug
    return `<section id="${id}" data-installed="${entry.slug}"><C${index} ${expression} /></section>`
  }).join('\n')
  const stepsIndex = entries.findIndex(entry => entry.slug === 'sticky-steps')
  const source = `import * as React from 'react'
import { ScrollVarsBoot } from 'scrollvars/react'
${imports}
export function App() {
  React.useEffect(() => { window.packedMounted = (window.packedMounted || 0) + 1 }, [])
  return <><ScrollVarsBoot />
    <h1>CMS publication</h1>
    ${sections}
    <section id="healthy-section"><C${stepsIndex} steps={[0,1,2].map(i => ({title: 'Healthy step ' + i, text: 'Independent CMS content', media: <a href="#after">Healthy media {i + 1}</a>}))} /></section>
    <section id="kit" data-installed="marquee"><C${entries.length - 1}><span>First brand</span><span>Second brand</span></C${entries.length - 1}></section>
    <a id="after" href="#before">End of publication</a>
  </>
}`
  writeFileSync(join(dir, 'app.tsx'), source)
  const plugins = [{ name: 'consumer-package-boundary', setup(api) {
    api.onResolve({ filter: /^scrollvars(?:\/.*)?$/ }, args => ({ path: guard(args.path) }))
  } }]
  const options = { absWorkingDir: dir, bundle: true, jsx: 'automatic', plugins, logLevel: 'silent', metafile: true }
  // React stays external in SSR and resolves normally from this fresh consumer.
  writeFileSync(join(dir, 'server.tsx'), `import { renderToString } from 'react-dom/server'; import { App } from './app'; console.log(renderToString(<App />))`)
  const server = await build({ ...options, entryPoints: ['server.tsx'], outfile: join(dir, 'server.mjs'), platform: 'node', format: 'esm', external: ['react', 'react-dom', 'react/*'] })
  const markup = execFileSync(process.execPath, [join(dir, 'server.mjs')], { cwd: dir, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
  const { clientSource, instrumentResources } = await import('./packed-fixture.mjs')
  writeFileSync(join(dir, 'client.tsx'), clientSource)
  const bundled = await build({ ...options, entryPoints: ['client.tsx'], outfile: join(dir, 'client.js'), write: false, platform: 'browser', format: 'iife', define: { 'process.env.NODE_ENV': '"production"' } })
  for (const input of [...Object.keys(server.metafile.inputs), ...Object.keys(bundled.metafile.inputs)]) {
    const path = realpathSync(resolve(dir, input))
    assert(path.startsWith(realpathSync(dir) + sep), `bundle input outside consumer: ${path}`)
  }
  const styles = [...new Set(entries.flatMap(entry => entry.requires?.styles ?? []))]
  const css = styles.map(name => readFileSync(guard(`scrollvars/styles/${name}.css`), 'utf8')).join('\n')
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Packed consumer</title>
<link rel="stylesheet" href="/consumer.css"><style>body{margin:0;font:16px/1.5 sans-serif}#app>section{margin-block:15vh}#before,#after{display:block;padding:20px}#isolation{color:rgb(11,22,33);padding:17px;transform:translateY(3px);opacity:.83}#kit span{padding:24px}</style>
<script>(${instrumentResources.toString()})()</script></head><body><a id="before" href="#after">Start of publication</a><aside id="isolation">Independent page style</aside><main id="app">${markup}</main><script src="/client.js"></script></body></html>`
  return { html, css, script: bundled.outputFiles[0].text }
}

async function main() {
  const selected = process.argv[2]
  const browsers = selected ? [selected] : ['chromium', 'firefox', 'webkit']
  assert(browsers.every(name => ['chromium', 'firefox', 'webkit'].includes(name)), `Unknown browser: ${selected}`)
  const scratch = mkdtempSync(join(tmpdir(), 'sv-packed-acceptance-'))
  const results = { browsers, reactVersions: [], checks: [] }
  const check = async (name, run) => {
    try { await run(); results.checks.push({ name, ok: true }); console.log(`ok ${name}`) }
    catch (error) { results.checks.push({ name, ok: false, error: error.stack }); console.error(`not ok ${name}: ${error.stack}`); throw error }
  }
  try {
    const tarball = process.env.SCROLLVARS_TARBALL ? resolve(process.env.SCROLLVARS_TARBALL) : packWorktree(scratch).tarball
    Object.assign(results, { tarball, ...artifactHashes(tarball) })
    const { runBrowsers } = await import('./packed-browser-checks.mjs')
    for (const major of [18, 19]) {
      let consumer, fixture
      await check(`React ${major}: packed CLI, byte parity and consumer imports`, async () => {
        consumer = installConsumer({ tarball, major, parent: scratch })
        results.reactVersions.push(consumer.react)
        fixture = await buildConsumer(consumer)
      })
      await runBrowsers({ fixture, browsers, react: consumer.react, check })
    }
    assert.deepEqual(artifactHashes(tarball), { tarballSha512: results.tarballSha512, registrySha256: results.registrySha256 }, 'artifacts changed during acceptance')
  } catch (error) {
    if (!results.checks.some(check => !check.ok)) {
      results.checks.push({ name: 'setup or artifact integrity', ok: false, error: error.stack })
      console.error(`not ok setup or artifact integrity: ${error.stack}`)
    }
    process.exitCode = 1
  } finally {
    console.log(JSON.stringify(results))
    rmSync(scratch, { recursive: true, force: true })
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main()
