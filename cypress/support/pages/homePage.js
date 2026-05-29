class HomePage {
    verifyCard() {
        cy.get('[data-cy="landing-body"]', {timeout:8000}).within(() => {
            cy.root().should('exist');
        })
    }
    verifyProfileDropDown(){
        cy.get('[data-cy="profile-dropdown"]').should('be.visible')
    }
}

export const homePage = new HomePage();
