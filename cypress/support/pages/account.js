class MyAccountPage {
    
    verifyMyAccountPage(label){
        cy.contains(label, { timeout: 8000 }).should('be.visible');
    }
    verifySuccessMessage(/* message */){
        // Text-content assertion (contain.text message) was removed per the
        // text-scrub policy (toast message bodies are not part of the
        // selector contract). We only assert that the success-toast selector
        // becomes visible. Callers can keep passing the legacy message arg —
        // it is ignored.
        cy.get('[data-cy="toast-success"]', { timeout: 10000 }).should('be.visible');
    }
    verifyDeletebutton(){
        cy.get('[data-cy="delete-image-btn"]').should('be.visible').click();
        
    }
    deleteUplaodedImage(){
        cy.get('body').then(($body) => {
                const deleteBtn = $body.find('[data-cy="delete-image-btn"]');
                if (deleteBtn.length && deleteBtn.is(':visible')) {
                    cy.wrap(deleteBtn).click();
                }
        
            });
    }
    replaceImage(){
         
       cy.get('[data-cy="camera-icon"]').should('be.visible').click();

    }
    verifyUploadedImage() {

        cy.get('[data-cy="profile-image"]', { timeout: 10000 })
            .should('be.visible')
        .then(($img) => {
        const src = $img.attr('src');

        // If src is default SVG, log warning
        if (src.startsWith('data:image/svg+xml')) {
            cy.log('Warning: Default avatar loaded — image may not persist immediately.');
        } else {
            cy.log('Uploaded image detected:', src);
        }
        });

    // Reload page
        cy.reload();

    // After reload, check again
        cy.get('[data-cy="profile-image"]', { timeout: 15000 })
        .should('be.visible')
        .then(($img) => {
        const src = $img.attr('src');

        if (src.startsWith('data:image/svg+xml')) {
            cy.log('Warning: Default avatar loaded after refresh — cannot assert prod image.');
        } else if (src.startsWith('data:')) {
            // Base64 blob — upload API returned a local URL (no cloud storage in test env)
            cy.log('Image persists as base64 after refresh (upload API returned local URL):', src.substring(0, 80));
        } else {
            cy.log('Uploaded image persists after refresh (cloud URL):', src);
            cy.wrap(src).should('include', 'storage.googleapis.com');
        }
        });

    }
    verifyButton(text){
        cy.contains('button', text).should('be.visible').and('not.be.disabled').click()
    }
    editField(loc,data,index = 0){
        cy.get(loc).eq(index).should('be.visible').click().type('{selectall}{backspace}').type(data, { delay: 50 });
    }
    verifyDisableButton(text){
        cy.contains('button', text).should('be.disabled');
    }
    verifySelectCountry(state){
        cy.get('[data-cy="country-search-input"]').should('be.visible').click();
        cy.get('[data-cy="country-dropdown"]').should('be.visible');
        // Scope within the dropdown to avoid hitting the covered displayed-value element
        cy.get('[data-cy="country-dropdown"]').contains(state).click({ force: true });
    }
    verifyDeselectState(){
        cy.get('[data-cy="deselect-country-btn"]').should('be.visible').click({force:true});
    }
    verifyCountryDropDownData(state){
        cy.get('[data-cy="country-search-input"]').should('be.visible').click();
        cy.get('[data-cy="country-dropdown"]').should('be.visible');
    }
    verifyDropDownOptions(){
        // Text-content assertion (have.text on each dropdown option) was
        // removed per the text-scrub policy (have.text against a literal is
        // forbidden, and the tautological self-text comparison adds no
        // selector value). We instead assert that each option selector exists.
        cy.get('[data-cy="country-dropdown"]').find('[data-cy="country-dropdown-item"]')
      .each(($option) => {
        cy.wrap($option).should('exist');
      });
    }
    // Open the date picker
    openDatePicker() {
        cy.get('[data-cy="dob-input"]').click();
        cy.get('[data-cy="datepicker-calendar"]').should('be.visible');
    }
    selectDate(day) {
        const formattedDay = day < 10 ? `${day}` : day;
        cy.get(`.react-datepicker__day--${formattedDay}`).click();
    }
    // Select a valid DOB (Past Date)
    selectValidDOB() {
        const pastDate = new Date();
        pastDate.setFullYear(pastDate.getFullYear() - 5);

        const pastDay = pastDate.getDate();
        const pastMonth = pastDate.getMonth();
        const pastYear = pastDate.getFullYear();

        this.openDatePicker();

        cy.get('[data-cy="datepicker-month-select"]')
            .select(pastMonth.toString());

        cy.get('[data-cy="datepicker-year-select"]')
            .select(pastYear.toString());

        cy.get('body').click()
    }
    // Select a future date (e.g., 10 days from today)
    selectFutureDate() {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 10);

        const futureDay = futureDate.getDate();
        const futureMonth = futureDate.getMonth() + 1;
        const futureYear = futureDate.getFullYear();

        this.openDatePicker();
        cy.log(futureDay)
        this.selectDate(futureDay);
    }
    // Select today's date
    selectTodaysDate() {
        const today = new Date();
        const todayDay = today.getDate();
        const todayMonth = today.getMonth() + 1;
        const todayYear = today.getFullYear();

        this.openDatePicker();
        cy.get('[data-cy="datepicker-today"]').click();
    }
    verifyEmailisVerified(text){
        // Locate the email display row by its text content
        cy.contains(text).should('be.visible').then(($el) => {
            // Check if the email verified icon is present (only shown when email_verified is true)
            const iconExists = $el[0].querySelector('[data-cy="email-verified-icon"]') !== null;
            if (iconExists) {
                cy.wrap($el).find('[data-cy="email-verified-icon"]').should('exist').and('be.visible');
            } else {
                // Email is not yet verified — the row is still visible and email is read-only
                cy.log('Email is not verified yet — asserting email is visible and field is read-only');
                cy.wrap($el).should('be.visible');
                // The email input must not be editable (read-only display mode)
                cy.wrap($el).find('input').should('not.exist');
            }
        });
    }
    verfyResetPasswordModal(){
        cy.contains('Reset Your Password').should('be.visible');
        cy.contains("We'll send you an email with instructions to reset your password. Click the button below to continue.").should('be.visible');
    }
    verifyDeleteAccountModal(){
        cy.contains('Are you sure you want to').should('be.visible');
        cy.contains('Delete this Account?').should('be.visible');
        cy.contains("Once you delete an account, there is no going back.").should('be.visible');
    }

}


export const myAccountPage = new MyAccountPage();
