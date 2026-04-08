import { verifyButton, verifyErrorMessage, verifyFieldErrorMessage, verifyTextField } from "../../support/common";
import { loginPage } from "../../support/pages/loginPage";
import { signUpPage } from "../../support/pages/signUpPage";
import data from '../../fixtures/data.json'


describe('Candidate Registration & SignUp', () => {

    it('Sign up with valid data', () => {
        // 🌐 Visit the app's root page
        cy.visit('/');

        //Veirfy UI Elements on Landing Page
        loginPage.verifyHeader();
        loginPage.verifyLandingBody();
        loginPage.createNewWebsiteBtn();
        loginPage.verifyFooter();

        //Navigate to login page
        loginPage.clickProfileIcon();

        //Navigate to SignUp page
        signUpPage.singUpButton();

        //Name field visibility and type check
        verifyTextField(
            '[data-cy="input-name"]',
            {
                fontSize: "10px", 
                textColor: "rgb(220, 220, 220)",
                backgroundColor: "rgb(33, 33, 33)",
                borderRadius: '6px', 
                value: data.name, 
                shouldType: true, 
                shouldClear: true,
                placeholder: "Name"
            },
            true,
            true
        );

        //Email field visibility and type check
        verifyTextField(
            '[data-cy="input-email"]',
            {
                fontSize: "10px", 
                textColor: "rgb(220, 220, 220)", 
                backgroundColor: "rgb(33, 33, 33)",
                borderRadius: '6px',
                value: data.email, 
                shouldType: true, 
                shouldClear: true, 
                placeholder: "E-mail"
            },
            true,
            true
        );

        //Password field visibility and type check
        verifyTextField(
            '[data-cy="password-input"]',
            {
                fontSize: "10px", 
                textColor: "rgb(220, 220, 220)", 
                backgroundColor: "rgb(33, 33, 33)",
                borderRadius: '6px', 
                value: data.password, 
                shouldType: true, 
                shouldClear: true, 
                placeholder: "Password"
            },
            true,
            true
        );

        // loginPage.clickEyeIcon();

        //Confirm Password field visibility and type check
        verifyTextField(
            '[data-cy="input-confirm-password"]',
            {
                fontSize: "10px", 
                textColor: "rgb(220, 220, 220)", 
                backgroundColor: "rgb(33, 33, 33)",
                borderRadius: '6px', 
                value: data.password, 
                shouldType: true, 
                shouldClear: true, 
                placeholder: "Confirm Password"
            },
            true,
            true
        );

        // loginPage.clickEyeIcon();

        //Sing Up button
        verifyButton('[data-cy="signup-btn"]', {
            text: 'Sign up', 
            fontSize: '12px', 
            textColor: 'rgb(33, 33, 33)',
            backgroundColor: 'rgb(136, 231, 136)', 
            borderRadius: '6px', 
            disabled: false
        }, true);

        cy.wait(5000)

        loginPage.verifyToastMessage('This email has already registered');
    });
    it('Sign up with already registered email', () => {

        // 🌐 Visit the app's root page
        cy.visit('/');

        //Navigate to login page
        loginPage.clickProfileIcon();

        //Navigate to SignUp page
        signUpPage.singUpButton();

        //Name field visibility and type check
        verifyTextField(
            '[data-cy="input-name"]',
            {
                fontSize: "10px", 
                textColor: "rgb(220, 220, 220)", 
                backgroundColor: "rgb(33, 33, 33)",
                borderRadius: '6px', 
                value: data.name, 
                shouldType: true, 
                shouldClear: true, 
                placeholder: "Name"
            },
            true,
            true
        );

        //Email field visibility and type check
        verifyTextField(
            '[data-cy="input-email"]',
            {
                fontSize: "10px", 
                textColor: "rgb(220, 220, 220)", 
                backgroundColor: "rgb(33, 33, 33)",
                borderRadius: '6px', 
                value: data.email, 
                shouldType: true, 
                shouldClear: true, 
                placeholder: "E-mail"
            },
            true,
            true
        );

        //Password field visibility and type check
        verifyTextField(
            '[data-cy="password-input"]',
            {
                fontSize: "10px", 
                textColor: "rgb(220, 220, 220)", 
                backgroundColor: "rgb(33, 33, 33)",
                borderRadius: '6px', 
                value: data.password, 
                shouldType: true, 
                shouldClear: true, 
                placeholder: "Password"
            },
            true,
            true
        );

        // loginPage.clickEyeIcon();

        //Confirm Password field visibility and type check
        verifyTextField(
            '[data-cy="input-confirm-password"]',
            {
                fontSize: "10px", 
                textColor: "rgb(220, 220, 220)", 
                backgroundColor: "rgb(33, 33, 33)",
                borderRadius: '6px', 
                value: data.password, 
                shouldType: true, 
                shouldClear: true, 
                placeholder: "Confirm Password"
            },
            true,
            true
        );

        // loginPage.clickEyeIcon();

        //Sing Up button
        verifyButton('[data-cy="signup-btn"]', {
            text: 'Sign up', 
            fontSize: '12px', 
            textColor: 'rgb(33, 33, 33)',
            backgroundColor: 'rgb(136, 231, 136)', 
            borderRadius: '6px', 
            disabled: false
        }, true);

        cy.wait(5000)

        loginPage.verifyToastMessage('This email has already registered');
    });
    it('Sign up with empty all fields', () => {

        // 🌐 Visit the app's root page
        cy.visit('/');

        //Navigate to login page
        loginPage.clickProfileIcon();

        //Navigate to SignUp page
        signUpPage.singUpButton();

        //Name field visibility and type check
        verifyTextField(
            '[data-cy="input-name"]',
            {
                fontSize: "10px", 
                textColor: "rgb(220, 220, 220)", 
                backgroundColor: "rgb(33, 33, 33)",
                borderRadius: '6px', 
                value: "", 
                shouldType: true, 
                shouldClear: true, 
                placeholder: "Name"
            },
            true,
            true
        );

        //Email field visibility and type check
        verifyTextField(
            '[data-cy="input-email"]',
            {
                fontSize: "10px", 
                textColor: "rgb(220, 220, 220)", 
                backgroundColor: "rgb(33, 33, 33)",
                borderRadius: '6px', 
                value: "", 
                shouldType: true, 
                shouldClear: true, 
                placeholder: "E-mail"
            },
            true,
            true
        );

        //Password field visibility and type check
        verifyTextField(
            '[data-cy="password-input"]',
            {
                fontSize: "10px", 
                textColor: "rgb(220, 220, 220)", 
                backgroundColor: "rgb(33, 33, 33)",
                borderRadius: '6px', 
                value: "", 
                shouldType: true, 
                shouldClear: true, placeholder: "Password"
            },
            true,
            true
        );

        // loginPage.clickEyeIcon();

        //Confirm Password field visibility and type check
        verifyTextField(
            '[data-cy="input-confirm-password"]',
            {
                fontSize: "10px", 
                textColor: "rgb(220, 220, 220)", 
                backgroundColor: "rgb(33, 33, 33)",
                borderRadius: '6px', 
                value: "", 
                shouldType: true, 
                shouldClear: true, 
                placeholder: "Confirm Password"
            },
            true,
            true
        );

        // loginPage.clickEyeIcon();

        //Sing Up button
        verifyButton('[data-cy="signup-btn"]', {
            text: 'Sign up', 
            fontSize: '12px', 
            textColor: 'rgb(33, 33, 33)',
            backgroundColor: 'rgb(136, 231, 136)', 
            borderRadius: '6px', 
            disabled: false
        }, true);

        loginPage.requiredErrorMessage('[data-cy="input-name"]', 'Required');
        verifyFieldErrorMessage('email', 'Required');
        verifyFieldErrorMessage('password', 'Password must contain at least one uppercase letter, one number, and be at least 5 characters long. Only letters and numbers are allowed.')
        verifyFieldErrorMessage('confirmPassword', 'Confirm Password is required.')
    });
    it('Sign up with empty Name field', () => {

        // 🌐 Visit the app's root page
        cy.visit('/');

        //Navigate to login page
        loginPage.clickProfileIcon();

        //Navigate to SignUp page
        signUpPage.singUpButton();

        //Name field visibility and type check
        verifyTextField(
            '[data-cy="input-name"]',
            {
                fontSize: "10px", 
                textColor: "rgb(220, 220, 220)", 
                backgroundColor: "rgb(33, 33, 33)",
                borderRadius: '6px', 
                value: "", 
                shouldType: true, 
                shouldClear: true, 
                placeholder: "Name"
            },
            true,
            true
        );

        //Email field visibility and type check
        verifyTextField(
            '[data-cy="input-email"]',
            {
                fontSize: "10px", 
                textColor: "rgb(220, 220, 220)", 
                backgroundColor: "rgb(33, 33, 33)",
                borderRadius: '6px', 
                value: data.email, 
                shouldType: true, 
                shouldClear: true, 
                placeholder: "E-mail"
            },
            true,
            true
        );

        //Password field visibility and type check
        verifyTextField(
            '[data-cy="password-input"]',
            {
                fontSize: "10px", 
                textColor: "rgb(220, 220, 220)", 
                backgroundColor: "rgb(33, 33, 33)",
                borderRadius: '6px', 
                value: data.password, 
                shouldType: true, 
                shouldClear: true, 
                placeholder: "Password"
            },
            true,
            true
        );

        // loginPage.clickEyeIcon();

        //Confirm Password field visibility and type check
        verifyTextField(
            '[data-cy="input-confirm-password"]',
            {
                fontSize: "10px", 
                textColor: "rgb(220, 220, 220)", 
                backgroundColor: "rgb(33, 33, 33)",
                borderRadius: '6px', 
                value: data.password, 
                shouldType: true, 
                shouldClear: true, 
                placeholder: "Confirm Password"
            },
            true,
            true
        );

        // loginPage.clickEyeIcon();

        //Sing Up button
        verifyButton('[data-cy="signup-btn"]', {
            text: 'Sign up', 
            fontSize: '12px', 
            textColor: 'rgb(33, 33, 33)',
            backgroundColor: 'rgb(136, 231, 136)', 
            borderRadius: '6px', 
            disabled: false
        }, true);

        //cy.wait(3000)
        verifyFieldErrorMessage('name', 'Required');
    });
    it('Sign up with empty Email field', () => {

        // 🌐 Visit the app's root page
        cy.visit('/');

        //Navigate to login page
        loginPage.clickProfileIcon();

        //Navigate to SignUp page
        signUpPage.singUpButton();

        //Name field visibility and type check
        verifyTextField(
            '[data-cy="input-name"]',
            {
                fontSize: "10px", 
                textColor: "rgb(220, 220, 220)", 
                backgroundColor: "rgb(33, 33, 33)",
                borderRadius: '6px', 
                value: data.name, 
                shouldType: true, 
                shouldClear: true, 
                placeholder: "Name"
            },
            true,
            true
        );

        //Email field visibility and type check
        verifyTextField(
            '[data-cy="input-email"]',
            {
                fontSize: "10px", 
                textColor: "rgb(220, 220, 220)", 
                backgroundColor: "rgb(33, 33, 33)",
                borderRadius: '6px', 
                value: "", 
                shouldType: true, 
                shouldClear: true, 
                placeholder: "E-mail"
            },
            true,
            true
        );

        //Password field visibility and type check
        verifyTextField(
            '[data-cy="password-input"]',
            {
                fontSize: "10px", 
                textColor: "rgb(220, 220, 220)", 
                backgroundColor: "rgb(33, 33, 33)",
                borderRadius: '6px', 
                value: data.password, 
                shouldType: true, 
                shouldClear: true, 
                placeholder: "Password"
            },
            true,
            true
        );

        // loginPage.clickEyeIcon();

        //Confirm Password field visibility and type check
        verifyTextField(
            '[data-cy="input-confirm-password"]',
            {
                fontSize: "10px", 
                textColor: "rgb(220, 220, 220)", 
                backgroundColor: "rgb(33, 33, 33)",
                borderRadius: '6px', 
                value: data.confirmPassword, 
                shouldType: true, 
                shouldClear: true, 
                placeholder: "Confirm Password"
            },
            true,
            true
        );

        // loginPage.clickEyeIcon();

        //Sing Up button
        verifyButton('[data-cy="signup-btn"]', {
            text: 'Sign up', 
            fontSize: '12px', 
            textColor: 'rgb(33, 33, 33)',
            backgroundColor: 'rgb(136, 231, 136)', 
            borderRadius: '6px', 
            disabled: false
        }, true);
        loginPage.requiredErrorMessage('[data-cy="input-email"]', 'Required')
    });
    it('Sign up with empty password fields', () => {

        // 🌐 Visit the app's root page
        cy.visit('/');

        //Navigate to login page
        loginPage.clickProfileIcon();

        //Navigate to SignUp page
        signUpPage.singUpButton();

        //Name field visibility and type check
        verifyTextField(
            '[data-cy="input-name"]',
            {
                fontSize: "10px", 
                textColor: "rgb(220, 220, 220)", 
                backgroundColor: "rgb(33, 33, 33)",
                borderRadius: '6px', 
                value: data.name, 
                shouldType: true, 
                shouldClear: true, 
                placeholder: "Name"
            },
            true,
            true
        );

        //Email field visibility and type check
        verifyTextField(
            '[data-cy="input-email"]',
            {
                fontSize: "10px", 
                textColor: "rgb(220, 220, 220)", 
                backgroundColor: "rgb(33, 33, 33)",
                borderRadius: '6px', 
                value: data.email, 
                shouldType: true, 
                shouldClear: true, 
                placeholder: "E-mail"
            },
            true,
            true
        );

        //Password field visibility and type check
        verifyTextField(
            '[data-cy="password-input"]',
            {
                fontSize: "10px", 
                textColor: "rgb(220, 220, 220)", 
                backgroundColor: "rgb(33, 33, 33)",
                borderRadius: '6px', 
                value: "", 
                shouldType: true, 
                shouldClear: true, 
                placeholder: "Password"
            },
            true,
            true
        );

        // loginPage.clickEyeIcon();

        //Confirm Password field visibility and type check
        verifyTextField(
            '[data-cy="input-confirm-password"]',
            {
                fontSize: "10px", 
                textColor: "rgb(220, 220, 220)", 
                backgroundColor: "rgb(33, 33, 33)",
                borderRadius: '6px', 
                value: data.password, 
                shouldType: true, shouldClear: true, placeholder: "Confirm Password"
            },
            true,
            true
        );

        // loginPage.clickEyeIcon();

        //Sing Up button
        verifyButton('[data-cy="signup-btn"]', {
            text: 'Sign up', 
            fontSize: '12px', 
            textColor: 'rgb(33, 33, 33)',
            backgroundColor: 'rgb(136, 231, 136)', 
            borderRadius: '6px', 
            disabled: false
        }, true);

        verifyFieldErrorMessage('password', 'Password must contain at least one uppercase letter, one number, and be at least 5 characters long. Only letters and numbers are allowed.');
        verifyFieldErrorMessage('confirmPassword', 'Passwords must match.')
    });
    it('Sign up with mismatched passwords', () => {

        // 🌐 Visit the app's root page
        cy.visit('/');

        //Veirfy UI Elements on Landing Page
        loginPage.verifyHeader();
        loginPage.verifyLandingBody();
        loginPage.createNewWebsiteBtn();
        loginPage.verifyFooter();

        //Navigate to login page
        loginPage.clickProfileIcon();

        //Navigate to SignUp page
        signUpPage.singUpButton();

        //Name field visibility and type check
        verifyTextField(
            '[data-cy="input-name"]',
            {
                fontSize: "10px", 
                textColor: "rgb(220, 220, 220)", 
                backgroundColor: "rgb(33, 33, 33)",
                borderRadius: '6px', 
                value: data.name, 
                shouldType: true, 
                shouldClear: true, 
                placeholder: "Name"
            },
            true,
            true
        );

        //Email field visibility and type check
        verifyTextField(
            '[data-cy="input-email"]',
            {
                fontSize: "10px", 
                textColor: "rgb(220, 220, 220)", 
                backgroundColor: "rgb(33, 33, 33)",
                borderRadius: '6px', 
                value: data.email, 
                shouldType: true, 
                shouldClear: true, 
                placeholder: "E-mail"
            },
            true,
            true
        );

        //Password field visibility and type check
        verifyTextField(
            '[data-cy="password-input"]',
            {
                fontSize: "10px", 
                textColor: "rgb(220, 220, 220)", 
                backgroundColor: "rgb(33, 33, 33)",
                borderRadius: '6px', 
                value: data.password, 
                shouldType: true, 
                shouldClear: true, 
                placeholder: "Password"
            },
            true,
            true
        );

        // loginPage.clickEyeIcon();

        //Confirm Password field visibility and type check
        verifyTextField(
            '[data-cy="input-confirm-password"]',
            {
                fontSize: "10px", 
                textColor: "rgb(220, 220, 220)", 
                backgroundColor: "rgb(33, 33, 33)",
                borderRadius: '6px', 
                value: "Blink654", 
                shouldType: true, 
                shouldClear: true, 
                placeholder: "Confirm Password"
            },
            true,
            true
        );

        //Sing Up button
        verifyButton('[data-cy="signup-btn"]', {
            text: 'Sign up', 
            fontSize: '12px', 
            textColor: 'rgb(33, 33, 33)',
            backgroundColor: 'rgb(136, 231, 136)', 
            borderRadius: '6px', 
            disabled: false
        }, true);

        cy.wait(1000)

        loginPage.requiredErrorMessage('[data-cy="input-confirm-password"]', 'Passwords must match.')

        // loginPage.verifyToastMessage();
    });
    it('Sign up with empty Confirm password fields', () => {

        // 🌐 Visit the app's root page
        cy.visit('/');

        //Navigate to login page
        loginPage.clickProfileIcon();

        //Navigate to SignUp page
        signUpPage.singUpButton();

        //Name field visibility and type check
        verifyTextField(
            '[data-cy="input-name"]',
            {
                fontSize: "10px", 
                textColor: "rgb(220, 220, 220)", 
                backgroundColor: "rgb(33, 33, 33)",
                borderRadius: '6px', 
                value: data.name, 
                shouldType: true, 
                shouldClear: true, 
                placeholder: "Name"
            },
            true,
            true
        );

        //Email field visibility and type check
        verifyTextField(
            '[data-cy="input-email"]',
            {
                fontSize: "10px", 
                textColor: "rgb(220, 220, 220)", 
                backgroundColor: "rgb(33, 33, 33)",
                borderRadius: '6px', 
                value: data.email, 
                shouldType: true, 
                shouldClear: true, 
                placeholder: "E-mail"
            },
            true,
            true
        );

        //Password field visibility and type check
        verifyTextField(
            '[data-cy="password-input"]',
            {
                fontSize: "10px", 
                textColor: "rgb(220, 220, 220)", 
                backgroundColor: "rgb(33, 33, 33)",
                borderRadius: '6px', 
                value: data.password, 
                shouldType: true, 
                shouldClear: true, 
                placeholder: "Password"
            },
            true,
            true
        );

        // loginPage.clickEyeIcon();

        //Confirm Password field visibility and type check
        verifyTextField(
            '[data-cy="input-confirm-password"]',
            {
                fontSize: "10px", 
                textColor: "rgb(220, 220, 220)", 
                backgroundColor: "rgb(33, 33, 33)",
                borderRadius: '6px', 
                value: "", 
                shouldType: true, 
                shouldClear: true, 
                placeholder: "Confirm Password"
            },
            true,
            true
        );

        // loginPage.clickEyeIcon();

        //Sing Up button
        verifyButton('[data-cy="signup-btn"]', {
            text: 'Sign up', 
            fontSize: '12px', 
            textColor: 'rgb(33, 33, 33)',
            backgroundColor: 'rgb(136, 231, 136)', 
            borderRadius: '6px', 
            disabled: false
        }, 
        true);

        verifyFieldErrorMessage('confirmPassword', 'Confirm Password is required.')
    });
    it('Verify password masking', () => {

        // 🌐 Visit the app's root page
        cy.visit('/');

        //Navigate to login page
        loginPage.clickProfileIcon();

        //Navigate to SignUp page
        signUpPage.singUpButton();

        //Name field visibility and type check
        verifyTextField(
            '[data-cy="input-name"]',
            {
                fontSize: "10px", textColor: "rgb(220, 220, 220)", backgroundColor: "rgb(33, 33, 33)",
                borderRadius: '6px', value: "Shahbahram", shouldType: true, shouldClear: true, placeholder: "Name"
            },
            true,
            true
        );

        //Email field visibility and type check
        verifyTextField(
            '[data-cy="input-email"]',
            {
                fontSize: "10px", 
                textColor: "rgb(220, 220, 220)", 
                backgroundColor: "rgb(33, 33, 33)",
                borderRadius: '6px', 
                value: data.email, 
                shouldType: true, 
                shouldClear: true, 
                placeholder: "E-mail"
            },
            true,
            true
        );

        //Password field visibility and type check
        verifyTextField(
            '[data-cy="password-input"]',
            {
                fontSize: "10px", 
                textColor: "rgb(220, 220, 220)", 
                backgroundColor: "rgb(33, 33, 33)",
                borderRadius: '6px', 
                value: data.password, 
                shouldType: true, 
                shouldClear: true, 
                placeholder: "Password"
            },
            true,
            true
        );

        loginPage.clickEyeIcon(0);

    });
});