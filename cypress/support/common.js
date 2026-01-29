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