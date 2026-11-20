# ScrollVars demo

`index.html` is the showcase published at https://scrollvars.dev/. Preview this directory with a local static server.

`webgl-entry.js` is the source of the three.js bundle inlined at the bottom of
the page (duck product tour). Rebuild with:

    npx esbuild webgl-entry.js --bundle --minify --format=iife \
      --loader:.glb=binary --outfile=bundle.min.js

(needs `npm i three` and the Khronos Duck.glb next to it), then replace the
last <script> block of index.html.

Run `npm run demo:sync` at the repository root to rebuild the inline engine,
reference pages and gallery. Follow the release steps in ../CONTRIBUTING.md.
