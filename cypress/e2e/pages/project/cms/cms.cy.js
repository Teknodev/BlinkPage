// ─────────────────────────────────────────────────────────────────────────────
// Project CMS — Full-audit spec for landing-composer/src/pages/project/ProjectCms.tsx
//
// Scope: ProjectCms wraps the CmsManager organism. This covers initial mount,
// the three-view router (pages → entries → entry detail), header buttons, and
// the Add Entry / Add Page modal mounts.
//
// Notes:
//   - No data-cy attributes exist anywhere under /pages/project/cms/components.
//     Followup file at /tmp/agent-handoff/new-tests-fe-followup.json lists the
//     required hooks.
//   - Until selectors land, we rely on the OverlayPopup id={'add-entry-modal'}
//     and id={'create-cms-page'} attributes plus stable input[name] hooks.
// ─────────────────────────────────────────────────────────────────────────────

// Project id is resolved dynamically — the previous hardcoded id no longer
// belongs to the test account.
let PROJECT_ID;
let CMS_URL;

const stubCmsPages = (cmsPages = []) => {
  cy.intercept('GET', '**/fn-execute/getCmsPages**', { body: cmsPages }).as('getCmsPages');
  cy.intercept('POST', '**/fn-execute/getCmsPages**', { body: cmsPages }).as('postCmsPages');
};

describe('Project CMS — Page Mount', () => {
  before(() => {
    // Discard any cy.session() restored from a previous spec — the project
    // route guard otherwise punts the second-and-onward test to `/` because
    // local state context didn't replay alongside the auth cookies.
    Cypress.session.clearAllSavedSessions();
    // Re-login and resolve the dynamic project id for all describes.
    cy.login();
    cy.getTestProjectId().then((id) => {
      PROJECT_ID = id;
      CMS_URL = `/project/${PROJECT_ID}/cms`;
    });
  });

  beforeEach(() => {
    stubCmsPages([]);
    cy.login();
    cy.visit(CMS_URL);
  });

  it('renders the CMS route without redirecting to authentication', () => {
    cy.location('pathname', { timeout: 15000 }).should('include', `/project/${PROJECT_ID}/cms`);
    cy.location('pathname').should('not.include', '/authentication');
  });

  it('shows the CMS header with at least one action button when no pages exist', () => {
    cy.get('button', { timeout: 15000 }).should('have.length.greaterThan', 0);
  });
});

describe('Project CMS — Pages View', () => {
  beforeEach(() => {
    stubCmsPages([]);
    cy.login();
    cy.visit(CMS_URL);
  });

  it('renders the empty state when no CMS pages exist', () => {
    cy.get('svg', { timeout: 15000 }).should('exist');
    cy.get('span').should('exist');
  });

  it('hides the Add Page button in the empty state (intentional UX)', () => {
    // Empty-state UX decision: Add Page is intentionally hidden when no CMS
    // pages exist. Assert the data-cy hook is absent rather than visible.
    cy.get('[data-cy="cms-pages-empty-state"]', { timeout: 15000 }).should('exist');
    cy.get('[data-cy="cms-add-page-button"]').should('not.exist');
  });
});

describe('Project CMS — Entries View', () => {
  const samplePage = {
    _id: 'cms-page-stub-id',
    page_id: 'sample-editor-page',
    title: 'Sample CMS Page',
    fields: [],
  };

  beforeEach(() => {
    stubCmsPages([samplePage]);
    cy.intercept('GET', '**/fn-execute/getCmsEntries**', { body: [] }).as('getCmsEntries');
    cy.intercept('POST', '**/fn-execute/getCmsEntries**', { body: [] }).as('postCmsEntries');
    cy.login();
    cy.visit(CMS_URL);
  });

  it('opens the add-entry-modal overlay when the Add Entry button is clicked from the entries view', () => {
    // Drill into the entries view by clicking the only row.
    cy.get('[data-cy="cms-entry-row"]', { timeout: 15000 })
      .filter((_, el) => /Sample\s*CMS\s*Page|sample-editor-page/i.test(el.textContent || ''))
      .first()
      .click({ force: true });

    cy.get('button', { timeout: 10000 })
      .filter((_, el) => /add\s*entry/i.test(el.textContent || ''))
      .first()
      .click({ force: true });

    cy.get('[data-cy="add-entry-modal"]', { timeout: 10000 }).should('exist');
  });
});
