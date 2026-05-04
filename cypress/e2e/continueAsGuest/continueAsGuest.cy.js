import data from '../../fixtures/data.json';
import { loginPage } from '../../support/pages/loginPage';
import { continueAsGuestPage } from '../../support/pages/continueAsGuest';

/**
 * Guest-user flow tests.
 * Uses the dedicated E2E test account (blinkpage1@hotmail.com) for all login steps.
 * No random emails are created.
 */

describe('Continue as Guest', () => {
  it('guest can proceed without an account — no web head shown', () => {
    cy.visit('/');
    loginPage.verifyLandingBody();

    loginPage.clickProfileIcon();
    continueAsGuestPage.continueAsGuestButton();

    // Guest landing: no project header visible yet
    continueAsGuestPage.assertNoWebHead();
  });

  it('guest clicks login from profile icon → auth page is shown', () => {
    cy.visit('/');
    loginPage.clickProfileIcon();
    continueAsGuestPage.continueAsGuestButton();

    // Click profile icon as an already-guest user
    loginPage.clickProfileIcon();

    cy.url().should('include', '/authentication');
  });

  it('logging in with the test account after guest session → dashboard shown', () => {
    cy.visit('/');
    loginPage.clickProfileIcon();
    continueAsGuestPage.continueAsGuestButton();

    // Navigate to login
    loginPage.clickProfileIcon();
    cy.url().should('include', '/authentication');

    // Log in with the E2E test account
    cy.get('[data-cy="input-email"]', { timeout: 10000 })
      .should('be.visible')
      .clear()
      .type(data.email);
    cy.get('[data-cy="password-input"]', { timeout: 10000 })
      .should('be.visible')
      .clear()
      .type(data.password);
    cy.get('[data-cy="signin-btn"]').should('be.visible').click();

    // Authenticated dashboard must load
    cy.get('[data-cy="header"]', { timeout: 30000 }).should('be.visible');
    cy.url().should('not.include', '/authentication');
  });
});
