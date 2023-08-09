declare namespace Cypress {
  interface Chainable<Subject = any> {
    /** Starts the game and waits for it to load */
    start(): void;
  }
}

function start() {
  cy.contains('Start').click();
  cy.get('app-hud');
}

Cypress.Commands.add('start', start);
