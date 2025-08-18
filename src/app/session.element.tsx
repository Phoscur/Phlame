import { render } from 'hono/jsx/dom';
import { injectable, inject } from '@joist/di';
import { I18n } from './i18n';
import { TranslationProvider } from './app.element';

function logout() {
  ['sid', 'empire'].forEach((name) => {
    //document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT';
    console.log('cleared cookie:', name);
  });
}

export function SessionDropdown({ t, logout }: { t: I18n; logout: () => void }) {
  return (
    <>
      <button
        id="sessionDropdown"
        data-dropdown-toggle="dropdown"
        class="w-30 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-600 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center"
        type="button"
      >
        {t('app.session')}{' '}
        <svg
          class="w-2.5 h-2.5 ms-3"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 10 6"
        >
          <path
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="m1 1 4 4 4-4"
          />
        </svg>
      </button>

      <div id="dropdown" class="hidden z-10 rounded-lg shadow-gray-100 bg-gray-700">
        <ul class="py-2 text-sm" aria-labelledby="sessionDropdown">
          <li class="flex">
            <app-modal name="logout" onSubmit={logout} class="w-full py-2 hover:bg-gray-600">
              <button slot="button" data-value="logout" class="w-full">
                {t('app.logout')}
              </button>
              <h3 slot="header">{t('app.logout')}</h3>
              {t('app.logout')}
            </app-modal>
          </li>
        </ul>
      </div>
    </>
  );
}

@injectable()
export class SessionDropdownElement extends HTMLElement {
  #i18n = inject(TranslationProvider);
  connectedCallback() {
    render(
      SessionDropdown({
        t: this.#i18n().translate,
        logout: this.logout.bind(this),
      }),
      this,
    );
    const button = this.firstElementChild as HTMLButtonElement;
    const dropdown = this.lastElementChild as HTMLDivElement;
    button.onclick = () =>
      dropdown.classList.contains('hidden')
        ? dropdown.classList.remove('hidden')
        : dropdown.classList.add('hidden');
    const selects = dropdown.getElementsByTagName('button');
    console.log('SessionDropdown connected!', this, selects);
  }

  logout() {
    console.log('logout!');
    logout();
  }
}
