import { loginToEditor, addComponent, clearPlayground, resetPlayground } from '../../support/editorTestHelper';
import { interactionsPage } from '../../support/pages/interactionsPage';

describe('Interactions - Collision Prevention', () => {
  beforeEach(() => {
    loginToEditor();
    clearPlayground();
    // Add a simple component to attach interactions to
    addComponent('hero', 0);
  });

  afterEach(() => {
    resetPlayground();
  });

  it('should prevent Replay and Remove On Complete from being enabled simultaneously for Scroll triggers', () => {
    // 1. Select the component to open the settings panel
    cy.get('blinkpage').first().click();

    // 2. Open Interaction tab
    interactionsPage.openInteractionTab();

    // 3. Add a new interaction
    interactionsPage.clickAddInteraction();

    // Wait for the popup to open
    cy.get('.EditPopup_container__\\w+').should('be.visible');

    // 4. Change Trigger Type to 'Scroll'
    interactionsPage.setTriggerType('Scroll');

    // Currently, Replay acts as the "replay" toggle under Scroll Configuration
    // Verify "Remove on complete" is off by default
    interactionsPage.verifyRemoveOnCompleteIsOff();

    // Toggle Remove On Complete ON
    interactionsPage.removeOnCompleteToggleContainer.find('input[type="checkbox"]').click({ force: true });
    interactionsPage.verifyRemoveOnCompleteIsOn();

    // 5. Toggle Replay on
    interactionsPage.toggleReplay();

    // 6. Verify toast is shown and Remove on Complete toggled itself off
    interactionsPage.verifyToastVisible("Replay cannot be used with Remove on Complete");
    cy.wait(500);
    interactionsPage.verifyRemoveOnCompleteIsOff();

    // 7. Toggle Remove on Complete back ON while Replay is active
    interactionsPage.removeOnCompleteToggleContainer.find('input[type="checkbox"]').click({ force: true });

    // 8. Verify the reverse toast is shown
    interactionsPage.verifyToastVisible("Remove on Complete cannot be enabled while Replay is active");
  });

  it('should physically trigger the replay callback in InteractionManager when scroll-into-view replays', () => {
    cy.get('blinkpage').first().click();
    interactionsPage.openInteractionTab();
    interactionsPage.clickAddInteraction();
    interactionsPage.setTriggerType('Scroll');
    
    // Choose "Scroll Into View" specially
    cy.get('.Select_dropdown__\\w+').eq(1).click();
    cy.contains('Scroll Into View').click();
    
    // Toggle replay
    interactionsPage.toggleReplay();

    // Verify trigger on scroll
    cy.window().then((win) => {
        cy.stub(win.console, 'log').as('consoleLog');
    });

    // Close settings popup
    cy.get('body').click(0,0);

    // Scroll the playground down and up to simulate scrolling out and in
    cy.get('#playground').scrollTo('bottom', { duration: 500 });
    cy.get('#playground').scrollTo('top', { duration: 500 });
    cy.get('#playground').scrollTo('bottom', { duration: 500 });

    cy.get('@consoleLog').should('be.calledWithMatch', /\[InteractionManager\] trigger fired.*isReplayEnabled: true/);
  });

  it('should not prematurely remove animation classes when hover is interrupted with removeOnComplete', () => {
    cy.get('blinkpage').first().click();
    interactionsPage.openInteractionTab();
    interactionsPage.clickAddInteraction();
    
    // Set to Hover
    interactionsPage.setTriggerType('Hover');

    // Toggle Remove On Complete ON
    interactionsPage.removeOnCompleteToggleContainer.find('input[type="checkbox"]').click({ force: true });
    interactionsPage.verifyRemoveOnCompleteIsOn();

    // Close settings popup
    cy.get('body').click(0,0);
    cy.wait(500); // Give time for settings to apply and UI to detach

    // The trigger is attached to the section element, which is inside blinkpage.
    // We grab the first inner element that has auto-generate classes.
    const sectionTarget = cy.get('blinkpage').first().find('[class*="auto-generate"]').first();

    // Trigger hover on the specific section
    sectionTarget.trigger('mouseenter', { force: true });
    
    // Interrupt quickly before animation completes
    cy.wait(100);
    sectionTarget.trigger('mouseleave', { force: true });

    // It should not have been removed since iter wasn't completed and it was interrupted
    cy.wait(1200);
    sectionTarget.should('not.have.css', 'display', 'none');

    // Trigger hover fully
    sectionTarget.trigger('mouseenter', { force: true });
    // Wait for the full animation duration (default is 1s, plus buffer)
    cy.wait(1200);
    // After it completes, removeOnComplete should apply
    sectionTarget.should('have.css', 'display', 'none');
  });
});
