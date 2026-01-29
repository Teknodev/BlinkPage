// const { loginPage } = require("../../support/pages/loginPage");

import { verifyTextField } from "../../support/common";
import { loginPage } from "../../support/pages/loginPage";


describe('Candidate Registration & Apply', () => {

  it('Login with valid email and invalid password', () => {

    // 🌐 Visit the app's root page
    cy.visit('/');
    loginPage.verifyLandingBody();

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
        borderRadius: '6px', value: "Wrong123", shouldType: true, shouldClear: true, placeholder: "Password"
      },
      true,
      true
    );

    loginPage.clickEyeIcon();

    loginPage.signInButton();

    loginPage.verifyToastMessage("Identifier or password was incorrect.");  
  });

  it('Login with invalid email and valid password', () => {

    // 🌐 Visit the app's root page
    cy.visit('/');
    loginPage.verifyLandingBody();

    //Navigate to login page
    loginPage.clickProfileIcon();

    //Email field visibility and type check
    verifyTextField(
      'input[name="email"]',
      {
        fontSize: "10px", textColor: "rgb(220, 220, 220)", backgroundColor: "rgb(33, 33, 33)",
        borderRadius: '6px', value: "invalid@test.com", shouldType: true, shouldClear: true, placeholder: "E-mail"
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

    loginPage.verifyToastMessage('Something went wrong');
  });

  it('Login with empty email and password', () => {

    // 🌐 Visit the app's root page
    cy.visit('/');
    loginPage.verifyLandingBody();

    //Navigate to login page
    loginPage.clickProfileIcon();

    //Email field visibility and type check
    verifyTextField(
      'input[name="email"]',
      {
        fontSize: "10px", textColor: "rgb(220, 220, 220)", backgroundColor: "rgb(33, 33, 33)",
        borderRadius: '6px', value: "", shouldType: true, shouldClear: true, placeholder: "E-mail"
      },
      true,
      true
    );

    loginPage.signInButton();

    //Email field error message
    loginPage.requiredErrorMessage('input[name="email"]', 'Required');

    //Email field visibility and type check
    verifyTextField(
      'input[type="password"]',
      {
        fontSize: "10px", textColor: "rgb(220, 220, 220)", backgroundColor: "rgb(33, 33, 33)",
        borderRadius: '6px', value: "", shouldType: true, shouldClear: true, placeholder: "Password"
      },
      true,
      true
    );

    //Password field error message
    loginPage.requiredErrorMessage('input[name="password"]', 'Password must contain at least one uppercase letter, one number, and be at least 5 characters long. Only letters and numbers are allowed.');

    loginPage.clickEyeIcon();

  });

  it('Invalid email and Password format', () => {

    // 🌐 Visit the app's root page
    cy.visit('/');
    loginPage.verifyLandingBody();

    //Navigate to login page
    loginPage.clickProfileIcon();

    //Email field visibility and type check
    verifyTextField(
      'input[name="email"]',
      {
        fontSize: "10px", textColor: "rgb(220, 220, 220)", backgroundColor: "rgb(33, 33, 33)",
        borderRadius: '6px', value: "test@invalid", shouldType: true, shouldClear: true, placeholder: "E-mail"
      },
      true,
      true
    );

    loginPage.signInButton();

    //Email field error message
    loginPage.requiredErrorMessage('input[name="email"]', 'Invalid email');

    //Password must be at least 5 characters long.
    verifyTextField(
      'input[type="password"]',
      {
        fontSize: "10px", textColor: "rgb(220, 220, 220)", backgroundColor: "rgb(33, 33, 33)",
        borderRadius: '6px', value: "123", shouldType: true, shouldClear: true, placeholder: "Password"
      },
      true,
      true
    );

    //Password field error message
    loginPage.requiredErrorMessage('input[name="password"]', 'Password must be at least 5 characters long.');

    //Password must contain at least one uppercase letter.
    verifyTextField(
      'input[type="password"]',
      {
        fontSize: "10px", textColor: "rgb(220, 220, 220)", backgroundColor: "rgb(33, 33, 33)",
        borderRadius: '6px', value: "12345", shouldType: true, shouldClear: true, placeholder: "Password"
      },
      true,
      true
    );

    //Password field error message
    loginPage.requiredErrorMessage('input[name="password"]', 'Password must contain at least one uppercase letter.');


    //Password can only contain letters and numbers.
    verifyTextField(
      'input[type="password"]',
      {
        fontSize: "10px", textColor: "rgb(220, 220, 220)", backgroundColor: "rgb(33, 33, 33)",
        borderRadius: '6px', value: "A@12345", shouldType: true, shouldClear: true, placeholder: "Password"
      },
      true,
      true
    );

    //Password field error message
    loginPage.requiredErrorMessage('input[name="password"]', 'Password can only contain letters and numbers.');



    loginPage.clickEyeIcon();

    loginPage.signInButton();

    // loginPage.verifyToastMessage();
  });

  it('Login with case sensitivity in email', () => {

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
        borderRadius: '6px', value: "SHAHBAHRAM97@GMAIL.COM", shouldType: true, shouldClear: true, placeholder: "E-mail"
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

    loginPage.verifyToastMessage('Something went wrong');
  });

  it('Multiple failed login attempts', () => {

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

    //First attempt with wrong password
    verifyTextField(
      'input[type="password"]',
      {
        fontSize: "10px", textColor: "rgb(220, 220, 220)", backgroundColor: "rgb(33, 33, 33)",
        borderRadius: '6px', value: "BlinkPage1", shouldType: true, shouldClear: true, placeholder: "Password"
      },
      true,
      true
    );

    loginPage.clickEyeIcon();

    loginPage.signInButton();

    loginPage.verifyToastMessage('Identifier or password was incorrect.');

    cy.get('button.Toastify__close-button').should('be.visible').click();

    cy.wait(5000);

    //Second Attempt with wrong password
    loginPage.signInButton();

    loginPage.verifyToastMessage('Identifier or password was incorrect.');

    cy.get('button.Toastify__close-button').should('be.visible').click();

    cy.wait(5000);

    //Third Attempt with wrong password
    loginPage.signInButton();

    loginPage.verifyToastMessage('Identifier or password was incorrect.');

    cy.get('button.Toastify__close-button').should('be.visible').click();

  });

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

    // loginPage.verifyToastMessage();
  });
});