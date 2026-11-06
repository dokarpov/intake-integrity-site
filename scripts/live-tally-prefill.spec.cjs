const {test,expect}=require('@playwright/test');
test('public lead form loads and reveals the selected service and workflow',async({page})=>{
  test.setTimeout(90000);
  const url='https://tally.so/r/5XbAeE?offer=audit&offer_name=Paid+workflow+audit&flow=sales&flow_name=Sales+enquiries+and+follow-up&source=acorde-calculator&utm_source=linkedin';
  const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForTimeout(2800);
  const snapshot=await page.evaluate(()=>({
    title:document.title,
    body:document.body.innerText.slice(0,1500),
    radios:[...document.querySelectorAll('input[type="radio"],[role="radio"]')].slice(0,15).map(n=>({
      checked:n.checked,aria:n.getAttribute('aria-checked'),text:n.closest('label,[role="radiogroup"]')?.textContent?.slice(0,90)
    })),
    buttons:[...document.querySelectorAll('button')].slice(0,20).map(n=>n.textContent?.slice(0,90))
  }));
  console.log('TALLY_PREFILL_DEBUG',JSON.stringify({status:response?.status(),...snapshot}));
  await expect(page.getByText('What would you like to discuss?')).toBeVisible({timeout:15000});
  await expect(page.getByText('Paid workflow audit',{exact:true})).toBeVisible();
  await expect(page.getByText('Sales enquiries and follow-up',{exact:true})).toBeVisible();
  await expect(page.getByText('Business email')).toBeVisible();
  await expect(page.getByText('Please confirm')).toBeVisible();
});
