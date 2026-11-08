import test from 'node:test';
import assert from 'node:assert/strict';
import {ASSUMPTIONS,DEFAULTS,calculateScenario,validateScenario,reportText,euro,emailDraftUrl,newsletterUrl} from '../comparison-engine.mjs';
test('default estimate transparently counts handling time rather than inventing ROI',()=>{
 const r=calculateScenario(DEFAULTS);
 assert.equal(r.monthlyRecords,1200);
 assert.equal(r.affectedRecords,96);
 assert.equal(r.attentionHours,16);
 assert.equal(r.currentStaffCost,448);
 assert.equal(r.midHours,8);
 assert.equal(r.midValue,224);
 assert.equal(r.annualMidValue,2688);
 assert.equal(r.lowHours,4.8);
 assert.equal(r.highHours,11.2);
 assert.equal(r.currentSoftware,0);
 assert.equal(r.currentMonthlyOverhead,448);
});
test('100 people scale cleanly with per-worker workload, no timesheets requested',()=>{
 const r=calculateScenario({...DEFAULTS,workers:100});
 assert.equal(r.monthlyRecords,24000);
 assert.equal(r.attentionHours,320);
 assert.equal(r.midValue,4480);
 assert.equal(r.currentMonthlyOverhead,8960);
});
test('one worker scales proportionally, not per company by accident',()=>{
 const r=calculateScenario({...DEFAULTS,workers:1});
 assert.equal(r.monthlyRecords,240);
 assert.equal(r.attentionHours,3.2);
});
test('existing software stays separate from human handling and is not automatically retired',()=>{
 const r=calculateScenario({...DEFAULTS,mode:'tool',toolMonthly:150});
 assert.equal(r.currentSoftware,150);
 assert.equal(r.currentMonthlyOverhead,598);
 assert.equal(r.midValue,224);
 assert.equal(r.illustrativeMonthlyLaborBudget,224);
 assert.match(reportText({...DEFAULTS,mode:'tool'}),/Existing paid dedup tool/);
});
test('all zero issues means zero lost time, even with 100 people',()=>{
 const a=calculateScenario({...DEFAULTS,workers:100,issueRate:0});
 assert.equal(a.attentionHours,0);
 assert.equal(a.midValue,0);
 assert.equal(a.currentMonthlyOverhead,0);
 const b=calculateScenario({...DEFAULTS,workers:100,issueRate:0,mode:'tool',toolMonthly:150});
 assert.equal(b.currentMonthlyOverhead,150);
 assert.equal(b.midValue,0);
});
test('manual mode cannot treat a 150 EUR subscription as already spent',()=>{
 assert.equal(calculateScenario({...DEFAULTS,toolMonthly:2000}).currentSoftware,0);
});
test('reject unrealistic slider values and malformed assumptions',()=>{
 for(const bad of [
 {...DEFAULTS,workers:0},{...DEFAULTS,workers:101},
 {...DEFAULTS,workers:4.2},{...DEFAULTS,recordsPerWorkerDay:41},
 {...DEFAULTS,issueRate:-1},{...DEFAULTS,issueRate:30},
 {...DEFAULTS,toolMonthly:-1},{...DEFAULTS,toolMonthly:3000},
 {...DEFAULTS,mode:'nonsense'},{...DEFAULTS,workers:''}
 ]) assert.throws(()=>validateScenario(bad));
});
test('label assumptions as illustrative, not industry statistics or cash savings',()=>{
 const report=reportText(DEFAULTS);
 assert.match(report,/Acorde — illustrative/);
 assert.match(report,/not industry averages/);
 assert.match(report,/Value of time is not cash saved/);
 assert.match(report,/Acorde pricing and setup are not included/);
 assert.match(report,/€224/);
 assert.equal(ASSUMPTIONS.workingDays,20);
 assert.equal(ASSUMPTIONS.minutesPerAffectedRecord,10);
 assert.equal(euro(150),'€150');
});
test('email draft contains full calculation and needs user to press Send',()=>{
 const uri=emailDraftUrl('test@example.com',DEFAULTS);
 assert.match(uri,/^mailto:test%40example\.com\?subject=/);
 assert.match(decodeURIComponent(uri),/Estimated handling time today: 16 hours\/month/);
 assert.match(decodeURIComponent(uri),/No automatic email delivery/);
 assert.throws(()=>emailDraftUrl('not-an-email',DEFAULTS),/valid email/);
 assert.throws(()=>emailDraftUrl('a@b.com\r\nBcc:evil',DEFAULTS),/valid email/);
});
test('newsletter URL requires an address and explicitly filters campaigns',()=>{
 const uri=newsletterUrl('buyer@example.com',{utm_source:'linkedin',utm_campaign:'<script>',utm_medium:'organic'});
 const url=new URL(uri);
 assert.equal(url.hostname,'tally.so');
 assert.equal(url.pathname,'/r/ArK9ZD');
 assert.equal(url.searchParams.get('subscriber_email'),'buyer@example.com');
 assert.equal(url.searchParams.get('utm_source'),'linkedin');
 assert.equal(url.searchParams.get('utm_medium'),'organic');
 assert.equal(url.searchParams.has('utm_campaign'),false);
 assert.throws(()=>newsletterUrl('bad'),/valid email/);
});
