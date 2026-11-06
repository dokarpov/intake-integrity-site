const {test,expect}=require('@playwright/test');
const root=(process.env.ACORDE_BASE_URL||'http://127.0.0.1:4173').replace(/\/$/,'');
const sizes=[{width:320,height:720},{width:375,height:812},{width:390,height:844},{width:768,height:1024},{width:1440,height:900}];
test('Acorde home has the commercial calculator as its second section',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(root+'/');
  const order=await page.evaluate(()=>[...document.querySelector('main').children].slice(0,3).map(e=>e.className));
  expect(order[0]).toContain('intro');
  expect(order[1]).toContain('loss-entrance');
  expect(order[2]).toContain('queue-title');
  await expect(page.locator('#loss-title')).toContainText('What are missed handoffs');
  await expect(page.locator('.loss-cta')).toHaveAttribute('href','./calculator.html');
  await page.locator('.loss-cta').click();
  await expect(page).toHaveURL(/calculator\.html\?mode=sales$/);
  await expect(page.locator('h1')).toContainText('Where is revenue');
  expect(errors).toEqual([]);
});
test('calculator does not claim preset assumptions are measured losses',async({page})=>{
  await page.goto(root+'/calculator.html');
  await expect(page.locator('#empty-result')).toBeVisible();
  await expect(page.locator('#advanced-settings')).toBeVisible();
  await expect(page.locator('#advanced-settings')).toContainText('Conversion & costs');
  await expect(page.locator('#result-content')).toBeHidden();
  await expect(page.locator('#next-step')).toBeHidden();
  await expect(page.locator('#recoverable')).toBeVisible();
  expect(await page.locator('body').innerText()).not.toContain('Read carefully');
  await page.getByRole('button',{name:'Calculate potential exposure'}).click();
  await expect(page.locator('#annual-revenue')).not.toBeEmpty();
  await expect(page.locator('#next-step')).toBeVisible();
  await expect(page.locator('#audit-link')).toBeVisible();
  await expect(page.locator('#audit-link')).toHaveAttribute('href',/offer_name=Paid\+workflow\+audit/);
  await expect(page.locator('#audit-link')).toHaveAttribute('href',/flow_name=Sales\+enquiries\+and\+follow-up/);
  await expect(page.locator('#audit-link')).toHaveAttribute('href',/offer=audit/);
  await expect(page.locator('#build-link')).toHaveAttribute('href',/offer_name=Six-week\+implementation/);
  await expect(page.locator('#build-link')).toHaveAttribute('href',/flow_name=Sales\+enquiries\+and\+follow-up/);
  await expect(page.locator('#build-link')).toHaveAttribute('href',/offer=implementation/);
  await expect(page.locator('.range-method')).toContainText('Not a statistical confidence interval');
  expect(await page.locator('body').innerText()).not.toContain('Guaranteed ROI');
  expect(await page.locator('body').innerText()).not.toContain('dokarpov@gmail.com');
});
test('editable scenario computes mutually exclusive failure stages and separate staff costs',async({page})=>{
  await page.goto(root+'/calculator.html?mode=sales');
  await expect(page.locator('#closeRate')).toBeVisible();
  const values={volume:'100',avgValue:'100',captureLoss:'10',handoffLoss:'20',closeRate:'100',recoverable:'50',margin:'30',reworkMinutes:'0',hourlyCost:'0'};
  for(const [id,val] of Object.entries(values))await page.locator('#'+id).fill(val);
  await page.locator('#calculate').click();
  await expect(page.locator('#annual-revenue')).toContainText('16,800');
  await expect(page.locator('#monthly-revenue')).toContainText('1,400');
  await expect(page.locator('#gross-at-risk')).toContainText('2,800');
  await expect(page.locator('#contribution')).toContainText('420');
  await expect(page.locator('#range')).toContainText('8,400');
  await expect(page.locator('#range')).toContainText('25,200');
  await expect(page.locator('#stage-breakdown')).toContainText('28 cases at risk · 10 at entry · 18 at handoff');
  await expect(page.locator('#assumption-note')).toContainText('50% recoverable');
  await expect(page.locator('#audit-link')).toBeVisible();
  await expect(page.locator('#rework')).toContainText('0');
  await page.locator('#hourlyCost').fill('100');
  await page.locator('#reworkMinutes').fill('60');
  await expect(page.locator('#monthly-revenue')).toContainText('1,400');
  await expect(page.locator('#rework')).not.toContainText('€0');
});
test('three business paths update labels and examples without fabricating benchmarks',async({page})=>{
  await page.goto(root+'/calculator.html?mode=orders');
  await expect(page.locator('[data-mode=orders]')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#volume-label')).toContainText('Order attempts per month');
  await page.locator('#calculate').click();
  const orders=await page.locator('#annual-revenue').innerText();
  await page.locator('[data-mode=operations]').click();
  await expect(page.locator('#volume-label')).toContainText('Billable requests per month');
  await expect(page.locator('#audit-link')).toHaveAttribute('href',/flow=operations/);
  await expect(page.locator('#audit-link')).toHaveAttribute('href',/flow_name=Operations\+and\+team\+handoffs/);
  await expect(page.locator('#result-content')).toBeHidden();
  await page.locator('#calculate').click();
  const ops=await page.locator('#annual-revenue').innerText();
  expect(ops).not.toEqual(orders);
  await page.locator('[data-mode=sales]').click();
  await expect(page.locator('#volume')).toHaveValue('250');
  await expect(page.locator('#result-content')).toBeHidden();
});
test('zero missed and handoff cases yields no implied leakage',async({page})=>{
  await page.goto(root+'/calculator.html');
  await page.locator('#captureLoss').fill('0');
  await page.locator('#handoffLoss').fill('0');
  await page.locator('#calculate').click();
  await expect(page.locator('#annual-revenue')).toContainText('0');
  await expect(page.locator('#bottleneck')).toContainText('No cases at risk');
});
for(const viewport of sizes){
  test('calculator and entry are readable without sideways scrolling at '+viewport.width,async({browser})=>{
    const context=await browser.newContext({viewport,reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(root+'/');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
    await expect(page.locator('#revenue-loss')).toBeVisible();
    await page.goto(root+'/calculator.html');
    await page.locator('#calculate').click();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
    const result=await page.locator('#result').boundingBox();expect(result?.width||0).toBeGreaterThan(240);
    await expect(page.locator('#audit-link')).toBeVisible();
    expect(errors).toEqual([]);
    await context.close();
  });
}


test('campaign parameters persist from landing to calculator to the consent-based lead form',async({page})=>{
  await page.goto(root+'/?utm_source=linkedin&utm_medium=organic&utm_campaign=november_launch');
  const entry=page.locator('.loss-cta');
  await expect(entry).toHaveAttribute('href',/utm_source=linkedin/);
  await entry.click();
  await expect(page).toHaveURL(/utm_source=linkedin/);
  await page.getByRole('button',{name:'Calculate potential exposure'}).click();
  await expect(page.locator('#audit-link')).toHaveAttribute('href',/utm_source=linkedin/);
  await expect(page.locator('#build-link')).toHaveAttribute('href',/utm_campaign=november_launch/);
  await page.locator('[data-mode=orders]').click();
  await expect(page).toHaveURL(/utm_source=linkedin/);
  await expect(page.locator('#audit-link')).toHaveAttribute('href',/flow=orders/);
  await page.goto(root+'/privacy.html');
  await expect(page.getByRole('heading',{name:'Privacy & data use'})).toBeVisible();
  await expect(page.getByText('Nothing is uploaded when you edit or calculate an estimate.')).toBeVisible();
});

test('malformed campaign parameters are not forwarded to third party form',async({page})=>{
  await page.goto(root+'/calculator.html?utm_source='+encodeURIComponent('"><img src=x onerror=1>'));
  await page.getByRole('button',{name:'Calculate potential exposure'}).click();
  await expect(page.locator('#audit-link')).not.toHaveAttribute('href',/utm_source=/);
});


test('all four customer workflows are visible without accordion hunting',async({page})=>{
 await page.goto(root+'/');
 await page.locator('#reset').click();
 await expect(page.locator('#inbox .case-btn')).toHaveCount(4);
 await expect(page.locator('#new-enquiry-tab')).toBeVisible();
 await expect(page.locator('#audit')).toBeVisible();
 await expect(page.locator('#audit-items')).toContainText('Verified account match');
 expect(await page.locator('main details').count()).toBe(0);
 await expect(page.locator('#case-heading')).toContainText('Identity needs review');
 await page.getByRole('button',{name:/New customer: Taylor Reed/}).click();
 await expect(page.locator('#case-heading')).toContainText('New customer approval');
 await page.getByRole('button',{name:/Delivery: Nora Chen/}).click();
 await expect(page.locator('#case-heading')).toContainText('Check delivery outcome');
 await expect(page.getByRole('button',{name:'Check delivery receipt'})).toBeVisible();
 await page.getByRole('button',{name:/Try an enquiry/}).click();
 await expect(page.locator('#try')).toBeVisible();
 await expect(page.locator('#case-pane')).toBeHidden();
 await expect(page.locator('#new-name')).toBeVisible();
 await expect(page.getByRole('button',{name:'Check this enquiry'})).toBeVisible();
});

test('new enquiry can be submitted as an immediately discoverable fourth workflow',async({page})=>{
 await page.goto(root+'/');
 await page.locator('#reset').click();
 await page.locator('#new-enquiry-tab').click();
 await page.locator('#new-name').fill('Alex Quinn');
 await page.locator('#new-email').fill('alex.quinn@example.com');
 await page.locator('#new-message').fill('Please follow up on our quote.');
 await page.getByRole('button',{name:'Check this enquiry'}).click();
 await expect(page.locator('#case-heading')).toContainText('New customer approval');
 await expect(page.locator('#case-message')).toContainText('Please follow up on our quote.');
 await expect(page.locator('#audit-items')).toContainText('Enquiry checked');
 await expect(page.locator('#case-pane')).toBeVisible();
});

for(const width of [320,375,390,768]){
 test('mobile information hierarchy keeps scenarios visible and avoids long case stacks at '+width,async({browser})=>{
  const context=await browser.newContext({viewport:{width,height:844},reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(root+'/');
  await page.locator('#reset').click();
  const metrics=await page.evaluate(()=>{
   const rect=s=>document.querySelector(s).getBoundingClientRect();
   return {overflow:document.documentElement.scrollWidth>innerWidth, 
    scenarioTop:rect('#inbox').top+scrollY,
    stageBottom:rect('.workspace').bottom+scrollY,
    tabs:[...document.querySelectorAll('#inbox .case-btn')].map(n=>n.getBoundingClientRect().width),
    accordions:document.querySelectorAll('main details').length};
  });
  expect(metrics.overflow).toBe(false);
  expect(metrics.accordions).toBe(0);
  expect(metrics.tabs).toHaveLength(4);
  expect(Math.min(...metrics.tabs)).toBeGreaterThan(90);
  if(width===390){
   expect(metrics.scenarioTop).toBeLessThan(850);
   expect(metrics.stageBottom).toBeLessThan(1750);
  }
  expect(errors).toEqual([]);
  await context.close();
 });
}


test('mobile conversion controls are grouped without excessive gaps',async({browser})=>{
  const ctx=await browser.newContext({viewport:{width:375,height:812},reducedMotion:'reduce'});
  const page=await ctx.newPage();
  await page.goto(root+'/calculator.html');
  await expect(page.locator('#closeRate')).toBeVisible();
  await page.locator('#calculate').click();
  await expect(page.locator('#next-step')).toBeVisible();
  const boxes=await page.evaluate(()=>{
    const a=document.querySelector('#audit-link').getBoundingClientRect();
    const b=document.querySelector('#build-link').getBoundingClientRect();
    const x=document.querySelector('#copy').getBoundingClientRect();
    const top=document.querySelector('#result').getBoundingClientRect();
    return {gap:b.top-a.bottom,copyGap:x.top-b.bottom,resultWidth:top.width,scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth,details:document.querySelectorAll('main details').length};
  });
  expect(boxes.gap).toBeGreaterThanOrEqual(0);
  expect(boxes.gap).toBeLessThanOrEqual(12);
  expect(boxes.copyGap).toBeLessThanOrEqual(30);
  expect(boxes.resultWidth).toBeGreaterThan(300);
  expect(boxes.scrollWidth).toBeLessThanOrEqual(boxes.viewport);
  expect(boxes.details).toBe(0);
  await expect(page.locator('footer')).toHaveCount(0);
  await ctx.close();
});
test('homepage exposes review and enquiry flows without accordions or narrative footnotes',async({page})=>{
  await page.goto(root+'/');
  await expect(page.getByRole('button',{name:/Try a new enquiry|Try an enquiry/})).toBeVisible();
  await expect(page.locator('#inbox button')).toHaveCount(4);
  expect(await page.locator('main details').count()).toBe(0);
  expect((await page.locator('main').innerText()).toLowerCase()).not.toContain('not a real crm');
  await expect(page.locator('footer')).toHaveCount(0);
});


test('resolved delivery stays accessible and explains its safe receipt',async({page})=>{
 await page.goto(root+'/');
 await page.locator('#reset').click();
 await page.getByRole('button',{name:/Delivery: Nora Chen/}).click();
 await page.getByRole('button',{name:'Check delivery receipt'}).click();
 await expect(page.locator('#case-heading')).toContainText('Delivery reconciled');
 await expect(page.locator('#case-actions')).toContainText('no duplicate write');
 await expect(page.locator('#inbox .case-btn')).toHaveCount(4);
 await page.getByRole('button',{name:/Identity: Sam Lee/}).click();
 await expect(page.locator('#case-heading')).toContainText('Identity needs review');
 await page.getByRole('button',{name:/Delivery: Nora Chen/}).click();
 await expect(page.locator('#case-heading')).toContainText('Delivery reconciled');
});
