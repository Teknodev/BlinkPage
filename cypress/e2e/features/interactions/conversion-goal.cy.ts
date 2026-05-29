import { loginToEditor, addComponent, clearPlayground, resetPlayground } from '@support/editorTestHelper';

/**
 * Conversion Goal E2E Tests
 *
 * Feature: In the interaction editor (Interaction Tab → click Edit on an interaction),
 * a "Conversion Goal" section appears at the TOP of the EditPopup when the interaction's
 * trigger is one of: click, section-in-view, layer-in-view, scroll-into-view, page-load.
 *
 * All selectors use data-cy attributes exclusively, except for:
 *   - The Switch component (no data-cy; detected via [class*="checked"])
 *   - The EditPopup close button (no data-cy; targeted as first button inside popup header)
 *   - The conversion badge (detected via text "Conversion Goal" inside the item row)
 *
 * Selectors reference:
 *   data-cy="interaction-panel"         — the whole interaction list container
 *   data-cy="add-interaction-btn"       — add interaction button
 *   data-cy="interaction-item-{index}"  — list row title area
 *   data-cy="interaction-edit-{index}"  — edit button for item at index
 *   data-cy="conversion-goal-section"   — the Conversion Goal section in EditPopup
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Open the Interactions tab and select a section element so the interaction
 * panel becomes visible. Mirrors the pattern in interactions.cy.js.
 */
const openInteractionsPanel = () => {
  cy.get('[data-component-index="0"]', { timeout: 10000 }).click({ force: true });
  cy.wait(500);

  cy.get('[data-cy="tab-INTERACTIONS"]', { timeout: 5000 }).should('be.visible').click();
  cy.wait(500);

  cy.get('[data-component-index="0"]').within(() => {
    cy.get('[data-cy="blinkpage-tag"]').first().click({ force: true });
  });
  cy.wait(500);

  cy.get('[data-cy="interaction-panel"]', { timeout: 10000 }).should('exist');
};

/**
 * Add an interaction and open its EditPopup.
 * New interactions default to a page-load trigger, which is conversion-eligible.
 */
const addInteractionAndOpenPopup = () => {
  cy.get('[data-cy="add-interaction-btn"]', { timeout: 5000 }).should('be.visible').click();
  // The popup auto-opens after add (setTimeout 100ms in handleAdd)
  cy.get('[data-cy="edit-popup"]', { timeout: 7000 }).should('be.visible');
};

/**
 * Open the edit popup for the interaction at the given 0-based index.
 * The edit button is wrapped in a div with data-cy="interaction-edit-{index}".
 */
const openEditPopupForIndex = (index: number) => {
  cy.get(`[data-cy="interaction-edit-${index}"]`, { timeout: 5000 })
    .should('be.visible')
    .find('button')
    .click({ force: true });
  cy.get('[data-cy="edit-popup"]', { timeout: 7000 }).should('be.visible');
};

/**
 * Close the EditPopup by clicking the X button in the popup header.
 * The SvgIconButton close button is the first <button> inside the popup's
 * header section (before any content buttons).
 */
const closeEditPopup = () => {
  // The popup header has [h3 title] + [SvgIconButton → button].
  // The close button is the first direct button inside the popup.
  cy.get('[data-cy="edit-popup"]')
    .find('button')
    .first()
    .click({ force: true });
  cy.get('[data-cy="edit-popup"]').should('not.exist');
};

/**
 * Assert that the Switch inside the conversion-goal-section is in the
 * given checked state. The Switch adds [class*="checked"] when checked.
 */
const assertConversionSwitchChecked = (checked: boolean) => {
  cy.get('[data-cy="conversion-goal-section"]')
    .find('[class*="switch"]')
    .first()
    .then(($switch) => {
      if (checked) {
        expect($switch.attr('class')).to.match(/checked/);
      } else {
        expect($switch.attr('class')).not.to.match(/checked/);
      }
    });
};

/**
 * Click the Switch toggle inside the conversion-goal-section.
 */
const clickConversionSwitch = () => {
  cy.get('[data-cy="conversion-goal-section"]')
    .find('[class*="switch"]')
    .first()
    .click({ force: true });
};

/**
 * Assert the conversion badge is visible in the interaction list row at index.
 * Uses the B2 selector contract: [data-cy="conversion-goal-badge"] scoped
 * under the per-row interaction-item-<i> container.
 */
const assertConversionBadgeVisible = (index: number) => {
  cy.get(`[data-cy="interaction-item-${index}"] [data-cy="conversion-goal-badge"]`, { timeout: 5000 })
    .should('exist');
};

