const { test, expect } = require('@playwright/test');
const home='http://127.0.0.1:4173/preview/';
const sizes=[{width:320,height:700},{width:375,height:812},{width:390,height:844},{width:430,height:932},{width:768,height:1024},{width:1280,height:840}];
for(const viewport of sizes){
 test('mobile-first white layout '+viewport.width,async({browser})=>{
  const context=await browser.newContext({viewport});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(home,{waitUntil:'domcontentloaded'});
  await expect(page.locator('h1')).toContainText('Keep the conversation');
  await expect(page.locator('body')).toHaveCSS('background-color','rgb(255, 255, 255)');
  await expect(page.locator('#attention')).toHaveText('3 need attention');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
  await expect(page.getByText('Sales workflow study')).toHaveCount(0);
  await expect(page.locator('nav .tabs')).toHaveCount(0);
  if(viewport.width<=390)expect(await page.locator('h1').evaluate(x=>parseFloat(getComputedStyle(x).fontSize))).toBeLessThanOrEqual(48);
  expect(errors).toEqual([]);
  await context.close();
 });
}

test('prototype is one visually distinct screen, not blended with the website',async({page})=>{
 await page.goto(home);
 const frame=page.locator('#product-screen');
 await expect(frame).toBeVisible();
 await expect(frame.locator('.product-screen-bar')).toContainText('Customer inbox');
 await expect(frame.locator('#inbox')).toBeVisible();
 await expect(frame.locator('#case-pane')).toBeVisible();
 await expect(frame.locator('#try')).toBeVisible();
 await expect(frame.locator('#audit')).toBeVisible();
 await expect(frame.locator('#reset')).toHaveCount(1);
 const metrics=await page.evaluate(()=>{
  const frame=document.getElementById('product-screen');
  const intro=document.querySelector('section.intro');
  const a=frame.getBoundingClientRect(),b=intro.getBoundingClientRect();
  const style=getComputedStyle(frame),bar=getComputedStyle(frame.querySelector('.product-screen-bar'));
  return {gap:a.top-b.bottom,border:parseFloat(style.borderTopWidth),radius:parseFloat(style.borderTopLeftRadius),outerBg:getComputedStyle(document.body).backgroundColor,barBg:bar.backgroundColor};
 });
 expect(metrics.gap).toBeGreaterThan(5);
 expect(metrics.border).toBeGreaterThanOrEqual(1);
 expect(metrics.radius).toBeGreaterThanOrEqual(7);
 expect(metrics.outerBg).toBe('rgb(255, 255, 255)');
 expect(metrics.barBg).toBe('rgb(247, 247, 247)');
});

test('ambiguous identity held until independent verification and explicit selection',async({page})=>{
 await page.goto(home);
 await expect(page.locator('#case-heading')).toHaveText('Identity needs review');
 await expect(page.locator('#context')).toContainText('Mia');
 await expect(page.locator('#context')).toContainText('Luca');
 await page.getByRole('button',{name:'Review identity'}).click();
 await expect(page.locator('#resolve')).toBeDisabled();
 await page.locator('#destination').selectOption('CRM-10052');
 await page.locator('#evidence').fill('Confirmed customer identity in independent call');
 await expect(page.locator('#resolve')).toBeDisabled();
 await page.locator('#verified').check();
 await expect(page.locator('#resolve')).toBeEnabled();
 await page.locator('#resolve').click();
 await expect(page.locator('#attention')).toHaveText('2 need attention');
 await page.locator('#audit').evaluate(x=>x.open=true);
 await expect(page.locator('#audit-items')).toContainText('Identity verified');
});
test('new record needs permission as well as independent verification',async({page})=>{
 await page.goto(home);
 await page.locator('.case-btn').filter({hasText:'Taylor Reed'}).click();
 await expect(page.locator('#case-heading')).toHaveText('New customer approval');
 await page.getByRole('button',{name:'Review new record'}).click();
 await page.locator('#evidence').fill('Verified by callback from event organizer');
 await page.locator('#verified').check();
 await expect(page.locator('#resolve')).toBeDisabled();
 await page.locator('#permission').check();
 await expect(page.locator('#resolve')).toBeEnabled();
 await page.locator('#resolve').click();
 await expect(page.locator('#attention')).toHaveText('2 need attention');
 await expect(page.locator('.case-btn').filter({hasText:'Taylor Reed'})).toHaveCount(0);
});
test('lost acknowledgement reconciles without repeating simulated record write',async({page})=>{
 await page.goto(home);
 await page.locator('.case-btn').filter({hasText:'Nora Chen'}).click();
 await expect(page.locator('#context')).toContainText('Ari');
 await expect(page.locator('#context')).toContainText('Send pricing summary');
 await page.getByRole('button',{name:'Check delivery receipt'}).click();
 await expect(page.locator('#attention')).toHaveText('2 need attention');
 const receipt=await page.evaluate(()=>JSON.parse(localStorage.getItem('intake-exceptions-v1')).ledger['delivery-203']);
 expect(receipt).toEqual({contactId:'CRM-10632',attempts:2,writes:1});
 await page.reload();
 const again=await page.evaluate(()=>JSON.parse(localStorage.getItem('intake-exceptions-v1')).ledger['delivery-203']);
 expect(again.writes).toBe(1);
 await page.locator('#audit').evaluate(x=>x.open=true);
 await expect(page.locator('#audit-items')).toContainText('Delivery reconciled');
});
test('manually submitted enquiry never gets trusted match solely from email',async({page})=>{
 await page.goto(home);
 await page.locator('#try').evaluate(x=>x.open=true);
 await page.locator('#new-name').fill('Alex Morgan');
 await page.locator('#new-email').fill('alex@example.com');
 await page.locator('#new-message').fill('Can you follow up?');
 await page.getByRole('button',{name:'Check enquiry'}).click();
 await expect(page.locator('#case-heading')).toHaveText('Identity needs review');
 await expect(page.locator('#case-reason')).toContainText('Email alone');
 await expect(page.locator('[data-scenario]')).toHaveCount(0);
});
test('all user decisions persist and reset restores example',async({page})=>{
 await page.goto(home);
 await page.locator('.case-btn').filter({hasText:'Nora Chen'}).click();
 await page.getByRole('button',{name:'Check delivery receipt'}).click();
 await page.reload();
 await expect(page.locator('#attention')).toHaveText('2 need attention');
 await page.getByRole('button',{name:'Reset example'}).click();
 await expect(page.locator('#attention')).toHaveText('3 need attention');
});
