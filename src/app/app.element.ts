import './app.element.css';
import { BubblesIcon, CrystallineIcon, MetallicIcon } from './icons.svg';

export class AppElement extends HTMLElement {
  public static observedAttributes = [];

  connectedCallback() {
    const title = 'app';
    this.innerHTML = `
    <div class="wrapper">
      <div class="container">
        <div id="welcome" class="h-32 mb-8 mx-auto grid grid-flow-col gap-8 auto-cols-max">
          ${MetallicIcon()}
          ${CrystallineIcon()}
          ${BubblesIcon()}
          <h1>
            <span> Hello there, </span>
            Welcome ${title} 👋
          </h1>
          
        </div>
      </div>
    </div>
      `;
  }
}
customElements.define('app-root', AppElement);
