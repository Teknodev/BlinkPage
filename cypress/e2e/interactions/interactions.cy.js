import { loginToEditor, addComponent, clearPlayground, resetPlayground } from '../../support/editorTestHelper';

/**
 * Interactions E2E Tests
 *
 * All selectors use data-cy attributes exclusively.
 *
 * Note: The interaction-panel (InteractionList) lives in the INTERACTIONS tab
 * of ComponentSettingsPanel, and requires selectedSection to be set.
 * selectedSection is set by clicking a child element inside the section
 * while the DESIGN or INTERACTIONS tab is active (traverseDomAndSetSection).
 */

/**
 * Helper: select a section element while on the INTERACTIONS tab so that
 * currentSection (selectedSection) gets populated.
 */
const openInteractionsPanel = () => {
  // Click the section to set editingElement
  cy.get('[data-component-index="0"]', { timeout: 10000 }).click({ force: true });
  cy.wait(500);

  // Switch to INTERACTIONS tab
  cy.get('[data-cy="tab-INTERACTIONS"]', { timeout: 5000 }).should('be.visible').click();
  cy.wait(500);

  // Click a blinkpage-tag inside the section to trigger setSelectedSection.
  // traverseDomAndSetSection() fires on mousedown when DESIGN/INTERACTIONS tab is active.
  cy.get('[data-component-index="0"]').within(() => {
    cy.get('[data-cy="blinkpage-tag"]').first().click({ force: true });
  });
  cy.wait(500);

  // The interaction panel should be visible
  cy.get('[data-cy="interaction-panel"]', { timeout: 10000 }).should('exist');
};

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
    openInteractionsPanel();
    cy.get('[data-cy="interaction-panel"]').should('be.visible');
  });

  it('should open the interaction popup when clicking add interaction', () => {
    openInteractionsPanel();

    // Click add interaction button
    cy.get('[data-cy="add-interaction-btn"]', { timeout: 5000 }).should('be.visible').click();
    cy.wait(500);

    // EditPopup should be visible
    cy.get('[data-cy="edit-popup"]', { timeout: 5000 }).should('be.visible');
  });

  it('should allow selecting a trigger type', () => {
    openInteractionsPanel();

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
    openInteractionsPanel();

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
