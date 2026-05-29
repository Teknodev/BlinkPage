/**
 * NotificationPreferences page — full audit Cypress spec.
 *
 * The page renders 27 notification toggles grouped into 7 categories with a
 * master "All" checkbox and a Save button. Behaviour:
 *   - Anonymous user → <Navigate to="/authentication" replace />
 *   - Authenticated → loads preferences from user.notification_preferences
 *   - togglePreference flips a single key
 *   - toggleAllNotifications flips every key on/off
 *   - "All" checkbox is indeterminate when only some keys are on
 *   - handleSave PUTs the user with the JSON-stringified preferences
 *
 * Source: landing-composer/src/pages/notification-preferences/notification-preferences.tsx
 *
 * Selector strategy: the Checkbox atom (atoms/checkbox/Checkbox.tsx) accepts a
 * dataCy prop but the NotificationPreferences page does NOT pass one to any of
 * its 27 checkboxes nor the Save button. Flagged in
 * /tmp/agent-handoff/new-tests-fe-followup.json. The spec falls back to
 * role="checkbox" + position + aria-checked sentinel reads to drive coverage.
 */

// FE source:
//   landing-composer/src/services/User.tsx:22  -- updateUser(id, data) -> functionService.patchUserProfile(id, data)
//   landing-composer/src/classes/Function.ts:998 -- patchUserProfile(userId, data) -> apiUtils.apiService.patch(`user/${userId}/profile`, data)
// Resulting URL:  <VITE_API_URL>/fn-execute/user/<userId>/profile
// Method: PATCH (not PUT, and not /bucket/.../data).
const USER_PUT_API = '**/fn-execute/user/*/profile*';

describe('Notification Preferences Page', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/notification-preferences');
  });

  it('renders the page header and the master "All" toggle when logged in', () => {
    cy.get('h1', { timeout: 15000 }).should('contain.text', 'Notification Preferences');
    cy.get('[role="checkbox"]').should('have.length.greaterThan', 1);
  });

  it('renders exactly twenty-seven notification toggles plus the master "All" toggle', () => {
    cy.get('[role="checkbox"]', { timeout: 15000 }).should('have.length', 28);
  });

  it('exposes a "Save Preferences" button when the page mounts', () => {
    cy.get('button', { timeout: 15000 })
      .contains('Save Preferences')
      .should('be.visible')
      .and('not.be.disabled');
  });

  it('toggles a single preference off when an individual checkbox is clicked', () => {
    cy.get('[role="checkbox"]', { timeout: 15000 }).eq(1).as('firstPref');
    cy.get('@firstPref').invoke('attr', 'aria-checked').then((initial) => {
      cy.get('@firstPref').click();
      const expected = initial === 'true' ? 'false' : 'true';
      cy.get('@firstPref').should('have.attr', 'aria-checked', expected);
    });
  });

  it('flips every preference off when the master "All" checkbox is unchecked', () => {
    cy.get('[role="checkbox"]', { timeout: 15000 }).first().as('masterToggle');
    cy.get('@masterToggle').invoke('attr', 'aria-checked').then((initial) => {
      if (initial !== 'true') {
        // Force into all-on first so the next click flips everything off.
        cy.get('@masterToggle').click();
      }
      cy.get('@masterToggle').click();
      cy.get('[role="checkbox"]').not(':first').each(($el) => {
        cy.wrap($el).should('have.attr', 'aria-checked', 'false');
      });
    });
  });

  it('flips every preference on when the master "All" checkbox is checked from all-off', () => {
    cy.get('[role="checkbox"]', { timeout: 15000 }).first().as('masterToggle');
    // First click → guarantees we move to a determinate state.
    cy.get('@masterToggle').click();
    // Read state after first click; if currently off, click again to land on all-on.
    cy.get('@masterToggle').invoke('attr', 'aria-checked').then((state) => {
      if (state !== 'true') {
        cy.get('@masterToggle').click();
      }
      cy.get('[role="checkbox"]').not(':first').each(($el) => {
        cy.wrap($el).should('have.attr', 'aria-checked', 'true');
      });
    });
  });

  it('sets the master toggle to mixed/indeterminate when one preference is toggled off', () => {
    cy.get('[role="checkbox"]', { timeout: 15000 }).first().as('masterToggle');
    // Ensure all-on first.
    cy.get('@masterToggle').invoke('attr', 'aria-checked').then((state) => {
      if (state !== 'true') cy.get('@masterToggle').click();
    });
    // Flip exactly one individual preference off → indeterminate state.
    cy.get('[role="checkbox"]').eq(2).click();
    cy.get('@masterToggle').should('have.attr', 'aria-checked', 'mixed');
  });

  it('issues a PUT request when the Save Preferences button is clicked', () => {
    cy.intercept('PATCH', USER_PUT_API).as('saveUser');

    cy.get('button', { timeout: 15000 }).contains('Save Preferences').click();

    cy.wait('@saveUser', { timeout: 15000 }).then((interception) => {
      const body = interception.request.body || {};
      expect(body).to.have.property('notification_preferences');
      const parsed = typeof body.notification_preferences === 'string'
        ? JSON.parse(body.notification_preferences)
        : body.notification_preferences;
      expect(parsed).to.be.an('object');
    });
  });
});
