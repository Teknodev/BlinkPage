/**
 * AuthBridge page — full audit Cypress spec.
 *
 * The page mounts at /auth-bridge?token=<token>&redirect=<safePath>. It calls
 * functionService.verifyToken(token):
 *   - success → authentication.setToken(token) + navigate(redirect, replace)
 *   - failure → notificationService.errorNotification + navigate to /authentication
 *
 * Source: landing-composer/src/pages/auth-bridge/auth-bridge.tsx
 *
 * Behaviour to lock in:
 *   1. Loading gif renders while verifyToken is pending.
 *   2. Missing token → immediate redirect to /authentication.
 *   3. Verified token → redirect to safe relative path.
 *   4. Unsafe redirect target (absolute / protocol-relative) → falls back to "/".
 *   5. verifyToken rejection → /authentication.
 *
 * Note: no data-cy hooks exist on the bridge today. The spec anchors on the
 * loading gif <img src="/blinkpage-loading.gif"> sentinel. Flagged for hook.
 */

// FE source: landing-composer/src/classes/Function.ts:1355
//   apiUtils.apiService.post(`/auth/verify-token`, { token })
// apiService baseURL = `${VITE_API_URL}/fn-execute`
// Final URL = `${VITE_API_URL}/fn-execute/auth/verify-token`
const VERIFY_API = '**/fn-execute/auth/verify-token*';

describe('Auth Bridge Page', () => {
  it('renders the loading gif while the verifyToken request is pending', () => {
    cy.intercept('POST', VERIFY_API, (req) => {
      req.reply((res) => {
        res.setDelay(1500);
        res.send({ statusCode: 200, body: { valid: true } });
      });
    }).as('verifyDelayed');

    cy.visit('/auth-bridge?token=cypress-pending-token');

    cy.get('img[src="/blinkpage-loading.gif"]', { timeout: 10000 })
      .should('be.visible');
  });

  it('redirects to /authentication when no token query param is present', () => {
    cy.visit('/auth-bridge');
    cy.url({ timeout: 10000 }).should('include', '/authentication');
  });

  it('redirects to the safe relative redirect target after a successful verifyToken', () => {
    cy.intercept('POST', VERIFY_API, {
      statusCode: 200,
      body: { valid: true },
    }).as('verifyOk');

    cy.visit('/auth-bridge?token=cypress-ok-token&redirect=/projects');

    cy.wait('@verifyOk', { timeout: 15000 });
    cy.url({ timeout: 15000 }).should('include', '/projects');
  });

  it('falls back to "/" when the redirect target is an absolute URL', () => {
    cy.intercept('POST', VERIFY_API, {
      statusCode: 200,
      body: { valid: true },
    }).as('verifyOkAbs');

    cy.visit('/auth-bridge?token=cypress-ok-token&redirect=https://evil.example.com');

    cy.wait('@verifyOkAbs', { timeout: 15000 });
    cy.location('pathname', { timeout: 15000 }).should('eq', '/');
  });

  it('falls back to "/" when the redirect target is protocol-relative', () => {
    cy.intercept('POST', VERIFY_API, {
      statusCode: 200,
      body: { valid: true },
    }).as('verifyOkProtoRel');

    cy.visit('/auth-bridge?token=cypress-ok-token&redirect=//evil.example.com/foo');

    cy.wait('@verifyOkProtoRel', { timeout: 15000 });
    cy.location('pathname', { timeout: 15000 }).should('eq', '/');
  });

  it('redirects to /authentication when verifyToken rejects', () => {
    cy.intercept('POST', VERIFY_API, {
      statusCode: 401,
      body: { message: 'Token expired' },
    }).as('verifyFail');

    cy.visit('/auth-bridge?token=cypress-bad-token&redirect=/projects');

    cy.wait('@verifyFail', { timeout: 15000 });
    cy.url({ timeout: 15000 }).should('include', '/authentication');
  });
});
