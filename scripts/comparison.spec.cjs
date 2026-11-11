const {test,expect}=require('@playwright/test');
const root=(process.env.ACORDE_BASE_URL||'http://127.0.0.1:4173').replace(/\/$/,'');
const base=root+'/comparison.html';
async function slide(page,id,value){
 await page.locator('#'+id).evaluate((el,v)=>{
  el.value=String(v);
  el.dispatchEvent(new Event('input',{bubbles:true}));
 },value);
}
async function expand(page,id){await page.locator('[data-expand="'+id+'"]').click();}
test('homepage and revenue calculator still navigate to duplicate review estimate',async({page})=>{
 await page.goto(root+'/?utm_source=linkedin');
 await expect(page.locator('.loss-compare')).toHaveAttribute('href',/comparison\.html\?utm_source=linkedin/);
 await page.locator('.loss-compare').click();
 await expect(page).toHaveURL(/comparison\.html/);
 await expect(page.locator('h1')).toContainText('duplicate checks');
 await page.goto(root+'/calculator.html?mode=sales&utm_source=linkedin');
 await expect(page.locator('#cost-compare-link')).toHaveAttribute('href',/utm_source=linkedin/);
});
test('one-screen estimator starts with defaults, compact results and no math form',async({page})=>{
 await page.goto(base);
 await expect(page.locator('#workers')).toHaveValue('5');
 await expect(page.locator('#recordsPerWorkerDay')).toHaveValue('12');
 await expect(page.locator('#issueRate')).toHaveValue('8');
 await expect(page.locator('#attention-hours')).toHaveText('16 h');
 await expect(page.locator('#attention-summary')).toContainText('96 of 1,200');
 await expect(page.locator('#freed-hours')).toHaveText('8 h');
 await expect(page.locator('#freed-value')).toHaveText('€224');
 await expect(page.locator('#current-overhead')).toHaveText('€448');
 await expect(page.locator('#software-explain')).toContainText('€0 existing tool');
 await expect(page.locator('#software-controls')).toBeHidden();
 await expect(page.locator('#workers')).toHaveAttribute('max','20');
 await expect(page.locator('#recordsPerWorkerDay')).toHaveAttribute('max','40');
 await expect(page.locator('#issueRate')).toHaveAttribute('max','50');
 await expect(page.locator('input[type="number"]')).toHaveCount(0);
 await expect(page.locator('select')).toHaveCount(0);
 await expect(page.locator('input[type="range"]')).toHaveCount(4);
 await expect(page.locator('.progress-track')).toHaveCount(0);
 await expect(page.locator('#potential-year')).toHaveCount(0);
 await expect(page.locator('.example-note')).toHaveCount(0);
 await expect(page.locator('.controls .slider')).toHaveCount(4);
 await expect(page.locator('#audit-link')).toBeVisible();
 await expect(page.locator('header nav')).toHaveCount(0);
 await expect(page.locator('.footer')).toHaveCount(0);
});
test('7 people, 40 daily records and 10% exactly match screenshot scenario',async({page})=>{
 await page.goto(base);
 await slide(page,'workers',7);
 await slide(page,'recordsPerWorkerDay',40);
 await slide(page,'issueRate',10);
 await expect(page.locator('#attention-hours')).toHaveText('93.3 h');
 await expect(page.locator('#attention-summary')).toContainText('560 of 5,600');
 await expect(page.locator('#freed-hours')).toHaveText('46.7 h');
 await expect(page.locator('#freed-value')).toHaveText('€1,307');
 await expect(page.locator('#current-overhead')).toHaveText('€2,613');
 await expect(page.locator('#estimate-assumptions')).toBeHidden();
});
test('tool choice reveals fee slider directly beneath the choice and above team sliders',async({page})=>{
 await page.goto(base);
 const reviewTime=await page.locator('#attention-hours').textContent();
 await page.locator('[data-baseline="tool"]').click();
 const fee=page.locator('#software-controls');
 await expect(fee).toBeVisible();
 await expect(page.locator('#tool-value')).toHaveText('€150');
 await expect(page.locator('#tool-inline-effect')).toContainText('Adds €150/month');
 await expect(page.locator('#mode-caption')).toHaveText('With your current tool');
 await expect(page.locator('#current-overhead')).toHaveText('€598');
 await expect(page.locator('#software-explain')).toContainText('€448 staff review + €150 existing tool');
 await expect(page.locator('#attention-hours')).toHaveText(reviewTime);
 const positions=await page.evaluate(()=>{
  const choices=document.querySelector('.modes'),fee=document.getElementById('software-controls'),
    people=document.getElementById('workers').closest('.slider');
  const opt=choices.getBoundingClientRect(),fr=fee.getBoundingClientRect(),pr=people.getBoundingClientRect();
  return {correct:opt.bottom<=fr.top&&fr.bottom<=pr.top,visible:fr.bottom<=innerHeight};
 });
 expect(positions.correct).toBe(true);
 expect(positions.visible).toBe(true);
 await slide(page,'toolMonthly',500);
 await expect(page.locator('#current-overhead')).toHaveText('€948');
 await expect(page.locator('#tool-inline-effect')).toContainText('Adds €500/month');
 await page.locator('[data-baseline="manual"]').click();
 await expect(page.locator('#software-controls')).toBeHidden();
 await expect(page.locator('#current-overhead')).toHaveText('€448');
 await page.locator('[data-baseline="tool"]').click();
 await expect(page.locator('#tool-value')).toHaveText('€500');
});
test('slider scales expand in-place without dropping values or imposing old max caps',async({page})=>{
 await page.goto(base);
 await slide(page,'workers',20);
 await expand(page,'workers');
 await expect(page.locator('#workers')).toHaveAttribute('max','100');
 await expect(page.locator('#workers')).toHaveValue('20');
 await slide(page,'workers',100);
 await expand(page,'workers');
 await expect(page.locator('#workers')).toHaveAttribute('max','1000');
 await slide(page,'workers',250);
 await expect(page.locator('#workers-value')).toHaveText('250');
 await expand(page,'recordsPerWorkerDay');
 await expect(page.locator('#recordsPerWorkerDay')).toHaveAttribute('max','200');
 await slide(page,'recordsPerWorkerDay',100);
 await expect(page.locator('#records-value')).toHaveText('100');
 await expect(page.locator('[data-expand="issueRate"]')).toHaveCount(0);
 await expect(page.locator('#issueRate')).toHaveAttribute('max','50');
 await slide(page,'issueRate',35);
 await expect(page.locator('#rate-value')).toHaveText('35%');
 await page.locator('[data-baseline="tool"]').click();
 await expand(page,'toolMonthly');
 await expect(page.locator('#toolMonthly')).toHaveAttribute('max','2000');
 await slide(page,'toolMonthly',1750);
 await expect(page.locator('#tool-value')).toHaveText('€1,750');
});
test('zero review rate yields zero time, while existing fee stays in cost',async({page})=>{
 await page.goto(base);
 await slide(page,'issueRate',0);
 await expect(page.locator('#attention-hours')).toHaveText('0 h');
 await expect(page.locator('#freed-value')).toHaveText('€0');
 await expect(page.locator('#current-overhead')).toHaveText('€0');
 await page.locator('[data-baseline="tool"]').click();
 await expect(page.locator('#current-overhead')).toHaveText('€150');
});
test('calculation assumptions are available on demand, not in the main conversion flow',async({page})=>{
 await page.goto(base);
 await expect(page.locator('#estimate-assumptions')).toBeHidden();
 await expect(page.locator('#assumptions-toggle')).toHaveAttribute('aria-expanded','false');
 await page.locator('#assumptions-toggle').click();
 await expect(page.locator('#estimate-assumptions')).toBeVisible();
 await expect(page.locator('#estimate-assumptions')).toContainText('20 workdays');
 await expect(page.locator('#estimate-assumptions')).toContainText('€28');
 await page.locator('#assumptions-toggle').click();
 await expect(page.locator('#estimate-assumptions')).toBeHidden();
});
test('primary paid audit dominates the result; disconnected email stays hidden',async({page})=>{
 await page.goto(base);
 const cta=page.locator('#audit-link');
 await expect(cta).toBeVisible();
 await expect(cta).toContainText('Request a paid audit');
 await expect(cta).toHaveAttribute('href',/tally\.so/);
 await expect(page.locator('#copy')).toBeVisible();
 await expect(page.locator('#copy')).toBeEnabled();
 await expect(page.locator('#email-form')).toBeHidden();
 await expect(page.locator('#newsletter')).not.toBeChecked();
 await expect(page.locator('#send')).toBeDisabled();
 const ui=await page.locator('#results').evaluate(card=>{
  const cost=card.querySelector('.cost-row'),cta=card.querySelector('#audit-link');
  const costRect=cost.getBoundingClientRect(),ctaRect=cta.getBoundingClientRect();
  return {
   inCard:card.contains(cta),
   afterResult:ctaRect.top>costRect.bottom,
   gap:ctaRect.top-costRect.bottom,
   height:ctaRect.height,
   widthRatio:ctaRect.width/card.getBoundingClientRect().width,
   hasPrivacyNav:!!document.querySelector('header nav'),
   hasFooter:!!document.querySelector('.footer'),
   hasPreviewBanner:document.body.textContent.includes('TESTING PREVIEW'),
   hasInertCopy:!!document.querySelector('#copy:disabled')
  };
 });
 expect(ui.inCard).toBe(true);
 expect(ui.afterResult).toBe(true);
 expect(ui.gap).toBeLessThan(90);
 expect(ui.height).toBeGreaterThanOrEqual(50);
 expect(ui.widthRatio).toBeGreaterThan(0.78);
 expect(ui.hasPrivacyNav).toBe(false);
 expect(ui.hasFooter).toBe(false);
 expect(ui.hasPreviewBanner).toBe(false);
 expect(ui.hasInertCopy).toBe(false);
});
test('mobile CTA is large, adjacent to the result, and no unused form consumes space',async({browser})=>{
 for(const width of [320,375,390]){
  const context=await browser.newContext({viewport:{width,height:844},reducedMotion:'reduce'});
  const page=await context.newPage();
  await page.goto(base);
  const ui=await page.evaluate(()=>{
   const card=document.querySelector('#results'),cta=document.querySelector('#audit-link'),
     copy=document.querySelector('#copy'),assumption=document.querySelector('#estimate-assumptions');
   const rect=cta.getBoundingClientRect(),cardRect=card.getBoundingClientRect();
   return {
    inside:card.contains(cta),
    widthRatio:rect.width/cardRect.width,
    ctaHeight:rect.height,
    auditBolder:parseFloat(getComputedStyle(cta).fontSize)>parseFloat(getComputedStyle(copy).fontSize),
    noInertEmail:document.querySelector('#email-form').hidden,
    noBanner:!document.body.textContent.includes('TESTING PREVIEW'),
    noNav:!document.querySelector('header nav'),
    noKicker:!document.querySelector('.intro .eyebrow'),
    noIntroCopy:!document.querySelector('.intro p'),
    noVisibleAssumptions:assumption.hidden,
    noHorizontalScroll:document.documentElement.scrollWidth<=window.innerWidth
   };
  });
  expect(ui.inside).toBe(true);
  expect(ui.widthRatio).toBeGreaterThan(0.80);
  expect(ui.ctaHeight).toBeGreaterThanOrEqual(50);
  expect(ui.auditBolder).toBe(true);
  expect(ui.noInertEmail).toBe(true);
  expect(ui.noBanner).toBe(true);
  expect(ui.noNav).toBe(true);
  expect(ui.noKicker).toBe(true);
  expect(ui.noIntroCopy).toBe(true);
  expect(ui.noVisibleAssumptions).toBe(true);
  expect(ui.noHorizontalScroll).toBe(true);
  await context.close();
 }
});
test('copy estimate works without a sender and confirms success beside the button',async({page})=>{
 await page.addInitScript(()=>{
  Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async(text)=>{window.__copiedReport=text;}}});
 });
 await page.goto(base);
 await expect(page.locator('#email-form')).toBeHidden();
 await page.locator('#copy').click();
 await expect(page.locator('#copy-status')).toContainText('Copied estimate');
 const content=await page.evaluate(()=>window.__copiedReport);
 expect(content).toContain('Review time: 16 hours/month');
 expect(content).toContain('Value of this time: €224/month');
});
test('configured sender POSTs only the scenario; unsubscribed by default',async({page})=>{
 const script='https://script.google.com/macros/s/AKfycTESTCODE/exec';
 await page.route('**/mailer-config.mjs',route=>route.fulfill({
  status:200,contentType:'text/javascript',
  body:"export const MAILER_URL = '"+script+"';"
 }));
 const posted=[];
 await page.route(script,async(route)=>{
  const request=route.request();
  posted.push({method:request.method(),data:Object.fromEntries(new URLSearchParams(request.postData()||''))});
  await route.fulfill({status:200,contentType:'text/html',body:'<h1>Your report was sent for delivery</h1>'});
 });
 await page.goto(base);
 await expect(page.locator('#email-form')).toBeVisible();
 await expect(page.locator('#send')).toBeEnabled();
 await expect(page.locator('#newsletter')).not.toBeChecked();
 await expect(page.locator('#newsletter')).toBeEnabled();
 await page.locator('#recipient').fill('reader@example.com');
 await page.locator('#send').click();
 await expect(page.locator('h1')).toContainText('sent for delivery');
 expect(posted).toHaveLength(1);
 expect(posted[0].method).toBe('POST');
 expect(posted[0].data).toMatchObject({
  action:'send',email:'reader@example.com',mode:'manual',
  workers:'5',recordsPerWorkerDay:'12',issueRate:'8',toolMonthly:'150'
 });
 expect(posted[0].data).not.toHaveProperty('newsletter');
 expect(posted[0].data).not.toHaveProperty('subject');
 expect(posted[0].data).not.toHaveProperty('body');
});
test('explicit checked consent is carried in POST and requires separate confirmation',async({page})=>{
 const script='https://script.google.com/macros/s/AKfycTESTCODE/exec';
 await page.route('**/mailer-config.mjs',route=>route.fulfill({
  status:200,contentType:'text/javascript',
  body:"export const MAILER_URL = '"+script+"';"
 }));
 let sent=null;
 await page.route(script,async(route)=>{
  sent=Object.fromEntries(new URLSearchParams(route.request().postData()||''));
  await route.fulfill({status:200,contentType:'text/html',body:'<h1>Google accepted email</h1>'});
 });
 await page.goto(base);
 await page.locator('#recipient').fill('reader@example.com');
 await page.locator('#newsletter').check();
 await page.locator('#send').click();
 await expect(page.locator('h1')).toContainText('Google accepted email');
 expect(sent.newsletter).toBe('yes');
 expect(sent.email).toBe('reader@example.com');
});
test('marketing API workflow text does not claim verified connector',async({page})=>{
 await page.goto(root+'/');
 await expect(page.locator('#integrations')).toContainText('existing CRM');
 await expect(page.locator('#integrations')).toContainText('Live connector compatibility is verified');
 await page.goto(base);
 await expect(page.locator('#audit-link')).toBeVisible();
 await expect(page.locator('.api-mini')).toHaveCount(0);
});
test('only allowlisted UTMs enter the separate paid-audit form',async({page})=>{
 await page.goto(base+'?utm_source=linkedin&utm_campaign=nov');
 const url=new URL(await page.locator('#audit-link').getAttribute('href'));
 expect(url.hostname).toBe('tally.so');
 expect(url.searchParams.get('utm_source')).toBe('linkedin');
 expect(url.searchParams.get('utm_campaign')).toBe('nov');
 expect(url.searchParams.has('workers')).toBe(false);
});
for(const width of [320,375,390,768,1440]){
 test('responsive compact layout and tool-fee control at width '+width,async({browser})=>{
  const context=await browser.newContext({viewport:{width,height:844},reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
  await page.locator('[data-baseline="tool"]').click();
  await expect(page.locator('#software-controls')).toBeVisible();
  await expect(page.locator('#tool-value')).toHaveText('€150');
  const position=await page.locator('#software-controls').evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight+1);
  expect(position).toBe(true);
  await expand(page,'workers');
  await slide(page,'workers',100);
  await expect(page.locator('#attention-hours')).toHaveText('320 h');
  await expect(page.locator('#email-form')).toBeHidden();
  await expect(page.locator('#audit-link')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
  expect(errors).toEqual([]);
  await context.close();
 });
}
