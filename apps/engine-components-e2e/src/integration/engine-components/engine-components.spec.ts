describe('engine-components: EngineComponents component', () => {

  beforeEach(() => cy.visit('/iframe.html?id=enginecomponents--primary&knob-resources=engine-components&theme-ind=0&theme-sidebar=true&theme-full=true'));

  it('should render the component', () => {
    cy.get('h1').should('contain', 'here be engine-components!');
  });
});
