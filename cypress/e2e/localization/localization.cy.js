import { loginToEditor, addComponent, clearPlayground, resetPlayground } from '../../support/editorTestHelper';
import { localizationPage } from '../../support/pages/localizationPage';
import localizationData from '../../fixtures/localizationData.json';

// ─────────────────────────────────────────────────────────────────────────────

describe('Localization - Settings Navigation', () => {
  beforeEach(() => {
    loginToEditor();
    clearPlayground();
    addComponent('hero', 0);
  });

  afterEach(() => {
    resetPlayground();
  });

  it('should open the localization settings panel', () => {
    localizationPage.openLocalizationSettings();
    localizationPage.verifySettingsPanelOpen();
  });
});

describe('Localization - Add Language', () => {
  beforeEach(() => {
    loginToEditor();
    clearPlayground();
    addComponent('hero', 0);
    localizationPage.openLocalizationSettings();
  });

  afterEach(() => {
    resetPlayground();
  });

  it('should add a new language to the localization table', () => {
    localizationPage.addLanguage(
      localizationData.addLanguage.code,
      localizationData.addLanguage.name
    );

    cy.wait(2000);

    localizationPage.verifyLanguageInTable(localizationData.addLanguage.name);
  });
});

describe('Localization - Remove Language', () => {
  beforeEach(() => {
    loginToEditor();
    clearPlayground();
    addComponent('hero', 0);
    localizationPage.openLocalizationSettings();
  });

  afterEach(() => {
    resetPlayground();
  });

  it('should remove a language from the localization table', () => {
    localizationPage.addLanguage(
      localizationData.addLanguage.code,
      localizationData.addLanguage.name
    );
    cy.wait(2000);

    localizationPage.removeLanguage(localizationData.addLanguage.name);
    cy.wait(1000);

    localizationPage.verifyLanguageNotInTable(localizationData.addLanguage.name);
  });
});

describe('Localization - Switch Language', () => {
  beforeEach(() => {
    loginToEditor();
    clearPlayground();
    addComponent('hero', 0);
  });

  afterEach(() => {
    resetPlayground();
  });

  it('should switch the active language and re-render the canvas', () => {
    localizationPage.openLocalizationSettings();

    localizationPage.addLanguage(
      localizationData.addLanguage.code,
      localizationData.addLanguage.name
    );
    cy.wait(2000);

    cy.get('body').click(0, 0);
    cy.wait(500);

    localizationPage.switchLanguage(localizationData.addLanguage.name);
    cy.wait(1000);

    localizationPage.verifyCanvasRendered();
  });
});

describe('Localization - Language Persistence', () => {
  beforeEach(() => {
    loginToEditor();
    clearPlayground();
    addComponent('hero', 0);
  });

  afterEach(() => {
    resetPlayground();
  });

  it('should persist added language after page reload', () => {
    localizationPage.openLocalizationSettings();
    localizationPage.addLanguage(
      localizationData.secondLanguage.code,
      localizationData.secondLanguage.name
    );
    cy.wait(2000);

    cy.reload();
    cy.wait(2000);

    localizationPage.openLocalizationSettings();

    localizationPage.verifyLanguageInTable(localizationData.secondLanguage.name);
  });
});
