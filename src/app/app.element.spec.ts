import { AppElement } from './app.element';

customElements.define('app-root', AppElement);
describe('AppElement', () => {
  let app: AppElement;

  beforeEach(() => {
    app = new AppElement();
  });

  it('should create successfully', () => {
    expect(app).toBeTruthy();
  });

  it('should have a greeting', () => {
    app.connectedCallback();

    expect(app.querySelector('h1')!.innerHTML).toContain('Home');
  });
});
