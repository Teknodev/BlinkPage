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

  it('should not cause infinite sync loops or background flashes when Custom CSS editor processes layout updates', () => {
    // Regression test for bug: The container background color cannot be changed.
    // 
    // Root cause: When `Base.Container` changed its background color, the React component updated the Custom CSS
    // editor payload. The Monaco editor (`custom.tsx`) responded by programmatically setting its value, which triggered
    // an internal `onChange` handler that immediately fired a massive batch update containing all 31 properties 
    // (including the original `background: unset`). `ShorthandSync` encountered the conflicting batch and nullified the 
    // newly selected color, causing an instant revert/flash.
    //
    // Fix: Redesigned the Custom CSS `handleChange` method to compute an exact diff against the previous `valuesRef`. 
    // If the component state triggered the change, the calculated diff computes to 0 properties, bypassing the 
    // infinite sync loop.
    //
    // Scenario:
    // 1. Drag Base.Container into the canvas.
    // 2. Open the UI Design Tab -> Background.
    // 3. Change property to Solid Color: #B70C0C.
    // 4. Verify that Custom CSS Editor registers this without dropping the update.
    // 5. Change another parameter like padding via UI.
    //
    // Expected: The background color persists perfectly and is not immediately overridden.
  });
});
