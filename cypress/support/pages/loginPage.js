class LoginPage {
    verifyHeader() {
        cy.get('img._img_1jn4y_1._logo_cmsuv_7', { timeout: 20000 }).should('be.visible');
        const menuItems = ['Contact Us', 'Help', 'Docs'];
        menuItems.forEach(text => {
            cy.contains('div._right_urhgg_62 div span', text)
                .should('be.visible');
        });
    }

    verifyLandingBody() {
        cy.get('div._info_gvdl4_16 span', { timeout: 20000 })
            .should('be.visible').contains('Upgrade to ');
        cy.get('div._info_gvdl4_16 span', { timeout: 20000 })
            .should('be.visible').contains(' Unlock more power');
        cy.get('div._info_gvdl4_16 span', { timeout: 20000 })
            .should('be.visible').contains('More extensions. More automations. More syncs. Even more Composer for you.');
        //Compare Plan button visibility
        cy.get('button._buttonAttom_1k5xv_1').should('be.visible').contains('Compare Plans');
    }

    createNewWebsiteBtn() {
        //Create New Website button visibility
        cy.get('button._buttonAttom_1k5xv_1').should('be.visible').contains('Create New Website');
    }

    verifyFooter() {
        cy.get('div._container_xlx0w_7 img').should('be.visible');
        const menuItems = ['Privacy Policy', 'Terms and Conditions'];
        menuItems.forEach(text => {
            cy.contains('div._right_xlx0w_19 a', text)
                .should('be.visible');
        });


    }

    clickProfileIcon() {
        cy.get('button._profileButton_1sr71_5', { timeout: 20000 }).should('be.visible').click();
        //Verify Logo
        cy.get('img[alt="Logo"]').should('be.visible');

    }

    clickEyeIcon(index=0) {
        cy.get('span._icon_1ov99_55').eq(index).should('be.visible').click();
        //Password should be visible now
        cy.get('input[name="password"]').should('have.attr', 'type', 'text');
    }

    signInButton() {
        cy.get('button._buttonAttom_1k5xv_1').eq(0).should('have.text', "Sign in").click();
    }

    verifyToastMessage(toastMessage) {
        cy.get('div.Toastify__toast.Toastify__toast', { timeout: 6000 }).should('be.visible');
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
        cy.get('div._link_1ov99_66 span').eq(0).should('be.visible').contains('Forgotten password?').click();
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
