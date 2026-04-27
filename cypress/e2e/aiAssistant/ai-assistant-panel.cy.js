/**
 * E2E — AI Assistant Panel
 *
 * Validates the in-editor chat panel that drives the OpenAI tool-calling backend
 * (function 69bd00000000000000000007 — `AI Tool Router`).
 *
 * Strategy: mock /api/fn-execute/ai/chat with cy.intercept so tests are
 * deterministic and don't depend on the real OpenAI key/quota.
 */

describe('AI Assistant Panel', () => {
  beforeEach(() => {
    cy.intercept('POST', '**/api/fn-execute/ai/chat', (req) => {
      const lastUser = [...(req.body?.messages || [])]
        .reverse()
        .find((m) => m.role === 'user');
      const text = lastUser?.content || '';
      const confirmedIds = req.body?.confirmed_tool_calls || [];

      // Resume after confirmation — return the executed-tool follow-up
      if (confirmedIds.length) {
        return req.reply({
          messages: [
            ...req.body.messages,
            { role: 'tool', tool_call_id: confirmedIds[confirmedIds.length - 1], content: JSON.stringify({ ok: true, result: { deleted: 'page-stub' } }) },
            { role: 'assistant', content: 'Done — the page was deleted.' },
          ],
          pending_confirmation: null,
          trace: [
            { iter: 1, type: 'tool', name: 'pb_delete_page', ok: true, result: { ok: true } },
            { iter: 2, type: 'final', content: 'Done — the page was deleted.' },
          ],
          iterations: 2,
          usage: { prompt_tokens: 50, completion_tokens: 20, total_tokens: 70 },
          ctx: { project_id: req.body.project_id, page_id: null, locale: null },
        });
      }

      // Destructive flow — gated on confirmation
      if (/delete/i.test(text)) {
        return req.reply({
          messages: [
            ...req.body.messages,
            {
              role: 'assistant',
              content: null,
              tool_calls: [{
                id: 'call_destructive_1',
                type: 'function',
                function: { name: 'pb_delete_page', arguments: JSON.stringify({ page_id: 'page-stub' }) },
              }],
            },
          ],
          pending_confirmation: {
            tool_call_id: 'call_destructive_1',
            name: 'pb_delete_page',
            args: { page_id: 'page-stub' },
            description: 'Permanently delete a page. Destructive — requires confirmation.',
          },
          trace: [{ iter: 1, type: 'tool', name: 'pb_delete_page', ok: false, pending_confirmation: true }],
          iterations: 1,
          usage: { prompt_tokens: 30, completion_tokens: 15, total_tokens: 45 },
          ctx: { project_id: req.body.project_id, page_id: null, locale: null },
        });
      }

      // Non-destructive — successful tool round + final assistant message
      return req.reply({
        messages: [
          ...req.body.messages,
          {
            role: 'assistant',
            content: null,
            tool_calls: [{
              id: 'call_list_1',
              type: 'function',
              function: { name: 'pb_list_pages', arguments: '{}' },
            }],
          },
          {
            role: 'tool',
            tool_call_id: 'call_list_1',
            content: JSON.stringify({ ok: true, result: { pages: [{ id: 'p1', name: 'Home', slug: 'home' }], count: 1 } }),
          },
          { role: 'assistant', content: 'You have 1 page: Home.' },
        ],
        pending_confirmation: null,
        trace: [
          { iter: 1, type: 'tool', name: 'pb_list_pages', ok: true, result: { ok: true } },
          { iter: 2, type: 'final', content: 'You have 1 page: Home.' },
        ],
        iterations: 2,
        usage: { prompt_tokens: 40, completion_tokens: 18, total_tokens: 58 },
        ctx: { project_id: req.body.project_id, page_id: null, locale: null },
      });
    }).as('aiChat');

    cy.visit('/project/1/overview');
  });

  it('opens the panel from the floating action button', () => {
    cy.get('[data-cy="ai-assistant-fab"]').should('be.visible').click();
    cy.get('[data-cy="ai-assistant-panel"]').should('be.visible');
    cy.get('[data-cy="ai-assistant-status"]').should('contain.text', 'idle');
  });

  it('sends a non-destructive prompt and renders the tool round + final assistant message', () => {
    cy.get('[data-cy="ai-assistant-fab"]').click();
    cy.get('[data-cy="ai-assistant-composer-input"]').type('list my pages');
    cy.get('[data-cy="ai-assistant-send"]').click();

    cy.wait('@aiChat').its('request.body').should((body) => {
      expect(body).to.have.property('messages');
      expect(body.messages[body.messages.length - 1].content).to.eq('list my pages');
    });

    cy.get('[data-cy="ai-assistant-messages"]').should('contain.text', 'You have 1 page: Home.');
    cy.get('[data-cy="ai-assistant-token-count"]').should('contain.text', '58');
    cy.get('[data-cy="ai-assistant-status"]').should('contain.text', 'idle');
  });

  it('halts on destructive tool and surfaces a confirmation card', () => {
    cy.get('[data-cy="ai-assistant-fab"]').click();
    cy.get('[data-cy="ai-assistant-composer-input"]').type('delete my homepage');
    cy.get('[data-cy="ai-assistant-send"]').click();

    cy.wait('@aiChat');

    cy.get('[data-cy="ai-assistant-confirm-card"]')
      .should('be.visible')
      .and('have.attr', 'data-tool-name', 'pb_delete_page');
    cy.get('[data-cy="ai-assistant-status"]').should('contain.text', 'awaiting_confirmation');
    cy.get('[data-cy="ai-assistant-composer-input"]').should('be.disabled');
  });

  it('continues the chain after the user confirms the destructive tool', () => {
    cy.get('[data-cy="ai-assistant-fab"]').click();
    cy.get('[data-cy="ai-assistant-composer-input"]').type('delete my homepage');
    cy.get('[data-cy="ai-assistant-send"]').click();
    cy.wait('@aiChat');

    cy.get('[data-cy="ai-assistant-confirm-approve"]').click();
    cy.wait('@aiChat').its('request.body.confirmed_tool_calls').should('include', 'call_destructive_1');

    cy.get('[data-cy="ai-assistant-messages"]').should('contain.text', 'Done — the page was deleted.');
    cy.get('[data-cy="ai-assistant-confirm-card"]').should('not.exist');
    cy.get('[data-cy="ai-assistant-status"]').should('contain.text', 'idle');
  });

  it('skips a destructive tool when the user cancels and adds an assistant note', () => {
    cy.get('[data-cy="ai-assistant-fab"]').click();
    cy.get('[data-cy="ai-assistant-composer-input"]').type('delete my homepage');
    cy.get('[data-cy="ai-assistant-send"]').click();
    cy.wait('@aiChat');

    cy.get('[data-cy="ai-assistant-confirm-skip"]').click();

    cy.get('[data-cy="ai-assistant-confirm-card"]').should('not.exist');
    cy.get('[data-cy="ai-assistant-messages"]').should('contain.text', 'Skipped');
    cy.get('[data-cy="ai-assistant-status"]').should('contain.text', 'idle');
  });

  it('reset clears the transcript and token counter', () => {
    cy.get('[data-cy="ai-assistant-fab"]').click();
    cy.get('[data-cy="ai-assistant-composer-input"]').type('list my pages');
    cy.get('[data-cy="ai-assistant-send"]').click();
    cy.wait('@aiChat');
    cy.get('[data-cy="ai-assistant-token-count"]').should('not.contain.text', '0 tokens');

    cy.get('[data-cy="ai-assistant-reset"]').click();
    cy.get('[data-cy="ai-assistant-token-count"]').should('contain.text', '0 tokens');
    cy.get('[data-cy="ai-assistant-messages"]').should('not.contain.text', 'Home');
  });
});
