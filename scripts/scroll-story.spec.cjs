const {test,expect}=require('@playwright/test');
const url='http://127.0.0.1:4173/testing/story/';
const viewports=[{width:320,height:700},{width:375,height:812},{width:390,height:844},{width:768,height:1024},{width:1280,height:850},{width:1440,height:900}];
async function goPhase(page,p){
 await page.evaluate(progress=>{
  const story=document.querySelector('#journey');
  const top=story.getBoundingClientRect().top+window.scrollY;
  const distance=story.offsetHeight-window.innerHeight;
  window.scrollTo({top:top+distance*progress,behavior:'instant'});
 },p);
 const phase=p<.24?0:p<.5?1:p<.76?2:3;
 await expect(page.locator('#story-visual')).toHaveAttribute('data-phase',String(phase),{timeout:6000});
 await expect(page.locator('.scene-state.is-active')).toHaveAttribute('data-scene',String(phase));
 await expect(page.locator('.story-item.is-active')).toHaveAttribute('data-copy',String(phase));
 return phase;
}
for(const size of viewports){
 test('scroll story works on '+size.width+'px',async({browser})=>{
  const context=await browser.newContext({viewport:size,reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await expect(page.locator('body')).toHaveCSS('background-color','rgb(255, 255, 255)');
  await expect(page.locator('h1')).toContainText('Keep the conversation.');
  await expect(page.locator('.lead')).toContainText('For sales teams working in 1C or an existing CRM.');
  await expect(page.getByRole('link',{name:'See how it works'})).toHaveAttribute('href','#journey');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
  const stage=await page.locator('#story-visual').boundingBox();
  expect(stage.width).toBeGreaterThan(210);
  expect(stage.height).toBeGreaterThan(220);
  for(const [i,p] of [.1,.35,.62,.9].entries()){
   await goPhase(page,p);
   const box=await page.locator('#story-visual').boundingBox();
   expect(Math.abs(box.height-stage.height)).toBeLessThan(2);
   expect(Math.abs(box.width-stage.width)).toBeLessThan(2);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
  }
  await goPhase(page,.1);
  expect(errors).toEqual([]);
  await context.close();
 });
}
test('scroll transitions change content rather than revealing inert clickable UI',async({page})=>{
 await page.goto(url);
 await goPhase(page,.1);
 await expect(page.locator('.scene-state.is-active')).toContainText('Sam Lee.');
 await goPhase(page,.36);
 await expect(page.locator('.scene-state.is-active')).toContainText('Studio North');
 await expect(page.locator('.scene-state.is-active')).toContainText('Studio South');
 await goPhase(page,.65);
 await expect(page.locator('.scene-state.is-active')).toContainText('Confirmed identity');
 await expect(page.locator('.scene-state.is-active')).toContainText('Not established');
 await goPhase(page,.92);
 await expect(page.locator('.scene-state.is-active')).toContainText('Independent callback');
 await expect(page.locator('.scene-state.is-active')).toContainText('Studio North');
 await expect(page.locator('#story-visual button')).toHaveCount(0);
 await expect(page.locator('iframe')).toHaveCount(0);
});
test('page does not falsely claim real CRM integration or add another sales inbox',async({page})=>{
 await page.goto(url);
 await expect(page.locator('.lead')).toContainText('without asking anyone to monitor a second inbox');
 await expect(page.locator('.promise')).toContainText('not a replacement CRM');
 await expect(page.locator('footer')).toContainText('No authenticated CRM/1C connection');
 await expect(page.getByText('Needs attention',{exact:true})).toHaveCount(0);
});
test('non-reduced motion smoothly updates state when scrolling backwards',async({browser})=>{
 const context=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'no-preference'});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url,{waitUntil:'domcontentloaded'});
 await goPhase(page,.9);
 await goPhase(page,.35);
 await expect(page.locator('#phase-number')).toHaveText('02 / 04');
 const t=await page.locator('#story-fill').evaluate(node=>getComputedStyle(node).transform);
 expect(t).not.toBe('none');
 expect(errors).toEqual([]);
 await context.close();
});
