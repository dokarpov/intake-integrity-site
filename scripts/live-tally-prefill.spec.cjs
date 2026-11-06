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
