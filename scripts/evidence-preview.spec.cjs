const {test,expect}=require('@playwright/test');
const base='http://127.0.0.1:4173/testing/integrity/';
for(const width of [320,390,768,1280]){
 test('testing build white, bounded and usable at '+width+'px',async({browser})=>{
  const ctx=await browser.newContext({viewport:{width,height:850}});
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await expect(page.locator('body')).toHaveCSS('background-color','rgb(255, 255, 255)');
  await expect(page.locator('h1')).toContainText('Compare the evidence');
  await expect(page.locator('#result-title')).toContainText('2 rules require attention');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBeFalsy();
  const box=await page.locator('#monitor-scroll').boundingBox();
  const expected=width<=600?520:width<=850?575:650;
  expect(Math.round(box.height)).toBe(expected);
  await page.getByRole('button',{name:'Identical values'}).click();
  await expect(page.locator('#result-title')).toContainText('No discrepancies found');
  await page.getByRole('button',{name:'Different spelling'}).click();
  const end=await page.locator('#monitor-scroll').boundingBox();
  expect(Math.round(end.height)).toBe(Math.round(box.height));
  expect(errors).toEqual([]);
  await ctx.close();
 });
}
test('SOFIA/SOPHIA/SOFIA shows two explicit differences without business decision',async({page})=>{
 await page.goto(base);
 await expect(page.locator('#findings .finding')).toHaveCount(2);
 await expect(page.locator('#findings')).toContainText('Order text versus approved proof');
 await expect(page.locator('#findings')).toContainText('Approved text versus production file');
 await expect(page.locator('#findings')).toContainText('"SOPHIA"');
 await expect(page.locator('#result-intro')).toContainText('No production decision has been made');
 await expect(page.locator('body')).not.toContainText('READY');
 await expect(page.locator('body')).not.toContainText('HOLD');
});
test('edition changes evidence findings rather than deciding order state',async({page})=>{
 await page.goto(base);
 await page.getByRole('button',{name:'Identical values'}).click();
 await page.locator('#asset-font').fill('Serif Bold');
 await page.getByRole('button',{name:'Compare evidence'}).click();
 await expect(page.locator('#result-title')).toContainText('1 rule requires attention');
 await expect(page.locator('#findings')).toContainText('Approved font versus production file');
});
test('untrusted approval and absent approval are explicitly unverifiable',async({page})=>{
 await page.goto(base);
 await page.getByRole('button',{name:'Identical values'}).click();
 await page.locator('#approval-trusted').uncheck();
 await page.getByRole('button',{name:'Compare evidence'}).click();
 await expect(page.locator('#findings')).toContainText('Approval independently verified');
 await expect(page.locator('#findings')).toContainText('unverifiable');
 await page.locator('#approval-exists').uncheck();
 await page.getByRole('button',{name:'Compare evidence'}).click();
 await expect(page.locator('#findings')).toContainText('missing evidence');
});
test('operator chooses next step; assessment does not change workflow state',async({page})=>{
 await page.goto(base);
 await page.locator('#decision-note').fill('Request customer reconfirmation of the exact artwork text.');
 await page.getByRole('button',{name:'Record my assessment'}).click();
 await expect(page.locator('#assessments')).toContainText('Request customer reconfirmation');
 await expect(page.locator('#record-status')).toContainText('browser session only');
 await expect(page.locator('#result-title')).toContainText('2 rules require attention');
});
