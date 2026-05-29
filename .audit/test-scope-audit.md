# Cypress Test-Scope Audit

**Date**: 2026-05-26
**Auditors**: 8 parallel QA subagents
**Rule**: Strict — any assertion outside the `it()` description is FLAGGED. Setup steps (login, visit, opening modals) do NOT count as creep.

## Overall stats

| Folder/Group | Audited | Flagged | % flagged |
|---|---:|---:|---:|
| accountPage | 21 | 21 | **100%** |
| homePage | 5 | 5 | **100%** |
| profile (pat-manager) | 8 | 6 | 75% |
| billing | 7 | 6 | 86% |
| effects + videoBackground + interactions | 16 | 9 | 56% |
| aiAssistant | 38 | 19 | 50% |
| localization | 49 | 25 | 51% |
| abTesting | 41 | 14 | 34% |
| blockBuilder | 28 | 9 | 32% |
| inlineEditor | 24 | 5 | 21% |
| signUp | 9 | 1 | 11% |
| system | 7 | 2 | 29% |
| debug-* (root) | 3 | N/A | n/a — diagnostic scripts |
| continueAsGuest, forgotPassword, guest, login | 16 | 0 | 0% |
| **TOTAL** | **274** | **124** | **45%** |

## Top recurring scope-creep patterns

| Pattern | Where | Recommendation |
|---|---|---|
| `verifyMyAccountPage("Account")` re-called in every `accountPage` test | account.cy.js (21/21 tests) | Move to `beforeEach`, NOT as assertion |
| `beforeEach` checks pre-auth landing (header + body + footer) on logged-in dashboard tests | homepage.cy.js (5/5) | Move landing-page verification to its own spec |
| Duplicate auth (`cy.login()` + UI `loginWithTestAccount()`) | homepage.cy.js | Drop the UI login — `cy.login()` already authenticated |
| Soft-pass via `cy.log()` instead of `expect()` / `should()` | localization (10+ tests), abTesting feature gates | Replace with hard assertions or `this.skip()` |
| Generic `button[disabled]` count instead of targeted selector | edge-cases.cy.js, language-management.cy.js | Use specific `data-cy` per button |
| Description promises text content / values, body only checks element presence | abTesting (8+), aiAssistant (5+), billing | Add `contains()` assertion OR rename test |
| Status pill / state assertion redundant with `data-state` attr | aiAssistant, abTesting | Drop or rename |
| Test name says ACTION ("allow selecting…"), test only checks visibility | interactions.cy.js, effects.cy.js | Rename OR perform the action + assert |
| Test name says PERSISTENCE ("…after refresh"), test never calls `cy.reload()` | account.cy.js, blockBuilder.quick-save | Add reload OR rename |

## ⚠️ Notable real bugs surfaced

| Bug | File:Line | Severity |
|---|---|---|
| Account "Upload unsupported .txt" asserts **SUCCESS** toast (should be REJECTION) | accountPage/account.cy.js | HIGH — either prod bug or wrong test |
| "Verify image persists after page refresh" never reloads | accountPage/account.cy.js | HIGH — test is false-positive |
| "Verify Edit button… makes fields editable" never clicks Edit | accountPage/account.cy.js | HIGH — test is false-positive |
| "Verify change password button is clickable" never clicks | accountPage/account.cy.js | HIGH — test is false-positive |
| `billing.cy.js` "static audit doc" test asserts `true === true` | billing.cy.js | MEDIUM — pure no-op |
| "should allow selecting a trigger type" never selects | interactions.cy.js | MEDIUM — name promises action not performed |
| Localization "hover" tests never trigger mouseenter | localization/table-interactions.cy.js | MEDIUM — false-positive hover tests |
| Empty `.within()` in picker.click — no kind/preview assertion executes | aiAssistant/picker.click.cy.js | MEDIUM — empty assertion block |
| Year-drift: footer asserts literal `'Copyright © 2024…'` (already noted in earlier audit) | support/pages/loginPage.js | MEDIUM — will fail today |

---

## auth + dashboard

