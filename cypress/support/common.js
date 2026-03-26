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
  cy.contains('button', 'Create New Website').should('be.visible').click();
}

export function webCreationFlow() {
  //Main Heading
  cy.get('[data-cy="page-title"]', { timeout: 3000 }).should('be.visible').contains('Project Setup');
  //Second Heading
  cy.contains('How would you like to design your website?', { timeout: 3000 }).should('be.visible');

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

  cy.get('[data-cy="setup-card"]').each(($card, index) => {
    cy.wrap($card)
      .should('be.visible')
      .within(() => {
        cy.contains(expectedCards[index].title).should('be.visible');
        cy.contains(expectedCards[index].description).should('be.visible');
      });
  });

  cy.contains('[data-cy="setup-card"]', 'Create Your Own Design')
    .scrollIntoView()
    .click('top', { force: true });

  //Create new Project Modal
  createNewProjectModal('AutomationTestProject');

}

export function createNewProjectModal(projectName) {
  cy.contains('Create Blank Project').should('be.visible');
  cy.contains('The data from these fields will be used to auto generate the content for your site.').should('be.visible');
  cy.get('input[placeholder="Project Name"]').should('be.visible').type(projectName);
  cy.contains('button', 'Create').should('be.visible').click();

  //Loading gif disappearance check
  cy.get('img[src="/blinkpage-loading.gif"]', { timeout: 30000 })
    .should('exist');

  //assert loading gif disappears and project name is visible
  cy.get('[data-cy="project-title"]', { timeout: 60000 }).should('be.visible').contains(projectName);








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
    '[data-cy="signup-btn"]',
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
    '[data-cy="signin-btn"]',
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

export const forgotPasswordModal = (email) => {
  cy.contains('Password Recovery', { timeout: 5000 }).should('be.visible');

  cy.contains('Please enter your email address to recover your password.').should('be.visible');
  
  cy.get('input[placeholder="Email"]').should('be.visible').type(email);

  cy.contains('button', 'Recover').should('be.visible').click();
};
export const verifyUrl = (url) => {
  cy.url().should('include', url)


}
export const verifyErrorMessage = (loc, message) =>{
  cy.get(loc).contains(message).should('be.visible')
}
export const fieldInput = (loc, placeholder, text) => {
  cy.log(placeholder)
  cy.get(loc)
  .should('be.visible')
  .and('have.attr', 'placeholder', placeholder)
  .type(text)

}
export const verifyAndClickProfileDropDownButton = (title,text) => {
        cy.get('[data-cy="profile-dropdown"]').within(() => {
            cy.get('[data-cy="dropdown-item-label"]').each(($label) => {
                const labelText = $label.text().trim();
                if (labelText === title) {
                    cy.wrap($label).closest('button').click();
                }
            });
        });
}
export const veirfyDetails = (loc,text) => {
  cy.get(loc).contains(text).should('be.visible')
}
export const verifyInputValue = (locator, expectedValue) => {
  cy.get(locator)
    .should('exist')
    .invoke('val')
    .should('eq', expectedValue);
};
export const uploadProfileImage = (locator, fileName) => {
  cy.get(locator)
    .should('exist')
    .selectFile(`cypress/fixtures/${fileName}`, { force: true });
};
export const verifySuccessToast = (message) => {
  cy.get('[role="alert"].Toastify__toast--success', { timeout: 10000 })
    .should('be.visible')
    .and('contain.text', message);
};