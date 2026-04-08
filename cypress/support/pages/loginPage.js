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
        cy.get('[data-cy="landing-body"]', { timeout: 20000 })
            .should('be.visible').contains('Upgrade to ');
        cy.get('[data-cy="landing-body"]', { timeout: 20000 })
            .should('be.visible').contains(' Unlock more power');
        cy.get('[data-cy="landing-body"]', { timeout: 20000 })
            .should('be.visible').contains('More extensions. More automations. More syncs. Even more Composer for you.');
        //Compare Plan button visibility
        cy.get('[data-cy="compare-plans-btn"]').should('be.visible').contains('Compare Plans');
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
        cy.get('[data-cy="profile-button"]', { timeout: 20000 }).should('be.visible').click();
        //Verify Logo
        cy.get('[data-cy="auth-logo"]').should('be.visible');
    }

    clickEyeIcon(index=0) {
        cy.get('[data-cy="password-eye-icon"]').eq(index).should('be.visible').click();
        //Password should be visible now
        cy.get('[data-cy="password-input"]').should('have.attr', 'type', 'text');
    }

    signInButton() {
        cy.get('[data-cy="signin-btn"]').should('have.text', "Sign in").click();
    }

    verifyToastMessage(toastMessage) {
        cy.get('[data-cy="toast-message"]', { timeout: 6000 }).should('be.visible');
        cy.contains(toastMessage).should('be.visible')
    }

    requiredErrorMessage(selector, errorMessage) {
        //Required error message verification
        cy.get(selector)
            .closest('div')
            .within(() => {
                cy.contains(errorMessage).should('be.visible')
            })
    }

    forgotPasswordButton() {
        cy.get('[data-cy="forgot-password-link"]').should('be.visible').contains('Forgotten password?').click();
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
