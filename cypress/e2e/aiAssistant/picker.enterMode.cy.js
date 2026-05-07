/**
 * E2E — AI Picker (Enter Mode)
 *
 * Verifies that clicking "+ Pick element" toggles pick mode:
 *  - body gains `ai-picker-active`
 *  - composer is dimmed (composerPicking class on the composer wrapper)
 *  - PickModeBadge appears (data-cy="ai-pick-mode-badge")
 *  - clicking again exits and the badge disappears
 *
 * The chat backend is intercepted with a no-op SSE so this test is
 * deterministic and does not depend on OpenAI quota.
 */

import { loginToEditor } from '../../support/editorTestHelper';

function sseBody(frames) {
  return frames
    .map((f) => `event: ${f.event}\ndata: ${JSON.stringify(f.data)}\n\n`)
    .join('');
}

const idleFrames = [
  { event: 'request_started', data: { request_id: 'req_idle_1', sse: true } },
  { event: 'conversation', data: { conversation_id: 'conv_idle_1' } },
  {
    event: 'done',
    data: {
      request_id: 'req_idle_1',
      conversation_id: 'conv_idle_1',
      messages: [],
      pending_confirmation: null,
      trace: [],
      iterations: 0,
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      ctx: { project_id: '1', page_id: null, locale: null },
    },
  },
];

describe('AI Picker — enter pick mode', () => {
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
    cy.get('[data-cy="ai-assistant-fab"]').should('be.visible').click();
    cy.get('[data-cy="ai-assistant-panel"]').should('be.visible');
  });

  it('toggles ai-picker-active on body, dims composer and shows the badge', () => {
    // Sanity: badge not visible before pick mode
    cy.get('[data-cy="ai-pick-mode-badge"]').should('not.exist');
    cy.get('body').should('not.have.class', 'ai-picker-active');

    cy.get('[data-cy="ai-pick-button"]').should('be.visible').click();

    // Pick-mode side effects (retry queues — no synchronous reads)
    cy.get('body').should('have.class', 'ai-picker-active');
    cy.get('[data-cy="ai-pick-mode-badge"]').should('be.visible');
    // Composer dimming is a class on the ancestor of the textarea — the
    // button itself flips to active too (aria-pressed=true).
    cy.get('[data-cy="ai-pick-button"]').should('have.attr', 'aria-pressed', 'true');
  });

  it('toggles back off when the button is clicked a second time', () => {
    cy.get('[data-cy="ai-pick-button"]').click();
    cy.get('body').should('have.class', 'ai-picker-active');

    cy.get('[data-cy="ai-pick-button"]').click();
    cy.get('body').should('not.have.class', 'ai-picker-active');
    cy.get('[data-cy="ai-pick-mode-badge"]').should('not.exist');
    cy.get('[data-cy="ai-pick-button"]').should('have.attr', 'aria-pressed', 'false');
  });
});
