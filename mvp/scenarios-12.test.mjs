import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,intake,resolve,parseCSV,exportCSV} from './engine.mjs';
// Simulated fixtures, not customer interviews or live CRM tests.
const key=n=>'scenario_key_'+String(n).padStart(4,'0')+'_stable';
const lead=(email,name='Alex Morgan',message='Please follow up on the quote')=>({name,email,message});
const run=(n,email,state=initialState())=>intake(state,lead(email),{key:key(n),now:'2026-10-18T12:00:00Z'});
test('01 returning customer is held pending independent verification',()=>{const r=run(1,'alex@example.com');assert.equal(r.record.status,'needs_review');assert.equal(r.record.reason,'unverified_single_match')});
test('02 shared email with two customer records is not automatically merged',()=>{const r=run(2,'sam@example.com');assert.equal(r.record.reason,'ambiguous_match');assert.equal(r.state.customers.length,3)});
test('03 unknown buyer cannot create CRM contact without verification',()=>{const r=run(3,'new@example.com');assert.equal(r.record.status,'pending_create');assert.equal(r.state.customers.length,3)});
test('04 repeated delivery request key produces one enquiry',()=>{const r=run(4,'alex@example.com');const replay=intake(r.state,lead('alex@example.com'),{key:key(4)});assert.equal(replay.replayed,true);assert.equal(replay.state.enquiries.length,1)});
test('05 idempotency key reused with different identity is rejected',()=>{const r=run(5,'alex@example.com');assert.throws(()=>intake(r.state,lead('sam@example.com'),{key:key(5)}),/conflict/)});
test('06 reviewer may hold without downstream write',()=>{const r=run(6,'sam@example.com');const s=resolve(r.state,r.record.id,{action:'hold'});assert.equal(s.customers.length,3);assert.equal(s.enquiries[0].status,'needs_review')});
test('07 unverified match cannot be linked',()=>{const r=run(7,'alex@example.com');assert.throws(()=>resolve(r.state,r.record.id,{action:'link',contactId:'CRM-10042',verified:true,evidence:'too short'}),/evidence/)});
test('08 verified link preserves original customer record',()=>{const r=run(8,'alex@example.com');const s=resolve(r.state,r.record.id,{action:'link',contactId:'CRM-10042',verified:true,evidence:'Independent customer callback confirmed identity'});assert.equal(s.enquiries[0].contactId,'CRM-10042');assert.equal(s.customers.length,3)});
test('09 wrong customer target cannot be linked',()=>{const r=run(9,'alex@example.com');assert.throws(()=>resolve(r.state,r.record.id,{action:'link',contactId:'CRM-10052',verified:true,evidence:'Independent customer callback confirmed identity'}),/candidate/)});
test('10 new contact created only after verification',()=>{const r=run(10,'buyer@example.com');const s=resolve(r.state,r.record.id,{action:'create',verified:true,evidence:'Verified by independent customer callback'});assert.equal(s.customers.length,4);assert.equal(s.enquiries[0].status,'created')});
test('11 repeated resolution is rejected',()=>{const r=run(11,'buyer@example.com');const s=resolve(r.state,r.record.id,{action:'create',verified:true,evidence:'Verified by independent customer callback'});assert.throws(()=>resolve(s,r.record.id,{action:'create',verified:true,evidence:'Verified by independent customer callback'}),/already resolved/)});
test('12 imported customer names with punctuation round-trip safely',()=>{const contacts=parseCSV('id,name,email\nC-1,"Doe, ""Jane""",jane@example.com\n');assert.deepEqual(parseCSV(exportCSV(contacts)),contacts)});
