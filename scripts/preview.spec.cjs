const { test, expect } = require('@playwright/test');
const cases = [
  {name:'mobile 320',width:320,height:700},
  {name:'mobile 390',width:390,height:844},
  {name:'tablet 768',width:768,height:1024},
  {name:'desktop 1280',width:1280,height:850}
];
for (const viewport of cases) {
 test('responsive and accessible: '+viewport.name, async ({browser}) => {
  const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height}});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/preview/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('h1')).toContainText('Keep the conversation.');
  await expect(page.locator('body')).toHaveCSS('background-color','rgb(255, 255, 255)');
  await expect(page.getByRole('link',{name:'Explore an enquiry'})).toBeVisible();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth);
  expect(overflow).toBeFalsy();
  if(viewport.width<=390){const size=await page.locator('h1').evaluate(el=>parseFloat(getComputedStyle(el).fontSize));expect(size).toBeLessThanOrEqual(48)}
  expect(errors).toEqual([]);
  await context.close();
 });
}
test('customer context preserved and matching decision uses verified source',async({page})=>{
 await page.goto('http://127.0.0.1:4173/preview/',{waitUntil:'domcontentloaded'});
 await page.getByRole('button',{name:'Check customer history'}).click();
 await expect(page.locator('#decision-status')).toHaveText('Existing customer');
 await expect(page.locator('#customer-history')).toContainText('Nina');
 await expect(page.locator('#customer-history')).toContainText('Send revised quote');
 await expect(page.locator('#captured-message')).toContainText('revised quote');
 await page.getByRole('button',{name:'Next enquiry'}).click();
 await expect(page.locator('#lead-name')).toHaveValue('Taylor Reed');
 await page.getByRole('button',{name:'Check customer history'}).click();
 await expect(page.locator('#decision-status')).toHaveText('New customer proposed');
 await expect(page.locator('#captured-message')).toContainText('event');
 await page.getByRole('button',{name:'Next enquiry'}).click();
 await expect(page.locator('#lead-name')).toHaveValue('Sam Lee');
 await page.getByRole('button',{name:'Check customer history'}).click();
 await expect(page.locator('#decision-status')).toHaveText('Needs review');
 await expect(page.locator('.candidate')).toHaveCount(2);
 await expect(page.locator('#record-decision')).toBeDisabled();
 await page.locator('#resolution').selectOption('CRM-10052');
 await page.locator('#verification-note').fill('Verified independently in a fictional callback');
 await expect(page.locator('#record-decision')).toBeDisabled();
 await page.locator('#verified').check();
 await expect(page.locator('#record-decision')).toBeEnabled();
 await page.locator('#record-decision').click();
 await expect(page.locator('#decision-status')).toHaveText('Review recorded');
 await page.locator('#decision-history summary').click();
 await expect(page.locator('#events')).toContainText('Reviewed');
});
test('shared email alone never auto-links and no outcome-selector shortcut',async({page})=>{
 await page.goto('http://127.0.0.1:4173/preview/',{waitUntil:'domcontentloaded'});
 await page.locator('#lead-name').fill('Different Contact');
 await page.getByRole('button',{name:'Check customer history'}).click();
 await expect(page.locator('#decision-status')).toHaveText('Needs review');
 await expect(page.locator('#record-decision')).toBeDisabled();
 await expect(page.locator('[data-scenario]')).toHaveCount(0);
});
test('hold remains unresolved, no fabricated writes or confirmation',async({page})=>{
 await page.goto('http://127.0.0.1:4173/preview/',{waitUntil:'domcontentloaded'});
 await page.locator('#lead-email').fill('sam@example.com');
 await page.getByRole('button',{name:'Check customer history'}).click();
 await page.getByRole('button',{name:'Keep on hold'}).click();
 await expect(page.locator('#decision-description')).toContainText('remains unassigned');
 await page.locator('#decision-history summary').click();
 await expect(page.locator('#events')).toContainText('On hold');
});
