import '@4tw/cypress-drag-drop';
import { loginToEditor } from '../support/editorTestHelper';

const BB_URL = '/project/69f515295ac7bd7572f9590c/blockbuilder?component=TestComponent';

describe('Debug positions', () => {
  beforeEach(() => {
    loginToEditor();
    cy.visit(BB_URL);
    cy.get('[data-cy="bb-canvas-area"]', { timeout: 15000 }).should('be.visible');
  });

  it('checks positions of palette items and canvas elements', () => {
    // Drag container to canvas
    cy.get('[data-cy="palette-item-Base.Container"]').drag('[data-cy="bb-root-drop-zone"]');
    cy.get('[data-cy="bb-rendered-container"]').first().should('exist');

    // Drag button to container
    cy.get('[data-cy="palette-item-Base.Button"]').drag('[data-cy="bb-rendered-container"]');
    cy.wait(1000);

    cy.get('body').then(($body) => {
      // Get all always-visible palette items
      const paletteItems = $body.find('[data-cy^="palette-item"]');
      const paletteRects = [];
      paletteItems.each((i, el) => {
        const rect = el.getBoundingClientRect();
        paletteRects.push({
          dataCy: el.getAttribute('data-cy'),
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          right: Math.round(rect.right),
          bottom: Math.round(rect.bottom),
        });
      });

      // Get the button on canvas
      const canvasButton = $body.find('[data-cy="bb-node-interactive"][data-component-name="Base.Button"]');
      const buttonRects = [];
      canvasButton.each((i, el) => {
        const rect = el.getBoundingClientRect();
        buttonRects.push({
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        });
      });

      // Check elementFromPoint at button center
      const buttonEl = canvasButton[0];
      const coverageResults = [];
      if (buttonEl) {
        const rect = buttonEl.getBoundingClientRect();
        const centerX = rect.x + rect.width / 2;
        const centerY = rect.y + rect.height / 2;
        const topX = rect.x + rect.width / 2;
        const topY = rect.y + 5;
        const topElement = document.elementFromPoint(topX, topY);
        coverageResults.push({
          checkX: Math.round(topX),
          checkY: Math.round(topY),
          foundTagName: topElement ? topElement.tagName : 'none',
          foundClassName: topElement ? topElement.className : 'none',
          foundDataCy: topElement ? topElement.getAttribute('data-cy') : 'none',
          isButton: topElement === buttonEl,
        });
      }

      cy.writeFile('/tmp/debug-positions.json', JSON.stringify({
        paletteItems: paletteRects,
        canvasButtons: buttonRects,
        coverage: coverageResults,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      }, null, 2));
    });
  });
});
