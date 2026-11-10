# Acorde — initial estimate email (short API-first version)

**Canonical implementation:** `mail/Code.gs` → `reportData`, `formatReport`, `formatHtmlReport`. **Status:** draft/testing. No owner-authorized Google sender or actual inbox delivery has been confirmed.

## Rules for customer-facing copy

- One screen, roughly 100 words beyond the results. Explain the recipient's monthly duplicate-review workload and the potential value of time.
- Product value: detect likely duplicates, route ambiguous identities for review and return decisions through an API to the **existing CRM**. Sales and account managers continue in their usual software.
- Fast initial scope: one enquiry source and one CRM integration; **verify provider support before promising delivery timelines**.
- One question requiring a quick reply: “Which CRM do you use, and where do enquiries arrive from?” No meeting, long form, five-record exercise or multi-day homework.
- The estimate is a modeled scenario, so include exactly one brief note about estimated inputs; avoid lengthy defensive disclaimers and unsupported measured performance claims.
- No rhetorical contrasts, filler, fake ROI or guaranteed live connectors.
- HTML and plain-text version must communicate the same numbers and promise.

## Consent

- **A visible, optional, unchecked newsletter-consent checkbox must appear ABOVE the Send button.** It remains visible but disabled when the email sender is disconnected. It is never required to receive the one-time requested estimate.
- When checked, the send request carries `newsletter=yes` and the report includes a separate confirmation link; **no subscriber is active until confirmed**. Without the checkbox, it is a single requested transactional email with no future marketing contact.
- The sender requires owner Google authorization and is fail-closed until configured; no live sending claims until test evidence.

## Test acceptance

- Source and live browser tests verify the physical order of checkbox and submit button, unchecked state, opt-in POST, and absence of opt-in when unchecked.
- Mailer tests verify actual subject, monthly review figures, concise API-first copy, absence of the five-record exercise, and mocked server-side MailApp delivery.
- No production merge until owner approves real CRM-provider evidence, legal privacy notice, the sender identity, and a verified inbox.
