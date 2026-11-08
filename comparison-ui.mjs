import {ASSUMPTIONS,DEFAULTS,LIMITS,calculateScenario,euro,number,reportText,emailDraftUrl,newsletterUrl} from './comparison-engine.mjs';

const $=id=>document.getElementById(id);
const qs=new URLSearchParams(location.search);
const validCampaign={};
for(const key of ['utm_source','utm_medium','utm_campaign']){
 const value=qs.get(key);
 if(value&&/^[a-zA-Z0-9_. -]{1,64}$/.test(value))validCampaign[key]=value;
}
let mode=qs.get('baseline')==='tool'?'tool':'manual';
const sliders=['workers','recordsPerWorkerDay','issueRate','toolMonthly'];
function values(){
 const v={mode};
 for(const id of sliders)v[id]=Number($(id).value);
 return v;
}
function setProgress(el){
 const low=Number(el.min),high=Number(el.max);
 el.style.setProperty('--progress',((Number(el.value)-low)/(high-low)*100)+'%');
}
function updateNewsletter(){
 const checked=$('newsletter').checked;
 $('newsletter-step').hidden=!checked;
 const address=$('recipient').value.trim();
 const valid=$('recipient').checkValidity()&&address.length>0;
 if(checked&&valid){
  $('newsletter-link').href=newsletterUrl(address,validCampaign);
  $('newsletter-link').removeAttribute('aria-disabled');
  $('newsletter-link').tabIndex=0;
 }else{
  $('newsletter-link').removeAttribute('href');
  $('newsletter-link').setAttribute('aria-disabled','true');
  $('newsletter-link').tabIndex=-1;
 }
}
function render(){
 const v=values(),r=calculateScenario(v);
 $('workers-value').textContent=number(v.workers);
 $('records-value').textContent=number(v.recordsPerWorkerDay);
 $('rate-value').textContent=number(v.issueRate)+'%';
 $('tool-value').textContent=euro(v.toolMonthly);
 $('attention-hours').textContent=number(r.attentionHours)+' h';
 $('attention-summary').textContent='About '+number(r.affectedRecords)+' of '+number(r.monthlyRecords)+' records may need extra attention.';
 $('freed-hours').textContent=number(r.lowHours)+'–'+number(r.highHours)+' h';
 $('freed-value').textContent=euro(r.midValue);
 $('current-overhead').textContent=euro(r.currentMonthlyOverhead);
 $('potential-year').textContent=euro(r.annualMidValue);
 $('free-progress').style.width=(ASSUMPTIONS.midTimeReduction*100)+'%';
 $('software-explain').textContent=mode==='manual'
  ? 'No paid deduplication subscription: €0. Staff time remains a cost.'
  : 'Current deduplication subscription: '+euro(r.currentSoftware)+'/month, in addition to staff time. We do not assume it can be cancelled.';
 $('model-explanation').textContent=''+v.workers+' people × '+v.recordsPerWorkerDay+
  ' records each/day × '+ASSUMPTIONS.workingDays+' workdays = '+number(r.monthlyRecords)+
  ' records/month. At '+v.issueRate+'% needing '+ASSUMPTIONS.minutesPerAffectedRecord+
  ' minutes of attention each, that is '+number(r.attentionHours)+' staff hours/month. Staff time is valued at an illustrative '+
  euro(ASSUMPTIONS.fullStaffCostPerHourEUR)+'/hour. Time-freed range assumes 30–70% less review, with 50% used for the value estimate.';
 for(const id of sliders)setProgress($(id));
 updateNewsletter();
 return r;
}
function setMode(next){
 mode=next;
 for(const button of document.querySelectorAll('[data-baseline]')){
  button.setAttribute('aria-pressed',String(button.dataset.baseline===mode));
 }
 $('software-controls').hidden=mode==='manual';
 const url=new URL(location.href);
 url.searchParams.set('baseline',mode);
 if(history.replaceState)history.replaceState(null,'',url.pathname+url.search);
 render();
}
for(const id of sliders){
 $(id).addEventListener('input',render);
 $(id).addEventListener('change',render);
 $(id).min=String(LIMITS[id][0]);
 $(id).max=String(LIMITS[id][1]);
 $(id).value=String(DEFAULTS[id]);
}
for(const button of document.querySelectorAll('[data-baseline]')){
 button.addEventListener('click',()=>setMode(button.dataset.baseline));
}
$('recipient').addEventListener('input',()=>{
 $('email-status').textContent='';
 updateNewsletter();
});
$('newsletter').addEventListener('change',updateNewsletter);
$('email-form').addEventListener('submit',event=>{
 event.preventDefault();
 const address=$('recipient').value.trim();
 if(!$('recipient').checkValidity()||!address){
  $('email-status').textContent='Enter a valid email address to prepare your report.';
  $('recipient').focus();
  return;
 }
 try{
  const mailto=emailDraftUrl(address,values());
  $('email-status').textContent='Your email app should open with the estimate. Press Send there; Acorde does not send it automatically.';
  updateNewsletter();
  location.href=mailto;
 }catch(error){
  $('email-status').textContent='Could not prepare the email: '+error.message;
 }
});
$('copy').addEventListener('click',async()=>{
 const report=reportText(values());
 try{
  await navigator.clipboard.writeText(report);
  $('email-status').textContent='Copied your estimate and assumptions.';
 }catch{
  $('email-status').textContent='Copy is unavailable in this browser. Use Prepare my email instead.';
 }
});
const audit=new URL('https://tally.so/r/5XbAeE');
audit.searchParams.set('offer','audit');
audit.searchParams.set('offer_name','Paid workflow audit');
audit.searchParams.set('flow','sales');
audit.searchParams.set('flow_name','Sales enquiries and follow-up');
audit.searchParams.set('source','acorde-fast-estimate');
for(const [key,value] of Object.entries(validCampaign))audit.searchParams.set(key,value);
$('audit-link').href=audit.toString();
setMode(mode);
