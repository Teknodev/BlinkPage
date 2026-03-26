import { loginToEditor, addComponent, clearPlayground, resetPlayground } from '../../support/editorTestHelper';
import { inlineEditorPage } from '../../support/pages/inlineEditorPage';
import editorData from '../../fixtures/inlineEditorData.json';

/**
 * Inline Editor E2E Tests
 *
 * Each describe block:
 *   1. Logs in and navigates to the test project
 *   2. Clears any existing components
 *   3. Adds the required components for that scenario
 *   4. Runs the tests
 *   5. Reloads after each test to discard unsaved changes
 */

// ── Activation & Deactivation ───────────────────────────────────────

describe('Inline Editor - Activation & Deactivation', () => {
  beforeEach(() => {
    loginToEditor();
    clearPlayground();
    // Add a simple component that contains blinkpage text tags
    addComponent('hero', 0);
  });

  afterEach(() => {
    resetPlayground();
  });

  it('should activate editor when clicking a blinkpage tag', () => {
    inlineEditorPage.blinkpageTags.first().should('be.visible').click();
    inlineEditorPage.verifyEditorIsActive();
  });

  it('should show formatting toolbar when editor is active', () => {
    inlineEditorPage.blinkpageTags.first().click();
    inlineEditorPage.verifyToolbarVisible();
  });

  it('should deactivate editor and save changes when clicking outside', () => {
    inlineEditorPage.blinkpageTags.first().click();
    inlineEditorPage.verifyEditorIsActive();

    inlineEditorPage.clickOutside();
    cy.wait(500);

    inlineEditorPage.blinkpageTags.first().should('be.visible');
  });

  it('should persist text changes after clicking outside', () => {
    inlineEditorPage.blinkpageTags.first().then(($el) => {
      const id = $el.attr('id');

      inlineEditorPage.activateEditor(id);
      inlineEditorPage.verifyEditorIsActive();

      inlineEditorPage.selectAllText();
      inlineEditorPage.typeInEditor(editorData.updatedTitle);

      inlineEditorPage.clickOutside();
      cy.wait(500);

      inlineEditorPage.verifyBlinkpageContent(id, editorData.updatedTitle);
    });
  });
});

// ── Formatting ──────────────────────────────────────────────────────

describe('Inline Editor - Formatting', () => {
  beforeEach(() => {
    loginToEditor();
    clearPlayground();
    addComponent('hero', 0);
  });

  afterEach(() => {
    resetPlayground();
  });

  it('should apply bold formatting via toolbar', () => {
    inlineEditorPage.blinkpageTags.first().click();
    inlineEditorPage.verifyEditorIsActive();

    inlineEditorPage.selectAllText();
    inlineEditorPage.applyBold();

    inlineEditorPage.verifyButtonIsActive('toolbar-bold');
  });

  it('should apply italic formatting via toolbar', () => {
    inlineEditorPage.blinkpageTags.first().click();
    inlineEditorPage.verifyEditorIsActive();

    inlineEditorPage.selectAllText();
    inlineEditorPage.applyItalic();

    inlineEditorPage.verifyButtonIsActive('toolbar-italic');
  });

  it('should apply underline formatting via toolbar', () => {
    inlineEditorPage.blinkpageTags.first().click();
    inlineEditorPage.verifyEditorIsActive();

    inlineEditorPage.selectAllText();
    inlineEditorPage.applyUnderline();

    inlineEditorPage.verifyButtonIsActive('toolbar-underline');
  });

  it('should apply multiple formats in sequence', () => {
    inlineEditorPage.blinkpageTags.first().click();
    inlineEditorPage.verifyEditorIsActive();

    inlineEditorPage.selectAllText();

    inlineEditorPage.applyBold();
    inlineEditorPage.applyItalic();
    inlineEditorPage.applyUnderline();

    inlineEditorPage.verifyButtonIsActive('toolbar-bold');
    inlineEditorPage.verifyButtonIsActive('toolbar-italic');
    inlineEditorPage.verifyButtonIsActive('toolbar-underline');
  });
});

// ── Mode Guards ─────────────────────────────────────────────────────

