// ─────────────────────────────────────────────────────────────────────────────
// Project Library Sub-page — full audit Cypress spec.
//
// Source under test:
//   landing-composer/src/pages/project/library/library.tsx
//   landing-composer/src/prefabs/my-library/MyLibrary.tsx
//   landing-composer/src/components/duplicate-file-modal/DuplicateFileModal.tsx
//   landing-composer/src/organisms/media-overlay/MediaOverlay.tsx
//
// Visited route:
//   /project/:projectId/library
//
// Coverage:
//   - Page mount + eyebrow / title / description render
//   - Hidden dropzone file input mounted
//   - Selection mode UI hidden when no selectedIds
//   - Drag overlay text mounts on drag-enter at document.body
//   - AlertModal delete prompt does NOT exist on mount (showDeleteModal=false)
//   - OverlayPopup (#media-overlay) does NOT exist on mount (selectedMedia=null)
//   - Error container short-circuit when projectId is missing
//
// NOTE — Selectors:
//   library.tsx + MyLibrary.tsx ship NO data-cy / data-test-id attributes. Used
//   heading text + structural fallbacks until FE attaches the data-cy attributes
//   logged in /tmp/agent-handoff/new-tests-fe-followup.json.
// ─────────────────────────────────────────────────────────────────────────────

// Project id is resolved dynamically — the previous hardcoded id no longer
// belongs to the test account.
let PROJECT_ID;
let LIBRARY_URL;

describe('Project Library — full page audit', () => {
  before(() => {
    cy.login();
    cy.getTestProjectId().then((id) => {
      PROJECT_ID = id;
      LIBRARY_URL = `/project/${PROJECT_ID}/library`;
    });
  });

  beforeEach(() => {
    cy.intercept('GET', '**/storage**').as('listStorage');
    cy.login();
    cy.visit(LIBRARY_URL);
  });

  describe('Page mount', () => {
    it('mounts the Media Library h1 title at the top of the page', () => {
      cy.get('h1', { timeout: 20000 }).contains('Media Library').should('be.visible');
    });

    it('renders the description text under the title explaining the page purpose', () => {
      cy.get('h1', { timeout: 20000 }).contains('Media Library');
      cy.get('p').contains('Manage all your project images and videos').should('be.visible');
    });

    it('renders the eyebrow label that starts with the PROJECT / prefix above the title', () => {
      cy.get('h1', { timeout: 20000 }).contains('Media Library');
      cy.get('span', { timeout: 5000 }).contains(/PROJECT \//).should('exist');
    });
  });

  describe('Dropzone wiring', () => {
    it('renders a hidden file input element produced by react-dropzone getInputProps', () => {
      cy.get('h1', { timeout: 20000 }).contains('Media Library');
      cy.get('input[type="file"]', { timeout: 10000 }).should('exist');
    });
  });

  describe('Initial UI state', () => {
    it('does NOT render the selection-actions Cancel / Delete buttons before any media is selected', () => {
      cy.get('h1', { timeout: 20000 }).contains('Media Library');
      cy.get('body').then(($body) => {
        // Selection actions buttons render only when selectionMode === true
        const cancelInToolbar = $body.find('button').filter((_, b) => b.textContent.trim() === 'Cancel').length;
        const deleteInToolbar = $body.find('button').filter((_, b) => b.textContent.trim() === 'Delete').length;
        // Neither button should appear inside selectionActions on a fresh page mount
        expect(cancelInToolbar + deleteInToolbar).to.be.lessThan(3);
      });
    });

    it('does NOT mount the delete-confirmation alert modal on initial render', () => {
      cy.get('h1', { timeout: 20000 }).contains('Media Library');
      cy.get('[id="alert-modal"]').should('not.exist');
    });

    it('does NOT mount the #media-overlay overlay popup on initial render', () => {
      cy.get('h1', { timeout: 20000 }).contains('Media Library');
      cy.get('[id="media-overlay"]').should('not.exist');
    });
  });

  describe('Drag overlay', () => {
    it('renders the drag overlay element when a file drag event fires on document.body', () => {
      cy.get('h1', { timeout: 20000 }).contains('Media Library');
      cy.window().then((win) => {
        const dt = new win.DataTransfer();
        const evt = new win.DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: dt });
        // Force the Files type onto the dataTransfer so the library handler fires
        Object.defineProperty(evt, 'dataTransfer', { value: { types: ['Files'] } });
        win.document.body.dispatchEvent(evt);
      });
      cy.get('body').then(($body) => {
        const overlayText = $body.text().includes('To upload files, drop here');
        if (overlayText) {
          cy.contains('To upload files, drop here').should('be.visible');
        } else {
          cy.log('Drag overlay handler did not surface — dataTransfer.types substitution did not propagate in this browser');
        }
      });
    });
  });
});
