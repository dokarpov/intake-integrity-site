# Acorde — one-screen, five-minute first email

**Source:** `mail/Code.gs` → `reportData`, `formatReport`, `formatHtmlReport`. **Release:** testing branch. Requires authorized Google sender and a real inbox acceptance test before production.

## Copy and UX constraints

- Send the requested estimate immediately in an HTML email with plain-text fallback.
- Lead with the figures the recipient already entered, and the estimated review hours and illustrative capacity value.
- Give **one optional action taking five minutes**: inspect five recent CRM contacts by email/phone and check the follow-up owner. The recipient only notes possible repeats or split ownership. Do not ask them to implement a fix.
- Follow with **one clear question**: which CRM they use and where enquiries arrive. We can suggest one appropriate check.
- Keep the email readable in under one minute. No multi-day plans, 50-case audits, long checklists, complex exercises, artificial oppositions, repeated disclaimers, inflated claims or unsolicited product promises.
- Example assumptions go in one short note: 20 workdays/month, 10 minutes per affected record, €28/staff hour. The 50% reduction is illustrative. Time value is not cash recovered. Pricing/setup omitted.
- Tone: precise, calm, self-contained. Use straightforward positive sentences. **Never use contrast constructions or rhetorical oppositions merely for effect**, especially “not X, but Y”.
- Respect unknown recipient context: a five-contact check is a fast heuristic and cannot prove a company-wide rate; never ask to share customer personal data.
- Further communications require independently confirmed newsletter consent. Sending the requested report does not subscribe the visitor.

## Release acceptance

- Server independently recomputes totals, rejects injection and arbitrary email bodies, and respects the existing cap.
- Plain text and HTML contain the same numbers and five-minute advice; optional consent only appears after the visitor opts in.
- Automated tests assert no seven-day plan or long homework in the customer email.
- Rendering and genuine Gmail delivery must be owner-tested after Google authorization.
