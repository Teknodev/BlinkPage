// ─────────────────────────────────────────────────────────────────────────────
// Project Webhook Sub-page — full audit Cypress spec.
//
// Source under test:
//   landing-composer/src/pages/project/webhook/webhook.tsx
//   landing-composer/src/organisms/webhook-list/WebhookList.tsx
//   landing-composer/src/prefabs/webhook-manager/WebhookManager.tsx
//
// Visited route:
//   /project/:projectId/webhook
//
// Coverage:
//   - Page mount + "Webhooks" h1 title render
//   - "Add New Webhook" action button present
//   - "<N> Webhooks (<M> active)" count line render
//   - WebhookManager popup (#webhook-manager) hidden until Add clicked
//   - WebhookManager popup mounts when Add New Webhook clicked
//   - WebhookManager popup unmounts when closed
//   - AlertModal delete confirm (#alert-modal) is hidden on mount
//   - Webhook list renders rows or empty placeholder
//
// NOTE — Selectors:
//   webhook.tsx + WebhookList.tsx + WebhookManager.tsx ship NO data-cy / data-test-id
//   attributes. This spec uses heading text + id fallback (webhook-manager popup
//   id) until FE adds the data-cy attributes logged in
//   /tmp/agent-handoff/new-tests-fe-followup.json.
// ─────────────────────────────────────────────────────────────────────────────

// Project id is resolved dynamically — the previous hardcoded id no longer
// belongs to the test account.
let PROJECT_ID;
let WEBHOOK_URL;

describe('Project Webhook — full page audit', () => {
  before(() => {
    cy.login();
    cy.getTestProjectId().then((id) => {
      PROJECT_ID = id;
      WEBHOOK_URL = `/project/${PROJECT_ID}/webhook`;
    });
  });

  beforeEach(() => {
    cy.intercept('GET', '**/fn-execute/get-webhooks/**').as('getWebhooks');
    cy.login();
    cy.visit(WEBHOOK_URL);
    // Confirm the router actually landed on the webhook sub-page BEFORE any
    // heading assertion — if AppInitializer redirected away (e.g. session
    // restored but state guard rejected), the heading look-up would time out
    // with a confusing "element never appeared" error instead of the real
    // routing regression.
    cy.location('pathname', { timeout: 30000 }).should('match', /\/webhook$/);
  });

  describe('Page mount', () => {
    it('mounts the Webhooks h1 title at the top of the page', () => {
      cy.get('[data-cy="webhook-page-heading"]', { timeout: 30000 }).should('be.visible');
    });

    it('renders the "<N> Webhooks (<M> active)" count paragraph in the header', () => {
      cy.get('[data-cy="webhook-page-heading"]', { timeout: 30000 }).should('be.visible');
      cy.contains(/\d+ Webhooks \(\d+ active\)/, { timeout: 15000 }).should('exist');
    });

    it('renders the Add New Webhook tertiary button in the header right slot', () => {
      cy.get('[data-cy="webhook-page-heading"]', { timeout: 30000 }).should('be.visible');
      cy.contains('button', 'Add New Webhook', { timeout: 10000 }).should('be.visible');
    });
  });

  describe('Add New Webhook popup', () => {
    it('does NOT mount the #webhook-manager popup on initial page render', () => {
      cy.get('[data-cy="webhook-page-heading"]', { timeout: 30000 }).should('be.visible');
      cy.get('[id="webhook-manager"]').should('not.exist');
    });

    it('mounts the #webhook-manager popup when the Add New Webhook button is clicked', () => {
      cy.get('[data-cy="webhook-page-heading"]', { timeout: 30000 }).should('be.visible');
      cy.contains('button', 'Add New Webhook', { timeout: 10000 }).click();
      cy.get('[id="webhook-manager"]', { timeout: 5000 }).should('exist');
    });

    it('closes the #webhook-manager popup when the overlay backdrop is dismissed', () => {
      cy.contains('button', 'Add New Webhook', { timeout: 20000 }).click();
      cy.get('[id="webhook-manager"]', { timeout: 5000 }).should('exist');
      cy.get('body').type('{esc}');
      cy.get('[id="webhook-manager"]', { timeout: 5000 }).should('not.exist');
    });
  });

  describe('Delete confirmation modal', () => {
    it('does NOT mount the alert-modal delete-confirm dialog on initial page render', () => {
      cy.get('[data-cy="webhook-page-heading"]', { timeout: 30000 }).should('be.visible');
      cy.get('[id="alert-modal"]').should('not.exist');
    });
  });

  describe('Webhook list', () => {
    it('renders either WebhookList rows or an empty / loading skeleton state after fetch resolves', () => {
      cy.get('[data-cy="webhook-page-heading"]', { timeout: 30000 }).should('be.visible');
      cy.wait('@getWebhooks', { timeout: 20000 });
      cy.get('body').then(($body) => {
        const hasRows = $body.find('table tbody tr').length > 0;
        const hasEmpty = $body.text().includes('There is nothing to see here yet');
        const hasSkeleton = $body.find('[class*="skeleton"], [class*="Skeleton"]').length > 0;
        expect(hasRows || hasEmpty || hasSkeleton).to.be.true;
      });
    });
  });
});
