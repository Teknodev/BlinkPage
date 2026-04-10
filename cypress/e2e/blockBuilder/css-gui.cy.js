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

  it('should not inject rogue default inline styles (padding) when decomposing existing components', () => {
    // Load an existing component explicitly to trigger decomposeComponentByName logic
    cy.visit('/project/1/blockbuilder?component=Base.Container');

    // Wait for the Canvas to render
    cy.get('[data-cy="bb-canvas-area"]').should('be.visible');

    // The container should not have default var(--padding-md) injected into its inline style string.
    cy.get('[data-component-name="Base.Container"]')
      .should('be.visible')
      .then(($el) => {
        const style = $el.attr('style') || "";
        expect(style).to.not.include('padding-top: var(--padding-md)');
      });

    // Selecting it should also not force the layout to shift or inject the style
    cy.get('[data-component-name="Base.Container"]').click({ force: true });
    
    cy.get('[data-component-name="Base.Container"]').then(($el) => {
        const style = $el.attr('style') || "";
        expect(style).to.not.include('padding-top: var(--padding-md)');
    });
  });

  it('should not inject generic purple background colors implicitly from ColorPicker on mount', () => {
    // 1. Load an empty component / generic component
    cy.visit('/project/1/blockbuilder?component=Base.Container');

    // 2. Wait for the Canvas to render and select Container
    cy.get('[data-cy="bb-canvas-area"]').should('be.visible');
    cy.get('[data-cy="bb-node-interactive"]').contains('Container').click({ force: true });
    
    // 3. Open Design Tab
    cy.get('div').contains('Design').click({ force: true });

    // 4. Scroll to Background Section and expand it
    cy.get('div').contains('Background').scrollIntoView().click({ force: true });

    // 5. Explicitly verify that the DOM has NOT suddenly updated to background-color: rgb(125, 43, 169)
    // after simply mounting the CSSGUI and Background tabs.
    cy.get('[data-component-name="Base.Container"]').then(($el) => {
        const style = $el.attr('style') || "";
        expect(style).to.not.include('background');
        expect(style).to.not.include('rgb(125, 43, 169)');
    });
  });
});
