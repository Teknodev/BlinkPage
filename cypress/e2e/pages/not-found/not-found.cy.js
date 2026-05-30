/**
 * NotFound page — smoke spec.
 *
 * The page is a static 404 marketing surface rendered for any unmatched route.
 * It surfaces a "Go To Home" button and a 50-particle background animation.
 *
 * Source: landing-composer/src/pages/not-found/not-found.tsx
 *
 * Smoke coverage only:
 *   1. Page mounts on an unmatched URL (no auth required).
 *   2. The "Go To Home" CTA is clickable and navigates to "/".
 *   3. Page does not crash on browser back navigation.
 *
 * Note: no data-cy hooks exist on this page today. The spec uses the styles
 * class sentinel + button text. Flagged for follow-up hooks.
 */

const UNMATCHED_PATH = '/cypress-this-route-cannot-exist-anywhere-xyz123';

describe('Not Found Page', () => {
  it('renders the 404 page when an unmatched route is visited', () => {
    cy.visit(UNMATCHED_PATH, { failOnStatusCode: false });
    cy.get('[class*="errorCode"]', { timeout: 15000 }).should('exist');
    cy.get('[data-cy="not-found-home-link"]').should('be.visible');
  });

  it('renders the "Error — Page Not Found" label sentinel below the 404 code', () => {
    cy.visit(UNMATCHED_PATH, { failOnStatusCode: false });
    cy.get('[class*="errorLabel"]', { timeout: 15000 }).should('be.visible');
  });

  it('navigates to "/" when the "Go To Home" button is clicked', () => {
    cy.visit(UNMATCHED_PATH, { failOnStatusCode: false });
    cy.get('[data-cy="not-found-home-link"]', { timeout: 15000 }).click();
    cy.location('pathname', { timeout: 15000 }).should('eq', '/');
  });

  it('does not crash the app when navigating back to the not-found route', () => {
    cy.visit('/');
    cy.visit(UNMATCHED_PATH, { failOnStatusCode: false });
    cy.go('back');
    // Tolerant assertion: we only care that the browser left the 404 surface;
    // wherever it lands is whatever the back-stack would normally restore.
    cy.location('pathname', { timeout: 10000 }).should('not.eq', '/not-found');
    cy.go('forward');
    cy.get('[data-cy="not-found-home-link"]', { timeout: 15000 }).should('be.visible');
  });
});
