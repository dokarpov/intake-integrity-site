const {test,expect}=require('@playwright/test');
const root=(process.env.ACORDE_BASE_URL||'http://127.0.0.1:4173').replace(/\/$/,'');
const base=root+'/comparison.html';
async function slide(page,id,value){await page.locator('#'+id).evaluate((el,v)=>{el.value=String(v);el.dispatchEvent(new Event('input',{bubbles:true}))},value)}
test('homepage and main calculator still link to the simplified cost estimator',async({page})=>{
 await page.goto(root+'/?utm_source=linkedin');
 await expect(page.locator('.loss-compare')).toHaveAttribute('href',/comparison\.html\?utm_source=linkedin/);
 await page.locator('.loss-compare').click();
 await expect(page).toHaveURL(/comparison\.html/);
 await expect(page.locator('h1')).toContainText('duplicate records');
 await page.goto(root+'/calculator.html?mode=sales&utm_source=linkedin');
 await expect(page.locator('#cost-compare-link')).toHaveAttribute('href',/utm_source=linkedin/);
});
test('starts with legible illustrative values and an immediate answer, no math form or dropdowns',async({page})=>{
 await page.goto(base);
 await expect(page.locator('#workers')).toHaveValue('5');
 await expect(page.locator('#recordsPerWorkerDay')).toHaveValue('12');
 await expect(page.locator('#issueRate')).toHaveValue('8');
 await expect(page.locator('#attention-hours')).toContainText('16 h');
 await expect(page.locator('#current-overhead')).toContainText('448');
 await expect(page.locator('#freed-value')).toContainText('224');
 await expect(page.locator('#freed-hours')).toContainText('4.8–11.2');
 await expect(page.locator('#potential-year')).toContainText('2,688');
 await expect(page.locator('.example-note')).toContainText('not industry averages');
 await expect(page.locator('input[type="number"]')).toHaveCount(0);
 await expect(page.locator('select')).toHaveCount(0);
 await expect(page.locator('input[type="range"]')).toHaveCount(4);
 await expect(page.locator('#software-controls')).toBeHidden();
});
test('changing team size, records or problem rate immediately recalculates without submit',async({page})=>{
 await page.goto(base);
 await slide(page,'workers',100);
 await expect(page.locator('#attention-hours')).toContainText('320 h');
 await expect(page.locator('#freed-value')).toContainText('4,480');
 await slide(page,'workers',1);
 await expect(page.locator('#attention-hours')).toContainText('3.2 h');
 await slide(page,'issueRate',0);
 await expect(page.locator('#attention-hours')).toContainText('0 h');
 await expect(page.locator('#freed-value')).toContainText('€0');
 await slide(page,'issueRate',8);
 await slide(page,'recordsPerWorkerDay',24);
 await expect(page.locator('#attention-hours')).toContainText('6.4 h');
});
test('current fee applies only in existing-tool mode, and time estimate is unchanged',async({page})=>{
 await page.goto(base);
 const time=await page.locator('#attention-hours').textContent();
 await page.locator('[data-baseline="tool"]').click();
 await expect(page.locator('#software-controls')).toBeVisible();
 await expect(page.locator('#current-overhead')).toContainText('598');
 await expect(page.locator('#software-explain')).toContainText('do not assume it can be cancelled');
 await slide(page,'toolMonthly',500);
 await expect(page.locator('#current-overhead')).toContainText('948');
 await expect(page.locator('#attention-hours')).toHaveText(time);
 await page.locator('[data-baseline="manual"]').click();
 await expect(page.locator('#software-controls')).toBeHidden();
 await expect(page.locator('#current-overhead')).toContainText('448');
});
test('email is never sent silently: no network write, creates an editable mailto draft',async({page})=>{
 await page.goto(base);
 const outbound=[];
 page.on('request',r=>{if(r.method()!=='GET'&&r.method()!=='HEAD')outbound.push(r.url())});
 await page.locator('#send').click();
 await expect(page.locator('#email-status')).toContainText('Enter a valid email');
 await page.locator('#recipient').fill('reader@example.com');
 await page.locator('#send').click();
 await expect(page.locator('#email-status')).toContainText('Press Send there');
 expect(outbound).toEqual([]);
});
test('newsletter requires explicit separate opt-in, not merely entering email',async({page})=>{
 await page.goto(base+'?utm_source=reddit');
 await expect(page.locator('#newsletter')).not.toBeChecked();
 await expect(page.locator('#newsletter-step')).toBeHidden();
 await page.locator('#recipient').fill('reader@example.com');
 await expect(page.locator('#newsletter-step')).toBeHidden();
 await page.locator('#newsletter').check();
 await expect(page.locator('#newsletter-step')).toBeVisible();
 await expect(page.locator('#newsletter-link')).toHaveAttribute('href',/tally\.so\/r\/ArK9ZD/);
 const link=new URL(await page.locator('#newsletter-link').getAttribute('href'));
 expect(link.searchParams.get('subscriber_email')).toBe('reader@example.com');
 expect(link.searchParams.get('utm_source')).toBe('reddit');
 await page.locator('#newsletter').uncheck();
 await expect(page.locator('#newsletter-step')).toBeHidden();
});
test('newsletter link stays disabled until a valid email is present',async({page})=>{
 await page.goto(base);
 await page.locator('#newsletter').check();
 await expect(page.locator('#newsletter-link')).toHaveAttribute('aria-disabled','true');
 await page.locator('#recipient').fill('no@');
 await expect(page.locator('#newsletter-link')).not.toHaveAttribute('href',/tally/);
 await page.locator('#recipient').fill('valid@example.com');
 await expect(page.locator('#newsletter-link')).not.toHaveAttribute('aria-disabled','true');
});
test('current operating costs never appear as a price quote for Acorde',async({page})=>{
 await page.goto(base);
 await expect(page.locator('body')).toContainText('Acorde');
 await expect(page.locator('body')).toContainText('not proven savings');
 await expect(page.locator('body')).toContainText('not set here');
 await expect(page.locator('#model-explanation')).toContainText('20 workdays');
});
test('campaign whitelist carries to audit form without calculator's financial inputs',async({page})=>{
 await page.goto(base+'?utm_source=linkedin&utm_campaign=nov');
 const url=new URL(await page.locator('#audit-link').getAttribute('href'));
 expect(url.hostname).toBe('tally.so');
 expect(url.searchParams.get('utm_source')).toBe('linkedin');
 expect(url.searchParams.get('utm_campaign')).toBe('nov');
 expect(url.searchParams.has('workers')).toBe(false);
});
for(const width of [320,375,390,768,1440]){
 test('simple estimator remains scroll-free horizontally and operable at '+width,async({browser})=>{
  const context=await browser.newContext({viewport:{width,height:844},reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
  await page.locator('#workers').fill('100');
  await expect(page.locator('#attention-hours')).toContainText('320 h');
  await expect(page.locator('#send')).toBeVisible();
  await expect(page.locator('#newsletter')).toBeVisible();
  expect(errors).toEqual([]);
  await context.close();
 });
}
