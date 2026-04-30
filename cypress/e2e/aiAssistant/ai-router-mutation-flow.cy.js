/**
 * E2E — AI Tool Router Mutation Flow (regression for bug fix bundle in
 * function 69bd00000000000000000007).
 *
 * Bug history:
 *  - Bug A: regenerate_section_text read tree.result.props (always undefined),
 *           always returned no_text_props_found, model gave up.
 *  - Bug B: model produced a final "success" message without ever invoking
 *           a mutation tool. The fix adds a final-message guard server-side.
 *  - Bug C/D/E/F: schema drift (input/output, active_process_id, daily_rollup)
 *           caused 400s during insertLog / mark_active / deductAiTokenUsage.
 *
 * Strategy: cy.intercept stubs /ai/chat with three distinct shapes that mirror
 * what the fixed server SHOULD now send back:
 *   1) "happy path"  — regenerate_section_text returns { ok: true, applied: 3 }
 *      and the assistant final message lists what changed.
 *   2) "guard path"  — first iteration ends with no mutation but the server's
 *      synthetic_correction_injected branch kicks in, second iteration runs a
 *      successful mutation and the final message reports it.
 *   3) "honest fail" — every mutation returns { ok: false }; the assistant must
 *      surface the failure (per MUTATION DISCIPLINE in SYSTEM_PROMPT) instead of
 *      claiming success.
 */

describe('AI Tool Router — mutation flow regression', () => {
  beforeEach(() => {
    cy.intercept('POST', '**/api/fn-execute/ai/chat', (req) => {
      const lastUser = [...(req.body?.messages || [])]
        .reverse()
        .find((m) => m.role === 'user');
      const text = (lastUser?.content || '').toLowerCase();

      // Honest-fail path: any prompt containing "broken-section"
      if (text.includes('broken-section')) {
        return req.reply({
          messages: [
            ...req.body.messages,
            {
              role: 'assistant',
              content:
                "I tried to rewrite that section but it doesn't have any string-typed text props (no_text_props_found). Could you point me at a different section, or specify the exact field you want updated?",
            },
          ],
          pending_confirmation: null,
          trace: [
            { iter: 1, type: 'tool', name: 'regenerate_section_text', ok: false, result: { ok: false, error: 'no_text_props_found' } },
            { iter: 2, type: 'final', content: 'Honest failure surfaced.' },
          ],
          iterations: 2,
          usage: { prompt_tokens: 60, completion_tokens: 30, total_tokens: 90 },
          ctx: { project_id: req.body.project_id, page_id: null, locale: null },
        });
      }

      // Guard path: prompt contains "needs-guard"
      if (text.includes('needs-guard')) {
        return req.reply({
          messages: [
            ...req.body.messages,
            {
              role: 'assistant',
              content:
                'I rewrote your About section. Updated 3 text props: subtitle, sectionTitle, items[0].title.',
            },
          ],
          pending_confirmation: null,
          // Server-side trace MUST show the synthetic correction kicked in
          // before the eventual successful tool call.
          trace: [
            { iter: 1, type: 'final_skipped_for_reprompt', content: 'I will help you with that.' },
            { iter: 1, type: 'synthetic_correction', content: 'Re-attempt: call pb_get_component_tree...' },
            {
              iter: 2,
              type: 'tool',
              name: 'regenerate_section_text',
              ok: true,
              result: { ok: true, result: { applied: 3, paths: ['subtitle', 'sectionTitle', 'items.0.title'] } },
            },
            {
              iter: 3,
              type: 'final',
              content: 'I rewrote your About section. Updated 3 text props: subtitle, sectionTitle, items[0].title.',
            },
          ],
          iterations: 3,
          usage: { prompt_tokens: 200, completion_tokens: 80, total_tokens: 280 },
          ctx: { project_id: req.body.project_id, page_id: null, locale: null },
        });
      }

      // Happy path — direct mutation success
      return req.reply({
        messages: [
          ...req.body.messages,
          {
            role: 'assistant',
            content:
              'Done — I rewrote your About 1 section. Updated subtitle, sectionTitle, and 2 item descriptions.',
          },
        ],
        pending_confirmation: null,
        trace: [
          {
            iter: 1,
            type: 'tool',
            name: 'regenerate_section_text',
            ok: true,
            result: { ok: true, result: { applied: 4, paths: ['subtitle', 'sectionTitle', 'items.0.description', 'items.1.description'] } },
          },
          {
            iter: 2,
            type: 'final',
            content: 'Done — I rewrote your About 1 section. Updated subtitle, sectionTitle, and 2 item descriptions.',
          },
        ],
        iterations: 2,
        usage: { prompt_tokens: 180, completion_tokens: 70, total_tokens: 250 },
        ctx: { project_id: req.body.project_id, page_id: null, locale: null },
      });
    }).as('aiChat');

    cy.visit('/project/1/overview');
  });

  it('renders the assistant final message after a successful regenerate_section_text mutation', () => {
    cy.get('[data-cy="ai-assistant-fab"]').click();
    cy.get('[data-cy="ai-assistant-panel"]').should('be.visible');
    cy.get('[data-cy="ai-assistant-composer-input"]').type(
      'Change my about us content. We are a roof repairing company located in Canada / Toronto.'
    );
    cy.get('[data-cy="ai-assistant-send"]').click();

    cy.wait('@aiChat');

    cy.get('[data-cy="ai-assistant-messages"]').should(
      'contain.text',
      'rewrote your About 1 section'
    );
    cy.get('[data-cy="ai-assistant-status"]').should('contain.text', 'idle');
    cy.get('[data-cy="ai-assistant-token-count"]').should('contain.text', '250');
  });

  it('reports honest failure rather than fabricating success when every mutation fails', () => {
    cy.get('[data-cy="ai-assistant-fab"]').click();
    cy.get('[data-cy="ai-assistant-composer-input"]').type(
      'Rewrite the broken-section copy with a fresh tone.'
    );
    cy.get('[data-cy="ai-assistant-send"]').click();
    cy.wait('@aiChat');

    cy.get('[data-cy="ai-assistant-messages"]')
      .should('contain.text', 'no_text_props_found')
      .and('not.contain.text', 'Done — I rewrote');
    cy.get('[data-cy="ai-assistant-status"]').should('contain.text', 'idle');
  });

  it('surfaces a successful final message when the server-side synthetic-correction guard recovers a mutation intent', () => {
    cy.get('[data-cy="ai-assistant-fab"]').click();
    cy.get('[data-cy="ai-assistant-composer-input"]').type(
      'Update the about section — needs-guard scenario, mutation intent only.'
    );
    cy.get('[data-cy="ai-assistant-send"]').click();
    cy.wait('@aiChat');

    cy.get('[data-cy="ai-assistant-messages"]').should(
      'contain.text',
      'rewrote your About section'
    );
    cy.get('[data-cy="ai-assistant-token-count"]').should('contain.text', '280');
    cy.get('[data-cy="ai-assistant-status"]').should('contain.text', 'idle');
  });
});
