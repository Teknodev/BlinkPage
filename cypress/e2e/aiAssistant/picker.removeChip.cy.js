/**
 * E2E — AI Picker (Remove chip + empty submit)
 *
 * Verifies:
 *  - Clicking the chip's ✕ removes it from the tray.
 *  - When no chips are present, the prompt body should NOT contain
 *    a `selected_elements` key (the hook only attaches it when there
 *    is at least one pick).
 */

import { loginToEditor, addComponent } from '../../support/editorTestHelper';

function sseBody(frames) {
  return frames
    .map((f) => `event: ${f.event}\ndata: ${JSON.stringify(f.data)}\n\n`)
    .join('');
}

const completionFrames = [
  { event: 'request_started', data: { request_id: 'r_r1', sse: true } },
  { event: 'conversation', data: { conversation_id: 'c_r1' } },
  { event: 'iter_start', data: { iter: 1 } },
  { event: 'final_message', data: { content: 'Done.' } },
  {
    event: 'done',
    data: {
      request_id: 'r_r1',
      conversation_id: 'c_r1',
      messages: [
        { role: 'user', content: 'hello' },
        { role: 'assistant', content: 'Done.' },
      ],
      pending_confirmation: null,
      trace: [],
      iterations: 1,
      usage: { prompt_tokens: 5, completion_tokens: 3, total_tokens: 8 },
      ctx: { project_id: '1', page_id: null, locale: null },
    },
  },
];

describe('AI Picker — remove chip and empty submit', () => {
  beforeEach(() => {
    cy.intercept('POST', '**/api/fn-execute/ai/chat', (req) => {
      req.reply({
        statusCode: 200,
        headers: { 'content-type': 'text/event-stream' },
        body: sseBody(completionFrames),
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

  it('clicking the chip ✕ removes it from the tray', () => {
    cy.get('[data-cy="ai-pick-button"]').click();
    cy.get('body').should('have.class', 'ai-picker-active');

    cy.get('[data-component-index]', { timeout: 10000 })
      .first()
      .find('[class*="auto-generate-"]')
      .first()
      .then(($el) => {
        const rect = $el[0].getBoundingClientRect();
        cy.wrap($el).trigger('mousemove', {
          clientX: rect.left + 10, clientY: rect.top + 5, force: true, bubbles: true,
        });
        cy.wait(60);
        cy.wrap($el).trigger('click', {
          clientX: rect.left + 10, clientY: rect.top + 5, force: true, bubbles: true,
        });
      });

    cy.get('[data-cy="ai-element-chip"]').should('have.length.at.least', 1);
    cy.get('[data-cy="ai-element-chip"]').first().find('button[aria-label="Remove"]').click();
    cy.get('[data-cy="ai-element-chip"]').should('have.length', 0);
  });

  it('sending without any chips does NOT attach selected_elements to the body', () => {
    cy.get('[data-cy="ai-assistant-composer-input"]').type('hello');
    cy.get('[data-cy="ai-assistant-send"]').click();

    cy.wait('@aiChat').its('request.body').should((body) => {
      // The hook is implemented to only spread `selected_elements` when there's
      // at least one pick — so the field is absent (or an empty array if any
      // future change defaults it). Both shapes are acceptable.
      const sel = body.selected_elements;
      const isAbsent = sel === undefined;
      const isEmptyArray = Array.isArray(sel) && sel.length === 0;
      expect(isAbsent || isEmptyArray, 'selected_elements omitted or empty').to.be.true;
    });
  });
});
