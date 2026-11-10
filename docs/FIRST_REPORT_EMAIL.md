# Acorde — first report email as a diagnostic, not a sales blast

**Source of truth:** `mail/Code.gs` → `reportData`, `formatReport`, `formatHtmlReport`, `sendReport`.

**Status:** implemented on testing branch, verified by mocked MailApp tests. This is the transactional report requested by a calculator visitor. **Google authorization and an actual inbox delivery test are still required before live sending.** The report must never auto-enroll recipients in a marketing list.

## Positioning
- Subject: `Your Acorde snapshot: ~{{estimated_hours}} h/month to investigate`.
- Preheader: `Your estimate, the assumptions behind it, and a practical 7-day verification plan.`
- First-screen promise: "Time worth investigating" rather than "money lost" or "guaranteed savings".
- Primary CTA: **reply with the first problematic handoff and the CRM in use**. A human can then recommend the first narrowly scoped verification; do not imply guaranteed immediate personalized support.
- Secondary CTA: **Adjust your estimate**. No forced account or meeting to see the useful content.

## Required sections in the initial email
1. **Your scenario:** team size, records per worker/day, percentage needing a second look, total/affected records, separate current software fee and combined estimated current staff + existing-tool cost.
2. **Potential opportunity:** hypothetical 30–70% reduction in review work, 50% midpoint's time value in euros; label unmistakably as capacity, not released cash.
3. **Mode-specific next investigation:**
   - No existing tool: choose one channel, trace source → matching → CRM, never auto-merge ambiguous customer identities.
   - Existing tool: inspect residual human reviews and handoffs, don't assume the subscription can be cancelled.
4. **Seven-day verification playbook:** sample approximately 50 consecutive cases on one channel, classify exceptions, record minutes, separate safe rules vs decisions needing approval. Sample is deliberately exploratory, not a statistically valid estimate for large teams.
5. **Decision tree:** rare exceptions → improve upstream capture; predictable repeats → reversible rule; uncertain identity → reviewer + audit trail.
6. **Limits:** illustrative 20 days, 10 minutes, €28/h, missing real rates, mapping quality, future product price, integration and maintenance cost, and actual achievable improvement.
7. **Consent:** requested estimate is a one-time transactional email. Informational email requires the separate checkbox *and* confirmation link; merely requesting the report is not consent. Consent flow and unsubscribing must be tested using a mailbox controlled by the owner before launch.

## Acceptance criteria
- Personalized total hours, range, and euro values recomputed server-side; no user-supplied subject/body, open relay, CC/BCC or arbitrary HTML.
- Every scenario variant renders both readable HTML and plain-text fallback with consistent arithmetic.
- A recipient with no newsletter consent gets **no** newsletter link or subscription.
- Opt-in triggers a tokenized confirmation link *inside the report*, but does not subscribe until the user independently confirms; and the confirmation can be revoked.
- Tested rendering at 320px and in Gmail mobile clients requires actual visual review by the owner. Browser and mocked send tests do not establish email client compatibility.
- Avoid unverified terms: "our average customer saves", "€xxx recovered", "Acorde cuts checks by 70%", and "production-ready integration".

## Do not confuse the two flows
`formatReport` creates the requested **transactional** email. A future educational newsletter to subscribers is a **different** product and needs opt-in, scheduling, unsubscribe processing, and a legal delivery review. The current Google Apps Script does not mass-send follow-up emails.
