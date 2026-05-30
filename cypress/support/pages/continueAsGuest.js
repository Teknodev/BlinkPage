class ContinueAsGuestPage {
    continueAsGuestButton() {
        cy.get('[data-cy="continue-guest-btn"]', { timeout: 20000 }).should('be.visible').click();
    }

    assertNoWebHead() {
        cy.get('[data-cy="empty-projects-message"]', { timeout: 6000 }).should('be.visible');
    }
}

export const continueAsGuestPage = new ContinueAsGuestPage();
