import test from 'node:test';
import assert from 'node:assert/strict';
import {route,makeHandler} from '../staging-server.mjs';
import {createServer} from 'node:http';

test('allowlisted public files and no private repo paths',()=>{
  assert.equal(route('/'),'index.html');
  assert.equal(route('/calculator.html'),'calculator.html');
  assert.equal(route('/calculator-engine.mjs'),'calculator-engine.mjs');
  assert.equal(route('/comparison.html'),'comparison.html');
  assert.equal(route('/comparison-ui.mjs'),'comparison-ui.mjs');
  assert.equal(route('/preview/'),'preview/index.html');
  assert.equal(route('/mvp/'),'mvp/index.html');
  for(const path of ['/.github/workflows/deploy.yml','/README.md','/scripts/revenue-calculator.test.mjs','/scripts/comparison-engine.test.mjs','/src/service/app.js','/%2E%2E/.env'])
    assert.equal(route(path),null);
});

test('safe server returns proper JS mime and blocks writes',async()=>{
  const server=createServer(makeHandler());
  await new Promise(res=>server.listen(0,'127.0.0.1',res));
  const base='http://127.0.0.1:'+server.address().port;
  try{
    const js=await fetch(base+'/calculator-engine.mjs');
    assert.equal(js.status,200);
    assert.match(js.headers.get('content-type'),/javascript/);
    assert.match(await js.text(),/calculate/);
    const compared=await fetch(base+'/comparison.html');
    assert.equal(compared.status,200);
    const compareJs=await fetch(base+'/comparison-engine.mjs');
    assert.match(compareJs.headers.get('content-type'),/javascript/);
    const forbidden=await fetch(base+'/.git/config');
    assert.equal(forbidden.status,404);
    const post=await fetch(base+'/calculator.html',{method:'POST'});
    assert.equal(post.status,405);
    const health=await fetch(base+'/healthz');
    assert.equal(health.status,200);
  }finally{await new Promise(res=>server.close(res))}
});
