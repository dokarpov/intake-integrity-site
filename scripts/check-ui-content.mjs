// Release gate for customer-facing UI text: no internal caveats, no hidden primary flows.
// Real privacy notices and consent remain in dedicated legal form/page.
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const customer=['index.html','calculator.html','comparison.html','preview/index.html','decision-lab.html','setup.html','testing/integrity/index.html','testing/story/index.html'];
const banned=[
  /read carefully\s*:/i,/not an audited financial statement/i,
  /not an observed loss/i,/not proven revenue leakage/i,
  /this is a modeled opportunity/i,/no account required for the calculator/i,
  /no real customer data or crm changes/i,/no authenticated crm/i,
  /no real applications are retrieved/i,/synthetic demonstration\./i,
  /this static demo cannot connect to 1c/i
];
for(const file of customer){
  const html=readFileSync(file,'utf8');
  const visible=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'')
    .replace(/<!--([\s\S]*?)-->/g,'');
  for(const word of banned)assert.ok(!word.test(visible),file+' contains an internal-facing disclosure: '+word);
  if(['index.html','calculator.html','comparison.html'].includes(file)){
    assert.ok(!/<details\b/i.test(visible),file+' hides core interface in an accordion');
    assert.ok(!/<footer\b/i.test(visible),file+' adds a narrative footer');
  }
}
const calculator=readFileSync('calculator.html','utf8');
assert.ok(calculator.indexOf('id="audit-link"')>0&&calculator.indexOf('id="build-link"')>0);
assert.ok(calculator.includes('id="closeRate"')&&calculator.includes('id="recoverable"'));
assert.ok(calculator.includes('class="next-step"'), 'service CTAs are not grouped');
assert.ok(!calculator.includes('id="next-action"'), 'duplicate scroll CTA must stay removed');
const comp=readFileSync('comparison.html','utf8');
assert.ok(comp.includes('data-baseline="manual"')&&comp.includes('data-baseline="tool"'));
assert.ok(comp.includes('id="workers"')&&comp.includes('id="recordsPerWorkerDay"')&&comp.includes('id="issueRate"'));
assert.ok(comp.includes('id="send"')&&comp.includes('id="newsletter"')&&comp.includes('id="consent-control"'));
assert.ok(!/type="number"|<select\b/.test(comp),'simple calculator must use sliders, not numeric text entry or dropdowns');
assert.ok(comp.includes('id="attention-hours"')&&comp.includes('id="freed-hours"')&&comp.includes('id="freed-value"'));
assert.ok(!comp.includes('tally.so/r/ArK9ZD'),'no Tally subscription funnel in calculator');
assert.ok(comp.includes('id="mailer-state"'),'mail send availability must be explicit');
assert.ok(comp.indexOf('id="software-controls"')<comp.indexOf('id="workers"'),'tool cost must appear immediately after choice');
for(const key of ['workers','recordsPerWorkerDay','issueRate','toolMonthly']){
 assert.ok(comp.includes('data-expand="'+key+'"'),'slider '+key+' must offer a wider scale');
}
assert.ok(!comp.includes('Annual value of'),'remove redundant annual panel');
assert.ok(!comp.includes('How did we calculate this?'),'remove oversized explanation section');
const consentAt=comp.indexOf('id="newsletter"');
const sendAt=comp.indexOf('id="send"');
assert.ok(consentAt>=0&&sendAt>consentAt,'optional consent checkbox must appear before Send');
assert.match(comp,/id="newsletter"[^>]*name="newsletter"[^>]*value="yes"/,'consent must be explicit, separate and opt-in');
assert.ok(!/id="newsletter"[^>]*checked/.test(comp),'newsletter must not be preselected');
const home=readFileSync('index.html','utf8');
assert.ok(home.includes('id="integrations"')&&home.includes('existing CRM'),'describe CRM-native integration');
assert.ok(comp.includes('id="api-fit"')&&comp.includes('Acorde can connect via API'),'describe integration in one compact line');
assert.ok(comp.indexOf('id="results"')<comp.indexOf('id="email-form"') && comp.indexOf('id="email-form"')<comp.indexOf('</aside>'),'email form must be inside live result card');
assert.ok(!/<section class="(?:api-fit|convert|next)"/.test(comp),'no promotional sections before result capture');
assert.ok(comp.indexOf('id="current-overhead"')<comp.indexOf('id="email-form"'),'email capture directly follows the result');
console.log('Acorde UI content and progressive disclosure gates PASS');