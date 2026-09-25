import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, writeFileSync, rmSync, appendFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const bin = fileURLToPath(new URL('../bin/scrollvars.mjs', import.meta.url))
const source = readFileSync(fileURLToPath(new URL('../skills/scrollvars/SKILL.md', import.meta.url)), 'utf8')

test('`scrollvars skill` installs the shipped skill for Claude Code and Codex, into the project by default', () => {
  const dir = mkdtempSync(join(tmpdir(), 'sv-skill-'))
  try {
    const output = execFileSync(process.execPath, [bin, 'skill'], { cwd: dir, encoding: 'utf8' })
    const claude = join(dir, '.claude', 'skills', 'scrollvars', 'SKILL.md')
    const codex = join(dir, '.agents', 'skills', 'scrollvars', 'SKILL.md')
    assert.equal(readFileSync(claude, 'utf8'), source)
    assert.equal(readFileSync(codex, 'utf8'), source)
    assert.match(output, /\.claude\/skills\/scrollvars\/SKILL\.md/)
    assert.match(output, /\.agents\/skills\/scrollvars\/SKILL\.md/)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('`scrollvars skill --global` installs into the user home instead of the project', () => {
  const dir = mkdtempSync(join(tmpdir(), 'sv-skill-cwd-'))
  const home = mkdtempSync(join(tmpdir(), 'sv-skill-home-'))
  try {
    execFileSync(process.execPath, [bin, 'skill', '--global'], { cwd: dir, env: { ...process.env, HOME: home }, encoding: 'utf8' })
    assert.ok(existsSync(join(home, '.claude', 'skills', 'scrollvars', 'SKILL.md')))
    assert.ok(existsSync(join(home, '.agents', 'skills', 'scrollvars', 'SKILL.md')))
    assert.ok(!existsSync(join(dir, '.claude')), 'nothing written under the project cwd')
  } finally {
    rmSync(dir, { recursive: true, force: true })
    rmSync(home, { recursive: true, force: true })
  }
})

test('re-running `scrollvars skill` is idempotent (no error, no change) when nothing was edited', () => {
  const dir = mkdtempSync(join(tmpdir(), 'sv-skill-idem-'))
  try {
    execFileSync(process.execPath, [bin, 'skill'], { cwd: dir, encoding: 'utf8' })
    const output = execFileSync(process.execPath, [bin, 'skill'], { cwd: dir, encoding: 'utf8' })
    assert.match(output, /already up to date/)
    assert.equal(readFileSync(join(dir, '.claude', 'skills', 'scrollvars', 'SKILL.md'), 'utf8'), source)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('`scrollvars skill` refuses to overwrite a locally modified skill file without --force', () => {
  const dir = mkdtempSync(join(tmpdir(), 'sv-skill-modified-'))
  try {
    execFileSync(process.execPath, [bin, 'skill'], { cwd: dir, encoding: 'utf8' })
    const claude = join(dir, '.claude', 'skills', 'scrollvars', 'SKILL.md')
    appendFileSync(claude, '\ncustom local edit\n')
    let error
    try {
      execFileSync(process.execPath, [bin, 'skill'], { cwd: dir, encoding: 'utf8' })
    } catch (e) { error = e }
    assert.ok(error, 'exits non-zero on a modified target')
    assert.equal(error.status, 1)
    assert.match(error.stderr ?? '', /differs from the shipped skill\. Pass --force/)
    assert.match(readFileSync(claude, 'utf8'), /custom local edit/, 'the modified file is left untouched')

    execFileSync(process.execPath, [bin, 'skill', '--force'], { cwd: dir, encoding: 'utf8' })
    assert.equal(readFileSync(claude, 'utf8'), source, '--force overwrites it')
  } finally { rmSync(dir, { recursive: true, force: true }) }
})
