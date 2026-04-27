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
    cy.get('[data-cy="tab-Design"]').click({ force: true });

    // Scroll to Placement Section
    cy.get('[data-cy="category-section-placement"]').scrollIntoView().should('be.visible');

    // Confirm that since position is Static by default, the 'Left' and 'Top' metrics are forced strictly into disabled visual ghosting
    // We check that inner inputs are `disabled` in DOM
    cy.get('[data-cy="placement-left"]').should('be.disabled');
    cy.get('[data-cy="placement-top"]').should('be.disabled');
    
    // Now toggle Position to Absolute (usually the first/second item in Placement)
    // Absolute position toggle has AbsoluteIcon (it will be visible via WTooltip "Absolute Position")
    cy.get('[data-cy="placement-absolute-toggle"]').click({ force: true });

    // The inputs should now be unlocked!
    cy.get('[data-cy="placement-left"]').should('not.be.disabled');
    cy.get('[data-cy="placement-top"]').should('not.be.disabled');
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
    cy.get('[data-cy="tab-Design"]').click({ force: true });

    // 4. Scroll to Background Section and expand it
    cy.get('[data-cy="category-section-background"]').scrollIntoView().click({ force: true });

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

  it('should not show browser-computed default styles (border, background, display, flex-direction) in Custom CSS panel for a plain H3 element', () => {
    // Regression test for bug: useBlockBuilderCssExtraction supplemented dynamicInitialCss
    // with ALL properties from getComputedStyle that weren't in the component stylesheet.
    // This caused the Custom CSS panel to show "border: 0px none rgb(233,233,233)",
    // "background: rgba(0,0,0,0) none repeat scroll ...", "display: block",
    // "flex-direction: row", "object-fit: fill", etc. for a simple H3 element with no
    // such properties intentionally set.
    //
    // Fix: Removed the `else if (!existingVal)` supplement branch from step 3 in
    // useBlockBuilderCssExtraction. getComputedStyle is now only used to resolve existing
    // var() tokens, not to supplement the baseline with default values.
    //
    // Scenario:
    // 1. Load an empty component in Block Builder.
    // 2. Drag a Base.H3 node onto the canvas.
    // 3. Select it.
    // 4. Open the Design tab -> Custom CSS section.
    // 5. Verify that the Custom CSS editor does NOT contain default computed values:
    //    border-*, background (transparent), display: block, flex-direction: row,
    //    object-fit: fill, opacity: 1, height (live dimension).
    cy.visit('/project/1/blockbuilder?component=TestComponent');
    cy.get('[data-cy="bb-canvas-area"]').should('be.visible');

    // Add a H3 node
    cy.get('[data-cy="palette-item-Base.H3"]').should('be.visible').as('h3PaletteItem');
    cy.get('[data-cy="bb-root-drop-zone"]').should('be.visible').as('dropZone');
    cy.get('@h3PaletteItem').drag('@dropZone');

    // Select the rendered H3
    cy.get('[data-cy="bb-node-interactive"]').contains('H3').click({ force: true });

    // Open Design tab
    cy.get('[data-cy="tab-Design"]').click({ force: true });

    // Scroll to Custom section
    cy.get('[data-cy="category-section-custom"]').scrollIntoView().should('be.visible');

    // The Monaco editor value should NOT contain default computed CSS junk
    cy.get('[data-cy="category-section-custom"]').within(() => {
      cy.get('.view-lines').should('exist').invoke('text').then((text) => {
        // These are browser-computed defaults that should NOT appear in the custom panel
        expect(text).to.not.match(/border\s*:/);
        expect(text).to.not.match(/border-left\s*:/);
        expect(text).to.not.match(/border-right\s*:/);
        expect(text).to.not.match(/border-top\s*:/);
        expect(text).to.not.match(/border-bottom\s*:/);
        expect(text).to.not.match(/display\s*:\s*block/);
        expect(text).to.not.match(/flex-direction\s*:/);
        expect(text).to.not.match(/flex-wrap\s*:/);
        expect(text).to.not.match(/object-fit\s*:/);
        expect(text).to.not.match(/opacity\s*:\s*1/);
        expect(text).to.not.match(/background\s*:\s*rgba\(0,\s*0,\s*0,\s*0\)/);
        expect(text).to.not.match(/background-color\s*:\s*rgba\(0,\s*0,\s*0,\s*0\)/);
      });
    });
  });
});
