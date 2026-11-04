/**
 * Acorde revenue leakage scenario model.
 * All presets are illustrative starting values, not observed industry benchmarks.
 * No analytics requests or personal-data storage are performed by this module.
 */
export const PRESETS=Object.freeze({
  sales:{
    label:'Sales enquiries',unit:'enquiries',volume:250,avgValue:1800,closeRate:22,
    captureLoss:5,handoffLoss:9,recoverable:45,margin:35,
    reworkMinutes:8,hourlyCost:28,
    issueA:'Missed or unassigned enquiries',issueB:'Dropped during follow-up',
    narrative:'Enquiries lost between the first message, a responsible owner and the next action.',
    audit:'Follow the same enquiry across inbox, CRM ownership, activity history and outcome.'
  },
  orders:{
    label:'Orders',unit:'order attempts',volume:1200,avgValue:110,closeRate:90,
    captureLoss:2.5,handoffLoss:4,recoverable:45,margin:30,
    reworkMinutes:10,hourlyCost:22,
    issueA:'Orders lost at capture or payment',issueB:'Orders lost after handoff',
    narrative:'Orders that fail between checkout, payment confirmation, fulfilment and support.',
    audit:'Reconcile placed orders, payment states, fulfilment exceptions and cancellation reasons.'
  },
  operations:{
    label:'Operations',unit:'billable requests',volume:400,avgValue:450,closeRate:60,
    captureLoss:4,handoffLoss:6,recoverable:35,margin:40,
    reworkMinutes:15,hourlyCost:32,
    issueA:'Requests not registered correctly',issueB:'Lost or delayed handoffs',
    narrative:'Billable requests lost between intake, assignment, scheduling and completion.',
    audit:'Trace a request from intake to owner, SLA, completion and invoice evidence.'
  }
});
export const VALID_CURRENCIES=Object.freeze(['EUR','USD','GBP','AED','MXN']);
export const BOUNDS=Object.freeze({
  volume:[0,1000000],avgValue:[0,10000000],closeRate:[0,100],
  captureLoss:[0,100],handoffLoss:[0,100],recoverable:[0,100],
  margin:[0,100],reworkMinutes:[0,1440],hourlyCost:[0,5000]
});
export const FIELD_NAMES=Object.freeze(Object.keys(BOUNDS));
export function validate(values){
  if(!values || typeof values!=='object')throw new Error('Enter valid business inputs.');
  const clean={};
  for(const key of FIELD_NAMES){
    const raw=values[key];
    if(raw===''||raw===null||raw===undefined)throw new Error('Enter '+key+' before calculating.');
    const n=Number(raw),[min,max]=BOUNDS[key];
    if(!Number.isFinite(n)||n<min||n>max)throw new Error(key+' must be between '+min+' and '+max+'.');
    clean[key]=n;
  }
  return clean;
}
export function calculate(values){
  const v=validate(values);
  // Sequential, mutually exclusive stages: a request cannot be lost twice.
  const capture=v.volume*v.captureLoss/100;
  const handoff=(v.volume-capture)*v.handoffLoss/100;
  const affected=capture+handoff;
  const estimatedTransactions=affected*v.closeRate/100;
  const grossAtRisk=estimatedTransactions*v.avgValue;
  const recoverableRevenue=grossAtRisk*v.recoverable/100;
  const contribution=recoverableRevenue*v.margin/100;
  // Staff rework is a separate operating-cost scenario, never added to revenue.
  const avoidableReworkCost=affected*v.recoverable/100*v.reworkMinutes/60*v.hourlyCost;
  return Object.freeze({
    capture,handoff,affected,estimatedTransactions,grossAtRisk,
    recoverableRevenue,contribution,avoidableReworkCost,
    annualRevenue:recoverableRevenue*12,
    annualContribution:contribution*12,
    annualReworkCost:avoidableReworkCost*12,
    annualAtRisk:grossAtRisk*12,
    sensitivityLow:grossAtRisk*(v.recoverable*0.5/100)*12,
    sensitivityHigh:grossAtRisk*(Math.min(100,v.recoverable*1.5)/100)*12,
    assumptions:v
  });
}
export function formatMoney(amount,currency='EUR'){
  const code=VALID_CURRENCIES.includes(currency)?currency:'EUR';
  return new Intl.NumberFormat('en-GB',{style:'currency',currency:code,maximumFractionDigits:0}).format(amount);
}
export function formatCount(n){
  return new Intl.NumberFormat('en-GB',{maximumFractionDigits:1}).format(n);
}
export function reportText(mode,values,currency='EUR'){
  if(!Object.hasOwn(PRESETS,mode))throw new Error('Unknown business scenario.');
  const result=calculate(values), p=PRESETS[mode];
  return [
    'Acorde — illustrative revenue-loss model',
    'Business flow: '+p.label,
    'Monthly '+p.unit+': '+formatCount(values.volume),
    'Average value: '+formatMoney(values.avgValue,currency),
    'Conversion after recovery: '+values.closeRate+'%',
    'Missed at intake: '+values.captureLoss+'% of total',
    'Handoff failures: '+values.handoffLoss+'% of remaining',
    'Potentially preventable share: '+values.recoverable+'%',
    'Contribution margin: '+values.margin+'%',
    'At-risk '+p.unit+' per month: '+formatCount(result.affected),
    'Potential recoverable revenue per month: '+formatMoney(result.recoverableRevenue,currency),
    'Annual scenario: '+formatMoney(result.annualRevenue,currency),
    'Annual sensitivity range: '+formatMoney(result.sensitivityLow,currency)+' to '+formatMoney(result.sensitivityHigh,currency),
    'Potential contribution per month: '+formatMoney(result.contribution,currency),
    'Potential annual rework cost avoided (separate): '+formatMoney(result.annualReworkCost,currency),
    '',
    'This is an editable scenario, not a verified loss or guaranteed recovery.',
    'An audit must validate source data, causality, conversion and recovery feasibility.'
  ].join('\n');
}
