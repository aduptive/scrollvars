import {build} from 'esbuild'
import {createServer} from 'node:http'
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import {join,resolve} from 'node:path'
import {createHash} from 'node:crypto'
const root=fileURLToPath(new URL('../../../',import.meta.url)),fixture=join(root,'demo/bench/harness/fixtures/glass')
const out=resolve(process.env.GLASS_RESULTS||join(root,'node_modules/.cache/glass-review'));mkdirSync(out,{recursive:true})
const built=await build({entryPoints:[join(fixture,'entry.jsx')],bundle:true,format:'esm',target:'es2020',outfile:'entry.js',write:false,define:{'process.env.NODE_ENV':'"production"'}})
const files=new Map(built.outputFiles.map(file=>['/'+file.path.split('/').at(-1),file.contents]))
const bundleSha256=createHash('sha256').update(files.get('/entry.js')).digest('hex')
const html=readFileSync(join(fixture,'index.html'),'utf8').replace('</style>','</style><link rel="stylesheet" href="/entry.css">')
const server=createServer((req,res)=>{
 if(req.method==='POST'&&req.url==='/results'){let body='';req.on('data',chunk=>{body+=chunk;if(body.length>1000000)req.destroy()});req.on('end',()=>{try{const data=JSON.parse(body);data.bundleSha256=bundleSha256;data.recordedAt=new Date().toISOString();writeFileSync(join(out,Date.now()+'.json'),JSON.stringify(data,null,2));console.log('Browser result:',data.userAgent,data.passed);res.end('saved')}catch{res.writeHead(400);res.end()}});return}
 if(req.url==='/'){res.setHeader('Content-Type','text/html');res.end(html);return}
 if(files.has(req.url)){res.setHeader('Content-Type',req.url.endsWith('.css')?'text/css':'text/javascript');res.end(files.get(req.url));return}
 res.writeHead(404);res.end()
})
await new Promise(resolve=>server.listen(Number(process.env.GLASS_PORT||0),'127.0.0.1',resolve));console.log(`http://127.0.0.1:${server.address().port}/`)
