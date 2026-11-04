import test from 'node:test';
import assert from 'node:assert/strict';
import {PRESETS,calculate,validate,formatMoney,reportText} from '../calculator-engine.mjs';

test('sequential failure stages do not double-count the same enquiry',()=>{
  const x=calculate({...PRESETS.sales,volume:100,avgValue:100,closeRate:100,captureLoss:10,handoffLoss:20,recoverable:50,margin:30,reworkMinutes:0,hourlyCost:0});
  assert.equal(x.capture,10);
  assert.equal(x.handoff,18);
  assert.equal(x.affected,28);
  assert.equal(x.grossAtRisk,2800);
  assert.equal(x.recoverableRevenue,1400);
  assert.equal(x.contribution,420);
  assert.equal(x.annualRevenue,16800);
});
test('zero failures result in zero exposure across all flow types',()=>{
  for(const preset of Object.values(PRESETS)){
    const x=calculate({...preset,captureLoss:0,handoffLoss:0});
    assert.equal(x.recoverableRevenue,0);
    assert.equal(x.avoidableReworkCost,0);
  }
});
test('no assumed recoverability results in no modeled incremental revenue',()=>{
  const x=calculate({...PRESETS.orders,recoverable:0});
  assert.equal(x.recoverableRevenue,0);
  assert.equal(x.annualContribution,0);
  assert.ok(x.grossAtRisk>=0);
});
test('staff time does not inflate incremental revenue',()=>{
  const base=calculate({...PRESETS.operations,reworkMinutes:0,hourlyCost:0});
  const expensive=calculate({...PRESETS.operations,reworkMinutes:200,hourlyCost:150});
  assert.equal(base.recoverableRevenue,expensive.recoverableRevenue);
  assert.equal(base.contribution,expensive.contribution);
  assert.ok(expensive.avoidableReworkCost>base.avoidableReworkCost);
});
test('user-entered percentages and values are bounded and errors are actionable',()=>{
  for(const bad of [{...PRESETS.sales,volume:-1},{...PRESETS.sales,closeRate:101},{...PRESETS.orders,avgValue:Infinity},{...PRESETS.sales,margin:''},{...PRESETS.sales,captureLoss:NaN}])
    assert.throws(()=>validate(bad));
  assert.doesNotThrow(()=>calculate(PRESETS.sales));
});
test('all three scenarios have nonzero editable presets and transparent reports',()=>{
  for(const [mode,p] of Object.entries(PRESETS)){
    const result=calculate(p);
    assert.ok(result.annualRevenue>0);
    assert.match(reportText(mode,p,'EUR'),/illustrative revenue-loss model/);
    assert.match(reportText(mode,p,'EUR'),/not a verified loss/);
  }
  assert.match(formatMoney(1200,'EUR'),/1,200/);
});
