class HomePage {
    verifyCard() {
        cy.get('[data-cy="landing-body"]', {timeout:8000}).within(() => {
            cy.contains('Upgrade to')
                .should('be.visible');

            cy.contains('More extensions. More automations. More syncs. Even more Composer for you.')
                .should('be.visible');
        })
    }
    verifyProfileDropDown(){
        cy.get('[data-cy="profile-dropdown"]').should('be.visible')
    }
}

export const homePage = new HomePage();
