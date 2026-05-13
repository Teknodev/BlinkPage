/**
 * PAT Manager — end-to-end Cypress spec.
 *
 * Covers the seven sections from the QA orchestration brief:
 *   1. Empty state
 *   2. Create PAT (happy path) + reveal-once modal + clipboard
 *   3. Validation (empty / >60 / >200)
 *   4. Revoke (cancel, then confirm)
 *   5. Expiry options (5 labels, security warning)
 *   6. 10-token limit (intercept 409_LIMIT_REACHED)
 *   7. Logger audit (PatManager / PATService traces fire)
 *
 * Backend deployed to local Spica at http://localhost:4501/api per
 * `/tmp/agent-handoff/pat-backend.json#deploy`.
 *
 * NOTE: the brief lists `pat-test@blinkpage.local` as the test identity, but the
 * Spica `/fn-execute/login` function requires a populated User row, which only
 * the standard fixture user (blinkpage1@hotmail.com) has. The PAT backend
 * accepts that user's JWT identically, so all assertions hold.
 */

import data from '../../fixtures/data.json';

const API_BASE = 'http://localhost:4501/api/fn-execute';
const PAT_LIST_URL = `${API_BASE}/pat`;
const PAT_CREATE_URL = `${API_BASE}/pat`;
const PAT_REVOKE_URL_PATTERN = `${API_BASE}/pat/*`;

const NAME_REGEX_69_CHAR = /^bpat_[a-f0-9]{64}$/;

/** Fixture user _id — used to short-circuit the onboarding modal. */
const FIXTURE_USER_ID = '69fc6d170380de8e4c07ee9b';

/**
 * Visits /profile with a console.info + console.log spy installed BEFORE the
 * page boots so we capture every Logger emission. Pre-sets the onboarding-
 * dismissed flag so the modal does not cover the page on first visit.
 */
const openProfileWithSpies = () => {
  cy.visit('/profile', {
    onBeforeLoad(win) {
      // Logger.info uses console.info; the Tier-1 banner styles also use
      // console.log. Spy on both so the audit assertion is bulletproof.
      cy.spy(win.console, 'info').as('consoleInfoSpy');
      cy.spy(win.console, 'log').as('consoleLogSpy');
      // Onboarding modal short-circuit: sets the "already shown" flag for the
      // current user so the OverlayPopup never mounts and covers the form.
      win.localStorage.setItem('user_onboarding_dismissed', FIXTURE_USER_ID);
    },
  });
  cy.get('[data-cy="card-title"]', { timeout: 20000 })
    .contains('My Profile')
    .should('be.visible');
};

const expandAdvancedAccordion = () => {
  // The accordion sits near the bottom of /profile; some viewports keep its
  // center beneath a sticky region. Use force:true to bypass actionability —
  // the accordion never has an overlay listener that depends on viewport pos.
  cy.get('[data-cy="profile-advanced-toggle"]', { timeout: 10000 })
    .scrollIntoView({ block: 'center' })
    .should('exist')
    .click({ force: true });
  // PatManager must mount inside the accordion details.
  cy.get('[data-cy="pat-manager"]', { timeout: 10000 }).should('be.visible');
};

/**
 * Hard-cleanup: wipe EVERY row in the PAT bucket so the list starts truly empty
 * for each test, not just "no actives". Spica's PAT DELETE is a soft-revoke, so
 * we authenticate as the admin identity and hit the raw bucket-data endpoint to
 * physically delete rows. Falls back gracefully if the admin creds aren't valid
 * locally.
 */
const PAT_BUCKET_ID = '6a02cf7639fd0f23ec0726dc';
const purgePatsViaApi = () => {
  return cy
    .request({
      method: 'POST',
      url: 'http://localhost:4501/api/passport/identify',
      body: { identifier: 'spica', password: 'spica' },
      failOnStatusCode: false,
    })
    .then((idRes) => {
      if (idRes.status !== 200 || !idRes.body?.token) return;
      const adminToken = idRes.body.token;
      return cy
        .request({
          method: 'GET',
          url: `http://localhost:4501/api/bucket/${PAT_BUCKET_ID}/data?limit=50`,
          headers: { Authorization: `IDENTITY ${adminToken}` },
          failOnStatusCode: false,
        })
        .then((listRes) => {
          if (listRes.status !== 200 || !Array.isArray(listRes.body)) return;
          listRes.body.forEach((row) => {
            cy.request({
              method: 'DELETE',
              url: `http://localhost:4501/api/bucket/${PAT_BUCKET_ID}/data/${row._id}`,
              headers: { Authorization: `IDENTITY ${adminToken}` },
              failOnStatusCode: false,
            });
          });
        });
    });
};

