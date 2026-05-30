import { loginPage } from '@pages-po/loginPage';

/**
 * Footer-link redirection tests.
 *
 * Footer links are present on the pre-auth landing page and do not require an
 * authenticated session, so this spec deliberately skips cy.login().
 */

describe('Footer Links — Guest', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('[data-cy="footer-logo"]', { timeout: 20000 }).should('be.visible');
  });

  it('footer links redirect to correct pages', () => {
    loginPage.verifyFooterRedirections();
  });
});
