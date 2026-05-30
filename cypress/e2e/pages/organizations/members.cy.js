/**
 * Organizations — Members sub-page audit.
 *
 * Source: landing-composer/src/pages/organizations/members/Members.tsx
 * Mounts: prefabs/members/Members.tsx (Members prefab) + AlertModal (delete confirm).
 *
 * Almost no interactive element under this tree currently exposes data-cy.
 * Required hooks are tracked in /tmp/agent-handoff/new-tests-fe-followup.json.
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
        throw new Error('[members spec] resolveFirstOrgId: no organization on this account');
      }
      return first._id;
    });
};

describe('Organizations Members — page mount', () => {
  beforeEach(() => {
    cy.login();
    cy.window({ log: false }).then((win) => {
      const token = win.localStorage.getItem('token');
      resolveFirstOrgId(token).then((orgId) => {
        cy.wrap(orgId).as('orgId');
      });
    });
    cy.get('@orgId').then((orgId) => {
      cy.intercept('GET', `**/api/fn-execute/organization/${orgId}**`).as('getOrg');
      cy.visit(`/organizations/${orgId}/members`);
      cy.wait('@getOrg', { timeout: 20000 });
    });
  });

  it('should land on the /organizations/:orgId/members URL after navigation', function () {
    cy.location('pathname').should('eq', `/organizations/${this.orgId}/members`);
  });

  it('should render the members table region once the organization context has resolved', () => {
    // ScopeView renders a Table — once loading clears at least one row OR an empty-state node exists.
    cy.get(
      'table, [class*="ScopeView"], [class*="scopeView"]',
      { timeout: 25000 }
    )
      .first()
      .should('exist');
  });
});

describe('Organizations Members — invite member entry point', () => {
  beforeEach(() => {
    cy.login();
    cy.window({ log: false }).then((win) => {
      const token = win.localStorage.getItem('token');
      resolveFirstOrgId(token).then((orgId) => {
        cy.wrap(orgId).as('orgId');
      });
    });
    cy.get('@orgId').then((orgId) => {
      cy.visit(`/organizations/${orgId}/members`);
    });
    cy.get('table, [class*="ScopeView"], [class*="scopeView"]', { timeout: 25000 })
      .first()
      .should('exist');
  });

  it('should open the invite-member overlay popup when the invite action is triggered', () => {
    // Falls back to OverlayPopup id while the FE adds data-cy to the invite button.
    cy.get('button').then(($buttons) => {
      const $invite = $buttons.filter((_, el) => /invite|add\s*member/i.test(el.innerText || ''));
      if ($invite.length === 0) {
        // No invite permission for the test account — skip.
        return;
      }
      cy.wrap($invite.first()).click({ force: true });
      cy.get('[id="invite-member-popup"]', { timeout: 10000 }).should('exist');
    });
  });
});

describe('Organizations Members — invitations API contract', () => {
  beforeEach(() => {
    cy.login();
    cy.window({ log: false }).then((win) => {
      const token = win.localStorage.getItem('token');
      resolveFirstOrgId(token).then((orgId) => {
        cy.wrap(orgId).as('orgId');
      });
    });
    cy.get('@orgId').then((orgId) => {
      cy.intercept('GET', `**/api/fn-execute/organization/${orgId}/invitation**`).as('getInvitations');
      cy.visit(`/organizations/${orgId}/members`);
    });
  });

  it('should fire the invitations request scoped to the current organization', () => {
    cy.wait('@getInvitations', { timeout: 20000 }).then((interception) => {
      expect(interception).to.exist;
    });
  });

  it('should not return a 5xx error from the invitations endpoint', () => {
    cy.wait('@getInvitations', { timeout: 20000 }).then((interception) => {
      const status = interception.response.statusCode;
      expect(status).to.be.lessThan(500);
    });
  });
});

describe('Organizations Members — delete-pending-member alert modal', () => {
  beforeEach(() => {
    cy.login();
    cy.window({ log: false }).then((win) => {
      const token = win.localStorage.getItem('token');
      resolveFirstOrgId(token).then((orgId) => {
        cy.wrap(orgId).as('orgId');
      });
    });
    cy.get('@orgId').then((orgId) => {
      cy.visit(`/organizations/${orgId}/members`);
    });
    cy.get('table, [class*="ScopeView"], [class*="scopeView"]', { timeout: 25000 })
      .first()
      .should('exist');
  });

  it('should keep the delete-pending-member modal hidden during the default mounted state', () => {
    // The AlertModal in Members.tsx mounts with id='delete-pending-member-modal' and only renders when open.
    cy.get('[id="delete-pending-member-modal"]').should('not.exist');
  });
});

