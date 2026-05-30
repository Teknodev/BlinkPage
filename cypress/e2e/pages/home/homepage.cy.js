import { homePage } from '@pages-po/homePage';

/**
 * Homepage tests for the logged-in dashboard.
 *
 * Auth is performed programmatically via cy.login() in beforeEach — no UI login
 * needed. Pre-auth landing page assertions (header/body/footer) live in their
 * own guest specs.
 *
 * Guest-flow cases live in cypress/e2e/guest/homepage-guest.cy.js.
 * Footer-link redirections live in cypress/e2e/guest/footer-links.cy.js.
 */

describe('Home Page', () => {
  beforeEach(() => {
    // Programmatic auth via centralized cy.login() per orchestrator directive.
    cy.login();
    cy.visit('/');
    cy.get('[data-cy="header"]', { timeout: 20000 }).should('be.visible');
  });

  it('logged-in user sees dashboard with project list or empty state', () => {
    cy.get('[data-cy="project-card"], [data-cy="empty-projects-message"]', { timeout: 15000 }).should('exist');
  });

  it('"Compare Plans" button navigates to /plans', () => {
    cy.get('[data-cy="compare-plans-cta"]').should('be.visible').click();
    cy.url().should('include', '/plans');
  });

  it('project card click navigates to the editor', () => {
    cy.get('[data-cy="project-card"]', { timeout: 15000 }).first().click();
    cy.url({ timeout: 15000 }).should('match', /\/project\/.+\/editor/);
  });

  it('logged-in profile icon click opens profile dropdown', () => {
    cy.get('[data-cy="header-right"] [data-cy="profile-button"]').should('be.visible').click();
    homePage.verifyProfileDropDown();
  });
});
