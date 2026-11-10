/**
 * Acorde direct email, Google Apps Script V8.
 *
 * Deploy as a Web App: execute as "Me", access "Anyone".
 * Google MailApp sends from the Google account that grants authorization.
 * Never expose Gmail passwords, app passwords or OAuth tokens to Acorde JS.
 *
 * POST fields are a fixed, bounded workload scenario; user-supplied message
 * text, subject, attachments, CC/BCC, redirects and sender are NOT accepted.
 * All displayed/sent totals are independently recomputed on this server.
 *
 * Safeguard for a small owner-approved test: max 20 sends/day, max 2 per
 * recipient/day and 60-minute repeat suppression, all fail-closed.
 * A public production endpoint still requires a bot challenge / abuse review.
 */
const ACORDE_SETTINGS = Object.freeze({
  workingDays:20,
  minutesPerAffectedRecord:10,
  loadedCostPerHour:28,
  globalDailyLimit:20,
  perRecipientDailyLimit:2,
  perRecipientCooldownSeconds:3600,
  consentValidityHours:48
});
const ACORDE_HOME='https://br-shiny-union-bajmnaa3-acordepreview.compute.c-8.eu-central-1.aws.neon.tech/comparison.html';
const CONSENT_VERSION='2026-11-08-optional-useful-guides-v1';

function esc(text){
  return String(text).replace(/[&<>"']/g,function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
  });
}
function cleanEmail(input){
  const v=String(input||'').trim();
  // This intentionally excludes unusual mailbox syntax; no commas/headers.
  if(v.length<6||v.length>254||!/^[A-Za-z0-9][A-Za-z0-9._%+\-]{0,63}@[A-Za-z0-9.-]{1,190}\.[A-Za-z]{2,24}$/.test(v)
     ||v.includes('..'))throw Error('Enter a valid email address.');
  return v.toLowerCase();
}
function integer(input,min,max,label){
  if(input===undefined||input===null||String(input).trim()===''||!/^\d+$/.test(String(input)))
    throw Error('Invalid '+label);
  const n=Number(input);
  if(!Number.isSafeInteger(n)||n<min||n>max)throw Error('Invalid '+label);
  return n;
}
function scenario(p){
  if(!p||!['manual','tool'].includes(p.mode))throw Error('Invalid baseline');
  const workers=integer(p.workers,1,100,'workers');
  const recordsPerWorkerDay=integer(p.recordsPerWorkerDay,1,40,'daily records');
  const issueRate=integer(p.issueRate,0,20,'issue percentage');
  const toolMonthly=integer(p.toolMonthly,0,2000,'existing tool fee');
  const existingTool=p.mode==='tool'?toolMonthly:0;
  const records=workers*recordsPerWorkerDay*ACORDE_SETTINGS.workingDays;
  const affected=records*issueRate/100;
  const hours=affected*ACORDE_SETTINGS.minutesPerAffectedRecord/60;
  const hourValue=hours*ACORDE_SETTINGS.loadedCostPerHour;
  const halfTime=hours*0.5;
  return {workers,recordsPerWorkerDay,issueRate,existingTool,records,affected,hours,
    hourValue,halfTime,possibleMonthlyValue:halfTime*ACORDE_SETTINGS.loadedCostPerHour,
    currentMonthlyCost:hourValue+existingTool};
}
function format(n){return Number(n).toLocaleString('en-GB',{maximumFractionDigits:1});}
function euro(n){return Number(n).toLocaleString('en-IE',{style:'currency',currency:'EUR',maximumFractionDigits:0});}
/**
 * Transactional first email only. A practical, self-contained diagnostic that
 * helps the recipient validate a hypothesis before buying anything.
 * This report does NOT enroll the recipient in subsequent mailings.
 */
/**
 * Transactional result: 1 glance, 1 five-minute check, 1 optional reply.
 * Do not ask a recipient for a multi-day audit or customer records.
 */
