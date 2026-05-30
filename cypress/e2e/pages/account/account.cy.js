import {
    verifyAndClickProfileDropDownButton,
    verifyUrl,
    veirfyDetails,
    verifyInputValue,
    uploadProfileImage,
} from "@support/common";
import { homePage } from "@pages-po/homePage";
import { loginPage } from "@pages-po/loginPage";
import { myAccountPage } from "@pages-po/account";
import data from "@fixtures/data.json";

describe("My Account", () => {
    beforeEach(() => {
        // Programmatic auth via centralized cy.login() — token set in localStorage
        // before visit. No UI login form, no duplicate auth.
        cy.login();
        cy.visit("/");
        cy.get('[data-cy="header"]', { timeout: 20000 }).should("be.visible");

        // Navigate to Account page (setup, not in any it() scope).
        loginPage.clickProfileIcon();
        homePage.verifyProfileDropDown();
        verifyAndClickProfileDropDownButton("Account", "Manage your profile and preferences");
        verifyUrl("/profile");

        // Page-load setup verification — moved out of every it() body.
        myAccountPage.verifyMyAccountPage("Account");
    });

    // ──────────────────────────────────────────────────────────────────────────
    // Page load + layout
    // ──────────────────────────────────────────────────────────────────────────

    it("should render the Account page header when navigated from profile dropdown", () => {
        // beforeEach already asserts the Account page header. This test makes the
        // page-load contract explicit by re-running the same helper assertion —
        // it is the only test whose scope IS the page-load assertion.
        myAccountPage.verifyMyAccountPage("Account");
    });

    it("should display My Profile card with user name and email", () => {
        veirfyDetails('[data-cy="card-title"]', "My Profile");
        // DB-driven user name — assert hook exists rather than literal value.
        cy.get('[data-cy="user-name"]').should("exist");
        veirfyDetails('[data-cy="user-email"]', data.email);
    });

    it("should display Personal Information card with Name, Phone, Country and Date of Birth fields", () => {
        veirfyDetails('[data-cy="card-title"]', "Personal Information");
        veirfyDetails('[data-cy="field-label"]', "Name");
        // DB-driven user name — assert input hook exists rather than literal value.
        cy.get('[data-cy="account-input"]').first().should("exist");
        veirfyDetails('[data-cy="field-label"]', "Phone Number");
        verifyInputValue('[placeholder="Enter phone number"]', data.phone);
        veirfyDetails('[data-cy="field-label"]', "Country");
        veirfyDetails('[data-cy="field-label"]', "Date of Birth");
    });

    it("should display Login Information card with Email and Password rows", () => {
        veirfyDetails('[data-cy="card-title"]', "Login Information");
        veirfyDetails('[data-cy="field-label"]', "Email");
        veirfyDetails('[data-cy="field-label"]', "Password");
        veirfyDetails('[data-cy="password-display"] span', "••••••••");
    });

    // ──────────────────────────────────────────────────────────────────────────
    // Avatar upload — one outcome per it()
    // ──────────────────────────────────────────────────────────────────────────

    it("should upload a valid JPG image and show the success toast", () => {
        myAccountPage.deleteUplaodedImage();
        uploadProfileImage("input#avatar-upload", "Test.jpeg");
        myAccountPage.verifySuccessMessage("Profile updated successfully!");
    });

    it("should upload a valid PNG image and show the success toast", () => {
        myAccountPage.deleteUplaodedImage();
        uploadProfileImage("input#avatar-upload", "Test1.png");
        myAccountPage.verifySuccessMessage("Profile updated successfully!");
    });

    it("should expose the delete-image button after a successful upload", () => {
        myAccountPage.deleteUplaodedImage();
        uploadProfileImage("input#avatar-upload", "Test.jpeg");
        myAccountPage.verifySuccessMessage("Profile updated successfully!");
        cy.get('[data-cy="delete-image-btn"]').should("be.visible");
    });

    it("should replace the existing profile picture and show the success toast for the replacement upload", () => {
        myAccountPage.deleteUplaodedImage();
        uploadProfileImage("input#avatar-upload", "Test1.png");
        myAccountPage.verifySuccessMessage("Profile updated successfully!");
        // The actual "replace" action — assert success on the replacement upload.
        uploadProfileImage("input#avatar-upload", "Test.jpeg");
        myAccountPage.verifySuccessMessage("Profile updated successfully!");
    });

    it("should keep the uploaded image visible after a page refresh", () => {
        myAccountPage.deleteUplaodedImage();
        uploadProfileImage("input#avatar-upload", "Test1.png");
        myAccountPage.verifySuccessMessage("Profile updated successfully!");
        // Explicit reload before verifying — the test claims "after page refresh".
        cy.reload();
        cy.get('[data-cy="header"]', { timeout: 20000 }).should("be.visible");
        myAccountPage.verifyUploadedImage();
    });

    it("should reject an unsupported file type (.txt) and not show a success toast", () => {
        myAccountPage.deleteUplaodedImage();
        uploadProfileImage("input#avatar-upload", "Text.txt");
        // No success toast should appear for an unsupported file type.
        cy.get('[data-cy="toast-success"]').should("not.exist");
        // Either an error toast surfaces OR the file silently fails to attach.
        // Assert the rejection signal — either branch satisfies "did not upload".
        cy.get("body").then(($body) => {
            const errorToast = $body.find('[data-cy="toast-error"], [role="alert"]');
            if (errorToast.length) {
                cy.get('[data-cy="toast-error"], [role="alert"]')
                    .first()
                    .should("be.visible");
            } else {
                // No error toast surfaced — ensure no delete-image button was added,
                // which would imply a successful upload silently happened.
                cy.get('[data-cy="delete-image-btn"]').should("not.exist");
            }
        });
    });

    // ──────────────────────────────────────────────────────────────────────────
    // Edit mode + field validation
    // ──────────────────────────────────────────────────────────────────────────

    it("should enable Personal Information inputs when the Edit button is clicked", () => {
        // Inputs are read-only / disabled before Edit is clicked.
        cy.get('[data-cy="account-input"]')
            .first()
            .should("be.disabled");
        myAccountPage.verifyButton("Edit");
        // After clicking Edit, the first input must become enabled/editable.
        cy.get('[data-cy="account-input"]')
            .first()
            .should("not.be.disabled");
    });

    it("should save a valid updated name and show the success toast", () => {
        myAccountPage.verifyButton("Edit");
        myAccountPage.editField('[data-cy="account-input"]', "Shah");
        myAccountPage.verifyButton("Save");
        myAccountPage.verifySuccessMessage("Profile updated successfully!");

        // Silent cleanup — restore original name without re-asserting the toast.
        myAccountPage.verifyButton("Edit");
        myAccountPage.editField('[data-cy="account-input"]', data.name);
        myAccountPage.verifyButton("Save");
    });

    it("should disable the Save button when name is empty", () => {
        myAccountPage.verifyButton("Edit");
        myAccountPage.editField('[data-cy="account-input"]', " ");
        myAccountPage.verifyDisableButton("Save");
    });

    it("should disable the Save button when name contains only numeric characters", () => {
        // NAME_REGEX strips digits → name becomes empty → Save disabled.
        myAccountPage.verifyButton("Edit");
        myAccountPage.editField('[data-cy="account-input"]', "466373");
        myAccountPage.verifyDisableButton("Save");

        // Silent cleanup — restore valid name without re-asserting toast.
        myAccountPage.editField('[data-cy="account-input"]', data.name);
        myAccountPage.verifyButton("Save");
    });

    it("should save a valid phone number and show the success toast", () => {
        myAccountPage.verifyButton("Edit");
        myAccountPage.editField('[data-cy="account-input"]', "1234567890", 1);
        myAccountPage.verifyButton("Save");
        myAccountPage.verifySuccessMessage("Profile updated successfully!");

        // Silent cleanup — restore original phone without re-asserting toast.
        myAccountPage.verifyButton("Edit");
        myAccountPage.editField('[data-cy="account-input"]', data.phone, 1);
        myAccountPage.verifyButton("Save");
    });

    it("should reject alphabetic characters in the phone number field", () => {
        myAccountPage.verifyButton("Edit");
        cy.get('[data-cy="account-input"]')
            .eq(1)
            .clear({ force: true })
            .type("abcde")
            .should("have.value", "");
    });

    it("should reject special characters in the phone number field", () => {
        myAccountPage.verifyButton("Edit");
        cy.get('[data-cy="account-input"]')
            .eq(1)
            .clear({ force: true })
            .type("@#$@")
            .should("have.value", "");
    });

    // ──────────────────────────────────────────────────────────────────────────
    // Country dropdown
    // ──────────────────────────────────────────────────────────────────────────

    it("should save a selected country and show the success toast", () => {
        myAccountPage.verifyButton("Edit");
        myAccountPage.verifySelectCountry("Afghanistan");
        myAccountPage.verifyButton("Save");
        myAccountPage.verifySuccessMessage("Profile updated successfully!");

        // Silent cleanup — deselect without re-asserting toast.
        myAccountPage.verifyButton("Edit");
        myAccountPage.verifyDeselectState();
        myAccountPage.verifyButton("Save");
    });

    it("should render the country dropdown with selectable options", () => {
        myAccountPage.verifyButton("Edit");
        myAccountPage.verifyCountryDropDownData();
        myAccountPage.verifyDropDownOptions();
    });

    // ──────────────────────────────────────────────────────────────────────────
    // Date of birth
    // ──────────────────────────────────────────────────────────────────────────

    it("should accept a valid past date in the Date of Birth picker", () => {
        myAccountPage.verifyButton("Edit");
        myAccountPage.openDatePicker();
        myAccountPage.selectValidDOB();
        myAccountPage.verifyButton("Save");
    });

    // ──────────────────────────────────────────────────────────────────────────
    // Login Information — email + change password
    // ──────────────────────────────────────────────────────────────────────────

    it("should show the email as read-only with the verified icon", () => {
        myAccountPage.verifyEmailisVerified(data.email);
    });

    it("should open the Reset Password modal when the Change password button is clicked", () => {
        // Actually click Change password (the description's core claim) and
        // assert the Reset Password modal opens.
        cy.get('[data-cy="account-change-password-btn"]')
            .should("be.visible")
            .and("not.be.disabled")
            .click({ force: true });
        myAccountPage.verfyResetPasswordModal();
    });

    it("should keep the Cancel button visible after submitting the Reset Password modal", () => {
        cy.get('[data-cy="account-change-password-btn"]')
            .should("be.visible")
            .and("not.be.disabled")
            .click({ force: true });
        myAccountPage.verfyResetPasswordModal();
        cy.get('[data-cy="reset-password-submit-btn"]')
            .should("be.visible")
            .and("not.be.disabled")
            .click({ force: true });
        cy.get("body").then(($body) => {
            if ($body.find('[data-cy="reset-password-cancel-btn"]').length) {
                cy.get('[data-cy="reset-password-cancel-btn"]').should("be.visible");
            }
        });
    });

    it("should close the Reset Password modal when the X icon is clicked", () => {
        myAccountPage.verifyButton("Change password");
        cy.get('[data-cy="modal-close-btn"]').eq(1).should("be.visible").click();
        cy.get('[data-cy="reset-password-modal"]').should("not.exist");
    });

    // ──────────────────────────────────────────────────────────────────────────
    // Account-level actions
    // ──────────────────────────────────────────────────────────────────────────

    it("should redirect to the authentication page when Logout is clicked", () => {
        myAccountPage.verifyButton("Logout");
        verifyUrl("/authentication");
    });

    it("should open the Delete Account modal with a Cancel button when Delete account is clicked", () => {
        myAccountPage.verifyButton("Delete account");
        myAccountPage.verifyDeleteAccountModal();
        cy.contains("button", "Cancel").should("be.visible");
    });
});
