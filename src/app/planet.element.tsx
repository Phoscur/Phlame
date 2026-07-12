import { I18n } from './i18n';
import {
  BubblesIcon,
  CrystallineIcon,
  EnergyIcon,
  MetallicIcon,
  MineIcon,
  PowerPlantFusionIcon,
  PowerPlantSolarIcon,
  SiloIcon,
} from './icons.svg';
import { resourcesToJSX } from './resources.element';
import { PhlameEntity } from './engine';
import { ActionTypes } from '@phlame/engine';

// constrain the fixed 90x90 SVGs to row height (class beats the width/height attributes)
const iconSize = 'h-10 w-10 shrink-0';

function getIconFor(type: string) {
  if (type === 'mine-metallic')
    return (
      <>
        <MetallicIcon className={iconSize} />
        <MineIcon className={iconSize} />
      </>
    );
  if (type === 'mine-crystalline')
    return (
      <>
        <CrystallineIcon className={`${iconSize} text-crystalline-dark`} />
        <MineIcon className={iconSize} />
      </>
    );
  if (type === 'synthesizer-liquid')
    return (
      <>
        <BubblesIcon className={iconSize} />
        <MineIcon className={iconSize} />
      </>
    );
  if (type === 'plant-solar')
    return (
      <>
        <EnergyIcon className={`${iconSize} text-energy-dark`} />
        <PowerPlantSolarIcon className={`${iconSize} text-energy-primary`} />
      </>
    );
  if (type === 'plant-fusion')
    return (
      <>
        <EnergyIcon className={`${iconSize} text-energy-dark`} />
        <PowerPlantFusionIcon className={`${iconSize} text-energy-primary`} />
      </>
    );
  if (type === 'silo-metallic' || type === 'silo-crystalline' || type === 'tank-liquid')
    return <SiloIcon className={iconSize} />;
  return <MineIcon className={iconSize} />;
}

// slightly translucent backgrounds let the planet image shine through the rows
function getColorClassFor(type: string) {
  if (type.includes('metallic')) return 'bg-metallic-dark/90 text-metallic';
  if (type.includes('crystalline')) return 'bg-crystalline-dark/90 text-crystalline-light';
  if (type.includes('liquid')) return 'bg-liquid-dark/90 text-liquid';
  if (type.includes('plant')) return 'bg-energy-dark/90 text-energy-secondary';
  return 'bg-gray-800/90 text-gray-400';
}

export const planetToJSX = (t: I18n, planet: PhlameEntity) => {
  const phelopments = planet.toJSON().phelopments;
  // find queued update phelopment actions
  const queue = planet.upcoming.filter((a) => a.type === ActionTypes.UPDATE);

  return (
    <>
      <div class="bg-gray-800 p-4 rounded-lg bg-cover bg-[url('/dall-e-planet.png')]">
        <div class="flex justify-between">
          <div class="min-w-0">
            <h2 class="text-2xl font-bold leading-7 text-gray-300 sm:truncate sm:text-3xl sm:tracking-tight">
              Planet
            </h2>
            <div>
              <div class="mt-2 flex items-center text-sm text-gray-500">
                <svg
                  class="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fill-rule="evenodd"
                    d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
                    clip-rule="evenodd"
                  />
                </svg>
                Galaxy
              </div>
            </div>
          </div>
          <div class="mt-0">
            <ph-resources>
              {resourcesToJSX({ t, productionTable: planet.productionTable })}
            </ph-resources>
          </div>
        </div>
        <div class="h-48" aria-hidden="true"></div>
        <ul class="buildingQueue space-y-2">
          {queue.map((a) => {
            const payload = a.consequence.payload as { phelopmentID: string; grade: 'up' | 'down' };
            const currentLevel =
              phelopments.find((p) => p.type === payload.phelopmentID)?.level ?? 0;
            const level = payload.grade === 'up' ? currentLevel + 1 : currentLevel - 1;
            return (
              <li
                class={`${getColorClassFor(payload.phelopmentID)} flex items-center gap-3 rounded-lg px-3 py-2`}
              >
                {getIconFor(payload.phelopmentID)}
                <span class="min-w-0 flex-1 truncate font-medium">
                  {t('building.level')} {level} (at tick {a.consequence.at})
                </span>
                <button
                  data-action-id={a.consequence.payload.id}
                  data-planet={planet.id}
                  class="phlame-cancel-btn inline-flex shrink-0 items-center whitespace-nowrap rounded-md px-3 py-2
                    text-sm font-semibold shadow-sm ring-1 ring-inset ring-gray-400 hover:bg-gray-500"
                >
                  {t('app.cancel')}
                </button>
              </li>
            );
          })}
        </ul>
        <ul class="buildingList mt-2 space-y-2">
          {phelopments.map((p) => (
            <li class={`${getColorClassFor(p.type)} flex items-center gap-3 rounded-lg px-3 py-2`}>
              {getIconFor(p.type)}
              <span class="min-w-0 flex-1 truncate font-medium">
                {p.type} — {t('building.level')} {p.level}
              </span>
              <span class="flex shrink-0 gap-2">
                <button
                  data-type={p.type}
                  data-direction="up"
                  data-planet={planet.id}
                  class="phlame-grade-btn inline-flex items-center whitespace-nowrap rounded-md px-3 py-2
                    text-sm font-semibold shadow-sm ring-1 ring-inset ring-gray-400 hover:bg-gray-500"
                >
                  {p.level === 0 ? t('building.action.build') : t('building.action.upgrade')}
                </button>
                {p.level > 0 && (
                  <button
                    data-type={p.type}
                    data-direction="down"
                    data-planet={planet.id}
                    class="phlame-grade-btn inline-flex items-center whitespace-nowrap rounded-md px-3 py-2
                      text-sm font-semibold shadow-sm ring-1 ring-inset ring-gray-400 hover:bg-gray-500"
                  >
                    {p.level === 1 ? t('building.action.destroy') : t('building.action.downgrade')}
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export class PlanetElement extends HTMLElement {
  public static observedAttributes = [];

  connectedCallback() {
    this.addEventListener('click', (e: Event) => {
      const target = e.target as HTMLElement;
      const gradeBtn = target.closest('.phlame-grade-btn') as HTMLElement;
      if (gradeBtn) {
        const type = gradeBtn.dataset.type;
        const direction = gradeBtn.dataset.direction;
        const planetId = gradeBtn.dataset.planet;
        if (type && direction && planetId) {
          this.dispatchEvent(
            new CustomEvent('phlame:grade', {
              bubbles: true,
              composed: true,
              detail: { type, direction, planetId },
            }),
          );
        }
        return;
      }
      const cancelBtn = target.closest('.phlame-cancel-btn') as HTMLElement;
      if (cancelBtn) {
        const actionId = cancelBtn.dataset.actionId;
        const planetId = cancelBtn.dataset.planet;
        if (actionId && planetId) {
          this.dispatchEvent(
            new CustomEvent('phlame:cancel', {
              bubbles: true,
              composed: true,
              detail: { actionId, planetId },
            }),
          );
        }
      }
    });
  }
}
