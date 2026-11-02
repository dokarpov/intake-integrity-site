# Acorde — brand migration

The product formerly presented as **Intake Integrity** is now **Acorde**. This is a brand-only update. It does not claim the product is production-ready, change underlying identity-resolution logic, or change approved UI layout.

## Public surfaces

- Product website: https://dokarpov.github.io/intake-integrity-site/ (legacy GitHub Pages path until the repository can be renamed safely)
- Review preview: https://dokarpov.github.io/intake-integrity-site/preview/
- Engineering implementation: https://github.com/dokarpov/intake-integrity-lab

These historic URLs remain valid. Do not replace them with `acorde-*` URLs before corresponding GitHub repository settings and hosting are migrated and verified.

## Compatibility

Keep browser storage keys, CSV schemas, API routes, integration identifiers and fixtures unchanged for this brand-only step. Renaming keys without migration can invalidate user state or invalidate existing examples. A future repository slug migration should update public URLs and outbound references together, verify GitHub Pages, and retain redirect compatibility.

## Product truth

Public pages and guided previews use fictional data. The service repository provides executable controls but is not evidence of a live production CRM deployment or legally certified compliance service.
