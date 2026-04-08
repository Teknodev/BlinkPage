describe('SystemLogger Global API', () => {
  beforeEach(() => {
    cy.visit('/project/1/blockbuilder?component=TestComponent');
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
    // Intercept console.info
    cy.window().then((win) => {
      cy.spy(win.console, 'info').as('consoleInfo');
      
      // Assume a generic component or hook tries to call logger.info("test")
      // We will simulate it here since we have the class instance
      const TestLogger = new win.SystemLogger("TestModule");
      
      // Should not throw Uncaught TypeError
      TestLogger.info("legacy plain log");
      
      // semantic logger
      TestLogger.info.interaction("semantic log");
      
      cy.get('@consoleInfo').should('have.been.calledTwice');
    });
  });
});