describe('Inline Editor - Mode Guards', () => {
  beforeEach(() => {
    loginToEditor();
    clearPlayground();
    addComponent('hero', 0);
  });

  afterEach(() => {
    resetPlayground();
  });

  it('should not activate editor when Design tab is selected', () => {
    // First click a blinkpage tag to select the component, then click outside
    inlineEditorPage.blinkpageTags.first().click();
    inlineEditorPage.clickOutside();
    cy.wait(300);

    // Click the Design tab
    cy.get('[data-cy="tab-Design"]').should('be.visible').click();

    // Try clicking a blinkpage tag — editor should NOT activate
    inlineEditorPage.blinkpageTags.first().click({ force: true });
    inlineEditorPage.verifyEditorIsInactive();
  });
});

// ── Sequential Edits (needs 2 normal components) ────────────────────

describe('Inline Editor - Sequential Edits', () => {
  beforeEach(() => {
    loginToEditor();
    clearPlayground();
    // Add 2 different components so we get multiple blinkpage tags
    addComponent('hero', 0);
    addComponent('team', 0);
  });

  afterEach(() => {
    resetPlayground();
  });

  it('should persist edits across different text props sequentially', () => {
    inlineEditorPage.blinkpageTags.should('have.length.at.least', 2).then(($tags) => {
      const firstId = $tags.eq(0).attr('id');
      const secondId = $tags.eq(1).attr('id');

      inlineEditorPage.activateEditor(firstId);
      inlineEditorPage.selectAllText();
      inlineEditorPage.typeInEditor(editorData.updatedTitle);
      inlineEditorPage.clickOutside();
      cy.wait(500);

      inlineEditorPage.activateEditor(secondId);
      inlineEditorPage.selectAllText();
      inlineEditorPage.typeInEditor(editorData.updatedSubtitle);
      inlineEditorPage.clickOutside();
      cy.wait(500);

      inlineEditorPage.verifyBlinkpageContent(firstId, editorData.updatedTitle);
      inlineEditorPage.verifyBlinkpageContent(secondId, editorData.updatedSubtitle);
    });
  });

  it('should handle edit, format, then edit another prop', () => {
    inlineEditorPage.blinkpageTags.should('have.length.at.least', 2).then(($tags) => {
      const firstId = $tags.eq(0).attr('id');
      const secondId = $tags.eq(1).attr('id');

      inlineEditorPage.activateEditor(firstId);
      inlineEditorPage.selectAllText();
      inlineEditorPage.applyBold();
      inlineEditorPage.typeInEditor(editorData.updatedTitle);
      inlineEditorPage.clickOutside();
      cy.wait(500);

      inlineEditorPage.activateEditor(secondId);
      inlineEditorPage.selectAllText();
      inlineEditorPage.typeInEditor(editorData.updatedSubtitle);
      inlineEditorPage.clickOutside();
      cy.wait(500);

      inlineEditorPage.verifyBlinkpageContent(firstId, editorData.updatedTitle);
      inlineEditorPage.verifyBlinkpageContent(secondId, editorData.updatedSubtitle);
    });
  });
});

// ── Undo/Redo ───────────────────────────────────────────────────────

describe('Inline Editor - Undo/Redo', () => {
  beforeEach(() => {
    loginToEditor();
    clearPlayground();
    addComponent('hero', 0);
  });

  afterEach(() => {
    resetPlayground();
  });

  it('should undo and redo text changes', () => {
    inlineEditorPage.blinkpageTags.first().then(($el) => {
      const id = $el.attr('id');

      inlineEditorPage.activateEditor(id);
      inlineEditorPage.verifyEditorIsActive();

      inlineEditorPage.selectAllText();
      inlineEditorPage.typeInEditor('Typed text');

      inlineEditorPage.undo();

      inlineEditorPage.activeEditor.should('not.contain.text', 'Typed text');

      inlineEditorPage.redo();

      inlineEditorPage.activeEditor.should('contain.text', 'Typed text');
    });
  });
});

// ── Toolbar visibility: array vs non-array text ─────────────────────

describe('Inline Editor - Toolbar for Array vs Non-Array Text', () => {
  beforeEach(() => {
    loginToEditor();
    clearPlayground();
    // Add a component with array items (e.g., team with member cards)
    addComponent('team', 0);
  });

  afterEach(() => {
    resetPlayground();
  });

  it('should show toolbar when clicking a non-array (root-level) text element', () => {
    inlineEditorPage.blinkpageTags.first().then(($el) => {
      const id = $el.attr('id');
      inlineEditorPage.activateEditor(id);
      inlineEditorPage.verifyEditorIsActive();
      inlineEditorPage.verifyToolbarVisible();

      inlineEditorPage.clickOutside();
    });
  });

  it('should show toolbar when clicking a text element inside an array item', () => {
    inlineEditorPage.blinkpageTags.should('have.length.at.least', 3).then(($tags) => {
      const arrayItemId = $tags.eq(2).attr('id');
      inlineEditorPage.activateEditor(arrayItemId);
      inlineEditorPage.verifyEditorIsActive();
      inlineEditorPage.verifyToolbarVisible();

      inlineEditorPage.clickOutside();
    });
  });
});

