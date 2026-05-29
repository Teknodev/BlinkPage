# Pages Test Run — Handover Report

**Date:** 2026-05-27
**Scope:** All `cypress/e2e/pages/**` specs (39 specs across 8 batches), headless `cypress run`
**Logger regression FIXED inline** before re-runs (23 files: `logger.debug.X` → `logger.info.X`)

## Aggregate

| Metric | Count |
|---|---:|
| Total specs run | 39 |
| Total `it()` blocks | ~404 |
| ✅ Pass | ~150 |
| ❌ Fail | ~191 |
| ⏭️ Skip (cascades from beforeEach failures) | ~63 |

## Per-batch summary (post logger fix)

| Batch | Area | Pass | Fail | Skip | Dominant root cause |
|---|---|---:|---:|---:|---|
| 1 (rerun) | Auth flows (login, signup, forgot-password, accept-invitation, confirm-delete) | 9 | 18 | 2 | fe-data-cy (signup) + fe-behavior (intercept URLs drifted) |
| 2 (rerun) | Identity (auth-bridge, transfer, pat-manager, account, notif-prefs) | 32 | 33 | 6 | fe-behavior (intercepts never fire) + fe-data-cy (toast-success, pat-token-prefix) |
| 3 (rerun) | Dashboard (home, projects, templates, billing, ai-site-builder) | 38 | 22 | 7 | fe-behavior + fe-data-cy on ai-site-builder + templates |
| 4 | Public/static (contact, plans, not-found, privacy-policy, terms) | 27 | 14 | 0 | fe-data-cy (privacy/T&C class-based selectors stale) + contact textarea missing data-cy |
| 5 | Organizations × 5 | 0 | 23 | 20 | **env-bug — no organization on test account** |
| 6 | Teams × 3 + Project C (overview/seo/webhook) | 18 | 37 | 28 | **env-bug — teams require org** + Electron crash on project/overview |
| 7 | Project A (access/analytics/cms/cookie/custom-components) | 10 | 32 | 0 | env-bug (project URL stays at /) + test-bug (invalid `cy.get(sel, { filter })`) |
| 8 | Project B (domain/form/library) | 16 | 12 | 0 | fe-behavior (Domain CTA covered by overlay) + intercept URL drift |

## Failure categorization

| Category | Approx count | Examples |
|---|---:|---|
| **env-bug** | ~56 | Test account has NO organization (confirmed via API probe) → blocks all org + teams specs |
| **fe-data-cy** | ~40 | sign-up: `input-name`, `signup-btn`, `input-confirm-password`; account: `toast-success`; pat: `pat-token-prefix`; ai-builder: `[class*="canvas"]` fragile; privacy/T&C: class-based selectors |
| **fe-behavior** | ~60 | Intercept aliases never fire (URL drift): `@acceptOk`, `@confirmHit`, `@getPublishedProject`, `@createProject`, `@createAIWebsite`, `@saveUser`, etc. Domain page overlay covers `data-cy="domain-add-btn"`. Login logout leaves overlay covering landing. Notification-prefs Save → no PUT. |
| **test-bug** | ~20 | `cy.get(sel, { filter: ... })` invalid Cypress syntax in cookie + custom-components specs |
| **fe-logger** | 0 | (was ~40 before inline fix — now 0) |
| **flaky** | 0 | (none observed) |

## ⚠️ Critical environment blocker

`blinkpage1@hotmail.com` has **zero organizations**. Confirmed via:
```
GET /api/fn-execute/organization → []
```
This blocks **5 organizations specs (23 tests) + 3 teams specs (13 tests) = ~36 tests** that cannot even run their `beforeEach` until an org is seeded.

## Recommended fix dispatches (orchestrator hand-off)

| Wave | Agent type | Target |
|---|---|---|
| **W1-A** | env / backend | Seed at least 1 organization + 1 team for `blinkpage1@hotmail.com` (unblocks 36 tests) |
| **W1-B** | refactor (test-side) | Fix `cy.get(sel, { filter })` invalid syntax in cookie + custom-components specs |
| **W2-A** | frontend | Add missing `data-cy` hooks: signup form (input-name, signup-btn, input-confirm-password), account toast-success, pat-token-prefix, ai-builder canvas/grid, conversion-goal-badge, domain-overlay z-index fix |
| **W2-B** | frontend | Update intercept URL patterns by confirming current backend route names (acceptInvitation, confirmAccountDeletion, getProject on form page, getPublishedProject polling on domain page, createProject/createAIWebsite on ai-site-builder) |
| **W2-C** | frontend | Domain page: fix overlay z-index covering `[data-cy="domain-add-btn"]`. Login: ensure dashboard overlay unmounts on logout. |
| **W3** | qa | Re-run full pages/ suite once W1+W2 land |

## Source data

- 11 per-batch result files under `/tmp/page-test-results-batch-*.md`
- 11 raw cypress logs under `/tmp/run-batch-*.log`
- Failure screenshots under `cypress/screenshots/`

## Notes

- The logger regression fix (`logger.debug.X` → `logger.info.X` across 23 files) was applied inline and re-runs confirmed zero `logger.*` runtime errors remain.
- The `cy.login()` fix (visit `/authentication` instead of `/`) prevented the auto-anonymous-signup overwrite issue.
- Cypress webpack-preprocessor + alias resolution (`@support`, `@pages-po`, `@fixtures`) verified working — no module-resolution errors in any run.
