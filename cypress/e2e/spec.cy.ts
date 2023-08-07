describe('three-airboat-sim', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('Visits the initial page', () => {
    cy.contains('Three Airboat Sim');
  });

  it('Starts the game using button', () => {
    cy.contains('Start').click();
    cy.get('app-hud');
  });

  it('Starts the game using escape key', () => {
    cy.contains('Start');

    cy.get('body').type('{esc}');
    cy.get('app-hud');
  });

  it('Pauses the game using button', () => {
    cy.contains('Start').click();
    cy.get('app-hud');

    cy.contains('button', 'X').click();
    cy.get('app-pause-screen');
  });

  it('Pauses the game using escape key', () => {
    cy.contains('Start').click();
    cy.get('app-hud');

    cy.get('body').type('{esc}');
    cy.get('app-pause-screen');
  });

  it('Changes throttle on keypress', () => {
    cy.contains('Start').click();
    cy.get('app-hud');

    cy.get('body').trigger('keydown', { code: 'KeyS' });
    cy.get('[test-id=throttle-neg]').should('have.attr', 'height', '0.5');
  });

  it('Changes yaw on keypress', () => {
    cy.contains('Start').click();
    cy.get('app-hud');

    cy.get('body').trigger('keydown', { code: 'KeyD' });
    cy.get('.yaw > rect').should('have.attr', 'x', '1');
  });

  it('Changes throttle on touch', () => {
    cy.contains('Start').click();
    cy.get('app-hud');

    cy.get('.throttle').trigger('touchstart', {
      changedTouches: [
        {
          pageY: 0,
          pageX: 0,
        },
      ],
    });

    cy.get('[test-id=throttle-pos]').should('have.attr', 'height', '1');
  });

  it('Changes yaw on touch', () => {
    cy.contains('Start').click();
    cy.get('app-hud');

    cy.get('.yaw').trigger('touchstart', {
      changedTouches: [
        {
          pageY: 0,
          pageX: 0,
        },
      ],
    });

    cy.get('.yaw > rect').should('have.attr', 'x', '0');
  });

  it('Moves airboat', () => {
    cy.contains('Start').click();
    cy.get('app-hud');

    cy.get('body').trigger('keydown', { code: 'KeyW' });
    cy.get('.speed').should((e) =>
      expect(parseFloat(e.text())).to.be.greaterThan(0.2),
    );
  });
});
