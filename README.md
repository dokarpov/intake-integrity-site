# Acorde — public experience

**Know who is coming back without assigning an enquiry to the wrong person.**

This is a set of **browser-only research experiences using fictional records**. It presents the operator-facing identity decision in a simpler way than the more extensive [engineering reference](https://github.com/dokarpov/intake-integrity-lab).

## Revenue-loss acquisition funnel

The homepage has a second-block entry point into a separate client-side revenue leakage calculator. Illustrative presets for sales, orders and operations are editable; the tool counts sequential failure stages without double-counting, separates revenue from staff costs and routes service enquiries to a separately hosted Tally form, without transmitting calculations or customer records. No estimate or contact details are stored by this site.

The calculator is built on the testing branch and is **not live on the approved public site** until reviewed and promoted. The public source scanning rules explicitly prohibit publishing personal email addresses.

## Start with the customer problem

1. [Product overview](https://dokarpov.github.io/intake-integrity-site/) — why a pre-write identity checkpoint may matter.
2. [Guided review preview](https://dokarpov.github.io/intake-integrity-site/preview/) — one entry flow processing synthetic enquiries with an automatic or held-for-review result. This is a **guided review build**.

## Specialized explorations

- [Decision Lab](https://dokarpov.github.io/intake-integrity-site/decision-lab.html) — synthetic enrollment/identity scenario.
- [Organization configuration](https://dokarpov.github.io/intake-integrity-site/setup.html) — fictional mappings and a configuration export.

**Stage:** Synthetic public walkthroughs; backend controls live in the separate Acorde Lab repository. Do not enter personal records or credentials in these demos.

## Product and implementation boundary

- **Problem:** phone numbers, households and incomplete identifiers can describe more than one person.
- **Decision:** continue when permitted by evidence; preserve uncertainty and route ambiguous cases to a human.
- **Implementation:** the separate [Acorde Lab](https://github.com/dokarpov/intake-integrity-lab) demonstrates server-side constraints, consent, review routing, delivery idempotency and evidence controls. Pilot validation is a separate step.
- **Next evidence:** operator usability, exception volume, downstream error prevention, integration performance and support cost.

## Publication safety

The intended public artifact allowlist is in the site deployment workflow and checker. A pattern scan complements manual artifact and Git-history review. Do not assume a standard GitHub Pages build uses the same allowlist as a dedicated deployment workflow; verify the **deployed** artifact and workflow outcome separately.

If credentials were ever exposed, revoke or rotate them first. Hiding a page or rewriting a file does not erase public Git history, forks or caches.

## Contact handoff

A separately published Tally enquiry form is used only by testing-branch CTAs pending owner signoff. The form carries `offer`, `flow` and `source` in URL parameters and collects business contact information with explicit consent. The calculator does not send model values or customer records. The form uses default Tally email notifications; custom sender/subject/body would require a paid Tally plan.

## Prelaunch attribution and privacy

The homepage preserves only allowlisted, short UTM campaign labels on links to the calculator. The calculator forwards these campaign labels and service/flow selection to Tally; no financial input is transmitted. A dedicated public privacy notice covers the lead form. Before launch, replace staging links in the Tally form with the approved production privacy URL, verify legal details and test owner notifications. Production promotion remains subject to owner approval.


## Acorde UI content contract (marketing/testing artifacts)
- Do not add product-internal commentary, engineering disclaimers, placeholder explanations, or footnotes to customer-facing screens. Keep release caveats in docs and testing logs.
- Explicitly label simulated flows as **Demo** at the point of interaction; never imply a real CRM write or verified recovery.
- Essential inputs, intake, review and paid conversion actions must be visible; no hidden accordions for primary flows.
- Keep paired commercial CTAs adjacent at a maximum 12px gap on mobile, with no duplicated jump button or explanatory paragraphs between them.
- Use compact metric grids and one action hierarchy; avoid multiple large section breaks on a mobile result.
- Keep legal data rights accessible through a dedicated Privacy link/page and required form consent, not narrative footer disclaimers.
- UI rules are checked in scripts/check-ui-content.mjs and responsive browser tests.
