/**
 * Page object for AB Testing flow builder.
 *
 * Uses ReactFlow data attributes and component class names as selectors.
 * The AB testing panel is accessed via the sidebar in the editor.
 */
export const abTestingPage = {
  // ─── Navigation ──────────────────────────────────────────────────

  /**
   * Open the AB testing panel from the editor sidebar.
   * Assumes the user is already logged in and on the editor page.
   */
  openAbTestingPanel() {
    cy.contains('A/B Testing', { timeout: 10000 }).should('be.visible').click();
    cy.wait(1000);
  },

  /**
   * Verify the flow builder canvas is rendered.
   */
  verifyFlowBuilderVisible() {
    cy.get('.react-flow', { timeout: 10000 }).should('be.visible');
  },

  // ─── Variant Management ──────────────────────────────────────────

  /**
   * Click the "Add Variant" button to create a new variant.
   */
  createVariant() {
    cy.contains('button', /add variant/i, { timeout: 5000 })
      .should('be.visible')
      .click();
    cy.wait(500);
  },

  /**
   * Verify a variant node with the given label exists in the flow.
   */
  verifyVariantNodeExists(label) {
    cy.get('.react-flow__node-variantNode', { timeout: 5000 })
      .should('exist')
      .contains(label)
      .should('be.visible');
  },

  /**
   * Get the count of variant nodes in the flow.
   */
  verifyVariantNodeCount(count) {
    cy.get('.react-flow__node-variantNode', { timeout: 5000 })
      .should('have.length', count);
  },

  // ─── Flow Nodes ──────────────────────────────────────────────────

  /**
   * Verify the page node exists.
   */
  verifyPageNodeExists() {
    cy.get('.react-flow__node-pageNode', { timeout: 5000 })
      .should('exist')
      .and('be.visible');
  },

  /**
   * Get the total count of edges in the flow.
   */
  verifyEdgeCount(count) {
    cy.get('.react-flow__edge', { timeout: 5000 })
      .should('have.length', count);
  },

  /**
   * Verify a condition node with the given type exists.
   * @param {string} conditionType - e.g., 'country', 'device', 'browser'
   */
  verifyConditionNodeExists(conditionType) {
    cy.get('.react-flow__node-conditionNode', { timeout: 5000 })
      .should('exist')
      .contains(new RegExp(conditionType, 'i'))
      .should('be.visible');
  },

  /**
   * Verify weight nodes exist in the flow.
   */
  verifyWeightNodeCount(count) {
    cy.get('.react-flow__node-weightNode', { timeout: 5000 })
      .should('have.length', count);
  },

  // ─── Save & Status ───────────────────────────────────────────────

  /**
   * Click the Save button to persist AB test configuration.
   */
  saveAbTest() {
    cy.contains('button', /save/i, { timeout: 5000 })
      .should('be.visible')
      .click();
    cy.wait(2000);
  },

  /**
   * Verify the success toast appears.
   */
  verifySaveSuccess() {
    cy.get('[role="alert"].Toastify__toast--success', { timeout: 10000 })
      .should('be.visible');
  },

  /**
   * Verify the error toast appears with a given message.
   */
  verifySaveError(message) {
    cy.get('[role="alert"].Toastify__toast--error', { timeout: 10000 })
      .should('be.visible')
      .and('contain.text', message);
  },

  // ─── Flow Interaction ────────────────────────────────────────────

  /**
   * Click on a specific variant node by label to select it.
   */
  clickVariantNode(label) {
    cy.get('.react-flow__node-variantNode')
      .contains(label)
      .closest('.react-flow__node')
      .click({ force: true });
    cy.wait(300);
  },

  /**
   * Click on the page node to select it.
   */
  clickPageNode() {
    cy.get('.react-flow__node-pageNode')
      .first()
      .click({ force: true });
    cy.wait(300);
  },
};
