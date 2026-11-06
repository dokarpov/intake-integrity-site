import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
execFileSync(process.execPath,['scripts/build-staging-neon-preview.mjs'],{stdio:'ignore'});
const {default:preview}=await import('../dist/staging-function/index.mjs');
const get=(path,method='GET')=>preview.fetch(new Request('https://staging.example.test'+path,{method}));
test('homepage, calculator, private policy and JS are served with correct status',async()=>{
 for(const url of ['/','/calculator.html','/calculator-ui.mjs','/comparison.html','/comparison-engine.mjs','/comparison-ui.mjs','/privacy.html','/mvp/']){
   const response=await get(url);assert.equal(response.status,200,url);
   assert.equal(response.headers.get('x-robots-tag'),'noindex, nofollow, noarchive');
   assert.equal(response.headers.get('cache-control'),'no-store');
 }
 const js=await get('/calculator-engine.mjs');
 assert.match(js.headers.get('content-type'),/javascript/);
 assert.match(await js.text(),/calculate/);
 const home=await (await get('/')).text();
 assert.match(home,/TESTING PREVIEW/);
 assert.match(home,/revenue-loss/);
 assert.match(home,/Compare current tool vs Acorde costs/);
 const comparison=await (await get('/comparison.html')).text();
 assert.match(comparison,/No dedicated automation/);
 assert.match(comparison,/Already paying for a tool/);
 const privacy=await (await get('/privacy.html')).text();
 assert.match(privacy,/Privacy/);
});
test('private paths, traversal, writes and internal API are not exposed',async()=>{
 for(const path of ['/README.md','/scripts/comparison-engine.test.mjs','/.git/config','/.env','/api/me','/scripts/check_public.py','/package.json','/src/service/app.js','/not-found','/%2e%2e/.env'])
   assert.notEqual((await get(path)).status,200,path);
 assert.equal((await get('/calculator.html','POST')).status,405);
 assert.equal((await get('/calculator.html','PUT')).status,405);
 assert.equal((await get('/healthz')).status,200);
});
test('HEAD route returns no body and declared privacy header',async()=>{
 const result=await get('/calculator.html','HEAD');
 assert.equal(result.status,200);
 assert.equal(await result.text(),'');
 assert.match(result.headers.get('content-security-policy'),/form-action 'none'/);
});
