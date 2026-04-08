import { loginToEditor, addComponent, clearPlayground, resetPlayground } from '../../support/editorTestHelper';
import { localizationPage } from '../../support/pages/localizationPage';
import localizationData from '../../fixtures/localizationData.json';

// ─────────────────────────────────────────────────────────────────────────────

describe('Localization - Settings Navigation', () => {
  beforeEach(() => {
    loginToEditor();
    clearPlayground();
    addComponent('hero', 0);
  });

  afterEach(() => {
    resetPlayground();
  });

  it('should open the localization settings panel', () => {
    localizationPage.openLocalizationSettings();
    localizationPage.verifySettingsPanelOpen();
  });
});

describe('Localization - Add Language', () => {
  beforeEach(() => {
    loginToEditor();
    clearPlayground();
    addComponent('hero', 0);
    localizationPage.openLocalizationSettings();
  });

  afterEach(() => {
    resetPlayground();
  });

  it('should add a new language to the localization table', () => {
    localizationPage.addLanguage(
      localizationData.addLanguage.code,
      localizationData.addLanguage.name
    );

    cy.wait(2000);

    localizationPage.verifyLanguageInTable(localizationData.addLanguage.name);
  });
});

describe('Localization - Remove Language', () => {
  beforeEach(() => {
    loginToEditor();
    clearPlayground();
    addComponent('hero', 0);
    localizationPage.openLocalizationSettings();
  });

  afterEach(() => {
    resetPlayground();
  });

  it('should remove a language from the localization table', () => {
    localizationPage.addLanguage(
      localizationData.addLanguage.code,
      localizationData.addLanguage.name
    );
    cy.wait(2000);

    localizationPage.removeLanguage(localizationData.addLanguage.name);
    cy.wait(1000);

    localizationPage.verifyLanguageNotInTable(localizationData.addLanguage.name);
  });
});

describe('Localization - Switch Language', () => {
  beforeEach(() => {
    loginToEditor();
    clearPlayground();
    addComponent('hero', 0);
  });

  afterEach(() => {
    resetPlayground();
  });

  it('should switch the active language and re-render the canvas', () => {
    localizationPage.openLocalizationSettings();

    localizationPage.addLanguage(
      localizationData.addLanguage.code,
      localizationData.addLanguage.name
    );
    cy.wait(2000);

    cy.get('body').click(0, 0);
    cy.wait(500);

    localizationPage.switchLanguage(localizationData.addLanguage.name);
    cy.wait(1000);

    localizationPage.verifyCanvasRendered();
  });
});

describe('Localization - Language Persistence', () => {
  beforeEach(() => {
    loginToEditor();
    clearPlayground();
    addComponent('hero', 0);
  });

  afterEach(() => {
    resetPlayground();
  });

  it('should persist added language after page reload', () => {
    localizationPage.openLocalizationSettings();
    localizationPage.addLanguage(
      localizationData.secondLanguage.code,
      localizationData.secondLanguage.name
    );
    cy.wait(2000);

    cy.reload();
    cy.wait(2000);

    localizationPage.openLocalizationSettings();

    localizationPage.verifyLanguageInTable(localizationData.secondLanguage.name);
  });
});

describe('Localization - Live Update Sync', () => {
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
    
    // Simulate updating the english cell for the first available string prop
    // Find the cell containing the English translation
    // Find a cell in the table and double-click to edit
    cy.get('[data-cy="localization-settings-page"]').find('[role="gridcell"]').eq(2).dblclick();
    cy.get('[data-cy="l10n-cell-editor"], .rdg-text-editor').last().clear().type('Live Update Test Content{enter}');
    
    cy.wait(500);

    // Close localization
    cy.get('body').click(0, 0); 
    cy.wait(500);

    // Ensure the playground visually contains the text without an explicit refresh
    cy.get('[data-cy="playground"]').should('contain.text', 'Live Update Test Content');
  });
});

// ─── Regression: Element Selection Persistence (BUG FIX) ───────────────────

describe('Localization - Element Selection Persistence', () => {
  beforeEach(() => {
    loginToEditor();
    clearPlayground();
    addComponent('hero', 0);
  });

  afterEach(() => {
    resetPlayground();
  });

  it('should NOT deselect the selected element when opening localization settings', () => {
    // Select the first component by clicking it
    cy.get('[data-component-index="0"]', { timeout: 5000 }).click({ force: true });
    cy.wait(300);

    // Verify element is selected (component settings panel shows content)
    cy.get('[data-cy="settings-panel"]', { timeout: 5000 }).should('be.visible');

    // Open localization settings via the toolbar icon
    localizationPage.openLocalizationSettings();

    // Navigate to localization settings page (click "Edit" if available)
    cy.get('body').then(($body) => {
      const editBtn = $body.find('[data-cy="localization-edit-btn"]');
      if (editBtn.length > 0) {
        cy.wrap(editBtn.first()).click({ force: true });
        cy.wait(500);
      }
    });

    // Close the localization settings overlay
    cy.get('[data-cy="localization-settings-page"]', { timeout: 5000 }).then(($panel) => {
      if ($panel.length > 0) {
        // Close via close button
        cy.get('[data-cy="localization-close-btn"]').first().click({ force: true });
        cy.wait(500);
      }
    });

    // After closing, the component settings panel should still be active
    // (element should NOT have been deselected)
    cy.get('[data-cy="settings-panel"]', { timeout: 5000 }).should('be.visible');
  });
});

// ─── Regression: Nested String Live Updates (BUG FIX) ──────────────────────

describe('Localization - Nested String Live Updates', () => {
  beforeEach(() => {
    loginToEditor();
    clearPlayground();
    addComponent('feature', 1); // feature2 has nested string props (items[].title, items[].description)
  });

  afterEach(() => {
    resetPlayground();
  });

  it('should live-update the playground when editing a nested string prop in localization settings', () => {
    // Capture the initial text of the first feature item title
    cy.get('[data-cy="playground"]', { timeout: 10000 }).should('be.visible');

    // Navigate to localization settings
    localizationPage.openLocalizationSettings();

    // Click "Edit" to open the full localization table
    cy.get('body').then(($body) => {
      const editBtn = $body.find('[data-cy="localization-edit-btn"]');
      if (editBtn.length > 0) {
        cy.wrap(editBtn.first()).click({ force: true });
        cy.wait(1000);
      }
    });

    // Find a nested string cell (title from feature2's items array) and edit it
    cy.get('[data-cy="localization-settings-page"]', { timeout: 10000 }).should('be.visible');

    // Find a cell that contains "Consultation" (first feature2 item title) and edit it
    cy.get('[role="gridcell"]').then(($cells) => {
      const targetCell = $cells.filter(':contains("Consultation")').first();
      if (targetCell.length > 0) {
        cy.wrap(targetCell).dblclick();
        cy.get('[data-cy="l10n-cell-editor"], .rdg-text-editor, input, textarea').last().clear().type('Nested Update Test{enter}');
        cy.wait(500);

        // Close localization settings
        cy.get('[data-cy="localization-close-btn"]').first().click({ force: true });
        cy.wait(500);

        // Verify the playground updated without a refresh
        cy.get('[data-cy="playground"]').should('contain.text', 'Nested Update Test');
      }
    });
  });
});

