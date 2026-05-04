import { loginToEditor } from '../support/editorTestHelper';

const BB_URL = '/project/69f515295ac7bd7572f9590c/blockbuilder?component=TestComponent';

describe('Debug palette', () => {
  it('checks what data-cy attributes exist on the blockbuilder page', () => {
    loginToEditor();
    cy.visit(BB_URL);
    cy.wait(5000);
    cy.get('body').then(($body) => {
      const paletteItems = $body.find('[data-cy^="palette-item"]');
      const canvasArea = $body.find('[data-cy="bb-canvas-area"]');
      const rootDrop = $body.find('[data-cy="bb-root-drop-zone"]');
      const info = {
        paletteItemCount: paletteItems.length,
        paletteItemNames: paletteItems.map((i, el) => el.getAttribute('data-cy')).get(),
        canvasAreaCount: canvasArea.length,
        rootDropCount: rootDrop.length,
      };
      cy.writeFile('/tmp/palette-debug.json', JSON.stringify(info, null, 2));
    });
  });
});
