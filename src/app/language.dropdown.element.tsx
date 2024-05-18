import { I18n, Language, languages } from './i18n';

export const languageSelectToJSX = (t: I18n, lang: Language) => (
  <>
    <button
      id="languageSelect"
      data-dropdown-toggle="dropdown"
      class="w-30 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-600 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center"
      type="button"
    >
      {languages[lang]}{' '}
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
      <ul class="py-2 text-sm" aria-labelledby="languageSelect">
        {Object.keys(languages)
          .filter((l) => l !== lang)
          .map((l) => (
            <>
              <li class="flex">
                <button class="w-full py-2 hover:bg-gray-600" data-value={l}>
                  {languages[l as Language]}
                </button>
              </li>
            </>
          ))}
      </ul>
    </div>
  </>
);
// dropdown code derived from https://flowbite.com/docs/components/dropdowns/

export class LanguageSelectDropdownElement extends HTMLElement {
  connectedCallback() {
    const button = this.firstElementChild as HTMLButtonElement;
    const dropdown = this.lastElementChild as HTMLDivElement;
    button.onclick = () =>
      dropdown.classList.contains('hidden')
        ? dropdown.classList.remove('hidden')
        : dropdown.classList.add('hidden');
    const selects = dropdown.getElementsByTagName('button');
    for (const select of selects) {
      select.onclick = () => {
        const parent = this.appRootParent;
        const attr = parent.attributes.getNamedItem('lang');
        const val = select.attributes.getNamedItem('data-value')?.value;
        if (!attr || !val) return;
        attr.value = val;
        // save to cookie
        document.cookie = 'lang=' + attr.value;
        // save to app-root triggering a rerender
        parent.attributes.setNamedItem(attr);
      };
    }
    // console.log('LanguageSelect connected!', this, parent);
  }

  get appRootParent(): HTMLElement {
    let parent = this.parentNode?.parentElement;
    while ((parent = parent?.parentElement)) {
      if ('APP-ROOT' === parent.tagName) {
        return parent;
      }
    }
    // return this.parentNode?.parentElement?.parentElement?.parentElement!;
    throw new Error('APP-ROOT not found!');
  }
}
