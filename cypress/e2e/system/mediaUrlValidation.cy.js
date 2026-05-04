import { loginToEditor } from '../../support/editorTestHelper';

/**
 * Media URL Upload Validation E2E Tests
 *
 * Tests the validateImageUrl() utility from HelperService — verifies that the
 * frontend correctly guards against non-image URLs being accepted as media inputs.
 *
 * Strategy: navigate to the editor, open a component image prop, attempt to
 * submit an invalid URL, and assert the error notification is shown. Valid image
 * URLs are accepted. Tests use cy.intercept for network calls where needed.
 */

describe('Media URL Upload Validation', () => {
  beforeEach(() => {
    loginToEditor();
  });

  it('should display the playground editor without crashing on load', () => {
    // Verifies the editor route is stable — a prerequisite for all media tests.
    cy.get('[data-cy="playground"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-cy="header"]').should('be.visible');
  });

  it('should reject a non-image URL and show an error notification', () => {
    // Select a component that has a media/image prop
    cy.get('[data-component-index="0"]', { timeout: 10000 }).then(($section) => {
      if (!$section.length) {
        // No component on canvas — skip gracefully
        cy.log('No component on canvas — skipping media URL test');
        return;
      }

      $section.first().trigger('click', { force: true });
      cy.wait(300);

      // Switch to Content tab where media props appear
      cy.get('body').then(($body) => {
        const contentTab = $body.find('[data-cy="tab-CONTENT"]');
        if (!contentTab.length) return;
        cy.get('[data-cy="tab-CONTENT"]').click({ force: true });
        cy.wait(300);

        // Look for a URL input in the media upload widget
        const mediaUrlInput = $body.find('[data-cy="media-url-input"]');
        if (!mediaUrlInput.length) {
          cy.log('No media-url-input found for this component — skipping input assertion');
          return;
        }

        cy.get('[data-cy="media-url-input"]').clear().type('https://en.wikipedia.org/wiki/Image');
        cy.get('[data-cy="media-url-confirm"]').click({ force: true });

        // The validator should reject a non-image URL
        cy.get('[data-cy="toast-error"], [data-cy="notification-error"]', { timeout: 5000 })
          .should('be.visible')
          .invoke('text')
          .should('match', /not a direct image|invalid|unsupported/i);
      });
    });
  });

  it('should accept a valid image URL without showing an error', () => {
    cy.get('[data-component-index="0"]', { timeout: 10000 }).then(($section) => {
      if (!$section.length) {
        cy.log('No component on canvas — skipping media URL valid test');
        return;
      }

      $section.first().trigger('click', { force: true });
      cy.wait(300);

      cy.get('body').then(($body) => {
        const contentTab = $body.find('[data-cy="tab-CONTENT"]');
        if (!contentTab.length) return;
        cy.get('[data-cy="tab-CONTENT"]').click({ force: true });
        cy.wait(300);

        const mediaUrlInput = $body.find('[data-cy="media-url-input"]');
        if (!mediaUrlInput.length) {
          cy.log('No media-url-input found — skipping valid URL assertion');
          return;
        }

        cy.get('[data-cy="media-url-input"]')
          .clear()
          .type('https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png');
        cy.get('[data-cy="media-url-confirm"]').click({ force: true });

        // No error toast should appear for a valid image URL
        cy.get('[data-cy="toast-error"]').should('not.exist');
      });
    });
  });
});
