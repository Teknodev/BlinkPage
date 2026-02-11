// const { loginPage } = require("../../support/pages/loginPage");

import { createNewWebsiteBtn, verifyTextField, webCreationFlow } from "../../support/common";
import { homePage } from "../../support/pages/homePage";
import { loginPage } from "../../support/pages/loginPage";


describe('Candidate Registration & Apply', () => {
    it('Navigate to Login, verifies UI and try login with valid credentials', () => {

        // 🌐 Visit the app's root page
        cy.visit('/');

        //Veirfy UI Elements on Landing Page
        loginPage.verifyHeader();
        loginPage.verifyLandingBody();
        loginPage.createNewWebsiteBtn();
        loginPage.verifyFooter();

        //Navigate to login page
        loginPage.clickProfileIcon();

        //Email field visibility and type check
        verifyTextField(
            'input[name="email"]',
            {
                fontSize: "10px", textColor: "rgb(220, 220, 220)", backgroundColor: "rgb(33, 33, 33)",
                borderRadius: '6px', value: "shahbahram97@gamil.com", shouldType: true, shouldClear: true, placeholder: "E-mail"
            },
            true,
            true
        );

        //Email field visibility and type check
        verifyTextField(
            'input[type="password"]',
            {
                fontSize: "10px", textColor: "rgb(220, 220, 220)", backgroundColor: "rgb(33, 33, 33)",
                borderRadius: '6px', value: "BlinkPage7424", shouldType: true, shouldClear: true, placeholder: "Password"
            },
            true,
            true
        );

        loginPage.clickEyeIcon();

        loginPage.signInButton();

        homePage.verifyCard();

        createNewWebsiteBtn();

        webCreationFlow();

    });
});