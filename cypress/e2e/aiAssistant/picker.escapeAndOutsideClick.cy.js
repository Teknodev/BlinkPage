/**
 * E2E — AI Picker (Escape + outside click)
 *
 * Verifies the two implicit exits from pick mode preserve chips:
 *  - Pressing Escape exits pick mode
 *  - Clicking outside any canvas/panel target also exits pick mode
 *
 * In both cases, chips already in the tray must remain.
 */

import { loginToEditor, addComponent } from '../../support/editorTestHelper';

function sseBody(frames) {
  return frames
    .map((f) => `event: ${f.event}\ndata: ${JSON.stringify(f.data)}\n\n`)
    .join('');
}

const idleFrames = [
  { event: 'request_started', data: { request_id: 'r_e1', sse: true } },
  { event: 'conversation', data: { conversation_id: 'c_e1' } },
  {
    event: 'done',
    data: {
      request_id: 'r_e1',
      conversation_id: 'c_e1',
      messages: [],
      pending_confirmation: null,
      trace: [],
      iterations: 0,
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      ctx: { project_id: '1', page_id: null, locale: null },
    },
  },
];

function pickAFirstAutoGenElement() {
  cy.get('[data-component-index]', { timeout: 10000 })
    .first()
    .find('[class*="auto-generate-"]')
    .first()
    .then(($el) => {
      const rect = $el[0].getBoundingClientRect();
      const clientX = rect.left + Math.min(20, rect.width / 2);
      const clientY = rect.top + Math.min(10, rect.height / 2);
      cy.wrap($el).trigger('mousemove', { clientX, clientY, force: true, bubbles: true });
      cy.wait(60);
      cy.wrap($el).trigger('click', { clientX, clientY, force: true, bubbles: true });
    });
}

describe('AI Picker — escape and outside-click both retain chips', () => {
  beforeEach(() => {
    cy.intercept('POST', '**/api/fn-execute/ai/chat', (req) => {
      req.reply({
        statusCode: 200,
        headers: { 'content-type': 'text/event-stream' },
        body: sseBody(idleFrames),
      });
    }).as('aiChat');

    loginToEditor();
    cy.get('[data-cy="header"]', { timeout: 15000 }).should('be.visible');
    cy.wait(1500);

    cy.get('body').then(($body) => {
      if ($body.find('[data-component-index]').length === 0) {
        addComponent('hero', 0);
      }
    });

    cy.get('[data-cy="ai-assistant-fab"]').click();
    cy.get('[data-cy="ai-assistant-panel"]').should('be.visible');
  });

  it('Esc exits pick mode and keeps the existing chip', () => {
    cy.get('[data-cy="ai-pick-button"]').click();
    cy.get('body').should('have.class', 'ai-picker-active');

    pickAFirstAutoGenElement();
    cy.get('[data-cy="ai-element-chip"]', { timeout: 4000 }).should('have.length.at.least', 1);

    // Re-enter pick mode then ESC out.
    cy.get('[data-cy="ai-pick-button"]').then(($btn) => {
      // Picker may already be off after the click; ensure it's on for the ESC test.
      if ($btn.attr('aria-pressed') !== 'true') {
        cy.wrap($btn).click();
      }
    });
    cy.get('body').should('have.class', 'ai-picker-active');

    cy.get('body').trigger('keydown', { key: 'Escape', force: true });
    cy.get('body').should('not.have.class', 'ai-picker-active');
    // Chip retained.
    cy.get('[data-cy="ai-element-chip"]').should('have.length.at.least', 1);
  });

  it('outside-click off canvas exits pick mode and keeps chips', () => {
    cy.get('[data-cy="ai-pick-button"]').click();
    cy.get('body').should('have.class', 'ai-picker-active');

    pickAFirstAutoGenElement();
    cy.get('[data-cy="ai-element-chip"]', { timeout: 4000 }).should('have.length.at.least', 1);

    cy.get('[data-cy="ai-pick-button"]').then(($btn) => {
      if ($btn.attr('aria-pressed') !== 'true') cy.wrap($btn).click();
    });
    cy.get('body').should('have.class', 'ai-picker-active');

    // Click on the body at coords FAR from canvas/panel (top-left corner).
    cy.get('body').click(2, 2, { force: true });
    cy.get('body').should('not.have.class', 'ai-picker-active');
    cy.get('[data-cy="ai-element-chip"]').should('have.length.at.least', 1);
  });
});
