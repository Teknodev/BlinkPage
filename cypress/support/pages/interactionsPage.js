/**
 * Interactions Page Object
 *
 * All selectors use data-cy attributes exclusively.
 */
class InteractionsPage {

    /**
     * Select a trigger type from the interaction trigger dropdown.
     * @param {string} triggerType - The trigger type to select (e.g. 'click', 'scroll-into-view')
     */
    selectTriggerType(triggerType) {
        cy.get('[data-cy="interaction-trigger-select"]', { timeout: 5000 })
            .should('be.visible')
            .click();
        cy.get('[data-cy="interaction-trigger-option"]')
            .contains(triggerType)
            .click();
    }

    /**
     * Select an animation from the animation dropdown.
     * @param {string} animationName - The animation to select
     */
    selectAnimation(animationName) {
        cy.get('[data-cy="interaction-animation-select"]', { timeout: 5000 })
            .should('be.visible')
            .click();
        cy.get('[data-cy="interaction-animation-option"]')
            .contains(animationName)
            .click();
    }

    /**
     * Toggle the "Trigger animation every time upon scroll" checkbox.
     */
    toggleReplayOnScroll() {
        cy.get('[data-cy="interaction-replay-toggle"]', { timeout: 5000 })
            .should('be.visible')
            .click();
    }

    /**
     * Toggle the "Hide element after animation finishes" checkbox.
     */
    toggleRemoveOnComplete() {
        cy.get('[data-cy="interaction-remove-complete-toggle"]', { timeout: 5000 })
            .should('be.visible')
            .click();
    }

    /**
     * Open the interaction editor popup for the current element.
     */
    openInteractionPopup() {
        cy.get('[data-cy="edit-popup"]', { timeout: 5000 })
            .should('be.visible');
    }

    /**
     * Close the interaction editor popup.
     */
    closeInteractionPopup() {
        cy.get('[data-cy="edit-popup"]').find('[data-cy="edit-popup-close"]').click();
    }

    /**
     * Verify a toast message appears with the given text.
     * @param {string} message - Expected toast message text
     */
    verifyToast(message) {
        cy.get('[data-cy="toast-message"]', { timeout: 6000 })
            .should('be.visible')
            .and('contain.text', message);
    }

    /**
     * Click on a blinkpage element in the playground to select it.
     */
    clickBlinkpageElement() {
        cy.get('[data-cy="blinkpage-tag"]', { timeout: 5000 }).first().click({ force: true });
    }

    /**
     * Verify the playground is visible.
     */
    verifyPlayground() {
        cy.get('[data-cy="playground"]', { timeout: 5000 }).should('be.visible');
    }
}

export const interactionsPage = new InteractionsPage();
