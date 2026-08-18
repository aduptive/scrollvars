# scrollvars demo

`index.html` is the self-contained showcase (16 scroll/pointer patterns, driver
inlined, assets embedded). Published as a private artifact; open locally with
any static server.

`webgl-entry.js` is the source of the three.js bundle inlined at the bottom of
the page (duck product tour). Rebuild with:

    npx esbuild webgl-entry.js --bundle --minify --format=iife \
      --loader:.glb=binary --outfile=bundle.min.js

(needs `npm i three` and the Khronos Duck.glb next to it), then replace the
last <script> block of index.html.

Note to future self: the page's inline driver is a hand-maintained copy — if
the demo keeps growing, split sections into sources and inline `dist/` at
build time instead of patching strings.
