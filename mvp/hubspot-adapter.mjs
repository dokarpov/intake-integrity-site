// HubSpot test adapter. Inject fetch; never embed or persist tokens in browser code.
export class HubSpotAdapter {
  constructor({token,fetcher=fetch,base='https://api.hubapi.com'}={}){
    if(!token)throw new Error('HubSpot token required');
    this.token=token;this.fetcher=fetcher;this.base=base;
  }
  async request(path,{method='GET',body}={}){
    const response=await this.fetcher(this.base+path,{method,headers:{Authorization:'Bearer '+this.token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(12000)});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw Object.assign(new Error('HubSpot request failed'),{status:response.status});
    return data;
  }
  async findCandidates(email){
    const all=[];let after;
    do{
      const payload={filterGroups:[{filters:[{propertyName:'email',operator:'EQ',value:email}]}],properties:['email','firstname','lastname'],limit:100,...(after?{after}:{})};
      const data=await this.request('/crm/v3/objects/contacts/search',{method:'POST',body:payload});
      all.push(...(data.results??[]));after=data.paging?.next?.after;
      if(all.length>=1000)throw new Error('Candidate limit reached; manual review required');
    }while(after);
    return all;
  }
  async createContact({email,name}){
    const [firstname,...rest]=name.trim().split(/\s+/);
    return this.request('/crm/v3/objects/contacts',{method:'POST',body:{properties:{email,firstname,lastname:rest.join(' ')}}});
  }
  async addNote(contactId,message){
    return this.request('/crm/v3/objects/notes',{method:'POST',body:{properties:{hs_timestamp:new Date().toISOString(),hs_note_body:message},associations:[{to:{id:String(contactId)},types:[{associationCategory:'HUBSPOT_DEFINED',associationTypeId:202}]}]}});
  }
}
