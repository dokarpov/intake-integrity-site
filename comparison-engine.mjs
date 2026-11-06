/**
 * Operating-cost scenario only. Not an ROI prediction, vendor price quote, or
 * a claim about the separate revenue-at-risk calculator.
 * Baseline includes staff work even when the software licence is zero.
 */
export const LIMITS=Object.freeze({
 hourlyCost:[0,1000],currentReviewHours:[0,100000],currentFixHours:[0,100000],
 currentSoftwareMonthly:[0,10000000],newReviewHours:[0,100000],
 newFixHours:[0,100000],newSoftwareMonthly:[0,10000000],
 newOperationsMonthly:[0,10000000],newSetupOneOff:[0,10000000]
});
export const FIELDS=Object.freeze(Object.keys(LIMITS));
export const MODES=Object.freeze(['manual','tool']);
export const EXAMPLES=Object.freeze({
 manual:Object.freeze({
  mode:'manual',toolName:'',hourlyCost:30,currentReviewHours:40,
  currentFixHours:10,currentSoftwareMonthly:0,newReviewHours:14,
  newFixHours:4,newSoftwareMonthly:250,newOperationsMonthly:75,newSetupOneOff:1200
 }),
 tool:Object.freeze({
  mode:'tool',toolName:'Existing dedup tool',hourlyCost:30,currentReviewHours:25,
  currentFixHours:10,currentSoftwareMonthly:180,newReviewHours:14,
  newFixHours:4,newSoftwareMonthly:250,newOperationsMonthly:75,newSetupOneOff:1200
 })
});
function readNumber(name,raw){
 if(raw===''||raw===undefined||raw===null)throw Error('Enter '+name+' (use 0 if none).');
 const value=Number(raw),[min,max]=LIMITS[name];
 if(!Number.isFinite(value)||value<min||value>max)throw Error(name+' must be between '+min+' and '+max+'.');
 return value;
}
export function validateComparison(input){
 if(!input||!MODES.includes(input.mode))throw Error('Choose an existing setup.');
 const fields={};
 for(const name of FIELDS)fields[name]=input.mode==='manual'&&name==='currentSoftwareMonthly'?0:readNumber(name,input[name]);
 return Object.freeze({...fields,mode:input.mode,toolName:String(input.toolName||'').trim().slice(0,80)});
}
export function compareCosts(input){
 const v=validateComparison(input);
 const currentReview=v.currentReviewHours*v.hourlyCost;
 const currentFix=v.currentFixHours*v.hourlyCost;
 const newReview=v.newReviewHours*v.hourlyCost;
 const newFix=v.newFixHours*v.hourlyCost;
 const currentMonthly=v.currentSoftwareMonthly+currentReview+currentFix;
 const newMonthly=v.newSoftwareMonthly+v.newOperationsMonthly+newReview+newFix;
 const currentAnnual=currentMonthly*12;
 const newAnnual=newMonthly*12+v.newSetupOneOff;
 const monthlyDifference=currentMonthly-newMonthly;
 const firstYearDifference=currentAnnual-newAnnual;
 return Object.freeze({
  assumptions:v,
  current:Object.freeze({software:v.currentSoftwareMonthly,review:currentReview,
   correction:currentFix,operations:0,setup:0,monthly:currentMonthly,
   firstYear:currentAnnual}),
  proposed:Object.freeze({software:v.newSoftwareMonthly,review:newReview,
   correction:newFix,operations:v.newOperationsMonthly,
   setup:v.newSetupOneOff,monthly:newMonthly,firstYear:newAnnual}),
  monthlyDifference,firstYearDifference,
  monthlyEquivalentCurrent:currentMonthly,
  monthlyEquivalentNew:newAnnual/12,
  afterFirstYearDifference:monthlyDifference*12,
  staffHoursCurrent:v.currentReviewHours+v.currentFixHours,
  staffHoursNew:v.newReviewHours+v.newFixHours,
  hoursDifference:(v.currentReviewHours+v.currentFixHours)-(v.newReviewHours+v.newFixHours)
 });
}
export function money(value,currency='EUR'){
 if(!['EUR','USD','GBP','AED','MXN'].includes(currency))throw Error('Choose a supported currency.');
 return new Intl.NumberFormat('en-GB',{style:'currency',currency,
  maximumFractionDigits:0}).format(value);
}
export function comparisonReport(input,currency='EUR'){
 const r=compareCosts(input),baseline=r.assumptions.mode==='manual'?'No dedicated automation':(r.assumptions.toolName||'Existing tool');
 return [
  'Acorde — editable operating-cost comparison (not a vendor quote)',
  'Current approach: '+baseline,
  'All values in '+currency+'. First year includes one-time setup.',
  'Current software / month: '+money(r.current.software,currency),
  'Current review staff hours / month: '+r.assumptions.currentReviewHours,
  'Current correction staff hours / month: '+r.assumptions.currentFixHours,
  'New Acorde software / month (user-entered scenario, not price): '+money(r.proposed.software,currency),
  'New operating & integration / month: '+money(r.proposed.operations,currency),
  'New review staff hours / month: '+r.assumptions.newReviewHours,
  'New correction staff hours / month: '+r.assumptions.newFixHours,
  'Staff cost / hour: '+money(r.assumptions.hourlyCost,currency),
  'New one-off setup: '+money(r.proposed.setup,currency),
  'Current first-year total: '+money(r.current.firstYear,currency),
  'Proposed first-year total: '+money(r.proposed.firstYear,currency),
  'First-year difference, current minus proposed: '+money(r.firstYearDifference,currency),
  'Monthly difference after setup, current minus proposed: '+money(r.monthlyDifference,currency),
  'A negative difference means Acorde costs more under these assumptions.',
  'Does not include revenue recovery, prevented fines or unverified error reduction.',
  'All figures are user-supplied or fictional examples. Verify actual contracts, workload and pilot performance before buying.'
 ].join('\n');
}
