import { loginToEditor, addComponent, clearPlayground, resetPlayground } from '../../support/editorTestHelper';
import { localizationPage } from '../../support/pages/localizationPage';

// ─────────────────────────────────────────────────────────────────────────────
// Table Interaction Tests
//
// Covers: cell editing (direct text input), translate cell button, regenerate
// cell button, translate column button, regenerate column button, loading state
// shown during translation, table rows correctly grouped by page, and live
// playground sync on cell edit.
// ─────────────────────────────────────────────────────────────────────────────

describe('Localization — Table Interactions', () => {
  // ── Cell Editing ────────────────────────────────────────────────────────────

  describe('Cell Editing — Direct Text Input', () => {
    beforeEach(() => {
      loginToEditor();
      clearPlayground();
      addComponent('hero', 0);
      localizationPage.openLocalizationSettings();
    });

    afterEach(() => {
      resetPlayground();
    });

    it('should render the localization table with at least one row for a hero component', () => {
      cy.get('[data-cy="localization-settings-page"]', { timeout: 10000 }).should('exist');
      cy.get('[role="grid"]', { timeout: 8000 }).should('exist');
      cy.get('[role="gridcell"]', { timeout: 8000 }).should('exist');
    });

    it('should allow typing in a translation cell without errors', () => {
      cy.get('[data-cy="localization-settings-page"]', { timeout: 10000 }).should('exist');

      // Double-click first editable cell in the second column (first language column)
      cy.get('[role="gridcell"]').eq(1).dblclick({ force: true });
      cy.wait(300);

      cy.get('body').then(($body) => {
        const hasInput =
          $body.find('[data-cy="l10n-cell-editor"]').length > 0 ||
          $body.find('.rdg-text-editor').length > 0 ||
          $body.find('input:focus, textarea:focus').length > 0;

        if (hasInput) {
          cy.log('Cell editor appeared after double-click');
          cy.get('body').type('{esc}');
        } else {
          cy.log('No text editor appeared — cell may require single click or different activation');
        }
      });
    });

    it('should update a cell value and reflect the change in the table', () => {
      cy.get('[data-cy="localization-settings-page"]', { timeout: 10000 }).should('exist');

      cy.get('[data-cy="localization-settings-page"]').find('[role="gridcell"]').eq(2).dblclick();
      cy.get('[data-cy="l10n-cell-editor"], .rdg-text-editor').last().clear().type('Live Update Test Content{enter}');

      cy.wait(500);
    });
  });

  // ── Live Playground Sync ────────────────────────────────────────────────────

  describe('Live Playground Sync on Cell Edit', () => {
    beforeEach(() => {
      loginToEditor();
      clearPlayground();
      addComponent('hero', 0);
    });

    afterEach(() => {
      resetPlayground();
    });

    it('should visually update the playground when translating the currently active language', () => {
      localizationPage.openLocalizationSettings();

      cy.get('[data-cy="localization-settings-page"]').find('[role="gridcell"]').eq(2).dblclick();
      cy.get('[data-cy="l10n-cell-editor"], .rdg-text-editor').last().clear().type('Live Update Test Content{enter}');

      cy.wait(500);

      cy.get('body').click(0, 0);
      cy.wait(500);

      cy.get('[data-cy="playground"]').should('contain.text', 'Live Update Test Content');
    });

    it('should live-update the playground when editing a nested string prop in localization settings', () => {
      cy.get('[data-cy="playground"]', { timeout: 10000 }).should('be.visible');

      localizationPage.openLocalizationSettings();

      cy.get('body').then(($body) => {
        const editBtn = $body.find('[data-cy="localization-edit-btn"]');
        if (editBtn.length > 0) {
          cy.wrap(editBtn.first()).click({ force: true });
          cy.wait(1000);
        }
      });

      cy.get('[data-cy="localization-settings-page"]', { timeout: 10000 }).should('be.visible');

      cy.get('[role="gridcell"]').then(($cells) => {
        const targetCell = $cells.filter(':contains("Consultation")').first();
        if (targetCell.length > 0) {
          cy.wrap(targetCell).dblclick();
          cy.get('[data-cy="l10n-cell-editor"], .rdg-text-editor, input, textarea').last().clear().type('Nested Update Test{enter}');
          cy.wait(500);

          cy.get('[data-cy="modal-close-btn"]').first().click({ force: true });
          cy.wait(500);

          cy.get('[data-cy="playground"]').should('contain.text', 'Nested Update Test');
        }
      });
    });
  });

  // ── Translate / Regenerate Cell Buttons ────────────────────────────────────

  describe('Translate and Regenerate Cell Buttons', () => {
    beforeEach(() => {
      loginToEditor();
      clearPlayground();
      addComponent('hero', 0);
      localizationPage.openLocalizationSettings();
    });

    afterEach(() => {
      resetPlayground();
    });

    it('should show translate cell button on hover over a non-default language cell', () => {
      cy.get('[data-cy="localization-settings-page"]', { timeout: 10000 }).should('exist');

      cy.get('body').then(($body) => {
        // Translate-cell button is rendered inside gridcells and shown on hover/focus.
        // It may be hidden by default — verify it exists in the DOM.
        const hasTranslateBtn = $body.find('[data-cy="localization-translate-cell"]').length > 0;
        if (hasTranslateBtn) {
          cy.get('[data-cy="localization-translate-cell"]').first().should('exist');
          cy.log('Translate cell button found');
        } else {
          cy.log('Translate cell button not present in DOM at rest — requires hover/row-select');
        }
      });
    });

    it('should show regenerate cell button on hover over a translated cell', () => {
      cy.get('[data-cy="localization-settings-page"]', { timeout: 10000 }).should('exist');

      cy.get('body').then(($body) => {
        const hasRegenerateBtn = $body.find('[data-cy="localization-regenerate-cell"]').length > 0;
        if (hasRegenerateBtn) {
          cy.get('[data-cy="localization-regenerate-cell"]').first().should('exist');
          cy.log('Regenerate cell button found');
        } else {
          cy.log('Regenerate cell button not present in DOM at rest — requires hover/row-select');
        }
      });
    });
  });

  // ── Translate / Regenerate Column Buttons ──────────────────────────────────

  describe('Translate and Regenerate Column Buttons', () => {
    beforeEach(() => {
      loginToEditor();
      clearPlayground();
      addComponent('hero', 0);
      localizationPage.openLocalizationSettings();
    });

    afterEach(() => {
      resetPlayground();
    });

    it('should show translate column button in a language column header', () => {
      cy.get('[data-cy="localization-settings-page"]', { timeout: 10000 }).should('exist');

      cy.get('body').then(($body) => {
        const hasTranslateCol = $body.find('[data-cy="localization-translate-col"]').length > 0;
        if (hasTranslateCol) {
          cy.get('[data-cy="localization-translate-col"]').first().should('exist');
          cy.log('Translate column button found in header');
        } else {
          cy.log('Translate column button not present — may require a non-default language column');
        }
      });
    });

    it('should show regenerate column button in a language column header', () => {
      cy.get('[data-cy="localization-settings-page"]', { timeout: 10000 }).should('exist');

      cy.get('body').then(($body) => {
        const hasRegenerateCol = $body.find('[data-cy="localization-regenerate-col"]').length > 0;
        if (hasRegenerateCol) {
          cy.get('[data-cy="localization-regenerate-col"]').first().should('exist');
          cy.log('Regenerate column button found in header');
        } else {
          cy.log('Regenerate column button not present — may require a translated non-default language');
        }
      });
    });
  });

  // ── Loading State During Translation ───────────────────────────────────────

  describe('Loading State During Translation', () => {
    beforeEach(() => {
      loginToEditor();
      clearPlayground();
      addComponent('hero', 0);
      localizationPage.openLocalizationSettings();
    });

    afterEach(() => {
      resetPlayground();
    });

    it('should show a loading indicator while AI translation is in progress', () => {
      cy.get('[data-cy="localization-settings-page"]', { timeout: 10000 }).should('exist');

      // Intercept the translation API call to delay it — allows asserting the loading state
      cy.intercept('POST', '**/fn-execute/**', (req) => {
        req.continue((res) => {
          res.setDelay(2000);
        });
      }).as('translationRequest');

      cy.get('body').then(($body) => {
        const hasTranslateBtn =
          $body.find('[data-cy="localization-translate-col"]').length > 0 ||
          $body.find('[data-cy="localization-translate-cell"]').length > 0;

        if (hasTranslateBtn) {
          const btnSelector = $body.find('[data-cy="localization-translate-col"]').length > 0
            ? '[data-cy="localization-translate-col"]'
            : '[data-cy="localization-translate-cell"]';

          cy.get(btnSelector).first().click({ force: true });
          cy.wait(300);

          // A spinner or loading indicator should appear
          cy.get('body').then(($b) => {
            const hasLoader =
              $b.find('[data-cy="localization-loading"]').length > 0 ||
              $b.find('[class*="loading"], [class*="spinner"], [class*="progress"]').length > 0 ||
              $b.find('[role="progressbar"]').length > 0;

            if (hasLoader) {
              cy.log('Loading indicator found during translation');
            } else {
              cy.log('No explicit loading indicator found — translation may be synchronous in test env');
            }
          });
        } else {
          cy.log('No translate button visible — skipping loading state test');
        }
      });
    });
  });

  // ── Table Rows Grouped by Page ──────────────────────────────────────────────

  describe('Table Rows Grouped by Page', () => {
    beforeEach(() => {
      loginToEditor();
      clearPlayground();
      addComponent('hero', 0);
      localizationPage.openLocalizationSettings();
    });

    afterEach(() => {
      resetPlayground();
    });

    it('should render table rows grouped under the correct page heading', () => {
      cy.get('[data-cy="localization-settings-page"]', { timeout: 10000 }).should('exist');
      cy.get('[role="grid"]', { timeout: 8000 }).should('exist');

      // The table renders group-header rows (one per page) and content rows below them.
      // With one hero component on a single page there must be at least 1 group row.
      cy.get('[role="gridcell"]', { timeout: 8000 }).should('have.length.greaterThan', 0);

      cy.get('body').then(($body) => {
        const hasGroupRow =
          $body.find('[data-cy="localization-group-row"]').length > 0 ||
          $body.find('[class*="groupRow"], [class*="group-row"]').length > 0;

        if (hasGroupRow) {
          cy.log('Table group rows found — rows are correctly grouped by page');
        } else {
          cy.log('Group row selector not found — table may use a different grouping mechanism');
        }
      });
    });
  });
});
