import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, mkdirSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { packWorktree, packJson, artifactHashes, resolveConsumerImport, installConsumer, buildConsumer, repo, registryPath } from '../demo/bench/harness/packed-acceptance.mjs'

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
})

test('packJson skips the prepare script stdout that npm 10.8 prints in front of the payload', () => {
  const polluted = 'styles.css regenerated from [core.css, pin.css]\n[\n  { "filename": "scrollvars-1.18.0.tgz" }\n]\n'
  assert.equal(packJson(polluted)[0].filename, 'scrollvars-1.18.0.tgz')
  assert.equal(packJson('[\n{"filename":"clean.tgz"}\n]')[0].filename, 'clean.tgz')
  assert.throws(() => packJson('no payload [ here\n'), /printed no JSON array/)
})
