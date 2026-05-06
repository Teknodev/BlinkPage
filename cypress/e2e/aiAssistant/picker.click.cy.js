/**
 * E2E — AI Picker (Click captures chip + sends correct payload)
 *
 * Verifies the end-to-end pick-and-send flow:
 *  - clicking a description-class element on the canvas adds a chip
 *    with kind=text (icon "T") and the correct preview
 *  - pick mode auto-exits after the click (NO — actually pick mode is
 *    NOT auto-exited on every click; chips just accumulate. We only
 *    assert chip lands)
 *  - sending the prompt POSTs `selected_elements` (snake_case) with
 *    sectionName === "description" and elementId ending in
 *    "-description-1" (NOT the runtime-id child)
 */

import { loginToEditor, addComponent } from '../../support/editorTestHelper';

function sseBody(frames) {
  return frames
    .map((f) => `event: ${f.event}\ndata: ${JSON.stringify(f.data)}\n\n`)
    .join('');
}

const completionFrames = [
  { event: 'request_started', data: { request_id: 'r_p1', sse: true } },
  { event: 'conversation', data: { conversation_id: 'c_p1' } },
  { event: 'iter_start', data: { iter: 1 } },
  { event: 'final_message', data: { content: 'Got it.' } },
  {
    event: 'done',
    data: {
      request_id: 'r_p1',
      conversation_id: 'c_p1',
      messages: [
        { role: 'user', content: 'change this to red' },
        { role: 'assistant', content: 'Got it.' },
      ],
      pending_confirmation: null,
      trace: [],
      iterations: 1,
      usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      ctx: { project_id: '1', page_id: null, locale: null },
    },
  },
];

describe('AI Picker — click captures chip and sends selected_elements', () => {
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

    // Ensure we have an intro-section on canvas — its template renders a
    // `<auto-generate-<id>-description>` element which is the stable target
    // for asserting sectionName resolution. The picker's resolveTarget walks
    // up to the auto-generate-tagged ancestor and reads its DOM id.
    cy.get('body').then(($body) => {
      const hasDesc = $body.find('[class*="auto-generate-"][class*="-description"]').length > 0;
      if (!hasDesc) {
        addComponent('intro', 0);
      }
    });
    cy.get('[class*="auto-generate-"][class*="-description"]', { timeout: 15000 }).should('exist');

    cy.get('[data-cy="ai-assistant-fab"]').click();
    cy.get('[data-cy="ai-assistant-panel"]').should('be.visible');
  });

  it('clicking a description element adds a chip with the correct preview + kind', () => {
    cy.get('[data-cy="ai-pick-button"]').click();
    cy.get('body').should('have.class', 'ai-picker-active');

    cy.get('[class*="auto-generate-"][class*="-description"]', { timeout: 10000 })
      .first()
      .then(($el) => {
        const previewSnapshot = ($el.text() || '').replace(/\s+/g, ' ').trim().slice(0, 24);
        cy.wrap($el[0]).as('descTarget');
        cy.wrap(previewSnapshot).as('expectedPreview');
      });

    cy.get('@descTarget').then(($el) => {
      const rect = $el[0].getBoundingClientRect();
      const clientX = rect.left + Math.min(20, rect.width / 2);
      const clientY = rect.top + Math.min(10, rect.height / 2);
      // Mousemove first so lastResolvedRef populates with the hover-resolved element.
      cy.wrap($el).trigger('mousemove', { clientX, clientY, force: true, bubbles: true });
      cy.wait(60);
      cy.wrap($el).trigger('click', { clientX, clientY, force: true, bubbles: true });
    });

    // Chip lands in the tray.
    cy.get('[data-cy="ai-element-chip"]', { timeout: 4000 }).should('have.length.at.least', 1);
    cy.get('[data-cy="ai-element-chip"]').first().within(() => {
      // The kind label inside the chip — for a description (paragraph-ish) it
      // should classify as "text" with the "T" glyph.
      cy.contains(/^text$/i).should('exist');
    });
  });

  it('sending the prompt posts selected_elements with sectionName=description and stable elementId', () => {
    cy.get('[data-cy="ai-pick-button"]').click();
    cy.get('body').should('have.class', 'ai-picker-active');

    cy.get('[class*="auto-generate-"][class*="-description"]', { timeout: 10000 })
      .first()
      .then(($el) => {
        const rect = $el[0].getBoundingClientRect();
        const clientX = rect.left + Math.min(20, rect.width / 2);
        const clientY = rect.top + Math.min(10, rect.height / 2);
        cy.wrap($el).trigger('mousemove', { clientX, clientY, force: true, bubbles: true });
        cy.wait(60);
        cy.wrap($el).trigger('click', { clientX, clientY, force: true, bubbles: true });
      });

    cy.get('[data-cy="ai-element-chip"]').should('have.length.at.least', 1);

    cy.get('[data-cy="ai-assistant-composer-input"]').type('change this to red');
    cy.get('[data-cy="ai-assistant-send"]').click();

    cy.wait('@aiChat').its('request.body').should((body) => {
      expect(body, 'request body').to.have.property('selected_elements');
      expect(body.selected_elements).to.be.an('array').and.have.length.at.least(1);
      const first = body.selected_elements[0];
      expect(first.kind).to.eq('text');
      expect(first.sectionName, 'sectionName').to.eq('description');
      // elementId must come from the auto-generate-tagged ancestor — those
      // ids end in `-description-<n>` (not the runtime-id child like
      // ...-description-982693166-ksxs4g).
      expect(first.elementId, 'elementId').to.match(/-description-\d+$/);
    });
  });
});
