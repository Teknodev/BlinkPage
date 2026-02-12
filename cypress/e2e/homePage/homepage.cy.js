// const { loginPage } = require("../../support/pages/loginPage");

import { createNewWebsiteBtn, fieldInput, verifyErrorMessage, verifyFieldErrorMessage, verifyTextField, verifyUrl, webCreationFlow } from "../../support/common";
import { homePage } from "../../support/pages/homePage";
import { loginPage } from "../../support/pages/loginPage";
import { continueAsGuestPage } from "../../support/pages/continueAsGuest";
import { contactUsPage } from "../../support/pages/contact";


describe('Candidate Registration & Apply', () => {
    beforeEach(() => {
        // Visit the app's root page
        cy.visit('/')
        //Veirfy UI Elements on Landing Page
        loginPage.verifyHeader();
        loginPage.verifyLandingBody();
        loginPage.createNewWebsiteBtn();
        loginPage.verifyFooter();
  })
    it('Verify "Compare Plans" button click', () => {

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

        cy.contains('Compare Plans').should('be.visible').click();

        verifyUrl('/plans')


    });  
    it('Navigate to Login, verifies UI and try login with valid credentials', () => {

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
    it('Verify footer redirections and copyright text', () => {

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

        loginPage.verifyFooterRedirections();


    });
    it('Verify Profile Icon (Guest User)', () => {

        loginPage.clickProfileIcon();
        verifyTextField(
            'input[name="email"]',
            {
                fontSize: "10px", textColor: "rgb(220, 220, 220)", backgroundColor: "rgb(33, 33, 33)",
                borderRadius: '6px', value: "", shouldType: true, shouldClear: true, placeholder: "E-mail"
            },
            false,
            false
        );

        //Email field visibility and type check
        verifyTextField(
            'input[type="password"]',
            {
                fontSize: "10px", textColor: "rgb(220, 220, 220)", backgroundColor: "rgb(33, 33, 33)",
                borderRadius: '6px', value: "", shouldType: true, shouldClear: true, placeholder: "Password"
            },
            false,
            false
        );

        continueAsGuestPage.continueAsGuestButton();
        loginPage.clickProfileIcon();
        verifyUrl('/authentication')




    });
    it('Verify Profile Icon (Registered User)', () => {

        loginPage.clickProfileIcon();
        verifyTextField(
            'input[name="email"]',
            {
                fontSize: "10px", textColor: "rgb(220, 220, 220)", backgroundColor: "rgb(33, 33, 33)",
                borderRadius: '6px', value: "shahbahram97@gmail.com", shouldType: true, shouldClear: true, placeholder: "E-mail"
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
        
        loginPage.clickProfileIcon();
        
        homePage.verifyProfileDropDown();





    });
    it('Verify Contact Us page loads and Url',() => {
        contactUsPage.contactusbutton()
        verifyUrl('/contact')
    });
    it('Verify Subject dropdown options are visible',() => {
        contactUsPage.contactusbutton()
        verifyUrl('/contact')
        verifyTextField(
            '[class*="_searchInput"]',
            {
                fontSize: "10px", textColor: "rgb(255, 255, 255)", backgroundColor: "rgba(0, 0, 0, 0)",
                borderRadius: '0px', value: "", shouldType: true, shouldClear: true, placeholder: "Subject"
            },
            true,
            true
        );
        contactUsPage.subjectDropDown()

        
    })
    it('Verify Subject field mandatory',() => {
        
        contactUsPage.contactusbutton();
        
        verifyUrl('/contact');
        
        cy.wait(5000)
        
        contactUsPage.submitButton();

        cy.wait(5000)
        
        verifyErrorMessage('[class*="_error"]','Required')

    })
    it('Verify First Name field accepts valid input',() => {
        
        contactUsPage.contactusbutton();
        
        verifyUrl('/contact');
        
        verifyTextField(
            'input[placeholder="First Name"]', 
            {
                fontSize: "10px", textColor: "rgb(220, 220, 220)", backgroundColor: "rgb(33, 33, 33)",
                borderRadius: '6px', value: "John", shouldType: true, shouldClear: true, placeholder: "First Name"
            },
            true,
            true
        )
    })
    it('Verify Last Name field accepts valid input',() => {
        
        contactUsPage.contactusbutton();
        
        verifyUrl('/contact');
        
        fieldInput('input[placeholder="Last Name"]','Last Name', 'Doe')

    })
    it('Verify Email field accepts valid email',() => {
        
        contactUsPage.contactusbutton();
        
        verifyUrl('/contact');
        
        verifyTextField(
            'input[placeholder="E-mail"]',
            {
                fontSize: "10px", textColor: "rgb(220, 220, 220)", backgroundColor: "rgb(33, 33, 33)",
                borderRadius: '6px', value: "john.doe@test.com", shouldType: true, shouldClear: true, placeholder: "E-mail"
            },
            true,
            true
        )

    })
    it('Verify Email field rejects invalid email',() => {
        
        contactUsPage.contactusbutton();
        
        verifyUrl('/contact');
        
        verifyTextField(
            'input[placeholder="E-mail"]',
            {
                fontSize: "10px", textColor: "rgb(220, 220, 220)", backgroundColor: "rgb(33, 33, 33)",
                borderRadius: '6px', value: "john.doe@", shouldType: true, shouldClear: true, placeholder: "E-mail"
            },
            true,
            true
        )
        cy.get('body').click();
        verifyFieldErrorMessage('email', 'Invalid email address')

    })
    it('Verify Phone field accepts valid number',() => {
        
        contactUsPage.contactusbutton();
        
        verifyUrl('/contact');
        
        verifyTextField(
            'input[placeholder="Phone"]',
            {
                fontSize: "10px", textColor: "rgb(220, 220, 220)", backgroundColor: "rgb(33, 33, 33)",
                borderRadius: '6px', value: "9876543210", shouldType: true, shouldClear: true, placeholder: "Phone"
            },
            true,
            true
        )
    })
    it('Verify Phone field with alphabets',() => {
        
        contactUsPage.contactusbutton();
        
        verifyUrl('/contact');
        
        verifyTextField(
            'input[placeholder="Phone"]',
            {
                fontSize: "10px", textColor: "rgb(220, 220, 220)", backgroundColor: "rgb(33, 33, 33)",
                borderRadius: '6px', value: "ab352", shouldType: true, shouldClear: true, placeholder: "Phone"
            },
            true,
            true
        )
        cy.get('div[class*="_content"]').click();
        verifyFieldErrorMessage('phone', 'Phone number is not valid')

    })
    it('Verify Company field optional behavior',() => {
        
        contactUsPage.contactusbutton();
        
        verifyUrl('/contact');

        verifyTextField(
            '[class*="_searchInput"]',
            {
                fontSize: "10px", textColor: "rgb(255, 255, 255)", backgroundColor: "rgba(0, 0, 0, 0)",
                borderRadius: '0px', value: "", shouldType: true, shouldClear: true, placeholder: "Subject"
            },
            true,
            true
        );
        contactUsPage.subjectDropDown()
        cy.wait(5000)
        contactUsPage.selectDropdownOption('Plan')

        verifyTextField(
            'input[placeholder="First Name"]', 
            {
                fontSize: "10px", textColor: "rgb(220, 220, 220)", backgroundColor: "rgb(33, 33, 33)",
                borderRadius: '6px', value: "John", shouldType: true, shouldClear: true, placeholder: "First Name"
            },
            true,
            true
        );
        fieldInput('input[placeholder="Last Name"]','Last Name', 'Doe');

        verifyTextField(
            'input[placeholder="E-mail"]',
            {
                fontSize: "10px", textColor: "rgb(220, 220, 220)", backgroundColor: "rgb(33, 33, 33)",
                borderRadius: '6px', value: "john.doe@test.com", shouldType: true, shouldClear: true, placeholder: "E-mail"
            },
            true,
            true
        );


        verifyTextField(
            'input[placeholder="Phone"]',
            {
                fontSize: "10px", textColor: "rgb(220, 220, 220)", backgroundColor: "rgb(33, 33, 33)",
                borderRadius: '6px', value: "9876543210", shouldType: true, shouldClear: true, placeholder: "Phone"
            },
            true,
            true
        );
        contactUsPage.inputMessage('Testing')

        contactUsPage.submitButton()
        

    })
    it('Verify Message field min length',() => {
        
        contactUsPage.contactusbutton();
        
        verifyUrl('/contact');

        contactUsPage.inputMessage('Test')
        cy.get('div[class*="_content"]').click();

        verifyErrorMessage('[class*="_textareaContainer"]', 'Min 5 characters!')
        
        

        contactUsPage.submitButton()
        

    })
    it('Verify form submission with valid data',() => {
        
        contactUsPage.contactusbutton();
        
        verifyUrl('/contact');

        verifyTextField(
            '[class*="_searchInput"]',
            {
                fontSize: "10px", textColor: "rgb(255, 255, 255)", backgroundColor: "rgba(0, 0, 0, 0)",
                borderRadius: '0px', value: "", shouldType: true, shouldClear: true, placeholder: "Subject"
            },
            true,
            true
        );
        contactUsPage.subjectDropDown()
        cy.wait(5000)
        contactUsPage.selectDropdownOption('Plan')

        verifyTextField(
            'input[placeholder="First Name"]', 
            {
                fontSize: "10px", textColor: "rgb(220, 220, 220)", backgroundColor: "rgb(33, 33, 33)",
                borderRadius: '6px', value: "John", shouldType: true, shouldClear: true, placeholder: "First Name"
            },
            true,
            true
        );
        fieldInput('input[placeholder="Last Name"]','Last Name', 'Doe');

        verifyTextField(
            'input[placeholder="E-mail"]',
            {
                fontSize: "10px", textColor: "rgb(220, 220, 220)", backgroundColor: "rgb(33, 33, 33)",
                borderRadius: '6px', value: "john.doe@test.com", shouldType: true, shouldClear: true, placeholder: "E-mail"
            },
            true,
            true
        );


        verifyTextField(
            'input[placeholder="Phone"]',
            {
                fontSize: "10px", textColor: "rgb(220, 220, 220)", backgroundColor: "rgb(33, 33, 33)",
                borderRadius: '6px', value: "9876543210", shouldType: true, shouldClear: true, placeholder: "Phone"
            },
            true,
            true
        );
        verifyTextField(
            'input[placeholder="Company (Optional)"]',
            {
                fontSize: "10px", textColor: "rgb(220, 220, 220)", backgroundColor: "rgb(33, 33, 33)",
                borderRadius: '6px', value: "9876543210", shouldType: true, shouldClear: true, placeholder: "Company (Optional)"
            },
            true,
            true
        );


        contactUsPage.inputMessage('Testing')

        contactUsPage.submitButton()
        

    })
    it('Verify form submission without mandatory fields',() => {
        
        contactUsPage.contactusbutton();
        
        verifyUrl('/contact');

        cy.wait(5000)

        contactUsPage.submitButton();

        // subject field error message
        verifyErrorMessage('[class*="_error"]','Required')

        // First Name field error message
        verifyFieldErrorMessage('name','Required');
        
        // Last Name field  error message
        verifyFieldErrorMessage('surname','Required');
        
        // Email field error message
        verifyFieldErrorMessage('email','Required')

        // Phone number field error message
        verifyFieldErrorMessage('phone','Required')

        // Message field error message 
        verifyErrorMessage('[class*="_textareaContainer"]', 'Required')




        

    })
    it('Verify form submission without mandatory fields',() => {
        
        contactUsPage.contactusbutton();
        
        verifyUrl('/contact');
        contactUsPage.verifyExternalLink('documentation', '/documentation')
        contactUsPage.verifyExternalLink('community/support portal', '/home')

    })
    it('Verify XSS prevention in Message field',() => {
        
        contactUsPage.contactusbutton();
        
        verifyUrl('/contact');
        contactUsPage.verifyXssPrevention();

    })
    


});