// Release gate for customer-facing UI text: no internal caveats, no hidden primary flows.
// Real privacy notices and consent remain in dedicated legal form/page.
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const customer=['index.html','calculator.html','preview/index.html','decision-lab.html','setup.html','testing/integrity/index.html','testing/story/index.html'];
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
  if(['index.html','calculator.html'].includes(file)){
    assert.ok(!/<details\b/i.test(visible),file+' hides core interface in an accordion');
    assert.ok(!/<footer\b/i.test(visible),file+' adds a narrative footer');
  }
}
const calculator=readFileSync('calculator.html','utf8');
assert.ok(calculator.indexOf('id="audit-link"')>0&&calculator.indexOf('id="build-link"')>0);
assert.ok(calculator.includes('id="closeRate"')&&calculator.includes('id="recoverable"'));
assert.ok(calculator.includes('class="next-step"'), 'service CTAs are not grouped');
assert.ok(!calculator.includes('id="next-action"'), 'duplicate scroll CTA must stay removed');
console.log('Acorde UI content and progressive disclosure gates PASS');