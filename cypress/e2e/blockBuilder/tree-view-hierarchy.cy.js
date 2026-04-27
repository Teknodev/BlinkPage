/**
 * Regression test — PB tree view hierarchy after saving a BB component
 *
 * Bug fixed: block-code-generator.ts `buildCSSAttr()` only assigned a CSS class
 * to nodes that had inline styles. Nodes with no styles received no `className`
 * in the generated JSX → they were absent from the DOM class map →
 * `getExportedCSSClasses()` returned an incomplete hierarchy → the PB tree view
 * panel showed a flat / empty structure for the saved component.
 *
 * Fix: Every non-root node always receives a CSS class name (from the classNames map).
 *      No styles required. The PB tree traversal can now walk the full hierarchy.
 *
 * Expected: After creating a multi-level component in BB, saving it, and dropping it
 * in PB, the tree view panel should render all structural levels — not just the root.
 */

const PROJECT_ID = Cypress.env('TEST_PROJECT_ID') || '69e21b07349907b1b47a7a91';

describe('Block Builder → PB tree view — full hierarchy regression', () => {
  beforeEach(() => {
    cy.visit(`/project/${PROJECT_ID}/blockbuilder`);
    cy.get('[data-cy="bb-canvas-area"]').should('be.visible');
  });

  it('saved component should appear in PB tree view with all structural levels intact', () => {
    // ── Build a 3-level component: Container > Row > H1 ──────────────────
    cy.get('[data-cy="palette-item-Base.Container"]').drag('[data-cy="bb-root-drop-zone"]');
    cy.get('[data-cy="bb-rendered-container"]').first().should('exist').as('container');

    cy.get('[data-cy="palette-item-Base.Row"]').drag('@container');
    cy.get('[data-cy="bb-node-interactive"][data-component-name="Base.Row"]').first().as('row');

    cy.get('[data-cy="palette-item-Base.H1"]').drag('@row');
    cy.get('[data-cy="bb-node-interactive"][data-component-name="Base.H1"]').should('exist');

    // ── Save the component ────────────────────────────────────────────────
    cy.get('[data-cy="bb-save-component-button"]').click();
    cy.get('[data-cy="save-dialog-name-input"]').clear().type('TreeViewTest');
    cy.get('[data-cy="save-dialog-confirm"]').click();
    cy.get('[data-cy="save-dialog"]').should('not.exist');

    // ── Navigate to PB and drop the saved component ───────────────────────
    cy.visit(`/project/${PROJECT_ID}/editor/0`);
    cy.get('[data-cy="playground-canvas"]').should('be.visible');

    // Open the custom components library section and add TreeViewTest
    cy.get('[data-cy="library-category-custom"]').click();
    cy.get('[data-cy="library-item-TreeViewTest"]').should('be.visible').click();

    // The component should now appear in the page
    cy.get('[data-cy="playground-canvas"]')
      .find('[data-component-name="TreeViewTest"]')
      .should('exist')
      .click();

    // ── Open the tree view panel ──────────────────────────────────────────
    cy.get('[data-cy="tree-view-toggle"]').click();
    cy.get('[data-cy="tree-view-panel"]').should('be.visible');

    // The tree must show at least 3 levels: root wrapper, Container, Row
    // (H1 may be collapsed by default — Container and Row are the structural test)
    cy.get('[data-cy="tree-view-panel"]')
      .find('[data-cy^="tree-node-"]')
      .should('have.length.at.least', 3);

    // Specifically, the Row node must be present in the tree — it has no styles,
    // so the pre-fix code would omit its className and make it invisible to the tree.
    cy.get('[data-cy="tree-view-panel"]')
      .contains('[data-cy^="tree-node-"]', /Row|Base\.Row/)
      .should('exist');
  });

  it('component with no styled nodes should still produce a navigable tree view', () => {
    // ── Build a component entirely without any inline styles ──────────────
    cy.get('[data-cy="palette-item-Base.Container"]').drag('[data-cy="bb-root-drop-zone"]');
    cy.get('[data-cy="bb-rendered-container"]').first().as('container');

    cy.get('[data-cy="palette-item-Base.P"]').drag('@container');
    cy.get('[data-cy="bb-node-interactive"][data-component-name="Base.P"]').should('exist');

    // Do NOT apply any styles — this is the regression scenario.

    cy.get('[data-cy="bb-save-component-button"]').click();
    cy.get('[data-cy="save-dialog-name-input"]').clear().type('NoStylesTest');
    cy.get('[data-cy="save-dialog-confirm"]').click();
    cy.get('[data-cy="save-dialog"]').should('not.exist');

    cy.visit(`/project/${PROJECT_ID}/editor/0`);
    cy.get('[data-cy="playground-canvas"]').should('be.visible');

    cy.get('[data-cy="library-category-custom"]').click();
    cy.get('[data-cy="library-item-NoStylesTest"]').should('be.visible').click();

    cy.get('[data-cy="playground-canvas"]')
      .find('[data-component-name="NoStylesTest"]')
      .should('exist')
      .click();

    cy.get('[data-cy="tree-view-toggle"]').click();
    cy.get('[data-cy="tree-view-panel"]').should('be.visible');

    // Tree must contain at least 2 nodes (root + the Base.P paragraph)
    cy.get('[data-cy="tree-view-panel"]')
      .find('[data-cy^="tree-node-"]')
      .should('have.length.at.least', 2);
  });
});
