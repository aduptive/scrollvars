import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { extract } from '../scripts/skill-build.mjs'

const root = join(fileURLToPath(import.meta.url), '..', '..')

test('extract() reads the text between two anchors', () => {
  assert.equal(extract('a<<mid>>b', '<<', '>>', 'probe'), 'mid')
})

test('extract() throws when the start anchor is missing (proves red on drift)', () => {
  assert.throws(() => extract('no anchors here', '<<', '>>', 'probe'), /start anchor found 0 times/)
})

test('extract() throws when the start anchor repeats', () => {
  assert.throws(() => extract('<<a>><<b>>', '<<', '>>', 'probe'), /start anchor found 2 times/)
})

test('extract() throws when the end anchor never follows the start anchor', () => {
  assert.throws(() => extract('<<only start', '<<', '>>', 'probe'), /end anchor not found/)
})

test('skills/scrollvars/SKILL.md is committed and in sync with AGENTS.md and package.json', () => {
  const skill = readFileSync(join(root, 'skills', 'scrollvars', 'SKILL.md'), 'utf8')
  const version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version
  assert.match(skill, /^---\nname: scrollvars\n/, 'valid frontmatter opening')
  assert.match(skill, /\ndescription: .+\n/, 'has a description field')
  assert.match(skill, new RegExp(`version: "${version.replace(/\./g, '\\.')}"`), 'metadata.version matches package.json')
  assert.ok(!/~\/|\/Users\/|\/home\//.test(skill), 'no local filesystem paths leaked into the public skill')
  // the performance rules must be carried verbatim, not summarized away
  assert.match(skill, /Never top\/left\/width\/margin/)
  assert.match(skill, /never fail hidden/)
})
