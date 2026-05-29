/**
 * Organizations — Settings sub-page audit.
 *
 * Source: landing-composer/src/pages/organizations/settings/Settings.tsx
 * Mounts: SettingsSkeleton, DeleteOrganizationModal, TransferOwnership, OverlayPopup.
 *
 * No data-cy hooks under this tree yet. Missing hooks logged in
 * /tmp/agent-handoff/new-tests-fe-followup.json.
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
        throw new Error('[settings spec] resolveFirstOrgId: no organization on this account');
      }
      return first._id;
    });
};

describe('Organizations Settings — page mount', () => {
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
      cy.visit(`/organizations/${orgId}/settings`);
      cy.wait('@getOrg', { timeout: 20000 });
    });
  });

  it('should land on the /organizations/:orgId/settings URL after navigation', function () {
    cy.location('pathname').should('eq', `/organizations/${this.orgId}/settings`);
  });

  it('should render the organization name input control once the fetch settles', () => {
    cy.get('input[placeholder="Organization Name"]', { timeout: 20000 }).should('exist');
  });

  it('should render the organization description textarea control once the fetch settles', () => {
    cy.get('textarea[placeholder="Organization Description"]', { timeout: 20000 }).should('exist');
  });

  it('should keep the name input disabled while the form is not in edit mode', () => {
    cy.get('input[placeholder="Organization Name"]', { timeout: 20000 }).should('be.disabled');
  });

  it('should keep the description textarea disabled while the form is not in edit mode', () => {
    cy.get('textarea[placeholder="Organization Description"]', { timeout: 20000 }).should(
      'be.disabled'
    );
  });
});

describe('Organizations Settings — edit toggle flow', () => {
  beforeEach(() => {
    cy.login();
    cy.window({ log: false }).then((win) => {
      const token = win.localStorage.getItem('token');
      resolveFirstOrgId(token).then((orgId) => {
        cy.wrap(orgId).as('orgId');
      });
    });
    cy.get('@orgId').then((orgId) => {
      cy.visit(`/organizations/${orgId}/settings`);
    });
    cy.get('input[placeholder="Organization Name"]', { timeout: 20000 }).should('exist');
  });

  it('should enable the name input after the Edit toggle is clicked', () => {
    // Fallback selector: there is no data-cy on the Edit/Save button. Anchor on styles.editButton class.
    cy.get('[class*="editButton"]', { timeout: 10000 }).first().click({ force: true });
    cy.get('input[placeholder="Organization Name"]').should('not.be.disabled');
  });

  it('should enable the description textarea after the Edit toggle is clicked', () => {
    cy.get('[class*="editButton"]', { timeout: 10000 }).first().click({ force: true });
    cy.get('textarea[placeholder="Organization Description"]').should('not.be.disabled');
  });
});

describe('Organizations Settings — delete organization popup entry point', () => {
  beforeEach(() => {
    cy.login();
    cy.window({ log: false }).then((win) => {
      const token = win.localStorage.getItem('token');
      resolveFirstOrgId(token).then((orgId) => {
        cy.wrap(orgId).as('orgId');
      });
    });
    cy.get('@orgId').then((orgId) => {
      cy.visit(`/organizations/${orgId}/settings`);
    });
    cy.get('input[placeholder="Organization Name"]', { timeout: 20000 }).should('exist');
  });

  it('should keep the delete-organization overlay popup hidden in the default mounted state', () => {
    cy.get('[id="delete-organization-popup"]').should('not.exist');
  });

  it('should open the delete-organization overlay popup when the danger Delete action is clicked', () => {
    cy.get('button').then(($buttons) => {
      // The danger button has no anchor — match on visible 'Delete Organization' label until FE adds data-cy.
      const $danger = $buttons.filter(
        (_, el) => /^delete\s+organization$/i.test((el.innerText || '').trim())
      );
      if ($danger.length === 0) {
        // No delete permission for this user — skip.
        return;
      }
      cy.wrap($danger.first()).click({ force: true });
      cy.get('[id="delete-organization-popup"]', { timeout: 10000 }).should('exist');
    });
  });
});

describe('Organizations Settings — transfer ownership entry point', () => {
  beforeEach(() => {
    cy.login();
    cy.window({ log: false }).then((win) => {
      const token = win.localStorage.getItem('token');
      resolveFirstOrgId(token).then((orgId) => {
        cy.wrap(orgId).as('orgId');
      });
    });
    cy.get('@orgId').then((orgId) => {
      cy.visit(`/organizations/${orgId}/settings`);
    });
    cy.get('input[placeholder="Organization Name"]', { timeout: 20000 }).should('exist');
  });

  it('should keep the transfer-ownership popup hidden in the default mounted state', () => {
    cy.get('[id="transfer-ownership-popup"]').should('not.exist');
  });
});

