/**
 * Localization Page Object
 * Encapsulates DOM interactions for the localization settings panel.
 */
class LocalizationPage {

  // ── Selectors ─────────────────────────────────────────────────────────

  /** The localization settings icon / button in the right sidebar */
  get localizationIcon() {
    return cy.get('[class*="localization"]').first();
  }

  /** The localization settings panel (once opened) */
  get settingsPanel() {
    return cy.get('[class*="localization"]', { timeout: 10000 });
  }

  /** Add language button / trigger */
  get addLanguageButton() {
    return cy.contains('button', 'Add', { timeout: 5000 });
  }

  /** Language select dropdown (appears after clicking Add) */
  get languageSelect() {
    return cy.get('select, [class*="select"], [class*="dropdown"]', { timeout: 5000 }).last();
  }

  /** All language column headers in the localization table */
  get languageColumns() {
    return cy.get('[class*="table"] th, [class*="header"] [class*="column"]');
  }

  /** The localization table container */
  get table() {
    return cy.get('[class*="table"]', { timeout: 10000 });
  }

  /** Language manager (language switcher in left sidebar / toolbar) */
  get languageSwitcher() {
    return cy.get('[class*="language"], [class*="locale"]');
  }

  // ── Actions ───────────────────────────────────────────────────────────

  /**
   * Open the localization settings panel from the right sidebar.
   */
  openLocalizationSettings() {
    // Click the localization icon in the right sidebar
    cy.get('[class*="right"]', { timeout: 10000 })
      .find('[class*="localization"], [class*="language"]')
      .first()
      .should('be.visible')
      .click();
  }

  /**
   * Add a new language via the localization settings UI.
   * @param {string} languageCode - The language code to add (e.g., "fr")
   * @param {string} languageName - The display name of the language (e.g., "French")
   */
  addLanguage(languageCode, languageName) {
    this.addLanguageButton.should('be.visible').click();
    // Wait for a dropdown/select to appear and select the language
    cy.wait(500);

    // Try clicking on the language in the dropdown
    cy.contains(languageName, { timeout: 5000 }).should('be.visible').click();
  }

  /**
   * Remove a language by clicking its delete/remove button in the header.
   * @param {string} languageName - The display name to find
   */
  removeLanguage(languageName) {
    // Find the column header for this language and click the remove action
    cy.contains(languageName)
      .parents('[class*="header"], th')
      .first()
      .find('[class*="delete"], [class*="remove"], button')
      .last()
      .click({ force: true });

    // Confirm deletion if a confirmation dialog appears
    cy.get('body').then(($body) => {
      if ($body.find('[class*="confirm"], [class*="modal"]').length > 0) {
        cy.contains('button', /confirm|yes|delete/i).click();
      }
    });
  }

  /**
   * Switch the active language via the language manager.
   * @param {string} languageName - The display name of the language to switch to
   */
  switchLanguage(languageName) {
    this.languageSwitcher
      .contains(languageName)
      .should('be.visible')
      .click();
  }

  // ── Assertions ────────────────────────────────────────────────────────

  /**
   * Verify that the localization settings panel is visible.
   */
  verifySettingsPanelOpen() {
    this.settingsPanel.should('be.visible');
  }

  /**
   * Verify a language appears in the localization table columns.
   * @param {string} languageName - The language name to check for
   */
  verifyLanguageInTable(languageName) {
    cy.contains(languageName, { timeout: 10000 }).should('be.visible');
  }

  /**
   * Verify a language does NOT appear in the table.
   * @param {string} languageName - The language name to verify is absent
   */
  verifyLanguageNotInTable(languageName) {
    cy.contains(languageName).should('not.exist');
  }

  /**
   * Verify the canvas re-rendered after a language switch.
   * We check that the editor canvas is still visible (re-render completed).
   */
  verifyCanvasRendered() {
    cy.get('[class*="canvas"]', { timeout: 15000 }).should('be.visible');
  }
}

export const localizationPage = new LocalizationPage();
