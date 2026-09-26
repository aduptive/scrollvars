import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

test('CLI compares release and prerelease requirements by SemVer precedence', () => {
  const dir = mkdtempSync(join(tmpdir(), 'sv-version-'))
  const pkg = join(dir, 'node_modules', 'scrollvars')
  const registry = join(dir, 'registry.json')
  mkdirSync(pkg, { recursive: true })
  try {
    for (const [installed, minimum, older] of [
      ['1.18.0-rc.1', '1.18.0', true], ['1.18.0', '1.18.0-rc.1', false],
      ['1.17.5', '1.18.0', true], ['1.18.0', '1.18.0', false],
      ['1.19.0', '1.18.0', false], ['2.0.0', '1.18.0', false],
      ['1.18.0-rc.2', '1.18.0-rc.10', true], ['1.18.0-rc.10', '1.18.0-rc.2', false],
      ['1.18.0-alpha', '1.18.0-beta', true], ['1.18.0-1', '1.18.0-alpha', true],
      ['1.18.0-rc', '1.18.0-rc.1', true], ['1.18.0+build.1', '1.18.0', false],
    ]) {
      writeFileSync(join(pkg, 'package.json'), JSON.stringify({ version: installed }))
      writeFileSync(registry, JSON.stringify({ effects: [{ slug: 'probe', file: 'Probe.tsx', content: '', requires: { min: minimum } }] }))
      const output = execFileSync(process.execPath, [fileURLToPath(new URL('../bin/scrollvars.mjs', import.meta.url)), 'add', 'probe', '--force'], {
        cwd: dir, env: { ...process.env, SCROLLVARS_REGISTRY: registry }, encoding: 'utf8',
      })
      assert.equal(output.includes('is installed; this effect needs'), older, `${installed} vs ${minimum}: ${output}`)
    }
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('an explicit SCROLLVARS_REGISTRY that fails exits instead of falling back to the public registry', () => {
  const dir = mkdtempSync(join(tmpdir(), 'sv-registry-'))
  const stub = join(dir, 'fetch-stub.mjs')
  // Only the override URL is faked (a 500), so a fallback request would hit
  // the real network and be visible in the recorded calls below; nothing
  // else about fetch is touched.
  writeFileSync(
    stub,
    `const calls = []
globalThis.__fetchCalls = calls
const realFetch = globalThis.fetch
globalThis.fetch = async (url, ...rest) => {
  calls.push(String(url))
  if (String(url) === 'https://example.invalid/private-registry') return { ok: false, status: 500 }
  return realFetch(url, ...rest)
}
process.on('exit', () => {
  process.stderr.write('CALLS:' + JSON.stringify(calls) + '\\n')
})
`
  )
  let error
  try {
    execFileSync(
      process.execPath,
      ['--import', stub, fileURLToPath(new URL('../bin/scrollvars.mjs', import.meta.url)), 'add', 'probe', '--force'],
      { cwd: dir, env: { ...process.env, SCROLLVARS_REGISTRY: 'https://example.invalid/private-registry' }, encoding: 'utf8' }
    )
  } catch (e) { error = e }
  const calls = JSON.parse(/CALLS:(\[.*\])/.exec(error?.stderr ?? '')?.[1] ?? '[]')
  rmSync(dir, { recursive: true, force: true })
  assert.ok(error, 'a failed override exits non-zero')
  assert.equal(error.status, 1)
  assert.deepEqual(calls, ['https://example.invalid/private-registry'], 'the public fallback is never requested')
  assert.match(error.stderr ?? '', /SCROLLVARS_REGISTRY/, 'the error names the override URL')
})

test('add with no slug prints usage even with an unreachable registry, no network call (ADU-354 item 13)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'sv-nosLug-'))
  let error, output
  try {
    output = execFileSync(
      process.execPath,
      [fileURLToPath(new URL('../bin/scrollvars.mjs', import.meta.url)), 'add'],
      { cwd: dir, env: { ...process.env, SCROLLVARS_REGISTRY: 'https://example.invalid/unreachable' }, encoding: 'utf8' }
    )
  } catch (e) { error = e; output = e.stdout }
  rmSync(dir, { recursive: true, force: true })
  assert.ok(error, 'add with no slug still exits non-zero (usage, not success)')
  assert.equal(error.status, 1)
  assert.match(output ?? '', /npx scrollvars add/, 'usage is printed')
  assert.ok(!/could not load the effect registry/.test(output ?? ''), 'no registry fetch was attempted')
})

test('an absolute --dir is used as-is, not appended under cwd', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'sv-dir-cwd-'))
  const target = mkdtempSync(join(tmpdir(), 'sv-dir-abs-'))
  const registry = join(cwd, 'registry.json')
  writeFileSync(registry, JSON.stringify({ effects: [{ slug: 'probe', file: 'Probe.tsx', content: 'x', requires: {} }] }))
  try {
    execFileSync(process.execPath, [fileURLToPath(new URL('../bin/scrollvars.mjs', import.meta.url)), 'add', 'probe', '--dir', target, '--force'], {
      cwd, env: { ...process.env, SCROLLVARS_REGISTRY: registry }, encoding: 'utf8',
    })
    assert.ok(existsSync(join(target, 'Probe.tsx')), 'the file landed in the absolute dir')
    // the bug: join(cwd, dir, file), an absolute dir joined under cwd
    assert.ok(!existsSync(join(cwd, target, 'Probe.tsx')), 'never written under cwd joined with the absolute path')
  } finally {
    rmSync(cwd, { recursive: true, force: true })
    rmSync(target, { recursive: true, force: true })
  }
})
