import data from '../../fixtures/data.json';
import { loginPage } from '../../support/pages/loginPage';
import { homePage } from '../../support/pages/homePage';
import { continueAsGuestPage } from '../../support/pages/continueAsGuest';

/**
 * Homepage tests use the E2E test account from fixtures/data.json.
 * No hardcoded credentials — all auth goes through the shared account.
 */

const loginWithTestAccount = () => {
  loginPage.clickProfileIcon();
  cy.get('[data-cy="input-email"]').should('be.visible').clear().type(data.email);
  cy.get('[data-cy="password-input"]').should('be.visible').clear().type(data.password);
  cy.get('[data-cy="signin-btn"]').should('be.visible').click();
  cy.get('[data-cy="header"]', { timeout: 20000 }).should('be.visible');
};

describe('Home Page', () => {
  beforeEach(() => {
    cy.visit('/');
    loginPage.verifyHeader();
    loginPage.verifyLandingBody();
    loginPage.verifyFooter();
  });

  it('logged-in user sees dashboard with project list or empty state', () => {
    loginWithTestAccount();

    // After login user should see the authenticated dashboard
    cy.get('[data-cy="header"]').should('be.visible');
    // Wait for either a project card or an empty-state message to appear
    cy.get('[data-cy="project-card"], [data-cy="empty-projects-message"]', { timeout: 15000 }).should('exist');
    cy.get('body').then(($body) => {
      const hasProjects = $body.find('[data-cy="project-card"]').length > 0;
      const hasEmpty = $body.find('[data-cy="empty-projects-message"]').length > 0;
      expect(hasProjects || hasEmpty, 'dashboard must show projects or empty state').to.be.true;
    });
  });

  it('"Compare Plans" button navigates to /plans', () => {
    loginWithTestAccount();

    cy.contains('Compare Plans').should('be.visible').click();
    cy.url().should('include', '/plans');
  });

  it('project card click navigates to the editor', () => {
    loginWithTestAccount();

    cy.get('body').then(($body) => {
      if ($body.find('[data-cy="project-card"]').length === 0) {
        cy.log('No project cards found — skipping editor navigation test');
        return;
      }
      cy.get('[data-cy="project-card"]').first().click();
      cy.url({ timeout: 15000 }).should('match', /\/project\/.+\/editor/);
    });
  });

  it('footer links redirect to correct pages', () => {
    loginPage.verifyFooterRedirections();
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

  it('logged-in profile icon click opens profile dropdown', () => {
    loginWithTestAccount();

    cy.get('[data-cy="header-right"] [data-cy="profile-button"]').should('be.visible').click();
    homePage.verifyProfileDropDown();
  });
});
