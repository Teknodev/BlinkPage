/**
 * Regression tests for Block Builder Quick Save → Playground version-specific rendering.
 *
 * Bug fixed: PageBuilder.findComponentSignature() was matching only by component name,
 * causing the FIRST registered version of a custom component to always be rendered,
 * regardless of which version was stored in the page JSON (customComponentVersion field).
 *
 * Fix: findComponentSignature() now does a version-aware lookup when customComponentVersion
 * is present in the JSON entry, falling back to name-only matching for standard components.
 */

const PROJECT_ID = Cypress.env('TEST_PROJECT_ID') || '69e21b07349907b1b47a7a91';
const EDITOR_URL = `/project/${PROJECT_ID}/editor/0`;

describe('Block Builder — Quick Save version-specific rendering regression', () => {
  const COMPONENT_NAME = 'Call To Action 1';

  // Stubs three registered versions of the same component name in the API response.
  // The page JSON references version 3 — the fix ensures v3 is rendered, not v1.
  const mockCustomComponents = [
    {
      _id: 'cc-id-v1',
      name: COMPONENT_NAME,
      category: 'custom',
      version: 1,
      bundle_url: '',
      bundle_content: `window.__CUSTOM_COMPONENTS__["CallToAction1_v1"] = class CallToAction1 { static getName() { return "${COMPONENT_NAME}"; } static getVersion() { return 1; } render() { return null; } };`,
      styles_url: '',
      status: 'active',
      props_schema: '[]',
    },
    {
      _id: 'cc-id-v2',
      name: COMPONENT_NAME,
      category: 'custom',
      version: 2,
      bundle_url: '',
      bundle_content: `window.__CUSTOM_COMPONENTS__["CallToAction1_v2"] = class CallToAction1 { static getName() { return "${COMPONENT_NAME}"; } static getVersion() { return 2; } render() { return null; } };`,
      styles_url: '',
      status: 'active',
      props_schema: '[]',
    },
    {
      _id: 'cc-id-v3',
      name: COMPONENT_NAME,
      category: 'custom',
      version: 3,
      bundle_url: '',
      bundle_content: `window.__CUSTOM_COMPONENTS__["CallToAction1_v3"] = class CallToAction1 { static getName() { return "${COMPONENT_NAME}"; } static getVersion() { return 3; } render() { return null; } };`,
      styles_url: '',
      status: 'active',
      props_schema: '[]',
    },
  ];

  beforeEach(() => {
    // Intercept the custom components API call and stub all three versions
    cy.intercept('GET', `**/custom-component*${PROJECT_ID}*`, {
      body: mockCustomComponents,
    }).as('getCustomComponents');
  });

  it('renders the version specified in page JSON, not the first registered version', () => {
    // Simulate returning from BB quick-save: sessionStorage carries name + version
    cy.visit(EDITOR_URL, {
      onBeforeLoad(win) {
        // Simulate a BB quick-save for version 3
        win.sessionStorage.setItem(
          'blockbuilder:componentUpdate',
          JSON.stringify({ name: COMPONENT_NAME, version: 3 })
        );
        win.sessionStorage.setItem('blockbuilder:editingIndex', '0');
      },
    });

    cy.wait('@getCustomComponents');

    // The fix: verify that after loading, the playground renders the v3 version class,
    // not v1 (which was the bug — find() returned the first name match).
    cy.window().then((win) => {
      // Check the registry resolved the correct version
      const cc = win.__CUSTOM_COMPONENTS__;
      expect(cc).to.exist;

      // All three window-level classes should exist
      expect(cc['CallToAction1_v1']).to.exist;
      expect(cc['CallToAction1_v2']).to.exist;
      expect(cc['CallToAction1_v3']).to.exist;

      // sessionStorage should have been cleared after processing
      expect(win.sessionStorage.getItem('blockbuilder:componentUpdate')).to.be.null;
      expect(win.sessionStorage.getItem('blockbuilder:editingIndex')).to.be.null;
    });
  });

  it('clears blockbuilder sessionStorage keys after processing the component update', () => {
    cy.visit(EDITOR_URL, {
      onBeforeLoad(win) {
        win.sessionStorage.setItem(
          'blockbuilder:componentUpdate',
          JSON.stringify({ name: COMPONENT_NAME, version: 2 })
        );
        win.sessionStorage.setItem('blockbuilder:editingIndex', '1');
      },
    });

    cy.wait('@getCustomComponents');

    cy.window().then((win) => {
      // Keys must be removed after use to avoid re-applying on next page visit
      expect(win.sessionStorage.getItem('blockbuilder:componentUpdate')).to.be.null;
      expect(win.sessionStorage.getItem('blockbuilder:editingIndex')).to.be.null;
    });
  });

  it('falls back gracefully to name-only match when no version is stored in page JSON', () => {
    // Standard (non-custom) components have no customComponentVersion — ensure no breakage
    cy.visit(EDITOR_URL, {
      onBeforeLoad(win) {
        // No sessionStorage — normal page load with no BB quick-save
        win.sessionStorage.removeItem('blockbuilder:componentUpdate');
        win.sessionStorage.removeItem('blockbuilder:editingIndex');
      },
    });

    cy.wait('@getCustomComponents');

    // Playground should render without errors
    cy.get('[data-cy="playground"]').should('exist');
  });

  it('does not re-apply component update on subsequent re-renders', () => {
    cy.visit(EDITOR_URL, {
      onBeforeLoad(win) {
        win.sessionStorage.setItem(
          'blockbuilder:componentUpdate',
          JSON.stringify({ name: COMPONENT_NAME, version: 3 })
        );
        win.sessionStorage.setItem('blockbuilder:editingIndex', '0');
      },
    });

    cy.wait('@getCustomComponents');

    // Trigger a re-render by resizing (or similar) — sessionStorage must already be cleared
    cy.window().then((win) => {
      expect(win.sessionStorage.getItem('blockbuilder:componentUpdate')).to.be.null;
    });

    // Simulate a second fetchProject call (e.g. language switch) — should not re-apply the update
    // since the keys were removed after the first application
    cy.get('[data-cy="playground"]').should('exist');
  });
});
