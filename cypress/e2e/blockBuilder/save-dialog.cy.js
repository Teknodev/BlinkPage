describe('Block Builder - Custom Component Save Dialog', () => {
  beforeEach(() => {
    // Intercept the API call to mock custom components data for validation
    cy.intercept('GET', '**/resource/*/custom-components*', {
      statusCode: 200,
      body: [
        {
          _id: '123',
          name: 'My Custom Element',
          version: 1,
          category: 'custom'
        },
        {
          _id: '124',
          name: 'My Custom Element',
          version: 2,
          category: 'custom'
        }
      ]
    }).as('getCustomComponents');

    // We navigate to the block builder route for a test component
    cy.visit('/project/1/blockbuilder?component=TestComponent');
  });

  it('should enforce strict versioning increments based on prefetched cache', () => {
    // Wait for the Canvas to render empty
    cy.get('[data-cy="bb-canvas-area"]').should('be.visible');

    // Trigger the save dialog
    cy.get('button').contains('Save Component').click();

    // The dialog should be visible
    cy.get('h2').contains('Save as Custom Component').should('be.visible');

    // Wait for the mock components to be fetched
    cy.wait('@getCustomComponents');

    // Input the component name exactly matching the mock cache
    cy.get('input[placeholder="My Custom Component"]').clear().type('My Custom Element');

    // The version input mechanism should automatically adjust min boundary to 3
    // because latest version in mock is 2
    cy.get('input[type="number"]').should('have.attr', 'min', '3');
    
    // Check its programmatic value was bumped from 1 to 3
    cy.get('input[type="number"]').should('have.value', '3');

    // If we deliberately try to type a lesser version
    cy.get('input[type="number"]').clear().type('1');
    
    // Assuming UI does not prevent typing physically, the Save button click should trigger error
    cy.get('button').contains('Save Component').click();

    // Verify the validation error msg
    cy.get('div').contains('Version for "My Custom Element" must be at least 3.').should('be.visible');
  });
});
