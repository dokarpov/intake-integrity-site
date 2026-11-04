import {PRESETS,FIELD_NAMES,calculate,formatMoney,formatCount,reportText} from './calculator-engine.mjs';
const $=id=>document.getElementById(id),buttons=[...document.querySelectorAll('[data-mode]')];
const qs=new URLSearchParams(location.search);let mode=Object.hasOwn(PRESETS,qs.get('mode'))?qs.get('mode'):'sales';
let last=null;
function inputs(){const data={};for(const name of FIELD_NAMES)data[name]=$(name).value;return data;}
function labelText(){
  const p=PRESETS[mode];
  $('segment-description').textContent=p.narrative;
  $('volume-label').textContent=p.unit[0].toUpperCase()+p.unit.slice(1)+' per month';
  $('capture-label').textContent=p.issueA+' (%)';
  $('handoff-label').textContent=p.issueB+' (%)';
  $('close-label').textContent=mode==='orders'?'Would complete after recovery (%)':'Would convert to a sale (%)';
  $('audit-evidence').textContent='Audit next: '+p.audit;
}
function resetExample(nextMode=mode){
  mode=nextMode;
  buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
  for(const name of FIELD_NAMES)$(name).value=PRESETS[mode][name];
  $('error').hidden=true;
  labelText();
  showEmpty();
  if(history.replaceState)history.replaceState(null,'',location.pathname+'?mode='+encodeURIComponent(mode));
}
function showEmpty(){
  last=null;$('result').classList.add('empty');$('empty-result').hidden=false;$('result-content').hidden=true;
  $('copy-status').textContent='';

}
function render(){
  try{
    const data=inputs(),r=calculate(data),currency=$('currency').value;
    $('annual-revenue').textContent=formatMoney(r.annualRevenue,currency);
    $('monthly-revenue').textContent=formatMoney(r.recoverableRevenue,currency);
    $('gross-at-risk').textContent=formatMoney(r.grossAtRisk,currency);
    $('contribution').textContent=formatMoney(r.contribution,currency);
    $('rework').textContent=formatMoney(r.annualReworkCost,currency);
    $('stage-breakdown').textContent=formatCount(r.capture)+' '+PRESETS[mode].unit+' missed at entry + '+formatCount(r.handoff)+' lost later = '+formatCount(r.affected)+' at-risk cases per month, with no double-counting.';
    const biggest=r.capture>=r.handoff?PRESETS[mode].issueA:PRESETS[mode].issueB;
    $('bottleneck').textContent=r.affected===0?'Your input scenario has zero at-risk cases. Validate the baseline before assuming there is an implementation opportunity.':'The larger modeled failure stage is: '+biggest+'. This is a hypothesis for the audit, not a diagnosed root cause.';
    $('result').classList.remove('empty');$('empty-result').hidden=true;$('result-content').hidden=false;
    $('error').hidden=true;last={mode,data:{...r.assumptions},currency};$('copy-status').textContent='';
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
