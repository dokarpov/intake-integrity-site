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
  workers:[1,100],
  recordsPerWorkerDay:[1,40],
  issueRate:[0,20],
  toolMonthly:[0,2000]
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
    'Acorde — illustrative duplicate-record workload estimate',
    'Current approach: '+(r.settings.mode==='manual'?'No dedicated paid dedup tool':'Existing paid dedup tool'),
    'People handling records: '+r.settings.workers,
    'Records handled per person per day: '+r.settings.recordsPerWorkerDay,
    'Potential duplicate or unclear records: '+r.settings.issueRate+'%',
    'Monthly records in scope: '+number(r.monthlyRecords),
    'Estimated records needing attention: '+number(r.affectedRecords)+' per month',
    'Estimated handling time today: '+number(r.attentionHours)+' hours/month',
    'Possible time freed if 30–70% of handling is removed: '+number(r.lowHours)+'–'+number(r.highHours)+' hours/month',
    'Illustrative 50% midpoint: '+number(r.midHours)+' hours/month',
    'Potential labor-time value at midpoint: '+euro(r.midValue)+'/month',
    'Existing paid tool monthly cost (if entered): '+euro(r.currentSoftware),
    'Assumptions: '+a.workingDays+' workdays/month; '+a.minutesPerAffectedRecord+
      ' minutes/affected record; '+euro(a.fullStaffCostPerHourEUR)+'/staff hour.',
    'All defaults and reduction scenarios are fictional working assumptions, not industry averages.',
    'Value of time is not cash saved. Acorde pricing and setup are not included.',
    'Real savings or feasibility require measured workflow data and an implementation quote.'
  ].join('\n');
}
export function emailDraftUrl(address,values){
  if(typeof address!=='string'||address.length>254||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address))
    throw new Error('Enter a valid email address.');
  const subject='My Acorde time & cost estimate';
  const body=reportText(values)+'\n\nSent from my own email app. No automatic email delivery or mailing-list signup.';
  return 'mailto:'+encodeURIComponent(address)+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
}
export function newsletterUrl(address,utm={}){
  if(typeof address!=='string'||address.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address))
    throw new Error('Enter a valid email address.');
  const url=new URL('https://tally.so/r/ArK9ZD');
  url.searchParams.set('subscriber_email',address);
  for(const name of ['utm_source','utm_medium','utm_campaign']){
    const v=utm[name];
    if(typeof v==='string'&&/^[a-zA-Z0-9_. -]{1,64}$/.test(v))url.searchParams.set(name,v);
  }
  return url.toString();
}
