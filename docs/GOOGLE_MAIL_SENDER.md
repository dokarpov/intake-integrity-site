# Acorde free Gmail sender — owner activation

This implementation replaces the calculator's Tally signup and `mailto:` draft with an **actual Google-owned report sender** using Google Apps Script / MailApp. It costs no separate email subscription and uses the Google account that **authorizes and deploys the script**. The separate paid-audit enquiry currently still uses its existing service; this change affects report delivery and opt-in only.

## What works in source, and what remains blocked

- `mail/Code.gs` implements POST → validate email + bounded sliders → independently recompute → fixed subject/body → `MailApp.sendEmail` → explicit confirmation screen. It never accepts custom message HTML, subject, CC/BCC, aliases, attachments, or sender credentials from visitors.
- Unchecked optional guide consent is never saved. When checked, the *same report email* includes an expiring confirmation link. A visitor's **GET** opens a confirmation page and does not subscribe them. Only an explicit second **POST** writes an active consent record to a Google Sheet. An unsubscribe link can mark it inactive. **This does not send marketing campaigns**.
- Abuse controls: 20 reports/day globally, at most 2 per recipient/day, 1 hour cooldown, reserved under Apps Script lock before send, and a hidden bot trap. Failures must not claim success. These limits mitigate only basic abuse, **not** a replacement for CAPTCHA/device-rate limits in public production.
- `mailer-config.mjs` intentionally contains `MAILER_URL = ''`. The calculator displays **not connected**, disables automatic sending and hides opt-in until an owner has connected it. Copy estimate still works. No visitor email is collected or submitted before activation.
- Running CI with mocked Google APIs proves business logic; it does **not** constitute actual Gmail delivery. Do not mark email as production-ready until the owner's end-to-end inbox test and a deliverability review pass.

## One-time owner setup (Google account owner must authorize)

1. Sign in to the **Google account you want visitors to receive reports from**. Go to [Google Apps Script](https://script.google.com/home/projects/create).
2. Open the Code editor, remove the sample content, paste the entire existing `mail/Code.gs` from this repository and save as `Code.gs`. No Gmail passwords, OAuth tokens, SMTP app passwords or other secrets are required in Acorde's code.
3. **Deploy → New deployment → Web app**. Set **Execute as: Me** and **Who has access: Anyone**. Explicitly review and accept Google's permissions to **send mail** and to create/access a spreadsheet for confirmed consent. Keep the deployed URL private until the test is finished.
4. Copy the resulting `https://script.google.com/macros/s/.../exec` URL. Replace the empty `MAILER_URL` value in `mailer-config.mjs` on **testing/revenue-calculator** with that URL. It is a public endpoint URL, not a secret. The UI uses a native browser POST to this endpoint; it does not use cross-origin JavaScript `fetch`, Tally or fake success.
5. Rebuild/redeploy the isolated Neon staging preview, run both GitHub QA workflows, and test with **an email address controlled by you**: unchecked consent sends one report, no newsletter registration. Verify the From address really matches the Google account; check inbox, spam and message content. Clicking the button twice within an hour must produce a limit message, not two emails.
6. Re-test with optional consent checked using your own address only after the cooldown. The report email should include the opt-in link; visiting the link alone must not subscribe; clicking **Confirm subscription** must add one row to the private Google Sheet. Test unsubscribe and verify the status becomes `unsubscribed`.
7. Obtain explicit owner approval of sending identity, data protection, unsubscribe handling, rate limit, domain/privacy notices, production anti-bot challenge, monitoring and rollback before switching production traffic.

## Safety and operating boundaries

- Personal Google accounts currently have a documented MailApp/Apps Script quota of **100 recipients per day**, and Google may revise it. This sender deliberately sets a *smaller* internal cap of **20/day** for safer manual staging. See [Google quotas](https://developers.google.com/apps-script/guides/services/quotas) and [MailApp reference](https://developers.google.com/apps-script/reference/mail/mail-app).
- Anyone with the publicly deployed Apps Script URL can attempt to trigger it. Fixed content and quotas limit damage, but a real bot-defense solution is needed before broad distribution. Don't activate the URL in an indexed website before that gate.
- Apps Script sends from the **authorized Google account**, not from any arbitrary email address. If you want `hello@your-domain`, you need an eligible account with that sender identity or a separately verified domain-based sending provider.
- Google Sheet storage is part of the opt-in path; access only through the owner account. A public privacy controller/contact and retention schedule require final owner signoff.
- Remaining older Tally subscription form is **not referenced** by the customer email funnel. The existing paid-audit Tally enquiry is separate and unchanged.
- Google Apps Script has no native deploy connector available in this chat. **The owner must perform the one-time authorization in their own Google session.** Do not claim it has been done or that a real message was sent before live evidence exists.

## Test commands

```sh
node --test scripts/apps-script-mailer.test.mjs scripts/comparison-engine.test.mjs
npm install --no-save @playwright/test
npx playwright test scripts/comparison.spec.cjs --browser chromium --workers=1
```

The project tests mock the post-confirmation script flow; they do not write to a real Google Sheet or send external emails. The full release evidence must include a real inbox and the authorization identity.

