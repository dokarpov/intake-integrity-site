/**
 * Acorde fast estimator. Values are illustrative product assumptions, NOT
 * researched averages, benchmarks, promises, measured dedup rates or a quote.
 *
 * Each record is counted once at most. Estimates staff attention, not lost
 * revenue. All math runs locally, with no analytics, personal-data storage,
 * backend transfer or user profiling.
 */
export const ASSUMPTIONS=Object.freeze({
  workingDays:20,
  minutesPerAffectedRecord:10,
  fullStaffCostPerHourEUR:28,
  lowTimeReduction:0.30,
  midTimeReduction:0.50,
  highTimeReduction:0.70
});
export const DEFAULTS=Object.freeze({
  mode:'manual',workers:5,recordsPerWorkerDay:12,issueRate:8,toolMonthly:150
});
export const LIMITS=Object.freeze({
  workers:[1,10000],
  recordsPerWorkerDay:[1,10000],
  issueRate:[0,100],
  toolMonthly:[0,1000000]
});
export function validateScenario(raw){
  if(!raw||!['manual','tool'].includes(raw.mode))throw new Error('Choose a current process.');
  const v={mode:raw.mode};
  for(const [name,[low,high]] of Object.entries(LIMITS)){
    const value=raw[name];
    if(value===null||value===''||value===undefined)throw new Error('Missing '+name);
    const n=Number(value);
    if(!Number.isFinite(n)||n<low||n>high)throw new Error(name+' is outside its allowed range');
    if(name==='workers'&&!Number.isInteger(n))throw new Error('workers must be a whole number');
    v[name]=n;
  }
  if(v.mode==='manual')v.toolMonthly=0;
  return Object.freeze(v);
}
export function calculateScenario(values){
  const v=validateScenario(values),a=ASSUMPTIONS;
  const monthlyRecords=v.workers*v.recordsPerWorkerDay*a.workingDays;
  const affectedRecords=monthlyRecords*v.issueRate/100;
  const attentionHours=affectedRecords*a.minutesPerAffectedRecord/60;
  const currentStaffCost=attentionHours*a.fullStaffCostPerHourEUR;
  const lowHours=attentionHours*a.lowTimeReduction;
  const midHours=attentionHours*a.midTimeReduction;
  const highHours=attentionHours*a.highTimeReduction;
  const midValue=midHours*a.fullStaffCostPerHourEUR;
  const currentSoftware=v.mode==='tool'?v.toolMonthly:0;
  return Object.freeze({
    settings:v,monthlyRecords,affectedRecords,
    attentionHours,currentStaffCost,currentSoftware,
    currentMonthlyOverhead:currentStaffCost+currentSoftware,
    lowHours,midHours,highHours,
    midValue,annualHours:attentionHours*12,
    annualMidValue:midValue*12,
    // Labor-only upper limit for *potentially* offsetting recurring fees.
    // Does not assume layoffs, cancelled licences or implementation payback.
    illustrativeMonthlyLaborBudget:midValue
  });
}
export const euro=(v)=>new Intl.NumberFormat('en-IE',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(v);
export const number=(v)=>new Intl.NumberFormat('en-GB',{maximumFractionDigits:1}).format(v);
export function reportText(values){
 const r=calculateScenario(values),a=ASSUMPTIONS;
 return [
  'Acorde · monthly duplicate-review estimate',
  'People: '+r.settings.workers,
  'Records per person/day: '+r.settings.recordsPerWorkerDay,
  'Records requiring review: '+number(r.affectedRecords)+' ('+r.settings.issueRate+'%)',
  'Review time: '+number(r.attentionHours)+' hours/month',
  'Potential capacity at 50% fewer checks: '+number(r.midHours)+' hours/month',
  'Value of this time: '+euro(r.midValue)+'/month',
  'Current cost: '+euro(r.currentMonthlyOverhead)+'/month ('+euro(r.currentStaffCost)+' staff + '+euro(r.currentSoftware)+' existing tool)',
  'Illustrative assumptions: '+a.workingDays+' workdays, '+a.minutesPerAffectedRecord+' minutes/case, '+euro(a.fullStaffCostPerHourEUR)+'/staff-hour. The 50% reduction is a scenario, not measured savings.',
  'Acorde pricing and setup are not included.'
 ].join('\n');
}
