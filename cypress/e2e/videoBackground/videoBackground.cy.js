import { loginToEditor, addComponent, clearPlayground, resetPlayground } from '../../support/editorTestHelper';

/**
 * Video Background E2E Tests
 *
 * Covers the Video tab in the Background category of the Design tab.
 * Video backgrounds store configuration as CSS custom properties
 * (--bg-video-url, --bg-video-loop, etc.) and inject <video> DOM
 * elements via the applyVideoBackgrounds() layer.
 *
 * Test coverage:
 *   - Setting a video URL and verifying the preview appears
 *   - Removing a video via the remove button
 *   - Verifying playback toggle controls exist
 *   - Verifying state persists after page refresh (hydration)
 */

// ── Helpers ─────────────────────────────────────────────────────

const TEST_VIDEO_URL = 'https://samplelib.com/mp4/sample-5s.mp4';

/**
 * Click a component section's container, switch to Design tab,
 * then expand the Background section.
 */
const openBackgroundPanel = () => {
  // Click the first component section to select it
  cy.get('[data-component-index="0"]', { timeout: 10000 }).click({ force: true });
  cy.wait(500);

  // Switch to the Design tab
  cy.get('[data-cy="tab-Design"]', { timeout: 5000 }).should('be.visible').click();
  cy.wait(500);
};

/**
 * Click the "Video" tab inside the Background section's SegmentedTab.
 */
const switchToVideoTab = () => {
  // SegmentedTab renders buttons with the option label text
  cy.contains('button', 'Video').should('be.visible').click();
  cy.wait(300);
};

// ── Setting Video URL ───────────────────────────────────────────

describe('Video Background - Set & Remove', () => {
  beforeEach(() => {
    loginToEditor();
    clearPlayground();
    addComponent('hero', 0);
  });

  afterEach(() => {
    resetPlayground();
  });

  it('should display an empty URL input when Video tab is selected', () => {
    openBackgroundPanel();
    switchToVideoTab();

    cy.get('[data-cy="video-bg-panel"]', { timeout: 5000 }).should('be.visible');
    cy.get('[data-cy="video-bg-url-input"]').should('be.visible');
    cy.get('[data-cy="video-bg-preview"]').should('not.exist');
  });

  it('should show video preview and config after entering a URL', () => {
    openBackgroundPanel();
    switchToVideoTab();

    // Enter a video URL
    cy.get('[data-cy="video-bg-url-input"]')
      .should('be.visible')
      .clear()
      .type(TEST_VIDEO_URL);

    cy.wait(1000);

    // Preview should appear
    cy.get('[data-cy="video-bg-preview"]', { timeout: 5000 }).should('be.visible');

    // URL edit input should show the URL
    cy.get('[data-cy="video-bg-url-edit"]').should('have.value', TEST_VIDEO_URL);

    // Playback toggles should be visible
    cy.get('[data-cy="video-bg-toggles"]').should('be.visible');
    cy.get('[data-cy="video-bg-toggles"]').contains('Loop');
    cy.get('[data-cy="video-bg-toggles"]').contains('Muted');
    cy.get('[data-cy="video-bg-toggles"]').contains('Autoplay');
  });

  it('should remove video when clicking the remove button', () => {
    openBackgroundPanel();
    switchToVideoTab();

    // Set a video first
    cy.get('[data-cy="video-bg-url-input"]')
      .should('be.visible')
      .clear()
      .type(TEST_VIDEO_URL);

    cy.wait(1000);

    // Preview should appear
    cy.get('[data-cy="video-bg-preview"]', { timeout: 5000 }).should('be.visible');

    // Click remove button (hover overlay)
    cy.get('[data-cy="video-bg-remove-btn"]').click({ force: true });
    cy.wait(500);

    // Should go back to empty URL input state
    cy.get('[data-cy="video-bg-url-input"]', { timeout: 5000 }).should('be.visible');
    cy.get('[data-cy="video-bg-preview"]').should('not.exist');
  });
});

// ── State Persistence ───────────────────────────────────────────

describe('Video Background - Persistence', () => {
  beforeEach(() => {
    loginToEditor();
    clearPlayground();
    addComponent('hero', 0);
  });

  afterEach(() => {
    resetPlayground();
  });

  it('should restore video config after page refresh', () => {
    openBackgroundPanel();
    switchToVideoTab();

    // Set a video URL
    cy.get('[data-cy="video-bg-url-input"]')
      .should('be.visible')
      .clear()
      .type(TEST_VIDEO_URL);

    cy.wait(1500);

    // Confirm preview is showing
    cy.get('[data-cy="video-bg-preview"]', { timeout: 5000 }).should('be.visible');

    // Reload the page
    cy.reload();
    cy.wait(3000);

    // Re-open the design tab and background
    openBackgroundPanel();

    // The Video tab should auto-select (hydration from saved CSS vars)
    cy.get('[data-cy="video-bg-panel"]', { timeout: 10000 }).should('be.visible');

    // Preview should still be showing
    cy.get('[data-cy="video-bg-preview"]').should('be.visible');

    // URL should be preserved
    cy.get('[data-cy="video-bg-url-edit"]').should('have.value', TEST_VIDEO_URL);
  });
});
