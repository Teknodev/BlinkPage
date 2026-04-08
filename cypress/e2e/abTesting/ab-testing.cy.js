import { loginToEditor } from '../../support/editorTestHelper';
import { abTestingPage } from '../../support/pages/abTestingPage';

// ─────────────────────────────────────────────────────────────────────────────

describe('A/B Testing — Flow Builder', () => {
  beforeEach(() => {
    loginToEditor();
    abTestingPage.openAbTestingPanel();
  });

  // ── Flow Builder Rendering ───────────────────────────────────────

  describe('Flow Builder Rendering', () => {
    it('should render the flow builder canvas', () => {
      abTestingPage.verifyFlowBuilderVisible();
    });

    it('should display the page node', () => {
      abTestingPage.verifyPageNodeExists();
    });

    it('should display at least one variant node (primary)', () => {
      cy.get('[data-cy="ab-variant-node"]', { timeout: 5000 })
        .should('exist')
        .and('have.length.gte', 1);
    });

    it('should have edges connecting page to variants', () => {
      cy.get('[data-cy="ab-flow-canvas"]').find('.react-flow__edge', { timeout: 5000 })
        .should('exist')
        .and('have.length.gte', 1);
    });
  });

  // ── Variant Management ───────────────────────────────────────────

  describe('Variant Management', () => {
    it('should create a new variant and display it in the flow', () => {
      // Count initial variants
      cy.get('[data-cy="ab-variant-node"]').then(($nodes) => {
        const initialCount = $nodes.length;

        abTestingPage.createVariant();

        // Should have one more variant
        abTestingPage.verifyVariantNodeCount(initialCount + 1);
      });
    });

    it('should show the primary variant (Variant 1) in the flow', () => {
      abTestingPage.verifyVariantNodeExists('Variant 1');
    });
  });

  // ── Page → Variant Direct Connection ─────────────────────────────

  describe('Page to Variant Connection', () => {
    it('should display percentage on page-to-variant edges', () => {
      // The edge labels show traffic percentage
      cy.get('[data-cy="ab-flow-canvas"]').find('.react-flow__edge', { timeout: 5000 })
        .first()
        .should('exist');

      // Percentage labels should be visible on edges
      cy.get('[data-cy="ab-flow-canvas"]').find('.react-flow__edgelabel', { timeout: 5000 })
        .should('exist')
        .and('have.length.gte', 1);
    });
  });

  // ── Save Functionality ───────────────────────────────────────────

  describe('Save', () => {
    it('should save the AB test configuration successfully', () => {
      // Create a variant to make changes
      abTestingPage.createVariant();

      // Save should succeed
      abTestingPage.saveAbTest();
      abTestingPage.verifySaveSuccess();
    });

    it('should persist variants after page reload', () => {
      // Create a variant
      abTestingPage.createVariant();
      abTestingPage.saveAbTest();
      abTestingPage.verifySaveSuccess();

      // Reload the page
      cy.reload();
      cy.wait(3000);

      // Re-open AB testing panel
      abTestingPage.openAbTestingPanel();
      abTestingPage.verifyFlowBuilderVisible();

      // The created variant should still be there
      cy.get('[data-cy="ab-variant-node"]', { timeout: 5000 })
        .should('have.length.gte', 2); // Primary + at least the one we created
    });
  });

  // ── Flow Node Interactions ───────────────────────────────────────

  describe('Flow Node Interactions', () => {
    it('should allow selecting a variant node by clicking', () => {
      abTestingPage.clickVariantNode('Variant 1');

      // Selected variant node should have a visual indicator
      cy.get('[data-cy="ab-variant-node"]').filter('.selected, [class*="selectedNode"]', { timeout: 3000 })
        .should('exist');
    });

    it('should allow selecting the page node by clicking', () => {
      abTestingPage.clickPageNode();

      cy.get('[data-cy="ab-page-node"]').filter('.selected, [class*="selectedNode"]', { timeout: 3000 })
        .should('exist');
    });
  });
});
