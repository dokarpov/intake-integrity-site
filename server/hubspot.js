const API='https://api.hubapi.com';
export class HubSpot{
constructor(token,fetcher=fetch){if(!token)throw new Error('HUBSPOT_ACCESS_TOKEN required');this.token=token;this.fetcher=fetcher}
async call(path,options={}){const res=await this.fetcher(API+path,{...options,headers:{Authorization:'Bearer '+this.token,'Content-Type':'application/json',...(options.headers||{})},signal:AbortSignal.timeout(12000)});let body=await res.json().catch(()=>({}));if(!res.ok)throw Object.assign(new Error('HubSpot request failed'),{status:502,upstreamStatus:res.status});return body}
async find(email){const r=await this.call('/crm/v3/objects/contacts/search',{method:'POST',body:JSON.stringify({filterGroups:[{filters:[{propertyName:'email',operator:'EQ',value:email}]}],properties:['email','firstname','lastname'],limit:10})});return r.results||[]}
async createContact(lead){const r=await this.call('/crm/v3/objects/contacts',{method:'POST',body:JSON.stringify({properties:{email:lead.email,firstname:lead.firstName,lastname:lead.lastName}})});return r.id}
async createNote(contactId,lead){const r=await this.call('/crm/v3/objects/notes',{method:'POST',body:JSON.stringify({properties:{hs_timestamp:new Date().toISOString(),hs_note_body:lead.enquiry},associations:[{to:{id:String(contactId)},types:[{associationCategory:'HUBSPOT_DEFINED',associationTypeId:202}]}]})});return r.id}
}