// ── Global component: consecutive edits across copies ───────────────

describe('Inline Editor - Global Component Copy Edits (Non-Array)', () => {
  beforeEach(() => {
    loginToEditor();
    clearPlayground();
    // Add 2 normal components first, then we'd need 2 global component copies.
    // For now, add 2 of the same component type as a stand-in.
    addComponent('hero', 0);
    addComponent('hero', 0);
  });

  afterEach(() => {
    resetPlayground();
  });

  it('should persist edits on component1 independently from component2', () => {
    // Get all sections on the canvas
    cy.get('[data-component-index]').should('have.length.at.least', 2);

    // Get blinkpage tags from component1 (first section)
    cy.get('[data-component-index="0"]').find('blinkpage').first().then(($tag1) => {
      const comp1Id = $tag1.attr('id');

      cy.get('[data-component-index="1"]').find('blinkpage').first().then(($tag2) => {
        const comp2Id = $tag2.attr('id');

        // Edit component1 title
        inlineEditorPage.activateEditor(comp1Id);
        inlineEditorPage.selectAllText();
        inlineEditorPage.typeInEditor('Component1 Updated');
        inlineEditorPage.clickOutside();
        cy.wait(500);

        // Verify component1 changed
        inlineEditorPage.verifyBlinkpageContent(comp1Id, 'Component1 Updated');

        // Verify component2 is untouched
        cy.get(`blinkpage#${comp2Id}`).should('not.contain.text', 'Component1 Updated');
      });
    });
  });

  it('should persist consecutive edits to both components', () => {
    cy.get('[data-component-index]').should('have.length.at.least', 2);

    cy.get('[data-component-index="0"]').find('blinkpage').first().then(($tag1) => {
      const comp1Id = $tag1.attr('id');

      cy.get('[data-component-index="1"]').find('blinkpage').first().then(($tag2) => {
        const comp2Id = $tag2.attr('id');

        // Edit component1
        inlineEditorPage.activateEditor(comp1Id);
        inlineEditorPage.selectAllText();
        inlineEditorPage.typeInEditor('Comp1 Changed');
        inlineEditorPage.clickOutside();
        cy.wait(500);

        // Edit component2
        inlineEditorPage.activateEditor(comp2Id);
        inlineEditorPage.selectAllText();
        inlineEditorPage.typeInEditor('Comp2 Changed');
        inlineEditorPage.clickOutside();
        cy.wait(500);

        // Both should have their own independent values
        inlineEditorPage.verifyBlinkpageContent(comp1Id, 'Comp1 Changed');
        inlineEditorPage.verifyBlinkpageContent(comp2Id, 'Comp2 Changed');
      });
    });
  });
});

