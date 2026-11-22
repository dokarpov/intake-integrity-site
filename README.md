# Acorde — public experience

**Know who is coming back without assigning an enquiry to the wrong person.**

Acorde checks every incoming enquiry before it is written to the CRM. When a phone number, household or incomplete identifier could belong to more than one person, Acorde holds the record for a human decision and keeps the reason next to it. The [engineering reference](https://github.com/dokarpov/intake-integrity-lab) describes the server-side controls in detail.

## Start with the customer problem

1. [Product overview](https://dokarpov.github.io/intake-integrity-site/) — why an identity checkpoint before the CRM write matters.
2. [Guided review](https://dokarpov.github.io/intake-integrity-site/preview/) — one entry flow that ends in an automatic or held-for-review result.

## Specialized views

- [Decision Lab](https://dokarpov.github.io/intake-integrity-site/decision-lab.html) — an enrollment and identity scenario.
- [Organization configuration](https://dokarpov.github.io/intake-integrity-site/setup.html) — field mappings and a configuration export.
- [Integrations](https://dokarpov.github.io/intake-integrity-site/preview/integrations.html) — HubSpot first, then the other CRM connectors.

## How the decision works

- **Problem:** phone numbers, households and incomplete identifiers can describe more than one person.
- **Decision:** a record continues when the evidence permits it; ambiguous cases go to a person with the uncertainty preserved.
- **Implementation:** [Acorde Lab](https://github.com/dokarpov/intake-integrity-lab) covers server-side constraints, consent, review routing, delivery idempotency and decision evidence.

## Publishing

The deployment workflow copies an explicit allowlist of public files into the site artifact, and `scripts/check_public.py` checks it. Verify the deployed artifact and the workflow result after each change.
