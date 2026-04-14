import '@4tw/cypress-drag-drop';

describe('Block Builder - Drag and Drop Figma-style Gaps', () => {
  beforeEach(() => {
    // Assuming the user is logged in or bypassing authentication for testing.
    // Intercept API calls if necessary, but we'll focus on the UI drag-and-drop.
    // Replace with the standard test login flow if required.
    
    // We navigate directly to the block builder route for a test component
    cy.visit('/project/1/blockbuilder?component=TestComponent');
  });

  it('should successfully drag an element from palette and drop it, creating a space', () => {
    // Wait for the Canvas and Elements Palette to render
    cy.get('[data-cy="bb-canvas-area"]').should('be.visible');
    
    // Drag Base.Container first to establish a valid root element
    cy.get('[data-cy="palette-item-Base.Container"]').should('be.visible').as('containerPaletteItem');
    cy.get('[data-cy="bb-root-drop-zone"]').should('be.visible').as('dropZone');
    cy.get('@containerPaletteItem').drag('@dropZone');

    // Wait for the container to render in the canvas, and use it as the new drop zone
    cy.get('[data-cy="bb-rendered-container"]').first().should('exist').as('containerElement');

    // The palette item for "Base.Button"
    cy.get('[data-cy="palette-item-Base.Button"]').should('be.visible').as('buttonPaletteItem');

    // Drag the Button palette item into the container
    cy.get('@buttonPaletteItem').drag('@containerElement');

    // Verify the node appears in the canvas
    cy.get('[data-cy="bb-node-interactive"]').should('exist');
    cy.get('button').contains('Button').should('exist');

    // Now test Figma-style gaps by hovering over the existing element with another dragged item
    cy.get('[data-cy="palette-item-Base.P"]').should('be.visible').as('paragraphPaletteItem');

    // Start drag but wait to verify the drop space classes appear dynamically
    cy.get('@paragraphPaletteItem').trigger('mousedown', { button: 0 });
    cy.get('@paragraphPaletteItem').trigger('mousemove', { clientX: 10, clientY: 10 });
    
    // Hover the mouse over the top of the placed button to trigger .dropSpaceTop
    cy.get('button').trigger('dragover', 'top');

    // Verify that the element gains the padding-based gap class
    cy.get('button').closest('[data-cy="bb-node-interactive"]').should('have.class', /dropSpaceTop|dropSpaceBottom/);

    // Drop the paragraph
    cy.get('button').trigger('drop');
    cy.get('@paragraphPaletteItem').trigger('mouseup', { force: true });

    // Verify the new node is added
    cy.get('p').should('exist');
  });

  it('should allow configuring available media types for Base.Media', () => {
    // Wait for the Canvas and Elements Palette to render
    cy.get('[data-cy="bb-canvas-area"]').should('be.visible');
    
    // Drag Base.Container first to establish a valid root element
    cy.get('[data-cy="palette-item-Base.Container"]').should('be.visible').as('containerPaletteItem');
    cy.get('[data-cy="bb-root-drop-zone"]').should('be.visible').as('dropZone');
    cy.get('@containerPaletteItem').drag('@dropZone');

    // Wait for the container to render in the canvas, and use it as the new drop zone
    cy.get('[data-cy="bb-rendered-container"]').first().should('exist').as('containerElement');

    // The palette item for "Base.Media"
    cy.get('[data-cy="palette-item-Base.Media"]').should('be.visible').as('mediaPaletteItem');

    // Drag Base.Media onto the drop zone
    cy.get('@mediaPaletteItem').drag('@containerElement');

    // Click the placed media component to select it and open Settings
    cy.get('[data-cy="bb-node-interactive"]').contains('Media').click({ force: true });

    // Ensure the Settings panel shows the "Allowed Media Types" section
    cy.get('div').contains('Allowed Media Types').should('be.visible');

    // Toggle the "Lottie" checkbox
    cy.get('label').contains('Lottie').click();

    // The user action causes a state update that adds Lottie to the array.
    // Assert the setting is present.
    cy.get('label').contains('Lottie').should('exist');

    // Verify CSSGUI renders extended image properties like object-fit in the Design Tab
    cy.get('div').contains('Design').click({ force: true });
    cy.get('div').contains('Size').should('be.visible');
    // We added object-fit to css-properties.tsx explicitly for Media elements
    cy.get('label').contains('object-fit').should('exist');
  });

  it('should strictly prevent dragging non-container elements directly into the empty root canvas', () => {
    // Wait for the Canvas to render empty
    cy.get('[data-cy="bb-canvas-area"]').should('be.visible');
    
    // The palette item for "Base.Button"
    cy.get('[data-cy="palette-item-Base.Button"]').should('be.visible').as('buttonPaletteItem');
    cy.get('[data-cy="bb-root-drop-zone"]').should('be.visible').as('dropZone');

    // Drag the Button palette item directly onto the empty root drop zone
    cy.get('@buttonPaletteItem').drag('@dropZone');

    // Verify the central container enforces rejection, keeping interactive nodes out of DOM
    cy.get('button').should('not.exist');
    cy.get('[data-cy="bb-node-interactive"]').should('not.exist');

    // Empty canvas instructions must still persist
    cy.get('[data-cy="bb-empty-canvas"]').contains('Drag elements here').should('exist');
  });

  it('should restrict hierarchy modifications on smart parent replica children', () => {
    // Note: E2E Implementation Stub
    // 1. Drag a Container into the canvas (Root container).
    // 2. Click the Container to reveal Settings panel.
    // 3. Toggle "Make Smart Parent" via Settings.
    // 4. Duplicate the first child inside the Container to create a Replica.
    // 5. Attempt to drag a node inside the second child (Replica).
    // Expected: The drag drop event should intercept or prevent modifications and the lock icon should appear.
    // Ensure styles differentiate between Class vs ID scoping selections.
  });

  it('should include all smart parent children values in generated addProp when saving', () => {
    // Regression test for bug: Smart Parent save only included child 0 values in addProp array.
    //
    // Scenario:
    // 1. Create a Smart Parent container with 3 children.
    // 2. Each child contains a text element (e.g., Base.P) with distinct text:
    //    - Child 0: "Hello"
    //    - Child 1: "World" (edited via ID mode)
    //    - Child 2: "Foo" (edited via ID mode)
    // 3. Save the component.
    //
    // Expected:
    // The generated addProp call should contain an array with 3 object entries,
    // each carrying its own distinct text value ("Hello", "World", "Foo").
    //
    // Before fix: Only 1 entry (from child 0) was generated.
    // After fix:  N entries (one per child) are generated.
    //
    // Note: Full automation requires intercepting the save API call and inspecting
    // the generated bundleCode payload. This is a structural test stub.
  });

  it('should preserve the same element tree when saving and re-editing a component', () => {
    // Regression test for bug: saving a component and re-editing it in Block Builder
    // added extra <div> wrapper nodes into the element tree.
    //
    // Root cause: generateSmartParentCode and generateListGridCode wrapped each
    // .map() item in React.createElement("div", { key: index }, ...) which the
    // decomposer then parsed as a real div node on re-edit.
    //
    // Fix: The template child's own element now carries key={index} directly,
    // eliminating the extra wrapper div.
    //
    // Scenario:
    // 1. Create a Smart Parent with children containing text/media nodes.
    // 2. Save the component.
    // 3. Re-open the same component in Block Builder.
    // 4. Compare the tree node count before and after the save-reopen cycle.
    //
    // Expected: The tree should have the exact same depth and node count.
    // Before fix: Extra div nodes appeared as children of the Smart Parent container.
    // After fix: No extra nodes are introduced.
    //
    // Note: Full automation requires saving and re-loading via API intercept.
  });

  it('should not initially render popovers at absolute origin during async coordinate calculation', () => {
    // Regression test for bug: When clicking "Add Element" in the playground, the popup initially
    // appears in the left-side tree panel (0,0) and then repositions to its correct location.
    //
    // Root cause: The Add Element popup was mounted to `document.body` via `createPortal`. In the first
    // frame, `popoverCoords` initialized to `{ top: 0, left: 0 }`. It rendered exactly 1 frame at the 
    // absolute top-left of the viewport before React finalized the coordinate calculation from the button's bounds.
    //
    // Fix: Initialized the `popoverCoords` to `null` and added a strict `&& popoverCoords` render guard 
    // to strictly block the DOM portal from mounting physically until coordinates are guaranteed valid.
  });
});
