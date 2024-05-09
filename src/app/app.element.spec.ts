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

  it('should rerender switching languages', () => {
    app.attributeChangedCallback('lang', undefined as unknown as string, 'en');
    app.attributeChangedCallback('lang', 'en', 'de');

    expect(app.querySelector('h1')!.innerHTML).toContain('Übersicht');
  });
});
