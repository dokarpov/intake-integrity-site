# Intake Integrity — isolated MVP testing

This branch is **not a public release**. Production GitHub Pages must not publish the `mvp/` directory until acceptance.

## What works in the test implementation
- Enquiry intake with validated fields and idempotency keys.
- Matching is **review-first** even with one email candidate: an email address alone is not identity proof.
- Explicit hold/link/create decisions, candidate validation, verification attestation and local audit.
- CSV import/export including quoted commas, quotes and CRLF.
- Responsive mobile-first workspace and synthetic data in browser localStorage.
- A separately mockable HubSpot API adapter, **not connected** to the browser or to real CRM credentials.

## Run locally
```sh
node --test mvp/*.test.mjs
python3 -m http.server 4173
# Open http://localhost:4173/mvp/
npm install --no-save @playwright/test
npx playwright install chromium
npx playwright test --config=mvp/playwright.config.mjs
```
The GitHub Actions workflow `MVP test gate (no deployment)` runs unit and Playwright checks on this testing branch. Inspect its **actual completed status** and attached traces before acceptance.

## Must pass before a customer pilot
- All unit, browser and accessibility checks pass on real browsers and mobile widths.
- Complete OAuth consent/refresh/revocation in a dedicated HubSpot developer test account.
- Test HubSpot contact search, pagination, create, note association, 401/403/429/5xx, partial write failures, idempotency and race conditions.
- Replace localStorage with authenticated, tenant-isolated, durable server-side storage and tamper-evident audit.
- Data protection assessment, DPA, scoped permissions, deletion, incident response and security review.
- Test full CRM round trip with **synthetic contacts only**. No secrets or production customer data in repository, preview or browser.

## Status
Source and tests committed; no verified passing CI or live browser run has been established in this chat. Do not advertise as ready.
