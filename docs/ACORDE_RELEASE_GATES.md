# Acorde — release gates and implementation priorities

**Status:** testing-only product build. Do not merge this branch to main or promote publicly without owner review. Canonical backend: [Acorde Lab](https://github.com/dokarpov/intake-integrity-lab). Marketing, demo and commercial calculators: this repository. One operator inbox; no parallel CRM or "demo as production" claims.

## Product promise and boundaries

Acorde helps teams accept sales enquiries without confidently linking them to the wrong customer. It routes ambiguous identity matches to a reviewer, preserves consent/source evidence, and aims for a durable, idempotent delivery path to configured CRM/1C. Deduplication is **not** equivalent to verified identity; matching alone must never auto-merge people or edit their records.

The cost comparison is a *scenario model*, not current vendor market pricing, a published Acorde tariff, or verified ROI. There are **two starting states**: (a) no dedicated dedup automation, licence 0 but manual review/correction hours counted; (b) an existing tool, with actual licence plus remaining manual work. The proposed side includes separate licence quote, ongoing integration/support, review, correction hours and one-off setup. Acorde pricing is intentionally **unknown until entered**. All costs in one selected currency; first-year setup counted once; no revenue opportunity or fines added to operating-cost savings. Loaded examples are fictional and clearly marked. Inputs never leave the browser; lead links send only offer, flow and allowlisted campaign fields. Existing revenue-risk calculator remains separate.

## Acceptance matrix — claim only with proof

| Priority | Gate | Minimum repeatable acceptance criteria | Current evidence / blocker |
| --- | --- | --- | --- |
| P0 | G0 environment & authorization | Isolated host, verified OIDC role/tenant claims, two distinct tenants, revoked credentials denied, no cross-tenant record leakage, audit export access-controlled, no public secrets or real-data fixtures | PostgreSQL & backend readiness + anonymous 401 checked; **hosted authorized acceptance remains open** |
| P0 | G1 single durable backend journey | Browser → authenticated intake → persisted source/consent → candidate evaluation → explicit human verification → atomic decision/ledger/outbox → **one** synthetic CRM receipt; retry after lost acknowledgement produces **no** duplicate. Denial must leave outbox empty; verify actual PostgreSQL state | Disposable real-PostgreSQL exact-function tests passed in Acorde Lab; **fresh hosted authenticated test needed**. Cannot claim connected production CRM |
| P0 | G2 provider boundary | Select **one** customer-approved 1C/Bitrix24 or other CRM target and mapped source-of-truth; initially read-only discrepancies; authorized sandbox test of create/link only after consent/legal review, idempotency and rollback. Test unavailable provider, conflict, dead-letter and replay | No authorized real provider endpoints or contracts confirmed |
| P0 | G3 public UX reliability | 320/375/390/768/1440 responsive without horizontal scroll; all previously submitted cases accessible; decisions and history visible; calculator works for no-tool and tool baselines, missing price, negative savings, zero inputs and five currencies; complete start → offer → consented Tally prefill; no misleading benchmark claims | Source + hosted Chromium and security CI mandatory; owner manual review before main merge |
| P0 | G4 disclosure / launch | Business identity, privacy/retention and processor terms reviewed; credible offer scope and delivery acceptance; contact form consent; production domain/monitoring/rollback plan; owner explicitly approves visual & commercial copy | Production remains unchanged; legal retention details open |
| P1 | G5 commercial validation | Three actual buyer interviews across teams using manual-only and existing dedup tools; capture invoices, review time, corrections and identity error rate **before** pilot; written proposed cost and delivered price; calculate observed after-state only from pilot evidence | Only fictional numbers available; no measured savings or signed customers |
| P1 | G6 instrumentation | Consented lead attribution and lifecycle, outcome counts, queue age, human time per decision, false-link prevention, retries/duplicate receipts; exportable redacted evidence for paid audit | Tally form prefill verified; operational customer metrics absent |
| P2 | Self-service / packaging | Approved prices, billing, org setup, connector templates and alerting once one bounded customer pilot and provider E2E meet gates | Out of MVP until paid demand & baseline evidence |

## Next implementation slices, in order

1. **P0 — finish hosted authenticated E2E.** Reuse Acorde Lab's existing transactional PostgreSQL branch, not a second backend. Reconcile with its fail-closed review branch before merging. Deploy to segregated test credentials and run real hosted two-tenant Chromium E2E; retain redacted SQL receipts and screenshots. Fail release on unsigned/unauthorized writes, missing evidence, repeated provider receipts, or cross-tenant access. **Requires safe staging authorization; do not ask owner to paste tokens in chat.**
2. **P0 — pick one source/connector contract.** Document system of record and two identity-ambiguous fixtures; test read-only import/diff, validation, cancellation, recovery, and operator decisions; then explicitly authorize sandbox writes. Keep unavailable integrations marked *not connected*.
3. **P0 — retain all demo regression gates.** Run mathematical unit + browser + live HTTPS/headers + Tally prefill checks for every staging change; verify deployed revision and visual states across viewports before sharing preview. Do not promote a changed preview if checks fail.
4. **P0/P1 — approve truthful commercial copy and retention.** Public cost comparison must show non-automation and existing-tool baselines, a price-entry gate and first-year vs ongoing cost. Pricing, legal controller/retention, supplier terms and paid audit deliverables require owner signoff.
5. **P1 — customer-proof pilot.** Secure 3–5 willing teams; validate invoice, staff review/correction hours, failure attribution, implementation and service costs, with a matched before/after window. Report net operating impact and uncertainty separately from hypothetical revenue recovery. Treat negative or negligible economics as valid outcomes.
6. **P1 — release only after green evidence.** Freeze tested commit, verify latest hosted URL against exact deployed revision, monitor real error and payment/lead delivery, document rollback and a stop condition. Do not run public outreach on the staging link.

## Definition of done

**No claim without a test or witnessed integration.** Passing static sample UX and PostgreSQL test fixtures supports only their scope; it does not establish customer production SaaS readiness, CRM connectivity, GDPR certification, real market prices, or actual recoverable revenue.

Tracking: [DAR-44](https://linear.app/dokarpov/issue/DAR-44) G0 · [DAR-45](https://linear.app/dokarpov/issue/DAR-45) G1 · [DAR-107](https://linear.app/dokarpov/issue/DAR-107) cost/lead funnel. Keep review builds in the current testing PR; no main merge without approval.
