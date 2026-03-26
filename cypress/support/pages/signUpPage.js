class SignUpPage {
    singUpButton(){
        cy.get('[data-cy="signup-link"]').should('be.visible').contains('Sign up').click();
    }
}
export const signUpPage = new SignUpPage();