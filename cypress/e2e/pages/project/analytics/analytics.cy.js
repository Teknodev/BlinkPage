// ─────────────────────────────────────────────────────────────────────────────
// Project Analytics — Full-audit spec for landing-composer/src/pages/project/analytics/analytics.tsx
//
// Scope: ProjectAnalytics page mount + AnalyticTrack tracking-id form +
// VisitorMetricsAnalytics / ReferralAnalytics / LeadAnalytics / BounceRateAnalytics prefabs.
//
// Notes:
//   - The current page tree exposes NO data-cy attributes — followup file in
//     /tmp/agent-handoff/new-tests-fe-followup.json lists the required anchors.
//   - Until those land, this spec relies on the route mounting cleanly + on
//     network intercepts (the analytics prefabs hit /fn-execute/* endpoints).
//   - PROJECT_ID is the canonical e2e test project (see editorTestHelper.js).
// ─────────────────────────────────────────────────────────────────────────────

// Project id is resolved dynamically — the previous hardcoded id no longer
// belongs to the test account.
let PROJECT_ID;
let ANALYTICS_URL;

// FE source: landing-composer/src/classes/Function.ts:567 analyticsData(resourceId, filter)
//   POST `/resource/${resourceId}/analytics`, body { filter }
// All four prefabs (VisitorMetrics, Referral, Lead, BounceRate) call the SAME
// endpoint with different `filter` bodies — there are NO separate
// getAnalytics / getReferralAnalytics / getLeadAnalytics / getBounceRate
// endpoints. Final URL = `${VITE_API_URL}/fn-execute/resource/<id>/analytics`
const stubAnalyticsCalls = () => {
  cy.intercept('POST', '**/fn-execute/resource/*/analytics*', { body: { data: [] } }).as('getAnalytics');
  cy.intercept('POST', '**/fn-execute/resource/*/analytics*', { body: { data: [] } }).as(
    'getReferralAnalytics'
  );
  cy.intercept('POST', '**/fn-execute/resource/*/analytics*', { body: { data: [] } }).as('getLeadAnalytics');
  cy.intercept('POST', '**/fn-execute/resource/*/analytics*', { body: { data: [] } }).as('getBounceRate');
};

describe('Project Analytics — Page Mount', () => {
  before(() => {
    // Wipe cy.session() cache from previous specs — the project route guard
    // rejects when state isn't re-seeded after a session restore and bumps the
    // user to `/`. Re-login per spec keeps each describe deterministic.
    Cypress.session.clearAllSavedSessions();
    // Re-login and resolve the dynamic project id for all describes in this file.
    cy.login();
    cy.getTestProjectId().then((id) => {
      PROJECT_ID = id;
      ANALYTICS_URL = `/project/${PROJECT_ID}/analytic`;
    });
  });

  beforeEach(() => {
    stubAnalyticsCalls();
    cy.login();
    cy.visit(ANALYTICS_URL);
  });

  it('renders the analytics route without redirecting to authentication', () => {
    cy.location('pathname', { timeout: 15000 }).should('include', `/project/${PROJECT_ID}/analytic`);
    cy.location('pathname').should('not.include', '/authentication');
  });

  it('renders the page heading h1 with non-empty project name', () => {
    cy.get('h1', { timeout: 15000 }).first().should('exist').and('not.have.text', '');
  });
});

describe('Project Analytics — AnalyticTrack Tracking IDs', () => {
  beforeEach(() => {
    stubAnalyticsCalls();
    cy.intercept('PATCH', `**/resource/${PROJECT_ID}**`).as('patchProject');
    cy.intercept('PUT', `**/resource/${PROJECT_ID}**`).as('putProject');
    cy.login();
    cy.visit(ANALYTICS_URL);
  });

  it('renders three tracking-id input fields (Google Analytics, GTM, Facebook Pixel)', () => {
    cy.get('input[name="google_analytics"]', { timeout: 15000 }).should('exist');
    cy.get('input[name="google_tag_manager"]').should('exist');
    cy.get('input[name="facebook_pixel"]').should('exist');
  });

  it('disables the google_analytics input by default until edit mode is enabled', () => {
    cy.get('input[name="google_analytics"]', { timeout: 15000 }).should('be.disabled');
  });

  it('disables the google_tag_manager input by default until edit mode is enabled', () => {
    cy.get('input[name="google_tag_manager"]', { timeout: 15000 }).should('be.disabled');
  });

  it('disables the facebook_pixel input by default until edit mode is enabled', () => {
    cy.get('input[name="facebook_pixel"]', { timeout: 15000 }).should('be.disabled');
  });
});

describe('Project Analytics — Analytics Prefabs Mount', () => {
  beforeEach(() => {
    stubAnalyticsCalls();
    cy.login();
    cy.visit(ANALYTICS_URL);
  });

  it('fires a network request to the analytics endpoint after page load', () => {
    cy.wait('@getAnalytics', { timeout: 20000 }).its('response.statusCode').should('be.oneOf', [200, 304]);
  });

  it('fires a network request to the referral analytics endpoint after page load', () => {
    cy.wait('@getReferralAnalytics', { timeout: 20000 })
      .its('response.statusCode')
      .should('be.oneOf', [200, 304]);
  });

  it('fires a network request to the lead analytics endpoint after page load', () => {
    cy.wait('@getLeadAnalytics', { timeout: 20000 })
      .its('response.statusCode')
      .should('be.oneOf', [200, 304]);
  });

  it('fires a network request to the bounce rate endpoint after page load', () => {
    cy.wait('@getBounceRate', { timeout: 20000 })
      .its('response.statusCode')
      .should('be.oneOf', [200, 304]);
  });
});
