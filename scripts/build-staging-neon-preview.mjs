/**
 * Acorde testing preview bundle generator.
 * Emits one allowlisted, no-index Neon Function module. Never loads credentials,
 * API keys, .git, test fixtures or any source outside the explicit public list.
 * The generated output is a test deployment artifact, not a product backend.
 */
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const PUBLIC_FILES=[
  'index.html','privacy.html','calculator.html','calculator-engine.mjs','calculator-ui.mjs',
  'decision-lab.html','setup.html','preview/index.html','preview/operator.html',
  'preview/tokens.css','preview/integrations.html','mvp/index.html','mvp/engine.mjs',
  'testing/integrity/index.html','testing/integrity/engine.mjs',
  'testing/integrity/policy.mjs','testing/story/index.html'
];
const files=Object.create(null);
for(const file of PUBLIC_FILES){
  if(file.startsWith('/')||file.includes('..')||file.includes('\\'))throw Error('bad_public_path');
  files[file]=await readFile(resolve(root,file),'utf8');
}
const revision=String(process.env.GITHUB_SHA||'testing-preview').slice(0,40);
const handler=`
const files=${JSON.stringify(files)};
const mimes={html:"text/html; charset=utf-8",mjs:"text/javascript; charset=utf-8",css:"text/css; charset=utf-8"};
const head={"X-Robots-Tag":"noindex, nofollow, noarchive","Cache-Control":"no-store","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer","X-Frame-Options":"DENY","Content-Security-Policy":"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self'; img-src 'self' data:; form-action 'none'; frame-ancestors 'none'; base-uri 'none'"};
const meta='<meta name="robots" content="noindex,nofollow,noarchive">';
const banner='<div style="background:#242424;color:#fff;padding:7px 18px;text-align:center;font:600 12px Arial,sans-serif">ACORDE · TESTING PREVIEW — NOT PRODUCTION</div>';
export default {async fetch(request){
  let url;try{url=new URL(request.url)}catch{return new Response("Invalid request",{status:400,headers:head})}
  if(!["GET","HEAD"].includes(request.method))return new Response("Method not allowed",{status:405,headers:head});
  if(url.pathname==="/healthz")return Response.json({ok:true,environment:"staging",service:"acorde-static-preview",revision:${JSON.stringify(revision)}},{headers:head});
  let path;try{path=decodeURIComponent(url.pathname)}catch{return new Response("Invalid path",{status:400,headers:head})}
  if(path.includes("..")||path.includes(String.fromCharCode(92))||path.includes(String.fromCharCode(0)))return new Response("Not found",{status:404,headers:head});
  while(path.startsWith("/"))path=path.slice(1);
  if(!path||path.endsWith("/"))path+="index.html";
  if(!Object.hasOwn(files,path))return new Response("Not found",{status:404,headers:head});
  let body=files[path];
  if(path.endsWith(".html"))body=body.replace(/<head>/i,"<head>"+meta).replace(/<body([^>]*)>/i,(_,attrs)=>"<body"+attrs+">"+banner);
  const type=mimes[path.split(".").pop()]||"application/octet-stream";
  return new Response(request.method==="HEAD"?null:body,{status:200,headers:{...head,"Content-Type":type}});
}};
`;
const out=resolve(root,'dist/staging-function/index.mjs');
await mkdir(resolve(root,'dist/staging-function'),{recursive:true});
await writeFile(out,handler,'utf8');
console.log('Generated Acorde static staging function from '+PUBLIC_FILES.length+' allowlisted files; revision '+revision);
