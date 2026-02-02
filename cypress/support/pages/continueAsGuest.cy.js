class ContinueAsGuestPage {
    continueAsGuestButton() {
        cy.get('button._buttonAttom_1k5xv_1._tertiary_1k5xv_40._guestButton_1ov99_21', { timeout: 20000 }).should('be.visible').contains('Continue as Guest').click();

    }

    assertNoWebHead() {
        cy.get('span._text_pzj3e_1', { timeout: 6000 }).should('be.visible').contains('You don\'t have any website yet');

    }
}

export const continueAsGuestPage = new ContinueAsGuestPage();
