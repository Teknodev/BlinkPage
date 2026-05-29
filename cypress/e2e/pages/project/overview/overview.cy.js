/**
 * Project Overview page — full-audit Cypress spec.
 *
 * Source under test: landing-composer/src/pages/project/overview/overview.tsx
 *
 * Auth: programmatic via cy.login(); each test visits the fixed test project's
 * overview route in beforeEach() so the page is freshly mounted per it().
 *
 * Selectors: NO data-cy attributes currently exist on this page or its children.
 * Until the FE pass lands (see /tmp/agent-handoff/new-tests-fe-followup.json),
 * specs target via structural hooks:
 *   - Portal id="overlay-project-delete-modal" for the delete AlertModal.
 *   - Portal id="overlay-duplicate-file-modal" for the duplicate-file modal.
 *   - Buttons by their literal label inside the page container.
 * These fallbacks are intentionally narrow and documented; replace once data-cy
 * arrives.
 */

// Project id is resolved dynamically in before() via cy.getTestProjectId()
// so the suite works against any user fixture (the previous hardcoded id
// no longer belongs to the test account).
let PROJECT_ID;
let OVERVIEW_URL;

describe("Project Overview — page mount + favicon + name + actions", () => {
  before(() => {
    cy.login();
    cy.getTestProjectId().then((id) => {
      PROJECT_ID = id;
      OVERVIEW_URL = `/project/${PROJECT_ID}/overview`;
    });
  });

  beforeEach(() => {
    cy.login();
    cy.visit(OVERVIEW_URL);
    // Wait until either the favicon-area or the action buttons mount, whichever
    // surfaces first — covers the project-loading skeleton period.
    cy.get(
      'button, input[type="file"]',
      { timeout: 30000 }
    ).should("exist");
  });

  // ───── Page mount ────────────────────────────────────────────────────────

  it("should land on the /project/:id/overview route after navigation", () => {
    cy.location("pathname").should("eq", OVERVIEW_URL);
  });

  it("should render at least one Button on the overview page once it has loaded", () => {
    cy.get("button").should("have.length.greaterThan", 0);
  });

  // ───── Project name input + edit/save toggle ─────────────────────────────

  it("should render a readonly project name input on initial mount", () => {
    cy.get('[data-cy="project-name-input"]')
      .should("have.attr", "readonly");
  });

  it("should enable the project name input when the Edit button is clicked", () => {
    cy.get('[data-cy="project-name-edit-btn"]')
      .should("be.visible")
      .click();
    cy.get('[data-cy="project-name-input"]')
      .should("not.have.attr", "readonly");
  });

  it("should switch the Edit button label to Save while the name input is editable", () => {
    cy.get('[data-cy="project-name-edit-btn"]').click();
    cy.get('[data-cy="project-name-save-btn"]').should("be.visible");
  });

  it("should restore the original project name when an invalid (too short) name is entered and Save is pressed", () => {
    cy.get('[data-cy="project-name-input"]')
      .invoke("val")
      .then((originalName) => {
        cy.get('[data-cy="project-name-edit-btn"]').click();
        cy.get('[data-cy="project-name-input"]')
          .clear()
          .type("ab"); // < 3 chars -> validateProjectName fails
        cy.get('[data-cy="project-name-save-btn"]').click();
        cy.get('[data-cy="project-name-input"]')
          .should("have.value", originalName);
      });
  });

  // ───── Status pill ───────────────────────────────────────────────────────

  it("should render either an Active or Inactive status pill next to the project name", () => {
    cy.get('[data-cy="project-status-pill"]').should("exist");
  });

  // ───── Visitor info row ──────────────────────────────────────────────────

  it("should render the visitor info row container", () => {
    cy.get('[data-cy="visitor-info"]').should("be.visible");
    cy.get('[data-cy="visitor-info-count"]').should("be.visible");
  });

  it("should render the last-visitor label container", () => {
    cy.get('[data-cy="visitor-info-last-visitor"]').should("be.visible");
  });

  // ───── Action buttons row ────────────────────────────────────────────────

  it("should render the Delete Project button", () => {
    cy.get('[data-cy="delete-project-btn"]').should("be.visible");
  });

  it("should render the Assign To button", () => {
    cy.get('[data-cy="assign-to-btn"]').should("be.visible");
  });

  it("should render the Transfer ownership button", () => {
    cy.get('[data-cy="transfer-ownership-btn"]').should("be.visible");
  });

  it("should render the status toggle button", () => {
    cy.get('[data-cy="status-toggle"]').should("be.visible");
  });

  // ───── Delete-project AlertModal ─────────────────────────────────────────

  it("should open the project-delete AlertModal when Delete Project is clicked", () => {
    cy.get('[data-cy="delete-project-btn"]').click();
    cy.get('[id="overlay-project-delete-modal"]', { timeout: 8000 })
      .should("be.visible");
  });

  it("should render the delete-project modal title element", () => {
    cy.get('[data-cy="delete-project-btn"]').click();
    cy.get('[id="overlay-project-delete-modal"]')
      .should("be.visible")
      .within(() => {
        cy.get('[data-cy="project-delete-modal-title"]').should("be.visible");
      });
  });

  it("should close the project-delete AlertModal when the Cancel button is clicked", () => {
    cy.get('[data-cy="delete-project-btn"]').click();
    cy.get('[id="overlay-project-delete-modal"]').should("be.visible");
    cy.get('[data-cy="project-delete-cancel-btn"]').click();
    cy.get('[id="overlay-project-delete-modal"]').should("not.exist");
  });

  // ───── Transfer ownership popup ──────────────────────────────────────────

  it("should open the Transfer Ownership popup when the Transfer ownership button is clicked", () => {
    cy.get('[data-cy="transfer-ownership-btn"]').click();
    cy.get('[id="overlay-transfer-ownership-popup"]', { timeout: 8000 })
      .should("be.visible");
  });

  // ───── Assign-to popup ───────────────────────────────────────────────────

  it("should open the Assign To popup when the Assign To button is clicked", () => {
    cy.get('[data-cy="assign-to-btn"]').click();
    cy.get('[id="overlay-assign-to-organization-or-team-popup"]', { timeout: 8000 })
      .should("be.visible");
  });

  // ───── Change status modal ──────────────────────────────────────────────

  it("should open the Change Project Status AlertModal when the status toggle button is clicked", () => {
    cy.get('[data-cy="status-toggle"]').click();
    // ChangeProjectStatus's AlertModal uses modalDataCy="status-change-modal".
    cy.get('[data-cy="status-change-modal"], [id^="overlay-"]', { timeout: 8000 }).should("be.visible");
  });

  // ───── Favicon dropzone ──────────────────────────────────────────────────

  it("should render the favicon dropzone hint container on initial mount", () => {
    cy.get('[data-cy="favicon-dropzone"]').should("exist");
    cy.get('[data-cy="favicon-jpeg-png-hint"]').should("exist");
  });

  it("should expose a hidden file input on the favicon dropzone", () => {
    cy.get('[data-cy="favicon-file-input"]').should("exist");
  });

  // ───── Resource usage panel ──────────────────────────────────────────────

  it("should render the Resource Usage panel container", () => {
    cy.get('[data-cy="resource-usage-panel"], [class*="resourceUsage"], [class*="ResourceUsage"]').should("exist");
  });
});

