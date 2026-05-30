import { loginPage } from '@pages-po/loginPage';
import { continueAsGuestPage } from '@pages-po/continueAsGuest';

/**
 * Guest-flow tests extracted from homePage/homepage.cy.js.
 * These intentionally do NOT call cy.login() — the assertions depend on a
 * non-authenticated starting state (profile icon → login form, continue as
 * guest → /authentication URL).
 */

describe('Homepage — Guest', () => {
  beforeEach(() => {
    cy.visit('/');
    loginPage.verifyHeader();
    loginPage.verifyLandingBody();
    loginPage.verifyFooter();
  });

  it('profile icon as guest opens login form', () => {
    loginPage.clickProfileIcon();
    // The login form must appear
    cy.get('[data-cy="input-email"]').should('be.visible');
    cy.get('[data-cy="password-input"]').should('be.visible');
  });

  it('continue as guest → clicking profile icon shows auth page URL', () => {
    loginPage.clickProfileIcon();
    continueAsGuestPage.continueAsGuestButton();

    // Clicking profile icon as guest should push to authentication
    loginPage.clickProfileIcon();
    cy.url().should('include', '/authentication');
  });
});
