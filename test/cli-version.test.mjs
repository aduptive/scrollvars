import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
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
