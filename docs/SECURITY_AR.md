# Hijjawi X | SECURITY & DEPLOYMENT CHECKLIST

## Current structure
- Repository laithhijjawi/HijjawiX-Platform is PUBLIC (verified 2026-10-24).
- Cloudflare Worker hijjawix-platform serves https://hijjawix.com as a static-only site.
- The site does not require sign-in or store visitor accounts.

## Security implemented in source
- public/_headers configures CSP restricting scripts to this origin, frame protection, nosniff, referrer and browser feature restrictions.
- CSP allows the existing Google Fonts domains only; inline STYLE permitted for JavaScript-set design variables, inline SCRIPT not permitted.
- Short 1-day HSTS trial without includeSubDomains. Raise only after verifying all domains and HTTPS redirects.
- tests/security.test.mjs prevents obvious regression of these protections.

## Dashboard verification still required
1. Cloudflare SSL/TLS, Always Use HTTPS, and DNS setup.
2. Create www record and HTTPS redirect to apex, preserving path.
3. Review WAF and Bot protections without accidentally blocking normal access.
4. Protect GitHub main branch, review repository access, 2FA/passkeys, Dependabot and secret scanning.
5. Restrict Cloudflare deploy API token privileges, validate builds are linked to GitHub main.

## Ayah Lak separation
- Ayah Lak source currently lives in the PRIVATE fold-and-fire-online repository, under public/ayah-lak.
- Keep the live ayahlak.hijjawix.com URL unchanged until a dedicated repository and Worker are ready and verified.
- Do not change the application's origin or Service Worker scope casually; installed PWA storage may be affected.
