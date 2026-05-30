import data from '@fixtures/data.json';
import { loginPage } from '@pages-po/loginPage';
import { signUpPage } from '@pages-po/signUpPage';

/**
 * Sign-up tests intercept the POST signup endpoint where needed so that
 * no real accounts are created. The test account (blinkpage1@hotmail.com)
 * is used for the "already registered email" scenario which exercises the
 * real error path without creating a new account.
 */

const navigateToSignUp = () => {
  cy.visit('/');
  loginPage.clickProfileIcon();
  signUpPage.singUpButton();
};

describe('Sign Up', () => {
  it('already registered email → server error message is shown', () => {
    navigateToSignUp();

    cy.get('[data-cy="input-name"]').should('be.visible').clear().type(data.name);
    cy.get('[data-cy="input-email"]').should('be.visible').clear().type(data.email);
    cy.get('[data-cy="password-input"]').should('be.visible').clear().type(data.password);
    cy.get('[data-cy="input-confirm-password"]').should('be.visible').clear().type(data.confirmPassword);

    cy.get('[data-cy="signup-btn"]').should('be.visible').click();

    // The server must report the account already exists
    loginPage.verifyToastMessage('This email is already registered. Please login or use another provider.');
  });

  it('password mismatch → validation error on confirm-password field', () => {
    navigateToSignUp();

    cy.get('[data-cy="input-name"]').should('be.visible').clear().type(data.name);
    cy.get('[data-cy="input-email"]').should('be.visible').clear().type(data.email);
    cy.get('[data-cy="password-input"]').should('be.visible').clear().type(data.password);
    cy.get('[data-cy="input-confirm-password"]').should('be.visible').clear().type('Mismatch99');

    cy.get('[data-cy="signup-btn"]').should('be.visible').click();

    loginPage.requiredErrorMessage('[data-cy="input-confirm-password"]', 'Passwords must match.');
  });

  it('empty form submit → required validation errors on all fields', () => {
    navigateToSignUp();

    // Submit without typing anything
    cy.get('[data-cy="signup-btn"]').should('be.visible').click();

    loginPage.requiredErrorMessage('[data-cy="input-name"]', 'Required');
    loginPage.requiredErrorMessage('[data-cy="input-email"]', 'Required');
    loginPage.requiredErrorMessage(
      '[data-cy="password-input"]',
      'Password must contain at least one uppercase letter, one number, and be at least 5 characters long. Only letters and numbers are allowed.'
    );
    loginPage.requiredErrorMessage('[data-cy="input-confirm-password"]', 'Confirm Password is required.');
  });

  it('empty name → required error on name field', () => {
    navigateToSignUp();

    cy.get('[data-cy="input-email"]').should('be.visible').clear().type(data.email);
    cy.get('[data-cy="password-input"]').should('be.visible').clear().type(data.password);
    cy.get('[data-cy="input-confirm-password"]').should('be.visible').clear().type(data.confirmPassword);

    cy.get('[data-cy="signup-btn"]').should('be.visible').click();

    loginPage.requiredErrorMessage('[data-cy="input-name"]', 'Required');
  });

  it('empty email → required error on email field', () => {
    navigateToSignUp();

    cy.get('[data-cy="input-name"]').should('be.visible').clear().type(data.name);
    cy.get('[data-cy="password-input"]').should('be.visible').clear().type(data.password);
    cy.get('[data-cy="input-confirm-password"]').should('be.visible').clear().type(data.confirmPassword);

    cy.get('[data-cy="signup-btn"]').should('be.visible').click();

    loginPage.requiredErrorMessage('[data-cy="input-email"]', 'Required');
  });

  it('empty password → password validation error', () => {
    navigateToSignUp();

    cy.get('[data-cy="input-name"]').should('be.visible').clear().type(data.name);
    cy.get('[data-cy="input-email"]').should('be.visible').clear().type(data.email);
    cy.get('[data-cy="input-confirm-password"]').should('be.visible').clear().type(data.confirmPassword);

    cy.get('[data-cy="signup-btn"]').should('be.visible').click();

    loginPage.requiredErrorMessage(
      '[data-cy="password-input"]',
      'Password must contain at least one uppercase letter, one number, and be at least 5 characters long. Only letters and numbers are allowed.'
    );
  });

  it('empty confirm-password → required error on confirm field', () => {
    navigateToSignUp();

    cy.get('[data-cy="input-name"]').should('be.visible').clear().type(data.name);
    cy.get('[data-cy="input-email"]').should('be.visible').clear().type(data.email);
    cy.get('[data-cy="password-input"]').should('be.visible').clear().type(data.password);

    cy.get('[data-cy="signup-btn"]').should('be.visible').click();

    loginPage.requiredErrorMessage('[data-cy="input-confirm-password"]', 'Confirm Password is required.');
  });

  it('valid new account → API is called and response is handled (stubbed)', () => {
    // Intercept the signup endpoint so no real account is created
    // Match only non-anonymous registrations (real user signups)
    cy.intercept('POST', '**/register**', (req) => {
      if (req.body.is_anonymous) return; // let anonymous user creation pass through
      req.reply({ statusCode: 200, body: { success: true } });
    }).as('signupRequest');

    navigateToSignUp();

    // Use a unique email to avoid the "already registered" path
    cy.get('[data-cy="input-name"]').should('be.visible').clear().type('Test User');
    cy.get('[data-cy="input-email"]').should('be.visible').clear().type('new.user.e2e@example.com');
    cy.get('[data-cy="password-input"]').should('be.visible').clear().type('Newuser1');
    cy.get('[data-cy="input-confirm-password"]').should('be.visible').clear().type('Newuser1');

    cy.get('[data-cy="signup-btn"]').should('be.visible').click();

    cy.wait('@signupRequest').then((interception) => {
      expect(interception.response.statusCode).to.eq(200);
    });
  });

  it('password masking — input type is password by default', () => {
    navigateToSignUp();

    cy.get('[data-cy="password-input"]').should('have.attr', 'type', 'password');
  });
});