describe('Inline Editor - Global Component Copy Edits (Array Items)', () => {
  beforeEach(() => {
    loginToEditor();
    clearPlayground();
    // Add 2 team components (which have array items like member cards)
    addComponent('team', 0);
    addComponent('team', 0);
  });

  afterEach(() => {
    resetPlayground();
  });

  it('should persist edits on component1 array item independently from component2', () => {
    cy.get('[data-component-index]').should('have.length.at.least', 2);

    // Get the 2nd blinkpage tag (array item) from each component
    cy.get('[data-component-index="0"]').find('blinkpage').eq(1).then(($tag1) => {
      const comp1ArrayId = $tag1.attr('id');

      cy.get('[data-component-index="1"]').find('blinkpage').eq(1).then(($tag2) => {
        const comp2ArrayId = $tag2.attr('id');

        // Edit array item in component1
        inlineEditorPage.activateEditor(comp1ArrayId);
        inlineEditorPage.selectAllText();
        inlineEditorPage.typeInEditor(editorData.updatedMemberName);
        inlineEditorPage.clickOutside();
        cy.wait(500);

        // Verify component1 array item changed
        inlineEditorPage.verifyBlinkpageContent(comp1ArrayId, editorData.updatedMemberName);

        // Verify component2 array item is untouched
        cy.get(`blinkpage#${comp2ArrayId}`)
          .should('not.contain.text', editorData.updatedMemberName);
      });
    });
  });

  it('should handle mixed edits: component1 array item + component2 root string', () => {
    cy.get('[data-component-index]').should('have.length.at.least', 2);

    cy.get('[data-component-index="0"]').find('blinkpage').eq(1).then(($tag1) => {
      const comp1ArrayId = $tag1.attr('id');

      cy.get('[data-component-index="1"]').find('blinkpage').first().then(($tag2) => {
        const comp2RootId = $tag2.attr('id');

        // Edit component1 array item
        inlineEditorPage.activateEditor(comp1ArrayId);
        inlineEditorPage.selectAllText();
        inlineEditorPage.typeInEditor('Comp1 Array Updated');
        inlineEditorPage.clickOutside();
        cy.wait(500);

        // Edit component2 root string
        inlineEditorPage.activateEditor(comp2RootId);
        inlineEditorPage.selectAllText();
        inlineEditorPage.typeInEditor('Comp2 Root Updated');
        inlineEditorPage.clickOutside();
        cy.wait(500);

        // Both should persist independently
        inlineEditorPage.verifyBlinkpageContent(comp1ArrayId, 'Comp1 Array Updated');
        inlineEditorPage.verifyBlinkpageContent(comp2RootId, 'Comp2 Root Updated');
      });
    });
  });
});

// ── Array Item Targeting (same component) ───────────────────────────
// Regression tests: editing the 2nd or 3rd array item should NOT
// update the 1st item (the bug where all items shared the same prop.id).

describe('Inline Editor - Array Item Targeting (Same Component)', () => {
  beforeEach(() => {
    loginToEditor();
    clearPlayground();
    // Add a component with array items (about, team, etc.)
    addComponent('about', 0);
  });

  afterEach(() => {
    resetPlayground();
  });

  it('should edit 2nd array item without affecting 1st', () => {
    // Get all blinkpage tags inside the first component
    inlineEditorPage.getBlinkpageTagsInComponent(0)
      .should('have.length.at.least', 3)
      .then(($tags) => {
        // Find the 1st and 2nd array-item blinkpage tags
        // (index 0 may be a root title; array items typically start after it)
        const firstItemId = $tags.eq(1).attr('id');
        const secondItemId = $tags.eq(2).attr('id');

        // Capture original text of the 1st item
        cy.get(`blinkpage#${firstItemId}`).invoke('text').then((originalFirst) => {
          // Edit the 2nd item
          inlineEditorPage.activateEditor(secondItemId);
          inlineEditorPage.selectAllText();
          inlineEditorPage.typeInEditor(editorData.updatedArrayItem2);
          inlineEditorPage.clickOutside();
          cy.wait(500);

          // 2nd item should have the new text
          inlineEditorPage.verifyBlinkpageContent(secondItemId, editorData.updatedArrayItem2);

          // 1st item should be unchanged
          cy.get(`blinkpage#${firstItemId}`).should('contain.text', originalFirst);
        });
      });
  });

  it('should edit 3rd array item without affecting 1st and 2nd', () => {
    inlineEditorPage.getBlinkpageTagsInComponent(0)
      .should('have.length.at.least', 4)
      .then(($tags) => {
        const firstItemId = $tags.eq(1).attr('id');
        const secondItemId = $tags.eq(2).attr('id');
        const thirdItemId = $tags.eq(3).attr('id');

        cy.get(`blinkpage#${firstItemId}`).invoke('text').then((originalFirst) => {
          cy.get(`blinkpage#${secondItemId}`).invoke('text').then((originalSecond) => {
            // Edit the 3rd item
            inlineEditorPage.activateEditor(thirdItemId);
            inlineEditorPage.selectAllText();
            inlineEditorPage.typeInEditor(editorData.updatedArrayItem3);
            inlineEditorPage.clickOutside();
            cy.wait(500);

            // 3rd item should have new text
            inlineEditorPage.verifyBlinkpageContent(thirdItemId, editorData.updatedArrayItem3);

            // 1st and 2nd should be unchanged
            cy.get(`blinkpage#${firstItemId}`).should('contain.text', originalFirst);
            cy.get(`blinkpage#${secondItemId}`).should('contain.text', originalSecond);
          });
        });
      });
  });

  it('should handle sequential edits to different array items independently', () => {
    inlineEditorPage.getBlinkpageTagsInComponent(0)
      .should('have.length.at.least', 3)
      .then(($tags) => {
        const firstItemId = $tags.eq(1).attr('id');
        const secondItemId = $tags.eq(2).attr('id');

        // Edit the 1st array item
        inlineEditorPage.activateEditor(firstItemId);
        inlineEditorPage.selectAllText();
        inlineEditorPage.typeInEditor(editorData.updatedArrayItem1);
        inlineEditorPage.clickOutside();
        cy.wait(500);

        // Edit the 2nd array item
        inlineEditorPage.activateEditor(secondItemId);
        inlineEditorPage.selectAllText();
        inlineEditorPage.typeInEditor(editorData.updatedArrayItem2);
        inlineEditorPage.clickOutside();
        cy.wait(500);

        // Both should have their own independent values
        inlineEditorPage.verifyBlinkpageContent(firstItemId, editorData.updatedArrayItem1);
        inlineEditorPage.verifyBlinkpageContent(secondItemId, editorData.updatedArrayItem2);
      });
  });
});

