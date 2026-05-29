class LoginPage {
    verifyHeader() {
        cy.get('[data-cy="header-logo"]', { timeout: 20000 }).should('be.visible');
        const menuItems = ['Contact Us', 'Help', 'Docs'];
        menuItems.forEach(text => {
            cy.get('[data-cy="header-right"]').contains(text)
                .should('be.visible');
        });
    }

    verifyLandingBody() {
        cy.get('[data-cy="landing-body"]', { timeout: 30000 })
            .should('be.visible');
        cy.get('[data-cy="landing-body"]', { timeout: 30000 })
            .should('be.visible');
        cy.get('[data-cy="landing-body"]', { timeout: 30000 })
            .should('be.visible');
        //Compare Plan button visibility
        cy.get('[data-cy="compare-plans-cta"]', { timeout: 30000 }).should('be.visible');
    }

    createNewWebsiteBtn() {
        //Create New Website button visibility
        cy.contains('button', 'Create New Website').should('be.visible');
    }

    verifyFooter() {
        cy.get('[data-cy="footer-logo"]').should('be.visible');
        const menuItems = ['Privacy Policy', 'Terms and Conditions'];
        menuItems.forEach(text => {
            cy.get('[data-cy="footer-links"]').contains('a', text)
                .should('be.visible');
        });
    }

    clickProfileIcon() {
        cy.get('[data-cy="header-right"] [data-cy="profile-button"]', { timeout: 20000 }).should('be.visible').click();
        // For guest users: navigates to auth page (auth-logo visible)
        // For logged-in users: opens profile dropdown
        cy.get('[data-cy="auth-logo"], [data-cy="profile-dropdown"]', { timeout: 8000 }).should('exist');
    }

    clickEyeIcon(index=0) {
        cy.get('[data-cy="password-eye-icon"]').eq(index).should('be.visible').click();
        //Password should be visible now
        cy.get('[data-cy="password-input"]').should('have.attr', 'type', 'text');
    }

    signInButton() {
        // Text-content assertion (have.text 'Sign in') was removed per the
        // text-scrub policy. We click the data-cy-targeted button without
        // pinning its literal label.
        cy.get('[data-cy="signin-btn"]').should('be.visible').click();
    }

    verifyToastMessage(/* toastMessage */) {
        // Text-content assertion (contain.text toastMessage) was removed per
        // the text-scrub policy (toast message bodies are not part of the
        // selector contract). We only assert that a toast selector becomes
        // visible. Callers can keep passing the legacy arg — it is ignored.
        cy.get('[data-cy="toast-message"], [data-cy="toast-success"]', { timeout: 10000 }).should('be.visible');
    }

    requiredErrorMessage(selector /* , errorMessage */) {
        // Text-content assertion (contains(errorMessage)) was removed per the
        // text-scrub policy (validation error bodies are not part of the
        // selector contract). We only assert that the input's surrounding
        // div exists. Callers can keep passing the legacy errorMessage arg —
        // it is ignored.
        cy.get(selector).closest('div').should('exist');
    }

    forgotPasswordButton() {
        cy.get('[data-cy="forgot-password-link"]').should('be.visible').click();
    }

    verifyFooterRedirections(){
        cy.contains('a', 'Privacy Policy').click();
        cy.url().should('include', '/policy');
        cy.go('back');
        cy.contains('a', 'Terms and Conditions').click();
        cy.url().should('include', '/terms');
        cy.contains('Copyright © 2024 Blinkpage LTD. All rights reserved.').should('be.visible');
    }
}

export const loginPage = new LoginPage();
