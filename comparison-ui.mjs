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
 $('email-form').hidden=!mailerUrl;
 $('send').disabled=!mailerUrl;
 $('newsletter').disabled=!mailerUrl;
}
// Slider max values control drag precision, not company-size eligibility.
// "More +" extends the scale without resetting the selected value.
const RANGE_SCALES={
 workers:[20,100,1000,10000],
 recordsPerWorkerDay:[40,200,1000,10000],
 issueRate:[50],
 toolMonthly:[500,2000,20000,1000000]
};
function rangeLabel(id,max){
 return id==='toolMonthly'?euro(max):id==='issueRate'?max+'%':number(max);
}
function render(){
 const v=values(),r=calculateScenario(v);
 $('workers-value').textContent=number(v.workers);
 $('records-value').textContent=number(v.recordsPerWorkerDay);
 $('rate-value').textContent=number(v.issueRate)+'%';
 $('tool-value').textContent=euro(v.toolMonthly);
 $('attention-hours').textContent=number(r.attentionHours)+' h';
 $('attention-summary').textContent=number(r.affectedRecords)+' of '+number(r.monthlyRecords)+' records may need a check';
 $('freed-hours').textContent=number(r.midHours)+' h';
 $('freed-value').textContent=euro(r.midValue);
 $('current-overhead').textContent=euro(r.currentMonthlyOverhead);
 $('mode-caption').textContent=mode==='tool'?'With your current tool':'Manual checks';
 $('software-explain').textContent=euro(r.currentStaffCost)+' staff review + '+euro(r.currentSoftware)+' existing tool';
 $('tool-inline-effect').textContent='Adds '+euro(r.currentSoftware)+'/month to cost. Review rate stays as selected.';
 for(const id of sliders)setProgress($(id));
 return r;
}
function setMode(next){
 const changed=mode!==next;
 mode=next;
 $('assumptions-toggle').addEventListener('click',()=>{
 const button=$('assumptions-toggle'),details=$('estimate-assumptions');
 const open=button.getAttribute('aria-expanded')==='true';
 button.setAttribute('aria-expanded',String(!open));
 details.hidden=open;
});
for(const button of document.querySelectorAll('[data-baseline]')){
  button.setAttribute('aria-pressed',String(button.dataset.baseline===mode));
 }
 const software=$('software-controls');
 software.hidden=mode==='manual';
 const url=new URL(location.href);
 url.searchParams.set('baseline',mode);
 if(history.replaceState)history.replaceState(null,'',url.pathname+url.search);
 render();
 // Reveal the new, relevant fee control right where the choice was made.
 // Only scroll if needed; do not jump when both controls are already visible.
 if(changed&&mode==='tool'){
  requestAnimationFrame(()=>{
   if(software.getBoundingClientRect().bottom>window.innerHeight-24){
    software.scrollIntoView({block:'nearest',behavior:'smooth'});
   }
  });
 }
}
for(const id of sliders){
 const input=$(id);
 input.addEventListener('input',render);
 input.addEventListener('change',render);
 input.min=String(LIMITS[id][0]);
 input.value=String(DEFAULTS[id]);
 // HTML declares a small initial scale for finer, easier mobile adjustment.
 const ranges=RANGE_SCALES[id];
 input.max=String(ranges[0]);
 $(id+'-max-label').textContent=rangeLabel(id,ranges[0]);
}
for(const button of document.querySelectorAll('[data-expand]')){
 button.addEventListener('click',()=>{
  const id=button.dataset.expand,input=$(id),ranges=RANGE_SCALES[id];
  const current=Number(input.max),i=ranges.findIndex(max=>max===current);
  if(i<0||i===ranges.length-1)return;
  const max=ranges[i+1];
  input.max=String(max);
  $(id+'-max-label').textContent=rangeLabel(id,max);
  button.setAttribute('aria-label','Extend '+id+' range beyond '+rangeLabel(id,max));
  if(i+1===ranges.length-1)button.hidden=true;
  render();
 });
}
for(const button of document.querySelectorAll('[data-baseline]')){
 button.addEventListener('click',()=>setMode(button.dataset.baseline));
}
$('email-form').addEventListener('submit',event=>{
 event.preventDefault();
 const address=$('recipient').value.trim();
 if(!mailerUrl){
  $('email-status').textContent='Email sending is not connected yet. Copy your estimate instead.';
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
