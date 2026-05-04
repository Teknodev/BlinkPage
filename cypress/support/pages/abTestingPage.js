/**
 * Page object for AB Testing flow builder.
 *
 * All selectors use data-cy attributes exclusively.
 *
 * Navigation path to reach the AB testing panel:
 *   1. Click the page title dropdown (opens the page list menu)
 *   2. Hover over the first page row to reveal action icons
 *   3. Click [data-cy="ab-testing-panel-btn"] (the settings gear icon)
 *   4. The PageSettingsModal opens at the 'main' view
 *   5. The AB testing section ([data-cy="ab-testing-section"]) is visible on the main view
 *   6. If the account has AB testing entitlement: "Create Your First A/B Test" leads to the flow builder
 *   7. If not: "Upgrade" message is shown
 *
 * For flow-builder tests, the subscription must be stubbed via cy.intercept before loginToEditor.
 */
export const abTestingPage = {
  // ─── Navigation ──────────────────────────────────────────────────

  /**
   * Open the AB testing panel from the editor.
   * - Opens the page dropdown
   * - Clicks the settings gear icon ([data-cy="ab-testing-panel-btn"]) on the first page
   * - Waits for the PageSettingsModal to render with the AB testing section
   */
  openAbTestingPanel() {
    // Open the page dropdown by clicking the current page title
    cy.get('[data-cy="header"]').within(() => {
      // The page selector is the clickable slug/title in the left section
      cy.get('[class*="currentSlug"]').first().click({ force: true });
    });

    // Wait for the page list menu to appear
    cy.get('[data-cy="ab-testing-panel-btn"]', { timeout: 10000 })
      .first()
      .should('be.visible')
      .click({ force: true });

    // Wait for PageSettingsModal to open and render the AB testing section
    cy.get('[data-cy="ab-testing-section"]', { timeout: 10000 }).should('exist');

    cy.wait(500);
  },

  /**
   * Verify the flow builder canvas is rendered.
   * Only works after navigating into the AB testing flow builder view.
   */
  verifyFlowBuilderVisible() {
    cy.get('[data-cy="ab-flow-canvas"]', { timeout: 10000 }).should('be.visible');
  },

  // ─── Variant Management ──────────────────────────────────────────

  /**
   * Click the "Add Variant" button to create a new variant.
   */
  createVariant() {
    cy.get('[data-cy="ab-add-variant-btn"]', { timeout: 5000 })
      .should('be.visible')
      .click();
    cy.wait(500);
  },

  /**
   * Verify a variant node with the given label exists in the flow.
   */
  verifyVariantNodeExists(label) {
    cy.get('[data-cy="ab-variant-node"]', { timeout: 5000 })
      .should('exist')
      .contains(label)
      .should('be.visible');
  },

  /**
   * Get the count of variant nodes in the flow.
   */
  verifyVariantNodeCount(count) {
    cy.get('[data-cy="ab-variant-node"]', { timeout: 5000 })
      .should('have.length', count);
  },

  // ─── Flow Nodes ──────────────────────────────────────────────────

  /**
   * Verify the page node exists.
   */
  verifyPageNodeExists() {
    cy.get('[data-cy="ab-page-node"]', { timeout: 5000 })
      .should('exist')
      .and('be.visible');
  },

  /**
   * Get the total count of edges in the flow.
   */
  verifyEdgeCount(count) {
    cy.get('[data-cy="ab-flow-canvas"]').find('.react-flow__edge', { timeout: 5000 })
      .should('have.length', count);
  },

  /**
   * Verify a condition node with the given type exists.
   * @param {string} conditionType - e.g., 'country', 'device', 'browser'
   */
  verifyConditionNodeExists(conditionType) {
    cy.get('[data-cy="ab-condition-node"]', { timeout: 5000 })
      .should('exist')
      .contains(new RegExp(conditionType, 'i'))
      .should('be.visible');
  },

  /**
   * Verify weight nodes exist in the flow.
   */
  verifyWeightNodeCount(count) {
    cy.get('[data-cy="ab-weight-node"]', { timeout: 5000 })
      .should('have.length', count);
  },

  // ─── Save & Status ───────────────────────────────────────────────

  /**
   * Click the Save button to persist AB test configuration.
   */
  saveAbTest() {
    cy.get('[data-cy="ab-save-btn"]', { timeout: 5000 })
      .should('be.visible')
      .click();
    cy.wait(2000);
  },

  /**
   * Verify the success toast appears.
   */
  verifySaveSuccess() {
    cy.get('[data-cy="toast-success"]', { timeout: 10000 })
      .should('be.visible');
  },

  /**
   * Verify the error toast appears with a given message.
   */
  verifySaveError(message) {
    cy.get('[data-cy="toast-error"]', { timeout: 10000 })
      .should('be.visible')
      .and('contain.text', message);
  },

  // ─── Flow Interaction ────────────────────────────────────────────

  /**
   * Click on a specific variant node by label to select it.
   */
  clickVariantNode(label) {
    cy.get('[data-cy="ab-variant-node"]')
      .contains(label)
      .closest('[data-cy="ab-variant-node"]')
      .click({ force: true });
    cy.wait(300);
  },

  /**
   * Click on the page node to select it.
   */
  clickPageNode() {
    cy.get('[data-cy="ab-page-node"]')
      .first()
      .click({ force: true });
    cy.wait(300);
  },
};
