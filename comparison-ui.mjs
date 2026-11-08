import {ASSUMPTIONS,DEFAULTS,LIMITS,calculateScenario,euro,number,reportText} from './comparison-engine.mjs';
import {MAILER_URL} from './mailer-config.mjs';

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
// No sender address, passwords, auth tokens or secret API keys in public JS.
// Once the owner deploys Apps Script, this is a native cross-origin FORM POST;
// no browser-side CORS workaround, arbitrary email content, or Tally involved.
function trustedMailerUrl(){
 try{
  const u=new URL(MAILER_URL);
  if(u.protocol!=='https:'||u.host!=='script.google.com'||
    !/^\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(u.pathname)||u.search||u.hash)return null;
  return u.href;
 }catch{return null;}
}
const mailerUrl=trustedMailerUrl();
function updateDeliveryGate(){
 $('send').disabled=!mailerUrl;
 $('consent-control').hidden=!mailerUrl;
 $('mailer-state').textContent=mailerUrl
  ? 'Connected to the owner-authorized Google sender. The report will be emailed by Acorde; delivery to your inbox is not guaranteed.'
  : 'Direct sending needs a one-time Google account authorization. No report will be sent yet. Use Copy estimate instead.';
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
$('email-form').addEventListener('submit',event=>{
 event.preventDefault();
 const address=$('recipient').value.trim();
 if(!mailerUrl){
  $('email-status').textContent='Automatic emailing is not connected yet. Use Copy estimate instead.';
  return;
 }
 if(!$('recipient').checkValidity()||!address){
  $('email-status').textContent='Enter a valid email address to receive the estimate.';
  $('recipient').focus();
  return;
 }
 const form=$('email-form');
 form.action=mailerUrl;
 for(const input of form.querySelectorAll('.mailer-payload'))input.remove();
 const fields={action:'send',...values()};
 for(const [key,value] of Object.entries(fields)){
  const input=document.createElement('input');
  input.type='hidden';input.className='mailer-payload';
  input.name=key;input.value=String(value);
  form.append(input);
 }
 $('email-status').textContent='Submitting to the Google email service; the next page will confirm if Google accepted the request.';
 HTMLFormElement.prototype.submit.call(form);
});
$('copy').addEventListener('click',async()=>{
 const report=reportText(values());
 try{
  await navigator.clipboard.writeText(report);
  $('email-status').textContent='Copied your estimate and assumptions.';
 }catch{
  $('email-status').textContent='Copy is unavailable in this browser. Try selecting the results above.';
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
updateDeliveryGate();
setMode(mode);
