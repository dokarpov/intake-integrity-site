const {test,expect}=require('@playwright/test');
const front=process.env.ACORDE_BASE_URL||'https://br-shiny-union-bajmnaa3-acordepreview.compute.c-8.eu-central-1.aws.neon.tech';
const cases=[
 {mode:'sales',offer:'audit',offerIndex:0,flowIndex:2,button:'audit-link'},
 {mode:'orders',offer:'implementation',offerIndex:1,flowIndex:3,button:'build-link'},
 {mode:'operations',offer:'audit',offerIndex:0,flowIndex:4,button:'audit-link'}
];
for(const item of cases){
 test('live calculator to prefilled, consent-gated Tally '+item.mode+'/'+item.offer,async({page})=>{
  test.setTimeout(90000);
  await page.goto(front+'/calculator.html?mode='+item.mode,{waitUntil:'domcontentloaded'});
  await page.locator('#calculate').click();
  const href=await page.locator('#'+item.button).getAttribute('href');
  expect(href).toContain('https://tally.so/r/5XbAeE?');
  expect(href).toContain('offer='+item.offer);
  expect(href).toContain('flow='+item.mode);
  const response=await page.goto(href,{waitUntil:'domcontentloaded',timeout:60000});
  expect(response?.status()).toBe(200);
  const controls=page.locator('input[type="radio"]');
  await expect(controls).toHaveCount(11,{timeout:15000});
  await expect(page.getByText('Paid workflow audit',{exact:true})).toBeVisible();
  await expect(page.getByText('Six-week implementation',{exact:true})).toBeVisible();
  await expect(page.getByText('Business email',{exact:true})).toBeVisible();
  await expect(controls.nth(item.offerIndex)).toBeChecked();
  await expect(controls.nth(1-item.offerIndex)).not.toBeChecked();
  await expect(controls.nth(item.flowIndex)).toBeChecked();
  for(const n of [2,3,4,5].filter(x=>x!==item.flowIndex))await expect(controls.nth(n)).not.toBeChecked();
  await expect(page.locator('input[type="checkbox"]')).not.toBeChecked();
  await expect(page.getByText('Please confirm',{exact:true})).toBeVisible();
  console.log('PASS real published Tally prefill + opt-in:',item.mode,item.offer);
 });
}

test('newsletter signup is a separate published form with prefilling and unchecked consent',async({page})=>{
 test.setTimeout(90000);
 await page.goto(front+'/comparison.html?utm_source=manual-review',{waitUntil:'domcontentloaded'});
 await page.locator('#recipient').fill('qa@example.com');
 await page.locator('#newsletter').check();
 const href=await page.locator('#newsletter-link').getAttribute('href');
 const link=new URL(href);
 expect(link.origin).toBe('https://tally.so');
 expect(link.pathname).toBe('/r/ArK9ZD');
 expect(link.searchParams.get('subscriber_email')).toBe('qa@example.com');
 expect(link.searchParams.get('utm_source')).toBe('manual-review');
 const response=await page.goto(href,{waitUntil:'domcontentloaded',timeout:60000});
 expect(response?.status()).toBe(200);
 await expect(page.getByText('Acorde — useful CRM updates',{exact:true})).toBeVisible({timeout:15000});
 await expect(page.locator('input[type="email"]')).toHaveValue('qa@example.com');
 await expect(page.locator('input[type="checkbox"]')).not.toBeChecked();
 await expect(page.getByText('Your explicit opt-in',{exact:true})).toBeVisible();
 console.log('PASS optional subscriber email prefill and separate required opt-in. No test submission.');
});
