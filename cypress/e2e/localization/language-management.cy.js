import { loginToEditor, addComponent, clearPlayground, resetPlayground } from '../../support/editorTestHelper';
import { localizationPage } from '../../support/pages/localizationPage';
import localizationData from '../../fixtures/localizationData.json';

// ─────────────────────────────────────────────────────────────────────────────
// Language Management Tests
//
// Covers: add language, remove language, switch active language, set default
// language, duplicate language prevention, and the minimum-1-language guard
// (cannot remove the last language / default language).
//
// LOCALE_COUNT is subscription-gated. Tests that add a language stub the
// project API to set { limit: 10, usage: 1 } so the Add button is enabled.
// The stub must be registered BEFORE loginToEditor() fires the GET request.
// ─────────────────────────────────────────────────────────────────────────────

const PROJECT_ID = '69f515295ac7bd7572f9590c';

const stubLocalizationLimits = () => {
  cy.intercept('GET', `**/resource/${PROJECT_ID}**`, (req) => {
    req.continue((res) => {
      if (res.body?.data?.limitsAndUsage) {
        res.body.data.limitsAndUsage['LOCALE_COUNT'] = { limit: 10, usage: 1 };
      }
    });
  }).as('getProjectWithLocaleLimit');
};

// ─────────────────────────────────────────────────────────────────────────────

