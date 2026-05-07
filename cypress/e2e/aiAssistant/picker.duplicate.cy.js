/**
 * E2E — AI Picker (Duplicate guard)
 *
 * Clicking the same element twice does NOT add a second chip — the
 * picker context's addPick() returns "duplicate" and the overlay
 * triggers a brief red flash on HoverOutline (`flashRed` class).
 */

import { loginToEditor, addComponent } from '../../support/editorTestHelper';

function sseBody(frames) {
  return frames
    .map((f) => `event: ${f.event}\ndata: ${JSON.stringify(f.data)}\n\n`)
    .join('');
}

const idleFrames = [
  { event: 'request_started', data: { request_id: 'r_d1', sse: true } },
  { event: 'conversation', data: { conversation_id: 'c_d1' } },
  {
    event: 'done',
    data: {
      request_id: 'r_d1',
      conversation_id: 'c_d1',
      messages: [],
      pending_confirmation: null,
      trace: [],
      iterations: 0,
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      ctx: { project_id: '1', page_id: null, locale: null },
    },
  },
];

describe('AI Picker — duplicate clicks do not duplicate chips', () => {
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

  it('clicking the same element twice keeps chip count at 1', () => {
    cy.get('[data-cy="ai-pick-button"]').click();
    cy.get('body').should('have.class', 'ai-picker-active');

    cy.get('[data-component-index]', { timeout: 10000 })
      .first()
      .find('[class*="auto-generate-"]')
      .first()
      .as('target');

    const clickAt = ($el) => {
      const rect = $el[0].getBoundingClientRect();
      const clientX = rect.left + Math.min(20, rect.width / 2);
      const clientY = rect.top + Math.min(10, rect.height / 2);
      cy.wrap($el).trigger('mousemove', { clientX, clientY, force: true, bubbles: true });
      cy.wait(60);
      cy.wrap($el).trigger('click', { clientX, clientY, force: true, bubbles: true });
    };

    cy.get('@target').then(clickAt);
    cy.get('[data-cy="ai-element-chip"]', { timeout: 4000 }).should('have.length', 1);

    // Re-enter picker if it was exited and click the SAME element again.
    cy.get('[data-cy="ai-pick-button"]').then(($btn) => {
      if ($btn.attr('aria-pressed') !== 'true') cy.wrap($btn).click();
    });
    cy.get('@target').then(clickAt);

    // Still exactly one chip — duplicate was rejected.
    cy.get('[data-cy="ai-element-chip"]').should('have.length', 1);
  });
});
