import {PRESETS,FIELD_NAMES,calculate,formatMoney,formatCount,reportText} from './calculator-engine.mjs';
const $=id=>document.getElementById(id),buttons=[...document.querySelectorAll('[data-mode]')];
const qs=new URLSearchParams(location.search);
const ATTRIBUTION=new URLSearchParams();
for(const key of ['utm_source','utm_medium','utm_campaign']){
  const value=qs.get(key);
  if(value&&/^[a-zA-Z0-9_. -]{1,64}$/.test(value))ATTRIBUTION.set(key,value);
}
let mode=Object.hasOwn(PRESETS,qs.get('mode'))?qs.get('mode'):'sales';
function updateLeadLinks(){
  for(const [id,offer] of [['audit-link','audit'],['build-link','implementation']]){
    const link=new URL('https://tally.so/r/5XbAeE');
    link.searchParams.set('offer',offer);
    // These fixed option texts match the public Tally form exactly so neither
    // selected service nor workflow must be entered a second time.
    link.searchParams.set('offer_name',offer==='audit'?'Paid workflow audit':'Six-week implementation');
    link.searchParams.set('flow',mode);
    const flowNames={sales:'Sales enquiries and follow-up',orders:'Orders and fulfilment',operations:'Operations and team handoffs'};
    link.searchParams.set('flow_name',flowNames[mode]);
    link.searchParams.set('source','acorde-calculator');
    for(const [key,value] of ATTRIBUTION)link.searchParams.set(key,value);
    $(id).href=link.toString();
  }
}
let last=null;
function inputs(){const data={};for(const name of FIELD_NAMES)data[name]=$(name).value;return data;}
function labelText(){
  const p=PRESETS[mode];
  $('segment-description').textContent=p.narrative;
  $('volume-label').textContent=p.unit[0].toUpperCase()+p.unit.slice(1)+' per month';
  $('capture-label').textContent=p.issueA+' (%)';
  $('handoff-label').textContent=p.issueB+' (%)';
  $('close-label').textContent=mode==='orders'?'Would complete after recovery (%)':'Would convert to a sale (%)';

}
function resetExample(nextMode=mode){
  mode=nextMode;
  buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
  for(const name of FIELD_NAMES)$(name).value=PRESETS[mode][name];
  $('error').hidden=true;
  updateLeadLinks();
  labelText();
  showEmpty();
  if(history.replaceState)history.replaceState(null,'',location.pathname+'?mode='+encodeURIComponent(mode)+(ATTRIBUTION.size?'&'+ATTRIBUTION.toString():''));
}
function showEmpty(){
  last=null;$('result').classList.add('empty');$('empty-result').hidden=false;$('result-content').hidden=true;
  $('copy-status').textContent='';$('next-step').hidden=true;
}
function render(){
  try{
    const data=inputs(),r=calculate(data),currency=$('currency').value;
    $('annual-revenue').textContent=formatMoney(r.annualRevenue,currency);
    $('monthly-revenue').textContent=formatMoney(r.recoverableRevenue,currency);
    $('range').textContent=formatMoney(r.sensitivityLow,currency)+' – '+formatMoney(r.sensitivityHigh,currency);
    $('gross-at-risk').textContent=formatMoney(r.grossAtRisk,currency);
    $('contribution').textContent=formatMoney(r.contribution,currency);
    $('rework').textContent=formatMoney(r.annualReworkCost,currency);
    $('stage-breakdown').textContent=formatCount(r.affected)+' cases at risk · '+formatCount(r.capture)+' at entry · '+formatCount(r.handoff)+' at handoff';
    $('assumption-note').textContent='Model: '+r.assumptions.closeRate+'% conversion · '+r.assumptions.recoverable+'% recoverable · '+r.assumptions.margin+'% margin';
    const biggest=r.capture>=r.handoff?PRESETS[mode].issueA:PRESETS[mode].issueB;
    $('bottleneck').textContent=r.affected===0?'No cases at risk with these inputs.':'Largest source: '+biggest+'.';
    $('result').classList.remove('empty');$('empty-result').hidden=true;$('result-content').hidden=false;
    $('error').hidden=true;$('next-step').hidden=false;last={mode,data:{...r.assumptions},currency};$('copy-status').textContent='';
    return true;
  }catch(error){$('error').textContent=error.message;$('error').hidden=false;showEmpty();return false;}
}
$('calculator-form').addEventListener('submit',event=>{event.preventDefault();if(render()&&matchMedia('(max-width:850px)').matches)$('result').scrollIntoView({behavior:'smooth',block:'start'});});
$('calculator-form').addEventListener('input',()=>{if(last)render();});
$('currency').addEventListener('change',()=>{if(last)render();});
buttons.forEach(b=>b.addEventListener('click',()=>resetExample(b.dataset.mode)));
$('reset').addEventListener('click',()=>resetExample());
$('copy').addEventListener('click',async()=>{
  if(!last)return;
  const report=reportText(last.mode,last.data,last.currency);
  try{await navigator.clipboard.writeText(report);$('copy-status').textContent='Copied';}
  catch{$('copy-status').textContent='Copy unavailable in this browser. Select the result text instead.';}
});
resetExample(mode);
