const { test, expect } = require('@playwright/test');
const url='http://127.0.0.1:4173/preview/';
const viewports=[{width:320,height:700},{width:375,height:812},{width:390,height:844},{width:430,height:932},{width:768,height:1024},{width:1280,height:840}];
for (const vp of viewports){
 test('white website and bounded Lab-inspired viewport at '+vp.width,async({browser})=>{
  const context=await browser.newContext({viewport:vp});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded'});
  const iframe=page.locator('#operator-frame'),app=page.frameLocator('#operator-frame');
  await expect(iframe).toBeVisible();
  await expect(page.locator('h1')).toContainText('Keep the conversation');
  await expect(page.locator('body')).toHaveCSS('background-color','rgb(255, 255, 255)');
  await expect(app.locator('#attention')).toHaveText('3 need attention');
  await expect(app.locator('.app-topbar')).toContainText('Review queue');
  await expect(app.locator('.inbox .case-btn')).toHaveCount(3);
  const box=await iframe.boundingBox();
  expect(Math.round(box.height)).toBe(vp.width<=620?520:vp.width<=900?575:625);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBeFalsy();
  expect(await app.locator('body').evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBeFalsy();
  await app.locator('#try').evaluate(e=>e.open=true);
  await app.locator('#audit').evaluate(e=>e.open=true);
  await app.getByRole('button',{name:'Review identity'}).click();
  const after=await iframe.boundingBox();
  expect(Math.round(after.height)).toBe(Math.round(box.height));
  // User and browser may scroll the outer page to bring the iframe into view.
  // What must remain invariant is the iframe size and the website's layout height.
  expect(Math.round(after.width)).toBe(Math.round(box.width));
  expect(errors).toEqual([]);
  await context.close();
 });
}
test('prototype is separate real-console-style viewport with internal scrolling',async({page})=>{
 await page.goto(url);
 const iframe=page.locator('#operator-frame'),app=page.frameLocator('#operator-frame');
 const before=await iframe.boundingBox();
 await expect(app.locator('.app-topbar')).toBeVisible();
 await expect(app.locator('.sidebar')).toContainText('Review queue');
 await app.locator('#try').evaluate(e=>e.open=true);
 await app.locator('#audit').evaluate(e=>e.open=true);
 const height=await app.locator('.app-main').evaluate(e=>({scroll:e.scrollHeight,client:e.clientHeight,overflow:getComputedStyle(e).overflowY}));
 expect(height.scroll).toBeGreaterThan(height.client);
 expect(height.overflow).toBe('auto');
 const after=await iframe.boundingBox();
 expect(after.height).toBe(before.height);
 await expect(page.locator('#product-screen')).toBeVisible();
 await expect(app.locator('#reset')).toHaveCount(1);
});
test('ambiguous identity needs independent verification',async({page})=>{
 await page.goto(url);const app=page.frameLocator('#operator-frame');
 await expect(app.locator('#case-heading')).toHaveText('Identity needs review');
 await expect(app.locator('#context')).toContainText('Mia');
 await expect(app.locator('#context')).toContainText('Luca');
 await app.getByRole('button',{name:'Review identity'}).click();
 await expect(app.locator('#resolve')).toBeDisabled();
 await app.locator('#destination').selectOption('CRM-10052');
 await app.locator('#evidence').fill('Confirmed customer identity in independent call');
 await expect(app.locator('#resolve')).toBeDisabled();
 await app.locator('#verified').check();
 await expect(app.locator('#resolve')).toBeEnabled();
 await app.locator('#resolve').click();
 await expect(app.locator('#attention')).toHaveText('2 need attention');
 await app.locator('#audit').evaluate(e=>e.open=true);
 await expect(app.locator('#audit-items')).toContainText('Identity verified');
});
test('new records require verification and contact permission',async({page})=>{
 await page.goto(url);const app=page.frameLocator('#operator-frame');
 await app.locator('.case-btn').filter({hasText:'Taylor Reed'}).click();
 await app.getByRole('button',{name:'Review new record'}).click();
 await app.locator('#evidence').fill('Verified by callback from event organizer');
 await app.locator('#verified').check();
 await expect(app.locator('#resolve')).toBeDisabled();
 await app.locator('#permission').check();
 await expect(app.locator('#resolve')).toBeEnabled();
 await app.locator('#resolve').click();
 await expect(app.locator('#attention')).toHaveText('2 need attention');
});
test('lost acknowledgement reconciles one original write',async({page})=>{
 await page.goto(url);const app=page.frameLocator('#operator-frame');
 await app.locator('.case-btn').filter({hasText:'Nora Chen'}).click();
 await expect(app.locator('#context')).toContainText('Ari');
 await app.getByRole('button',{name:'Check delivery receipt'}).click();
 await expect(app.locator('#attention')).toHaveText('2 need attention');
 const receipt=await app.locator('body').evaluate(()=>JSON.parse(localStorage.getItem('intake-exceptions-v1')).ledger['delivery-203']);
 expect(receipt).toEqual({contactId:'CRM-10632',attempts:2,writes:1});
 await page.reload();
 const again=await app.locator('body').evaluate(()=>JSON.parse(localStorage.getItem('intake-exceptions-v1')).ledger['delivery-203']);
 expect(again.writes).toBe(1);
});
test('manual example never links by email alone',async({page})=>{
 await page.goto(url);const app=page.frameLocator('#operator-frame');
 await app.locator('#try').evaluate(e=>e.open=true);
 await app.locator('#new-name').fill('Alex Morgan');
 await app.locator('#new-email').fill('alex@example.com');
 await app.locator('#new-message').fill('Can you follow up?');
 await app.getByRole('button',{name:'Check enquiry'}).click();
 await expect(app.locator('#case-heading')).toHaveText('Identity needs review');
 await expect(app.locator('#case-reason')).toContainText('Email alone');
});
test('reset returns example to original state',async({page})=>{
 await page.goto(url);const app=page.frameLocator('#operator-frame');
 await app.locator('.case-btn').filter({hasText:'Nora Chen'}).click();
 await app.getByRole('button',{name:'Check delivery receipt'}).click();
 await expect(app.locator('#attention')).toHaveText('2 need attention');
 await page.reload();
 await expect(app.locator('#attention')).toHaveText('2 need attention');
 await app.getByRole('button',{name:'Reset example'}).click();
 await expect(app.locator('#attention')).toHaveText('3 need attention');
});
