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
function reportData(p){
  const r=scenario(p);
  return {
    r,
    currentMode:p.mode==='tool'?'Existing paid matching tool + human review':'No dedicated paid deduplication tool',
    lowHours:format(r.hours*0.3),
    highHours:format(r.hours*0.7),
    midHours:format(r.halfTime),
    hours:format(r.hours),
    records:format(r.records),
    affected:format(r.affected),
    potentialMonthly:euro(r.possibleMonthlyValue),
    currentMonthly:euro(r.currentMonthlyCost),
    softwareMonthly:euro(r.existingTool),
    subject:'Your Acorde snapshot: ~'+format(r.hours)+' h/month to investigate'
  };
}
function nextDiagnostic(mode){
  return mode==='tool'
   ? 'Your current tool may already prevent errors. Look specifically at what it leaves for humans: uncertain matches, record corrections and CRM handoffs. Do not assume its subscription can be cancelled.'
   : 'Start with one inbound channel and trace each record through the CRM. Repeated contact details and uncertain identity should be reviewed safely, not automatically merged.';
}
function formatReport(p){
  const v=reportData(p);
  return [
    'ACORDE / YOUR FIRST WORKFLOW SNAPSHOT',
    '',
    'Estimated time spent on checks: '+v.hours+' hours/month',
    'This is a starting hypothesis, not a measured result.',
    '',
    'YOUR SCENARIO',
    '- Current approach: '+v.currentMode,
    '- People handling records: '+v.r.workers,
    '- Records per person per day: '+v.r.recordsPerWorkerDay,
    '- Records potentially needing another look: '+v.r.issueRate+'%',
    '- Total records in scope: '+v.records+'/month',
    '- Records needing a check: '+v.affected+'/month',
    '- Estimated time spent on checks: '+v.hours+' hours/month',
    '- Estimated current staff + existing-tool cost: '+v.currentMonthly+'/month',
    '',
    'WHAT MAY BE AT STAKE',
    'If 30–70% of review time can safely be removed, that represents '+v.lowHours+'–'+
      v.highHours+' hours/month. At a hypothetical 50% improvement, '+v.midHours+
      ' hours of capacity are worth approximately '+v.potentialMonthly+'/month.',
    'This is time value, NOT proven cash savings or product performance.',
    '',
    'WHERE TO LOOK FIRST',
    nextDiagnostic(p.mode),
    '',
    'A FREE 7-DAY VALIDATION PLAN',
    '1. Pick one real inbound source (forms, email, calls, imports) and a recent sequence of ~50 records. For a large team, treat this as a pilot sample, not representative statistics.',
    '2. For each case, log only the category (clear match / possible duplicate / uncertain identity / new record), minutes spent checking, and the handoff stage. Keep customer-identifying data out of any shared sample.',
    '3. Count the cases needing human attention and the actual minutes. Compare the result to this estimate; separate safe rules from cases that still require human judgment.',
    '',
    'THE NEXT DECISION',
    '- Few exceptions? Fix upstream capture and avoid adding an unnecessary tool.',
    '- Frequent, unambiguous repeats? Test a narrowly scoped, reversible automated rule.',
    '- Ambiguous identity or risky handoffs? Keep explicit reviewer approval and an audit trail.',
    '',
    'WHAT THIS ESTIMATE DOES NOT KNOW',
    'Your true exception rate, staff handling time, CRM mapping quality, existing contract terms, Acorde deployment cost or achievable reduction. These must be measured before making an ROI claim.',
    'Example assumptions: 20 workdays/month, 10 minutes per affected record, €28/hour loaded staff cost. Neither these defaults nor the 30–70% improvement scenario are industry averages or proven Acorde results.',
    '',
    'REPLY WITH JUST TWO DETAILS',
    'Where do duplicates first appear (inbound, CRM import or handoff), and which CRM do you use? We can suggest the first low-risk check.',
    '',
    'You requested this one-time calculation. You will not receive ongoing updates unless you separately confirm an optional subscription.',
    'Acorde | '+ACORDE_HOME
  ].join('\n');
}
function formatHtmlReport(p){
  const v=reportData(p);
  const th='font:600 11px Arial,sans-serif;color:#666;padding:10px 0;border-bottom:1px solid #e5e5e5;text-align:left;';
  const td='font:600 14px Arial,sans-serif;color:#242424;padding:10px 0;border-bottom:1px solid #e5e5e5;text-align:right;';
  const row=(left,right)=>'<tr><th style="'+th+'">'+esc(left)+'</th><td style="'+td+'">'+esc(right)+'</td></tr>';
  const li=(text)=>'<li style="margin-bottom:12px;">'+text+'</li>';
  const bullet=(strong,detail)=>li('<strong>'+esc(strong)+'</strong> '+esc(detail));
  return '<!doctype html><html lang="en"><head><meta charset="utf-8">'+
    '<meta name="viewport" content="width=device-width,initial-scale=1"></head>'+
    '<body style="margin:0;padding:0;background:#f5f5f5;color:#242424;font-family:Arial,Helvetica,sans-serif;">'+
    '<div style="display:none;font-size:1px;max-height:0;overflow:hidden;opacity:0;">Your estimate, the assumptions behind it, and a practical 7-day verification plan.</div>'+
    '<table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%;background:#f5f5f5;"><tr><td align="center" style="padding:24px 12px;">'+
    '<table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%;max-width:600px;background:#fff;"><tr><td style="padding:32px 30px 12px;">'+
    '<div style="font-size:24px;font-weight:800;letter-spacing:-1.5px;">acorde</div>'+
    '<p style="color:#777;font-size:11px;font-weight:700;letter-spacing:1.3px;text-transform:uppercase;margin:30px 0 10px;">Your first workflow snapshot</p>'+
    '<h1 style="font-size:32px;letter-spacing:-1.5px;line-height:1.15;margin:0 0 16px;">'+esc(v.hours)+' hours/month<br><span style="color:#888;">worth investigating.</span></h1>'+
    '<p style="font-size:15px;color:#555;line-height:1.7;margin:0 0 20px;">This is a starting hypothesis about record checks across your team, not a measured saving. Here is how to make it useful.</p>'+
    '<table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;margin:16px 0 22px;">'+
      row('People handling records',String(v.r.workers))+
      row('Records per person / workday',String(v.r.recordsPerWorkerDay))+
      row('Records needing a second look',String(v.r.issueRate)+'%')+
      row('Possible exceptions / month',v.affected+' of '+v.records)+
      row('Existing tool + attention cost / month',v.currentMonthly)+
    '</table>'+
    '<div style="background:#f5f5f5;border-left:3px solid #242424;padding:18px 18px 15px;margin:20px 0 26px;">'+
      '<p style="font-size:11px;letter-spacing:1px;text-transform:uppercase;font-weight:bold;color:#666;margin:0 0 9px;">Potential capacity to recover</p>'+
      '<p style="font-size:25px;font-weight:700;letter-spacing:-1px;margin:0;">'+esc(v.lowHours)+'–'+esc(v.highHours)+' hours / month</p>'+
      '<p style="font-size:13px;color:#555;line-height:1.55;margin:8px 0 0;">If a hypothetical 30–70% of review work could be safely removed. The 50% midpoint equals '+esc(v.midHours)+' hours, valued at '+esc(v.potentialMonthly)+'/month of staff time <strong>— not guaranteed cash savings.</strong></p>'+
    '</div>'+
    '<h2 style="font-size:22px;letter-spacing:-.6px;margin:28px 0 8px;">Where to look first</h2>'+
    '<p style="font-size:14px;color:#4b4b4b;line-height:1.7;margin:0 0 22px;">'+esc(nextDiagnostic(p.mode))+'</p>'+
    '<h2 style="font-size:22px;letter-spacing:-.6px;margin:26px 0 12px;">Your 7-day verification plan</h2>'+
    '<ol style="font-size:14px;color:#484848;line-height:1.6;padding-left:21px;">'+
      bullet('Take a small consecutive sample.','Select roughly 50 recent cases from one inbound source. For a large company, this is only an initial pilot.')+
      bullet('Label the friction.','For each case, record clear match, possible duplicate, uncertain identity or new record; the stage; and minutes spent checking. Do not share customer-identifying data.')+
      bullet('Separate safe from risky.','Count actual exception cases and checking minutes. Automate only verified low-risk rules; send uncertain identities to a reviewer.')+
    '</ol>'+
    '<h2 style="font-size:22px;letter-spacing:-.6px;margin:26px 0 12px;">How to decide what to fix</h2>'+
    '<ul style="font-size:14px;color:#484848;line-height:1.65;padding-left:20px;">'+
      bullet('Rare issues?','Improve source fields instead of adding software.')+
      bullet('Predictable repeats?','Pilot a narrow, reversible matching rule.')+
      bullet('Ambiguous identities?','Keep human approval and a decision trail.')+
    '</ul>'+
    '<div style="border-top:1px solid #e3e3e3;padding-top:16px;margin:24px 0;">'+
    '<h2 style="font-size:19px;margin:0 0 8px;">What we still need to know</h2>'+
    '<p style="font-size:12px;color:#666;line-height:1.65;margin:0;">Actual exception rate, minutes per case, CRM mapping quality, existing contract costs, implementation expenses and achievable improvement. This model assumes 20 workdays/month, 10 minutes per affected case, and €28/hour of staff cost. These are illustrative inputs, not industry benchmarks or verified Acorde performance.</p>'+
    '</div>'+
    '<p style="font-size:15px;font-weight:bold;margin:22px 0 8px;">Want a useful next step without another meeting?</p>'+
    '<p style="font-size:14px;line-height:1.65;color:#555;margin:0 0 22px;">Reply with where duplicates first appear (inbound, CRM import or handoff) and the CRM you use. We can suggest a first low-risk check.</p>'+
    '<p style="margin:0 0 26px;"><a href="'+esc(ACORDE_HOME)+'" style="display:inline-block;background:#242424;color:#fff;text-decoration:none;border-radius:4px;padding:13px 19px;font-size:13px;font-weight:bold;">Adjust your estimate</a></p>'+
    '<p style="border-top:1px solid #e4e4e4;padding-top:16px;color:#888;font-size:11px;line-height:1.6;">You requested this one-time report. No ongoing updates will be sent unless you separately confirm an optional subscription. Time value is not cash saved. Acorde pricing and setup are not included.</p>'+
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
