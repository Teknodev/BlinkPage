/**
 * Shared helpers for any Cypress test that runs inside the editor/project.
 *
 * Usage:
 *   import { loginToEditor, addComponent, clearPlayground } from '../../support/editorTestHelper';
 *
 *   beforeEach(() => {
 *     loginToEditor();
 *     clearPlayground();
 *     addComponent('hero', 0);
 *     addComponent('team', 0);
 *   });
 */
import data from '../fixtures/data.json';

/** The fixed test project URL — all editor tests share this project. */
export const TEST_PROJECT_URL = '/project/69a67bd831a7705ee363b392/editor/0';

/**
 * Log in and navigate straight to the test project editor.
 * Goes directly to the auth page, fills in credentials, and waits for dashboard.
 */
export const loginToEditor = () => {
  // Go directly to the authentication page
  cy.visit('/authentication');

  // Fill in the email
  cy.get('[data-cy="email-input"]', { timeout: 10000 }).should('be.visible').clear().type(data.email);

  // Fill in the password
  cy.get('[data-cy="password-input"]', { timeout: 10000 }).should('be.visible').clear().type(data.password);

  // Click Sign In
  cy.get('[data-cy="signin-btn"]', { timeout: 5000 }).should('be.visible').click();

  // Wait for the dashboard to fully load — proves auth token is set
  cy.get('[data-cy="header"]', { timeout: 30000 }).should('be.visible');

  // Navigate to the test project editor (auth is ready)
  cy.visit(TEST_PROJECT_URL);

  // Wait for the page to be ready (canvas area visible)
  cy.wait(2000);
};

/**
 * Add a component to the canvas via the component picker UI.
 *
 * @param {string} category - The component category name (e.g., 'hero', 'team', 'header')
 * @param {number} componentIndex - The 0-based index of the component within the category
 *
 * How it works:
 *   1. Clicks the AddNewComponent placeholder or the add button between sections
 *   2. Clicks the category in the component picker sidebar
 *   3. Clicks the component thumbnail at the given index
 *   4. Waits for the component to render on the canvas
 */
export const addComponent = (category, componentIndex = 0) => {
  // Open the component picker — either click the empty-canvas placeholder
  // or click on the canvas to trigger the sidebar
  cy.get('body').then(($body) => {
    if ($body.find('[data-cy="add-component-placeholder"]').length > 0) {
      // Empty canvas — click the "Let's build something!" placeholder
      cy.get('[data-cy="add-component-placeholder"]').click();
    } else {
      // Canvas has components — click outside any component to deselect,
      // then the component picker should be in the left sidebar
      cy.get('body').click(0, 0);
      cy.wait(300);
    }
  });

  // Wait for the component picker sidebar to appear
  cy.get('[data-cy="component-categories"]', { timeout: 5000 }).should('be.visible');

  // Click the target category
  cy.get(`[data-cy="component-category-${category}"]`, { timeout: 10000 })
    .should('be.visible')
    .click();

  // Wait for the component thumbnails to appear and click the target one
  cy.get(`[data-cy="component-item-${componentIndex}"]`, { timeout: 5000 })
    .should('be.visible')
    .click();

  // Wait for the component to render on the canvas
  cy.wait(1000);
};

/**
 * Reset the playground to its saved state by reloading the page.
 */
export const resetPlayground = () => {
  cy.reload();
  cy.wait(2000);
};

/**
 * Delete all components from the playground canvas.
 * Recursively clicks each section and deletes it via the action menu.
 */
export const clearPlayground = () => {
  cy.wait(500);

  const deleteNextSection = () => {
    cy.get('body').then(($body) => {
      // Look for rendered component sections
      const sections = $body.find('[data-component-index]');
      if (sections.length === 0) return;

      cy.wrap(sections.first()).click({ force: true });
      cy.wait(300);

      cy.get('[data-cy="action-delete"]', { timeout: 5000 })
        .should('be.visible')
        .click({ force: true });

      cy.wait(500);
      deleteNextSection();
    });
  };

  deleteNextSection();

  // Ensures we do not race with React's render cycle before `addComponent` tries to find this placeholder.
  cy.get('[data-cy="add-component-placeholder"]', { timeout: 10000 }).should('exist');
};
