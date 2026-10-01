import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { build } from 'esbuild'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { chromium } from 'playwright'
import { ScrollVarsBoot, Slider } from '../../../dist/react/index.js'

const nonce = 'sv-nonce-fixture'
const markup = renderToString(React.createElement(React.Fragment, null,
  React.createElement(ScrollVarsBoot, { nonce }),
  React.createElement(Slider, { nonce, perView: { base: 1, md: 2 } }, React.createElement('div', null, 'Slide'))
))
const client = await build({
  stdin: {
    contents: `
      import React from 'react'
      import { hydrateRoot } from 'react-dom/client'
      import { ScrollVarsBoot, Slider } from '../../../dist/react/index.js'
      function App() {
        React.useEffect(() => { window.hydrated = true }, [])
        return <><ScrollVarsBoot nonce=${JSON.stringify(nonce)} /><Slider nonce=${JSON.stringify(nonce)} perView={{ base: 1, md: 2 }}><div>Slide</div></Slider></>
      }
      hydrateRoot(document.getElementById('app'), <App />)
    `,
    loader: 'tsx',
    resolveDir: import.meta.dirname,
  },
  bundle: true,
  write: false,
  format: 'iife',
  platform: 'browser',
  define: { 'process.env.NODE_ENV': '"development"' },
})

const server = createServer((_request, response) => {
  response.setHeader('Content-Type', 'text/html')
  response.setHeader('Content-Security-Policy', `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}'`)
  response.end(`<div id="app">${markup}</div><script nonce="${nonce}">window.prepaintRan=document.documentElement.classList.contains('sv-on')</script><script nonce="${nonce}">${client.outputFiles[0].text}</script>`)
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))

const browser = await chromium.launch()
try {
  const page = await browser.newPage()
  const messages = []
  page.on('console', message => messages.push(message.text()))
  await page.goto(`http://127.0.0.1:${server.address().port}`)
  await page.waitForFunction(() => window.hydrated)
  assert.equal(await page.evaluate(() => window.prepaintRan), true, 'the nonced pre-paint script must still execute')
  assert.deepEqual(await page.evaluate(() => {
    const script = document.querySelector('#app script')
    const style = document.querySelector('#app style')
    return [script.getAttribute('nonce'), script.nonce, style.getAttribute('nonce'), style.nonce]
  }), ['', nonce, '', nonce], 'Chromium hides parsed nonce attributes but preserves their values')
  assert.equal(messages.some(message => message.includes('hydrated but some attributes')), false, messages.join('\n'))
  console.log('ok Chromium: nonce CSP does not report Boot or Slider hydration mismatches')
} finally {
  await browser.close()
  server.close()
}
