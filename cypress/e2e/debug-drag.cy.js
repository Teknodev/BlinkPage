import '@4tw/cypress-drag-drop';
import { loginToEditor } from '../support/editorTestHelper';

const BB_URL = '/project/69f515295ac7bd7572f9590c/blockbuilder?component=TestComponent';

describe('Debug drag', () => {
  beforeEach(() => {
    loginToEditor();
    cy.visit(BB_URL);
    cy.get('[data-cy="bb-canvas-area"]', { timeout: 15000 }).should('be.visible');
  });

  it('drags Base.Container then Base.Button to container', () => {
    cy.get('[data-cy="palette-item-Base.Container"]').should('exist').as('containerPaletteItem');
    cy.get('[data-cy="bb-root-drop-zone"]').should('be.visible').as('dropZone');

    // Initial state
    cy.get('body').then(($body) => {
      const before = $body.find('[data-cy="bb-rendered-container"]').length;
      cy.writeFile('/tmp/debug-initial.json', JSON.stringify({ containers: before }));
    });

    cy.get('@containerPaletteItem').drag('@dropZone');
    cy.wait(1000);

    cy.get('[data-cy="bb-rendered-container"]').first().should('exist').as('containerElement');

    cy.get('[data-cy="palette-item-Base.Button"]').should('exist').as('buttonPaletteItem');
    cy.get('@buttonPaletteItem').drag('@containerElement');
    cy.wait(2000);

    cy.get('body').then(($body) => {
      const containers = $body.find('[data-cy="bb-rendered-container"]').length;
      const buttons = $body.find('[data-cy="bb-node-interactive"][data-component-name="Base.Button"]').length;
      cy.writeFile('/tmp/debug-drag-after2.json', JSON.stringify({ containers, buttons }));
    });
  });
});
