/**
 * Organizations — Delete confirmation sub-page audit.
 *
 * Source: landing-composer/src/pages/organizations/delete/DeleteOrganization.tsx
 *
 * The route '/organizations/:orgId/delete' is the link-target that the email confirmation
 * sends the org owner to. It expects a 'token' query param in the URL and immediately fires
 * functionService.deleteOrganization(orgId). All flows here are mocked because we cannot let
 * tests irreversibly delete the test account's organization.
 *
 * Missing data-cy hooks tracked in /tmp/agent-handoff/new-tests-fe-followup.json. Three
 * status branches (pending/success/error) currently identify themselves only via class names.
 */

const API_URL = Cypress.env('API_URL');

const resolveFirstOrgId = (token) => {
  return cy
    .request({
      method: 'GET',
      url: `${API_URL}/fn-execute/organization`,
      headers: { Authorization: `IDENTITY ${token}` },
      qs: { sort: JSON.stringify({ _id: -1 }) },
      failOnStatusCode: false,
    })
    .then((res) => {
      const list = Array.isArray(res.body) ? res.body : res.body?.data || [];
      const first = list.find((o) => !o?.deleted_at) || list[0];
      if (!first?._id) {
        throw new Error('[delete spec] resolveFirstOrgId: no organization on this account');
      }
      return first._id;
    });
};

describe('Organizations Delete — no-op without confirmation token', () => {
  beforeEach(() => {
    cy.login();
    cy.window({ log: false }).then((win) => {
      const token = win.localStorage.getItem('token');
      resolveFirstOrgId(token).then((orgId) => {
        cy.wrap(orgId).as('orgId');
      });
    });
    // Stub DELETE so even if it fires, the org cannot be removed.
    cy.intercept('DELETE', '**/api/fn-execute/organization/**', {
      statusCode: 200,
      body: { message: 'stub: would have deleted' },
    }).as('deleteOrg');
    cy.get('@orgId').then((orgId) => {
      cy.visit(`/organizations/${orgId}/delete`);
    });
  });

  it('should not fire the deleteOrganization request when the token query param is absent', () => {
    cy.wait(1500); // race-free wait: the component fires on mount and we assert no call escaped.
    cy.get('@deleteOrg.all').should('have.length', 0);
  });

  it('should render the "pending" status node initially while the component decides whether to fire', () => {
    // Three branches render exactly one of: .loading, .success, .error. Without a token,
    // deleteOrganization() early-returns so the component stays in the pending render branch.
    cy.get('.loading, [class*="loading"]', { timeout: 10000 }).should('exist');
  });
});

describe('Organizations Delete — success branch with mocked token + 200 response', () => {
  beforeEach(() => {
    cy.login();
    cy.window({ log: false }).then((win) => {
      const token = win.localStorage.getItem('token');
      resolveFirstOrgId(token).then((orgId) => {
        cy.wrap(orgId).as('orgId');
      });
    });
    // Always stub the destructive call — never actually delete.
    cy.intercept('DELETE', '**/api/fn-execute/organization/**', {
      statusCode: 200,
      body: { message: 'Organization deleted (stubbed).' },
    }).as('deleteOrg');
    cy.get('@orgId').then((orgId) => {
      cy.visit(`/organizations/${orgId}/delete?token=cypress-stub-token`);
    });
  });

  it('should fire the deleteOrganization request when a token query param is present in the URL', () => {
    cy.wait('@deleteOrg', { timeout: 15000 }).then((interception) => {
      expect(interception).to.exist;
      expect(interception.request.method).to.eq('DELETE');
    });
  });

  it('should render the success status node after the deleteOrganization call resolves 200', () => {
    cy.wait('@deleteOrg', { timeout: 15000 });
    cy.get('.success, [class*="success"]', { timeout: 10000 }).should('exist');
  });

  it('should redirect to /organizations within the 3-second timeout window after success', () => {
    cy.wait('@deleteOrg', { timeout: 15000 });
    cy.location('pathname', { timeout: 8000 }).should('eq', '/organizations');
  });
});

describe('Organizations Delete — error branch with mocked token + 4xx response', () => {
  beforeEach(() => {
    cy.login();
    cy.window({ log: false }).then((win) => {
      const token = win.localStorage.getItem('token');
      resolveFirstOrgId(token).then((orgId) => {
        cy.wrap(orgId).as('orgId');
      });
    });
    cy.intercept('DELETE', '**/api/fn-execute/organization/**', {
      statusCode: 404,
      body: { message: 'Organization not found.' },
    }).as('deleteOrgFail');
    cy.get('@orgId').then((orgId) => {
      cy.visit(`/organizations/${orgId}/delete?token=cypress-stub-token`);
    });
  });

  it('should render the error status node when the deleteOrganization call returns a 4xx response', () => {
    cy.wait('@deleteOrgFail', { timeout: 15000 });
    cy.get('.error, [class*="error"]', { timeout: 10000 }).should('exist');
  });

  it('should still redirect to /organizations within the 3-second timeout window after an error', () => {
    cy.wait('@deleteOrgFail', { timeout: 15000 });
    cy.location('pathname', { timeout: 8000 }).should('eq', '/organizations');
  });

  it('should strip the token query parameter from the URL after the deleteOrganization call settles', () => {
    cy.wait('@deleteOrgFail', { timeout: 15000 });
    cy.location('search', { timeout: 8000 }).should('not.contain', 'token=');
  });
});