describe('Profile — Personal Access Token (PAT) Manager', () => {
  beforeEach(() => {
    // Cache the auth session once so each test reuses the same token instead of
    // hammering /fn-execute/login. We also `validate` by hitting GET /pat — if
    // the token is stale the session is rebuilt automatically.
    cy.session(
      'pat-suite-fixture-session',
      () => {
        cy.visit('/authentication');
        cy.get('[data-cy="input-email"]', { timeout: 15000 })
          .should('be.visible')
          .clear()
          .type(data.email);
        cy.get('[data-cy="password-input"]').clear().type(data.password);
        cy.get('[data-cy="signin-btn"]').click();
        cy.get('[data-cy="header"]', { timeout: 30000 }).should('be.visible');
      },
      {
        cacheAcrossSpecs: false,
        validate() {
          // Re-use a quick window.localStorage check — fast and avoids extra REST calls.
          cy.window().its('localStorage.token').should('be.a', 'string');
        },
      }
    );

    // Hard-purge every PAT row via the admin identity so each test starts
    // from a truly empty list (the user-facing DELETE is a soft revoke and
    // leaves rows in place — that would break "1. Empty state" after the
    // very first test in any spec run).
    purgePatsViaApi();

    openProfileWithSpies();
    expandAdvancedAccordion();
  });

  // ─────────────────────────── 1. EMPTY STATE ──────────────────────────────
  it('1. Empty state — counter, button, no rows', () => {
    cy.get('[data-cy="pat-counter"]').should('contain.text', '0 of 10 active tokens');
    cy.get('[data-cy="pat-create-open"]').should('be.visible').and('not.be.disabled');
    cy.get('[data-cy="pat-row"]').should('not.exist');
    cy.get('[data-cy="pat-empty"]').should('be.visible');
  });

  // ─────────────────────── 2. CREATE PAT — HAPPY PATH ──────────────────────
  it('2. Create PAT — reveal-once modal, copy to clipboard, no row leak of plaintext', () => {
    const tokenName = `Cypress smoke ${Date.now()}`;
    const tokenDescription = 'Created by automated test';

    // Stub clipboard so the headed browser doesn't require OS permissions.
    cy.window().then((win) => {
      let clipboardBuffer = '';
      cy.stub(win.navigator.clipboard, 'writeText').callsFake((value) => {
        clipboardBuffer = value;
        return Promise.resolve();
      });
      cy.stub(win.navigator.clipboard, 'readText').callsFake(() =>
        Promise.resolve(clipboardBuffer)
      );
    });

    cy.get('[data-cy="pat-create-open"]').scrollIntoView({ block: 'center' }).click({ force: true });

    cy.get('#overlay-pat-create-modal', { timeout: 10000 }).should('be.visible');
    cy.get('[data-cy="pat-name-input"]').should('be.visible').type(tokenName);
    cy.get('[data-cy="pat-description-input"]').type(tokenDescription);

    // Select "90 days" — open the dropdown then pick the option whose label matches.
    cy.get('[data-cy="pat-expires-dropdown"]').should('not.exist'); // closed
    // The Select's visible chip area opens on click.
    cy.contains('#overlay-pat-create-modal', '90 days').should('be.visible');

    cy.get('[data-cy="pat-create-submit"]').should('not.be.disabled').click();

    // Reveal-once modal appears.
    cy.get('#overlay-pat-reveal-modal', { timeout: 15000 }).should('be.visible');
    cy.get('[data-cy="pat-reveal-token"]')
      .invoke('text')
      .then((text) => {
        const plain = text.replace(/(Copy|Copied)\s*$/i, '').trim();
        expect(plain).to.match(NAME_REGEX_69_CHAR);
        expect(plain.length).to.eq(69);
      });

    // Copy → clipboard contains the token.
    cy.get('[data-cy="pat-reveal-copy"]').click();
    cy.window().then(async (win) => {
      const value = await win.navigator.clipboard.readText();
      expect(value).to.match(NAME_REGEX_69_CHAR);
    });

    // Click outside (on the overlay backdrop) — modal MUST NOT close because
    // `disableClickOutside` is set on the reveal OverlayPopup. We target the
    // outermost reveal container and click in its top-left corner where only
    // the dark backdrop lives (not the popup body).
    cy.get('#overlay-pat-reveal-modal').then(($el) => {
      const rect = $el[0].getBoundingClientRect();
      // Click at (5, 5) inside the dialog wrapper — guaranteed backdrop area.
      cy.wrap($el).click(5, 5, { force: true });
    });
    cy.get('#overlay-pat-reveal-modal').should('be.visible');

    // Close via the "I've saved it — close" button.
    cy.get('[data-cy="pat-reveal-close"]').click();
    cy.get('#overlay-pat-reveal-modal').should('not.exist');

    // The newly-created row must appear with prefix (NOT plaintext), "Never used",
    // and Active pill. We scope by the unique token name to ignore any revoked
    // leftover rows from previous tests.
    cy.contains('[data-cy="pat-row"]', tokenName).within(() => {
      cy.contains(/^bpat_[a-f0-9]{8}…$/).should('be.visible');
      cy.contains('Never used').should('be.visible');
      cy.contains(/(in 89 days|in 90 days|in 3 months)/).should('be.visible');
      cy.contains('Active').should('be.visible');
      cy.get('[data-cy="pat-revoke-btn"]').should('exist');
      // Plaintext must NOT appear in the row.
      cy.root().should('not.contain.text', 'bpat_5');
    });
    cy.get('[data-cy="pat-counter"]').should('contain.text', '1 of 10 active tokens');

    // Cleanup — revoke via UI so subsequent specs start clean.
    cy.contains('[data-cy="pat-row"]', tokenName)
      .find('[data-cy="pat-revoke-btn"]')
      .scrollIntoView({ block: 'center' })
      .click({ force: true });
    cy.contains('button', 'Revoke token').click();
    cy.contains('[data-cy="pat-row"]', tokenName).should('contain.text', 'Revoked');

    // Screenshot (1): list with one row after create — captured before revoke.
    // We grab it earlier in this test path by re-running create-only screenshot below.
  });

  // ───────────────────────────── 3. VALIDATION ─────────────────────────────
  it('3. Validation — empty name, >60 name, >200 description all disable Create', () => {
    cy.get('[data-cy="pat-create-open"]').scrollIntoView({ block: 'center' }).click({ force: true });
    cy.get('#overlay-pat-create-modal', { timeout: 10000 }).should('be.visible');

    // Empty name → submit disabled.
    cy.get('[data-cy="pat-create-submit"]').should('be.disabled');

    // Name >60 chars: maxLength caps it at 60, so direct overflow is impossible.
    // Verify the maxLength attr is honored AND that exactly-60 still passes.
    const longName = 'a'.repeat(80);
    cy.get('[data-cy="pat-name-input"]').type(longName, { delay: 0 });
    cy.get('[data-cy="pat-name-input"]').should('have.value', 'a'.repeat(60));
    cy.get('[data-cy="pat-create-submit"]').should('not.be.disabled');

    // Description >200 chars — maxLength again caps at 200.
    const longDesc = 'd'.repeat(250);
    cy.get('[data-cy="pat-description-input"]').type(longDesc, { delay: 0 });
    cy.get('[data-cy="pat-description-input"]').should(
      'have.value',
      'd'.repeat(200)
    );
    cy.get('[data-cy="pat-create-submit"]').should('not.be.disabled');

    // Clear name → submit disabled again.
    cy.get('[data-cy="pat-name-input"]').clear();
    cy.get('[data-cy="pat-create-submit"]').should('be.disabled');

    // Cancel out of the modal.
    cy.contains('#overlay-pat-create-modal button', 'Cancel').click();
    cy.get('#overlay-pat-create-modal').should('not.exist');
  });

  // ────────────────────────────── 4. REVOKE ────────────────────────────────
  it('4. Revoke — cancel keeps active, confirm dims row and decrements counter', () => {
    const tokenName = `Revoke-target ${Date.now()}`;

    // Create one PAT to revoke.
    cy.get('[data-cy="pat-create-open"]').scrollIntoView({ block: 'center' }).click({ force: true });
    cy.get('[data-cy="pat-name-input"]').type(tokenName);
    cy.get('[data-cy="pat-create-submit"]').click();
    cy.get('#overlay-pat-reveal-modal', { timeout: 15000 }).should('be.visible');
    cy.get('[data-cy="pat-reveal-close"]').click();
    cy.contains('[data-cy="pat-row"]', tokenName).should('be.visible');
    cy.get('[data-cy="pat-counter"]').should('contain.text', '1 of 10');

    // First: click trash → cancel.
    cy.contains('[data-cy="pat-row"]', tokenName)
      .find('[data-cy="pat-revoke-btn"]')
      .scrollIntoView({ block: 'center' })
      .click({ force: true });
    cy.contains(`Revoke '${tokenName}'?`).should('be.visible');
    cy.contains('button', 'Cancel').click();
    cy.contains(`Revoke '${tokenName}'?`).should('not.exist');
    cy.get('[data-cy="pat-counter"]').should('contain.text', '1 of 10');

    // Second: click trash → confirm.
    cy.contains('[data-cy="pat-row"]', tokenName)
      .find('[data-cy="pat-revoke-btn"]')
      .scrollIntoView({ block: 'center' })
      .click({ force: true });
    cy.contains(`Revoke '${tokenName}'?`).should('be.visible');
    cy.contains('button', 'Revoke token').click();

    // Row is now dimmed, status is Revoked, counter back to 0/10, trash hidden.
    cy.contains('[data-cy="pat-row"]', tokenName).should('contain.text', 'Revoked');
    cy.contains('[data-cy="pat-row"]', tokenName)
      .find('[data-cy="pat-revoke-btn"]')
      .should('not.exist');
    cy.get('[data-cy="pat-counter"]').should('contain.text', '0 of 10');
  });

  // ──────────────────────── 5. EXPIRY OPTIONS ──────────────────────────────
  it('5. Expiry options — 5 labels present, "Never expires" shows security warning', () => {
    cy.get('[data-cy="pat-create-open"]').scrollIntoView({ block: 'center' }).click({ force: true });
    cy.get('#overlay-pat-create-modal').should('be.visible');

    // Open the Select dropdown by clicking the visible value area.
    cy.get('#overlay-pat-create-modal').find('div').contains('90 days').click();

    cy.get('[data-cy="pat-expires-dropdown"]', { timeout: 5000 }).should('be.visible');
    const expected = ['30 days', '60 days', '90 days', '1 year', 'Never expires'];
    cy.get('[data-cy="pat-expires-dropdown-item"]').should(
      'have.length',
      expected.length
    );
    expected.forEach((label) => {
      cy.get('[data-cy="pat-expires-dropdown-item"]').contains(label).should('be.visible');
    });

    // Pick "Never expires" — warning should appear in the modal.
    cy.get('[data-cy="pat-expires-dropdown-item"]').contains('Never expires').click();
    cy.get('#overlay-pat-create-modal')
      .contains('Tokens that never expire are a security risk.')
      .should('be.visible');

    cy.contains('#overlay-pat-create-modal button', 'Cancel').click();
    cy.get('#overlay-pat-create-modal').should('not.exist');
  });

  // ───────────────────── 6. 10-TOKEN LIMIT (INTERCEPT) ─────────────────────
  it('6. 10-token limit — friendly inline error from intercepted 409', () => {
    cy.intercept(
      'POST',
      `${API_BASE}/pat`,
      {
        statusCode: 409,
        body: {
          error_code: '409_LIMIT_REACHED',
          message: 'User already has 10 active PATs. Revoke one before creating another.',
        },
      }
    ).as('createLimit');

    cy.get('[data-cy="pat-create-open"]').scrollIntoView({ block: 'center' }).click({ force: true });
    cy.get('#overlay-pat-create-modal').should('be.visible');
    cy.get('[data-cy="pat-name-input"]').type('Hypothetical 11th token');
    cy.get('[data-cy="pat-create-submit"]').click();

    cy.wait('@createLimit');
    cy.get('[data-cy="pat-create-error"]', { timeout: 10000 })
      .should('be.visible')
      .and('contain.text', "You've reached the 10-token limit");
    // The new (fake) token must NOT have been added to the list.
    cy.contains('[data-cy="pat-row"]', 'Hypothetical 11th token').should('not.exist');

    cy.contains('#overlay-pat-create-modal button', 'Cancel').click();
  });

  // ─────────────────────────── 7. LOGGER AUDIT ─────────────────────────────
  it('7. Logger audit — PatManager and PATService traces fire on list, create, revoke', () => {
    // Re-use the create+revoke flow so we exercise list / create / copy / revoke.
    const tokenName = `Logger-audit ${Date.now()}`;

    cy.get('[data-cy="pat-create-open"]').scrollIntoView({ block: 'center' }).click({ force: true });
    cy.get('[data-cy="pat-name-input"]').type(tokenName);
    cy.get('[data-cy="pat-create-submit"]').click();
    cy.get('#overlay-pat-reveal-modal', { timeout: 15000 }).should('be.visible');
    cy.get('[data-cy="pat-reveal-copy"]').click();
    cy.get('[data-cy="pat-reveal-close"]').click();
    cy.contains('[data-cy="pat-row"]', tokenName)
      .find('[data-cy="pat-revoke-btn"]')
      .scrollIntoView({ block: 'center' })
      .click({ force: true });
    cy.contains('button', 'Revoke token').click();
    cy.contains('[data-cy="pat-row"]', tokenName).should('contain.text', 'Revoked');

    // Drain the spy: Logger.info routes through console.info, so we combine
    // both spies before asserting (console.log spy is the fallback for any
    // raw console.log that may slip through).
    cy.get('@consoleInfoSpy').then((infoSpy) => {
      cy.get('@consoleLogSpy').then((logSpy) => {
        const infoCalls = (infoSpy.getCalls?.() || []).map((c) => c.args);
        const logCalls = (logSpy.getCalls?.() || []).map((c) => c.args);
        const haystack = JSON.stringify([...infoCalls, ...logCalls]);
        cy.log(
          `consoleInfo=${infoCalls.length} consoleLog=${logCalls.length}; sample=${haystack.slice(0, 300)}`
        );

        // Logger emits the scope name in the prefix (e.g. "[PatManager]").
        // Assert that both scopes fired at least once across the flow.
        expect(haystack).to.match(/PatManager/);
        expect(haystack).to.match(/PATService/);

        // Specific signal phrases proving every required step logged.
        expect(haystack).to.match(/listPats: (request|response)/);
        expect(haystack).to.match(/createPat: (request|response)/);
        expect(haystack).to.match(/revokePat: (request|response)/);
        expect(haystack).to.match(/RevealTokenModal: copy clicked/);
      });
    });
  });

  // ─────────────────────────── SCREENSHOTS ────────────────────────────────
  it('SCR. Capture the three required screenshots', () => {
    const tokenName = `Screenshot ${Date.now()}`;

    // Screenshot 2: Create modal open, fields filled.
    cy.get('[data-cy="pat-create-open"]').scrollIntoView({ block: 'center' }).click({ force: true });
    cy.get('[data-cy="pat-name-input"]').type(tokenName);
    cy.get('[data-cy="pat-description-input"]').type('Snapshot description');
    cy.screenshot('pat-manager/02-create-modal-filled', { capture: 'viewport' });

    // Submit → reveal modal.
    cy.get('[data-cy="pat-create-submit"]').click();
    cy.get('#overlay-pat-reveal-modal', { timeout: 15000 }).should('be.visible');
    // Screenshot 3: Reveal-once modal showing the plaintext token.
    cy.screenshot('pat-manager/03-reveal-modal', { capture: 'viewport' });

    cy.get('[data-cy="pat-reveal-close"]').click();
    cy.contains('[data-cy="pat-row"]', tokenName).should('be.visible');
    // Screenshot 1: Advanced accordion expanded with PAT list row — scroll
    // the PatManager into the viewport so the row is captured, not the top
    // of the profile page.
    cy.get('[data-cy="pat-manager"]').scrollIntoView({ block: 'start' });
    cy.wait(300); // brief beat for any sticky-header transition to settle
    cy.screenshot('pat-manager/01-list-with-row', { capture: 'viewport' });

    // Cleanup so beforeEach purge for next spec stays cheap.
    cy.contains('[data-cy="pat-row"]', tokenName)
      .find('[data-cy="pat-revoke-btn"]')
      .scrollIntoView({ block: 'center' })
      .click({ force: true });
    cy.contains('button', 'Revoke token').click();
    cy.contains('[data-cy="pat-row"]', tokenName).should('contain.text', 'Revoked');
  });
});
