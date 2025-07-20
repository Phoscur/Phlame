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
      {/*<div class="hidden md:grid-cols-2 md:grid-cols-3">force md:grid-cols-x to be available</div>*/}
      <div
        class={`grid grid-cols-1 md:grid-cols-${
          empire.entities.length < 4 ? empire.entities.length : 3
        } gap-4`}
      >
        {empire.entities.map((p) => (
          <>
            <ph-ctx id={p.id}>
              <ph-planet>{planetToJSX(t, p)}</ph-planet>
            </ph-ctx>
          </>
        ))}
      </div>
    </empire-ctx>
  </>
);

@injectable()
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
  // TODO! we'll need to rerender when entities change - one entity or more entities at once?
  // - well, only if the HTMX replace is not enough (just rehydrate...)
}
