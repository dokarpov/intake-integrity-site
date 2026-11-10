import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';

const source=fs.readFileSync(new URL('../mail/Code.gs',import.meta.url),'utf8');
const valid={
 action:'send',email:'reader@example.com',mode:'manual',
 workers:'5',recordsPerWorkerDay:'12',issueRate:'8',toolMonthly:'150',companyFax:''
};
function setup(){
 const records=[],props=new Map(),cache=new Map();
 const rows=[['Email','Confirmed UTC','Consent version','Source','Status','Unsubscribe token']];
 const sheet={
  setName(){},appendRow(row){if(row[0]==='Email'&&rows[0]?.[0]==='Email')return;rows.push(row)},
  getDataRange(){return {getValues(){return rows.map(x=>[...x]);}}},
  getRange(r,c){return {setValue(v){rows[r-1][c-1]=v;}}}
 };
 const env={
  Date,Math,JSON,Object,Array,Number,String,Boolean,Error,Intl,RegExp,
  HtmlService:{createHtmlOutput(html){return {html};}},
  PropertiesService:{getScriptProperties(){return {
   getProperty(k){return props.get(k)||null;},
   setProperty(k,v){props.set(k,v);},
   deleteProperty(k){props.delete(k);},
   getProperties(){return Object.fromEntries(props);}
  };}},
  CacheService:{getScriptCache(){return {
   get(k){return cache.get(k)||null;},
   put(k,v){cache.set(k,v);}
  };}},
  LockService:{getScriptLock(){return {tryLock(){return true;},releaseLock(){}};}},
  Utilities:{
   DigestAlgorithm:{SHA_256:'SHA_256'},
   computeDigest(_algo,value){return Array.from(crypto.createHash('sha256').update(value).digest(),b=>b>127?b-256:b);},
   formatDate(date,_zone,_format){return date.toISOString().slice(0,10).replace(/-/g,'');},
   getUuid(){return crypto.randomUUID();}
  },
  ScriptApp:{getService(){return {getUrl(){return 'https://script.google.com/macros/s/AKfycTESTCODE/exec';}};}},
  MailApp:{getRemainingDailyQuota(){return Math.max(0,100-records.length);},sendEmail(payload){records.push(payload);}},
  SpreadsheetApp:{
   create(){return {getId(){return 'test-sheet'},getSheets(){return [sheet]}};},
   openById(){return {getSheets(){return [sheet]}};}
  }
 };
 const scope=vm.createContext(env);
 vm.runInContext(source,scope,{filename:'Code.gs',timeout:1000});
 return {
  records,rows,props,scope,
  post(fields){return scope.doPost({parameter:fields}).html},
  get(fields){return scope.doGet({parameter:fields}).html}
 };
}
test('a valid single POST sends from the authorizing Google account with server-calculated facts',()=>{
 const t=setup(),result=t.post(valid);
 assert.match(result,/Google accepted an Acorde estimate/);
 assert.equal(t.records.length,1);
 const msg=t.records[0];
 assert.equal(msg.to,'reader@example.com');
 assert.equal(msg.name,'Acorde');
 assert.equal(msg.subject,'Your Acorde snapshot: ~16 h/month to investigate');
 assert.match(msg.body,/Estimated time spent on checks: 16 hours\/month/);
 assert.match(msg.body,/€224/);
 assert.match(msg.body,/not included/);
 assert.match(msg.body,/A FREE 7-DAY VALIDATION PLAN/);
 assert.match(msg.body,/REPLY WITH JUST TWO DETAILS/);
 assert.match(msg.body,/Rare issues/);
 assert.match(msg.htmlBody, /Your 7-day verification plan/);
 assert.match(msg.htmlBody, /Possible exceptions \/ month/);
 assert.match(msg.htmlBody, /Your first workflow snapshot/i);
 assert.match(msg.htmlBody, /No ongoing updates/i);
 assert.doesNotMatch(msg.htmlBody, /Confirm updates with a separate step/);
 assert.doesNotMatch(msg.body,/OPTIONAL NEWSLETTER/);
});
test('no GET endpoint or arbitrary body, CC, BCC or sender can deliver mail',()=>{
 const t=setup();
 assert.match(t.get({email:'reader@example.com',action:'send'}),/No messages can be sent using a GET/);
 assert.equal(t.records.length,0);
 t.post({...valid,subject:'ATTACK',body:'spam!',cc:'all@example.com',from:'evil@example.com'});
 assert.equal(t.records.length,1);
 assert.equal(t.records[0].subject,'Your Acorde snapshot: ~16 h/month to investigate');
 assert.doesNotMatch(t.records[0].body,/spam!/);
 assert.equal(t.records[0].cc,undefined);
 assert.equal(t.records[0].from,undefined);
});
test('invalid addresses, bad slider inputs, bots and accidental consent fail closed',()=>{
 const t=setup();
 for(const item of [
  {...valid,email:'evil@example.com\r\nBcc:all@example.com'},
  {...valid,email:'other@example.com,extra@example.com'},
  {...valid,workers:'101'}, {...valid,issueRate:'21'},
  {...valid,toolMonthly:'abc'}, {...valid,mode:'hack'},
  {...valid,newsletter:'false'}
 ]){
  assert.match(t.post(item),/Request not completed/);
 }
 assert.equal(t.records.length,0);
 assert.match(t.post({...valid,companyFax:'bot-bait'}),/Check your inbox/);
 assert.equal(t.records.length,0);
});
test('manual mode does not add current tool fee and exactly 100 workers scale as expected',()=>{
 const t=setup();
 t.post({...valid,workers:'100',toolMonthly:'2000'});
 assert.match(t.records[0].body,/Estimated time spent on checks: 320 hours\/month/);
 assert.match(t.records[0].body,/Existing tool subscription: €0\/month/);
});
test('duplicate requests are throttled and limited to a safe daily cap',()=>{
 const t=setup();
 assert.match(t.post(valid),/Google accepted/);
 assert.match(t.post(valid),/sent to this address recently/);
 assert.equal(t.records.length,1);
 for(let n=1;n<20;n++){
  assert.match(t.post({...valid,email:'user'+n+'@example.com'}),/Google accepted/);
 }
 assert.equal(t.records.length,20);
 assert.match(t.post({...valid,email:'other20@example.com'}),/Daily sending limit reached/);
 assert.equal(t.records.length,20);
});
test('consent interest is not subscription: only a second deliberate POST confirms',()=>{
 const t=setup();
 const output=t.post({...valid,newsletter:'yes',utm_source:'linkedin'});
 assert.match(output,/not subscribed yet/);
 assert.equal(t.records.length,1);
 assert.equal(t.rows.length,1);
 assert.match(t.records[0].htmlBody,/Confirm updates with a separate step/);
 assert.match(t.records[0].htmlBody,/not subscribed yet/i);
 const token=t.records[0].body.match(/confirm=([a-f0-9]{64})/)[1];
 const preview=t.get({confirm:token});
 assert.match(preview,/Confirm subscription/);
 assert.equal(t.rows.length,1);
 const confirmed=t.post({action:'confirm',token});
 assert.match(confirmed,/Subscription confirmed/);
 assert.equal(t.rows.length,2);
 assert.equal(t.rows[1][0],'reader@example.com');
 assert.equal(t.rows[1][4],'active');
 assert.match(t.post({action:'confirm',token}),/expired or already used/);
 const unsubToken=t.rows[1][5];
 assert.equal(t.rows[1][4],'active');
 assert.match(t.get({unsubscribe:unsubToken}),/Stop receiving/);
 assert.equal(t.rows[1][4],'active');
 assert.match(t.post({action:'unsubscribe',token:unsubToken}),/Unsubscribed/);
 assert.equal(t.rows[1][4],'unsubscribed');
});
test('newsletter confirmation rejects nonexistent or expired tokens and unsafe source',()=>{
 const t=setup();
 assert.match(t.post({action:'confirm',token:'x'}),/Invalid or expired link/);
 t.post({...valid,newsletter:'yes',utm_source:'=HYPERLINK("evil")'});
 const token=t.records[0].body.match(/confirm=([a-f0-9]{64})/)[1];
 t.post({action:'confirm',token});
 assert.equal(t.rows[1][3],'');
});
