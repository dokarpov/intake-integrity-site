# Intake Integrity

**Uncertain leads go to a person. Clear matches pass automatically. Every decision is recorded.**

Intake Integrity is a proposed reliability layer between incoming sales leads and a CRM or 1C system. It is designed to prevent ambiguous identity matches from silently creating incorrect or duplicate records.

## The problem

Sales teams receive leads with incomplete or overlapping identity information. When multiple existing records could match, automatically selecting one risks corrupting customer data. Sending everything to manual review, meanwhile, slows operations.

## How the proposed workflow works

1. A new lead arrives from a sales workflow.
2. The system compares it with existing records.
3. Clear matches can proceed automatically; ambiguous matches are held.
4. A reviewer selects the appropriate record or creates a new one and records the reason.
5. The approved outcome is forwarded to the CRM or 1C, with a traceable decision record.

## Interactive website

The website uses a **synthetic family-record example**: two existing records share a parent's name and phone number, while a new child's name introduces ambiguity. The illustrated reviewer assigns the lead to the appropriate family and records the reason.

The presentation includes a scroll-driven product story, a visual review card, and a pilot-request form.

**Interactive Decision Lab:** [Open the browser simulation](https://dokarpov.github.io/intake-integrity-site/decision-lab.html) · [Homepage](https://dokarpov.github.io/intake-integrity-site/). The GitHub Pages URL has not yet been independently verified.

## Intended users

Sales operations teams and organizations moving incoming leads into CRM or 1C, particularly where duplicate or incorrect record assignment creates operational risk.

## Pilot concept

A discovery call, followed by a test using synthetic leads with representative fields, and then evaluation against a 1C sandbox. This is a proposed pilot sequence, not a claim of completed customer validation.

## Current status

**Product concept and website prototype.** The interactive Decision Lab simulates evidence inspection, an abstention decision, reviewer justification, an unsafe override, and an audit trail. The visual demonstration does not establish that production matching, integrations, locking, delivery guarantees, or audit logging are implemented. Those capabilities require separate technical verification.

## Related work

[Research and validation repository](https://github.com/dokarpov/intake-integrity-lab) · [Creator's GitHub profile](https://github.com/dokarpov)

---

*The website uses illustrative demo data. No production deployment, pilot results, or commercial traction is claimed here.*
