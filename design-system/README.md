# Intake Integrity design system · v0.1 (staging)

## Product promise
A new enquiry finds the right customer record or stops for review. The first screen must show this without requiring technical knowledge. One primary action: Try a sample lead. Do not suggest real CRM writes in sample mode.

## Principles
1. Product evidence over decoration: realistic lead card, matched customer profile, connected timeline, and review queue are the primary graphics.
2. No decorative arrows, dead CTAs, or multiple competing hero actions.
3. Neutral paper/ink/silver palette; silver is a material/lighting treatment, never the sole indicator of status. Status always has text.
4. Responsive from 320px, 44px minimum touch targets, visible keyboard focus, reduced-motion support, WCAG AA text contrast.
5. Clearly label synthetic examples and connection state.

## Tokens and components
Tokens: `tokens.css` (color, spacing, radius, typography, shadows, motion). Components: primary/secondary button, text input, field label/help/error, panel, existing/review/error status. Next: navigation, data table, contact card, enquiry timeline, identity comparison, review decision, retry notice, sync log, connection setup.

## Information architecture
Public: hero + sample interaction → three outcomes → role-based benefit proof → integrations explained → single conversion path.
Application: Inbox → Customer record → Review queue → Integrations → Activity log → Settings. No empty affordances; every clickable control needs a defined action and state.

## Vertical slice acceptance
- Existing email: show matched contact and append enquiry as associated note.
- No match: create contact and attach enquiry.
- Multiple matches: block writes, display human review state.
- Repeated submission: no duplicate enquiry.
- Partial failure: durable recovery with audit trail.
- Network timeout, 401, 403, 429, 5xx: actionable, non-misleading states.
- CRM token never appears in browser source or network response.
- Keyboard, screen-reader labels, reduced motion, 320/390/768/1024/1440 checks.

## Honest status
This is a component foundation and acceptance contract, **not a complete component library**. HubSpot backend on this branch is not production-ready: idempotency is memory-only, writes are not recoverable, and no authorized live HubSpot test has passed. Do not deploy to production.
