import { loginToEditor, addComponent, clearPlayground, resetPlayground } from '../../support/editorTestHelper';
import { interactionsPage } from '../../support/pages/interactionsPage';

/**
 * Interactions E2E Tests
 *
 * All selectors use data-cy attributes exclusively.
 */

describe('Interactions — Adding & Editing', () => {
  beforeEach(() => {
    loginToEditor();
    clearPlayground();
    addComponent('hero', 0);
  });

  afterEach(() => {
    resetPlayground();
  });

  it('should display the interaction panel when an element is selected', () => {
    // Click on a blinkpage element to select it
    cy.get('[data-cy="blinkpage-tag"]', { timeout: 10000 }).first().click({ force: true });
    cy.wait(500);

    // Switch to the Content tab
    cy.get('[data-cy="tab-Content"]', { timeout: 5000 }).should('be.visible').click();
    cy.wait(500);

    // The interaction section should be visible
    cy.get('[data-cy="interaction-panel"]', { timeout: 5000 }).should('exist');
  });

  it('should open the interaction popup when clicking add interaction', () => {
    // Select element
    cy.get('[data-cy="blinkpage-tag"]', { timeout: 10000 }).first().click({ force: true });
    cy.wait(500);

    // Click add interaction button
    cy.get('[data-cy="add-interaction-btn"]', { timeout: 5000 }).should('be.visible').click();
    cy.wait(500);

    // EditPopup should be visible
    cy.get('[data-cy="edit-popup"]', { timeout: 5000 }).should('be.visible');
  });

  it('should allow selecting a trigger type', () => {
    // Select element
    cy.get('[data-cy="blinkpage-tag"]', { timeout: 10000 }).first().click({ force: true });
    cy.wait(500);

    // Open interaction editor
    cy.get('[data-cy="add-interaction-btn"]', { timeout: 5000 }).should('be.visible').click();
    cy.wait(500);

    // The trigger type select should be visible in the popup
    cy.get('[data-cy="edit-popup"]', { timeout: 5000 })
      .should('be.visible')
      .find('[data-cy="interaction-trigger-select"]')
      .should('be.visible');
  });

  it('should allow selecting an animation', () => {
    // Select element
    cy.get('[data-cy="blinkpage-tag"]', { timeout: 10000 }).first().click({ force: true });
    cy.wait(500);

    // Open interaction editor
    cy.get('[data-cy="add-interaction-btn"]', { timeout: 5000 }).should('be.visible').click();
    cy.wait(500);

    // The animation select should be visible
    cy.get('[data-cy="edit-popup"]', { timeout: 5000 })
      .should('be.visible')
      .find('[data-cy="interaction-animation-select"]')
      .should('be.visible');
  });
});

describe('Interactions — Playground Behavior', () => {
  beforeEach(() => {
    loginToEditor();
    clearPlayground();
    addComponent('hero', 0);
  });

  afterEach(() => {
    resetPlayground();
  });

  it('should render playground correctly when interacting with elements', () => {
    // Verify playground
    cy.get('[data-cy="playground"]', { timeout: 5000 }).should('be.visible');

    // Click into an element inside the playground
    cy.get('[data-cy="blinkpage-tag"]', { timeout: 10000 }).first().click({ force: true });
    cy.wait(500);

    // Playground should remain visible
    cy.get('[data-cy="playground"]').should('be.visible');
  });
});
