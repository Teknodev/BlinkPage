import { TEST_PROJECT_URL } from '../editorTestHelper';

class InteractionsPage {
  // Elements
  get interactionTab() {
    return cy.get('[data-cy="tab-Interaction"]');
  }

  get addInteractionBtn() {
    return cy.get('[data-cy="interaction-add-btn"]');
  }

  get interactionItems() {
    return cy.get('[data-cy^="interaction-item-"]');
  }

  get triggerTypeSelect() {
    // Select the first dropdown in the active EditPopup
    return cy.get('.EditPopup_body__\\w+').find('.Select_container__\\w+').first();
  }
  
  get replayToggle() {
    // The exact label from ScrollConfigurator.tsx
    return cy.contains('Trigger animation every time').parent().find('input[type="checkbox"]');
  }

  get removeOnCompleteToggleContainer() {
    // The exact label from InteractionEditor.tsx
    return cy.contains('Hide element (display: none)').parent();
  }

  // Actions
  openInteractionTab() {
    this.interactionTab.should('be.visible').click();
  }

  clickAddInteraction() {
    this.addInteractionBtn.should('be.visible').click();
  }

  setTriggerType(typeText) {
    cy.contains('Type').parent().find('div[class*="Select_select"]').click();
    cy.contains(typeText).click();
  }

  toggleReplay() {
    this.replayToggle.click({ force: true });
  }

  verifyToastVisible(messageFragment) {
    cy.get('.Toastify__toast-body').should('contain.text', messageFragment);
  }

  verifyRemoveOnCompleteIsOn() {
    this.removeOnCompleteToggleContainer.find('input[type="checkbox"]').should('be.checked');
  }

  verifyRemoveOnCompleteIsOff() {
    this.removeOnCompleteToggleContainer.find('input[type="checkbox"]').should('not.be.checked');
  }
}

export const interactionsPage = new InteractionsPage();
