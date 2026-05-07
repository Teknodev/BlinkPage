/**
 * E2E — AI Picker (Backend-requested selection card)
 *
 * Verifies that when the backend emits a `request_element_selection` SSE
 * event mid-stream, the dedicated RequestElementSelectionCard renders
 * (data-cy="ai-request-element-selection-card") with three actions:
 *   - Pick elements    (data-cy="ai-request-element-selection-pick")
 *   - Continue         (data-cy="ai-request-element-selection-continue")
 *   - Cancel           (data-cy="ai-request-element-selection-cancel")
 * and Continue is disabled until min_count picks accumulate.
 */

import { loginToEditor, addComponent } from '../../support/editorTestHelper';

function sseBody(frames) {
  return frames
    .map((f) => `event: ${f.event}\ndata: ${JSON.stringify(f.data)}\n\n`)
    .join('');
}

function buildRequestSelectionFrames() {
  return [
    { event: 'request_started', data: { request_id: 'req_res_1', sse: true } },
    { event: 'conversation', data: { conversation_id: 'conv_res_1' } },
    { event: 'iter_start', data: { iter: 1 } },
    {
      event: 'request_element_selection',
      data: {
        description: 'Pick the heading you want to restyle.',
        min_count: 1,
        max_count: 3,
        iter: 1,
      },
    },
    {
      event: 'done',
      data: {
        request_id: 'req_res_1',
        conversation_id: 'conv_res_1',
        messages: [{ role: 'user', content: 'pick something for me' }],
        pending_confirmation: null,
        trace: [],
        iterations: 1,
        usage: { prompt_tokens: 12, completion_tokens: 6, total_tokens: 18 },
        ctx: { project_id: '1', page_id: null, locale: null },
      },
    },
  ];
}

describe('AI Picker — request_element_selection card', () => {
  beforeEach(() => {
    cy.intercept('POST', '**/api/fn-execute/ai/chat', (req) => {
      req.reply({
        statusCode: 200,
        headers: { 'content-type': 'text/event-stream' },
        body: sseBody(buildRequestSelectionFrames()),
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

  it('renders the selection card with disabled Continue when count < min', () => {
    cy.get('[data-cy="ai-assistant-composer-input"]').type('pick something for me');
    cy.get('[data-cy="ai-assistant-send"]').click();
    cy.wait('@aiChat');

    cy.get('[data-cy="ai-request-element-selection-card"]', { timeout: 6000 })
      .should('be.visible')
      .within(() => {
        cy.contains('Pick the heading you want to restyle.').should('be.visible');
        cy.get('[data-cy="ai-request-element-selection-pick"]').should('be.visible');
        cy.get('[data-cy="ai-request-element-selection-cancel"]').should('be.visible');
        cy.get('[data-cy="ai-request-element-selection-continue"]')
          .should('be.visible')
          .and('be.disabled');
      });
  });

  it('Continue becomes enabled after min_count picks land', () => {
    cy.get('[data-cy="ai-assistant-composer-input"]').type('pick something for me');
    cy.get('[data-cy="ai-assistant-send"]').click();
    cy.wait('@aiChat');

    cy.get('[data-cy="ai-request-element-selection-card"]', { timeout: 6000 }).should('be.visible');

    // Click "Pick elements" to enter pick mode through the card flow.
    cy.get('[data-cy="ai-request-element-selection-pick"]').click();
    cy.get('body').should('have.class', 'ai-picker-active');

    // Pick one element (min_count=1).
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

    // Continue is enabled now.
    cy.get('[data-cy="ai-request-element-selection-continue"]', { timeout: 4000 })
      .should('not.be.disabled');
  });

  it('Cancel dismisses the card without sending a follow-up turn', () => {
    cy.get('[data-cy="ai-assistant-composer-input"]').type('pick something for me');
    cy.get('[data-cy="ai-assistant-send"]').click();
    cy.wait('@aiChat');

    cy.get('[data-cy="ai-request-element-selection-card"]', { timeout: 6000 }).should('be.visible');
    cy.get('[data-cy="ai-request-element-selection-cancel"]').click();
    cy.get('[data-cy="ai-request-element-selection-card"]').should('not.exist');
  });
});