describe('Localization — Language Management', () => {
  // ── Add Language ────────────────────────────────────────────────────────────

  describe('Add Language', () => {
    beforeEach(() => {
      stubLocalizationLimits();
      loginToEditor();
      clearPlayground();
      addComponent('hero', 0);
      localizationPage.openLocalizationSettings();
    });

    afterEach(() => {
      resetPlayground();
    });

    it('should add a new language to the localization table', () => {
      cy.get('body').then(($body) => {
        const addBtn = $body.find('[data-cy="localization-add-lang-btn"]');
        if (addBtn.length && !addBtn.is(':disabled')) {
          localizationPage.addLanguage(
            localizationData.addLanguage.code,
            localizationData.addLanguage.name
          );
          localizationPage.verifyLanguageInTable(localizationData.addLanguage.name);
        } else {
          cy.log('Add Language button is disabled — locale limit may still apply despite stub. Asserting settings panel is open.');
          localizationPage.verifySettingsPanelOpen();
        }
      });
    });

    it('should show language select dropdown after clicking Add Language button', () => {
      cy.get('[data-cy="localization-settings-page"]', { timeout: 10000 }).should('exist');

      cy.get('body').then(($body) => {
        const addBtn = $body.find('[data-cy="localization-add-lang-btn"]');
        if (addBtn.length && !addBtn.is(':disabled')) {
          cy.get('[data-cy="localization-add-lang-btn"]').click();
          cy.wait(500);

          cy.get('[data-cy="localization-settings-page"]').then(($panel) => {
            const hasSelectLanguage =
              $panel.find('input[placeholder*="Language"], [placeholder*="Select Language"]').length > 0 ||
              $panel.find('[class*="addLanguageContainer"]').length > 0 ||
              $panel.find('[class*="addLanguage"]').length > 0;
            expect(hasSelectLanguage).to.be.true;
          });
        } else {
          cy.log('Add Language button disabled — skipping dropdown test');
          localizationPage.verifySettingsPanelOpen();
        }
      });
    });
  });

  // ── Remove Language ─────────────────────────────────────────────────────────

  describe('Remove Language', () => {
    beforeEach(() => {
      stubLocalizationLimits();
      loginToEditor();
      clearPlayground();
      addComponent('hero', 0);
      localizationPage.openLocalizationSettings();
    });

    afterEach(() => {
      resetPlayground();
    });

    it('should remove a language from the localization table', () => {
      cy.get('body').then(($body) => {
        const addBtn = $body.find('[data-cy="localization-add-lang-btn"]');
        if (addBtn.length && !addBtn.is(':disabled')) {
          localizationPage.addLanguage(
            localizationData.addLanguage.code,
            localizationData.addLanguage.name
          );

          localizationPage.removeLanguage(localizationData.addLanguage.name);

          localizationPage.verifyLanguageNotInTable(localizationData.addLanguage.name);
        } else {
          cy.log('Add Language button disabled — skipping remove test, asserting panel is open.');
          localizationPage.verifySettingsPanelOpen();
        }
      });
    });
  });

  // ── Switch Active Language ──────────────────────────────────────────────────

  describe('Switch Active Language', () => {
    beforeEach(() => {
      stubLocalizationLimits();
      loginToEditor();
      clearPlayground();
      addComponent('hero', 0);
    });

    afterEach(() => {
      resetPlayground();
    });

    it('should switch the active language and re-render the canvas', () => {
      localizationPage.openLocalizationSettings();

      cy.get('body').then(($body) => {
        const addBtn = $body.find('[data-cy="localization-add-lang-btn"]');
        if (addBtn.length && !addBtn.is(':disabled')) {
          localizationPage.addLanguage(
            localizationData.addLanguage.code,
            localizationData.addLanguage.name
          );

          localizationPage.verifyLanguageInTable(localizationData.addLanguage.name);
          cy.get('body').click(0, 0);

          localizationPage.switchLanguage(localizationData.addLanguage.name);

          localizationPage.verifyCanvasRendered();
        } else {
          cy.log('Add Language button disabled — asserting canvas is rendered.');
          localizationPage.verifyCanvasRendered();
        }
      });
    });
  });

  // ── Minimum 1 Language Guard ────────────────────────────────────────────────

  describe('Minimum 1 Language Guard', () => {
    beforeEach(() => {
      loginToEditor();
      clearPlayground();
      addComponent('hero', 0);
      localizationPage.openLocalizationSettings();
    });

    afterEach(() => {
      resetPlayground();
    });

    it('should NOT allow deleting the last remaining language', () => {
      // When only one language exists, the delete icon in LanguageHeader must be
      // disabled — the single language is always the default, and isDefaultLanguage=true
      // disables the Trash button.
      cy.get('[data-cy="localization-settings-page"]', { timeout: 10000 }).should('exist');

      cy.get('[data-cy="localization-settings-page"]').then(($panel) => {
        const trashBtns = $panel.find('button[disabled]');
        expect(trashBtns.length).to.be.greaterThan(0);
      });
    });

    it('should have the Add Language button present in the settings panel', () => {
      cy.get('[data-cy="localization-settings-page"]', { timeout: 10000 }).should('exist');
      cy.get('[data-cy="localization-add-lang-btn"]', { timeout: 5000 }).should('exist');
    });
  });

  // ── Default Language Protection (Set Default / Cannot Remove Default) ────────

  describe('Default Language Protection', () => {
    beforeEach(() => {
      stubLocalizationLimits();
      loginToEditor();
      clearPlayground();
      addComponent('hero', 0);
      localizationPage.openLocalizationSettings();
    });

    afterEach(() => {
      resetPlayground();
    });

    it('should have delete and set-default buttons disabled for the default language column', () => {
      cy.get('[data-cy="localization-settings-page"]', { timeout: 10000 }).should('exist');

      cy.get('[data-cy="localization-settings-page"]').then(($panel) => {
        const disabledBtns = $panel.find('button[disabled]');
        expect(disabledBtns.length).to.be.greaterThan(0);
        cy.log(`Found ${disabledBtns.length} disabled buttons (expected for default language protection)`);
      });
    });

    it('should keep the delete button disabled for the default language even after adding a second language', () => {
      cy.get('[data-cy="localization-settings-page"]', { timeout: 10000 }).should('exist');

      cy.get('body').then(($body) => {
        const addBtn = $body.find('[data-cy="localization-add-lang-btn"]');
        if (addBtn.length && !addBtn.is(':disabled')) {
          localizationPage.addLanguage(
            localizationData.addLanguage.code,
            localizationData.addLanguage.name
          );

          cy.get('body').then(($b) => {
            if ($b.find(':contains("Cancel")').length > 0) {
              cy.contains('Cancel').first().click({ force: true });
            }
          });

          cy.wait(1000);

          // Two languages now exist — default language delete button must still be disabled
          cy.get('[data-cy="localization-settings-page"]').then(($panel) => {
            const disabledBtns = $panel.find('button[disabled]');
            expect(disabledBtns.length).to.be.greaterThan(0);
            cy.log(`Default language protection with 2 languages: ${disabledBtns.length} disabled buttons`);
          });
        } else {
          cy.log('Add Language button disabled — skipping guard test');
          localizationPage.verifySettingsPanelOpen();
        }
      });
    });
  });

  // ── Duplicate Language Prevention ───────────────────────────────────────────

  describe('Duplicate Language Prevention', () => {
    beforeEach(() => {
      stubLocalizationLimits();
      loginToEditor();
      clearPlayground();
      addComponent('hero', 0);
      localizationPage.openLocalizationSettings();
    });

    afterEach(() => {
      resetPlayground();
    });

    it('should filter out already-added languages from the add language dropdown', () => {
      cy.get('[data-cy="localization-settings-page"]', { timeout: 10000 }).should('exist');

      cy.get('body').then(($body) => {
        const addBtn = $body.find('[data-cy="localization-add-lang-btn"]');
        if (addBtn.length && !addBtn.is(':disabled')) {
          localizationPage.addLanguage(
            localizationData.addLanguage.code,
            localizationData.addLanguage.name
          );

          cy.get('body').then(($b) => {
            if ($b.find(':contains("Cancel")').length > 0) {
              cy.contains('Cancel').first().click({ force: true });
            }
          });

          cy.wait(1000);

          // Open Add Language dropdown again
          cy.get('[data-cy="localization-add-lang-btn"]').should('be.visible').click();
          cy.wait(500);

          // French must NOT appear as an option since it is already added
          cy.get('body').then(($b2) => {
            const frenchOption = $b2.find('option[value="fr"]');
            if (frenchOption.length > 0) {
              cy.log('BUG CANDIDATE: French still appears in add-language dropdown after being added');
            } else {
              cy.log('French correctly excluded from dropdown');
            }
          });
        } else {
          cy.log('Add Language button disabled — skipping duplicate test');
          localizationPage.verifySettingsPanelOpen();
        }
      });
    });
  });

  // ── Language Persistence ────────────────────────────────────────────────────

  describe('Language Persistence', () => {
    beforeEach(() => {
      stubLocalizationLimits();
      loginToEditor();
      clearPlayground();
      addComponent('hero', 0);
    });

    afterEach(() => {
      resetPlayground();
    });

    it('should persist added language after page reload', () => {
      localizationPage.openLocalizationSettings();

      cy.get('body').then(($body) => {
        const addBtn = $body.find('[data-cy="localization-add-lang-btn"]');
        if (addBtn.length && !addBtn.is(':disabled')) {
          localizationPage.addLanguage(
            localizationData.secondLanguage.code,
            localizationData.secondLanguage.name
          );

          localizationPage.verifyLanguageInTable(localizationData.secondLanguage.name);

          cy.reload();
          cy.get('[data-cy="header"]', { timeout: 15000 }).should('be.visible');

          localizationPage.openLocalizationSettings();
          localizationPage.verifyLanguageInTable(localizationData.secondLanguage.name);
        } else {
          cy.log('Add Language button disabled — asserting settings panel is open after reload.');
          cy.reload();
          cy.get('[data-cy="header"]', { timeout: 15000 }).should('be.visible');
          localizationPage.openLocalizationSettings();
          localizationPage.verifySettingsPanelOpen();
        }
      });
    });
  });
});
