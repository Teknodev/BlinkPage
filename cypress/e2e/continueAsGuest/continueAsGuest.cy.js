import { createNewWebsiteBtn, loginWithValidData, signUpWithValidData, verifyTextField, webCreationFlow } from "../../support/common";
import { continueAsGuestPage } from "../../support/pages/continueAsGuest";
import { loginPage } from "../../support/pages/loginPage";
import { signUpPage } from "../../support/pages/signUpPage";


describe('Enter the application as a guest user', () => {

    it('Create a new project as a guest→ Click Sign up  → Register with email', () => {

        // 🌐 Visit the app's root page
        cy.visit('/');
        loginPage.verifyLandingBody();

        //Navigate to login page
        loginPage.clickProfileIcon();

        //Continue As Guest button visibility and Click
        continueAsGuestPage.continueAsGuestButton();

        continueAsGuestPage.assertNoWebHead();

        createNewWebsiteBtn();

        webCreationFlow();

        loginPage.clickProfileIcon('');

        signUpPage.singUpButton();

        signUpWithValidData('shahbahram', 'shahbahram97@gmail.com', 'BlinkPage7424', 'BlinkPage7424');

    });

    it('Guest user creates a project→ User clicks Login→ User logs in with an existing account', () => {

        // 🌐 Visit the app's root page
        cy.visit('/');
        loginPage.verifyLandingBody();

        //Navigate to login page
        loginPage.clickProfileIcon();

        //Continue As Guest button visibility and Click
        continueAsGuestPage.continueAsGuestButton();

        continueAsGuestPage.assertNoWebHead();

        createNewWebsiteBtn();

        webCreationFlow();

        loginPage.clickProfileIcon();

        loginWithValidData('shahbahram97@gmail.com', 'BlinkPage7424');

        cy.get('[data-cy="empty-projects-message"]')
            .should('be.visible')
            .and('contain.text', "You don't have any website yet");



    });
});