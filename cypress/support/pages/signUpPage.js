/**
 * Sign-up Page Object.
 *
 * Selector contract (verified against landing-composer/src/prefabs/sign-up/sign-up.tsx
 * and landing-composer/src/prefabs/sign-in/sign-in.tsx — read-only):
 *
 *   sign-in.tsx (the "Sign up" link on the login screen):
 *     - [data-cy="signup-link"]            — outer wrapper span ("No account? Sign up")
 *     - [data-cy="signup-link"] .linkAction inner span carries the actual onClick.
 *       cy.contains() targets the clickable child to guarantee the handler fires.
 *
 *   sign-up.tsx (the signup form):
 *     - [data-cy="input-name"]              — Full name
 *     - [data-cy="input-email"]             — Email
 *     - [data-cy="password-input"]          — Password
 *     - [data-cy="input-confirm-password"]  — Confirm password
 *     - [data-cy="password-eye-icon"]       — Password visibility toggle
 *     - [data-cy="confirm-password-eye-icon"]— Confirm-password visibility toggle
 *     - [data-cy="signup-btn"]              — Create Account submit
 *     - [data-cy="signin-link"]             — Switch back to sign-in
 *     - [data-cy="continue-guest-btn"]      — Continue as Guest
 *
 * Method names are PUBLIC API for callers (cypress/e2e/pages/sign-up/singup.cy.js)
 * — do NOT rename existing methods.
 */
class SignUpPage {
    // Clicks the "Sign up" CTA on the sign-in screen to switch the auth panel
    // into sign-up mode. The data-cy="signup-link" wrapper is the outer span;
    // the click handler lives on the inner .linkAction span (FE: sign-in.tsx
    // L128-L138). We scope the contains() match inside the data-cy wrapper to
    // hit the actual clickable child.
    singUpButton(){
        cy.get('[data-cy="signup-link"]', { timeout: 20000 })
            .should('be.visible')
            .contains('Sign up')
            .click();
        // After the click, the sign-up form's name input should mount.
        cy.get('[data-cy="input-name"]', { timeout: 20000 }).should('be.visible');
    }
}
export const signUpPage = new SignUpPage();
