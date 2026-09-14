/**
 * Rendered-output equivalence: the gate every performance variant has to pass
 * before its timing counts, and the invariant that proves an opt-in sheet
 * changes nothing on the shipped pages.
 *
 * Born from a screen that reported 53% because the variant had stopped
 * animating. A runner saying 60fps says nothing about whether anything moved.
 *
 * snapshotRender(page): for every element under a tracked ancestor, the
 * computed animatable properties at four scroll positions, sampled twice per
 * position. An entrance transition depends on the wall clock since its class
 * flipped and never agrees between two page loads mid-flight, so the second
 * sample exists to tell what held still from what was in motion.
 *
 * compareRender(baseline, other): elements that held still in BOTH are
 * compared numerically with a tolerance tight enough for the failure that
 * started this (a sign flip, opacity 1 against 0.3) and loose enough not to
 * cry wolf on the last digit of a transform matrix.
 */

const POSITIONS = [0.15, 0.4, 0.65, 0.4]
const SETTLE_MS = 500
const HOLD_MS = 400
const TOL_REL = 0.01
const TOL_ABS = 0.05

// Evaluated in the page. Returns [[first, second], ...] per position, each a
// list of "id => translate|opacity|transform|rotate|scale" strings.
const SNAPSHOT_SOURCE = `async (positions, settle, hold) => {
  const describe = el => {
    const cs = getComputedStyle(el)
    const cls = typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\\s+/).join('.') : ''
    return el.tagName.toLowerCase() + cls + ' => ' + [cs.translate, cs.opacity, cs.transform, cs.rotate, cs.scale].join('|')
  }
  // Every tracked element and every direct child (the readers of a forwarded
  // clock) in full, then deeper descendants at a stride so a deep page still
  // fits: a cap taken in document order covered eight boxes of fifty.
  const tracked = [...document.querySelectorAll('.sv')]
  const readers = tracked.flatMap(el => [el, ...el.children])
  const deeper = [...document.querySelectorAll('.sv * *')].filter(el => !readers.includes(el))
  const stride = Math.max(1, Math.ceil(deeper.length / 1200))
  const targets = [...readers, ...deeper.filter((_, i) => i % stride === 0)]
  const snap = () => targets.map(describe)
  const wait = ms => new Promise(r => setTimeout(r, ms))
  const frame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
  const out = []
  const height = document.documentElement.scrollHeight - innerHeight
  for (const p of positions) {
    scrollTo(0, Math.round(height * p))
    await frame()
    await wait(settle)
    const first = snap()
    await wait(hold)
    out.push([first, snap()])
  }
  scrollTo(0, 0)
  await frame()
  return { positions: out, scrollHeight: document.documentElement.scrollHeight, readers: readers.length, sampled: targets.length }
}`

export async function snapshotRender(page) {
  return page.evaluate(`(${SNAPSHOT_SOURCE})(${JSON.stringify(POSITIONS)}, ${SETTLE_MS}, ${HOLD_MS})`)
}

const NUM = /-?\d+(?:\.\d+)?/g
const numbersOf = s => (s.match(NUM) ?? []).map(Number)
const shape = s => s.replace(NUM, '#')

/** Same element, same non-numeric shape, every number within tolerance. */
export function sameOne(a, b) {
  if (a.split(' => ')[0] !== b.split(' => ')[0]) return false
  if (shape(a) !== shape(b)) return false
  const [na, nb] = [numbersOf(a), numbersOf(b)]
  if (na.length !== nb.length) return false
  return na.every((x, j) => {
    const diff = Math.abs(x - nb[j])
    return diff <= TOL_ABS || diff <= Math.abs(nb[j]) * TOL_REL
  })
}

const stableMask = pair => pair[0].map((v, i) => sameOne(v, pair[1][i]))

// The position list visits 0.4 twice, arriving from different directions. An
// element whose value is a function of the scroll position reads the same
// both times; one driven by a per-frame JavaScript lerp still converging
// (the home page's map stations) does not, and its value depends on how many
// frames ran, which a variant can change without changing any rendering the
// gate is about. Such elements are excluded from the comparison and from its
// coverage count, in baseline and variant alike.
const REPEATED = [1, 3]
const scrollDeterminedMask = shot => {
  const [a, b] = REPEATED.map(i => shot.positions[i]?.[1])
  if (!a || !b) return shot.positions[0][1].map(() => true)
  return a.map((v, j) => sameOne(v, b[j]))
}

/** Did the settled elements change between the first position and any other? */
export function rendersMoved(shot) {
  const pos = shot.positions
  const m0 = stableMask(pos[0])
  return pos.some((pair, i) => i > 0 && pair[1].some((v, j) => m0[j] && stableMask(pair)[j] && !sameOne(v, pos[0][1][j])))
}

/**
 * Compare a snapshot against a baseline. Returns { ok, position, diffs,
 * differing, compared, total, reason }. A comparison that covered too few
 * settled elements fails: a variant that merely delays every animation would
 * otherwise pass by never holding still, and a page with a different scroll
 * height ran a different path.
 */
export function compareRender(baseline, other) {
  const fail = (reason, extra = {}) => ({ ok: false, position: -1, diffs: [], differing: -1, compared: 0, total: 0, reason, ...extra })
  if (baseline.scrollHeight !== other.scrollHeight)
    return fail(`scroll height differs: ${other.scrollHeight} against ${baseline.scrollHeight}, the timed path is not the same`)
  const [bp, op] = [baseline.positions, other.positions]
  if (bp.length !== op.length) return fail('different number of positions')
  const sb = scrollDeterminedMask(baseline), so = scrollDeterminedMask(other)
  let compared = 0, total = 0, timeDependent = 0
  for (let i = 0; i < bp.length; i++) {
    const [b, o] = [bp[i], op[i]]
    if (b[1].length !== o[1].length) return fail(`different element count at position ${i}: ${o[1].length} against ${b[1].length}`)
    const mb = stableMask(b), mo = stableMask(o)
    const bad = []
    for (let j = 0; j < b[1].length; j++) {
      if (!(sb[j] && so[j])) { timeDependent++; continue }
      total++
      if (!(mb[j] && mo[j])) continue
      compared++
      if (!sameOne(o[1][j], b[1][j])) bad.push([o[1][j], b[1][j]])
    }
    if (bad.length) return { ok: false, position: i, diffs: bad.slice(0, 6), differing: bad.length, compared, total, reason: 'settled elements differ' }
  }
  // Coverage: at least half of everything sampled, and never fewer than 20,
  // must have held still in both runs. Below that the gate saw nothing.
  const need = Math.max(20, Math.ceil(total * 0.5))
  if (compared < need) return fail(`only ${compared} of ${total} sampled elements were settled in both runs (need ${need}): the gate saw too little to say anything`, { compared, total })
  return { ok: true, position: -1, diffs: [], differing: 0, compared, total, timeDependent, reason: '' }
}

export function describeMismatch(name, result) {
  if (result.position < 0) return `${name}: ${result.reason}`
  return `${name} changed rendered output at scroll position ${result.position}: the timing is not comparable\n` +
    result.diffs.map(([a, b]) => `   variant: ${a}\n   base   : ${b}`).join('\n') +
    `\n   (${result.differing} settled elements differ)`
}
