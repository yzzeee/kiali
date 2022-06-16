// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

declare namespace Cypress {
  interface Chainable<Subject> {
    /**
     * Custom command to select DOM element by the 'data-test' attribute.
     * @example cy.getBySel('greeting')
     */
    getBySel(selector: string, ...args: any): Chainable<Subject>;

    login(providerName?: string, username?: string, password?: string, auth_strategy?: string): Chainable<Subject>;

    logout(): Chainable<Subject>;
  }
}

let haveCookie = Cypress.env('cookie');

Cypress.Commands.add('login', (provider: string, username: string, password: string, auth_strategy: string) => {
  cy.log('auth cookie is:', haveCookie);

  cy.window().then((win: any) => {
    if (auth_strategy !== 'openshift') {
      cy.log('Skipping login, Kiali is running with auth disabled');
      return;
    }

    if (haveCookie === false) {
      cy.intercept('api/authenticate').as('authorized'); //request setting kiali cookie
      // Cypress.Cookies.debug(true) // now Cypress will log when it alters cookies
      // cy.getCookies()

      cy.log(
        `provider: ${provider},
					username: ${username},
					auth_strategy: ${auth_strategy}`
      );
      // Disabling refresh as this can prevent navigation to another page
      // until the overview page has fully loaded which can be greatly delayed
      // if the refresh interval is lower and the api requests are slow.
      cy.visit('/console/overview?duration=60&refresh=0');

      if (auth_strategy === 'openshift') {
        cy.get('.pf-c-form').contains(auth_strategy, { matchCase: false }).click();
        cy.get('.pf-c-button').contains(provider, { matchCase: false }).click();
        cy.get('#inputUsername').clear().type(username);
        cy.get('#inputPassword').clear().type(password);
        cy.get('button[type="submit"]').click();
        cy.wait('@authorized').its('response.statusCode').should('eq', 200);
        cy.getCookie('kiali-token-aes', { timeout: 15000 })
          .should('exist')
          .then(() => {
            haveCookie = true;
          });
        // Wait for the redirect to the overview page after a successful login.
        // Otherwise the redirect can mess with page loading on subsequent tests.
        cy.contains('loading', { matchCase: false }).should('not.exist');
        cy.url().should('include', '/overview');
        // Wait for the overview page to load some elements to be sure that things
        // have settled. Otherwise some part of the overview page will change the
        // url back to the overview page.
        cy.getBySel('alpha-EXPAND');
      }
    } else {
      cy.log('got an auth cookie, skipping login');
    }
  });
});

Cypress.Commands.add('getBySel', (selector: string, ...args) => cy.get(`[data-test="${selector}"]`, ...args));
