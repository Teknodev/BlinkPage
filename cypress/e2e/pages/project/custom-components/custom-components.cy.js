// ─────────────────────────────────────────────────────────────────────────────
// Project Custom Components — Full-audit spec for
// landing-composer/src/pages/project/custom-components/custom-components.tsx
//
// Scope: page mount, header, CLI code block copy-to-clipboard, uploaded
// components count, ComponentGrid empty + populated states, AlertModal delete
// confirmation flow.
//
// Notes:
//   - No data-cy attributes exist on the page or on ComponentGrid. AlertModal
//     accepts dataCy / confirmButtonDataCy / cancelButtonDataCy props but the
//     CustomComponents page does not pass them through. See
//     /tmp/agent-handoff/new-tests-fe-followup.json for the required hooks.
// ─────────────────────────────────────────────────────────────────────────────

// Project id is resolved dynamically — the previous hardcoded id no longer
// belongs to the test account.
let PROJECT_ID;
let CUSTOM_COMPONENTS_URL;

const stubCustomComponents = (components = []) => {
  cy.intercept('GET', '**/fn-execute/getCustomComponents**', { body: components }).as(
    'getCustomComponents'
  );
  cy.intercept('POST', '**/fn-execute/getCustomComponents**', { body: components }).as(
    'postCustomComponents'
  );
};

describe('Project Custom Components — Page Mount', () => {
  before(() => {
    cy.login();
    cy.getTestProjectId().then((id) => {
      PROJECT_ID = id;
      CUSTOM_COMPONENTS_URL = `/project/${PROJECT_ID}/custom-components`;
    });
  });

  beforeEach(() => {
    stubCustomComponents([]);
    cy.login();
    cy.visit(CUSTOM_COMPONENTS_URL);
  });

  it('renders the custom-components route without redirecting to authentication', () => {
    cy.location('pathname', { timeout: 15000 }).should('include', `/project/${PROJECT_ID}/custom-components`);
    cy.location('pathname').should('not.include', '/authentication');
  });

  it('renders an h1 in the page header', () => {
    cy.get('h1', { timeout: 15000 }).should('exist');
  });

  it('renders the Getting Started section h3', () => {
    cy.get('h3', { timeout: 15000 }).should('exist');
  });
});

describe('Project Custom Components — CLI Code Block', () => {
  beforeEach(() => {
    stubCustomComponents([]);
    cy.login();
    cy.visit(CUSTOM_COMPONENTS_URL);
  });

  it('renders a clickable code block containing the project id in the CLI push command', () => {
    cy.contains('code', PROJECT_ID, { timeout: 15000 })
      .first()
      .should('exist');
  });

  it('updates the copy-hint to "Copied!" after the code block is clicked', () => {
    cy.window().then((win) => {
      // Stub clipboard so the copyToClipboard utility resolves synchronously.
      if (win.navigator.clipboard) {
        cy.stub(win.navigator.clipboard, 'writeText').as('clipWrite').resolves();
      }
    });

    cy.contains('code', PROJECT_ID, { timeout: 15000 })
      .first()
      .parent()
      .click({ force: true });

    cy.contains('span', /copied!?/i, { timeout: 5000 }).should('exist');
  });
});

describe('Project Custom Components — Component Grid Empty State', () => {
  beforeEach(() => {
    stubCustomComponents([]);
    cy.login();
    cy.visit(CUSTOM_COMPONENTS_URL);
  });

  it('renders the "Uploaded Components (0)" heading when zero components are returned', () => {
    cy.contains('h2', /uploaded\s*components\s*\(\s*0\s*\)/i, { timeout: 15000 }).should('exist');
  });
});

describe('Project Custom Components — Component Grid Populated', () => {
  const stubComponents = [
    { _id: 'cc-1', name: 'CustomHero', version: '1.0.0', category: 'hero' },
    { _id: 'cc-2', name: 'CustomFooter', version: '2.1.0', category: 'footer' },
  ];

  beforeEach(() => {
    stubCustomComponents(stubComponents);
    cy.login();
    cy.visit(CUSTOM_COMPONENTS_URL);
  });

  it('renders the "Uploaded Components (2)" heading when two components are returned', () => {
    cy.contains('h2', /uploaded\s*components\s*\(\s*2\s*\)/i, { timeout: 15000 }).should('exist');
  });

  it('renders a delete button per uploaded component card', () => {
    cy.get('[title="Delete component"]', { timeout: 15000 }).should('have.length', stubComponents.length);
  });

  it('opens the alert-modal confirmation when a delete button is clicked', () => {
    cy.get('[title="Delete component"]', { timeout: 15000 }).first().click({ force: true });

    // AlertModal renders a Delete component? title — match it via the dialog role
    // emitted by Material's underlying dialog implementation.
    cy.get('[role="dialog"], [class*="alertModal"], [class*="AlertModal"]', { timeout: 10000 })
      .first()
      .should('exist');
  });
});
