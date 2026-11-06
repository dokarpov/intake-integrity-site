import {MODES,FIELDS,EXAMPLES,compareCosts,money,comparisonReport} from './comparison-engine.mjs';
const $=id=>document.getElementById(id);
const modeButtons=[...document.querySelectorAll('[data-baseline]')];
const params=new URLSearchParams(location.search);
const VALID_CURRENCIES=['EUR','USD','GBP','AED','MXN'];
const currency=params.get('currency');
if(VALID_CURRENCIES.includes(currency))$('currency').value=currency;
const campaign=new URLSearchParams();
for(const key of ['utm_source','utm_medium','utm_campaign']){
 const value=params.get(key);
 if(value&&/^[a-zA-Z0-9_. -]{1,64}$/.test(value))campaign.set(key,value);
}
let mode=MODES.includes(params.get('baseline'))?params.get('baseline'):'manual';
let last=null;
function linkOffers(){
 const map=[['audit-link','audit','Paid workflow audit'],['build-link','implementation','Six-week implementation']];
 for(const [id,offer,name] of map){
  const url=new URL('https://tally.so/r/5XbAeE');
  url.searchParams.set('offer',offer);
  url.searchParams.set('offer_name',name);
  url.searchParams.set('flow','sales');
  url.searchParams.set('flow_name','Sales enquiries and follow-up');
  url.searchParams.set('source','acorde-cost-comparison');
  for(const [key,value] of campaign)url.searchParams.set(key,value);
  $(id).href=url.toString();
 }
}
function empty(){
 last=null;
 $('results-empty').hidden=false;
 $('results-data').hidden=true;
 $('copy').disabled=true;
 $('copy-status').textContent='';
}
function setMode(next){
 mode=next;
 modeButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.baseline===mode)));
 $('current-software-field').hidden=mode==='manual';
 $('currentSoftwareMonthly').disabled=mode==='manual';
 $('tool-name-field').hidden=mode==='manual';
 $('baseline-label').textContent=mode==='manual'?'Manual process — no dedicated dedup tool':'Existing software + manual review';
 $('baseline-hint').textContent=mode==='manual'
  ? 'Licence assumed €0. Staff time and correction costs still count.'
  : 'Enter your contracted licence, including seats/add-ons. Do not assume CRM licence equals dedup price.';
 $('error').textContent='';
 empty();
 if(history.replaceState){
  const next=new URL(location.href);
  next.searchParams.set('baseline',mode);
  history.replaceState(null,'',next.pathname+next.search);
 }
}
function values(){
 const input={mode,toolName:$('toolName').value};
 for(const key of FIELDS)input[key]=key==='currentSoftwareMonthly'&&mode==='manual'?0:$(key).value;
 return input;
}
function render(){
 try{
  const result=compareCosts(values()),unit=$('currency').value;
  const fmt=n=>money(n,unit);
  $('current-name').textContent=mode==='manual'?'No automation':result.assumptions.toolName||'Existing tool';
  $('proposed-name').textContent='Acorde — proposed';
  $('current-monthly').textContent=fmt(result.monthlyEquivalentCurrent);
  $('proposed-monthly').textContent=fmt(result.monthlyEquivalentNew);
  $('current-year').textContent=fmt(result.current.firstYear);
  $('proposed-year').textContent=fmt(result.proposed.firstYear);
  $('current-hours').textContent=result.staffHoursCurrent.toLocaleString('en-GB')+' h / month';
  $('proposed-hours').textContent=result.staffHoursNew.toLocaleString('en-GB')+' h / month';
  for(const [id,current,newValue] of [
   ['software',result.current.software*12,result.proposed.software*12],
   ['review',result.current.review*12,result.proposed.review*12],
   ['fix',result.current.correction*12,result.proposed.correction*12],
   ['operations',0,result.proposed.operations*12],
   ['setup',0,result.proposed.setup]
  ]){
   $('current-'+id).textContent=fmt(current);
   $('proposed-'+id).textContent=fmt(newValue);
  }
  const ratio=Math.max(result.current.firstYear,result.proposed.firstYear,1);
  $('current-bar').style.width=(100*result.current.firstYear/ratio)+'%';
  $('proposed-bar').style.width=(100*result.proposed.firstYear/ratio)+'%';
  const diff=result.firstYearDifference;
  $('difference').textContent=fmt(Math.abs(diff));
  $('difference-label').textContent=diff>0?'Lower first-year cost with proposed setup':
    diff<0?'Higher first-year cost with proposed setup':'Equal first-year costs';
  $('difference').dataset.tone=diff>0?'positive':diff<0?'negative':'neutral';
  $('monthly-difference').textContent=(result.monthlyDifference<0?'Higher by ':'Lower by ')+
   fmt(Math.abs(result.monthlyDifference))+' per month after setup';
  if(result.monthlyDifference===0)$('monthly-difference').textContent='Equal monthly running costs after setup';
  $('case-evidence').textContent='With '+result.staffHoursCurrent.toLocaleString('en-GB')+
   ' → '+result.staffHoursNew.toLocaleString('en-GB')+
   ' staff hours per month, at '+fmt(result.assumptions.hourlyCost)+
   '/hour; proposed one-time setup '+fmt(result.proposed.setup)+'.';
  $('results-empty').hidden=true;$('results-data').hidden=false;$('error').textContent='';
  $('copy').disabled=false;last={input:result.assumptions,currency:unit};
  return true;
 }catch(error){
  $('error').textContent=error.message;
  empty();return false;
 }
}
function sample(){
 const preset=EXAMPLES[mode];
 for(const key of FIELDS)$(key).value=preset[key];
 $('toolName').value=preset.toolName;
 $('example-note').textContent='Fictional values loaded. Replace every figure with actual contracts, workload and an Acorde quote.';
 $('example-note').hidden=false;
 render();
}
function clear(){
 for(const key of FIELDS)$(key).value=key==='currentSoftwareMonthly'&&mode==='manual'?'0':'';
 $('toolName').value='';
 $('example-note').hidden=true;
 $('error').textContent='';
 empty();
}
modeButtons.forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.baseline)));
$('comparison-form').addEventListener('submit',event=>{
 event.preventDefault();
 if(render()&&matchMedia('(max-width:850px)').matches){
  $('results').scrollIntoView({behavior:'auto',block:'start'});
 }
});
$('comparison-form').addEventListener('input',()=>{
 if(last)render();
 if(!$('example-note').hidden)$('example-note').textContent='Example edited. Treat all remaining figures as assumptions until verified.';
});
$('currency').addEventListener('change',()=>{if(last)render()});
$('example').addEventListener('click',sample);
$('clear').addEventListener('click',clear);
$('copy').addEventListener('click',async()=>{
 if(!last)return;
 try{
  await navigator.clipboard.writeText(comparisonReport(last.input,last.currency));
  $('copy-status').textContent='Copied with all assumptions';
 }catch{
  $('copy-status').textContent='Clipboard unavailable. Compare the on-screen breakdown.';
 }
});
linkOffers();
setMode(mode);
clear();
