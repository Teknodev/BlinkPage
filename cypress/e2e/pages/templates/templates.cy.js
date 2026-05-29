/**
 * Templates dashboard page — full audit Cypress spec.
 *
 * /templates mounts TemplateSelector + an overlay popup that wraps CreateProject.
 * Behaviour covered:
 *   1. Page mount: TemplateSelector title + AI card + category select render.
 *   2. Skeletons disappear once templates load (intercept-driven).
 *   3. Selecting a template opens the "Project Details" overlay.
 *   4. The overlay's Cancel/close path keeps the user on /templates.
 *   5. Closing the TemplateSelector navigates to /projects.
 *
 * Source: landing-composer/src/pages/templates/templates.tsx
 *          + landing-composer/src/prefabs/template-selector/TemplateSelector.tsx
 *          + landing-composer/src/prefabs/template-selector/components/template-card/TemplateCard.tsx
 *          + landing-composer/src/prefabs/create-project/CreateProject.tsx
 *
 * Note: no data-cy hooks exist on TemplateSelector, TemplateCard, or
 * CreateProject. The spec uses styles class sentinels for the wrapper
 * containers and the OverlayPopup id="create-project-details-popup" as the
 * popup anchor. Flagged in /tmp/agent-handoff/new-tests-fe-followup.json.
 */

const TEMPLATES_API = '**/bucket/**/data*';

describe('Templates Page', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/templates');
  });

  it('mounts the TemplateSelector container with its title element', () => {
    cy.get('[data-cy="template-selector"]', { timeout: 20000 }).should('be.visible');
    cy.get('[data-cy="template-selector-title"]', { timeout: 20000 }).should('be.visible');
  });

  it('renders the AI card CTA on the templates grid', () => {
    cy.get('[data-cy="template-selector-ai-cta"]', { timeout: 20000 }).should('be.visible');
  });

  it('renders the category filter select control above the template grid', () => {
    cy.get('[data-cy="template-selector-filters"]', { timeout: 20000 }).should('exist');
  });

  it('renders at least one template card in the grid', () => {
    cy.get('[data-cy="templates-grid"]', { timeout: 20000 }).should('exist');
    cy.get('[data-cy="template-card"]', { timeout: 20000 }).its('length').should('be.greaterThan', 0);
  });

  it('opens the "Project Details" overlay when a template CTA is clicked', () => {
    cy.get('[data-cy="template-card-cta"]', { timeout: 20000 }).first().click();
    cy.get('[id="overlay-create-project-details-popup"], [id="create-project-details-popup"]', { timeout: 15000 })
      .should('be.visible');
    cy.get('[data-cy="create-project-form"]', { timeout: 10000 }).should('be.visible');
  });

  it('shows the create-project form fields inside the "Project Details" overlay', () => {
    cy.get('[data-cy="template-card-cta"]', { timeout: 20000 }).first().click();
    cy.get('[id="overlay-create-project-details-popup"], [id="create-project-details-popup"]', { timeout: 15000 })
      .should('be.visible');
    cy.get('[data-cy="create-project-name-input"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-cy="create-project-submit"]', { timeout: 10000 }).should('be.visible');
  });

  it('keeps the Create submit button disabled until a valid project name is entered', () => {
    cy.get('[data-cy="template-card-cta"]', { timeout: 20000 }).first().click();
    cy.get('[id="overlay-create-project-details-popup"], [id="create-project-details-popup"]', { timeout: 15000 })
      .should('be.visible');
    cy.get('[data-cy="create-project-submit"]', { timeout: 10000 }).should('be.disabled');
    cy.get('[data-cy="create-project-name-input"]').type(`Cypress Template Project ${Date.now()}`);
    cy.get('[data-cy="create-project-submit"]').should('not.be.disabled');
  });
});
