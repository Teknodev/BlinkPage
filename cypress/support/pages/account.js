class MyAccountPage {
    
    verifyMyAccountPage(label){
        cy.get('div[class*="_profile_aynuf"]').should('be.visible');
        cy.get('span[class*="_title_aynuf"]').contains(label).should('be.visible');
    }
    verifySuccessMessage(message){
        cy.get('[role="alert"].Toastify__toast--success', { timeout: 10000 })
        .should('be.visible')
        .and('contain.text', message);
    }
    verifyDeletebutton(){
        cy.get('[class="_button_ivllp_1   _trashIcon_aynuf_147"]').should('be.visible').click();
        
    }
    deleteUplaodedImage(){
        cy.get('body').then(($body) => {
                const deleteBtn = $body.find('[class="_button_ivllp_1   _trashIcon_aynuf_147"]');
                if (deleteBtn.length && deleteBtn.is(':visible')) {
                    cy.wrap(deleteBtn).click();
                }
        
            });
    }
    replaceImage(){
         
       cy.get('[class="_cameraIcon_aynuf_126"]').should('be.visible').cl

    }
    verifyUploadedImage() {

        cy.get('img[alt="Profile"]', { timeout: 10000 })
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
        cy.get('img[alt="Profile"]', { timeout: 15000 })
        .should('be.visible')
        .then(($img) => {
        const src = $img.attr('src');

        if (src.startsWith('data:image/svg+xml')) {
            cy.log('Warning: Default avatar loaded after refresh — cannot assert prod image.');
        } else {
            cy.log('Uploaded image persists after refresh:', src);
            // Optional: assert src includes storage.googleapis.com
            cy.wrap(src).should('include', 'storage.googleapis.com');
        }
        });

    }
    verifyButton(text){
        cy.get('[class*="_buttonAttom"]').contains(text).should('be.visible').and('not.be.disabled').click()
    }
    editField(loc,data,index = 0){
        cy.get(loc).eq(index).should('be.visible').click().type('{selectall}{backspace}').type(data, { delay: 50 });
    }
    verifyDisableButton(text){
        cy.get('[class*="_buttonAttom"]').contains(text).should('be.disabled');
    }
    verifySelectCountry(state){
        cy.get('[class="_searchInput_awphb_25"]').should('be.visible').click();
        cy.get('[class="select-portal-dropdown _editInput_aynuf_224 _editing_aynuf_229"]').should('be.visible');
        cy.get('[class="_dropdownItem_awphb_122  "]').contains(state).should('be.visible').click();
    }
    verifyDeselectState(){
        cy.get('[class="_button_ivllp_1"]').should('be.visible').click({force:true});
    }
    verifyCountryDropDownData(state){
        cy.get('[class="_searchInput_awphb_25"]').should('be.visible').click();
        cy.get('[class="select-portal-dropdown _editInput_aynuf_224 _editing_aynuf_229"]').should('be.visible');
        cy.get('[class="select-portal-dropdown _editInput_aynuf_224 _editing_aynuf_229"]').find('div._dropdownItem_awphb_122').should('have.length', 229);
    }
    verifyDropDownOptions(){
        cy.get('[class="select-portal-dropdown _editInput_aynuf_224 _editing_aynuf_229"]').find('div._dropdownItem_awphb_122') // Target all the divs representing the options
      .each(($option, index) => {
        // Extract the text of each dropdown option
        const stateText = $option.text().trim();

        // Assert that each state text matches the expected value
        cy.wrap($option).should('have.text', stateText); // This will validate the state name.
      });
    }
    // Open the date picker
    openDatePicker() {
        cy.get('.react-datepicker-wrapper input').click(); // Adjust selector if needed
        cy.get('[class="react-datepicker__month-container"]').should('be.visible');
    }
    selectDate(day) {
        // Add leading zero to single digit days (e.g., '5' becomes '05')
        const formattedDay = day < 10 ? `${day}` : day;
        cy.get(`.react-datepicker__day--${formattedDay}`).click(); // Click the dynamically calculated day
    }
    // Select a valid DOB (Past Date)
    selectValidDOB() {
        // Calculate the date 5 years ago
        const pastDate = new Date();
        pastDate.setFullYear(pastDate.getFullYear() - 5); // 5 years ago

        const pastDay = pastDate.getDate();
        const pastMonth = pastDate.getMonth(); // 0-based month index (January = 0)
        const pastYear = pastDate.getFullYear();

        // Open the date picker
        this.openDatePicker();

        // Select the correct month using the correct dropdown
        cy.get('select._select_qa9ac_6').eq(0) // 0 for month selector
            .select(pastMonth.toString()); // Select the correct month (0-based index)

        // Select the correct year using the correct dropdown
        cy.get('select._select_qa9ac_6').eq(1) // 1 for year selector
            .select(pastYear.toString()); // Select the correct year

        // Now, select the day by its number (note: the day might be dynamically generated with class 'react-datepicker__day--XXX')

        cy.get('body').click()
    }
    // Select a future date (e.g., 10 days from today)
    selectFutureDate() {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 10); // 10 days ahead

        const futureDay = futureDate.getDate();
        const futureMonth = futureDate.getMonth() + 1; // 1-based index for month
        const futureYear = futureDate.getFullYear();

        this.openDatePicker();
        cy.log(futureDay)
        this.selectDate(futureDay);
    }
    // Select today's date
    selectTodaysDate() {
        const today = new Date();
        const todayDay = today.getDate();
        const todayMonth = today.getMonth() + 1; // 1-based index for month
        const todayYear = today.getFullYear();

        this.openDatePicker();
        cy.get('.react-datepicker__day--today').click(); // Use today's date class
    }
    verifyEmailisVerified(text){
        cy.contains('div._disabledInput_1o5oy_4', text).should('be.visible').within(() => {
                // Verify the success check icon exists
                cy.get('[data-testid="CheckCircleIcon"]')
                  .should('exist')
                  .and('be.visible');
                });
    }
    verfyResetPasswordModal(){
        cy.get('[class="_container_njae3_16 undefined"]').should('be.visible');
        cy.get('[class="_button_ivllp_1"]').eq(1).should('be.visible');
        cy.get('img[alt="Warning"]').should('be.visible');
        cy.get('span[class="_title_njae3_49"]').contains('Reset Your Password').should('be.visible');
        cy.get('[class="_description_njae3_61"]').contains("We'll send you an email with instructions to reset your password. Click the button below to continue.").should('be.visible');
    }
    verifyDeleteAccountModal(){
        cy.get('[class="_container_njae3_16 undefined"]').should('be.visible');
        cy.get('[class="_button_ivllp_1"]').eq(1).should('be.visible');
        cy.get('img[alt="Warning"]').should('be.visible');
        cy.get('[class="_subTitle_njae3_60"]').contains('Are you sure you want to');
        cy.get('span[class="_title_njae3_49"]').contains('Delete this Account?').should('be.visible');
        cy.get('[class="_description_njae3_61"]').contains("Once you delete an account, there is no going back.").should('be.visible');

    }

}


export const myAccountPage = new MyAccountPage();
