// Pure, browser-and-Node-compatible workflow engine. No CRM writes here.
export const normalizeEmail = value => String(value ?? '').trim().toLowerCase();
export const validateEnquiry = input => {
  const name = String(input?.name ?? '').trim();
  const email = normalizeEmail(input?.email);
  const message = String(input?.message ?? '').trim();
  if (!name || name.length > 120) throw new Error('Customer name must be 1–120 characters');
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Valid email required');
  if (!message || message.length > 4000) throw new Error('Enquiry must be 1–4000 characters');
  return {name,email,message};
};
export const matchingCandidates = (customers, email) => customers.filter(c => normalizeEmail(c.email) === normalizeEmail(email));
export const classify = (customers, email) => {
  const matches = matchingCandidates(customers,email);
  return matches.length === 0 ? {status:'new',matches:[]} : matches.length === 1 ? {status:'review',reason:'unverified_single_match',matches} : {status:'review',reason:'ambiguous_match',matches};
};
export const initialState = () => ({schema:2,sequence:1,customers:[
  {id:'CRM-10042',name:'Alex Morgan',email:'alex@example.com'},
  {id:'CRM-10052',name:'Sam Lee',email:'sam@example.com'},
  {id:'CRM-10421',name:'Sam Lee',email:'sam@example.com'}
],enquiries:[],audit:[]});
const clone = s => structuredClone(s);
const nextId = (s,prefix,used) => {let id;do{id=prefix+'-'+String(s.sequence++).padStart(6,'0')}while(used.has(id));return id};
const audit = (s,action,reference,detail,now) => s.audit.unshift({id:nextId(s,'AUD',new Set(s.audit.map(x=>x.id))),at:now,action,reference,detail});
export function intake(state,input,{key,now=new Date().toISOString()}={}){
  const lead=validateEnquiry(input);
  if (!/^[a-zA-Z0-9_-]{16,128}$/.test(String(key??''))) throw new Error('Valid idempotency key required');
  const existing=state.enquiries.find(e=>e.key===key);
  if(existing){if(JSON.stringify(existing.input)!==JSON.stringify(lead))throw new Error('Idempotency key conflict');return {state,record:existing,replayed:true}}
  const s=clone(state);
  const id=nextId(s,'ENQ',new Set(s.enquiries.map(e=>e.id)));
  const decision=classify(s.customers,lead.email);
  const record={id,key,input:lead,status:decision.status==='new'?'pending_create':'needs_review',reason:decision.reason??null,contactId:null,createdAt:now};
  s.enquiries.unshift(record);audit(s,'enquiry_received',id,record.status,now);
  return {state:s,record,replayed:false};
}
export function resolve(state,id,{action,contactId,evidence,verified=false,now=new Date().toISOString()}={}){
  const s=clone(state),q=s.enquiries.find(e=>e.id===id);
  if(!q)throw new Error('Enquiry not found');
  if(!['needs_review','pending_create'].includes(q.status))throw new Error('Enquiry already resolved');
  if(action==='hold'){audit(s,'review_held',id,'No CRM write',now);return s}
  if(!['link','create'].includes(action))throw new Error('Invalid resolution action');
  if(!verified||String(evidence??'').trim().length<12)throw new Error('Independent verification evidence required');
  if(action==='link'){
    if(q.status!=='needs_review')throw new Error('No matching contact to link');
    const contact=s.customers.find(c=>c.id===contactId);
    if(!contact||normalizeEmail(contact.email)!==q.input.email)throw new Error('Invalid candidate');
    q.contactId=contact.id;q.status='linked';
  }else{
    const newId=nextId(s,'CRM',new Set(s.customers.map(c=>c.id)));
    s.customers.push({id:newId,name:q.input.name,email:q.input.email});
    q.contactId=newId;q.status='created';
  }
  q.resolvedAt=now;
  audit(s,'review_resolved',id,JSON.stringify({action,contactId:q.contactId,evidence:String(evidence).trim()}),now);
  return s;
}
export function parseCSV(text){
  if(typeof text!=='string'||text.length>200000)throw new Error('CSV too large');
  const rows=[],row=[];let cell='',quoted=false;
  for(let i=0;i<text.length;i++){const ch=text[i];
    if(quoted){if(ch==='"'&&text[i+1]==='"'){cell+='"';i++}else if(ch==='"')quoted=false;else cell+=ch}
    else if(ch==='"'){if(cell)throw new Error('Malformed CSV quoting');quoted=true}
    else if(ch===','){row.push(cell);cell=''}
    else if(ch==='\n'||ch==='\r'){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(cell);rows.push([...row]);row.length=0;cell=''}
    else cell+=ch;
  }
  if(quoted)throw new Error('Unclosed CSV quote');
  if(cell||row.length){row.push(cell);rows.push([...row])}
  if(rows[0]?.map(x=>x.trim().toLowerCase()).join(',')!=='id,name,email')throw new Error('Expected CSV header: id,name,email');
  const contacts=rows.slice(1).map(r=>{if(r.length!==3||!r[0].trim()||!r[1].trim())throw new Error('Invalid CSV row');const email=normalizeEmail(r[2]);if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Invalid contact email');return {id:r[0].trim(),name:r[1].trim(),email}});
  if(new Set(contacts.map(c=>c.id)).size!==contacts.length)throw new Error('Duplicate contact IDs');
  return contacts;
}
export const exportCSV = customers => ['id,name,email',...customers.map(c=>[c.id,c.name,c.email].map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(','))].join('\r\n');
