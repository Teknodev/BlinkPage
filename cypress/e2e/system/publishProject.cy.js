import { loginToEditor, clearPlayground, resetPlayground } from '../../support/editorTestHelper';

/**
 * Publish Project Validation E2E Tests
 */

describe('Publish Project Validation', () => {
  beforeEach(() => {
    loginToEditor();
  });

  afterEach(() => {
    resetPlayground();
  });

  it('should disable the publish button and show tooltip if a page has no components', () => {
    clearPlayground(); // Ensure the project has 0 components

    // Assuming the publish button is available in the top bar
    // If the project is empty, it needs to be disabled
    cy.get('button', { timeout: 10000 })
      .contains('Publish', { matchCase: false })
      .should('be.visible')
      .should('be.disabled');

    // The tooltip is wrapped around a span since native buttons don't have tooltips when disabled
    // If we trigger a hover state over the wrapper or text, native tooltip materializes its aria-describedby or title.
    // As it uses MuiTooltip which leverages portals for tooltips, we trigger a mouseover on the span wrapping the button.
    cy.get('button').contains('Publish', { matchCase: false }).parent('span').trigger('mouseover', { force: true });
    
    // Check if Tooltip message is displayed in the DOM
    cy.get('.MuiTooltip-tooltip', { timeout: 5000 })
      .should('be.visible')
      .should('contain.text', 'Please ensure all pages have at least one component before publishing');
  });

});
