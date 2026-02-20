import { verifyUrl } from "../common"

class ContactUsPage {
    contactusbutton(){
        cy.get('[class*="_route"]').contains('Contact Us').should('be.visible').click()
    }
    subjectDropDown(){
        cy.get('[class*="_searchInput"]').click()
        cy.get('div[class*="select-portal-dropdown"]').should('be.visible')
    }
    submitButton(){
        cy.contains('button', 'Submit').should('be.visible').click()

    }
    inputMessage(message){
        cy.get('[class*="_textareaContainer"]')
        .find('textarea')
        .dblclick({ force: true })
        .clear({ force: true })
        .type(message)
    }
    selectDropdownOption = (optionText) => {
    cy.get('div[class*="select-portal-dropdown"]')
    .contains('[role="option"]', optionText)  // find child with role=option and matching text
    .scrollIntoView()                        // optional: scroll if dropdown is scrollable
    .click();
    }

    verifydocumentationButton = () => {
       cy.contains('a', 'documentation')
       .should('have.attr', 'href')
        .then((href) => {
            cy.visit(href)
            cy.origin('https://support.blinkpage.app', () => {
                cy.url().should('include', '/documentation')
              }
            )
        }
    )
    }
    verifyExternalLink = (linkText, expectedPath) => {
        cy.contains('a', linkText)
        .invoke('removeAttr', 'target')
        .click()
        cy.origin(
        'https://support.blinkpage.app',
        { args: { expectedPath } },
        ({ expectedPath }) => {
        cy.location('pathname').should('include', expectedPath)
        }
        )
        // 👇 Instead of cy.go('back')
        cy.visit('https://app.blinkpage.app/contact') // or your page URL
    }

    verifyXssPrevention(){
    // Spy on window.alert
    cy.window().then((win) => {
    cy.stub(win, 'alert').as('alertStub')
    })

    // Type malicious script
    cy.get('textarea[name="message"]')
    .clear()
    .type('<script>alert(1)</script>')

    // Trigger blur or submit (if validation happens there)
    cy.get('body').click()

    // Verify alert was NOT called
    cy.get('@alertStub').should('not.have.been.called')
    }

}


export const contactUsPage = new ContactUsPage();
