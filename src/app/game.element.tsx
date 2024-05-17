import { injectable, inject } from '@joist/di';
import { Debug } from './debug.element';
import { defaultLang, I18n, useTranslations } from './i18n';
import { ResourceIdentifier } from './engine/resources';
import { BuildingIdentifier } from './engine/buildings';
import { Empire } from '@phlame/engine';
import { raw } from 'hono/html';
import { EmpireService } from './engine/services';
import { planetToJSX } from './planet.element';
// TODO clean up imports

export const gameToJSX = (t: I18n, empire: Empire<ResourceIdentifier, BuildingIdentifier>) => (
  <>
    <empire-ctx id={empire.id} entities={JSON.stringify(empire.toJSON().entities)}>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ph-ctx id={empire.entities[0].id}>
          <ph-planet>{planetToJSX(t, empire.entities[0])}</ph-planet>
        </ph-ctx>
        <div class="">
          <ph-planet />
        </div>
        <div class="">
          <ph-planet />
        </div>
      </div>
    </empire-ctx>
  </>
);

@injectable
export class GameContextElement extends HTMLElement {
  /*#logger = inject(Debug);
  #service = inject(EmpireService);

  connectedCallback() {
    const logger = this.#logger();
    const service = this.#service();

    const t = useTranslations(defaultLang);

    //const html = gameToJSX(t, service.current);
    //this.innerHTML = raw(html);

    logger.log('GameElement connected!', service.current);
    // this is too early, service.current is not ready yet
  }*/
  // TODO! we'll need to rerender when entities change
}
