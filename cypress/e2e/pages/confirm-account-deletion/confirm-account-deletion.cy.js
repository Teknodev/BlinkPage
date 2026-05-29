/**
 * ConfirmAccountDeletion page — full audit Cypress spec.
 *
 * The page mounts at /confirm-account-deletion?uuid=<uuid>, calls
 * functionService.confirmAccountDeletion(uuid):
 *   - success → success toast → userContext.logOut() → navigate to /authentication
 *   - failure → error toast → navigate to /authentication
 *   - no uuid → error toast → navigate to /authentication immediately
 *
 * The component returns null, so this spec asserts only on side-effects
 * (network call, URL changes) since no visible DOM is rendered for it.
 *
 * Source: landing-composer/src/pages/confirm-account-deletion/ConfirmAccountDeletion.tsx
 *
 * Note: no data-cy hooks exist on this page (none possible — null render).
 * The spec uses cy.login() in beforeEach because the page reads UserContext
 * and triggers logOut on success. Behaviour also verifies the token gets
 * cleared from localStorage on the success path.
 */

// FE source: landing-composer/src/classes/Function.ts:652
//   confirmAccountDeletion(uuid) -> apiUtils.apiService.get(`/confirm-account-deletion`, { uuid })
// Resulting URL: <VITE_API_URL>/fn-execute/confirm-account-deletion?uuid=...
// Method: GET (not POST).
const CONFIRM_API = '**/fn-execute/confirm-account-deletion*';

describe('Confirm Account Deletion Page', () => {
  beforeEach(() => {
    cy.login();
  });

  it('redirects to /authentication immediately when no uuid query param is present', () => {
    cy.visit('/confirm-account-deletion');
    cy.url({ timeout: 10000 }).should('include', '/authentication');
  });

  it('hits the confirmAccountDeletion endpoint with the uuid from the URL', () => {
    cy.intercept('GET', CONFIRM_API, {
      statusCode: 200,
      body: { success: true },
    }).as('confirmHit');

    cy.visit('/confirm-account-deletion?uuid=cypress-delete-uuid');

    cy.wait('@confirmHit', { timeout: 15000 }).then((interception) => {
      const url = interception.request.url || '';
      expect(url).to.include('cypress-delete-uuid');
    });
  });

  it('logs the user out and redirects to /authentication on success', () => {
    cy.intercept('GET', CONFIRM_API, {
      statusCode: 200,
      body: { success: true },
    }).as('confirmOk');

    cy.visit('/confirm-account-deletion?uuid=cypress-delete-uuid-ok');

    cy.wait('@confirmOk', { timeout: 15000 });
    cy.url({ timeout: 15000 }).should('include', '/authentication');
    cy.window({ log: false }).then((win) => {
      const token = win.localStorage.getItem('token');
      // logOut clears the token (or sets the anonymous flag). Either signals success.
      const isAnonim = win.localStorage.getItem('isAnonim');
      expect(!token || isAnonim === 'true').to.eq(true);
    });
  });

  it('redirects back to /authentication when the backend returns an error', () => {
    cy.intercept('GET', CONFIRM_API, {
      statusCode: 400,
      body: { message: 'Invalid or expired confirmation link.' },
    }).as('confirmFail');

    cy.visit('/confirm-account-deletion?uuid=cypress-delete-uuid-bad');

    cy.wait('@confirmFail', { timeout: 15000 });
    cy.url({ timeout: 15000 }).should('include', '/authentication');
  });
});
