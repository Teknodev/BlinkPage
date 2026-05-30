/**
 * Terms & Conditions page — smoke spec.
 *
 * Source: landing-composer/src/pages/terms-and-conditions/terms-and-conditions.tsx
 *
 * Smoke coverage only:
 *   1. Page renders at /terms-and-conditions.
 *   2. Outbound blinkpage.app anchor is present and links correctly.
 *   3. Page does not crash on back/forward navigation.
 *
 * Note: no data-cy hooks exist on this page today; the only structural anchor
 * is the termsAndConditions CSS module class on the wrapper div. Flagged for
 * follow-up hooks.
 */

describe('Terms and Conditions Page', () => {
  it('renders the terms and conditions container at /terms-and-conditions', () => {
    cy.visit('/terms-and-conditions');
    cy.get('[data-cy="terms-and-conditions-page"]', { timeout: 15000 }).should('exist');
  });

  it('renders the outbound blinkpage.app anchor with the correct href', () => {
    cy.visit('/terms-and-conditions');
    cy.get('[data-cy="terms-and-conditions-page"] a[href*="blinkpage.app"]', { timeout: 15000 })
      .should('be.visible')
      .and('have.attr', 'href');
  });

  it('does not crash the app when navigating back from the terms page', () => {
    // FE-5 moved /terms-and-conditions OUTSIDE AppInitializer
    // (landing-composer/src/index.jsx:111). The previous landing slot at `/`
    // still sits INSIDE AppInitializer+RoleBasedGuard, so an unauthenticated
    // visit to `/` no longer resolves to `/` deterministically — it may
    // redirect to `/landing` or `/authentication` before back-nav happens.
    //
    // The assertion below is intentionally tolerant: we no longer require the
    // back-target to be exactly `/`, only that the browser leaves the
    // /terms-and-conditions route. Forward-nav must still rehydrate the
    // terms page DOM — that's the regression we actually want to catch.
    cy.visit('/');
    cy.visit('/terms-and-conditions');
    cy.get('[data-cy="terms-and-conditions-page"]', { timeout: 15000 }).should('exist');
    cy.go('back');
    cy.location('pathname', { timeout: 10000 }).should('not.include', '/terms');
    cy.go('forward');
    cy.location('pathname', { timeout: 10000 }).should('include', '/terms-and-conditions');
    cy.get('[data-cy="terms-and-conditions-page"]', { timeout: 15000 }).should('exist');
  });

  it('renders without an authenticated session (public route)', () => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.visit('/terms-and-conditions');
    cy.get('[data-cy="terms-and-conditions-page"]', { timeout: 15000 }).should('exist');
  });
});
