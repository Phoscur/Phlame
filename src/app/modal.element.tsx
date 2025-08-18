import { inject, injectable } from '@joist/di';
import { raw } from 'hono/html';
import { TranslationProvider } from './app.element';

// with help of ChatGPT5

@injectable()
export class ModalElement extends HTMLElement {
  public static observedAttributes = ['open'];
  #i18n = inject(TranslationProvider);

  get modal(): HTMLElement {
    return this.shadowRoot!.querySelector('.modal')!;
  }
  get backdrop(): HTMLElement {
    return this.shadowRoot!.querySelector('.backdrop')!;
  }

  connectedCallback() {
    const shadow = this.render();

    shadow
      .querySelector('slot[name=button]')!
      .addEventListener('click', (e) => this.open(e as MouseEvent));

    this.backdrop.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) this._fire('cancel', { reason: 'backdrop' });
    });

    shadow.querySelector('.submit')!.addEventListener('click', () => {
      this._fire('submit', { confirmed: true });
    });

    shadow.querySelector('.cancel')!.addEventListener('click', () => {
      this._fire('cancel', { reason: 'button' });
    });

    this.updateVisibility();
  }
  attributeChangedCallback() {
    this.updateVisibility();
  }

  render() {
    const t = this.#i18n().translate;

    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <slot name="button">
        <div>ConfirmModal Button</div>
      </slot>
      <div class="backdrop hidden fixed top-0 left-0 w-full h-full bg-black/50 flex justify-center items-center">
        <div class="modal bg-slate-900 text-grey-300 p-5 rounded shadow-md w-auto max-w-sm">
          <slot name="header">
            <h3>Modal Heading</h3>
          </slot>
          <slot>Modal Body</slot>
          <div class="actions flex justify-end mt-5">
            <button class="submit ml-2">${t('app.confirm')}</button>
            <button class="cancel ml-2">${t('app.cancel')}</button>
          </div>
        </div>
      </div>
    `;

    return shadow;
  }

  _fire(type: 'submit' | 'cancel', detail: unknown) {
    this.dispatchEvent(new CustomEvent(type, { bubbles: true, composed: true, detail }));
    this.close();
  }

  updateVisibility() {
    this.backdrop.classList.toggle('hidden', !this.hasAttribute('open'));
  }

  open(event?: MouseEvent) {
    this.setAttribute('open', '');

    if (!event) return;
    const backdrop = this.backdrop;
    const modal = this.modal;

    backdrop.classList.remove('justify-center', 'items-center');
    modal.style.position = 'absolute';

    // Position modal below the trigger element
    const rect = this.getBoundingClientRect();
    modal.style.top = `${rect.bottom + window.scrollY + 5}px`;

    // Center the modal horizontally relative to the trigger
    modal.style.left = `${rect.left + rect.width / 2 + window.scrollX}px`;
    modal.style.transform = 'translateX(-50%)';
  }
  close() {
    this.removeAttribute('open');

    // Reset styles for next open
    const backdrop = this.backdrop;
    const modal = this.modal;
    backdrop.classList.add('justify-center', 'items-center');
    modal.style.position = '';
    modal.style.top = '';
    modal.style.left = '';
    modal.style.transform = '';
  }
}
