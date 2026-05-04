/**
 * SystemLogger Global API tests.
 *
 * Verifies that the Logger class is exposed on window.SystemLogger and that
 * its API (enable/disable levels and modules) behaves correctly.
 *
 * Uses the real test project so the full app bundle is loaded.
 */

describe('SystemLogger Global API', () => {
  beforeEach(() => {
    cy.visit('/project/69f515295ac7bd7572f9590c/blockbuilder?component=TestComponent');
  });

  it('should expose SystemLogger to the window and allow configuring disabled levels/modules', () => {
    cy.window().then((win) => {
      // 1. Verify it exists
      expect(win.SystemLogger).to.exist;

      // 2. Verify config defaults: debug is disabled by default
      expect(win.SystemLogger.disabledLevels.has('debug')).to.be.true;

      // 3. Test enableLevel
      win.SystemLogger.enableLevel('debug');
      expect(win.SystemLogger.disabledLevels.has('debug')).to.be.false;

      // 4. Test disableLevel
      win.SystemLogger.disableLevel('info.function');
      expect(win.SystemLogger.disabledLevels.has('info.function')).to.be.true;

      // 5. Test disableModule
      win.SystemLogger.disableModule('DesignTab');
      expect(win.SystemLogger.disabledModules.has('DesignTab')).to.be.true;
    });
  });

  it('should not throw errors when invoking semantic logger methods via old info signature', () => {
    cy.window().then((win) => {
      cy.spy(win.console, 'info').as('consoleInfo');

      // Assume a generic component or hook tries to call logger.info("test")
      const TestLogger = new win.SystemLogger('TestModule');

      // Should not throw Uncaught TypeError
      TestLogger.info('legacy plain log');

      // semantic logger
      TestLogger.info.interaction('semantic log');

      cy.get('@consoleInfo').should('have.been.calledTwice');
    });
  });
});
