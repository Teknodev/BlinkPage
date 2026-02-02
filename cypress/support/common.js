export function interceptResponseCodeWait(api, responseCode) {
  return cy.wait(api).its("response.statusCode").should("eq", responseCode);
}

export function verifyTextField(
  selector,
  expected = {},
  shouldType = true,
  shouldClear = false
) {
  // 1) Convert preset name ("small") into object
  if (typeof expected === "string") {
    expected = { preset: expected };
  }

  // 2) Merge preset defaults with explicit over rides
  if (expected.preset) {
    expected = {
      ...TEXTFIELD_PRESETS[expected.preset],
      ...expected,
    };
  }

  // 3) Start Verification
  cy.get(selector).should("exist").and("be.visible")
    .then(($input) => {
      cy.wrap($input).as("input");

      // ICON CHECK
      if (expected.icon) {
        cy.get(expected.icon).should("exist").and("be.visible");
      } else {
        cy.get(expected.icon).should("not.exist");
      }

      // PLACEHOLDER CHECK
      if ("placeholder" in expected) {
        if (expected.placeholder)
          cy.get(selector).should("have.attr", "placeholder", expected.placeholder);
        else cy.get(selector).should("not.have.attr", "placeholder");
      }

      // CSS CHECKS
      if (expected.fontSize) {
        cy.get(selector).should("have.css", "font-size", expected.fontSize);
      }

      if (expected.textColor) {
        cy.get(selector).should("have.css", "color", expected.textColor);
      }

      if (expected.backgroundColor) {
        cy.get(selector).should("have.css", "background-color", expected.backgroundColor);
      }

      if (expected.borderRadius) {
        cy.get(selector).should("have.css", "border-radius", expected.borderRadius);
      }

      // REQUIRED CHECK
      if ("required" in expected) {
        expected.required
          ? cy.get(selector).should("have.attr", "required")
          : cy.get(selector).should("not.have.attr", "required");
      }

      // SHOULD TYPE
      if (shouldType && expected.value) {
        // cy.get(selector).dblclick();
        cy.get(selector)
          .should('be.visible')
          .dblclick()          // activate cell
          .clear()
          .type(expected.value);

        // if (expected.onBlurCss) {
        //   cy.get(selector).blur();
        //   cy.get(selector).should("have.css", "border-color", expected.onBlurCss);
        // }
      }
    });
}

// Verify Button styles and behavior
export function verifyButton(selector, expected = {}, shouldClick = false) {
  cy.get(selector).eq(0).contains(expected.text).should("exist").and("be.visible")
    .then(($btn) => {
      // Text check
      if (expected.text) {
        cy.wrap($btn).should("have.text", expected.text);
      }
      // Font size
      if (expected.fontSize) {
        cy.wrap($btn).should("have.css", "font-size", expected.fontSize);
      }
      // Font family
      if (expected.fontFamily) {
        cy.wrap($btn).should("have.css", "font-family", expected.fontFamily);
      }
      // Text color
      if (expected.textColor) {
        cy.wrap($btn).should("have.css", "color", expected.textColor);
      }
      // Background color
      if (expected.backgroundColor) {
        cy.wrap($btn).should("have.css", "background-color", expected.backgroundColor);
      }
      // Border radius
      if (expected.borderRadius) {
        cy.wrap($btn).should("have.css", "border-radius", expected.borderRadius);
      }

      // Disabled state
      if (expected.disabled !== undefined) {
        expected.disabled
          ? cy.wrap($btn).should("be.disabled")
          : cy.wrap($btn).should("not.be.disabled");
      }

      // Hover color
      if (expected.hoverColor) {
        cy.wrap($btn).trigger("mouseover").should("have.css", "color", expected.hoverColor);
      }

      // Click action
      if (shouldClick && !expected.disabled) {
        cy.wrap($btn).click();
      }
    });
}

export function verifyFieldErrorMessage(fieldName, expectedError) {
  cy.get(`input[name="${fieldName}"]`)
    .parent()
    .find('span')
    .should('be.visible')
    .and('have.text', expectedError);
}

export function createNewWebsiteBtn() {
  cy.get('button._buttonAttom_1k5xv_1._primary_1k5xv_28').should('be.visible').contains('Create New Website').click();
}

