const {test,expect}=require('@playwright/test');
const root=(process.env.ACORDE_BASE_URL||'http://127.0.0.1:4173').replace(/\/$/,'');
const base=root+'/comparison.html';
async function loadSample(page,mode='manual'){
 await page.goto(base+'?baseline='+mode);
 await page.locator('#example').click();
 await expect(page.locator('#results-data')).toBeVisible();
}
test('homepage and calculator link to the comparison, preserving allowed campaign values',async({page})=>{
 await page.goto(root+'/?utm_source=linkedin&utm_campaign=pilot');
 await expect(page.locator('.loss-compare')).toHaveAttribute('href',/comparison\.html\?utm_source=linkedin/);
 await page.locator('.loss-compare').click();
 await expect(page).toHaveURL(/comparison\.html\?utm_source=linkedin/);
 await expect(page.locator('h1')).toContainText('current process');
 await page.goto(root+'/calculator.html?mode=sales&utm_source=linkedin');
 await expect(page.locator('#cost-compare-link')).toHaveAttribute('href',/utm_source=linkedin/);
 await page.locator('#cost-compare-link').click();
 await expect(page).toHaveURL(/comparison\.html\?/);
 await expect(page.locator('[data-baseline=manual]')).toHaveAttribute('aria-pressed','true');
});
test('no invented price: blank inputs never show cost figures or savings',async({page})=>{
 await page.goto(base);
 await expect(page.locator('#results-data')).toBeHidden();
 await expect(page.locator('#results-empty')).toBeVisible();
 await expect(page.locator('#currentSoftwareMonthly')).toBeDisabled();
 await page.locator('#compare').click();
 await expect(page.locator('#error')).toContainText('Enter hourlyCost');
 await expect(page.locator('#results-data')).toBeHidden();
 await expect(page.locator('#copy')).toBeDisabled();
});
test('manual workflow shows software zero but labour remains: first year is calculated correctly',async({page})=>{
 await loadSample(page,'manual');
 await expect(page.locator('#current-monthly')).toContainText('1,500');
 await expect(page.locator('#proposed-monthly')).toContainText('965');
 await expect(page.locator('#current-year')).toContainText('18,000');
 await expect(page.locator('#proposed-year')).toContainText('11,580');
 await expect(page.locator('#difference')).toContainText('6,420');
 await expect(page.locator('#current-software')).toContainText('0');
 await expect(page.locator('#current-hours')).toContainText('50 h / month');
 await expect(page.locator('#proposed-hours')).toContainText('18 h / month');
 await expect(page.locator('#monthly-difference')).toContainText('635');
 await expect(page.locator('#example-note')).toContainText('Fictional values loaded');
});
test('existing tool includes licence and manual correction cost: no false software-only comparison',async({page})=>{
 await loadSample(page,'tool');
 await expect(page.locator('#currentSoftwareMonthly')).toBeEnabled();
 await expect(page.locator('#tool-name-field')).toBeVisible();
 await expect(page.locator('#current-monthly')).toContainText('1,230');
 await expect(page.locator('#current-year')).toContainText('14,760');
 await expect(page.locator('#difference')).toContainText('3,180');
 await expect(page.locator('#current-software')).toContainText('2,160');
 await expect(page.locator('#current-review')).toContainText('9,000');
 await expect(page.locator('#current-fix')).toContainText('3,600');
 await expect(page.locator('#current-name')).toContainText('Existing dedup tool');
});
test('changing baseline mode cannot accidentally import zero licence as a quoted vendor price',async({page})=>{
 await loadSample(page,'manual');
 await page.locator('[data-baseline=tool]').click();
 await expect(page.locator('#results-data')).toBeHidden();
 await expect(page.locator('#currentSoftwareMonthly')).toHaveValue('');
 await page.locator('#compare').click();
 await expect(page.locator('#error')).toContainText('Enter currentSoftwareMonthly');
 await page.locator('#currentSoftwareMonthly').fill('0');
 await page.locator('#compare').click();
 await expect(page.locator('#results-data')).toBeVisible();
 await page.locator('[data-baseline=manual]').click();
 await expect(page.locator('#currentSoftwareMonthly')).toBeDisabled();
 await page.locator('[data-baseline=tool]').click();
 await expect(page.locator('#currentSoftwareMonthly')).toHaveValue('0');
});
test('cost can rise rather than invent positive ROI; input changes invalidate sample status',async({page})=>{
 await loadSample(page);
 await page.locator('#newSoftwareMonthly').fill('5000');
 await expect(page.locator('#difference')).toHaveAttribute('data-tone','negative');
 await expect(page.locator('#difference-label')).toContainText('Higher first-year cost');
 await expect(page.locator('#monthly-difference')).toContainText('Higher by');
 await expect(page.locator('#example-note')).toContainText('Example edited');
});
test('changing values to zero reveals no fictional savings',async({page})=>{
 await loadSample(page,'tool');
 for(const id of ['hourlyCost','currentReviewHours','currentFixHours','currentSoftwareMonthly','newReviewHours','newFixHours','newSoftwareMonthly','newOperationsMonthly','newSetupOneOff']){
  await page.locator('#'+id).fill('0');
 }
 await expect(page.locator('#difference')).toHaveAttribute('data-tone','neutral');
 await expect(page.locator('#current-year')).toContainText('0');
 await expect(page.locator('#proposed-year')).toContainText('0');
 await expect(page.locator('#monthly-difference')).toContainText('Equal');
});
test('invalid fee stops result instead of preserving stale savings',async({page})=>{
 await loadSample(page);
 await page.locator('#newSoftwareMonthly').fill('-1');
 await expect(page.locator('#results-data')).toBeHidden();
 await expect(page.locator('#error')).toContainText('newSoftwareMonthly');
 await page.locator('#newSoftwareMonthly').fill('100');
 await page.locator('#compare').click();
 await expect(page.locator('#results-data')).toBeVisible();
});
test('clear restores unknown status and no saved private scenario',async({page})=>{
 await loadSample(page);
 await page.locator('#clear').click();
 await expect(page.locator('#hourlyCost')).toHaveValue('');
 await expect(page.locator('#newSoftwareMonthly')).toHaveValue('');
 await expect(page.locator('#results-data')).toBeHidden();
 await page.reload();
 await expect(page.locator('#newSoftwareMonthly')).toHaveValue('');
});
test('currency applies consistently without changing arithmetic or leaking costs to Tally',async({page})=>{
 await loadSample(page);
 await page.locator('#currency').selectOption('GBP');
 await expect(page.locator('#current-year')).toContainText('£18,000');
 await expect(page.locator('#proposed-year')).toContainText('£11,580');
 await expect(page.locator('#difference')).toContainText('£6,420');
 const audit=page.locator('#audit-link'),build=page.locator('#build-link');
 await expect(audit).toHaveAttribute('href',/offer=audit/);
 await expect(build).toHaveAttribute('href',/offer=implementation/);
 for(const link of [audit,build]){
  const href=await link.getAttribute('href');
  expect(href).not.toContain('hourlyCost=');
  expect(href).not.toContain('newSoftwareMonthly=');
  expect(href).not.toContain('currentReviewHours=');
  expect(href).toContain('source=acorde-cost-comparison');
 }
});
test('UTM values are whitelisted for Tally; hostile values are not forwarded',async({page})=>{
 await page.goto(base+'?utm_source='+encodeURIComponent('"><img src=x>')+'&utm_campaign=nov-pilot');
 const link=await page.locator('#audit-link').getAttribute('href');
 expect(link).toContain('utm_campaign=nov-pilot');
 expect(link).not.toContain('utm_source=');
});
for(const width of [320,375,390,768,1440]){
 test('operating-cost model is readable without sideways scroll at '+width,async({browser})=>{
  const context=await browser.newContext({viewport:{width,height:844},reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await loadSample(page,'tool');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
  await expect(page.locator('#results')).toBeVisible();
  await expect(page.locator('#comparison-form')).toBeVisible();
  await expect(page.locator('#difference')).toContainText('3,180');
  const bad=await page.locator('input[type=number]').count();
  expect(bad).toBeGreaterThanOrEqual(8);
  expect(errors).toEqual([]);
  await context.close();
 });
}
