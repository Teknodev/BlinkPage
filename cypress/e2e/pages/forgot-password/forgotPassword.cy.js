import { forgotPasswordModal } from '@support/common';
import { loginPage } from '@pages-po/loginPage';
import data from '@fixtures/data.json';

describe('Forgot Password', () => {
  beforeEach(() => {
    cy.visit('/');
    loginPage.verifyLandingBody();
    loginPage.clickProfileIcon();
    loginPage.forgotPasswordButton();
  });

  it('registered email → success confirmation message is shown', () => {
    // Use the dedicated E2E test account
    forgotPasswordModal(data.email);

    loginPage.verifyToastMessage(
      'We send a recovery mail. Please follow the instructions to recover your password.'
    );
  });

  it('unregistered email → server error message is shown', () => {
    forgotPasswordModal('nobody.e2e.test@example.com');

    loginPage.verifyToastMessage('Email not found');
  });

  it('invalid email format → validation error shown before submit', () => {
    // Type an invalid email and attempt recovery
    cy.get('[data-cy="forgot-password-page"]', { timeout: 5000 }).should('be.visible');
    cy.get('[data-cy="input-forgot-email"]').should('be.visible').type('notvalid.com');
    cy.get('[data-cy="forgot-password-submit-btn"]').should('be.visible').click();

    // The form should show a validation error — no toast expected
    cy.get('[data-cy="forgot-password-error"]').should('be.visible');
  });
});
