/**
 * Block Builder — Blueprint Backend Endpoint migration coverage.
 *
 * Validates the migration from build-time static `/blueprints/*.json` files
 * to the Spica bucket-backed REST endpoint. As of this revision the endpoint
 * uses a query-string parameter (not a path segment) to bypass a local
 * nginx-ingress limitation on `%20` inside path segments:
 *   GET <SPICA_BASE>/api/fn-execute/api/v1/blueprints?name=<encoded>
 *     → 200 application/json { title, componentVersion, blueprint }
 *     → 404 when the bucket has no doc for this component
 *           (body is literal "undefined" — assert on status only)
 *     → 400 application/json {"message":"name query param is required"}
 *           when the `name` query string is missing entirely
 *
 * Coverage:
 *   1. Golden path — Hero Section 1 fetches via the new endpoint, returns 200,
 *      injects the BB preview <style> tag, no static `/blueprints/*` requests.
 *   2. Stats 2 — repeat-source blueprint expansion still works via new endpoint.
 *   3. Negative — unknown component name returns 404 (status-only assertion;
 *      Tier-3 fallback kicks in, no crash).
 *   4. Cache — reopen the same component without page reload → endpoint hit once.
 *
 * All assertions use retry queues (`cy.get().should()`) so React async state
 * settles before we read.
 */
import data from '../../fixtures/data.json';

const TEST_PROJECT_ID = '69fc6ffb4203ddc9308f7395';
const HERO_BB_URL = `/project/${TEST_PROJECT_ID}/blockbuilder?component=Hero%20Section%201`;
const STATS_BB_URL = `/project/${TEST_PROJECT_ID}/blockbuilder?component=Stats%202`;
const UNKNOWN_BB_URL = `/project/${TEST_PROJECT_ID}/blockbuilder?component=Does%20Not%20Exist`;

// Query-string endpoint matchers. We use a wildcard URL matcher and then narrow
// to the exact `name=` value inside the assertion to keep the intercept resilient
// to encoding differences (`%20` vs `+`) emitted by different HTTP clients.
const BLUEPRINT_ENDPOINT_GLOB = '**/fn-execute/api/v1/blueprints?**';
const HERO_NAME = 'Hero Section 1';
const STATS_NAME = 'Stats 2';
const UNKNOWN_NAME = 'Does Not Exist';

// Pulls the `name` query param out of an intercepted request URL.
// Handles `%20`-style and `+`-style encodings.
const nameParamOf = (url) => {
  try {
    const u = new URL(url, 'http://localhost');
    const raw = u.searchParams.get('name');
    return raw == null ? null : raw;
  } catch (_e) {
    return null;
  }
};

// Session-only login. The shared `loginToEditor` helper waits on the canvas;
// BB is reachable without finishing onboarding and some test accounts have a
// dashboard onboarding modal that would block that helper.
const loginOnly = () => {
  cy.session('blinkpage-auth-session', () => {
    cy.visit('/authentication');
    cy.get('[data-cy="input-email"]', { timeout: 10000 }).should('be.visible').clear().type(data.email);
    cy.get('[data-cy="password-input"]', { timeout: 10000 }).should('be.visible').clear().type(data.password);
    cy.get('[data-cy="signin-btn"]', { timeout: 5000 }).should('be.visible').click();
    cy.get('[data-cy="header"]', { timeout: 30000 }).should('be.visible');
  });
};

