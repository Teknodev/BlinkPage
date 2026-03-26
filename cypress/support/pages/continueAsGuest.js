class ContinueAsGuestPage {
    continueAsGuestButton() {
        cy.get('[data-cy="continue-guest-btn"]', { timeout: 20000 }).should('be.visible').contains('Continue as Guest').click();
    }

    assertNoWebHead() {
        cy.contains('You don\'t have any website yet', { timeout: 6000 }).should('be.visible');
    }
}

export const continueAsGuestPage = new ContinueAsGuestPage();
