import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, mkdirSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { packWorktree, packJson, artifactHashes, sourceEvidence, writeAcceptanceResult, failureDiagnostics, resolveConsumerImport, installConsumer, buildConsumer, repo, registryPath } from '../demo/bench/harness/packed-acceptance.mjs'
import { longBody, longTitle, mediaFiles } from '../demo/bench/harness/fixtures/section-content.mjs'

const scratch = mkdtempSync(join(tmpdir(), 'sv-packed-unit-'))
let artifact, consumer
before(async () => {
  artifact = packWorktree(scratch)
  consumer = installConsumer({ tarball: artifact.tarball, major: 19, parent: scratch })
})
after(() => rmSync(scratch, { recursive: true, force: true }))

test('packed acceptance packs the current worktree, including its built runtime', () => {
  assert.equal(artifact.cwd, repo)
  const packed = execFileSync('tar', ['-xOf', artifact.tarball, 'package/dist/index.js'])
  assert.deepEqual(packed, readFileSync(join(repo, 'dist/index.js')))
  assert.deepEqual(execFileSync('tar', ['-xOf', artifact.tarball, 'package/package.json']), readFileSync(join(repo, 'package.json')))
})

test('packed consumer resolution rejects a package linked to repository dist', () => {
  const bad = join(scratch, 'linked-consumer')
  mkdirSync(join(bad, 'node_modules'), { recursive: true })
  symlinkSync(repo, join(bad, 'node_modules/scrollvars'), 'dir')
  assert.throws(() => resolveConsumerImport(bad, 'scrollvars/react'), /outside consumer/)
  assert.match(resolveConsumerImport(consumer.dir, 'scrollvars/react'), /node_modules\/scrollvars\/dist\/react\/index\.js$/)
})

test('packed artifact hash fields match independent byte recomputation', () => {
  const hashes = artifactHashes(artifact.tarball)
  assert.equal(hashes.tarballSha512, 'sha512-' + createHash('sha512').update(readFileSync(artifact.tarball)).digest('base64'))
  assert.equal(hashes.registrySha256, createHash('sha256').update(readFileSync(registryPath)).digest('hex'))
  assert.equal(hashes.tarballSha512, artifact.integrity)
})

test('acceptance persists attribution and partial failures outside its disposable consumer', async () => {
  const directory = join(scratch, 'evidence')
  const evidence = sourceEvidence({ GITHUB_REPOSITORY: 'aduptive/scrollvars', GITHUB_RUN_ID: '123', GITHUB_RUN_ATTEMPT: '2' })
  assert.equal(evidence.sourceCommit, execFileSync('/usr/bin/git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim())
  assert.equal(evidence.packageVersion, JSON.parse(readFileSync(join(repo, 'package.json'))).version)
  assert.equal(evidence.ciRunUrl, 'https://github.com/aduptive/scrollvars/actions/runs/123')
  assert.equal(sourceEvidence({}).ciRunUrl, null)
  const result = { ...evidence, ...artifactHashes(artifact.tarball), status: 'failed', reactVersions: [consumer.react], browserVersions: [], checks: [{ name: 'injected failure', ok: false, error: 'original assertion' }] }
  writeAcceptanceResult(directory, result)
  await failureDiagnostics(directory, {
    isClosed: () => false, content: async () => '<p>Failure DOM</p>',
    screenshot: async () => { throw Error('capture unavailable') }, evaluate: async () => ({ position: 'static', inert: false }),
  }, 'injected failure')
  assert.deepEqual(JSON.parse(readFileSync(join(directory, 'result.json'))), result)
  assert.match(readFileSync(join(directory, 'injected-failure.html'), 'utf8'), /Failure DOM/)
  assert.match(readFileSync(join(directory, 'injected-failure.png.error.txt'), 'utf8'), /capture unavailable/)
  assert.equal(JSON.parse(readFileSync(join(directory, 'injected-failure.json'))).inert, false)
})

test('real packed CLI installs every Section and a kit effect byte for byte', () => {
  const registry = JSON.parse(readFileSync(registryPath, 'utf8'))
  assert(consumer.entries.length >= 7)
  for (const entry of consumer.entries) {
    assert.deepEqual(readFileSync(join(consumer.dir, entry.file)), Buffer.from(registry.effects.find(fx => fx.slug === entry.slug).content))
    const version = JSON.parse(readFileSync(join(repo, 'package.json'))).version
    assert(consumer.cliOutput[entry.slug].includes(`scrollvars ${version} ok`))
  }
})

test('packed consumer builds and server renders the integrated page without repository runtime resolution', async () => {
  const fixture = await buildConsumer(consumer)
  assert.match(fixture.html, /id="failed-section"/)
  assert.match(fixture.html, /id="healthy-section"/)
  assert.match(fixture.html, /id="kit"/)
  for (const entry of consumer.entries) assert(fixture.html.includes(`data-installed="${entry.slug}"`))
  assert(fixture.css.length > 1000)
  assert(fixture.script.length > 1000)
  assert(consumer.resolutions.size > 3)
  for (const mode of ['normal', 'held', 'broken']) {
    assert.match(fixture.content[mode], /id="content-steps"/)
    assert.match(fixture.content[mode], /id="content-timeline"/)
    assert.match(fixture.content[mode], /id="content-rail"/)
    assert.match(fixture.content[mode], /\/media\/step-1.jpg/)
  }
  assert.match(fixture.content.held, /\/media\/held.jpg/)
  assert.match(fixture.content.broken, /\/media\/missing.jpg/)
})

test('CMS replacements contain the declared copy lengths and three real 1200 by 900 JPEGs', () => {
  assert.equal(longBody.split(/\s+/).length, 200)
  assert.equal(longTitle.length, 120)
  assert.equal(mediaFiles.length, 3)
  for (const name of mediaFiles) {
    const bytes = readFileSync(join(repo, 'demo/bench/harness/fixtures/media', name))
    assert.equal(bytes.readUInt16BE(0), 0xffd8)
    let dimensions
    for (let offset = 2; offset < bytes.length;) {
      assert.equal(bytes[offset++], 0xff)
      const marker = bytes[offset++], length = bytes.readUInt16BE(offset)
      if ([0xc0, 0xc1, 0xc2].includes(marker)) { dimensions = [bytes.readUInt16BE(offset + 5), bytes.readUInt16BE(offset + 3)]; break }
      offset += length
    }
    assert.deepEqual(dimensions, [1200, 900], name)
  }
})

test('packJson skips the prepare script stdout that npm 10.8 prints in front of the payload', () => {
  const polluted = 'styles.css regenerated from [core.css, pin.css]\n[\n  { "filename": "scrollvars-1.18.0.tgz" }\n]\n'
  assert.equal(packJson(polluted)[0].filename, 'scrollvars-1.18.0.tgz')
  assert.equal(packJson('[\n{"filename":"clean.tgz"}\n]')[0].filename, 'clean.tgz')
  assert.throws(() => packJson('no payload [ here\n'), /printed no JSON array/)
})
