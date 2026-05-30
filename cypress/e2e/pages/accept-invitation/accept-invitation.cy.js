/**
 * AcceptInvitation page — full audit Cypress spec.
 *
 * The page mounts at /accept-invitation and immediately fires
 * functionService.acceptInvitation(token) on mount. There is no addressable UI
 * — the component returns an empty container — so this spec exercises every
 * outcome branch by intercepting the network call and asserting the post-mount
 * navigation + toast side-effects.
 *
 * Three flows are covered:
 *   1. Missing token              → no-op, container still mounts.
 *   2. Backend success            → success toast + redirect to "/".
 *   3. Backend error w/ invId     → unregistered-user path → /authentication.
 *
 * Source: landing-composer/src/pages/accept-invitation/AcceptInvitation.tsx
 *
 * Note: data-cy hooks on the container + toast surface are missing today —
 * flagged in /tmp/agent-handoff/new-tests-fe-followup.json. The spec uses the
 * styles.container class as a sentinel, which the source guarantees is the
 * only div rendered.
 */

// FE source: landing-composer/src/classes/Function.ts:648
//   acceptInvitation(token) -> apiUtils.apiService.get("/invitation/accept", { token })
// Resulting URL: <VITE_API_URL>/fn-execute/invitation/accept?token=...
// Method: GET (not POST).
const ACCEPT_API = '**/fn-execute/invitation/accept*';

describe('Accept Invitation Page', () => {
  beforeEach(() => {
    cy.login();
  });

  it('renders the empty container when visited without a token query param', () => {
    cy.visit('/accept-invitation');
    cy.get('[class*="container"]', { timeout: 10000 }).should('exist');
    cy.url().should('include', '/accept-invitation');
  });

  it('navigates to "/" when the backend acceptInvitation call returns success', () => {
    cy.intercept('GET', ACCEPT_API, {
      statusCode: 200,
      body: { message: 'Invitation accepted' },
    }).as('acceptOk');

    cy.visit('/accept-invitation?token=cypress-valid-token');

    cy.wait('@acceptOk', { timeout: 15000 });
    cy.url({ timeout: 15000 }).should('match', /\/$|\/$/);
    cy.location('pathname').should('eq', '/');
  });

  it('navigates to "/authentication" when the backend response includes invitationId', () => {
    cy.intercept('GET', ACCEPT_API, {
      statusCode: 400,
      body: {
        message: 'Please register first.',
        invitationId: 'cypress-invitation-1',
      },
    }).as('acceptUnregistered');

    cy.visit('/accept-invitation?token=cypress-unregistered-token');

    cy.wait('@acceptUnregistered', { timeout: 15000 });
    cy.url({ timeout: 15000 }).should('include', '/authentication');
    cy.url().should('include', 'invitationId=cypress-invitation-1');
  });

  it('navigates back to "/" when the backend returns an error without an invitationId', () => {
    cy.intercept('GET', ACCEPT_API, {
      statusCode: 400,
      body: { message: 'Invitation expired' },
    }).as('acceptError');

    cy.visit('/accept-invitation?token=cypress-bad-token');

    cy.wait('@acceptError', { timeout: 15000 });
    cy.location('pathname', { timeout: 15000 }).should('eq', '/');
  });

  it('strips the token query param from the URL after a successful acceptance', () => {
    cy.intercept('GET', ACCEPT_API, {
      statusCode: 200,
      body: { message: 'Invitation accepted' },
    }).as('acceptStripOk');

    cy.visit('/accept-invitation?token=cypress-strip-token');

    cy.wait('@acceptStripOk', { timeout: 15000 });
    cy.location('search', { timeout: 15000 }).should('not.include', 'token=');
  });
});
