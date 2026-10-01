import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { build } from 'esbuild'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { chromium } from 'playwright'
import { ScrollVarsBoot } from '../../../dist/react/index.js'

const nonce = 'sv-nonce-fixture'
const markup = renderToString(React.createElement(ScrollVarsBoot, { nonce }))
const client = await build({
  stdin: {
    contents: `
      import React from 'react'
      import { hydrateRoot } from 'react-dom/client'
      import { ScrollVarsBoot } from '../../../dist/react/index.js'
      function App() {
        React.useEffect(() => { window.hydrated = true }, [])
        return <ScrollVarsBoot nonce=${JSON.stringify(nonce)} />
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
  response.setHeader('Content-Security-Policy', `default-src 'none'; script-src 'nonce-${nonce}'`)
  response.end(`<div id="app">${markup}</div><script nonce="${nonce}">${client.outputFiles[0].text}</script>`)
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))

const browser = await chromium.launch()
try {
  const page = await browser.newPage()
  const messages = []
  page.on('console', message => messages.push(message.text()))
  await page.goto(`http://127.0.0.1:${server.address().port}`)
  await page.waitForFunction(() => window.hydrated)
  assert.equal(messages.some(message => message.includes('hydrated but some attributes')), false, messages.join('\n'))
  console.log('ok Chromium: nonce CSP does not report a ScrollVarsBoot hydration mismatch')
} finally {
  await browser.close()
  server.close()
}
