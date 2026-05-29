# R3 — Post-W2 Verification Report

**Date:** 2026-05-27
**Run:** 4 parallel QA batches headless on 39 page specs after W2 fixes applied.
**Inline post-R3 fix:** `logger.error.network` in `prefabs/news/news.tsx:31` → `logger.error` (third invalid Logger chain caught).

## Aggregate (across all 39 specs)

| | R2 (pre-W2) | R3 (post-W2) | Δ |
|---|---:|---:|---:|
| Pass | 158 | **153** | -5 |
| Fail | 165 | **150** | -15 |
| Skip | 58 | **101** | +43 |
| Total | 381 | 404 | +23 |

Skips rose because the news.tsx `logger.error.network` crash cascaded into beforeEach failures, skipping downstream tests in many specs. Now that bug is fixed too, R4 should show real improvement.

## Specs fully green in R3 ✅

- `login/login.cy.js` (8/8)
- `accept-invitation/accept-invitation.cy.js` (5/5)
- `home/homepage.cy.js` (4/4)
- `projects/projects.cy.js` (8/8)
- `not-found/not-found.cy.js` (4/4)
- `privacy-policy/privacy-policy.cy.js` (4/4) — W2-FE5 confirmed
- `terms-and-conditions/terms-and-conditions.cy.js` (4/4) — W2-FE5 confirmed

7 specs fully passing (up from 6 in R2). Privacy/Terms now confirmed working after FE-5 route fix.

## Top remaining issues

| # | Issue | Affected | Category | Owner |
|---|---|---:|---|---|
| 1 | `news.tsx` `logger.error.network` crash cascaded across many beforeEach (now FIXED inline) | ~30 | fe-logger | inline ✅ |
| 2 | Org seed gone — test account again reports zero org (W1-A seed lost) | 28 | env-bug | backend |
| 3 | Sign-up page selectors (input-name, signup-btn, confirm-password) — Page Object's selectors point at obsolete names OR FE retrofit didn't propagate | 9 | fe-data-cy / test-bug | FE+test verify |
| 4 | Webhook `data-cy="webhook-page-heading"` still missing in served DOM despite source having it | 6 | env-bug | Vite cache / HMR |
| 5 | Project sub-pages route to `/` not `/project/:id/<sub>` (likely cascade from news.tsx crash, NOW FIXED) | ~25 | env-bug | should auto-resolve |
| 6 | Domain "Add New Domain" overlay STILL covers CTA across 3 FE attempts | 6 | fe-behavior | need state-leak audit on LoadingContext |
| 7 | AI Site Builder Step 2 missing `location.state` seed | ~10 | test-bug | test-side stub |
| 8 | `/plans` rewrites to `/landing` for authed user | 5 | fe-behavior | FE-5 over-fix |
| 9 | Account spec still has `Kardelen Arslan` literal | 2 | test-bug | REF-2 miss |
| 10 | Project overview missing data-cy: name input, status pill, action buttons, dropzone, usage labels | ~12 | fe-data-cy | FE |
| 11 | `transfer-ownership` ORG variants `confirmOrg`/`acceptOrg` STILL never fire (only RESOURCE variants work) | 6 | fe-behavior | FE — page may not call the API on mount |
| 12 | Notification-prefs Save still doesn't fire `@saveUser` | 1 | fe-behavior | W2-C may have used wrong intercept URL |
| 13 | Forgot-password unregistered email — error toast not asserted as displayed | 1 | fe-data-cy | needs `[data-cy="toast-error"]` body |

## Anti-pattern: recurring invalid Logger chains

In 3 separate FE-agent dispatches, agents introduced invalid Logger sub-chains and yarn build did NOT catch them (because Logger types use callable + chained shape that TypeScript permits):
- `logger.debug.state` (fixed earlier)
- `logger.info.render` (fixed earlier)
- `logger.error.network` (fixed now)

**Recommendation:** consider extending Logger to either:
- A) Add the chained methods (`error.network`, `error.state`, etc.) so they're valid
- B) Make the chained access throw at the import level via Proxy guard so build/lint catches it

This will keep recurring with every FE retrofit. Worth memory.

## Pattern observation: FE fixes claimed but not visible

W2/W3 had a recurring issue where FE agents claimed completion but the patch didn't appear in served DOM:
- Webhook heading data-cy
- Domain CTA overlay
- privacy/terms data-cy

Root cause this round: **Vite HMR served stale bundle until explicit `.vite` cache clear + server restart**. After the restart in this round's Wave 0, privacy/terms confirmed working. Webhook heading still missing — needs another hard restart or different fix.

## Recommended R4

| Wave | Agents | Target |
|---|---|---:|
| **0 (inline)** | — | Restart dev server again (news.tsx fix needs HMR) |
| **W1** | 1 backend/qa | Re-seed org+team and verify the seed is identity-scoped (W1-A may have been wiped or wrong identity) |
| **W1** | 1 frontend | Audit + fix Domain CTA overlay — needs LoadingContext STATE audit (which prefab leaks `loading: true`?) |
| **W1** | 1 refactor | Strip remaining `Kardelen Arslan` + other identity literals from account spec |
| **W1** | 1 frontend | Add missing `data-cy` on project/overview (12 hooks per QA report) |
| **W1** | 1 frontend | Fix `/plans` → `/landing` over-redirect (FE-5 follow-up) |
| **W1** | 1 refactor | Test-side fix: seed `location.state` for AI Site Builder Step 2 + replace stale `Kardelen Arslan` in account spec |
| **W3** | 4 qa | Final re-run |

All within max-8 same-type per wave. Mixed types: 4 FE + 1 backend + 2 refactor in W1 (no cap issue).
