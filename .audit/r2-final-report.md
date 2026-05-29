# R2 — Final Failure Report (post-logger-fix)

**Date:** 2026-05-27
**Run:** Headless `cypress run` × 39 specs, 8 parallel batches
**State:** logger.debug.X + logger.info.render regressions FIXED; org/team seeded; intercept URLs corrected; FE bugs from W2 applied.

## Aggregate

| Metric | R1 (logger blocked) | R2 (post-fix) | Δ |
|---|---:|---:|---:|
| Pass | 0 | **158** | +158 |
| Fail | 191 | **165** | -26 |
| Skip | 213 | **58** | -155 |
| Total it() | 404 | 381 | -23* |

*spec count drift from skipped suite cascades resolving cleanly.

## Per-batch

| Batch | Specs | Pass | Fail | Skip | Notable |
|---|---|---:|---:|---:|---|
| 1 Auth | 5 | 12 | 15 | 2 | accept-invitation now fully green ✅ |
| 2 Identity | 5 | 14 | 23 | 11 | account.cy.js + notif-prefs.cy.js TIMED OUT (CPU contention) |
| 3 Dashboard | 5 | 36 | 22 | 9 | home + projects fully green ✅ |
| 4 Public/static | 5 | 18 | 23 | 0 | plans fully green ✅ |
| 5 Organizations | 5 | 23 | 15 | 5 | delete fully green ✅ |
| 6 Teams+ProjC | 6 | 14 | 38 | 31 | Backend timeouts on org/team endpoint |
| 7 Project A | 5 | 23 | 19 | 0 | All specs partially green |
| 8 Project B | 3 | 18 | 10 | 0 | library fully green ✅ |

**6 specs fully green** (accept-invitation, home, projects, plans, delete, library) — were all 100% failing pre-fix.

## Top root causes (with leverage)

| # | Issue | Affected | Category | Suggested fix |
|---|---|---:|---|---|
| 1 | Global overlay `_container_9nu8z_1 _show_9nu8z_13` still covers CTAs on project/overview + webhook + domain | ~15 tests | fe-behavior | Apply same pointer-events fix to the OTHER overlay component (W2-B fixed only `LoadingContainer`) |
| 2 | Landing page renders blank/black on `/landing` route | ~13 tests | fe-behavior | Inspect `pages/landing/landing.tsx` for silent runtime error |
| 3 | Contact form inputs disabled on mount | 12 tests | fe-behavior | Remove default `disabled` until captcha is mounted, OR enable per-field |
| 4 | privacy-policy + terms `data-cy="<page>-page"` NOT in rendered DOM despite W3-A claiming it was added | 8 tests | fe-data-cy | Verify W3-A's data-cy actually landed; check it's on the topmost rendered element |
| 5 | Intercept URLs STILL wrong for auth-bridge `verifyToken`, transfer-ownership `confirmOrg`/`acceptOrg` | 9 tests | test-bug | Cross-check FE source URLs again — W2-A may have missed these |
| 6 | Backend env-bug — Spica `/fn-execute/organization` endpoint times out at 30s under CPU load | ~5 tests | env-bug | Restart Spica OR run fewer concurrent specs |
| 7 | Analytics endpoint names don't match intercept globs | 4 tests | test-bug | Verify `getAnalytics`, `getReferralAnalytics`, `getLeadAnalytics`, `getBounceRate` URLs |
| 8 | `/` rewrites to `/landing` breaks back-nav for not-found, privacy, terms | 4 tests | fe-behavior | Inspect routing — `Navigate to="/landing"` may be hitting unrelated routes |
| 9 | Missing `data-cy` hooks: members-prefab-root, analytics inputs, CMS entry rows, custom-components h3 | 9 tests | fe-data-cy | Per existing `new-tests-fe-followup.json` retrofit plan |
| 10 | Auth session not persisting through `cy.reload()` (login test 6) | 1 test | fe-behavior | UserContext bootstrap reads token after authed redirect kicks in |
| 11 | Domain CTA still truncated to "Add New..." despite W2-B claim | 2 tests | fe-behavior | The `white-space: nowrap` may not have applied — verify in DOM |
| 12 | Webhook `data-cy="webhook-page-heading"` not in served bundle | 6 tests | fe-data-cy | Verify W3-A change landed on the right element + HMR served the bundle |

## ⚠️ Critical observation

**Several W2+W3 FE fixes did not actually apply visibly** in R2 results:
- Domain overlay (W2-B) — `_container_9nu8z_1` overlay still covers CTAs
- privacy-policy/terms data-cy (W3-A) — not in DOM
- webhook-page-heading (W3-A) — not in served bundle
- Domain CTA text truncation (W2-B) — still truncating

Either:
- The dev server didn't rebuild (HMR stale)
- The FE agents claimed completion but the changes weren't fully saved
- The element selectors target wrong nodes

Recommend: kill dev server, `rm -rf .vite node_modules/.vite`, restart, re-verify on browser before next test round.

## Recommended next dispatch (max 8 same-type per wave per updated CLAUDE.md)

| Wave | Agents | Target |
|---|---|---|
| **W1** | 1 frontend | Diagnose + fix Landing page blank render (highest leverage, 13 tests) |
| **W1** | 1 frontend | Fix the OTHER overlay (`_container_9nu8z_1` ≠ LoadingContainer) |
| **W1** | 1 frontend | Contact form default-disabled regression |
| **W2** | 1 frontend | Re-verify W3-A data-cy actually landed (privacy/terms/webhook); fix if not |
| **W2** | 1 refactor | Re-fix intercept URLs for auth-bridge, transfer-ownership, analytics endpoints |
| **W3** | 1 qa | Headless re-run subset of impacted specs to verify |
