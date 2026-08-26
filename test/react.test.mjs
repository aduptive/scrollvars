import assert from 'node:assert/strict'
import { test } from 'node:test'

// Server-render the React layer with renderToStaticMarkup — no DOM, no
// jsdom: exactly what Next.js does on the server, so this also guards SSR.

function stubBrowserGlobals() {
  // the components call browser APIs only in effects, which never run in
  // renderToStaticMarkup — but module init must survive a bare import
  global.window = undefined
}

test('react: Slider renders the APG carousel contract', async () => {
  stubBrowserGlobals()
  const React = (await import('react')).default
  const { renderToStaticMarkup } = await import('react-dom/server')
  const { Slider } = await import('../dist/react/index.js')

  const html = renderToStaticMarkup(
    React.createElement(
      Slider,
      { label: 'cases', arrows: true, dots: true, autoplay: 4000 },
      React.createElement('div', null, 'one'),
      React.createElement('div', null, 'two')
    )
  )
  assert.match(html, /role="region"/)
  assert.match(html, /aria-roledescription="carousel"/)
  assert.match(html, /aria-label="cases"/)
  // visible rotation control, present because autoplay is on
  assert.match(html, /class="sv-pause"/)
  assert.match(html, /aria-label="stop slide rotation"/)
  // slides annotated in place, no wrapper elements
  assert.match(html, /aria-roledescription="slide"/)
  assert.match(html, /aria-label="1 of 2"/)
  assert.match(html, /aria-label="2 of 2"/)
  // rotating → the track is aria-live off; arrows/dots labeled
  assert.match(html, /aria-live="off"/)
  assert.match(html, /aria-label="previous slide"/)
  assert.match(html, /aria-label="go to slide 2"/)
})

test('react: Slider without autoplay has no pause control and is polite', async () => {
  const React = (await import('react')).default
  const { renderToStaticMarkup } = await import('react-dom/server')
  const { Slider } = await import('../dist/react/index.js')
  const html = renderToStaticMarkup(
    React.createElement(Slider, null, React.createElement('div', null, 'one'))
  )
  assert.doesNotMatch(html, /sv-pause/)
  assert.match(html, /aria-live="polite"/)
})

test('react: Scenes forwards options without leaking props to the DOM', async () => {
  const React = (await import('react')).default
  const { renderToStaticMarkup } = await import('react-dom/server')
  const { Scenes } = await import('../dist/react/index.js')
  const html = renderToStaticMarkup(
    React.createElement(
      Scenes,
      { count: 3, snap: false, once: true, onScene: () => {}, distance: '4rem' },
      ({ scene }) => React.createElement('span', null, `scene ${scene}`)
    )
  )
  // tracking options must NOT appear as DOM attributes
  assert.doesNotMatch(html, /snap|onScene|once=/)
  // VarProps compile to the CSS variable
  assert.match(html, /--sv-distance:4rem/)
  assert.match(html, /scene 0/)
})

test('react: Marquee duplicate is aria-hidden and inert', async () => {
  const React = (await import('react')).default
  const { renderToStaticMarkup } = await import('react-dom/server')
  const { Marquee } = await import('../dist/react/index.js')
  const html = renderToStaticMarkup(
    React.createElement(Marquee, null, React.createElement('a', { href: '#x' }, 'logo'))
  )
  assert.match(html, /aria-hidden="true"[^>]*inert/)
})
