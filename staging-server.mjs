// Acorde public TESTING preview only.
// This serves a strict allowlist of static files and never mounts application or customer APIs.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const files=new Set([
 'index.html','privacy.html','calculator.html','calculator-engine.mjs','calculator-ui.mjs',
 'comparison.html','comparison-engine.mjs','comparison-ui.mjs',
 'mailer-config.mjs',
 'decision-lab.html','setup.html','preview/index.html','preview/operator.html',
 'preview/tokens.css','preview/integrations.html','mvp/index.html','mvp/engine.mjs',
 'testing/integrity/index.html','testing/integrity/engine.mjs','testing/integrity/policy.mjs',
 'testing/story/index.html'
]);
const mime={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
export function route(pathname){
  let path;
  try{path=decodeURIComponent(pathname)}catch{return null}
  if(path.includes('\0')||path.includes('\\')||path.split('/').includes('..'))return null;
  path=path.replace(/^\/+/,'');
  if(!path||path.endsWith('/'))path+='index.html';
  return files.has(path)?path:null;
}
export function makeHandler(root=process.cwd()){
  return async(req,res)=>{
    const set=(status,body,type='text/plain; charset=utf-8')=>{
      res.writeHead(status,{
        'content-type':type,'cache-control':'no-store','x-content-type-options':'nosniff',
        'referrer-policy':'no-referrer','x-frame-options':'DENY'
      });
      res.end(req.method==='HEAD'?undefined:body);
    };
    if(!['GET','HEAD'].includes(req.method))return set(405,'Method not allowed');
    let url;try{url=new URL(req.url||'/','http://preview.local')}catch{return set(400,'Invalid request')}
    if(url.pathname==='/healthz')return set(200,'ok');
    const file=route(url.pathname);
    if(!file)return set(404,'Not found');
    try{
      const content=await readFile(resolve(root,file));
      const type=mime[file.slice(file.lastIndexOf('.'))]||'application/octet-stream';
      return set(200,content,type);
    }catch{return set(404,'Not found')}
  };
}
if(process.argv[1]&&import.meta.url==='file://'+resolve(process.argv[1])){
  const port=Number(process.env.PORT||4173);
  createServer(makeHandler()).listen(port,'0.0.0.0',()=>process.stdout.write('Acorde static testing preview listening on port '+port+'\n'));
}
