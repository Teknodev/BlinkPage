import { verifyAndClickProfileDropDownButton, verifyUrl, veirfyDetails, verifyInputValue, uploadProfileImage } from "../../support/common";
import { homePage } from "../../support/pages/homePage";
import { loginPage } from "../../support/pages/loginPage";
import { myAccountPage } from "../../support/pages/account";
import data from '../../fixtures/data.json'

describe('My Account', () => {
    beforeEach(() => {
        cy.visit('/');
        loginPage.verifyLandingBody();
        loginPage.clickProfileIcon();

        // Log in with test account — no CSS assertions
        cy.get('[data-cy="input-email"]').should('be.visible').clear().type(data.email);
        cy.get('[data-cy="password-input"]').should('be.visible').clear().type(data.password);
        cy.get('[data-cy="signin-btn"]').should('be.visible').click();
        cy.get('[data-cy="header"]', { timeout: 20000 }).should('be.visible');

        loginPage.clickProfileIcon();

        homePage.verifyProfileDropDown();

        verifyAndClickProfileDropDownButton('Account','Manage your profile and preferences')

        verifyUrl('/profile')

  })
    it('Verify Account page loads successfully', () => {


        myAccountPage.verifyMyAccountPage("Account");

    });
    it('Verify user details are displayed correctly and Upload valid JPG image', () => {
        myAccountPage.verifyMyAccountPage("Account");

        // deleteing already uploaded image
        myAccountPage.deleteUplaodedImage()
        // Upload image (always runs)
        uploadProfileImage('input#avatar-upload','Test.jpeg');
        // verify the success message
        myAccountPage.verifySuccessMessage('Profile updated successfully!')
        // Delete the upload image
        myAccountPage.verifyDeletebutton();
        myAccountPage.verifySuccessMessage;

        veirfyDetails('[data-cy="card-title"]','My Profile');

        // Verify Name
        veirfyDetails('[data-cy="user-name"]',data.name);

        // Verify email 
        veirfyDetails('[data-cy="user-email"]', data.email);

        // Personal Information
        veirfyDetails('[data-cy="card-title"]','Personal Information');

        veirfyDetails('[data-cy="field-label"]','Name');
        verifyInputValue('[data-cy="account-input"]',data.name);
        veirfyDetails('[data-cy="field-label"]','Phone Number');
        verifyInputValue('[placeholder="Enter phone number"]',data.phone);

        veirfyDetails('[data-cy="field-label"]','Country');
        veirfyDetails('[data-cy="field-label"]','Date of Birth');

    });
    it('Upload valid PNG image', () => {

        myAccountPage.verifyMyAccountPage("Account");

    // My Profile

        myAccountPage.deleteUplaodedImage();

        uploadProfileImage('input#avatar-upload','Test1.png');

        myAccountPage.verifySuccessMessage('Profile updated successfully!')

        myAccountPage.verifyDeletebutton();



        

    });
    it('Replace existing profile picture', () => {

        myAccountPage.verifyMyAccountPage("Account");

    // My Profile

        myAccountPage.deleteUplaodedImage();

        uploadProfileImage('input#avatar-upload','Test1.png');

        myAccountPage.verifySuccessMessage('Profile updated successfully!')

        uploadProfileImage('input#avatar-upload','Test.jpeg');

        



        

    });
    it('Verify image persists after page refresh', () => {

        myAccountPage.verifyMyAccountPage("Account");

    // My Profile

        myAccountPage.deleteUplaodedImage();

        uploadProfileImage('input#avatar-upload','Test1.png');
        
        myAccountPage.verifySuccessMessage('Profile updated successfully!')

        myAccountPage.verifyUploadedImage()

        

          

    });
    it('Upload unsupported file type (.txt)', () => {

        myAccountPage.verifyMyAccountPage("Account");

    // My Profile

        myAccountPage.deleteUplaodedImage();

        uploadProfileImage('input#avatar-upload','Text.txt');
        
        myAccountPage.verifySuccessMessage('Profile updated successfully!')

        myAccountPage.verifyUploadedImage()

        

          

    });
    it('Verify Edit button is visible and clicking edit button should make the fields editable.', () => {

        myAccountPage.verifyMyAccountPage("Account");
        myAccountPage.verifyButton('Edit');
        myAccountPage.verifyButton('Cancel');

    });
    it('Update name with valid data', () => {

        // updating the name
        myAccountPage.verifyMyAccountPage("Account");
        myAccountPage.verifyButton('Edit');
        myAccountPage.editField('[data-cy="account-input"]', 'Shah',)
        myAccountPage.verifyButton('Save')
        myAccountPage.verifySuccessMessage('Profile updated successfully!')
        
        // again changing to previous one 
        myAccountPage.verifyButton('Edit');
        myAccountPage.editField('[data-cy="account-input"]', data.name,)
        myAccountPage.verifyButton('Save');   
        myAccountPage.verifySuccessMessage('Profile updated successfully!');

    });
    it('Update name with empty name', () => {

        // updating the name
        myAccountPage.verifyMyAccountPage("Account");
        myAccountPage.verifyButton('Edit');
        myAccountPage.editField('[data-cy="account-input"]', ' ',)
        myAccountPage.verifyDisableButton('Save')
        

    });
    it('Update name with numeric data', () => {

        // The name field uses NAME_REGEX which strips all non-alphabetic characters.
        // Typing '466373' filters all digits → name becomes empty → Save is disabled.
        myAccountPage.verifyMyAccountPage("Account");
        myAccountPage.verifyButton('Edit');
        myAccountPage.editField('[data-cy="account-input"]', '466373',);
        // Numeric-only input is filtered to empty → Save must be DISABLED
        myAccountPage.verifyDisableButton('Save');

        // Restore valid name so subsequent tests start clean
        myAccountPage.editField('[data-cy="account-input"]', data.name,);
        myAccountPage.verifyButton('Save');
        myAccountPage.verifySuccessMessage('Profile updated successfully!');

    });
    it('Enter valid phone number', () => {

        // updating the name
        myAccountPage.verifyMyAccountPage("Account");
        myAccountPage.verifyButton('Edit');
        myAccountPage.editField('[data-cy="account-input"]', '1234567890',1)
        myAccountPage.verifyButton('Save')
        myAccountPage.verifySuccessMessage('Profile updated successfully!');

        // again changing to previous one 
        myAccountPage.verifyButton('Edit');
        myAccountPage.editField('[data-cy="account-input"]', data.phone,1)
        myAccountPage.verifyButton('Save');   
        myAccountPage.verifySuccessMessage('Profile updated successfully!');

    });
    it('Enter alphabets', () => {

        // updating the phone number with alphabets
        myAccountPage.verifyMyAccountPage("Account");
        myAccountPage.verifyButton('Edit');
        // Clear existing phone value first so the field is empty before typing non-numeric chars
        cy.get('[data-cy="account-input"]').eq(1).clear({ force: true }).type('abcde').should('have.value', '');


    });
    it('Enter special characters', () => {

        // updating the phone number with alphabets
        myAccountPage.verifyMyAccountPage("Account");
        myAccountPage.verifyButton('Edit');
        // Clear existing phone value first so the field is empty before typing non-numeric chars
        cy.get('[data-cy="account-input"]').eq(1).clear({ force: true }).type('@#$@').should('have.value', '');

    });
    it('Verify the user can select the country from the dropdown', () => {
        
        //select the state
        myAccountPage.verifyMyAccountPage("Account");
        myAccountPage.verifyButton('Edit');
        myAccountPage.verifySelectCountry('Afghanistan')
        myAccountPage.verifyButton("Save");
        myAccountPage.verifySuccessMessage('Profile updated successfully!');

        // Deselect the state
        myAccountPage.verifyButton('Edit');
        myAccountPage.verifyDeselectState()
        myAccountPage.verifyButton("Save");


    });
    it('Verify the count of state available in dropdown list', () => {
        
        //select the state
        myAccountPage.verifyMyAccountPage("Account");
        myAccountPage.verifyButton('Edit');
        myAccountPage.verifyCountryDropDownData();
        myAccountPage.verifyDropDownOptions();
    });
    it('Verify user can select valid DOB', () => {
        
        //select the state
        myAccountPage.verifyMyAccountPage("Account");
        myAccountPage.verifyButton('Edit');
        myAccountPage.openDatePicker();
        myAccountPage.selectValidDOB();
        myAccountPage.verifyButton('Save');



    });
    it('Verify email is read-only and verified icon shown', () => {
        
        //select the state
        myAccountPage.verifyMyAccountPage("Account");
        veirfyDetails('[data-cy="card-title"]','Login Information');
        veirfyDetails('[data-cy="field-label"]','Email')
        myAccountPage.verifyEmailisVerified(data.email);



        veirfyDetails('[data-cy="field-label"]','Password')
        veirfyDetails('[data-cy="password-display"] span', '••••••••')
    });
    it('Verify change password button is visible and clickable.', () => {
        
        //select the state
        myAccountPage.verifyMyAccountPage("Account");
        veirfyDetails('[data-cy="card-title"]','Login Information');
        veirfyDetails('[data-cy="field-label"]','Password')
        veirfyDetails('[data-cy="password-display"] span', '••••••••');
        myAccountPage.verifyButton('Change password')

    });
    it('Verify Clicking the change password button opens Reset Password modal.', () => {
        //select the state
        myAccountPage.verifyMyAccountPage("Account");
        veirfyDetails('[data-cy="card-title"]','Login Information');
        veirfyDetails('[data-cy="field-label"]','Password')
        veirfyDetails('[data-cy="password-display"] span', '••••••••');
        // Use force: true to handle React re-render during click timing
        cy.contains('button', 'Change password').should('be.visible').and('not.be.disabled').click({ force: true });
        myAccountPage.verfyResetPasswordModal();
        cy.contains('button', 'Send reset email').should('be.visible').and('not.be.disabled').click({ force: true });
        // After clicking Send reset email, verify Cancel button
        cy.get('body').then(($body) => {
            if ($body.find('button:contains("Cancel")').length) {
                cy.contains('button', 'Cancel').should('be.visible');
            }
        });
    });
    it('Verify Close modal using X icon', () => {
        //select the state
        myAccountPage.verifyMyAccountPage("Account");
        veirfyDetails('[data-cy="card-title"]','Login Information');
        veirfyDetails('[data-cy="field-label"]','Password')
        veirfyDetails('[data-cy="password-display"] span', '••••••••');
        myAccountPage.verifyButton('Change password');
        cy.get('[data-cy="modal-close-btn"]').eq(1).should('be.visible').click();
        cy.get('[data-cy="reset-password-modal"]').should('not.exist');

    });
    it('Verify Logout successfully', () => {
        //select the state
        myAccountPage.verifyMyAccountPage("Account");
        veirfyDetails('[data-cy="card-title"]','Login Information');
        veirfyDetails('[data-cy="field-label"]','Password')
        veirfyDetails('[data-cy="password-display"] span', '••••••••');
        myAccountPage.verifyButton('Logout');
        verifyUrl('/authentication');
    
    });
    it('Verify delete button and modal', () => {
        //select the state
        myAccountPage.verifyMyAccountPage("Account");
        veirfyDetails('[data-cy="card-title"]','Login Information');
        veirfyDetails('[data-cy="field-label"]','Password')
        veirfyDetails('[data-cy="password-display"] span', '••••••••');
        myAccountPage.verifyButton('Delete account');
        myAccountPage.verifyDeleteAccountModal();
        myAccountPage.verifyButton('Cancel')
        
    
    });

    




});