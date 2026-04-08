/**
 * Localization Page Object
 * Encapsulates DOM interactions for the localization settings panel.
 * All selectors use data-cy attributes exclusively.
 */
class LocalizationPage {

  // ── Selectors ─────────────────────────────────────────────────────────

  /** The localization settings icon / button in the right sidebar */
  get localizationIcon() {
    return cy.get('[data-cy="localization-icon"]', { timeout: 10000 });
  }

  /** The localization settings panel (once opened) */
  get settingsPanel() {
    return cy.get('[data-cy="localization-settings-page"]', { timeout: 10000 });
  }

  /** Add language button / trigger */
  get addLanguageButton() {
    return cy.get('[data-cy="localization-add-lang-btn"]', { timeout: 5000 });
  }

  /** The localization table container */
  get table() {
    return cy.get('[data-cy="localization-table"]', { timeout: 10000 });
  }

  // ── Actions ───────────────────────────────────────────────────────────

  /**
   * Open the localization settings panel from the right sidebar.
   */
  openLocalizationSettings() {
    this.localizationIcon.should('be.visible').click();
  }

  /**
   * Add a new language via the localization settings UI.
   * @param {string} languageCode - The language code to add (e.g., "fr")
   * @param {string} languageName - The display name of the language (e.g., "French")
   */
  addLanguage(languageCode, languageName) {
    this.addLanguageButton.should('be.visible').click();
    cy.wait(500);
    cy.contains(languageName, { timeout: 5000 }).should('be.visible').click();
  }

  /**
   * Remove a language by clicking its delete/remove button in the header.
   * @param {string} languageName - The display name to find
   */
  removeLanguage(languageName) {
    cy.contains(languageName)
      .closest('[data-cy="localization-lang-header"]')
      .find('[data-cy="localization-remove-lang"]')
      .click({ force: true });

    // Confirm deletion if a confirmation dialog appears
    cy.get('body').then(($body) => {
      if ($body.find('[data-cy="confirm-modal"]').length > 0) {
        cy.get('[data-cy="confirm-modal-yes"]').click();
      }
    });
  }

  /**
   * Switch the active language via the language manager.
   * @param {string} languageName - The display name of the language to switch to
   */
  switchLanguage(languageName) {
    cy.get('[data-cy="localization-lang-switcher"]')
      .contains(languageName)
      .should('be.visible')
      .click();
  }

  /**
   * Close the localization settings panel.
   */
  closeSettings() {
    cy.get('[data-cy="localization-close-btn"]').click();
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
   * We check that the editor playground is still visible.
   */
  verifyCanvasRendered() {
    cy.get('[data-cy="playground"]', { timeout: 15000 }).should('be.visible');
  }
}

export const localizationPage = new LocalizationPage();
