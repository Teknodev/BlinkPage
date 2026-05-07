/**
 * E2E — AI Picker (Hover Outline + Label)
 *
 * Verifies that while pick mode is active, hovering a canvas element
 * produces both the portaled hover outline (HoverOutline) AND the
 * label badge (HoverLabel) showing the tag + text preview.
 *
 * Both atoms are portaled to <body> with position:fixed.
 */

import { loginToEditor, addComponent, clearPlayground } from '../../support/editorTestHelper';

function sseBody(frames) {
  return frames
    .map((f) => `event: ${f.event}\ndata: ${JSON.stringify(f.data)}\n\n`)
    .join('');
}

const idleFrames = [
  { event: 'request_started', data: { request_id: 'r_h1', sse: true } },
  { event: 'conversation', data: { conversation_id: 'c_h1' } },
  {
    event: 'done',
    data: {
      request_id: 'r_h1',
      conversation_id: 'c_h1',
      messages: [],
      pending_confirmation: null,
      trace: [],
      iterations: 0,
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      ctx: { project_id: '1', page_id: null, locale: null },
    },
  },
];

describe('AI Picker — hover outline + label', () => {
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

    // Make sure there's at least one component on canvas with text we can hover.
    cy.get('body').then(($body) => {
      if ($body.find('[data-component-index]').length === 0) {
        addComponent('hero', 0);
      }
    });

    cy.get('[data-cy="ai-assistant-fab"]').click();
    cy.get('[data-cy="ai-assistant-panel"]').should('be.visible');
    cy.get('[data-cy="ai-pick-button"]').click();
    cy.get('body').should('have.class', 'ai-picker-active');
  });

  it('renders a hover outline + label when a canvas text element is hovered', () => {
    // Pick the first canvas text candidate (h1/h2/p) inside a section.
    cy.get('[data-component-index]')
      .first()
      .find('h1, h2, h3, p')
      .first()
      .then(($el) => {
        // mousemove uses capture-phase listener attached to document.
        const rect = $el[0].getBoundingClientRect();
        const clientX = rect.left + 5;
        const clientY = rect.top + 5;
        cy.wrap($el).trigger('mousemove', {
          clientX,
          clientY,
          force: true,
          bubbles: true,
        });
      });

    // Outline is portaled to body — locate by class prefix from the module.
    cy.get('[class*="hoverOutline"]', { timeout: 4000 }).should('exist');
    cy.get('[class*="hoverLabel"]', { timeout: 4000 }).should('exist');

    // Label should expose the uppercased tag (H1/H2/P).
    cy.get('[class*="hoverLabel"]').invoke('text').should('match', /H[1-6]|P|SPAN|A/i);
  });
});