### `account.cy.js` (under `accountPage/`)

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `Verify Account page loads successfully` | Calls `verifyMyAccountPage("Account")` to assert the Account page header/title is rendered. | no | keep as-is |
| `Verify user details are displayed correctly and Upload valid JPG image` | Deletes existing avatar, uploads `Test.jpeg`, asserts success toast, verifies delete button, then asserts card title `My Profile`, name, email, Personal Information labels, and phone/country/DOB labels + values. | YES — bundles avatar-upload, success-toast verification, delete-button verification, AND a full user-details audit (name, email, phone, country, DOB labels). The `it` description names two things only ("user details displayed correctly" + "Upload valid JPG image") but the body asserts ~10 unrelated card/label values. | Split into 3 tests: (a) `user details are displayed correctly` (card titles + name/email/phone/country/DOB labels only), (b) `Upload valid JPG image` (upload + success toast only), (c) `delete button appears after upload`. Move the user-details block to a dedicated `it` since it duplicates `Verify Account page loads successfully` coverage. |
| `Upload valid PNG image` | Calls `verifyMyAccountPage`, deletes uploaded image, uploads `Test1.png`, asserts success toast, then asserts delete button visible. | YES — `verifyMyAccountPage("Account")` is an extra page-load assertion outside the PNG-upload scope; `verifyDeletebutton()` is also outside scope (description is about uploading PNG, not verifying delete-button presence). | Drop `verifyMyAccountPage` + `verifyDeletebutton` from this test — keep only delete-existing → upload PNG → assert success toast. Move delete-button check to its own test. |
| `Replace existing profile picture` | Calls `verifyMyAccountPage`, deletes existing, uploads PNG, asserts success toast, then uploads JPG over it. | YES — `verifyMyAccountPage("Account")` is out of scope. Also asserts success toast for the FIRST upload only, never for the replacement upload — implicit assertion gap, but the page-load assertion is still creep. | Remove `verifyMyAccountPage`. Also add a success-toast assertion AFTER the second upload (the actual "replace" action), otherwise the test does not actually verify replacement. |
| `Verify image persists after page refresh` | Calls `verifyMyAccountPage`, deletes, uploads PNG, asserts success toast, then `verifyUploadedImage()`. NEVER calls `cy.reload()`. | YES — TWO mismatches: (1) `verifyMyAccountPage` is out of scope; (2) the description says "persists after page refresh" but the test never reloads. `verifyUploadedImage` is checked on the same page load, not after refresh. | Add `cy.reload()` before `verifyUploadedImage()` to actually test persistence. Drop `verifyMyAccountPage`. |
| `Upload unsupported file type (.txt)` | Calls `verifyMyAccountPage`, deletes, uploads `Text.txt`, asserts SUCCESS toast `'Profile updated successfully!'`, then `verifyUploadedImage()`. | YES — major mismatch: description is "unsupported file type" (should expect REJECTION) but the test asserts a SUCCESS toast and uploaded image. The assertions contradict the test name. Also `verifyMyAccountPage` is extra. | Rewrite assertions to expect an error toast / no upload. Either the production code is silently accepting .txt (real bug) or the test's success assertion is wrong. Investigate first; then fix the test to expect rejection. |
| `Verify Edit button is visible and clicking edit button should make the fields editable.` | Calls `verifyMyAccountPage`, asserts Edit button visible, asserts Cancel button visible. | YES — `verifyMyAccountPage` is out of scope; description never mentions Cancel button (Cancel is a separate UI surface). The "clicking edit makes fields editable" assertion is missing — the test never clicks Edit nor checks any input becomes enabled. | Drop `verifyMyAccountPage`. Drop or move the Cancel assertion to its own test. Add the actual assertion: click Edit, then assert at least one input becomes enabled/editable (the test description's core claim). |
| `Update name with valid data` | Verifies page, clicks Edit, types `Shah`, saves, asserts success toast; then re-edits back to original name and saves again. | YES — `verifyMyAccountPage` is out of scope. The cleanup-restore step (re-saving the original name) is reasonable for test isolation but the success-toast assertion on the cleanup save is an extra in-scope assertion that bleeds into the test's signal. | Drop the page-load assertion. Keep the cleanup but skip asserting the cleanup's toast — only assert on the primary update. |
| `Update name with empty name` | Verifies page, clicks Edit, types a single space, asserts Save is disabled. | YES — `verifyMyAccountPage` is out of scope. | Drop the page-load assertion. |
| `Update name with numeric data` | Verifies page, clicks Edit, types digits → asserts Save disabled; then restores name + saves + asserts success toast. | YES — `verifyMyAccountPage` is out of scope. The success-toast assertion after restoration is also outside the numeric-input scope. | Drop the page-load assertion. Keep restore step silently (no extra assertions). |
| `Enter valid phone number` | Verifies page, clicks Edit, types phone, saves, asserts success toast; then restores phone, saves, asserts success toast again. | YES — `verifyMyAccountPage` is out of scope; cleanup-save success-toast assertion duplicates the primary assertion. | Drop page-load assertion + cleanup toast assertion. |
| `Enter alphabets` | Verifies page, clicks Edit, types `abcde` into phone input, asserts value remains empty (input rejects alphabets). | YES — `verifyMyAccountPage` is out of scope. | Drop the page-load assertion. |
| `Enter special characters` | Verifies page, clicks Edit, types `@#$@` into phone input, asserts value remains empty. | YES — `verifyMyAccountPage` is out of scope. | Drop the page-load assertion. |
| `Verify the user can select the country from the dropdown` | Verifies page, clicks Edit, selects `Afghanistan`, saves, asserts success toast; then re-edits, deselects, saves. | YES — `verifyMyAccountPage` is out of scope. Deselect-then-save block has no assertion (acceptable as cleanup) but bundles two distinct UI flows in one test. | Drop the page-load assertion. Consider splitting "select country" vs "deselect country" into two tests. |
| `Verify the count of state available in dropdown list` | Verifies page, clicks Edit, calls `verifyCountryDropDownData()` and `verifyDropDownOptions()`. | YES — `verifyMyAccountPage` is out of scope. | Drop the page-load assertion. |
| `Verify user can select valid DOB` | Verifies page, clicks Edit, opens date picker, selects valid DOB, asserts Save button visible. | YES — `verifyMyAccountPage` is out of scope. The Save-visible assertion is weak (does not click Save or assert success); description implies selecting a DOB should work, but test never persists or verifies the result. | Drop page-load assertion; click Save and assert the DOB persists (success toast). |
| `Verify email is read-only and verified icon shown` | Verifies page, asserts `Login Information` card title, `Email` label, then verifies email + verified icon, plus `Password` label and `••••••••` masking. | YES — three creep items: (1) `verifyMyAccountPage`, (2) `Login Information` + `Email` label assertions belong to a "card layout" test, (3) Password label + masked-display assertions are entirely unrelated to email read-only. | Drop page-load + password assertions. Keep only: email field is read-only + verified icon shown. Move card/password label assertions into a dedicated layout test. |
| `Verify change password button is visible and clickable.` | Verifies page, asserts card title, password label, password mask, then asserts Change-password button visible. Never clicks it. | YES — three creep items: (1) `verifyMyAccountPage`, (2) card-title + password-label + password-mask assertions are outside the "change password button" scope, (3) description says "clickable" but the test never clicks. | Drop page-load + unrelated layout assertions. Add a `.click()` and assert the Reset Password modal opens (the "clickable" claim). |
| `Verify Clicking the change password button opens Reset Password modal.` | Verifies page, asserts card title + password label + mask, clicks Change Password, opens modal, ALSO clicks submit on the reset modal and conditionally asserts the Cancel button. | YES — bundles: (1) `verifyMyAccountPage`, (2) layout-card assertions, (3) clicking Submit on the modal (a separate "sends recovery email" flow), and (4) conditional Cancel-button assertion. The description is only about opening the modal. | Drop page-load + layout-card assertions. Remove the submit-click + Cancel-button block (move to its own test for "send recovery email" flow). Keep only: click → modal opens. |
| `Verify Close modal using X icon` | Verifies page, asserts card title + password label + mask, opens Change Password modal, clicks X, asserts modal closed. | YES — `verifyMyAccountPage` + layout-card assertions are out of scope. | Drop page-load + layout assertions. Keep only: open modal → X-click → modal not exist. |
| `Verify Logout successfully` | Verifies page, asserts card title + password label + mask, clicks Logout, asserts URL is `/authentication`. | YES — `verifyMyAccountPage` + layout-card assertions are out of scope. | Drop page-load + layout assertions. Keep only: click Logout → URL is `/authentication`. |
| `Verify delete button and modal` | Verifies page, asserts card title + password label + mask, clicks Delete account, asserts modal visible, asserts Cancel button. | YES — `verifyMyAccountPage` + layout-card assertions are out of scope. | Drop page-load + layout assertions. Keep only: click Delete account → modal visible → Cancel visible. |

### `continueAsGuest.cy.js` (under `continueAsGuest/`)

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `guest can proceed without an account — no web head shown` | Visits `/`, verifies landing body, clicks profile, clicks continue-as-guest, asserts no web head. | no | keep as-is |
| `guest clicks login from profile icon → auth page is shown` | Visits, continues as guest, clicks profile icon, asserts URL includes `/authentication`. | no | keep as-is |
| `logging in with the test account after guest session → dashboard shown` | Visits, continues as guest, clicks profile, asserts auth URL, types email + password, clicks signin, asserts header visible AND URL not `/authentication`. | no — the mid-flow URL assertion (`should('include', '/authentication')`) is a setup-state sanity check on the guest-to-auth transition; remaining assertions verify the dashboard-shown outcome | keep as-is |

### `forgotPassword.cy.js` (under `forgotPassword/`)

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `registered email → success confirmation message is shown` | Submits forgot-password form with test email, asserts success toast. | no | keep as-is |
| `unregistered email → server error message is shown` | Submits forgot-password with unknown email, asserts error toast `Email not found`. | no | keep as-is |
| `invalid email format → validation error shown before submit` | Asserts forgot-password page visible, types `notvalid.com`, clicks submit, asserts validation error shown. | no — `should('be.visible')` on the page wrapper is a setup actionability check | keep as-is |

### `homepage-guest.cy.js` (under `guest/`)

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `profile icon as guest opens login form` | After visiting and verifying header/body/footer (in `beforeEach`), clicks profile icon and asserts email + password inputs are visible. | no | keep as-is |
| `continue as guest → clicking profile icon shows auth page URL` | Clicks profile, continues as guest, clicks profile again, asserts URL includes `/authentication`. | no | keep as-is |

### `homepage.cy.js` (under `homePage/`)

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `logged-in user sees dashboard with project list or empty state` | Calls `loginWithTestAccount()`, asserts header visible, then asserts either `[data-cy="project-card"]` OR `[data-cy="empty-projects-message"]` exists. The `beforeEach` also calls `loginPage.verifyHeader/Body/Footer` BEFORE login, which is the pre-auth landing page — those are out of scope for this test (the test is about dashboard state, not pre-auth landing). | YES — the `beforeEach` runs `verifyHeader / verifyLandingBody / verifyFooter` which asserts the FULL pre-auth landing page (incl. footer) before every test. This is bleed-over for the dashboard-state test specifically. The `it` body itself is reasonably scoped (header + project-card OR empty-state), but the boolean `expect(hasProjects || hasEmpty).to.be.true` is redundant with the preceding `should('exist')` selector (it asserts the same fact twice). | Move pre-auth landing-page verifications out of `beforeEach` (or into a dedicated landing-page test). Keep only `cy.login()` + `cy.visit('/')` in `beforeEach`. Remove the redundant boolean expect — the preceding `cy.get('[data-cy="project-card"], [data-cy="empty-projects-message"]').should('exist')` already covers the disjunction. |
| `"Compare Plans" button navigates to /plans` | Logs in via UI, clicks `compare-plans-cta`, asserts URL `/plans`. | YES — same `beforeEach` issue: header/body/footer pre-auth assertions execute before every test including this one. Also the `loginWithTestAccount()` performs a full UI login (clicking profile, typing email/password, clicking signin, asserting header) even though `cy.login()` already programmatically authenticated in `beforeEach` — this duplicates auth and adds unrelated assertions. | Remove pre-auth landing assertions from `beforeEach`. Drop `loginWithTestAccount()` entirely (cy.login already authenticated) OR keep one of the two, not both. |
| `project card click navigates to the editor` | Logs in via UI again, conditionally checks if project cards exist, clicks first card, asserts URL matches `/project/.+/editor`. | YES — same `beforeEach` creep + duplicate UI login. The conditional skip via `cy.log` is also a soft-pass anti-pattern (the test will pass when nothing happens). | Remove pre-auth landing assertions from `beforeEach`; drop `loginWithTestAccount()`; replace conditional skip with a fixture/seed that guarantees at least one project, or mark the test as requiring data. |
| `footer links redirect to correct pages` | Calls `loginPage.verifyFooterRedirections()` — exercises footer redirections only. | YES — `beforeEach` performs `cy.login()` plus full pre-auth header/body/footer verification, but footer-redirection logic doesn't need authentication; running login is wasted setup, and the body/header `beforeEach` checks are duplicative of footer verification. | Move this test to a separate spec/describe that doesn't authenticate. Drop the auth + header/body assertions from setup. |
| `logged-in profile icon click opens profile dropdown` | UI-login again, clicks `[data-cy="header-right"] [data-cy="profile-button"]`, calls `homePage.verifyProfileDropDown()`. | YES — same `beforeEach` issue + duplicate UI login. | Same fix: clean `beforeEach`, drop duplicate UI login. |

### `login.cy.js` (under `login/`)

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `valid credentials → user lands on dashboard` | Clicks profile, types email + password, clicks signin, asserts header visible AND URL does not include `/authentication`. | no — both assertions are valid dashboard-arrival signals | keep as-is |
| `invalid password → error toast is shown` | Clicks profile, types valid email + wrong password, clicks signin, asserts toast `Username or password was incorrect.` | no | keep as-is |
| `non-existent email → error toast is shown` | Clicks profile, types unknown email + valid password, clicks signin, asserts a generic toast visible. | no — though the toast-text assertion is weaker than the previous test (only `be.visible`) | keep as-is, optionally tighten to match expected error text |
| `invalid email format → field validation error shown` | Clicks profile, types `notanemail`, clicks signin, asserts `Invalid email` error on email field. | no | keep as-is |
| `blank submit → required validation on email field` | Clicks profile, clears email, clicks signin, asserts `Required` error on email field. | no | keep as-is |
| `after valid login, page reload keeps user logged in` | Logs in via UI, asserts header visible, reloads, asserts header still visible AND URL not `/authentication`. | no | keep as-is |
| `logout via profile dropdown → redirected to auth page` | Logs in, asserts header (intermediate state check), opens profile dropdown, clicks logout, asserts URL `/authentication`. | no — the intermediate header assertion is a setup actionability check ensuring login completed before logout | keep as-is |
| `multiple failed login attempts each show the error toast` | Logs in with wrong password three times, asserts toast each time + closes between attempts (asserts toast hidden after close). | no — each toast + close + not-exist trio is consistent with the "multiple attempts" description | keep as-is |

### `pat-manager.cy.js` (under `profile/`)

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `1. Empty state — counter, button, no rows` | Asserts counter shows `0 of 10`, create button visible+enabled, no rows present, empty-state visible. | no — all assertions directly describe "empty state" | keep as-is |
| `2. Create PAT — reveal-once modal, copy to clipboard, no row leak of plaintext` | Stubs clipboard; opens create modal; asserts dropdown not yet shown + select visible (extra UI-state checks); types name/description; submits; asserts reveal modal visible + token matches regex + length 69; clicks copy + asserts clipboard value; clicks backdrop + asserts modal stays open (click-outside-disabled check); closes; asserts row with prefix + expiry text `89/90 days/3 months` + revoke button + plaintext not in row + counter `1 of 10`; then revokes via UI as cleanup and asserts `Revoked`. | YES — packs many distinct assertions into one test: (a) reveal-modal + token format, (b) copy-to-clipboard, (c) click-outside-disabled on reveal modal, (d) row representation (prefix-only, expiry label, revoke button), (e) plaintext-leak check, (f) counter increment, (g) revoke flow as "cleanup" with its own `Revoked` assertion. The description names three things (modal, copy, no-plaintext-leak) but the test asserts ~7. Cleanup-revoke `should('contain.text', 'Revoked')` is a real assertion bleed. | Split into separate `it`s: (a) create + reveal modal + token format, (b) copy-to-clipboard, (c) click-outside-disabled on reveal modal, (d) created row appearance (prefix, expiry, revoke btn, plaintext absent), (e) counter increments after create. Move revoke-as-cleanup into `afterEach` without assertions. |
| `3. Validation — empty name, >60 name, >200 description all disable Create` | Asserts submit disabled on empty; types 80-char name + asserts value capped at 60 + submit enabled; types 250-char description + asserts capped at 200 + submit enabled; clears name + asserts submit disabled again; cancels modal + asserts modal gone. | YES — `cy.get('#overlay-pat-create-modal').should('not.exist')` after cancel is outside the validation scope (validates cancel-closes-modal, not field validation). Also asserting `submit enabled` after each maxLength type is the inverse of the "disable Create" promise — useful but bundled. | Drop the trailing modal-close assertion (move to a dedicated cancel test). Split into 3 tests: empty-name disables, >60 capped, >200 capped. |
| `4. Revoke — cancel keeps active, confirm dims row and decrements counter` | Creates a PAT first (full create flow), closes reveal modal, asserts row visible + counter `1 of 10`; clicks trash → cancels → asserts dialog gone + counter unchanged; clicks trash → confirms → asserts row contains `Revoked` + trash button hidden + counter `0 of 10`. | YES — pre-revoke setup performs `cy.get('[data-cy="pat-counter"]').should('contain.text', '1 of 10')` and `pat-row...should('be.visible')` which is a setup verification, but is reasonable. However, the test asserts BOTH cancel and confirm flows in one `it`; these are two distinct revoke behaviors. | Split into 2 tests: `revoke cancel keeps active` and `revoke confirm dims + decrements`. Create-PAT setup can move to `beforeEach` via a helper. |
| `5. Expiry options — 5 labels present, "Never expires" shows security warning` | Opens modal; clicks expires select; asserts dropdown visible; asserts 5 items by data-value; clicks `never` + asserts warning visible; cancels modal + asserts modal gone. | YES — trailing `cy.get('#overlay-pat-create-modal').should('not.exist')` is outside the expiry-options scope (it's a cancel-flow assertion). | Drop the trailing modal-close assertion. |
| `6. 10-token limit — friendly inline error from intercepted 409` | Intercepts POST to return 409; opens modal, types name, submits; waits intercept; asserts inline error visible + contains `10-token limit`; asserts the fake row was NOT added; cancels modal. | no — the fake-row-absent check is the natural inverse of "error path doesn't insert a row"; cancel at end has no further assertion | keep as-is |
| `7. Logger audit — PatManager and PATService traces fire on list, create, revoke` | Performs full create + copy + close + revoke + confirm flow; then drains console.info/log spies and asserts log scope + multiple log-message regexes. | YES — the test runs a real create+copy+revoke flow with `should('contain.text', 'Revoked')` on the revoke step — that's an outcome assertion outside the "Logger audit" scope. Logger-audit-only should NOT re-assert behavior of the underlying flows. | Drop the `Revoked` outcome assertion; keep only the log-message regex assertions (the test's stated purpose). |
| `SCR. Capture the three required screenshots` | Opens create modal + fills + screenshot; submits + asserts reveal modal visible + screenshot; closes + asserts row visible + screenshot; then revokes as cleanup + asserts `Revoked`. | YES — multiple behavioral assertions (`reveal modal visible`, `row visible`, `Revoked`) bleed into what should be a screenshot-capture-only test. The cleanup-revoke `Revoked` assertion is also creep. | Convert to a pure screenshot run: drop all `should('be.visible')` and `Revoked` assertions, keep only screenshot calls + minimal `cy.get(...).should('exist')` actionability checks that screenshots need. |

### `singup.cy.js` (under `signUp/`)

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `already registered email → server error message is shown` | Fills full signup form with existing email, clicks signup, asserts toast. | no | keep as-is |
| `password mismatch → validation error on confirm-password field` | Fills form with mismatched confirm-password, clicks signup, asserts error on confirm field. | no | keep as-is |
| `empty form submit → required validation errors on all fields` | Clicks signup with empty form; asserts `Required` errors on name AND email fields. | YES — description says "all fields" but only name + email are asserted. Either the assertions are incomplete (missing password + confirm-password Required errors) or the description should be narrower. | Either expand assertions to cover password + confirm-password, or rename the test to `empty form submit → name + email show Required errors`. |
| `empty name → required error on name field` | Fills all fields except name, clicks signup, asserts `Required` on name. | no | keep as-is |
| `empty email → required error on email field` | Fills all fields except email, asserts `Required` on email. | no | keep as-is |
| `empty password → password validation error` | Fills all fields except password, asserts password validation error text. | no | keep as-is |
| `empty confirm-password → required error on confirm field` | Fills all fields except confirm, asserts `Required` on confirm field. | no | keep as-is |
| `valid new account → API is called and response is handled (stubbed)` | Intercepts POST register; fills form with new email; submits; asserts intercepted response status 200. | no | keep as-is |
| `password masking — input type is password by default` | Asserts password input's `type` attribute is `password`. | no | keep as-is |
## aiAssistant

### `ai-3phase-flow.cy.js`

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `full happy path: Phase 1 discovery rows, ConfirmationCard with bullet list, Phase 2 proceed, Phase 3 summary` | Asserts: Phase 1 panel visible (L317); two discovery tool rows exist with `data-status=success` (L327-332); ConfirmationCard visible + `data-tool-name="request_confirmation"` (L335-337); `ul` with at least 1 `li` (L338-340); no technical heading (L341); no `<pre>` (L342); approve/skip + status elements present (L343-345); composer input disabled (L346); Phase 2 request body has `confirmed_tool_calls` array (L350-353); ConfirmationCard disappears (L356); pb_add_component tool row exists with success (L359-361); messages/status/token_count present with token>0 (L364-369). | no | no action (test name explicitly enumerates all phases including bullet list + summary; all assertions stay within the named scope) |
| `pb_list_component_types tool row succeeds and confirmation card mentions Team` | Asserts: panel visible (L394); pb_list_component_types tool row exists w/ data-status=success (L402-404); confirm card visible (L407); confirm card `ul li` has length>=1 (L408); `ai-fallback-not-found` does not exist (L409). | YES — the description claims the card "mentions Team" but the test never asserts the visible text contains "Team"; instead it asserts a bullet `li` exists and a fallback selector is absent. The "mentions Team" promise is never verified, and the absence-of-fallback check is an extra concern. | rename to "pb_list_component_types tool row succeeds and confirm card renders a bullet list" OR add a real `contains('Team')` assertion on the card body |
| `clicking Cancel removes card, shows Skipped note, status idle, no second request fires` | Asserts: panel visible (L433); confirm card visible after send (L443); after Cancel click — card no longer exists (L455); messages/status containers present (L458, L461); composer input is not disabled (L464); no pb_add_component tool row exists (L467); secondCallFired flag is false (L470-472). | no | no action (all assertions map to the description's enumerated concerns: card removed, status idle, no second request, input re-enabled implicit in "status idle"; the no-mutation row is the same claim) |
| `shows description text when plan_items is empty instead of an empty list` | Asserts: confirm card visible (L558); no technical heading (L564); approve + skip buttons present (L567-568). Note: there is NO assertion that description text is actually rendered — only an unchecked `cy.get(card)` at L561. | YES — buttons (approve/skip) and heading absence are extras the description does not mention; description text is never positively asserted. | rename to "renders empty-plan_items confirmation card without technical heading" OR add a positive `contains('I will add a Hero section')` assertion and drop button checks |

### `ai-assistant-panel.cy.js`

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `opens the panel from the floating action button` | Asserts: FAB visible (L156); panel visible (L157); status element queried (L158, no `.should`). | no | no action (all within scope of "opens the panel from FAB") |
| `sends a non-destructive prompt and renders the tool round + final assistant message` | Asserts: request body has `messages` and last message content equals "list my pages" (L170-173); messages/token_count/status containers present (L175-177). | no | no action (within scope — tool round + final message are covered by the messages container presence) |
| `halts on destructive tool and surfaces a confirmation card` | Asserts: confirmation card visible with `data-tool-name=pb_delete_page` (L191-193); status container present (L194); composer input disabled (L195). | no | no action (input disabled is implicit in "halts" / surfacing a confirmation) |
| `continues the chain after the user confirms the destructive tool` | Asserts: confirm card visible (L214); second request's confirmed_tool_calls includes `call_destructive_1` (L218-226); messages container present (L228); confirm card not exist (L229); status present (L230). | no | no action (within scope of "continues the chain after confirm") |
| `skips a destructive tool when the user cancels and adds an assistant note` | Asserts: confirm card visible (L243); card disappears after Cancel (L246); messages container present (L247); status container present (L248). | no | no action (within scope) |
| `reset clears the transcript and token counter` | Asserts: token-count with `data-zero=true` does not exist after chat (L261); after Reset click, token-count with `data-zero=true` exists (L265); no assistant message item in messages after reset (L269-271). | no | no action (transcript + token counter are both named in the description) |

### `ai-checklist-flow.cy.js`

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `the chat request carries architecture="checklist" and a card with steps + Approve/Reject renders` | Asserts: panel visible (L241); request body has architecture='checklist' + no checklist_approval (L249-252); checklist card visible w/ data-state=awaiting_approval, data-kind=plan, data-checklist-id (L255-259); 2 steps rendered, both pending (L262-266); approve + reject buttons visible (L269-270); no replan badge (L273); composer not disabled (L277); status element present (L278). | YES — composer-enabled check and replan-badge absence are extras not in the description (description names only request body + card + Approve/Reject). | split: keep current it() focused on request-body + card + Approve/Reject; move "composer stays enabled" + "no re-plan badge on initial plan" into a separate it() named after those side effects |
| `Approve re-POSTs with checklist_approval echoing nonce/cycle/steps, steps flip to done, card completes` | Asserts: card data-state=awaiting_approval (L307); approve POST body has architecture=checklist + checklist_approval with full echoing (L314-325); both steps end data-status=done (L328-331); card state=completed (L334); approve+reject no longer exist (L337-338); messages container present (L341); status present (L344). | no | no action (description explicitly names: re-POST echo, steps→done, card completes; the disappearance of approve/reject is implied by "completes") |
| `a failed step marks the first card partial and a new re-plan card (cycle 2) appears awaiting approval` | Asserts: first card data-state=partial (L378-379); failed step (L380-381); card count = 2 (L384); second card data-state=awaiting_approval + data-kind=replan (L385-388); replan badge visible (L391-393); approve button on second card visible (L394-396). | no | no action (all within scope of "card partial + re-plan card appears awaiting approval") |
| `approving the re-plan that also fails surfaces checklist_exhausted with the unresolved steps` | Asserts: re-plan card awaiting approval (L432-433); second approve POST echoes cycle=2, checklist_id, nonce (L436-443); checklist-exhausted element visible (L446-447); messages container present (L450). | no | no action (all within scope; the body-echo check is implementation of "approving the re-plan") |
| `Reject re-POSTs with decision="reject" and the card moves to the rejected state with no execution` | Asserts: card awaiting_approval (L482); reject POST body has decision=reject (L485-487); card data-state=rejected (L490-491); all steps remain pending (L492-494). | no | no action (re-POST + rejected state + no execution are exactly the named scope) |

### `ai-checklist-step-verifier.cy.js`

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `step reaches terminal done after one executing + one verifying phase` | Asserts: card awaiting_approval (L253); step data-status=done (L259-260); card data-state=completed (L262); messages container present (L263). | YES — card data-state=completed is an extra; description only claims the step reaches `done`, not that the card lifecycle is completed. Messages container is also not mentioned. | rename to "step reaches terminal done and card completes" OR drop the card-state=completed assertion and messages assertion |
| `running→running phases pass through with no status regression; step ends done` | Asserts: card awaiting_approval (L287); step data-status=done (L294-295); card data-state=completed (L297); messages container present (L298). | YES — same as above: card completion + messages are not mentioned. Additionally there is NO assertion that intermediate phases did not regress status (no intermediate snapshot is taken); the description claims "no status regression" but only the terminal state is checked. | either weaken description to "step ends done after verify+retry cycle" OR add an intermediate `should('have.attr','data-status','running')` mid-stream to actually verify the no-regression claim |
| `failed step shows reason "step_iterations_exhausted" and a re-plan card appears` | Asserts: card awaiting_approval then approve (L322-324); step data-status=failed (L327-328); first card data-state=partial (L331-332); card count=2 (L335); replan card visible w/ awaiting_approval + replan kind (L336-339); replan badge visible (L340-342). | YES — description mentions a step reason of "step_iterations_exhausted" but the test never asserts that reason string is present in the UI (only data-status=failed). The first card data-state=partial is also an extra. | either add a real reason-text assertion (e.g. `contains('step_iterations_exhausted')`) and rename to include "first card becomes partial", OR drop the partial check and weaken the description |
| `failed step shows verification_failed_after_retry reason and a re-plan card appears` | Asserts: card awaiting_approval + approve (L366-368); step data-status=failed (L370-371); first card data-state=partial (L373-374); 2 cards exist (L377); replan card visible w/ awaiting_approval + replan kind (L378-381); approve button on replan visible (L382-384). | YES — same as previous: the reason string "verification_failed_after_retry" is never asserted in the UI; partial-state is an extra. | add a `contains('verification_failed_after_retry')` assertion OR weaken description; consider dropping partial-state check |

### `ai-inline-streaming-smoke.cy.js`

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `A) renders inline tool rows in arrival order with running -> success and B) final assistant bubble below` | Asserts: tool rows >=3 (L144); each row has data-status=success (L146-148); ai-tool-message does NOT exist (L150); messages container present (L153); status container present (L156). | YES — the `ai-tool-message` absence assertion is an extra (description does not mention the legacy bubble); status idle is also not in the name. Arrival ORDER is claimed but never positively verified. | split or rename: add an explicit "old tool-role bubble removed" sub-it() OR fold that into the description; add a real ordering check (DOM index comparison) since the description claims "in arrival order" |
| `C) hint: mutation_committed bumps token counter to reflect a completed round (canvas auto-sync seam fires)` | Asserts: token-count element queried (L165, no `.should`). | YES — there is NO assertion that the token count "bumps" (no value comparison, just a `cy.get` chain). The test name promises a behavioral check the test never performs. | either implement an actual before/after numeric comparison on `[data-cy="ai-assistant-token-count"]` OR rename to "token counter element survives a mutation_committed stream" |
| `D) cancel button replaces send while streaming, click reverts to send and re-enables input` | Asserts: cancel visible mid-stream (L195); send does not exist mid-stream (L196); send visible after cancel click (L201); cancel does not exist after click (L202); composer not disabled (L204). | no | no action (cancel/send swap + input re-enabled all named in description) |
| `E) Esc inside the panel cancels mid-stream` | Asserts: cancel visible (L221); send visible after Esc (L226); cancel not exist after Esc (L227). | no | no action |
| `F) synthetic-correction row appears between iter-1 and iter-2 rows` | Asserts: synthetic-correction element exists (L247); tool-row count >= 2 (L249); positional ordering via raw HTML indexOf checks proving the correction sits BETWEEN the first and last tool rows (L253-261). | no | no action (positional ordering is exactly the named scope) |

### `ai-intent-confirmation-flow.cy.js`

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `shows discovery tool rows silently then renders ConfirmationCard with plain-English description only` | Asserts: panel visible (L198); >=2 tool rows w/ status=success (L208-211); confirm card visible w/ data-tool-name=request_confirmation (L214-216); no technical heading (L222); no `<pre>` (L225); approve+skip+status elements queried (L228-232); composer input + send button disabled (L235-236). | YES — disabled input/send button is an extra not in description; "plain-English description" is in the title but is never actually asserted (no contains check on description text). | either add a real `contains("I'll rewrite your Hero")` assertion to validate the "description only" claim, OR rename to mention the disabled-composer side effect |
| `clicking Proceed re-submits with confirmed_tool_calls and surfaces the mutation result` | Asserts: confirm card visible (L275); after Proceed — second request body has confirmed_tool_calls array (L281-284); card no longer exists (L287); >=1 tool row (L290); messages container (L293); status (L296); token-count >0 (L301-304). | YES — token-count >0 and card-disappearance are extras not in the description; description only mentions "re-submits with confirmed_tool_calls" + "surfaces mutation result". | drop token-count assertion (or rename to mention token accumulation) and drop the card-disappear check (or rename) |
| `clicking Cancel removes the card, shows a cancellation note, and fires no second request` | Asserts: card visible (L333); card does not exist after Cancel (L345); messages container (L348); status container (L351); no `regenerate_section_text` tool row in any existing tool-row (L354-358); composer not disabled (L361); secondCallFired flag false (L364-366). | YES — composer re-enabled is an extra; the no-mutation-tool-row check is implementation of "no second request" but could be argued as scope. | minor — fold composer-enabled into description ("…and re-enables composer"), or split into a separate it() |
| `a message with explicit approval goes straight to mutation without showing a ConfirmationCard` | Asserts: confirm card does not exist (L395); messages container present (L398); status present (L401); >=1 tool row (L404). | no | no action (no confirm card + mutation tool row are within scope) |

### `ai-router-mutation-flow.cy.js`

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `renders the assistant final message after a successful regenerate_section_text mutation` | Asserts: panel visible (L186); messages container (L194); status (L195); token-count (L196). | YES — status and token-count are extras; description only names "renders the assistant final message". Also, the final message text is never positively asserted (no contains check). | either add `contains('rewrote your About 1')` to actually verify the final message, OR rename to "renders the messages pane and metering after a successful regenerate_section_text mutation" |
| `reports honest failure rather than fabricating success when every mutation fails` | Asserts: `ai-rewrote-bubble` does NOT exist inside messages (L211); status container present (L212). | no | no action (the absence of a fabricated-success bubble is the direct embodiment of "honest failure", status is borderline but acceptable) |
| `surfaces a successful final message when the server-side synthetic-correction guard recovers a mutation intent` | Asserts: messages container (L227); token-count (L228); status (L229). | YES — token-count is an extra; the actual "successful final message" content is never asserted (no contains check). | either add a positive content assertion on the final message, OR drop token-count and rename appropriately |

### `ai-token-metering-402.cy.js`

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `surfaces toast + AlertModal when /api/fn-execute/ai/chat returns 402 (SSE path)` | Asserts: FAB visible (L60); panel visible (L61); toast-insufficient-tokens visible (L69-70); toast-required-tokens text = '1500' (L71); toast-available-tokens text = '0' (L72); purchase-tokens-alert-modal visible (L75); purchase-tokens-cta visible (L76). | no | no action (toast + AlertModal are exactly named; the required/available text checks are sub-features of "toast") |
| `opens OneTimePaymentPopup after the user clicks "Purchase" in the AlertModal` | Asserts: alert-modal visible (L93); after CTA click — one-time-payment-popup visible (L98). | no | no action |
| `does NOT show a duplicate error toast when 402 originates from a non-chat axios call` | Asserts: alert-modal visible after broker event dispatch (L128); toast-insufficient-tokens count <= 1 (L132-137). | no | no action (alert-modal visibility is the implicit precondition for the duplicate check; both within scope) |
| `falls back to the navigation redirectUrl when showTokenAlertModal throws (defensive)` | Asserts: 402 response body has `redirectUrl === '/account/billing/tokens'` (L156-160). NO assertion that any fallback navigation occurred — only that the broker payload contains the URL. | YES — the description claims a fallback navigation behavior but the test only checks the response payload contains a URL field. The "throws" + "falls back" behaviors are entirely uncovered. | either implement a real fallback navigation test (stub showTokenAlertModal to throw, assert window.location change), OR rename to "the 402 response carries redirectUrl='/account/billing/tokens' for the handler's fallback branch" |
| `logs the 402 hit through the central logger (no console.* leaks)` | Asserts: alert-modal visible (L194); console.error called <= 1 time during 402 path (L200). | YES — alert-modal visibility is an extra; the description only promises a logger/console check. Also the test does NOT verify the central logger was actually called (no spy on `logger.*`) — only that `console.error` was not abused. | either add a real spy on the logger pipeline, OR rename to "does not leak console.error during 402 handling" and drop the alert-modal assertion |

### `picker.click.cy.js`

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `clicking a description element adds a chip with the correct preview + kind` | Asserts: body has `ai-picker-active` class after pick-button click (L78); chip count >=1 (L99-100); empty `within()` block at L100-103 — no kind/preview assertion is actually executed. | YES — the description promises "correct preview + kind" but the `.within()` callback is empty; no preview text or kind label is ever positively asserted. The `ai-picker-active` body class is an extra. | implement the missing assertions inside `within()` (a kind="text" or "T" icon check + preview text contains check) OR rename to "clicking a description element adds a chip to the tray" and drop the empty within block |
| `sending the prompt posts selected_elements with sectionName=description and stable elementId` | Asserts: body has `ai-picker-active` (L108); chip count >=1 (L121); request body has selected_elements array (L127-128); first selected_elements.kind === 'text' (L130); sectionName === 'description' (L131); elementId matches `-description-\d+$` regex (L135). | YES — `kind === 'text'` is an extra (description names only sectionName + elementId); `ai-picker-active` body class is also extra. | drop the `kind === 'text'` assertion (or rename to include "kind=text"); body-class check is a setup tolerance |

### `picker.duplicate.cy.js`

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `clicking the same element twice keeps chip count at 1` | Asserts: body has `ai-picker-active` after entering pick mode (L61); after first click — exactly 1 chip (L79); after re-enter + second click — still exactly 1 chip (L88). | no | no action (chip count after duplicate click is exactly the named claim) |

### `picker.enterMode.cy.js`

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `toggles ai-picker-active on body, dims composer and shows the badge` | Asserts: badge does not exist initially (L59); body does not have ai-picker-active initially (L60); pick button visible (L62); body has ai-picker-active after click (L65); badge visible (L66); pick button aria-pressed=true (L69). | YES — composer dimming is in the description but NEVER actually asserted (no class check on any composer element). aria-pressed is an extra. | either add an actual composer-class assertion (`[class*="composerPicking"]` should exist) and rename to include aria-pressed, OR drop "dims composer" from the description |
| `toggles back off when the button is clicked a second time` | Asserts: body has ai-picker-active after first click (L74); after second click — body does not have ai-picker-active (L77); badge does not exist (L78); aria-pressed=false (L79). | no | no action (badge disappearance + aria-pressed are tightly coupled to "toggles back off") |

### `picker.escapeAndOutsideClick.cy.js`

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `Esc exits pick mode and keeps the existing chip` | Asserts: body has ai-picker-active after pick-button click (L78); chip count >=1 after first pick (L81); body has ai-picker-active after re-enter (L90); body does NOT have ai-picker-active after Escape (L93); chip count >=1 (L95). | no | no action (Esc-exit + chip retention are exactly the named scope) |
| `outside-click off canvas exits pick mode and keeps chips` | Asserts: body ai-picker-active after entry (L100, L108); chip count >=1 (L103); after outside click — body does not have ai-picker-active (L112); chip count >=1 (L113). | no | no action |

### `picker.hoverOutline.cy.js`

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `renders a hover outline + label when a canvas text element is hovered` | Asserts: outline element with class containing `hoverOutline` exists (L84); label element with class containing `hoverLabel` exists (L85); label text matches `/H[1-6]|P|SPAN|A/i` (L88). | YES — the regex tag-text assertion is a subtle extra; description says "renders outline + label" but the tag-match check adds a specific label-content claim that isn't in the title. | either rename to "...with the element tag visible in the label" OR drop the regex check |

### `picker.removeChip.cy.js`

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `clicking the chip ✕ removes it from the tray` | Asserts: body has ai-picker-active after click (L68); chip count >=1 after pick (L85); chip count === 0 after Remove click (L87). | no | no action |
| `sending without any chips does NOT attach selected_elements to the body` | Asserts: request body's selected_elements is undefined or an empty array (L94-101). | no | no action |

### `picker.requestElementSelection.cy.js`

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `renders the selection card with disabled Continue when count < min` | Asserts: selection-card visible (L80); pick button + cancel button visible within card (L83-84); continue button visible AND disabled (L85-87). | no | no action (pick/cancel button visibility is implementation of "renders the selection card") |
| `Continue becomes enabled after min_count picks land` | Asserts: selection-card visible (L96); body has ai-picker-active after pick click (L100); continue button is not disabled after a pick (L117-118). | YES — `body ai-picker-active` is an extra setup-verification (description only names continue-becomes-enabled). | drop the body-class assertion OR rename to mention pick mode entry |
| `Cancel dismisses the card without sending a follow-up turn` | Asserts: selection-card visible (L126); after Cancel click — selection-card does NOT exist (L128). NO assertion that "no follow-up turn fires" (no second-call tracking). | YES — description claims "without sending a follow-up turn" but the test never verifies the absence of a second network call. | either add a no-second-call tracker (similar to ai-intent-confirmation-flow Test 3), OR rename to "Cancel dismisses the selection card" |

### `workspace-chat.cy.js`

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `mounts the chat panel on the workspace route (no /project/:id)` | Asserts (in beforeEach via loginToWorkspace): URL has no `/project/` (L249-251); panel visible after FAB click (L264); status + messages containers present (L265, L267). | no | no action (messages/status are panel sub-elements that fall under "mounts the chat panel") |
| `runs list_projects from workspace and renders the result inline` | Asserts: request body has messages with last content='List my projects' (L284-286); request body.project_id is null (L288); messages container present (L292); status (L293); ai-project-picker-card does NOT exist (L295). | YES — `project_id === null` assertion is an extra (covered by the dedicated "auto-injects" + "clears project_id" tests); picker-not-exist is an extra. | drop project_id and picker-absence checks (covered by Tests 4 and 5) OR rename to include "with no project_id and no picker" |
| `surfaces the inline project picker on missing_project_id and retries on chip click` | Asserts: picker-card visible (L329); chip count >=1 (L330); picker-card does not exist after chip click (L336); messages container (L337); second request body has project_id === TEST_PROJECT_ID (L340-342); messages container again (L344). | no | no action (picker visible + retry-with-projectId are both named) |
| `auto-injects project_id when inside a /project/:id route` | Asserts: editor canvas present (L359); panel visible after FAB click (L361); request body.project_id === TEST_PROJECT_ID (L365-367); ai-project-picker-card does NOT exist (L370); messages container (L371). | YES — picker-not-exist is an extra (description only names project_id auto-injection). | drop the picker-absence assertion OR fold into description ("…and skips the picker") |
| `clears project_id when navigating from project back to workspace` | Asserts: editor present (L398); turn 1 body.project_id === TEST_PROJECT_ID (L402-404); URL not in /project/ after navigation (L409); turn 2 body.project_id is null (L415-419); ai-project-picker-card visible after turn 2 (L422). | YES — turn-1's `project_id === TEST_PROJECT_ID` is an extra (it's the inverse of the named "clears" behavior — already covered by Test 4); picker-re-surfaces is also an extra. | drop the turn-1 project_id assertion (or rename to "switches project_id between project and workspace routes") and drop the picker-re-surface assertion |
## localization

### `edge-cases.cy.js`

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `should show an error notification when the save request returns a network error` | Stubs PATCH/PUT to return 500, adds a language, optionally dismisses AI dialog, then checks for any error notification selector. Logs result instead of asserting. Falls back to asserting the settings panel is open if the Add button is disabled. | `YES — uses cy.log instead of an actual assertion on the error notification, and the fallback path asserts on the settings panel which is unrelated to error-notification behavior` | Replace cy.log branches with a real assertion: `cy.get('[data-cy="notification-error"], [role="alert"]').should('exist')`. Remove the settings-panel fallback assertion. |
| `should show an error notification when the AI translation API call fails` | Stubs the fn-execute endpoint to 500, clicks a translate button if present, confirms the AI dialog, then checks for error notification. Logs outcome instead of asserting; falls back to verifySettingsPanelOpen. | `YES — never fails on missing error notification (only logs), and the fallback asserts settings panel openness which is unrelated to the AI translation error description` | Hard-assert presence of an error notification when translate button exists; skip the test entirely (`this.skip()`) when prerequisites are missing instead of asserting on the panel. |
| `should keep the localization table functional when default language is the only language` | Verifies the settings page exists and that `[role="grid"]` and `[role="gridcell"]` are rendered. | `no` | none |
| `should have all delete buttons disabled when default language is the only language` | Asserts at least one disabled button exists in the settings panel. | `YES — counts ALL disabled buttons in the panel, not specifically the delete/language-header trash buttons. Could be satisfied by any unrelated disabled button (e.g., Add Language button at limit)` | Scope the query to the actual delete button selector (e.g. a per-language-column trash button data-cy) rather than any `button[disabled]`. |
| `should render the default language column header with the correct language code` | Conditionally checks if `[data-cy="localization-lang-header"]` exists and asserts it exists; otherwise logs. Does NOT verify the language code value itself. | `YES — never validates that the header contains the correct language code; only checks the header element exists. The "correct language code" portion of the description is unasserted` | Add an explicit assertion that the header contains the expected default code (e.g. `en`/`EN`) via `.should('contain.text', 'en')`. |
| `should display the target language code/name in the AiTranslationConfirmation modal` | Adds a language, then if the dialog appears, asserts the modal body text contains the language code or name. Otherwise logs and continues, or asserts settings panel is open. | `YES — fallback branches assert/log on settings panel openness which is unrelated; soft-pass when dialog is absent` | Replace soft-pass branches with `this.skip()` or hard-fail when the dialog does not appear under stubbed conditions. |
| `should show language select dropdown after clicking Add Language button` | Clicks add-language button and verifies the select-language input/container appears in the settings panel. Falls back to verifying settings panel open if button is disabled. | `no` | none |

### `language-management.cy.js`

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `should add a new language to the localization table` | Clicks add language button, types code/name, then verifies the language appears in the table. Fallback: verifies settings panel open. | `YES — the fallback asserts on settings panel openness which is unrelated to adding a language. The test passes even when the add never happened` | Replace fallback with `this.skip()` when the Add button is disabled; ensure stub reliably enables the button. |
| `should show language select dropdown after clicking Add Language button` | Clicks add button and verifies a Select Language input/container appears. Falls back to settings panel open. | `no` | none (duplicate of edge-cases test; consider deduping) |
| `should remove a language from the localization table` | Adds then removes a language, verifies the removed language is no longer in the table. Fallback: verifies settings panel open. | `YES — fallback path asserts settings panel openness which is unrelated to "remove from table"` | Replace fallback with `this.skip()`. |
| `should switch the active language and re-render the canvas` | Adds a language, switches to it via popover, then verifies canvas is rendered. Fallback verifies canvas rendered without switching. | `no` | none |
| `should NOT allow deleting the last remaining language` | Asserts that some `button[disabled]` exists in the settings panel. | `YES — counts ANY disabled button. Does not specifically target the delete/trash button of the last remaining language column. The disabled count could come from other unrelated controls` | Target the specific trash/delete button for the last language column and assert it is disabled. |
| `should have the Add Language button present in the settings panel` | Asserts the settings page exists and the add-language button exists. | `no` | none |
| `should have delete and set-default buttons disabled for the default language column` | Asserts at least one `button[disabled]` exists in the panel. | `YES — does not specifically check delete or set-default buttons of the default language column; any disabled button satisfies the assertion` | Scope to specific buttons via dedicated data-cy attributes (e.g. `lang-col-delete-{code}`, `lang-col-set-default-{code}`). |
| `should keep the delete button disabled for the default language even after adding a second language` | Adds a second language, dismisses AI dialog, then asserts at least one `button[disabled]` exists. | `YES — does not specifically verify the default-language delete button; satisfies via any disabled button after the add` | Target the specific default-language delete button and assert disabled. |
| `should filter out already-added languages from the add language dropdown` | Adds a language, reopens the dropdown, then checks for `option[value="fr"]` — but only logs the result instead of asserting. | `YES — uses cy.log instead of an assertion. The test cannot actually fail when French still appears as an option (the bug case the description targets)` | Replace cy.log branch with `expect(frenchOption.length).to.eq(0)`. |
| `should persist added language after page reload` | Adds a language, reloads the page, reopens settings, verifies language still present. Fallback verifies panel open. | `no` | none |

### `language-toggle-render.cy.js`

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `renders TR content when toggled EN → TR (and re-renders EN on TR → EN)` | Seeds EN/TR/AB sentinels, asserts playground shows EN sentinel only, switches to TR and asserts TR-only, then switches back to EN and asserts EN-only. | `no` | none |
| `handles rapid TR → AB → TR toggling without state leak from prior language` | Seeds sentinels, then cycles TR → AB → TR, asserting on each step that the playground contains only the active language's sentinel and not the others. | `no` | none |

### `localization.cy.js`

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `should open the localization settings panel` | Opens localization, verifies settings panel is open. | `no` | none |
| `should add a new language to the localization table` | Adds a language and verifies it appears in the table. Fallback verifies panel open. | `YES — fallback asserts on settings panel openness, unrelated to "language added to table"` | Replace fallback with `this.skip()`. |
| `should remove a language from the localization table` | Adds then removes a language and verifies removal. Fallback verifies panel open. | `YES — fallback asserts on settings panel openness, unrelated to "remove from table"` | Replace fallback with `this.skip()`. |
| `should switch the active language and re-render the canvas` | Adds a language, switches to it, verifies canvas renders. Fallback verifies canvas rendered. | `no` | none |
| `should persist added language after page reload` | Adds a language, reloads, reopens settings, verifies language present. Fallback verifies panel open. | `no` | none |
| `should visually update the playground when translating the currently active language` | Edits the EN cell of the first string prop and asserts the playground contains the new text. | `no` | none |
| `should NOT deselect the selected element when opening localization settings` | Selects a component, opens localization, navigates to settings, closes settings, then asserts the settings-panel for the component is still visible. | `no` | none |
| `should live-update the playground when editing a nested string prop in localization settings` | Adds a feature component, opens localization settings, edits a nested "Consultation" cell, closes settings, and asserts the playground contains the new text. | `no` | none |

### `page-update-language-scoped.cy.js`

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `canvas inline-edit in EN does NOT overwrite TR copy of the same prop` | Seeds EN/TR sentinels, edits via canvas inline editor in EN, reopens settings and asserts EN cell shows edited value and TR cell still shows TR sentinel. | `no` | none |
| `content-tab edit in EN does NOT overwrite TR copy of the same prop` | Seeds EN/TR sentinels, selects component, edits via the Content-tab input matching EN_VALUE, reopens settings and asserts EN cell shows edited value and TR cell unchanged. | `no` | none |

### `popover-list-sync.cy.js`

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `reflects an ADDED language in the popover list without a page refresh` | Confirms popover lacks TR row, opens settings, adds Turkish, closes overlay, reopens popover and asserts TR row is now visible. | `no` | none |
| `reflects a REMOVED language in the popover list without a page refresh` | Adds Turkish, clicks delete in its column header, asserts Turkish column gone, closes overlay, reopens popover and asserts TR row gone while default EN remains visible. | `no` | none |
| `reflects a DEFAULT-LANGUAGE change in the popover list without a page refresh` | Adds Turkish, clicks set-default on Turkish, closes overlay, reopens popover, asserts TR row visible, then asserts the row container has at least one button (proxy for default tick icon). | `YES — final assertion checks for ANY button under the row container ("have.length.greaterThan", 0), not specifically the TickCircle/default-icon button. Description targets a default-change, but the assertion is too generic` | Target the default-tick icon via a dedicated data-cy (e.g. `[data-cy="popover-lang-default-icon"][data-lang-code="tr"]`) and assert presence on TR and absence on EN. |

### `settings-ui.cy.js`

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `should open the localization settings panel` | Opens localization, verifies settings panel is open. | `no` | none |
| `should render localization toolbar icon with correct data-cy attribute` | Asserts `[data-cy="toolbar-icon-localization"]` exists and is visible. | `no` | none |
| `should open localization WMenu with edit button after clicking toolbar icon` | Clicks toolbar icon, asserts edit button exists. | `no` | none |
| `should show language list in the WMenu dropdown` | Clicks toolbar icon, then conditionally logs whether the edit button is present and closes the menu. No real assertion on the language list. | `YES — never asserts on the language list itself; only logs that the menu is open. Description claims language list visibility verification` | Assert the popover language rows exist (e.g. `cy.get('[data-cy="popover-lang-row"]').should('have.length.greaterThan', 0)`). |
| `should navigate back to editor when close button [data-cy="modal-close-btn"] is clicked` | Opens settings, clicks close button, asserts playground is visible and settings page does not exist. | `no` | none |
| `should NOT deselect the selected element when opening then closing localization settings` | Opens then closes settings, clicks a component, asserts settings panel visible; reopens then closes localization, asserts settings panel still visible. | `no` | none |
| `should NOT deselect the selected element when opening localization settings` | Selects component, opens localization, closes overlay, asserts settings panel still visible. | `no` | none |
| `should close the localization overlay when Escape key is pressed` | Presses Escape, asserts settings page no longer exists. | `no` | none |
| `should show token limit modal when AI tokens are 0 and a translate action is triggered` | Stubs aiTokens=0, clicks a translate button if present, then logs whether a token modal appeared. No real assertion. Fallback verifies panel open. | `YES — never asserts on the token-limit modal; only logs. Fallback verifies the settings panel which is unrelated to token-modal behavior` | Hard-assert `cy.get('[data-cy="token-limit-modal"]').should('exist')` when translate button is present; skip otherwise. |
| `should show AI translation confirmation dialog after adding a language` | Adds a language, then conditionally logs whether the AI dialog appeared. No assertion that it did appear. Fallback verifies panel open. | `YES — only logs that the dialog appeared; does not assert it. Description claims the test confirms dialog appearance` | Replace cy.log with `expect(hasDialog).to.be.true` (or a hard `cy.get('[id="ai-translation-confirmation"]').should('exist')`). |
| `should dismiss AI translation confirmation dialog when Cancel is clicked` | Adds a language, conditionally clicks Cancel, asserts dialog does not exist. Fallback verifies panel open. | `no` | none (dismissal IS asserted; the dialog presence check is best-effort but the final `should('not.exist')` covers the description) |
| `should fire a network save request when a language is confirmed via AI translation dialog` | Intercepts PATCH/PUT, adds a language, then `cy.get('@saveProject')` logs whether request fired. No `cy.wait('@saveProject')` or assertion on call count. Fallback verifies panel open. | `YES — never asserts the network request fired; only logs. Description claims network save verification` | Use `cy.wait('@saveProject').its('response.statusCode').should('be.oneOf', [200, 204])` or assert call count. |
| `should reflect correct enabled/disabled state of Add Language button at subscription limit` | Conditionally asserts the Add button exists and logs. No verification of the actual enabled/disabled state matching the subscription limit. | `YES — does not verify the enabled/disabled state versus the subscription limit; only checks button existence. Description targets state-vs-limit correctness` | Stub the limit explicitly to both at-limit and below-limit states and assert the button's `disabled` attribute matches each. |

### `table-interactions.cy.js`

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `should render the localization table with at least one row for a hero component` | Asserts settings page, grid, and at least one gridcell exist. | `no` | none |
| `should allow typing in a translation cell without errors` | Double-clicks a cell, then conditionally logs whether an editor appeared and dismisses with Escape. No assertion that typing actually worked. | `YES — never asserts on the typing outcome or even the editor appearing. cy.log branches make the test always pass` | Hard-assert the editor element exists after dblclick: `cy.get('[data-cy="l10n-cell-editor"], .rdg-text-editor').should('exist')`; then type and verify the cell text updated. |
| `should update a cell value and reflect the change in the table` | Double-clicks a cell, types text into the editor, waits 500ms. Never asserts the table actually reflects the new value. | `YES — no assertion on the cell value reflecting in the table after edit. Description explicitly claims this verification` | Add `cy.get('[role="gridcell"]').contains('Live Update Test Content').should('exist')` after the edit. |
| `should visually update the playground when translating the currently active language` | Edits the EN cell, then asserts the playground contains the new text. | `no` | none |
| `should live-update the playground when editing a nested string prop in localization settings` | Opens settings, finds a "Consultation" gridcell, edits it, closes settings, asserts the playground contains the new text. | `no` | none |
| `should show translate cell button on hover over a non-default language cell` | Checks if the translate-cell button exists in the DOM at rest; logs whether found. Does NOT perform a hover or assert hover behavior. | `YES — description claims "on hover" verification but no hover (mouseenter/trigger) is performed and no real assertion is made (logs only)` | Trigger a mouseenter/hover on the cell and assert the translate-cell button becomes visible. |
| `should show regenerate cell button on hover over a translated cell` | Same pattern: checks DOM at rest, logs outcome. No hover triggered, no assertion. | `YES — description targets hover behavior on a translated cell but no hover is triggered, no translated state is set up, and no real assertion is made` | Set up a translated cell, trigger hover, assert the regenerate-cell button is visible. |
| `should show translate column button in a language column header` | Checks if `[data-cy="localization-translate-col"]` exists at rest; logs result. | `YES — only logs whether the button exists, no real assertion. Description claims the column button appears in the header` | Replace cy.log with `cy.get('[data-cy="localization-translate-col"]').should('exist')`; set up state (non-default language) so the button is guaranteed to render. |
| `should show regenerate column button in a language column header` | Checks if `[data-cy="localization-regenerate-col"]` exists at rest; logs result. | `YES — only logs; no real assertion. Description claims the column button appears` | Replace cy.log with a hard assertion; set up a translated non-default column. |
| `should show a loading indicator while AI translation is in progress` | Delays the translation endpoint by 2s, clicks a translate button if present, then logs whether any loader was found. No assertion. | `YES — never asserts on the loading indicator; description claims the verification. The test always passes` | Replace cy.log with `cy.get('[data-cy="localization-loading"], [role="progressbar"]').should('exist')` while the request is in flight. |
| `should render table rows grouped under the correct page heading` | Asserts grid + gridcells exist, then logs whether group-row selectors are present. Does NOT assert grouping itself, nor that rows are under the correct page heading. | `YES — description claims rows are grouped under the correct page heading; the test only logs presence of a group-row class match and never verifies the heading or grouping structure` | Assert a specific group-row data-cy exists AND that the page heading text matches the current page name. |
## abTesting

### `ab-testing.cy.js`

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `should render the settings gear icon for each page in the page list` | Opens header page dropdown; asserts `[data-cy="ab-testing-panel-btn"]` exists on the first page. | `no` | Keep as-is. |
| `should open the PageSettingsModal and show the AB testing section` | Opens AB testing panel; asserts `[data-cy="ab-testing-section"]` exists. | `no` | Keep as-is. |
| `should display A/B Testing heading in the settings modal` | Opens AB testing panel; asserts `[data-cy="ab-testing-section"]` exists. Description says "A/B Testing heading" but no heading-text/element assertion is made (only the section). | `YES — name claims heading is verified but only section presence is asserted; no heading text/element check` | Rename to "should display A/B Testing section in the settings modal" OR add an explicit assertion for the heading element/text. |
| `should render the flow builder canvas when AB testing is enabled` | Opens panel; if create-first-test button exists, intercepts create endpoint, clicks button, types name, confirms, then asserts `[data-cy="ab-flow-canvas"]` exists. Also fallback asserts `ab-testing-section`. | `YES — also drives full create-AB-test flow (intercept POST /ab-tests, type name, click confirm), which is beyond rendering the canvas` | Split into separate tests: one purely for canvas render, another for the create flow. |
| `should display the page node when flow builder is rendered` | Opens panel; if canvas exists, calls `verifyPageNodeExists()`. Fallback asserts section exists. | `no` | Keep as-is. |
| `should display at least one variant node (primary)` | Opens panel; if canvas exists, asserts `[data-cy="ab-variant-node"]` count >= 1. Description says "primary" but the test only checks "at least one" — does not assert it is the primary. | `YES — name implies primary-variant check; only generic variant count is asserted, primary identity not verified` | Either rename to drop "(primary)" or assert the first variant is primary (e.g., name === "Variant 1" / isPrimary). |
| `should have edges connecting page to variants when flow builder is active` | Opens panel; asserts `.react-flow__edge` exists with count >= 1 inside canvas. Fallback asserts section. | `no` | Keep as-is. |
| `should create a new variant and display it in the flow` | Opens panel; reads initial variant count; calls `createVariant()`; asserts new count is initial+1. | `no` | Keep as-is. |
| `should show the primary variant (Variant 1) in the flow` | Opens panel; calls `verifyVariantNodeExists('Variant 1')`. Fallback asserts section. | `no` | Keep as-is. |
| `should display percentage on page-to-variant edges` | Opens panel; asserts first `.react-flow__edge` exists and `.react-flow__edgelabel` count >= 1. Description says "percentage" but no text/number assertion is made — only edge-label DOM presence. | `YES — name claims percentage value is checked; only edgelabel element presence is asserted, no numeric/%% content check` | Either rename to "should display labels on page-to-variant edges" or assert the label text matches a percentage pattern. |
| `should save the AB test configuration successfully` | Opens panel; creates variant; saves; verifies save success. | `no` | Keep as-is. |
| `should persist variants after page reload` | Opens panel; creates variant; saves; verifies success; reloads; reopens panel; asserts variant count >= 2 and `verifyFlowBuilderVisible()`. | `no` | Keep as-is. |
| `should allow selecting a variant node by clicking` | Opens panel; clicks variant "Variant 1"; asserts a `.selected, [class*="selectedNode"]` variant exists. | `no` | Keep as-is. |
| `should allow selecting the page node by clicking` | Opens panel; clicks page node; asserts a `.selected, [class*="selectedNode"]` page node exists. | `no` | Keep as-is. |

### `auto-ab-awaiting-review.cy.js`

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `renders reasoning text + action rows with category badges + Apply All & Reject` | Opens panel; asserts pending-iteration card visible; asserts action list exists with 3 action rows; references rows 0/1/2 (no actual badge assertion); asserts Apply All and Reject buttons visible and not disabled. Name claims "reasoning text" and "category badges" — neither is asserted (no text/badge check, just row presence by index). | `YES — name claims reasoning text and category badges; test only asserts 3 row elements exist and 2 buttons; no reasoning-text or badge assertions present` | Either remove "reasoning text + category badges" from the name or add explicit assertions on reasoning text content and badge `data-cy`/text. |
| `Apply All click posts to /ab-tests/:id/apply-pending and clears the card` | Opens panel; clicks Apply All; waits for intercept; asserts URL matches `/ab-tests/:id/apply-pending` and status 200; re-stubs detail; asserts apply button either disappears or is disabled. | `no` | Keep as-is. |
| `Reject click PATCHes with pending_iteration:null and auto_ab_status:sampling` | Opens panel; clicks Reject; waits for intercept; asserts URL contains resource path + `abTestId=` query, and body deep-equals `{pending_iteration:null, auto_ab_status:'sampling'}`. | `no` | Keep as-is. |
| `renders three iteration-log rows with correct decision badges and category-tagged actions` | Opens panel; asserts iteration history visible; asserts log list exists with 3 log rows; asserts first row is `auto-ab-log-row-3` (newest-first); asserts rows 3/2/1 exist; expands row 3 and asserts `auto-ab-log-row-decision` + `auto-ab-log-row-lift` exist. Name claims "correct decision badges" (decision values not asserted, only presence of decision element on one row) and "category-tagged actions" (no category assertion). | `YES — name claims correct decision badges (no value/label assertion) and category-tagged actions (no category assertion); only presence of decision+lift cells on row 3 is checked` | Either narrow the name to "renders three iteration-log rows newest-first with decision and lift cells" or add explicit assertions on decision label values (won/lost/inconclusive) and category tags on applied actions. |

### `auto-ab-testing.cy.js`

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `renders the conversion empty state when zero conversions exist` | Opens panel; expands Auto-AB section; toggles Auto-AB ON; if empty state present, asserts `conversion-empty-state` and `conversion-empty-state-cta` exist. | `no` | Keep as-is. |
| `ConversionActionConfigurator surfaces all three subtype radios when present` | Opens panel; if configurator mounted, asserts `conversion-subtype-click/submit/custom` exist. | `no` | Keep as-is. |
| `Auto-AB section toggle renders inside flow builder` | Opens panel; asserts `auto-ab-section-toggle` exists. | `no` | Keep as-is. |
| `renders the precondition gate (lock icon) when the page is unpublished` | Opens panel; expands section; if gate present, asserts gate visible, toggle disabled, parent title matches `/Publish this page/i`. Name says "lock icon" but no icon-specific assertion (only gate selector). | `YES — name claims lock-icon assertion; test asserts gate selector + toggle disabled + parent title; no icon element/class verified` | Rename to drop "(lock icon)" OR add a specific lock-icon selector assertion. |
| `exposes risk-level + scope + hypothesis fields with correct contracts` | Opens panel; expands; toggles on; asserts risk-low/medium/high pills exist; scope text/components/images/style pills exist; hypothesis textarea exists with `maxLength=500`; sample-amount input has `min=20, max=10000, step=10`. Description mentions "risk-level + scope + hypothesis" — additionally asserts the sample-amount stepper contract, which is not in the name. | `YES — also asserts sample-amount stepper min/max/step (not in "risk-level + scope + hypothesis" description)` | Rename to include "+ sample stepper" OR move stepper assertion to its own test. |
| `refuses to deselect the last scope pill (min 1 selected)` | Opens panel; expands; toggles on; clicks scope-text pill (the default selected one); asserts class still matches `scopePillActive`. | `no` | Keep as-is. |
| `shows the auto-apply warning when winner_action=auto_apply is selected` | Opens panel; expands; toggles on; selects auto_apply radio; asserts `auto-ab-live-mode-notice` visible. | `no` | Keep as-is. |
| `renders the auto-ab-active banner when Auto-AB is running` | Opens panel; if lockout banner present, asserts `data-variant` attribute matches `/^(auto-ab-active|unpublished|manual-active)$/`. Description says "auto-ab-active banner" specifically; assertion accepts three variants including unpublished and manual-active. | `YES — name says auto-ab-active variant; assertion accepts any of three variant values, not just auto-ab-active` | Tighten assertion to `data-variant=auto-ab-active` only, OR rename to "renders the lockout banner with a recognized variant when Auto-AB is running." |
| `renders the unpublished banner variant when project is unpublished` | Opens panel; if banner present, asserts `data-variant` attribute exists. Description says "unpublished" variant; assertion only checks attribute existence, not value=unpublished. | `YES — name claims unpublished variant; assertion only checks attribute presence, not value=unpublished` | Tighten assertion to `data-variant=unpublished`. |
| `shows Sampling pill with progress when status=sampling` | Opens panel; asserts pill has `data-status=sampling` and that a progressbar element exists inside loop-status. | `no` | Keep as-is. |
| `shows Deciding pill with spinner when status=deciding` | Opens panel; asserts pill has `data-status=deciding`. Name claims "with spinner" but no spinner element assertion. | `YES — name claims spinner verification; no spinner DOM/role assertion made` | Either drop "with spinner" from the name OR add a spinner selector assertion. |
| `shows Stopped pill when status=stopped` | Opens panel; asserts pill has `data-status=stopped`. | `no` | Keep as-is. |
| `reflects the current phase via the data-status attribute on the pill` | Opens panel; asserts pill has a `data-status` attribute (no value check). | `no` | Keep as-is. |
| `renders the recommend pause card when winner_action=recommend and a decided iteration exists` | Opens panel; if pause card present, asserts pause card visible, apply-and-continue button visible, skip-iteration button visible. | `no` | Keep as-is. |
| `Apply & continue posts to /apply-winner` | Opens panel; clicks apply button; waits for `@applyWinner`; asserts request body has `iterationId`. | `no` | Keep as-is. |
| `Skip posts to /skip-iteration` | Opens panel; clicks skip button; waits for `@skipIteration`; asserts request body has `iterationId`. | `no` | Keep as-is. |
| `Stop button opens the confirmation modal` | Opens panel; clicks stop button; asserts `auto-ab-stop-dialog` visible. | `no` | Keep as-is. |
| `confirming the stop dialog posts to /disable-auto` | Opens panel; clicks stop button; clicks confirm button; waits for `@disableAuto`. | `no` | Keep as-is. |
| `iteration history panel renders below loop status` | Opens panel; asserts `auto-ab-iteration-history` visible. Name says "below loop status" but no positional/ordering assertion. | `YES — name implies positional relationship to loop status; only presence-visibility asserted, no positional/order check` | Either drop "below loop status" from the name OR add a DOM-order assertion relative to loop status. |
| `renders rows newest-first (iter #3, #2, #1)` | Opens panel; asserts at least one iteration row exists, and the first has `data-cy=auto-ab-iteration-row-3`. Name claims order #3, #2, #1; test only verifies first is row-3, does not assert #2/#1 ordering. | `YES — name claims full order #3,#2,#1; test only checks first row is #3 (does not verify #2 and #1 ordering)` | Either narrow the name to "first row is newest (iter #3)" OR add explicit eq(1)/eq(2) ordering assertions for #2 and #1. |
| `expanding a row reveals LLM reasoning + archived variant link` | Opens panel; clicks toggle on row 3; asserts `auto-ab-archived-variant-link` exists within row 3. Name claims "LLM reasoning" but no reasoning text/element assertion. | `YES — name claims LLM reasoning verification; only archived variant link is asserted, no reasoning element check` | Either drop "LLM reasoning" from the name OR add a reasoning-text selector assertion. |
| `shows the empty state when /iterations returns []` | Opens panel; waits for empty intercept; asserts `auto-ab-iterations-empty` exists. | `no` | Keep as-is. |
| `shows stop reason text when status=stopped` | Opens panel; asserts pill has `data-status=stopped`. Name says "stop reason text" but no text/reason assertion — only pill data-status. | `YES — name claims stop-reason text verification; only pill data-status attribute is asserted, no reason text element/content checked` | Either rename to "shows stopped status pill when status=stopped" OR add a stop-reason text/element assertion. |
| `the AB testing section is present in the page settings modal` | Sets uncaught-exception suppressor; opens panel; asserts `ab-testing-section` exists. | `no` | Keep as-is. |
## blockBuilder

### `block-builder.cy.js`

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `should successfully drag an element from palette and drop it, creating a space` | Drags a Container into the root drop zone and asserts the container exists. Then drags a Button into the container and asserts the Button node exists. Then drags a Paragraph into the container and asserts the Paragraph node exists. | `YES — description claims a single drag/drop creating a space, but test performs three separate drag operations (Container, Button, Paragraph) and asserts on all three; no "space" assertion is made.` | `split into 3 tests (drag Container into root, drag Button into Container, drag P into Container) OR rename to "should support dragging multiple elements from palette into root and nested containers"` |
| `should allow configuring available media types for Base.Media` | Drags a Container then a Media element, clicks the Media node, asserts the allowed-media-types panel is visible, clicks a lottie option and asserts it exists. Then switches to Design tab and asserts the size category section is visible and an object-fit label exists. | `YES — Design tab category-section-size and design-tab-object-fit-label assertions are beyond "configuring available media types".` | `remove the Design-tab assertions (lines 57-59) OR split out a second test "selecting Media reveals object-fit control in Design tab"` |
| `should strictly prevent dragging non-container elements directly into the empty root canvas` | Drags a Button onto the root drop zone, asserts canvas is still visible, then branches: if Button node is absent, asserts the empty canvas placeholder exists; if present (DnD simulation bypass), only re-asserts canvas visibility. | `no` (the test's intent is prevention; conditional branches handle the DnD-simulation caveat but every assertion is still about prevention vs. graceful fallback) | `no action` |
| `should restrict hierarchy modifications on smart parent replica children` | Drags a Container, opens Settings, and if a smart-parent-toggle is found, clicks it and asserts a smart-parent-lock or replica-lock-icon exists in the canvas. Otherwise asserts canvas is visible. | `no` (the assertion is about replica lock — i.e. restricted hierarchy modification — matching the description) | `no action` |
| `should include all smart parent children values in generated addProp when saving` | Drags Container + Paragraph, clicks save, fills the save dialog with "SPAddPropTest", and asserts canvas remains visible. Does NOT inspect the addProp payload nor verify smart-parent-children values. | `YES — description claims it verifies addProp generation including all SP children values, but only asserts canvas visibility post-save.` | `add intercept on saveComponent/saveComponentPut and assert payload contains the SP children values, OR rename to "should complete a save flow for a container with children"` |
| `should preserve the same element tree when saving and re-editing a component` | Intercepts upload + custom-components fetch, builds Container + Paragraph, captures node count, saves with name "TreePreserveTest", asserts save dialog closes, canvas remains visible, and node count is preserved (≤ countBefore+1). Does NOT re-edit. | `YES — description says "saving AND re-editing"; the test only saves and checks node count is unchanged, never reopens for re-edit.` | `add re-edit step (reopen component, assert tree matches captured snapshot) OR rename to "should not remove nodes when saving a component"` |
| `should not initially render popovers at absolute origin during async coordinate calculation` | Drags a Container, then if an add-element button exists, clicks it and asserts the resulting popover has top+left > 10 (not at origin 0,0). Otherwise asserts canvas is visible. | `no` (assertion directly matches the "not at absolute origin" claim) | `no action` |

### `blueprintBackendEndpoint.cy.js`

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `Golden path: Hero Section 1 hits new bucket endpoint, NOT static /blueprints/*` | Visits Hero BB URL, asserts canvas visible, waits for blueprint endpoint and asserts status 200 + body shape (blueprint.tree, componentVersion, title) + correct name param. Asserts no static blueprint manifest/file requests occurred. Asserts the BB preview <style> tag exists with non-empty CSS. | `YES — preview <style> tag CSS-length assertion is beyond the description's "hits endpoint, not static". That's a Tier-1 CSS extraction concern.` | `remove preview <style> assertion (lines 97-102) OR rename to "hits new endpoint and produces preview CSS, no static path requests"` |
| `Stats 2 still expands repeat-source cards via the new endpoint` | Visits Stats 2 BB URL, asserts blueprint endpoint hit with status 200 + tree, no static path hits. Asserts 4 stat amounts (8500, 660, 6834, 300) render. Asserts header copy and CTA button label appear. Asserts no raw <composerlink> tags in DOM. | `YES — header copy, CTA label, and <composerlink> leak assertions go beyond "expands repeat-source cards".` | `split off "blueprint string props round-trip" and "no composerlink leak" into separate tests OR rename to "Stats 2 blueprint renders cards, top-level props, and CTA with no leaked tags"` |
| `Unknown component → 404 from new endpoint → Tier-3 fallback (no crash)` | Visits unknown component URL, asserts blueprint endpoint returns 404 with the unknown name param. Asserts canvas remains visible. Asserts no "Something went wrong" top-level crash text. | `no` (404 + no-crash directly matches the description) | `no action` |
| `In-memory cache: reopening same component does not refetch the blueprint` | Visits Hero BB URL, waits for first blueprint hit. Clicks Design then Content tab to provoke re-renders. Asserts the blueprint endpoint was hit exactly once for Hero Section 1. | `no` (single assertion about call count matches the cache claim) | `no action` |

### `content-tab-lexical-editor.cy.js`

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `Content tab should render a Lexical editor (contenteditable), not a textarea, for text nodes` | Drags Container + H1, selects H1, opens Content tab, asserts a [contenteditable=true] element exists in content-tab-panel and no textarea exists. | `no` | `no action` |
| `text typed in Content tab Lexical editor should appear on the canvas` | Drags Container + Paragraph, selects P, opens Content tab, types "Hello Lexical Content Tab" into the contenteditable editor, clicks away, then asserts the canvas Paragraph node contains that text. | `no` | `no action` |
| `Content tab editor should also appear for text nodes inside array container children` | Drags Container + Row + H2 (into Row), selects the Row, opens Content tab, asserts at least one contenteditable element exists and no textarea exists. | `no` | `no action` |
| `HTML content stored in textContent should pre-populate the Lexical editor` | Drags Container + H3, double-clicks H3 to inline-edit, types "Initial Heading Text", clicks away. Re-selects H3, opens Content tab, asserts the Content-tab contenteditable shows that text. | `no` | `no action` |

### `css-gui.cy.js`

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `should restrict un-editable Position placement fields via disabled state when position is Static` | Drags Container, opens Design tab, scrolls to placement section. Asserts left/top inputs do NOT exist when Static, then clicks the absolute button and asserts inputs exist + are not disabled. | `YES — description says "restrict via disabled state when Static", but the test actually verifies the inputs do not exist at all when Static (not disabled). The Absolute-mode enable check is also beyond the Static-restriction scope.` | `rename to "Position placement inputs are hidden when Static and visible/enabled when Absolute" OR split into two tests (Static = hidden; Absolute = enabled)` |
| `should not inject rogue default inline styles (padding) when decomposing existing components` | Visits container BB URL, asserts container has no `padding-top: var(--padding-md)` style on mount, clicks the container, re-asserts the padding-top style is not present. | `no` | `no action` |
| `should not inject generic purple background colors implicitly from ColorPicker on mount` (skipped) | Skipped. | `no` (skipped; not evaluated) | `no action` |
| `should not cause infinite sync loops or background flashes when Custom CSS editor processes layout updates` | Drags Container, opens Design tab, opens Background section if present, types a hex color into the background input, then asserts container background is not reverted to unset/initial/inherit/none. Conditional fallbacks just assert canvas stability. | `no` (the no-sync-loop revert assertion matches the description) | `no action` |
| `should not show browser-computed default styles in Custom CSS panel for a plain H3 element` | Drags H3 to root, opens Design tab, scrolls to Custom CSS section, asserts the Monaco view-lines text does NOT contain border/display:block/flex-direction/flex-wrap/object-fit/opacity:1/background:rgba(0,0,0,0) patterns. | `no` | `no action` |
| `should not show browser-computed default styles (border, background, display, flex-direction) in Custom CSS panel for a plain H3 element` | Same as the previous test — duplicates: visits BB, drags H3, opens Design > Custom CSS, asserts the same regex set of computed-default values is absent. | `no` (duplicate of prior test but scope still matches description) | `no action — but note duplicate of the prior it() block; consider merging/removing one` |

### `css-injection-scoping.cy.js`

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `injects scoped CSS without corrupting rule bodies (no #playground inside declarations)` | Intercepts custom-components fetch with mocked styles/bundle. Visits editor. Locates the injected <style> tag containing the component class, asserts no `#playground` prefix appears inside declaration lines, asserts `#playground .Component_v1_container` is present, asserts the color declaration is preserved. | `no` | `no action` |
| `scopes all h1–h3 selectors while preserving their color declarations` | Visits editor with same mock. Iterates all live stylesheets, finds rules whose selector contains the component class; asserts there are 3 such rules, each selector starts with `#playground `, and each rule has a non-empty color value. | `no` | `no action` |

### `cssGuiLengthComputed.cy.js`

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `renders a Stats 2 wrapper element with width: 100% (the fill input to Length.computedValue)` | Visits Stats 2 BB. Iterates all canvas descendants and asserts at least one element's rendered width is within 2px of its parent's width (i.e. fills it). | `no` | `no action` |
| `shows the Width input disabled with a numeric computed value, and a clickable unit dropdown` | Visits Stats 2 BB, clicks first rendered node, opens Design tab. If the SIZE section mounts, scrolls to it, finds the width row's <input>; if disabled, asserts its value is a numeric string; finds a unit dropdown <p> matching px/rem/%/em/vw/vh/fill/hug and asserts it exists. | `no` | `no action` |

### `quick-save-version-rendering.cy.js`

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `renders the version specified in page JSON, not the first registered version` | Stubs three versions of `Call To Action 1`. Visits editor with sessionStorage marking version 3 as the updated one. After load, asserts `__CUSTOM_COMPONENTS__` exists and contains v1, v2, v3 entries. Asserts the two BB sessionStorage keys were cleared after processing. | `YES — description says "renders the version specified in page JSON, not the first registered version", but the test only asserts that ALL THREE classes are registered in window and that sessionStorage was cleared. It never asserts which version is actually rendered on the playground.` | `add an assertion that the rendered DOM corresponds to v3 (e.g. unique data-version attribute or version-specific marker) — OR rename to "registers all custom-component versions and clears sessionStorage after quick-save"` |
| `clears blockbuilder sessionStorage keys after processing the component update` | Sets sessionStorage with v2 quick-save data, visits editor, asserts both sessionStorage keys are null after load. | `no` | `no action` |
| `falls back gracefully to name-only match when no version is stored in page JSON` | Removes both sessionStorage keys, visits editor, asserts the playground element exists. | `no` (asserts no-crash → matches "falls back gracefully") | `no action` |
| `does not re-apply component update on subsequent re-renders` | Sets sessionStorage for v3, visits editor, asserts sessionStorage is cleared, asserts playground element exists. Does NOT actually trigger a second re-render or assert non-reapplication of the update. | `YES — description claims "does not re-apply on subsequent re-renders" but the test only checks that sessionStorage is cleared once after first load and that playground exists. No second-render or reapply check is performed.` | `add a real second-render trigger (language switch / route revisit) and assert the update is not reapplied (e.g. component version remains v3, or set a sentinel that would change if reapplied) OR rename to "clears sessionStorage so update cannot be reapplied"` |

### `save-dialog.cy.js`

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `should enforce strict versioning increments based on prefetched cache` | Mocks two versions of "My Custom Element". Opens save dialog, types the same name, asserts the version input `min` attr is 3 and value is 3. Types "1" into the version input, submits, asserts an error containing "must be at least 3" is visible. | `no` | `no action` |

### `tab-selection.cy.js`

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `should successfully select an element while in the Design tab, verifying the stale closure regression is fixed` | Drags Container, clicks it, asserts tab-Content is visible. Switches to Design tab, asserts category-section-layout is visible. Clicks canvas to deselect, asserts category-section-layout is no longer present. Re-clicks the container and asserts category-section-layout is visible again (the stale closure regression). | `no` (every assertion supports the stale-closure regression claim) | `no action` |

### `tree-view-hierarchy.cy.js`

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `saved component should appear in PB tree view with all structural levels intact` | Builds Container > Row > H1 (with paragraph fallback), saves the component with name "TreeViewTest", asserts save dialog closes. Visits PB, asserts component placeholders exist. If tree-view-toggle is available, opens it, asserts tree-view-panel is visible, and if canvas has components asserts at least one tree-node-* element exists. | `no` (tree-view assertions match the description; the canvas/placeholder existence check is part of the setup-to-PB navigation) | `no action` |
| `component with no styled nodes should still produce a navigable tree view` | Builds Container + Paragraph with no styles applied, saves as "NoStylesTest", navigates to PB, asserts component placeholders exist, opens tree-view if available and asserts panel visible plus tree-node-* presence if canvas has components. | `no` | `no action` |

### `undo-history-floor.cy.js`

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `undo should not go past the initial loaded state (cannot reach empty canvas)` | Drags Container + Paragraph + H1. Presses Ctrl+Z 10 times. Asserts the canvas still contains at least one rendered container. | `no` | `no action` |
| `undo stack should be empty (no further undo available) at the floor state` | Drags Container + Paragraph. Presses Ctrl+Z once. Asserts canvas is visible and at least one container remains. Presses Ctrl+Z again and re-asserts at least one container remains. | `no` | `no action` |
## billing + inlineEditor

### `billing.cy.js` (under `billing/`)

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `should not call console.log with "userLimitsAndUsage" anywhere during billing page load` | Installs a `console.log` spy on page load, then asserts no call argument contains the string `"userLimitsAndUsage"`. | no | Keep as-is. Assertion directly matches description (verifies no `console.log("userLimitsAndUsage")`). |
| `should render the Billing page heading after navigation` | Visits `/billing` and asserts `[data-cy="billing-page-heading"]` is visible. | no | Keep as-is. Single assertion = the description. |
| `should call the getInvoices endpoint and receive a 200 response` | Intercepts `GET **/api/invoices**`, visits `/billing`, waits for heading visible, then if intercept fired asserts statusCode is 200. | YES — also asserts `billing-page-heading` is visible (page-render assertion outside the endpoint-status scope). | Move the heading visibility check into `beforeEach`/setup helper. Keep only the intercept status assertion in this `it()`. |
| `should not receive a 500 error from the invoices endpoint` | Intercepts `GET **/api/invoices**`, visits `/billing`, asserts heading visible, asserts loading spinner gone, then asserts statusCode is not 500. | YES — adds heading-visible + loading-not-exist assertions beyond the "not 500" scope. | Move heading + loading-gone checks to shared setup. Keep only the `not.eq(500)` assertion. |
| `should render invoice rows without crashing when lines.data is empty (null-guard smoke)` | Stubs `getInvoices` with an empty-lines invoice, visits `/billing`, asserts heading visible, asserts `invoices-section` visible, asserts no `toast-error`, and conditionally asserts intercept returned 200. | YES — adds heading-visible and intercept-statusCode assertions in addition to the "no crash" / "renders invoice rows" scope. Heading is setup; 200 assertion duplicates an unrelated test. | Trim to the no-crash assertions only: `invoices-section` visible and `toast-error` not.exist. Drop the heading + status code checks (covered elsewhere). |
| `should render invoice rows with valid period_start/period_end when lines.data has an entry` | Stubs `getInvoices` with a fully-populated invoice, visits `/billing`, asserts heading visible, asserts `invoices-section` visible, asserts no `toast-error`, conditionally asserts statusCode 200. | YES — description promises verification of `period_start`/`period_end` values, but the test never asserts those fields render. Also adds heading + status code assertions outside scope. | Rewrite to assert the rendered DOM contains the `period_start`/`period_end` strings from the stub (e.g. `cy.contains('01/01/2026 - 31/01/2026')`). Remove heading + status code checks. |
| `confirms billing.tsx does not ship console.log calls (static audit doc)` | Logs a string and asserts `true === true`. No real assertion is performed. | YES — description implies a static audit verification, but the body is a no-op. Pure documentation masquerading as a test. | Delete this `it()` (it asserts nothing). Move the static-audit note to a code comment or to the QA report. |

### `inlineEditor.cy.js` (under `inlineEditor/`)

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `should activate editor when clicking a blinkpage tag` | Clicks a blinkpage tag, asserts editor is active. | no | Keep as-is. |
| `should show formatting toolbar when editor is active` | Clicks a blinkpage tag, asserts toolbar is visible. | no | Keep as-is. Note: does not separately re-assert editor active, only toolbar — matches description. |
| `should deactivate editor and save changes when clicking outside` | Clicks tag, asserts editor active, clicks outside, asserts tag still exists, asserts editor inactive. | YES — description says "save changes" but test never asserts any saved content. Also adds an extra `editor-active` check before deactivation (setup-acceptable, but redundant). | Either rename to `should deactivate editor when clicking outside` OR add an actual content-persistence assertion (type+verify) to cover the "save changes" half of the description. |
| `should persist text changes after clicking outside` | Activates editor, asserts active, selects all, types new text, clicks outside, verifies content persisted. | no | Keep as-is. The `verifyEditorIsActive` is acceptable mid-flow guard; final assertion matches the description. |
| `should apply bold formatting via toolbar` | Activates editor, asserts active, selects all, applies bold, asserts bold button active. | no | Keep as-is. Editor-active assertion is a guard, final assertion matches description. |
| `should apply italic formatting via toolbar` | Activates editor, asserts active, selects all, applies italic, asserts italic button active. | no | Keep as-is. |
| `should apply underline formatting via toolbar` | Activates editor, asserts active, selects all, applies underline, asserts underline button active. | no | Keep as-is. |
| `should apply multiple formats in sequence` | Activates editor, selects all, applies bold + italic + underline, asserts all three buttons active. | no | Keep as-is. All three assertions are explicitly named in the description ("multiple formats"). |
| `should not activate editor when Design tab is selected` | Clicks tag, clicks outside, clicks Design tab, clicks tag again, asserts editor inactive. | no | Keep as-is. Description = expected behavior under design tab guard. |
| `should persist edits across different text props sequentially` | Edits tag1, edits tag2, asserts both persisted with their respective content. | no | Keep as-is. Description explicitly covers "sequential" edits. |
| `should handle edit, format, then edit another prop` | Edits + bold-formats tag1, edits tag2, asserts both contents persisted. | YES (minor / ambiguous) — description includes "format" but test does not assert the bold formatting survived on tag1 (only the text content). | Add an assertion that tag1 still carries the bold format after the second edit, OR rename to drop the "format" part of the description. |
| `should undo and redo text changes` | Activates editor, asserts active, types, undoes, asserts text gone, redoes, asserts text back. | no | Keep as-is. Editor-active assertion is a setup guard. |
| `should show toolbar when clicking a non-array (root-level) text element` | Activates editor on first tag, asserts active, asserts toolbar visible. | YES (minor) — adds `verifyEditorIsActive` in addition to toolbar-visible scope. Borderline as a guard, but extra assertion. | Drop the redundant `verifyEditorIsActive` since the toolbar visibility implies activation; or accept as a setup guard. |
| `should show toolbar when clicking a text element inside an array item` | Activates editor on 3rd tag, asserts active, asserts toolbar visible. | YES (minor) — same as above: extra editor-active assertion beyond the toolbar-visible scope. | Same as previous row. |
| `should persist edits on component1 independently from component2` | Asserts at least 2 sections present, edits comp1, asserts comp1 has new text, asserts comp2 does not contain comp1 text. | no | Keep as-is. The "≥2 components" check is a setup precondition; both content assertions tie directly to "independently". |
| `should persist consecutive edits to both components` | Asserts ≥2 components, edits comp1, edits comp2, asserts both have their own values. | no | Keep as-is. |
| `should persist edits on component1 array item independently from component2` | Asserts ≥2 components, edits comp1 array item, asserts new text on comp1, asserts comp2 untouched. | no | Keep as-is. |
| `should handle mixed edits: component1 array item + component2 root string` | Asserts ≥2 components, edits comp1 array item, edits comp2 root, asserts both persisted. | no | Keep as-is. |
| `should edit 2nd array item without affecting 1st` | Captures original 1st-item text, edits 2nd, asserts 2nd changed, asserts 1st unchanged. | no | Keep as-is. Both assertions are exactly what the description promises. |
| `should edit 3rd array item without affecting 1st and 2nd` | Captures originals of 1st and 2nd, edits 3rd, asserts 3rd changed, asserts 1st and 2nd unchanged. | no | Keep as-is. |
| `should handle sequential edits to different array items independently` | Edits 1st array item, edits 2nd array item, asserts both have their own independent values. | no | Keep as-is. |
| `should switch editor between blinkpage tags within the same component` | Activates first tag, asserts active + toolbar visible, clicks second tag, asserts toolbar still visible, asserts editor active. | YES (minor) — asserts toolbar-visible TWICE plus editor-active twice. The pre-switch assertions are guards but go beyond the "switch" scope. | Either rename to include "and keeps toolbar visible", OR drop the pre-switch toolbar/active assertions and keep only the post-switch ones. |
| `should switch editor between blinkpage tags across different components` | Activates tag in comp0, asserts active, clicks tag in comp1, asserts toolbar visible, asserts editor active. | YES (minor) — same pattern: extra editor-active + toolbar assertions before/after the switch beyond the pure "switch" scope. | Same as above. |
| `should save content when switching between blinkpage tags in the same component` | Edits 1st tag, switches to 2nd tag (no explicit save), clicks outside, asserts 1st tag persisted edited content. | no | Keep as-is. Final assertion = the "save content when switching" scope. |

### Totals

- Total audited: 31 `it()` blocks (7 billing + 24 inlineEditor).
- Flagged for scope mismatch (YES): 11 (6 billing + 5 inlineEditor).
  - Billing flagged: 4 endpoint/render tests, 1 documentation-only no-op test, 1 stale-description period_start/_end test.
  - InlineEditor flagged: 1 deactivation-vs-save mismatch, 1 format-but-no-format-assertion, 2 toolbar+editor-active double assertions, 2 switch tests with redundant pre-switch checks (counted as 4 minor flags above; total 5 unique it blocks).
- Ambiguous: 5 (inlineEditor "minor" flags where extra assertions could reasonably be interpreted as setup guards rather than scope creep).
## interactions + effects + videoBackground

### `interactions.cy.js` (under `interactions/`)

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `should display the interaction panel when an element is selected` | Opens interactions panel (setup) and asserts the interaction panel is visible. | `no` | Keep as-is. |
| `should open the interaction popup when clicking add interaction` | Opens panel (setup), clicks add-interaction-btn (assert visible is intermediate setup), then asserts edit-popup is visible. | `no` | Keep as-is. Intermediate `should('be.visible')` on the button is a precondition guard, acceptable. |
| `should allow selecting a trigger type` | Opens panel + popup (setup), then asserts the `interaction-trigger-select` is visible inside the popup. Does NOT actually select a trigger type — name implies an action that is not performed. | `YES — name says "allow selecting" but test only checks visibility, never selects` | Rename to `should display the trigger type select inside the popup`, OR extend the test to actually perform a selection and assert the new value. |
| `should allow selecting an animation` | Opens panel + popup (setup), asserts `interaction-animation-select` is visible. Same pattern: does not perform a selection. | `YES — name implies a selection action; test only asserts visibility` | Rename to `should display the animation select inside the popup`, OR extend to actually choose an animation and assert. |
| `should render playground correctly when interacting with elements` | Asserts playground visible, clicks a `blinkpage-tag`, then re-asserts playground visible. | `no` | Keep as-is. The two visibility checks are bookends of the interaction flow described in the name. |

### `conversion-goal.cy.ts` (under `interactions/`)

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `should show the Conversion Goal section when trigger is click (page-load default)` | Opens panel, adds interaction (setup), asserts `conversion-goal-section` visible, then also asserts the switch defaults to OFF. | `YES — name covers only section visibility; the OFF-default switch state is an extra assertion outside the description` | Either split the default-state assertion into its own `it('should default the conversion switch to OFF')`, OR rename to `should show the Conversion Goal section (off by default) when trigger is page-load`. |
| `should mark interaction as conversion goal when switch is toggled ON` | Opens panel, adds interaction, asserts section visible (precondition), asserts switch starts unchecked (precondition), toggles ON, asserts checked, closes popup, asserts conversion badge appears on row. | `YES — name says "mark as conversion goal"; the badge-appears-in-row assertion is a separate downstream effect outside the toggle action` | Either split badge-visibility into a dedicated `it('should render conversion badge on row after marking')`, OR rename to `should mark interaction as conversion goal and display the badge on its row`. |
| `should clear the first interaction badge when a second interaction is marked as conversion` | Adds first interaction + marks conversion, verifies badge on row 0, adds second interaction, marks conversion, asserts badge absent on row 0 and present on row 1. | `no` | Keep as-is. All assertions directly support the "single enforcement / clear first when second is set" claim. |
| `should clear conversion badge when switch is toggled OFF` | Adds + marks conversion, verifies badge present (precondition), re-opens popup, toggles OFF, asserts switch unchecked, closes, asserts badge gone. | `no` | Keep as-is. All assertions chain toward the "clear badge on toggle OFF" claim. |

### `effects.cy.js` (under `effects/`)

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `should display the effects panel with an add button` | Opens effects panel (setup), asserts panel visible AND add-effect-btn visible. | `no` | Keep as-is — name explicitly says "panel with an add button". |
| `should open the effect picker menu when clicking add` | Clicks add, asserts picker-menu visible, AND asserts all three preset effect items (fadeOut, glass, windowed) are visible inside it. | `YES — name only mentions opening the menu; checking that all three presets are listed is an extra content-of-menu assertion` | Either rename to `should open the effect picker menu with all three presets when clicking add`, OR move the three preset visibility checks into a separate `it('should list fadeOut, glass, and windowed in the picker menu')`. |
| `should add a Fade Out effect from the picker` | Asserts no rows initially (precondition), clicks add, picks fadeOut, asserts `effect-row-fadeOut` is visible and exists. | `no` | Keep as-is. The "no rows initially" check is an acceptable precondition for the add. |
| `should remove an effect when clicking the remove button` | Adds Glass (setup), asserts row visible (precondition), clicks remove, asserts row not.exist, AND asserts add-effect-btn still visible. | `YES — name covers removing one effect; the "add button still visible afterward" assertion is a separate behavior` | Either rename to `should remove an effect and restore the add button`, OR split the add-button check into a dedicated test. |
| `should hide a picker option after the effect is added` | Adds Windowed (setup), asserts row visible (precondition), re-opens picker, asserts picker visible, asserts Windowed option no longer listed. | `no` | Keep as-is. All assertions chain toward the named behavior. |
| `should add multiple effects without errors (bug fix: pre-built class seeding)` | Adds all three effects sequentially, asserting each row appears (intermediate verification of "no error"), then asserts 3 rows total AND that add-effect-btn is no longer present. | `YES — name covers "add multiple without errors"; the trailing assertion that the add button is HIDDEN once all effects are exhausted is a separate UX rule, not a bug-coverage assertion` | Either rename to `should add all three effects without errors and hide the add button when none remain`, OR move the `add-effect-btn not.exist` check into its own `it()`. |
| `should show config button for effects with variables` | Adds Fade Out (setup), asserts row visible (precondition), asserts `effect-config-fadeOut` button visible. | `no` | Keep as-is. |
| `should open the config popover when clicking the gear icon` | Adds Glass (setup), asserts row visible (precondition), clicks config, asserts popover variable labels for blur AND tint are visible. | `YES — name covers opening the popover; asserting BOTH blur and tint labels are individual content checks beyond "popover opens"` | Either rename to `should open the config popover and show blur + tint variable labels for Glass`, OR replace both label assertions with a single popover-visibility assertion (e.g. via a `data-cy="effect-config-popover"`). |

### `videoBackground.cy.js` (under `videoBackground/`)

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `should display an empty URL input when Video tab is selected` | Opens background panel + switches to Video tab (setup), asserts video-bg-panel visible, asserts url-input visible, AND asserts preview does NOT exist. | `YES — name only mentions the empty URL input; asserting the panel container AND the absence of a preview are additional state checks` | Either rename to `should show the empty-URL state (panel + input visible, no preview) on Video tab`, OR split the preview-absence into its own `it()`. |
| `should show video preview and config after entering a URL` | Sets URL (action), asserts preview visible, asserts url-edit input has the URL value, AND asserts playback toggles visible. | `YES — name mentions "preview and config"; "config" is ambiguous and the test conflates THREE distinct outputs (preview, URL value persisted in edit field, toggles)` | Tighten name to `should show preview, URL edit field, and playback toggles after entering a URL`, OR split into separate tests for preview vs. toggles vs. URL persistence. |
| `should remove video when clicking the remove button` | Sets URL (setup), asserts preview visible (precondition), clicks remove, asserts url-input visible again, AND asserts preview does NOT exist. | `no` | Keep as-is. Both post-remove assertions describe the single "remove" reset behavior. |
| `should restore video config after page refresh` | Sets URL (setup), asserts preview (precondition), reloads, re-opens panel, asserts video-bg-panel visible, asserts preview visible, AND asserts url-edit retains the URL value. | `YES — name says "restore video config"; "config" is vague and the test asserts three separate hydration outputs (panel auto-select, preview, URL persistence)` | Rename to `should restore the Video tab, preview, and URL after page refresh`, OR keep as-is if "video config" is project shorthand for that full bundle — confirm with team. |

---

**Summary**

- Total `it()` blocks audited: **16**
- Total flagged for scope mismatch: **9**
- Files audited: 4 (`interactions.cy.js`, `conversion-goal.cy.ts`, `effects.cy.js`, `videoBackground.cy.js`)

**Ambiguous / judgment calls**

- The "preview / config / persistence" naming in `videoBackground.cy.js` uses the word "config" loosely — if that maps to a documented bundle (panel + URL edit + toggles), it is not creep. Otherwise the tests are wider than their names.
- The `should allow selecting a trigger type` / `should allow selecting an animation` pair in `interactions.cy.js` may be intentional smoke tests for the popup; the rename suggestion assumes the action verb in the name should be honored.
- Precondition `should('be.visible')` checks before a click are treated as setup guards, not flags (per the rules).
## system + debug-*

### `logger.cy.js`

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `should expose SystemLogger to the window and allow configuring disabled levels/modules` | Asserts `win.SystemLogger` exists, that `debug` is in `disabledLevels` by default, then calls `enableLevel('debug')`, `disableLevel('info.function')`, `disableModule('DesignTab')` and asserts each set was mutated correctly. All four assertions fall under "configuring disabled levels/modules". | no | Keep as-is. |
| `should not throw errors when invoking semantic logger methods via old info signature` | Spies on `console.info`, instantiates `new SystemLogger('TestModule')`, calls legacy `info('legacy plain log')` and semantic `info.interaction('semantic log')`, then asserts `console.info` was `calledTwice`. The "calledTwice" check verifies behavior (calls reached console), not just absence of throw — but it's the natural way to prove "did not throw silently" so it's adjacent to the description. | YES — description says "not throw errors" but the test additionally asserts console.info was called twice, which is a side-effect/output assertion outside the no-throw scope. | Either rename the `it()` to reflect both promises (e.g. "should not throw and should forward both legacy and semantic info calls to console.info") or drop the `calledTwice` assertion and keep only the no-throw behavior. |

### `mediaUrlValidation.cy.js`

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `should display the playground editor without crashing on load` | Asserts `[data-cy="playground"]` is visible and `[data-cy="header"]` is visible. | no | Keep as-is — both assertions support the "editor loads without crashing" claim. |
| `should reject a non-image URL and show an error notification` | Clicks first section, switches to CONTENT tab (with conditional skip guards), types a non-image URL into `media-url-input`, clicks confirm, then asserts an error toast/notification is visible AND its text matches `/not a direct image\|invalid\|unsupported/i`. | no | Keep as-is — both assertions (error visible + error text) describe the same "reject + show error" promise. |
| `should accept a valid image URL without showing an error` | Selects a section, opens CONTENT tab, types a real image URL, clicks confirm, then asserts `[data-cy="toast-error"]` does not exist. | no | Keep as-is — single assertion matches description. |

### `publishProject.cy.js`

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `should show the publish button in the header toolbar` | Asserts `[data-cy="header"]` visible and `[data-cy="publish-btn"]` visible. The header assertion is a precondition/sanity check, not the headline behavior, but is mild and supports "in the header toolbar". | no | Keep as-is. Header check is reasonable scaffolding for "in the header toolbar". |
| `should disable the publish button when canvas is empty` | Asserts header visible, then asserts publish button is visible AND disabled. | no | Keep as-is — visibility + disabled both align with the disabled-button scope. |
| `should show a tooltip over the disabled publish button explaining why publishing is blocked` | Asserts header visible, hovers parent span of publish-btn, then asserts a tooltip is visible AND its text matches `/component\|empty\|page/i`. | no | Keep as-is — tooltip presence + text both fall under "tooltip explaining why blocked". |
| `should have the publish button enabled when the canvas is not empty` | Asserts header visible, asserts at least one `[data-component-index]` is present, then asserts publish button is not disabled. | YES — the "at least one component-index exists" assertion is a canvas-state precondition assertion, not part of the publish-button-enabled claim. It belongs in setup, not in the test body as an assertion. | Move the component-presence check into `beforeEach` (or a helper) so the test body contains only the publish-button-enabled assertion. Alternatively rename the `it()` to include the precondition (e.g. "given the canvas has components, the publish button should be enabled"). |

### `debug-drag.cy.js`

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `drags Base.Container then Base.Button to container` | Asserts palette items and root drop zone exist/are visible, snapshots initial container count to `/tmp/debug-initial.json`, drags container into root, asserts a rendered container exists, drags button into the container, then writes a final count of containers + buttons to `/tmp/debug-drag-after2.json`. No assertions about the final drag outcome — just file dumps. | N/A — debug script masquerading as a behavior test (no result assertions, only diagnostic file writes). | Move to a `cypress/scratch/` or `cypress/debug/` folder and exclude from CI, OR convert into a real test by asserting the final container/button counts instead of writing JSON dumps. |

### `debug-palette.cy.js`

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `checks what data-cy attributes exist on the blockbuilder page` | Logs into the editor, visits BB URL, waits 5s, enumerates palette items / canvas area / root drop zone and writes their counts + names to `/tmp/palette-debug.json`. No assertions at all. | N/A — debug script, not a behavior test. | Move out of `cypress/e2e/` (e.g. to `cypress/debug/`) and exclude from CI. It is purely a diagnostic dump. |

### `debug-positions.cy.js`

| `it()` name | What it actually does | Scope mismatch? | Recommended action |
|---|---|---|---|
| `checks positions of palette items and canvas elements` | Drags container then button, asserts a rendered container exists after the first drag (only behavior assertion), then enumerates bounding rects of all palette items and canvas buttons, calls `document.elementFromPoint` at the button's top edge, and writes everything to `/tmp/debug-positions.json`. The single `should('exist')` is incidental; the test's purpose is the JSON dump. | N/A — debug script, not a behavior test. | Move out of `cypress/e2e/` (e.g. to `cypress/debug/`) and exclude from CI, OR convert into a real test by asserting the geometric / coverage expectations instead of dumping them. |

---

## Summary

- **Total `it()` blocks audited**: 10
- **Flagged for scope creep (YES)**: 2
  - `logger.cy.js` → `should not throw errors when invoking semantic logger methods via old info signature` (extra `calledTwice` assertion beyond no-throw scope)
  - `publishProject.cy.js` → `should have the publish button enabled when the canvas is not empty` (asserts canvas state in addition to the button-state claim)
- **Marked N/A (debug scripts)**: 3
  - `debug-drag.cy.js`
  - `debug-palette.cy.js`
  - `debug-positions.cy.js`
  - These three are diagnostic file-dumping scripts wrapped in `describe`/`it`; they contain little or no behavior assertion. Recommend relocating outside `cypress/e2e/` and excluding from CI.
- **Ambiguous**:
  - `logger.cy.js` first test — the `disableModule('DesignTab')` assertion could be argued as "module" scope creep on a "levels/modules" description, but the description explicitly mentions "modules" so it is in-scope.
  - `publishProject.cy.js` first test — the `[data-cy="header"]` visibility check is borderline setup-vs-assertion; left as `no` because the description says "in the header toolbar" which the assertion supports.
  - `mediaUrlValidation.cy.js` tests rely heavily on conditional skip branches; not scope creep per se, but the tests can pass-vacuously when selectors are missing — orchestrator may want to harden these separately.
