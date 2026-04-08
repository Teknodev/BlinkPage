import '@4tw/cypress-drag-drop';

describe('CSS GUI - Design Controls Validation', () => {
  beforeEach(() => {
    // Navigate directly to the block builder route for a test component
    cy.visit('/project/1/blockbuilder?component=TestComponent');
  });

  it('should restrict un-editable Position placement fields visually via opacity lock', () => {
    // Wait for the Canvas and Elements Palette to render
    cy.get('[data-cy="bb-canvas-area"]').should('be.visible');
    
    // Drag Base.Container first to establish a valid root element
    cy.get('[data-cy="palette-item-Base.Container"]').should('be.visible').as('containerPaletteItem');
    cy.get('[data-cy="bb-root-drop-zone"]').should('be.visible').as('dropZone');
    cy.get('@containerPaletteItem').drag('@dropZone');

    // Select the rendered container
    cy.get('[data-cy="bb-node-interactive"]').contains('Container').click({ force: true });

    // Open Design tab
    cy.get('div').contains('Design').click({ force: true });

    // Scroll to Placement Section
    cy.get('div').contains('Placement').scrollIntoView().should('be.visible');

    // Confirm that since position is Static by default, the 'Left' and 'Top' metrics are forced strictly into disabled visual ghosting
    // We check that inner inputs are `disabled` in DOM
    cy.get('span').contains(/^Left$/).parent().parent().find('input').should('be.disabled');
    cy.get('span').contains(/^Top$/).parent().parent().find('input').should('be.disabled');
    
    // Now toggle Position to Absolute (usually the first/second item in Placement)
    // Absolute position toggle has AbsoluteIcon (it will be visible via WTooltip "Absolute Position")
    cy.get('[aria-label="Absolute Position"]').click({ force: true });

    // The inputs should now be unlocked!
    cy.get('span').contains(/^Left$/).parent().parent().find('input').should('not.be.disabled');
    cy.get('span').contains(/^Top$/).parent().parent().find('input').should('not.be.disabled');
  });

});
