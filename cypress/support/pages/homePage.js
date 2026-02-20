class HomePage {
    verifyCard() {
        cy.get('._info_gvdl4_16', {timeout:8000}).within(() => {
            cy.get('._title_gvdl4_23')
                .should('contain.text', 'Upgrade to')
                .and('contain.text', 'Unlock more power')

            cy.get('._description_gvdl4_28')
                .should(
                    'have.text',
                    'More extensions. More automations. More syncs. Even more Composer for you.'
                )
        })
    }
    verifyProfileDropDown(){
        cy.get('[class*="_dropdownMenu"]').should('be.visible')

    }

}

export const homePage = new HomePage();