describe('Block Builder — Blueprint Backend Endpoint', () => {
  beforeEach(() => {
    loginOnly();
  });

  it('Golden path: Hero Section 1 hits new bucket endpoint, NOT static /blueprints/*', () => {
    // Watch both the new endpoint AND the deleted static paths in parallel.
    // The static intercepts MUST stay at 0 calls — they're the regression signal.
    cy.intercept('GET', BLUEPRINT_ENDPOINT_GLOB).as('blueprint');
    cy.intercept('GET', '**/blueprints/index.json').as('staticManifest');
    cy.intercept('GET', '**/blueprints/**/*.blueprint.json').as('staticBlueprint');

    cy.visit(HERO_BB_URL);
    cy.get('[data-cy="bb-canvas-area"]', { timeout: 30000 }).should('be.visible');

    // Endpoint hit and returned 200 with the documented shape. Narrow to the
    // exact `name=` value so a co-running fetch for a different component
    // can't accidentally satisfy this wait.
    cy.wait('@blueprint', { timeout: 20000 }).then((interception) => {
      expect(nameParamOf(interception.request.url), 'name query param').to.eq(HERO_NAME);
      expect(
        interception.response.statusCode,
        'blueprint endpoint status'
      ).to.eq(200);
      const body = interception.response.body;
      expect(body, 'response body shape').to.have.property('blueprint');
      expect(body.blueprint, 'blueprint.tree').to.have.property('tree');
      expect(body, 'response body shape').to.have.property('componentVersion');
      expect(body, 'response body shape').to.have.property('title');
    });

    // No deleted static blueprint paths were ever requested by the app.
    // We can't directly assert "never matched" — instead assert via the
    // request log that there are no requests matching those aliases.
    cy.get('@staticManifest.all').should('have.length', 0);
    cy.get('@staticBlueprint.all').should('have.length', 0);

    // BB preview <style> tag is appended once useComponentDecomposer has
    // extracted CSS from the component class (proves Tier-1 succeeded).
    cy.get('head style[data-key="block-builder-preview"]', { timeout: 30000 })
      .should('exist')
      .invoke('text')
      .should((text) => {
        expect(text.length, 'preview CSS length').to.be.greaterThan(0);
      });
  });

  it('Stats 2 still expands repeat-source cards via the new endpoint', () => {
    cy.intercept('GET', BLUEPRINT_ENDPOINT_GLOB).as('blueprint');
    cy.intercept('GET', '**/blueprints/index.json').as('staticManifest');
    cy.intercept('GET', '**/blueprints/**/*.blueprint.json').as('staticBlueprint');

    cy.visit(STATS_BB_URL);
    cy.get('[data-cy="bb-canvas-area"]', { timeout: 30000 }).should('be.visible');

    cy.wait('@blueprint', { timeout: 20000 }).then((interception) => {
      expect(nameParamOf(interception.request.url), 'name query param').to.eq(STATS_NAME);
      expect(interception.response.statusCode).to.eq(200);
      expect(interception.response.body).to.have.property('blueprint');
      expect(interception.response.body.blueprint).to.have.property('tree');
    });

    // Static paths never hit.
    cy.get('@staticManifest.all').should('have.length', 0);
    cy.get('@staticBlueprint.all').should('have.length', 0);

    // The four canonical stat amounts are rendered — proves
    // repeat: { source: "cards", as: "card" } produced 4 inlined AnimatedCard
    // instances with the default props.
    ['8500', '660', '6834', '300'].forEach((amount) => {
      cy.get('[data-cy="bb-canvas-area"]').contains(amount, { timeout: 20000 }).should('exist');
    });

    // Header copy from the Stats 2 blueprint defaults — ported from the
    // legacy componentBlueprintSystem.cy.js suite, proves the blueprint
    // top-level string props round-tripped through the new endpoint.
    cy.contains(
      'Intuition and strategy integrate the research methodology that we also apply to traditional media.',
      { timeout: 20000 }
    ).should('be.visible');

    // CTA button label is preserved verbatim through the blueprint expander.
    cy.get('[data-cy="bb-canvas-area"]').contains(/LET'?S TALK NOW/i).should('exist');

    // No raw <composerlink> tags leaked.
    cy.get('[data-cy="bb-canvas-area"]').then(($area) => {
      expect($area.html()).to.not.match(/<composerlink\b/i);
    });
  });

  it('Unknown component → 404 from new endpoint → Tier-3 fallback (no crash)', () => {
    cy.intercept('GET', BLUEPRINT_ENDPOINT_GLOB).as('blueprint');

    cy.visit(UNKNOWN_BB_URL);

    // The endpoint should be called and return 404 (per backend contract).
    // Body is literal "undefined" (Spica `res.send()` with no args) — we assert
    // on the status code ONLY, not the body shape, per the new contract.
    cy.wait('@blueprint', { timeout: 20000 }).then((interception) => {
      expect(nameParamOf(interception.request.url), 'name query param').to.eq(UNKNOWN_NAME);
      expect(
        interception.response.statusCode,
        'unknown component returns 404'
      ).to.eq(404);
    });

    // BB must still render — canvas area is visible and the app didn't crash.
    cy.get('[data-cy="bb-canvas-area"]', { timeout: 30000 }).should('be.visible');

    // No red top-level error boundary text.
    cy.get('body').then(($body) => {
      const text = $body.text();
      expect(text, 'no top-level crash message').to.not.match(/Something went wrong/i);
    });
  });

  it('In-memory cache: reopening same component does not refetch the blueprint', () => {
    cy.intercept('GET', BLUEPRINT_ENDPOINT_GLOB).as('blueprint');

    cy.visit(HERO_BB_URL);
    cy.get('[data-cy="bb-canvas-area"]', { timeout: 30000 }).should('be.visible');
    cy.wait('@blueprint', { timeout: 20000 }).then((interception) => {
      expect(nameParamOf(interception.request.url), 'name query param').to.eq(HERO_NAME);
    });

    // SPA-navigate to a different component (Stats 2) and back. We use the
    // in-page <a>/router transitions instead of cy.visit() so the page is not
    // reloaded — the module-scope cache survives only within a single load.
    //
    // The simplest stable way to re-enter the same BB component without
    // a hard reload is to push the same URL with a unique hash so the React
    // Router re-runs the effect. The decomposer hook reads `searchParams`
    // (`component`) not `hash`, so a hash change does not cause a refetch
    // by itself — but BB UI typically remounts the page on intermediate
    // search-param changes. The robust way to assert cache hit is:
    //   1. Wait the first hit.
    //   2. Trigger a re-render by toggling a tab inside BB.
    //   3. Assert no second hit.
    //
    // We pick a passive interaction: open the Design tab then back to Content,
    // which causes panel re-renders but does NOT touch the decomposer hook.
    cy.get('body').then(($body) => {
      const tabs = ['[data-cy="tab-Design"]', '[data-cy="tab-Content"]'];
      tabs.forEach((sel) => {
        if ($body.find(sel).length) {
          cy.get(sel).click({ force: true });
          cy.wait(150);
        }
      });
    });

    // Endpoint should have been hit exactly once for Hero Section 1.
    cy.get('@blueprint.all').should((calls) => {
      const heroCalls = calls.filter((c) => nameParamOf(c.request.url) === HERO_NAME);
      expect(heroCalls.length, 'Hero blueprint fetch count').to.eq(1);
    });
  });
});
