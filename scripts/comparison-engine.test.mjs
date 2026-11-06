import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLES,compareCosts,validateComparison,comparisonReport,money} from '../comparison-engine.mjs';
test('manual baseline includes all labour even with no automation licence',()=>{
 const r=compareCosts(EXAMPLES.manual);
 assert.equal(r.current.software,0);
 assert.equal(r.current.review,1200);
 assert.equal(r.current.correction,300);
 assert.equal(r.current.monthly,1500);
 assert.equal(r.current.firstYear,18000);
 assert.equal(r.proposed.review,420);
 assert.equal(r.proposed.correction,120);
 assert.equal(r.proposed.monthly,865);
 assert.equal(r.proposed.firstYear,11580);
 assert.equal(r.monthlyEquivalentNew,965);
 assert.equal(r.firstYearDifference,6420);
 assert.equal(r.monthlyDifference,635);
 assert.equal(r.hoursDifference,32);
});
test('existing tool includes a genuine software fee and human cost',()=>{
 const r=compareCosts(EXAMPLES.tool);
 assert.equal(r.current.software,180);
 assert.equal(r.current.monthly,1230);
 assert.equal(r.current.firstYear,14760);
 assert.equal(r.firstYearDifference,3180);
 assert.equal(r.assumptions.toolName,'Existing dedup tool');
});
test('all zero inputs produce no artificial savings or cost',()=>{
 const zero=Object.fromEntries(Object.keys(EXAMPLES.tool).map(key=>[key,0]));
 zero.mode='tool';zero.toolName='';
 const r=compareCosts(zero);
 assert.equal(r.current.firstYear,0);
 assert.equal(r.proposed.firstYear,0);
 assert.equal(r.monthlyDifference,0);
 assert.equal(r.firstYearDifference,0);
});
test('proposal may cost more; negative cost difference is retained',()=>{
 const r=compareCosts({...EXAMPLES.manual,newSoftwareMonthly:5000});
 assert.ok(r.firstYearDifference<0);
 assert.ok(r.monthlyDifference<0);
});
test('first-year setup is not charged every month after year one',()=>{
 const x=compareCosts({...EXAMPLES.manual,newSetupOneOff:12000});
 assert.equal(x.proposed.monthly,865);
 assert.equal(x.proposed.firstYear,22380);
 assert.equal(x.afterFirstYearDifference,7620);
 assert.equal(x.monthlyEquivalentNew,1865);
});
test('manual mode cannot accidentally count existing software fees',()=>{
 const x=compareCosts({...EXAMPLES.manual,currentSoftwareMonthly:99999});
 assert.equal(x.current.software,0);
});
test('existing-tool mode requires explicit licence even if it is free or included',()=>{
 assert.throws(()=>compareCosts({...EXAMPLES.tool,currentSoftwareMonthly:''}),/Enter currentSoftwareMonthly/);
 assert.equal(compareCosts({...EXAMPLES.tool,currentSoftwareMonthly:0}).current.software,0);
});
test('new fees and manual-hour forecasts must be supplied, not treated as free',()=>{
 for(const key of ['hourlyCost','newReviewHours','newFixHours','newSoftwareMonthly','newOperationsMonthly','newSetupOneOff','currentReviewHours','currentFixHours']){
  assert.throws(()=>compareCosts({...EXAMPLES.manual,[key]:''}),/Enter/);
 }
});
test('invalid values fail closed rather than offering fabricated savings',()=>{
 for(const bad of [
  {...EXAMPLES.manual,mode:'unknown'},
  {...EXAMPLES.manual,newSoftwareMonthly:-1},
  {...EXAMPLES.manual,currentReviewHours:Infinity},
  {...EXAMPLES.manual,newFixHours:'not-a-number'},
  {...EXAMPLES.manual,newSetupOneOff:10000001},
  {...EXAMPLES.manual,hourlyCost:1001}
 ]) assert.throws(()=>validateComparison(bad));
});
test('report includes assumptions, signed difference and no false vendor pricing',()=>{
 const report=comparisonReport(EXAMPLES.tool,'EUR');
 assert.match(report,/Existing dedup tool/);
 assert.match(report,/Current first-year total: €14,760/);
 assert.match(report,/Proposed first-year total: €11,580/);
 assert.match(report,/First-year difference, current minus proposed: €3,180/);
 assert.match(report,/not a vendor quote/);
 assert.match(report,/Does not include revenue recovery/);
 assert.match(money(1234,'GBP'),/1,234/);
 assert.throws(()=>money(10,'BTC'),/supported currency/);
});
