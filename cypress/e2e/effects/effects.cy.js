import { loginToEditor, addComponent, clearPlayground, resetPlayground } from '../../support/editorTestHelper';

/**
 * Effects E2E Tests
 *
 * Covers the classList-based Effects feature in the Design tab.
 * Effects (Fade Out, Glass, Windowed) are added/removed as shared
 * pre-built CSS classes on component sections.
 *
 * Bug coverage:
 *   - Verifies that adding an effect does NOT produce the
 *     "pre-built class not found in editor" error, which was
 *     caused by addMockClass() + addCssClass(false) creating
 *     duplicate entries without _id assignment.
 */

// ── Helpers ─────────────────────────────────────────────────────

/**
 * Click a component section on the canvas, then switch to the Design tab
 * and scroll to the Effects category section.
 */
const openEffectsPanel = () => {
  // Click the first component section to select it
  cy.get('[data-component-index="0"]', { timeout: 10000 }).click({ force: true });
  cy.wait(500);

  // Switch to the Design tab in the right settings panel
  cy.get('[data-cy="tab-Design"]', { timeout: 5000 }).should('be.visible').click();
  cy.wait(500);

  // The Effects panel should be present inside the Design tab
  cy.get('[data-cy="effects-panel"]', { timeout: 10000 }).should('exist');
};

// ── Adding Effects ──────────────────────────────────────────────

describe('Effects - Add & Remove', () => {
  beforeEach(() => {
    loginToEditor();
    clearPlayground();
    addComponent('hero', 0);
  });

  afterEach(() => {
    resetPlayground();
  });

  it('should display the effects panel with an add button', () => {
    openEffectsPanel();

    cy.get('[data-cy="effects-panel"]').should('be.visible');
    cy.get('[data-cy="add-effect-btn"]').should('be.visible').contains('Add Effect');
  });

  it('should open the effect picker menu when clicking add', () => {
    openEffectsPanel();

    cy.get('[data-cy="add-effect-btn"]').click();
    cy.get('[data-cy="effect-picker-menu"]', { timeout: 5000 }).should('be.visible');

    // All three preset effects should be listed
    cy.get('[data-cy="effect-picker-fadeOut"]').should('be.visible');
    cy.get('[data-cy="effect-picker-glass"]').should('be.visible');
    cy.get('[data-cy="effect-picker-windowed"]').should('be.visible');
  });

  it('should add a Fade Out effect from the picker', () => {
    openEffectsPanel();

    // No effect rows initially
    cy.get('[data-cy^="effect-row-"]').should('not.exist');

    // Add Fade Out
    cy.get('[data-cy="add-effect-btn"]').click();
    cy.get('[data-cy="effect-picker-fadeOut"]').click();

    // Effect row should appear
    cy.get('[data-cy="effect-row-fadeOut"]', { timeout: 5000 }).should('be.visible');
    cy.get('[data-cy="effect-row-fadeOut"]').contains('Fade Out');
  });

  it('should remove an effect when clicking the remove button', () => {
    openEffectsPanel();

    // Add an effect first
    cy.get('[data-cy="add-effect-btn"]').click();
    cy.get('[data-cy="effect-picker-glass"]').click();
    cy.get('[data-cy="effect-row-glass"]', { timeout: 5000 }).should('be.visible');

    // Remove it
    cy.get('[data-cy="effect-remove-glass"]').click();
    cy.get('[data-cy="effect-row-glass"]').should('not.exist');

    // Add button should still be available
    cy.get('[data-cy="add-effect-btn"]').should('be.visible');
  });

  it('should hide a picker option after the effect is added', () => {
    openEffectsPanel();

    // Add Windowed
    cy.get('[data-cy="add-effect-btn"]').click();
    cy.get('[data-cy="effect-picker-windowed"]').click();
    cy.get('[data-cy="effect-row-windowed"]', { timeout: 5000 }).should('be.visible');

    // Open picker again — Windowed should no longer be listed
    cy.get('[data-cy="add-effect-btn"]').click();
    cy.get('[data-cy="effect-picker-menu"]', { timeout: 5000 }).should('be.visible');
    cy.get('[data-cy="effect-picker-windowed"]').should('not.exist');
  });

  it('should add multiple effects without errors (bug fix: pre-built class seeding)', () => {
    openEffectsPanel();

    // Add all three effects sequentially — this used to trigger
    // "pre-built class not found in editor" when addMockClass created
    // duplicates without _id assignment.

    // Add first effect
    cy.get('[data-cy="add-effect-btn"]').click();
    cy.get('[data-cy="effect-picker-fadeOut"]').click();
    cy.get('[data-cy="effect-row-fadeOut"]', { timeout: 5000 }).should('be.visible');

    // Add second effect
    cy.get('[data-cy="add-effect-btn"]').click();
    cy.get('[data-cy="effect-picker-glass"]').click();
    cy.get('[data-cy="effect-row-glass"]', { timeout: 5000 }).should('be.visible');

    // Add third effect
    cy.get('[data-cy="add-effect-btn"]').click();
    cy.get('[data-cy="effect-picker-windowed"]').click();
    cy.get('[data-cy="effect-row-windowed"]', { timeout: 5000 }).should('be.visible');

    // All three should be visible
    cy.get('[data-cy^="effect-row-"]').should('have.length', 3);

    // Add button should be hidden (no more available effects)
    cy.get('[data-cy="add-effect-btn"]').should('not.exist');
  });
});

// ── Configuration ───────────────────────────────────────────────

describe('Effects - Configuration', () => {
  beforeEach(() => {
    loginToEditor();
    clearPlayground();
    addComponent('hero', 0);
  });

  afterEach(() => {
    resetPlayground();
  });

  it('should show config button for effects with variables', () => {
    openEffectsPanel();

    // Add Fade Out (has direction variable)
    cy.get('[data-cy="add-effect-btn"]').click();
    cy.get('[data-cy="effect-picker-fadeOut"]').click();
    cy.get('[data-cy="effect-row-fadeOut"]', { timeout: 5000 }).should('be.visible');

    // Config (gear) button should exist
    cy.get('[data-cy="effect-config-fadeOut"]').should('be.visible');
  });

  it('should open the config popover when clicking the gear icon', () => {
    openEffectsPanel();

    // Add Glass effect (has blur + tint variables)
    cy.get('[data-cy="add-effect-btn"]').click();
    cy.get('[data-cy="effect-picker-glass"]').click();
    cy.get('[data-cy="effect-row-glass"]', { timeout: 5000 }).should('be.visible');

    // Click config
    cy.get('[data-cy="effect-config-glass"]').click();

    // Popover should show variable labels
    cy.contains('Blur', { timeout: 5000 }).should('be.visible');
    cy.contains('Tint').should('be.visible');
  });
});
