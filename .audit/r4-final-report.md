# R4 — Final Test Report (post-Logger-extension + dev-restart)

**Date:** 2026-05-27
**Inline fixes:** Logger extended (`logger.X.Y` chains now valid for all levels) + dev server restart + Vite cache clear.
**Wave 1 fixes applied:** org+team re-verified, project/overview data-cy verified (already in source), sign-up + webhook hooks verified, AI builder Step 2 history-v5 state seeding, account `Kardelen` literals removed, sign-up Page Object click pattern fixed.

## Aggregate progress

| Stage | Pass | Fail | Skip |
|---|---:|---:|---:|
| R1 (logger blocked) | 0 | 191 | 213 |
| R2 (post logger-debug fix) | 158 | 165 | 58 |
| R3 (post W2 fixes) | 153 | 150 | 101 |
| **R4 (post Logger extension + restart)** | **208** | **125** | **71** |
| Δ R3→R4 | **+55** | **-25** | **-30** |

## Specs fully green ✅

| Spec | R3 | R4 |
|---|---|---|
| login | ✅ | ✅ |
| accept-invitation | ✅ | ✅ |
| home (homepage) | ✅ | ✅ |
| projects | ✅ | ✅ |
| not-found | ✅ | ✅ |
| privacy-policy | ✅ | ✅ |
| terms-and-conditions | ✅ | **❌** regression |
| **plans** | ❌ | **✅ new** |
| **organizations/delete** | ❌ | **✅ new** |

**8 specs fully green** (was 7). terms-and-conditions regressed — back-nav broke.

## Remaining failures categorized — 125 fail / 71 skip

### Non-logic items I can fix (no FE/BE behavior change) — ~85 fails

| Issue | Affected | Action |
|---|---:|---|
| Missing data-cy: pat-manager `card-title`, account `header`, project/seo `h1`, organizations/members/settings/activities | ~40 | FE add attrs |
| Test-bug: `cy.get(sel, { filter })` invalid syntax (cookie + custom-components) | 3 | refactor: chain `.filter()` |
| Test-bug: templates spec uses `Empty Template` / `Start Creating` text content | 4 | refactor: data-cy or rename |
| Test-bug: stale intercepts in batch A (verify-token URL, confirm/deletion routes) | 9 | refactor: re-verify URLs |
| Test-bug: project sub-pages where 2nd test lands at `/` (session drift) | ~8 | refactor: re-login per spec |
| Webhook heading data-cy missing in served DOM (HMR cache?) | 7 | retry: dev restart + verify |
| Teams test account org seed scoping mismatch (R4-C found team specs still no-org) | ~13 | env: verify team specs use same identity |
| Project overview spec asserts text content instead of using data-cy | ~12 | refactor: rewrite to use existing hooks |

### Logic-change items needing your decision — ~30 fails

| # | Issue | Affected | Why it needs logic decision |
|---|---|---:|---|
| 1 | Auth-bridge ignores `redirect=/projects` query parameter | 4 | Page logic must read+honor redirect param |
| 2 | Confirm-account-deletion no guard redirects when uuid absent | 2 | Page logic: when to redirect to `/authentication` vs `/` |
| 3 | Transfer-ownership ORG routes never fire `/transfer/confirm` or `/transfer/accept` | 6 | Page logic: does the org variant actually call the API on mount? |
| 4 | Notification-prefs Save click doesn't issue PUT (W2-C fix may have used wrong API) | 1 | API call logic |
| 5 | AI Site Builder Step 1 `failingCreateProject` doesn't fire | 2 | Client-side validation may suppress |
| 6 | Templates `Empty Template` / `Start Creating` copy missing | 4 | UX decision — was this removed intentionally? |
| 7 | Project overview detach-from-DOM mid-click (Edit/Delete/Transfer) | 7 | Render race condition |
| 8 | Project analytics page XHRs never fire (4 endpoints) | 4 | Page must call the API on mount |
| 9 | Terms-and-conditions back-navigation regressed | 1 | FE-5 routing change side-effect |
| 10 | CMS empty-state hides Add Page intentionally? | 1 | UX decision |

## Anti-pattern fix applied: Logger now resilient

Extended `Logger.ts` so `logger.X.Y(...)` works for any `X ∈ {info, warn, error, debug}` and any `Y ∈ {system, network, state, lifecycle, interaction, function}`. **No more `logger.X.Y is not a function` regressions possible.**

## Recommendation

Dispatch R5 with non-logic fixes (max-8 same-type per wave):
- FE-1: Add ~40 missing data-cy attrs across pages
- REF-1: Test-bug fixes (`cy.get(filter)` syntax, templates content, project overview spec rewrite, batch A intercept URLs)
- REF-2: Test-bug fixes (project sub-pages session drift — re-login per spec)
- QA-1: Verify team specs use same identity as where org+team are seeded

Then report logic items separately for your decision.
