describe('engine-components: EngineComponents component', () => {
  beforeEach(() => cy.visit('/iframe.html?id=enginecomponents--primary&knob-resources=engine-components'));

  it('should render the component', () => {
    cy.get('h1').should('contain', 'here be engine-components!');
  });
});