function reportData(p){
  const r=scenario(p);
  const hours=format(r.hours);
  return {
    r,
    hours,
    records:format(r.records),
    affected:format(r.affected),
    midHours:format(r.halfTime),
    potentialMonthly:euro(r.possibleMonthlyValue),
    softwareMonthly:euro(r.existingTool),
    currentMode:p.mode==='tool'?'Existing matching tool':'Manual checks',
    subject:'Your Acorde estimate: '+hours+' hours/month reviewing customer records'
  };
}
function fiveMinuteNote(mode){
  return mode==='tool'
    ? 'If you use a matching tool, note whether it flagged any of those cases.'
    : 'If two records seem to describe the same person, flag them for review.';
}
function formatReport(p){
  const v=reportData(p);
  return [
    'YOUR ACORDE ESTIMATE',
    '',
    'Your team may spend '+v.hours+' hours a month checking customer records.',
    '',
    'Based on your inputs:',
    'People handling records: '+v.r.workers,
    'Records processed per month: '+v.records,
    'Records needing extra review: '+v.affected+' ('+v.r.issueRate+'%)',
    'Estimated time spent on checks: '+v.hours+' hours/month',
    'Possible time freed at 50% improvement: '+v.midHours+' hours/month',
    'Value of that time: '+v.potentialMonthly+'/month',
    'Existing tool subscription: '+v.softwareMonthly+'/month',
    '',
    'A USEFUL 5-MINUTE CHECK',
    'Open your five most recent CRM contacts. Search each by email or phone, then check who owns the follow-up. Note any duplicate contacts or follow-ups assigned to different people.',
    fiveMinuteNote(p.mode),
    'These cases give you a starting point for the first workflow check.',
    '',
    'WANT A RECOMMENDATION FOR YOUR CRM?',
    'Reply with the CRM you use and where enquiries arrive from. We can suggest one specific check for your workflow.',
    '',
    'Illustrative assumptions: 20 workdays/month, 10 minutes per affected record, €28 per staff hour. The 50% improvement is hypothetical. The euro figure represents staff time; Acorde pricing and setup are not included.',
    'You requested this report. Further emails require separate confirmed consent.',
    '',
    'Acorde | '+ACORDE_HOME
  ].join('\n');
}
function formatHtmlReport(p){
  const v=reportData(p);
  const th='font:500 13px Arial,sans-serif;color:#666;padding:10px 4px 10px 0;border-bottom:1px solid #e8e8e8;text-align:left;';
  const td='font:700 14px Arial,sans-serif;color:#242424;padding:10px 0 10px 4px;border-bottom:1px solid #e8e8e8;text-align:right;';
  const row=(name,value)=>'<tr><th style="'+th+'">'+esc(name)+'</th><td style="'+td+'">'+esc(value)+'</td></tr>';
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>'+
    '<body style="margin:0;padding:0;background:#f5f5f5;color:#242424;font-family:Arial,Helvetica,sans-serif;">'+
    '<div style="display:none;font-size:1px;max-height:0;overflow:hidden;opacity:0;">Your figures and a five-minute CRM check you can use today.</div>'+
    '<table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%;background:#f5f5f5;"><tr><td align="center" style="padding:18px 10px;">'+
    '<table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%;max-width:580px;background:#fff;"><tr><td style="padding:26px 23px 12px;">'+
    '<div style="font-size:23px;font-weight:800;letter-spacing:-1.5px;">acorde</div>'+
    '<h1 style="font-size:30px;line-height:1.16;letter-spacing:-1px;margin:25px 0 13px;">'+esc(v.hours)+' hours/month checking customer records</h1>'+
    '<p style="font-size:14px;line-height:1.6;color:#555;margin:0 0 18px;">Here is your estimate using the settings you selected.</p>'+
    '<table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;margin:0 0 20px;">'+
      row('People handling records',String(v.r.workers))+
      row('Records processed / month',v.records)+
      row('Records needing extra review',v.affected+' ('+v.r.issueRate+'%)')+
      row('Review time / month',v.hours+' hours')+
      row('Time freed at 50% improvement',v.midHours+' hours / month')+
      row('Illustrative value of that time',v.potentialMonthly+' / month')+
    '</table>'+
    '<h2 style="font-size:20px;line-height:1.25;margin:20px 0 9px;">A useful 5-minute check</h2>'+
    '<p style="font-size:14px;line-height:1.65;color:#444;margin:0 0 11px;">Open your five most recent CRM contacts. Search each by email or phone, then check who owns the follow-up. Note any duplicate contacts or follow-ups assigned to different people.</p>'+
    '<p style="font-size:13px;line-height:1.6;color:#555;margin:0 0 18px;">'+esc(fiveMinuteNote(p.mode))+'</p>'+
    '<h2 style="font-size:20px;line-height:1.25;margin:20px 0 9px;">Want a recommendation for your CRM?</h2>'+
    '<p style="font-size:14px;line-height:1.65;color:#444;margin:0 0 21px;">Reply with the CRM you use and where enquiries arrive from. We can suggest one specific check for your workflow.</p>'+
    '<p style="margin:0 0 22px;"><a href="'+esc(ACORDE_HOME)+'" style="display:inline-block;background:#242424;color:#fff;text-decoration:none;border-radius:4px;padding:12px 17px;font-size:13px;font-weight:bold;">Adjust your estimate</a></p>'+
    '<p style="border-top:1px solid #e8e8e8;padding-top:15px;font-size:11px;line-height:1.55;color:#777;">Assumptions: 20 workdays/month, 10 minutes per affected record, €28 per staff hour. The 50% improvement is a scenario. The euro figure values staff time; Acorde pricing and setup are excluded.</p>'+
    '<p style="font-size:11px;line-height:1.55;color:#777;">You requested this report. Further emails require separate confirmed consent.</p>'+
    '</td></tr></table></td></tr></table></body></html>';
}
function page(title,body){
  return HtmlService.createHtmlOutput(
    '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<title>'+esc(title)+'</title><style>body{font:15px/1.6 Arial,sans-serif;color:#242424;max-width:620px;padding:35px 22px;margin:auto}'+
    'h1{font-size:30px;line-height:1.2}button,a.btn{display:inline-block;background:#242424;color:white;border:0;border-radius:5px;padding:12px 18px;font-weight:bold;cursor:pointer;text-decoration:none}p{color:#555}small{color:#777}</style></head><body>'+
    '<h1>'+esc(title)+'</h1>'+body+'<p><a href="'+esc(ACORDE_HOME)+'">Back to Acorde</a></p></body></html>');
}
function emailKey(email){
  const digest=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,email);
  return digest.map(function(b){return ('0'+((b+256)%256).toString(16)).slice(-2);}).join('');
}
function nowDay(){return Utilities.formatDate(new Date(),'UTC','yyyyMMdd');}
function reserveSend(email){
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(12000))throw Error('Email service is busy. Please try again.');
  try{
    const props=PropertiesService.getScriptProperties();
    const today=nowDay(),hash=emailKey(email);
    const globalKey='sent:'+today;
    const personKey='sent:'+today+':'+hash;
    const globalCount=Number(props.getProperty(globalKey)||'0');
    const personCount=Number(props.getProperty(personKey)||'0');
    if(globalCount===0){
      // Daily cleanup prevents PropertiesService (500 KB) from accumulating
      // a permanent record of all report recipients. Old hashes are removed.
      const all=props.getProperties();
      for(const key of Object.keys(all)){
        if(/^sent:\d{8}(?::|$)/.test(key)&&!key.startsWith('sent:'+today))props.deleteProperty(key);
        if(key.startsWith('pending:')){
          try{if(Date.now()-JSON.parse(all[key]).at>ACORDE_SETTINGS.consentValidityHours*3600000)
            props.deleteProperty(key);}catch{props.deleteProperty(key);}
        }
      }
    }
    const cache=CacheService.getScriptCache();
    if(globalCount>=ACORDE_SETTINGS.globalDailyLimit)throw Error('Daily sending limit reached. Try again tomorrow.');
    if(personCount>=ACORDE_SETTINGS.perRecipientDailyLimit||cache.get('recent:'+hash))
      throw Error('A report was sent to this address recently. Please check your inbox.');
    if(MailApp.getRemainingDailyQuota()<1)throw Error('Google email quota reached. Try again tomorrow.');
    // Reserve BEFORE MailApp.sendEmail, so simultaneous requests cannot bypass limits.
    props.setProperty(globalKey,String(globalCount+1));
    props.setProperty(personKey,String(personCount+1));
    cache.put('recent:'+hash,'1',ACORDE_SETTINGS.perRecipientCooldownSeconds);
  }finally{lock.releaseLock();}
}
function newToken(){
  return (Utilities.getUuid()+Utilities.getUuid()).replace(/-/g,'');
}
function scriptLink(){
  const url=ScriptApp.getService().getUrl();
  if(!/^https:\/\/script\.google\.com\/macros\/s\/[^\s]+\/exec$/.test(url||''))
    throw Error('Mailer web app must first be deployed.');
  return url;
}
function pendingConsent(email,p){
  const token=newToken();
  const record={email,at:Date.now(),source:/^[a-zA-Z0-9_. -]{1,60}$/.test(String(p.utm_source||''))?String(p.utm_source):'',version:CONSENT_VERSION};
  PropertiesService.getScriptProperties().setProperty('pending:'+token,JSON.stringify(record));
  return {token,url:scriptLink()+'?confirm='+token};
}
function sendReport(p){
  if(String(p.companyFax||'').trim())return page('Check your inbox','<p>If your address is valid, your report may arrive shortly.</p>');
  const address=cleanEmail(p.email);
  const report=formatReport(p);
  const htmlReport=formatHtmlReport(p);
  const optedIn=String(p.newsletter||'')==='yes';
  if(p.newsletter&&p.newsletter!=='yes')throw Error('Invalid consent value');
  reserveSend(address);
  let consent=null;
  if(optedIn)consent=pendingConsent(address,p);
  const content=report+(consent?
    '\n\nOPTIONAL NEWSLETTER — NOT SUBSCRIBED YET\nYou requested occasional useful CRM guides. Confirm your separate consent by visiting:\n'+
    consent.url+'\n\nYou will not be subscribed unless you confirm the form on that page.':'');
  try{
    const consentHtml=consent?
      '<div style="border:1px solid #ccc;padding:15px;margin:20px 0;font:14px/1.5 Arial,sans-serif;">'+
      '<strong>Optional updates: confirm your choice</strong><p>You asked for occasional useful CRM guides. You are not subscribed yet.</p>'+
      '<p><a href="'+esc(consent.url)+'">Confirm updates with a separate step</a></p>'+
      '<p style="font-size:12px;">You will not be subscribed unless you open the page and confirm there.</p></div>':'';
    const finalHtml=htmlReport.replace('</td></tr></table></td></tr></table></body></html>',
      consentHtml+'</td></tr></table></td></tr></table></body></html>');
    MailApp.sendEmail({to:address,name:'Acorde',subject:reportData(p).subject,body:content,htmlBody:finalHtml});
  }catch(e){
    if(consent)PropertiesService.getScriptProperties().deleteProperty('pending:'+consent.token);
    // Never claim delivery; quota reservation is retained to prevent retry abuse.
    throw Error('Google did not accept this message. Please try again later.');
  }
  return page('Your report was sent for delivery',
    '<p>Google accepted an Acorde estimate for <strong>'+esc(address)+'</strong>. Check your inbox and spam folder. Delivery to the inbox cannot be guaranteed.</p>'+
    (consent?'<p>For the optional newsletter, use the confirmation link inside the email. You are <strong>not subscribed yet</strong>.</p>':'<p>We did not subscribe you to marketing updates.</p>'));
}
function getSheet(){
  const props=PropertiesService.getScriptProperties();
  let id=props.getProperty('CONSENT_SHEET_ID');
  if(!id){
    const spreadsheet=SpreadsheetApp.create('Acorde — confirmed useful-guide consent ledger');
    id=spreadsheet.getId();
    const sheet=spreadsheet.getSheets()[0];
    sheet.setName('Subscribers');
    sheet.appendRow(['Email','Confirmed UTC','Consent version','Source','Status','Unsubscribe token']);
    props.setProperty('CONSENT_SHEET_ID',id);
  }
  return SpreadsheetApp.openById(id).getSheets()[0];
}
function tokenParam(p,key){
  const v=String(p[key]||'');
  if(!/^[a-f0-9]{64}$/.test(v))throw Error('Invalid or expired link');
  return v;
}
function showConfirmation(p){
  const token=tokenParam(p,'confirm'),props=PropertiesService.getScriptProperties();
  const raw=props.getProperty('pending:'+token);
  if(!raw)return page('Link unavailable','<p>This confirmation link has expired or was already used.</p>');
  const c=JSON.parse(raw);
  if(Date.now()-c.at>ACORDE_SETTINGS.consentValidityHours*3600000)
    return page('Link expired','<p>This request has expired. Start again from the calculator.</p>');
  return page('Confirm useful Acorde updates',
    '<p>You requested occasional practical CRM/data-quality guides for <strong>'+esc(c.email)+
    '</strong>. No unrelated promotions. You can unsubscribe from any future newsletter.</p>'+
    '<form method="POST" action="'+esc(scriptLink())+'"><input type="hidden" name="action" value="confirm">'+
    '<input type="hidden" name="token" value="'+esc(token)+'"><button type="submit">Confirm subscription</button></form>');
}
function confirmConsent(p){
  const token=tokenParam(p,'token');
  const props=PropertiesService.getScriptProperties();
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(15000))throw Error('Please try again.');
  try{
    const raw=props.getProperty('pending:'+token);
    if(!raw)throw Error('Confirmation expired or already used.');
    const entry=JSON.parse(raw);
    if(Date.now()-entry.at>ACORDE_SETTINGS.consentValidityHours*3600000)
      throw Error('Confirmation has expired.');
    const sheet=getSheet();
    const rows=sheet.getDataRange().getValues(),address=cleanEmail(entry.email);
    for(let i=1;i<rows.length;i++){
      if(String(rows[i][0]).toLowerCase()===address&&rows[i][4]==='active'){
        props.deleteProperty('pending:'+token);
        return page('Already subscribed','<p>Your existing subscription is active. You can unsubscribe using the link included in future updates.</p>');
      }
    }
    const unsub=newToken();
    sheet.appendRow([address,new Date().toISOString(),entry.version,entry.source,'active',unsub]);
    props.setProperty('unsubscribe:'+unsub,address);
    props.deleteProperty('pending:'+token);
    return page('Subscription confirmed','<p>Thanks. You have opted in to occasional useful CRM/data-quality guides. You may unsubscribe from future messages.</p>');
  }finally{lock.releaseLock();}
}
function showUnsubscribe(p){
  const token=tokenParam(p,'unsubscribe');
  if(!PropertiesService.getScriptProperties().getProperty('unsubscribe:'+token))
    return page('Link unavailable','<p>That unsubscribe link is no longer active.</p>');
  return page('Unsubscribe from Acorde updates',
    '<p>Stop receiving optional CRM/data-quality guides.</p><form method="POST" action="'+esc(scriptLink())+
    '"><input type="hidden" name="action" value="unsubscribe"><input type="hidden" name="token" value="'+esc(token)+
    '"><button type="submit">Unsubscribe</button></form>');
}
function unsubscribe(p){
  const token=tokenParam(p,'token'),props=PropertiesService.getScriptProperties();
  const email=props.getProperty('unsubscribe:'+token);
  if(!email)return page('Already unsubscribed','<p>No active subscription was found for this link.</p>');
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(15000))throw Error('Please try again.');
  try{
    const sheet=getSheet(),rows=sheet.getDataRange().getValues();
    for(let i=1;i<rows.length;i++){
      if(String(rows[i][0]).toLowerCase()===email&&rows[i][5]===token)
        sheet.getRange(i+1,5).setValue('unsubscribed');
    }
    props.deleteProperty('unsubscribe:'+token);
    return page('Unsubscribed','<p>Your optional subscription is now inactive.</p>');
  }finally{lock.releaseLock();}
}
function doGet(e){
  try{
    const p=(e&&e.parameter)||{};
    if(p.confirm)return showConfirmation(p);
    if(p.unsubscribe)return showUnsubscribe(p);
    return page('Acorde email service','<p>Ready to receive calculator requests. No messages can be sent using a GET request.</p>');
  }catch(error){return page('Link unavailable','<p>'+esc(error.message)+'</p>');}
}
function doPost(e){
  try{
    const p=(e&&e.parameter)||{};
    if(p.action==='send')return sendReport(p);
    if(p.action==='confirm')return confirmConsent(p);
    if(p.action==='unsubscribe')return unsubscribe(p);
    throw Error('Unknown action');
  }catch(error){return page('Request not completed','<p>'+esc(error.message)+'</p>');}
}
