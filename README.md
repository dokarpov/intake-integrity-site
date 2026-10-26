# Intake Integrity — public experience

**Know who is coming back without assigning an enquiry to the wrong person.**

This is a set of **browser-only research experiences using fictional records**. It presents the operator-facing identity decision in a simpler way than the more extensive [engineering reference](https://github.com/dokarpov/intake-integrity-lab).

## Start with the customer problem

1. [Product overview](https://dokarpov.github.io/intake-integrity-site/) — why a pre-write identity checkpoint may matter.
2. [Guided review preview](https://dokarpov.github.io/intake-integrity-site/preview/) — one entry flow processing synthetic enquiries with an automatic or held-for-review result. This is a **guided review build**.

## Specialized explorations

- [Decision Lab](https://dokarpov.github.io/intake-integrity-site/decision-lab.html) — synthetic enrollment/identity scenario.
- [Organization configuration](https://dokarpov.github.io/intake-integrity-site/setup.html) — fictional mappings and a configuration export.

**Stage:** Synthetic public walkthroughs; backend controls live in the separate Intake Integrity Lab repository. Do not enter personal records or credentials in these demos.

## Product and implementation boundary

- **Problem:** phone numbers, households and incomplete identifiers can describe more than one person.
- **Decision:** continue when permitted by evidence; preserve uncertainty and route ambiguous cases to a human.
- **Implementation:** the separate [Intake Integrity Lab](https://github.com/dokarpov/intake-integrity-lab) demonstrates server-side constraints, consent, review routing, delivery idempotency and evidence controls. Pilot validation is a separate step.
- **Next evidence:** operator usability, exception volume, downstream error prevention, integration performance and support cost.

## Publication safety

The intended public artifact allowlist is in the site deployment workflow and checker. A pattern scan complements manual artifact and Git-history review. Do not assume a standard GitHub Pages build uses the same allowlist as a dedicated deployment workflow; verify the **deployed** artifact and workflow outcome separately.

If credentials were ever exposed, revoke or rotate them first. Hiding a page or rewriting a file does not erase public Git history, forks or caches.
