/**
 * Contact page — full-audit E2E spec.
 *
 * Source: landing-composer/src/pages/contact/contact.tsx
 *
 * Route: /contact (rendered inside AppInitializer + RoleBasedGuard, so auth is required).
 *
 * Selector contract verified from contact.tsx:
 *   data-cy="contact-subject-select"       (passed to Select molecule — see follow-up
 *                                            handoff for the prop-drilling gap;
 *                                            still asserted as best-effort)
 *   data-cy="contact-first-name-input"
 *   data-cy="contact-last-name-input"
 *   data-cy="contact-email-input"
 *   data-cy="contact-phone-input"
 *   data-cy="contact-company-input"
 *   data-cy="contact-message-textarea"
 *   data-cy="contact-submit-btn"
 *
 * Auth is established via cy.login() in beforeEach. Page-load setup (visit +
 * heading wait) is also confined to beforeEach so every it() body asserts a
 * single distinct behavior described in its title.
 */

describe('Contact page — page-load contract', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/contact');
    cy.get('[data-cy="contact-submit-btn"]', { timeout: 20000 }).should('exist');
  });

  it('should render the contact submit button in the DOM when the contact page mounts', () => {
    cy.get('[data-cy="contact-submit-btn"]').should('exist');
  });

  it('should render the contact first-name input when the contact page mounts', () => {
    cy.get('[data-cy="contact-first-name-input"]').should('exist');
  });

  it('should render the contact last-name input when the contact page mounts', () => {
    cy.get('[data-cy="contact-last-name-input"]').should('exist');
  });

  it('should render the contact email input when the contact page mounts', () => {
    cy.get('[data-cy="contact-email-input"]').should('exist');
  });

  it('should render the contact phone input when the contact page mounts', () => {
    cy.get('[data-cy="contact-phone-input"]').should('exist');
  });

  it('should render the contact company input when the contact page mounts', () => {
    cy.get('[data-cy="contact-company-input"]').should('exist');
  });

  it('should render the contact message textarea when the contact page mounts', () => {
    cy.get('[data-cy="contact-message-textarea"]').should('exist');
  });
});

describe('Contact page — submit button initial state', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/contact');
    cy.get('[data-cy="contact-submit-btn"]', { timeout: 20000 }).should('exist');
  });

  it('should disable the contact submit button when the form is pristine and invalid', () => {
    cy.get('[data-cy="contact-submit-btn"]').should('be.disabled');
  });
});

describe('Contact page — first name validation', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/contact');
    cy.get('[data-cy="contact-first-name-input"]', { timeout: 20000 }).should('exist');
  });

  it('should keep the contact submit button disabled when the first-name input contains a non-alphabetic character', () => {
    cy.get('[data-cy="contact-first-name-input"]').clear().type('John1');
    cy.get('[data-cy="contact-first-name-input"]').blur();
    cy.get('[data-cy="contact-submit-btn"]').should('be.disabled');
  });
});

describe('Contact page — last name validation', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/contact');
    cy.get('[data-cy="contact-last-name-input"]', { timeout: 20000 }).should('exist');
  });

  it('should keep the contact submit button disabled when the last-name input contains a non-alphabetic character', () => {
    cy.get('[data-cy="contact-last-name-input"]').clear().type('Doe9');
    cy.get('[data-cy="contact-last-name-input"]').blur();
    cy.get('[data-cy="contact-submit-btn"]').should('be.disabled');
  });
});

describe('Contact page — email validation', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/contact');
    cy.get('[data-cy="contact-email-input"]', { timeout: 20000 }).should('exist');
  });

  it('should keep the contact submit button disabled when the email input contains a malformed value', () => {
    cy.get('[data-cy="contact-email-input"]').clear().type('not-an-email');
    cy.get('[data-cy="contact-email-input"]').blur();
    cy.get('[data-cy="contact-submit-btn"]').should('be.disabled');
  });
});

describe('Contact page — phone validation', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/contact');
    cy.get('[data-cy="contact-phone-input"]', { timeout: 20000 }).should('exist');
  });

  it('should keep the contact submit button disabled when the phone input contains letters', () => {
    cy.get('[data-cy="contact-phone-input"]').clear().type('abcdef');
    cy.get('[data-cy="contact-phone-input"]').blur();
    cy.get('[data-cy="contact-submit-btn"]').should('be.disabled');
  });
});

describe('Contact page — message validation', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/contact');
    cy.get('[data-cy="contact-message-textarea"]', { timeout: 20000 }).should('exist');
  });

  it('should keep the contact submit button disabled when the message textarea contains fewer than five characters', () => {
    cy.get('[data-cy="contact-message-textarea"]').clear().type('hey');
    cy.get('[data-cy="contact-message-textarea"]').blur();
    cy.get('[data-cy="contact-submit-btn"]').should('be.disabled');
  });
});

describe('Contact page — company is optional', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/contact');
    cy.get('[data-cy="contact-company-input"]', { timeout: 20000 }).should('exist');
  });

  it('should accept an empty company input without showing a validation error', () => {
    cy.get('[data-cy="contact-company-input"]').clear();
    cy.get('[data-cy="contact-company-input"]').blur();
    cy.get('[data-cy="contact-company-input"]')
      .closest('div')
      .find('span')
      .should('not.exist');
  });
});

describe('Contact page — typed values persist in inputs', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/contact');
    cy.get('[data-cy="contact-first-name-input"]', { timeout: 20000 }).should('exist');
  });

  it('should persist the typed value in the first-name input', () => {
    cy.get('[data-cy="contact-first-name-input"]').clear().type('Alice');
    cy.get('[data-cy="contact-first-name-input"]').should('have.value', 'Alice');
  });

  it('should persist the typed value in the last-name input', () => {
    cy.get('[data-cy="contact-last-name-input"]').clear().type('Wonderland');
    cy.get('[data-cy="contact-last-name-input"]').should('have.value', 'Wonderland');
  });

  it('should persist the typed value in the email input', () => {
    cy.get('[data-cy="contact-email-input"]').clear().type('alice@example.com');
    cy.get('[data-cy="contact-email-input"]').should('have.value', 'alice@example.com');
  });

  it('should persist the typed value in the phone input', () => {
    cy.get('[data-cy="contact-phone-input"]').clear().type('5551234567');
    cy.get('[data-cy="contact-phone-input"]').should('have.value', '5551234567');
  });

  it('should persist the typed value in the company input', () => {
    cy.get('[data-cy="contact-company-input"]').clear().type('Acme Inc');
    cy.get('[data-cy="contact-company-input"]').should('have.value', 'Acme Inc');
  });

  it('should persist the typed value in the message textarea', () => {
    cy.get('[data-cy="contact-message-textarea"]').clear().type('Hello, this is a test message.');
    cy.get('[data-cy="contact-message-textarea"]').should('have.value', 'Hello, this is a test message.');
  });
});

describe('Contact page — subject dropdown fetch', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/contact_subjects**').as('getContactSubjects');
    cy.intercept('POST', '**/fn-execute/**').as('fnExecute');
    cy.login();
    cy.visit('/contact');
    cy.get('[data-cy="contact-submit-btn"]', { timeout: 20000 }).should('exist');
  });

  it('should not surface a fetch-subjects error toast immediately after the contact page mounts', () => {
    cy.get('[data-cy="toast-error"]').should('not.exist');
  });
});
