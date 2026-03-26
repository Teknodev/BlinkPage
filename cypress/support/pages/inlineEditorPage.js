/**
 * Inline Editor Page Object
 * Encapsulates DOM interactions for the inline-editor Lexical integration.
 * All selectors use data-cy attributes exclusively.
 */
class InlineEditorPage {

  // ── Selectors ─────────────────────────────────────────────────────

  get blinkpageTags() {
    return cy.get('blinkpage');
  }

  getBlinkpageById(id) {
    return cy.get(`blinkpage#${id}`);
  }

  get activeEditor() {
    return cy.get('[contenteditable="true"]');
  }

  get toolbar() {
    return cy.get('[data-cy="editor-toolbar"]', { timeout: 5000 });
  }

  get boldButton() {
    return cy.get('[data-cy="toolbar-bold"]');
  }

  get italicButton() {
    return cy.get('[data-cy="toolbar-italic"]');
  }

  get underlineButton() {
    return cy.get('[data-cy="toolbar-underline"]');
  }

  get strikethroughButton() {
    return cy.get('[data-cy="toolbar-strikethrough"]');
  }

  // ── Actions ───────────────────────────────────────────────────────

  /**
   * Click a <blinkpage> tag to activate the inline editor.
   * @param {string} id - The blinkpage element id (format: componentId-propId)
   */
  activateEditor(id) {
    this.getBlinkpageById(id).should('be.visible').click();
  }

  /**
   * Type text into the currently active Lexical editor.
   * @param {string} text - Text to type
   */
  typeInEditor(text) {
    this.activeEditor.should('be.visible').type(text);
  }

  /**
   * Select all text in the active editor.
   */
  selectAllText() {
    this.activeEditor.type('{selectall}');
  }

  /**
   * Click outside the editor to deactivate and save changes.
   */
  clickOutside() {
    cy.get('body').click(0, 0);
  }

  /**
   * Apply bold formatting via toolbar button.
   */
  applyBold() {
    this.boldButton.should('be.visible').click();
  }

  /**
   * Apply italic formatting via toolbar button.
   */
  applyItalic() {
    this.italicButton.should('be.visible').click();
  }

  /**
   * Apply underline formatting via toolbar button.
   */
  applyUnderline() {
    this.underlineButton.should('be.visible').click();
  }

  /**
   * Apply strikethrough formatting via toolbar button.
   */
  applyStrikethrough() {
    this.strikethroughButton.should('be.visible').click();
  }

  /**
   * Undo last action (Cmd+Z on Mac).
   */
  undo() {
    this.activeEditor.type('{cmd+z}');
  }

  /**
   * Redo last undone action (Cmd+Shift+Z on Mac).
   */
  redo() {
    this.activeEditor.type('{cmd+shift+z}');
  }

  // ── Assertions ────────────────────────────────────────────────────

  /**
   * Verify the blinkpage tag contains expected text after deactivation.
   */
  verifyBlinkpageContent(id, expectedText) {
    this.getBlinkpageById(id)
      .should('be.visible')
      .and('contain.text', expectedText);
  }

  /**
   * Verify that the Lexical editor is visible (active).
   */
  verifyEditorIsActive() {
    this.activeEditor.should('exist').and('be.visible');
  }

  /**
   * Verify that no Lexical editor is visible (inactive).
   */
  verifyEditorIsInactive() {
    cy.get('[contenteditable="true"]').should('not.exist');
  }

  /**
   * Verify toolbar is visible with formatting buttons.
   */
  verifyToolbarVisible() {
    this.toolbar.should('be.visible');
    this.boldButton.should('exist');
    this.italicButton.should('exist');
    this.underlineButton.should('exist');
  }

  /**
   * Verify toolbar is not visible.
   */
  verifyToolbarNotVisible() {
    cy.get('[data-cy="editor-toolbar"]').should('not.exist');
  }

  /**
   * Verify a toolbar button is in the active state using data-active attribute.
   */
  verifyButtonIsActive(dataCy) {
    cy.get(`[data-cy="${dataCy}"]`).should('have.attr', 'data-active', 'true');
  }

  /**
   * Get all blinkpage tags within a specific component by its index.
   * @param {number} componentIndex - data-component-index value
   */
  getBlinkpageTagsInComponent(componentIndex) {
    return cy.get(`[data-component-index="${componentIndex}"] blinkpage`);
  }

  /**
   * Get the Nth blinkpage tag within a specific component.
   * @param {number} componentIndex - data-component-index value
   * @param {number} n - 0-based index of the blinkpage tag within the component
   */
  getNthBlinkpageInComponent(componentIndex, n) {
    return this.getBlinkpageTagsInComponent(componentIndex).eq(n);
  }
}

export const inlineEditorPage = new InlineEditorPage();