/**
 * Assert no conversion badge exists in the interaction list row at index.
 * First confirms the row itself is present, then asserts the badge is absent.
 */
const assertConversionBadgeAbsent = (index: number) => {
  cy.get(`[data-cy="interaction-item-${index}"]`, { timeout: 5000 }).should('exist');
  cy.get(`[data-cy="interaction-item-${index}"] [data-cy="conversion-goal-badge"]`)
    .should('not.exist');
};

// ---------------------------------------------------------------------------
// Test Suites
// ---------------------------------------------------------------------------

describe('Conversion Goal — Visibility', () => {
  beforeEach(() => {
    loginToEditor();
    clearPlayground();
    addComponent('hero', 0);
  });

  afterEach(() => {
    resetPlayground();
  });

  it('should show the Conversion Goal section with switch OFF by default for page-load trigger', () => {
    openInteractionsPanel();

    // Add a new interaction — defaults to page-load trigger (conversion-eligible)
    addInteractionAndOpenPopup();

    // The conversion-goal-section must be visible at the TOP of the popup
    cy.get('[data-cy="conversion-goal-section"]', { timeout: 5000 }).should('be.visible');

    // The switch inside should be OFF by default (isConversion starts false)
    assertConversionSwitchChecked(false);
  });
});

describe('Conversion Goal — Toggle ON', () => {
  beforeEach(() => {
    loginToEditor();
    clearPlayground();
    addComponent('hero', 0);
  });

  afterEach(() => {
    resetPlayground();
  });

  it('should mark interaction as conversion goal and display the badge on its row when switch is toggled ON', () => {
    openInteractionsPanel();
    addInteractionAndOpenPopup();

    // Conversion Goal section must be present
    cy.get('[data-cy="conversion-goal-section"]', { timeout: 5000 }).should('be.visible');

    // Switch should start unchecked
    assertConversionSwitchChecked(false);

    // Toggle ON
    clickConversionSwitch();

    // Switch should now show checked state
    assertConversionSwitchChecked(true);

    // Close the popup
    closeEditPopup();

    // The interaction item row should display the Conversion Goal badge
    assertConversionBadgeVisible(0);
  });
});

describe('Conversion Goal — Single Enforcement', () => {
  beforeEach(() => {
    loginToEditor();
    clearPlayground();
    addComponent('hero', 0);
  });

  afterEach(() => {
    resetPlayground();
  });

  it('should clear the first interaction badge when a second interaction is marked as conversion', () => {
    openInteractionsPanel();

    // --- Add and mark first interaction as conversion ---
    addInteractionAndOpenPopup();
    cy.get('[data-cy="conversion-goal-section"]', { timeout: 5000 }).should('be.visible');
    clickConversionSwitch();
    assertConversionSwitchChecked(true);
    closeEditPopup();

    // First interaction should have the badge
    assertConversionBadgeVisible(0);

    // --- Add second interaction ---
    cy.get('[data-cy="add-interaction-btn"]', { timeout: 5000 }).click();
    cy.get('[data-cy="edit-popup"]', { timeout: 7000 }).should('be.visible');
    cy.get('[data-cy="conversion-goal-section"]', { timeout: 5000 }).should('be.visible');

    // Mark second interaction as conversion (triggers onSetAsConversion which clears all others)
    clickConversionSwitch();
    assertConversionSwitchChecked(true);
    closeEditPopup();

    // Only second interaction should have the badge
    assertConversionBadgeAbsent(0);
    assertConversionBadgeVisible(1);
  });
});

describe('Conversion Goal — Toggle OFF', () => {
  beforeEach(() => {
    loginToEditor();
    clearPlayground();
    addComponent('hero', 0);
  });

  afterEach(() => {
    resetPlayground();
  });

  it('should clear conversion badge when switch is toggled OFF', () => {
    openInteractionsPanel();

    // Add interaction and mark as conversion
    addInteractionAndOpenPopup();
    cy.get('[data-cy="conversion-goal-section"]', { timeout: 5000 }).should('be.visible');
    clickConversionSwitch();
    assertConversionSwitchChecked(true);
    closeEditPopup();

    // Badge should be present
    assertConversionBadgeVisible(0);

    // Re-open the popup and toggle OFF
    openEditPopupForIndex(0);
    cy.get('[data-cy="conversion-goal-section"]', { timeout: 5000 }).should('be.visible');
    assertConversionSwitchChecked(true);
    clickConversionSwitch();
    assertConversionSwitchChecked(false);
    closeEditPopup();

    // Badge should no longer appear
    assertConversionBadgeAbsent(0);
  });
});
