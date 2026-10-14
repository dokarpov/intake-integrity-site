# Intake Integrity

A prototype for safer enrollment and customer intake. Applicants find or start an application; organizations configure field mappings and test identity-resolution scenarios.

## Public experiences

- [Applicant flow](https://dokarpov.github.io/intake-integrity-site/decision-lab.html): synthetic matching and enrollment, entirely in the browser.
- [Organization setup](https://dokarpov.github.io/intake-integrity-site/setup.html): choose a source (1C, CRM, or CSV), map fields, validate sample JSON, test matching, export a configuration.
- [Overview](https://dokarpov.github.io/intake-integrity-site/).

## What is implemented

Browser-only, illustrative flows with synthetic sample records. No real CRM connection, production identity verification, persistent audit log, authentication, secure server-side credential storage, or record writes. **Never enter real personal records or credentials into this public demo.**

## Public data and deployment policy

Only `index.html`, `decision-lab.html`, and `setup.html` are published by the GitHub Pages workflow. Repository documentation, source scripts, and Git metadata are not copied into the deployed website. The deployment fails if `scripts/check_public.py` detects selected credential patterns or known legacy identifiers in the public HTML.

This is a **limited preventive scan**, not a complete repository or historical security audit. GitHub commit history remains accessible, including earlier revisions. Do not assume that removing text from the current branch erases it from Git history, forks, caches, or deployed copies. If real credentials were exposed, rotate or revoke them before considering history rewriting. Rewriting shared Git history requires a separate coordinated procedure and is not performed automatically.

## Integration requirements

A live 1C connector requires a backend, an authorized test environment, a documented API contract, role-based access, encryption, server-side credential handling, idempotent writes, and end-to-end validation. The configuration export alone does not create an integration.