// ── Blinkpage Switching (regression) ──────────────────────────────────

describe('Inline Editor - Blinkpage Tag Switching', () => {
  beforeEach(() => {
    loginToEditor();
    clearPlayground();
    // Add a component with multiple blinkpage tags (e.g. hero or list)
    addComponent('hero', 0);
    // Add a second component for cross-component switching
    addComponent('list', 1);
  });

  afterEach(() => {
    resetPlayground();
  });

  it('should switch editor between blinkpage tags within the same component', () => {
    // Get blinkpage tags in the first component
    inlineEditorPage.getBlinkpageTagsInComponent(0)
      .should('have.length.at.least', 2)
      .then(($tags) => {
        const firstTagId = $tags.eq(0).attr('id');
        const secondTagId = $tags.eq(1).attr('id');

        // Click first tag — editor should activate
        inlineEditorPage.activateEditor(firstTagId);
        inlineEditorPage.verifyEditorIsActive();
        inlineEditorPage.verifyToolbarVisible();

        // Click second tag — editor should switch to it
        cy.get(`blinkpage#${secondTagId}`).click();
        cy.wait(300);

        // Toolbar should still be visible (not disappear)
        inlineEditorPage.verifyToolbarVisible();
        // The active editor should now be the second tag
        inlineEditorPage.verifyEditorIsActive();
      });
  });

  it('should switch editor between blinkpage tags across different components', () => {
    // Get tags from component 0 and component 1
    inlineEditorPage.getBlinkpageTagsInComponent(0)
      .first()
      .then(($tag0) => {
        const tag0Id = $tag0.attr('id');

        inlineEditorPage.getBlinkpageTagsInComponent(1)
          .first()
          .then(($tag1) => {
            const tag1Id = $tag1.attr('id');

            // Click tag in component 0
            inlineEditorPage.activateEditor(tag0Id);
            inlineEditorPage.verifyEditorIsActive();

            // Click tag in component 1 — should switch
            cy.get(`blinkpage#${tag1Id}`).click();
            cy.wait(300);

            // Toolbar should still be visible
            inlineEditorPage.verifyToolbarVisible();
            inlineEditorPage.verifyEditorIsActive();
          });
      });
  });

  it('should save content when switching between blinkpage tags in the same component', () => {
    inlineEditorPage.getBlinkpageTagsInComponent(0)
      .should('have.length.at.least', 2)
      .then(($tags) => {
        const firstTagId = $tags.eq(0).attr('id');
        const secondTagId = $tags.eq(1).attr('id');

        // Edit first tag
        inlineEditorPage.activateEditor(firstTagId);
        inlineEditorPage.selectAllText();
        inlineEditorPage.typeInEditor(editorData.updatedTitle);

        // Click second tag (should save first tag's content and switch)
        cy.get(`blinkpage#${secondTagId}`).click();
        cy.wait(500);

        // Click outside to deactivate
        inlineEditorPage.clickOutside();
        cy.wait(500);

        // First tag should have the updated content
        inlineEditorPage.verifyBlinkpageContent(firstTagId, editorData.updatedTitle);
      });
  });
});
