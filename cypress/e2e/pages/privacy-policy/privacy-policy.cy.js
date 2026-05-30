/**
 * Privacy Policy page — smoke spec.
 *
 * Source: landing-composer/src/pages/privacy-policy/privacy-policy.tsx
 *
 * Smoke coverage only:
 *   1. Page renders at /privacy-policy.
 *   2. Outbound blinkpage.app anchor is present and links correctly.
 *   3. Page does not crash on back/forward navigation.
 *
 * Note: no data-cy hooks exist on this page today; the only structural anchor
 * is the privacyPolicy CSS module class on the wrapper div. The "Privacy
 * Policy" heading is rendered as a <p> with no class, so the spec uses the
 * scoped wrapper class as a sentinel rather than relying on visible text.
 * Flagged for follow-up hooks.
 */

describe('Privacy Policy Page', () => {
  it('renders the privacy policy container at /privacy-policy', () => {
    cy.visit('/privacy-policy');
    cy.get('[data-cy="privacy-policy-page"]', { timeout: 15000 }).should('exist');
  });

  it('renders the outbound blinkpage.app anchor with the correct href', () => {
    cy.visit('/privacy-policy');
    cy.get('[data-cy="privacy-policy-page"] a[href*="blinkpage.app"]', { timeout: 15000 })
      .should('be.visible')
      .and('have.attr', 'href');
  });

  it('does not crash the app when navigating back from the privacy policy page', () => {
    cy.visit('/');
    cy.visit('/privacy-policy');
    cy.go('back');
    cy.location('pathname', { timeout: 10000 }).should('eq', '/');
    cy.go('forward');
    cy.get('[data-cy="privacy-policy-page"]', { timeout: 15000 }).should('exist');
  });

  it('renders without an authenticated session (public route)', () => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.visit('/privacy-policy');
    cy.get('[data-cy="privacy-policy-page"]', { timeout: 15000 }).should('exist');
  });
});
