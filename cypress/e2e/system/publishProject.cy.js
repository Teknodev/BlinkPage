import { loginToEditor, clearPlayground, resetPlayground } from '../../support/editorTestHelper';

/**
 * Publish Project E2E Tests
 *
 * Validates publishing-gate behaviour:
 *   - Publish button is visible in the header.
 *   - Publish button is disabled and shows a tooltip when the canvas is empty.
 *   - Publish button is enabled once at least one component is present.
 *
 * All selectors use [data-cy] attributes.
 */

describe('Publish Project — Empty canvas gate', () => {
  beforeEach(() => {
    loginToEditor();
    clearPlayground();
  });

  afterEach(() => {
    resetPlayground();
  });

  it('should show the publish button in the header toolbar', () => {
    cy.get('[data-cy="header"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-cy="publish-btn"]').should('be.visible');
  });

  it('should disable the publish button when canvas is empty', () => {
    cy.get('[data-cy="header"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-cy="publish-btn"]').should('be.visible').and('be.disabled');
  });

  it('should show a tooltip over the disabled publish button explaining why publishing is blocked', () => {
    cy.get('[data-cy="header"]', { timeout: 15000 }).should('be.visible');

    // MUI wraps disabled buttons in a span for tooltip targeting
    cy.get('[data-cy="publish-btn"]')
      .parent()
      .trigger('mouseover', { force: true });

    cy.get('.MuiTooltip-tooltip, [role="tooltip"]', { timeout: 5000 })
      .should('be.visible')
      .invoke('text')
      .should('match', /component|empty|page/i);
  });
});

describe('Publish Project — Canvas has components', () => {
  beforeEach(() => {
    loginToEditor();
    // Leave whatever components are already on the canvas — do not clear
  });

  afterEach(() => {
    resetPlayground();
  });

  it('should have the publish button enabled when the canvas is not empty', () => {
    cy.get('[data-cy="header"]', { timeout: 15000 }).should('be.visible');

    // Ensure at least one component section is present
    cy.get('[data-component-index]', { timeout: 10000 }).should('have.length.at.least', 1);

    cy.get('[data-cy="publish-btn"]').should('not.be.disabled');
  });
});
