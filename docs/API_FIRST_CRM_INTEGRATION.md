# Acorde — API-first CRM integration contract (staging design)

**Target product experience:** sales and account managers work in their existing CRM. Acorde processes duplicate/identity signals behind the scenes. A designated reviewer handles uncertain identities through existing CRM tasks/actions if the provider supports them. A separate operator interface is a fallback only after explicit buyer approval.

**Evidence level:** specification, not a verified live provider integration. Connectors for 1C/Bitrix24 remain unverified until customer-authorized sandbox credentials and end-to-end evidence are available.

## Narrow pilot: one source, one CRM, one reversible decision path

| Stage | Owner/system | Required behavior |
| --- | --- | --- |
| 1. Inbound enquiry | Existing form, email ingestion or CRM | Send a bounded event to Acorde with source ID and timestamp; record consent/source evidence |
| 2. Candidate check | Acorde | Normalize approved identifiers; find possible existing records; return exact, uncertain or new status with evidence |
| 3. Uncertain matches | CRM-native review task when supported | Show candidate reasons and source/target comparison; human approves link, decides new record or keeps unchanged |
| 4. CRM update | Existing CRM adapter | Create/link/update only after explicit authorization; idempotency key, permission check, optimistic concurrency and provider receipt |
| 5. Feedback | Existing record timeline/CRM task | Return status and review outcome to CRM; preserve decision audit and retry safely |

### Example API proposal (not yet released)

`POST /v1/identity/check` (authorized service-to-service)

```json
{
  "source": "website-enquiries",
  "source_record_id": "lead-123",
  "idempotency_key": "website-enquiries:lead-123:v1",
  "captured_at": "2026-11-10T10:00:00Z",
  "identity": {"email": "person@example.com", "phone": null},
  "permission_context": {"tenant_id": "tenant-1", "purpose": "enquiry-follow-up"}
}
```

Proposed response: `202 Accepted` with a durable request ID and `decision_required` flag. API response alone never confirms a CRM write. Actual route and authentication depend on canonical Acorde Lab backend and selected provider.

### Non-negotiable acceptance tests

1. Existing CRM remains the system of record. No new sales/AM workspace or repeated entry required for the selected pilot; operator approvals must have an agreed place.
2. Two tenants with overlapping names/emails cannot see one another's records. Invalid token/tenant/role denied; revoked sessions denied.
3. Uncertain candidates trigger review, never automatic merge. Denied/kept-current decision yields no outbox write.
4. Repeated source event and lost provider acknowledgement produce at most one persistent CRM receipt.
5. Forbidden or incompatible provider field mapping halts with an actionable review item. No silent update or broad write permissions.
6. CRM API unavailable/revoked: queue with bounded retry and dead-letter, no repeated sales task or duplicate customer.
7. Owner verifies the actual CRM screen shows original record, review action, and final status without teaching sales teams a second application.
8. Before promising setup timing: verify API/webhook availability, CRM permission scope, expected volumes, field map, seller approval and reversible rollback.

### Commercial onboarding — short response for prospects

Ask only: **Which CRM do you use, and where do your new enquiries enter it?** This takes under a minute. We use those two answers to assess one focused integration path. No 50-record exercise or seven-day homework for a first enquiry.

**Do not claim:** a production-ready Bitrix24/1C integration, a guaranteed quick launch, no need for any reviewer, or measured deduplication savings until a provider sandbox/pilot proves it.