export function webCreationFlow() {
  //Main Heading
  cy.get('span._title_1ht8b_1').should('be.visible').contains('Project Setup');
  //Second Heading
  cy.get('span._title_1z03f_9', { timeout: 3000 }).should('be.visible').contains('How would you like to design your website?');

  const expectedCards = [
    {
      title: 'Create Your Own Design',
      description: 'Start from scratch and build your website exactly the way you envision it',
    },
    {
      title: 'Generate a Design with AI',
      description: 'Receive a personalized website design in seconds.',
    },
    {
      title: 'Customize a Template',
      description: 'Choose from thousands of designs to customize.',
    },
  ];

  cy.get('div._card_1z03f_14').each(($card, index) => {
    cy.wrap($card)
      .should('be.visible')
      .within(() => {
        cy.get('._title_1z03f_9').should('have.text', expectedCards[index].title);
        cy.get('._description_1z03f_45')
          .should('contain.text', expectedCards[index].description);
      });
  });

  cy.contains('div._card_1z03f_14', 'Create Your Own Design')
    .scrollIntoView()
    .click('top', { force: true });

  //Create new Project Modal
  createNewProjectModal('AutomationTestProject');

}

export function createNewProjectModal(projectName) {
  cy.get('._popup_1u2hv_15 div div span').should('be.visible').contains('Create Blank Project');
  cy.get('div._content_4zwdo_21 div p').should('be.visible').contains('The data from these fields will be used to auto generate the content for your site.');
  cy.get('input[placeholder="Project Name"]').should('be.visible').type(projectName);
  verifyButton('button._buttonAttom_1k5xv_1._primary_1k5xv_28._button_1v8j0_37', {
    text: 'Create', fontSize: '12px', textColor: 'rgb(33, 33, 33)',
    backgroundColor: 'rgb(136, 231, 136)', borderRadius: '4px', disabled: false
  }, true);

  //Loading gif disappearance check
  cy.get('img[src="/blinkpage-loading.gif"]', { timeout: 30000 })
    .should('exist');

  //assert loading gif disappears and project name is visible
  cy.get('span._title_cmsuv_22._clickable_cmsuv_29', { timeout: 60000 }).should('be.visible').contains(projectName);

  //Landing page
  cy.contains('div._text_yjll5_17', 'Let’s build something!')
    .should('be.visible')
    .within(() => {
      cy.contains('Add a component to begin.').should('be.visible');
    });

}

export const signUpWithValidData = (name, email, password, confirmPassword) => {
  verifyTextField(
    'input[name="name"]',
    {
      fontSize: '10px',
      textColor: 'rgb(220, 220, 220)',
      backgroundColor: 'rgb(33, 33, 33)',
      borderRadius: '6px',
      value: name,
      shouldType: true,
      shouldClear: true,
      placeholder: 'Name',
    },
    true,
    true
  );

  verifyTextField(
    'input[name="email"]',
    {
      fontSize: '10px',
      textColor: 'rgb(220, 220, 220)',
      backgroundColor: 'rgb(33, 33, 33)',
      borderRadius: '6px',
      value: email,
      shouldType: true,
      shouldClear: true,
      placeholder: 'E-mail',
    },
    true,
    true
  );

  verifyTextField(
    'input[placeholder="Password"]',
    {
      fontSize: '10px',
      textColor: 'rgb(220, 220, 220)',
      backgroundColor: 'rgb(33, 33, 33)',
      borderRadius: '6px',
      value: password,
      shouldType: true,
      shouldClear: true,
      placeholder: 'Password',
    },
    true,
    true
  );

  verifyTextField(
    'input[placeholder="Confirm Password"]',
    {
      fontSize: '10px',
      textColor: 'rgb(220, 220, 220)',
      backgroundColor: 'rgb(33, 33, 33)',
      borderRadius: '6px',
      value: confirmPassword,
      shouldType: true,
      shouldClear: true,
      placeholder: 'Confirm Password',
    },
    true,
    true
  );

  verifyButton(
    'button._buttonAttom_1k5xv_1',
    {
      text: 'Sign up',
      fontSize: '12px',
      textColor: 'rgb(33, 33, 33)',
      backgroundColor: 'rgb(136, 231, 136)',
      borderRadius: '6px',
      disabled: false,
    },
    true
  );
};


export const loginWithValidData = (email, password) => {
  verifyTextField(
    'input[name="email"]',
    {
      fontSize: '10px',
      textColor: 'rgb(220, 220, 220)',
      backgroundColor: 'rgb(33, 33, 33)',
      borderRadius: '6px',
      value: email,
      shouldType: true,
      shouldClear: true,
      placeholder: 'E-mail',
    },
    true,
    true
  );

  verifyTextField(
    'input[placeholder="Password"]',
    {
      fontSize: '10px',
      textColor: 'rgb(220, 220, 220)',
      backgroundColor: 'rgb(33, 33, 33)',
      borderRadius: '6px',
      value: password,
      shouldType: true,
      shouldClear: true,
      placeholder: 'Password',
    },
    true,
    true
  );

  verifyButton(
    'button._buttonAttom_1k5xv_1',
    {
      text: 'Sign in',
      fontSize: '12px',
      textColor: 'rgb(33, 33, 33)',
      backgroundColor: 'rgb(136, 231, 136)',
      borderRadius: '6px',
      disabled: false,
    },
    true
  );
};

