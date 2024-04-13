import { PropsWithChildren } from 'hono/jsx';

type Icon = {
  className?: string;
};

export const MetallicIcon = ({ className }: PropsWithChildren<Icon> = { className: '' }) => (
  <>
    <svg // generated via https://app.haikei.app/ "Low Poly Grid" - maybe simplify it further somehow...?
      viewBox="0 0 90 90"
      width="90"
      height="90"
      class={className}
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
      version="1.1"
    >
      <g stroke-width="0.1" stroke-linejoin="bevel">
        <path d="M47 46L38 60L53 50Z" fill="#171717" stroke="currentColor"></path>
        <path d="M38 60L54 60L53 50Z" fill="#404040" stroke="currentColor"></path>
        <path d="M54 60L61 55L53 50Z" fill="#404040" stroke="currentColor"></path>
        <path d="M57 29L44 36L47 46Z" fill="#262626" stroke="currentColor"></path>
        <path d="M62 32L47 46L53 50Z" fill="#525252" stroke="currentColor"></path>
        <path d="M47 46L44 36L38 60Z" fill="#404040" stroke="currentColor"></path>
        <path d="M38 60L40 74L54 60Z" fill="#262626" stroke="currentColor"></path>
        <path d="M54 60L65 61L61 55Z" fill="#404040" stroke="currentColor"></path>
        <path d="M59 77L65 61L54 60Z" fill="#171717" stroke="currentColor"></path>
        <path d="M59 77L70 60L65 61Z" fill="#404040" stroke="currentColor"></path>
        <path d="M65 61L70 60L61 55Z" fill="#262626" stroke="currentColor"></path>
        <path d="M61 55L62 32L53 50Z" fill="#404040" stroke="currentColor"></path>
        <path d="M40 74L59 77L54 60Z" fill="#262626" stroke="currentColor"></path>
        <path d="M68 32L62 32L61 55Z" fill="#404040" stroke="currentColor"></path>
        <path d="M62 32L57 29L47 46Z" fill="#404040" stroke="currentColor"></path>
        <path d="M30 28L17 66L38 60Z" fill="#404040" stroke="currentColor"></path>
        <path d="M38 60L17 66L40 74Z" fill="#404040" stroke="currentColor"></path>
        <path d="M44 13L30 28L44 36Z" fill="#262626" stroke="currentColor"></path>
        <path d="M44 36L30 28L38 60Z" fill="#404040" stroke="currentColor"></path>
        <path d="M62 32L68 32L57 29Z" fill="#262626" stroke="currentColor"></path>
        <path d="M70 60L68 32L61 55Z" fill="#404040" stroke="currentColor"></path>
        <path d="M40 74L59 90L59 77Z" fill="#262626" stroke="currentColor"></path>
        <path d="M59 77L87 82L70 60Z" fill="#404040" stroke="currentColor"></path>
        <path d="M45 98L59 90L40 74Z" fill="#404040" stroke="currentColor"></path>
        <path d="M59 90L67 90L59 77Z" fill="#404040" stroke="currentColor"></path>
        <path d="M57 29L44 13L44 36Z" fill="#262626" stroke="currentColor"></path>
        <path d="M50 11L44 13L57 29Z" fill="#404040" stroke="currentColor"></path>
        <path d="M67 90L69 90L59 77Z" fill="#404040" stroke="currentColor"></path>
        <path d="M26 103L45 98L40 74Z" fill="#525252" stroke="currentColor"></path>
        <path d="M59 90L45 98L67 90Z" fill="#171717" stroke="currentColor"></path>
        <path d="M67 90L45 98L69 90Z" fill="#404040" stroke="currentColor"></path>
        <path d="M26 0L13 26L30 28Z" fill="#262626" stroke="currentColor"></path>
        <path d="M30 28L1 50L17 66Z" fill="#262626" stroke="currentColor"></path>
        <path d="M60 0L50 11L57 29Z" fill="#404040" stroke="currentColor"></path>
        <path d="M13 26L1 50L30 28Z" fill="#262626" stroke="currentColor"></path>
        <path d="M17 66L26 103L40 74Z" fill="#262626" stroke="currentColor"></path>
        <path d="M87 82L90 59L70 60Z" fill="#262626" stroke="currentColor"></path>
        <path d="M70 60L90 40L68 32Z" fill="#262626" stroke="currentColor"></path>
        <path d="M1 50L0 53L17 66Z" fill="#525252" stroke="currentColor"></path>
        <path d="M13 26L0 46L1 50Z" fill="#262626" stroke="currentColor"></path>
        <path d="M1 50L0 46L0 53Z" fill="#171717" stroke="currentColor"></path>
        <path d="M90 59L90 40L70 60Z" fill="#171717" stroke="currentColor"></path>
        <path d="M68 32L60 0L57 29Z" fill="#404040" stroke="currentColor"></path>
        <path d="M90 40L83 25L68 32Z" fill="#404040" stroke="currentColor"></path>
        <path d="M0 53L0 73L17 66Z" fill="#404040" stroke="currentColor"></path>
        <path d="M90 59L94 62L90 40Z" fill="#262626" stroke="currentColor"></path>
        <path d="M87 82L94 62L90 59Z" fill="#171717" stroke="currentColor"></path>
        <path d="M69 90L87 82L59 77Z" fill="#262626" stroke="currentColor"></path>
        <path d="M0 24L0 30L13 26Z" fill="#525252" stroke="currentColor"></path>
        <path d="M13 26L0 30L0 46Z" fill="#262626" stroke="currentColor"></path>
        <path d="M3 90L26 103L17 66Z" fill="#262626" stroke="currentColor"></path>
        <path d="M90 40L90 26L83 25Z" fill="#171717" stroke="currentColor"></path>
        <path d="M60 0L52 0L50 11Z" fill="#404040" stroke="currentColor"></path>
        <path d="M94 62L90 26L90 40Z" fill="#262626" stroke="currentColor"></path>
        <path d="M16 0L0 24L13 26Z" fill="#171717" stroke="currentColor"></path>
        <path d="M26 0L30 28L44 13Z" fill="#404040" stroke="currentColor"></path>
        <path d="M0 73L3 90L17 66Z" fill="#262626" stroke="currentColor"></path>
        <path d="M60 0L68 32L83 25Z" fill="#404040" stroke="currentColor"></path>
        <path d="M50 11L37 0L44 13Z" fill="#525252" stroke="currentColor"></path>
        <path d="M0 53L-10 56L0 73Z" fill="#404040" stroke="currentColor"></path>
        <path d="M0 73L2 90L3 90Z" fill="#404040" stroke="currentColor"></path>
        <path d="M0 46L-10 56L0 53Z" fill="#404040" stroke="currentColor"></path>
        <path d="M0 30L-10 56L0 46Z" fill="#404040" stroke="currentColor"></path>
        <path d="M0 24L-10 56L0 30Z" fill="#262626" stroke="currentColor"></path>
        <path d="M52 0L37 0L50 11Z" fill="#171717" stroke="currentColor"></path>
        <path d="M0 90L2 90L0 73Z" fill="#262626" stroke="currentColor"></path>
        <path d="M3 90L2 90L26 103Z" fill="#404040" stroke="currentColor"></path>
        <path d="M94 62L90 21L90 26Z" fill="#262626" stroke="currentColor"></path>
        <path d="M90 26L90 21L83 25Z" fill="#171717" stroke="currentColor"></path>
        <path d="M90 96L90 90L69 90Z" fill="#525252" stroke="currentColor"></path>
        <path d="M69 90L90 90L87 82Z" fill="#404040" stroke="currentColor"></path>
        <path d="M87 82L90 90L94 62Z" fill="#404040" stroke="currentColor"></path>
        <path d="M90 96L69 90L45 98Z" fill="#262626" stroke="currentColor"></path>
        <path d="M90 0L60 0L83 25Z" fill="#404040" stroke="currentColor"></path>
        <path d="M-10 56L0 90L0 73Z" fill="#262626" stroke="currentColor"></path>
        <path d="M2 90L0 90L26 103Z" fill="#262626" stroke="currentColor"></path>
        <path d="M37 0L26 0L44 13Z" fill="#171717" stroke="currentColor"></path>
        <path d="M26 103L90 96L45 98Z" fill="#404040" stroke="currentColor"></path>
        <path d="M90 90L90 96L94 62Z" fill="#262626" stroke="currentColor"></path>
        <path d="M26 0L16 0L13 26Z" fill="#262626" stroke="currentColor"></path>
        <path d="M94 62L90 0L90 21Z" fill="#525252" stroke="currentColor"></path>
        <path d="M90 21L90 0L83 25Z" fill="#262626" stroke="currentColor"></path>
        <path d="M16 0L0 0L0 24Z" fill="#171717" stroke="currentColor"></path>
        <path d="M0 24L0 0L-10 56Z" fill="#404040" stroke="currentColor"></path>
      </g>
    </svg>
  </>
);

export const CrystallineIcon = ({ className }: PropsWithChildren<Icon> = { className: '' }) => (
  <>
    <svg // generated via https://app.haikei.app/ "Low Poly Grid"
      viewBox="0 0 90 90"
      width="90"
      height="90"
      class={className}
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
      version="1.1"
    >
      <g stroke-width="0.3" stroke-linejoin="bevel">
        <path d="M47.5 19.5L51.5 0L38 0Z" fill="#7f1d1d" stroke="currentColor"></path>
        <path d="M38 0L24 6.5L47.5 19.5Z" fill="#991b1b" stroke="currentColor"></path>
        <path d="M38 0L18.5 0L24 6.5Z" fill="#7f1d1d" stroke="currentColor"></path>
        <path d="M90 0L63.5 -12.5L51.5 0Z" fill="#dc2626" stroke="currentColor"></path>
        <path d="M51.5 0L63.5 -12.5L38 0Z" fill="#450a0a" stroke="currentColor"></path>
        <path d="M38 0L63.5 -12.5L18.5 0Z" fill="#f87171" stroke="currentColor"></path>
        <path d="M18.5 0L0 17L24 6.5Z" fill="#dc2626" stroke="currentColor"></path>
        <path d="M24 6.5L0 55.5L47.5 19.5Z" fill="#7f1d1d" stroke="currentColor"></path>
        <path d="M0 -2L0 0L18.5 0Z" fill="#991b1b" stroke="currentColor"></path>
        <path d="M18.5 0L0 0L0 17Z" fill="#dc2626" stroke="currentColor"></path>
        <path d="M47.5 19.5L90 16L51.5 0Z" fill="#991b1b" stroke="currentColor"></path>
        <path d="M47.5 19.5L90 16.5L90 16Z" fill="#450a0a" stroke="currentColor"></path>
        <path d="M-8.5 -10L0 -2L18.5 0Z" fill="#dc2626" stroke="currentColor"></path>
        <path d="M90 16L90 0L51.5 0Z" fill="#450a0a" stroke="currentColor"></path>
        <path d="M90 0L90 -0.5L63.5 -12.5Z" fill="#fef2f2" stroke="currentColor"></path>
        <path d="M0 0L-8.5 12.5L0 17Z" fill="#7f1d1d" stroke="currentColor"></path>
        <path d="M-10 7.5L-8.5 12.5L0 0Z" fill="#7f1d1d" stroke="currentColor"></path>
        <path d="M0 -2L-10 7.5L0 0Z" fill="#450a0a" stroke="currentColor"></path>
        <path d="M63.5 -12.5L-8.5 -10L18.5 0Z" fill="#f87171" stroke="currentColor"></path>
        <path d="M0 -2L-8.5 -10L-10 7.5Z" fill="#dc2626" stroke="currentColor"></path>
        <path d="M0 90L0 55.5L-8.5 12.5Z" fill="#f87171" stroke="currentColor"></path>
        <path d="M-8.5 12.5L0 55.5L0 17Z" fill="#5e5f7e" stroke="currentColor"></path>
        <path d="M0 17L0 55.5L24 6.5Z" fill="#7f1d1d" stroke="currentColor"></path>
        <path d="M47.5 19.5L96.5 74.5L90 16.5Z" fill="#dc2626" stroke="currentColor"></path>
        <path d="M90 90L96.5 74.5L47.5 19.5Z" fill="#450a0a" stroke="currentColor"></path>
        <path d="M90 16.5L96.5 74.5L90 16Z" fill="#991b1b" stroke="currentColor"></path>
        <path d="M90 16L96.5 74.5L90 0Z" fill="#450a0a" stroke="currentColor"></path>
        <path d="M90 0L96.5 74.5L90 -0.5Z" fill="#fef2f2" stroke="currentColor"></path>
        <path d="M0 90L3.5 90L0 55.5Z" fill="#dc2626" stroke="currentColor"></path>
        <path d="M17.5 102L90 90L47.5 19.5Z" fill="#7f1d1d" stroke="currentColor"></path>
        <path d="M-10 7.5L0 90L-8.5 12.5Z" fill="#dc2626" stroke="currentColor"></path>
        <path d="M17.5 102L47.5 19.5L0 55.5Z" fill="#7f1d1d" stroke="currentColor"></path>
        <path d="M90 90L94 90L96.5 74.5Z" fill="#fef2f2" stroke="currentColor"></path>
        <path d="M94 90L94.5 90L96.5 74.5Z" fill="#991b1b" stroke="currentColor"></path>
        <path d="M0 90L0 94.5L3.5 90Z" fill="#450a0a" stroke="currentColor"></path>
        <path d="M3.5 90L17.5 102L0 55.5Z" fill="#dc2626" stroke="currentColor"></path>
        <path d="M90 90L17.5 102L94 90Z" fill="#fef2f2" stroke="currentColor"></path>
        <path d="M94 90L17.5 102L94.5 90Z" fill="#991b1b" stroke="currentColor"></path>
        <path d="M-10 7.5L0 94.5L0 90Z" fill="#7f1d1d" stroke="currentColor"></path>
        <path d="M0 94.5L17.5 102L3.5 90Z" fill="#fef2f2" stroke="currentColor"></path>
      </g>
    </svg>
  </>
);

export const BubblesIcon = ({ className }: PropsWithChildren<Icon> = { className: '' }) => (
  <>
    <svg // generated via https://app.haikei.app/ "Circle Scatter"
      viewBox="0 0 90 90"
      width="90"
      height="90"
      class={className}
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
      version="1.1"
    >
      <g fill="currentColor">
        <circle r="19" cx="51" cy="67"></circle>
        <circle r="8" cx="47" cy="10"></circle>
        <circle r="15" cx="12" cy="45"></circle>
        <circle r="16" cx="78" cy="29"></circle>
        <circle r="17" cx="12" cy="82"></circle>
      </g>
    </svg>
  </>
);
export const EnergyIcon = ({ className }: PropsWithChildren<Icon> = { className: '' }) => (
  <>
    <svg // generated via https://app.haikei.app/ "Layered Peaks"
      id="visual"
      viewBox="0 20 90 90" // let' get a bit more of the yellow on the bottom
      width="90"
      height="90"
      class={className}
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
      version="1.1"
    >
      <rect x="0" y="0" width="90" height="100" fill="currentColor"></rect>
      <path
        d="M0 46L10 47L20 51L30 43L40 42L50 50L60 51L70 46L80 53L90 56L90 91L0 91Z"
        fill="#ea580c"
      ></path>
      <path
        d="M0 76L10 74L20 66L30 64L40 70L50 62L60 66L70 66L80 70L90 69L90 91L0 91Z"
        fill="#fb923c"
      ></path>
      <path
        d="M0 86L10 89L20 84L30 82L40 85L50 89L60 84L70 82L80 83L90 92L90 121L0 121Z"
        fill="#facc15"
      ></path>
    </svg>
  </>
);

// TODO multiple customisable colors: https://stackoverflow.com/questions/31056134/multiple-colours-in-svg-sprite
// parameterise `fill` and blend it with `currentColor`

export const MineIcon = ({ className }: PropsWithChildren<Icon> = { className: '' }) => (
  <>
    <svg // generated by ChatGPT "Mine (Drill)"
      id="visual"
      viewBox="0 0 100 100"
      width="90"
      height="90"
      class={className}
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
      version="1.1"
    >
      <circle cx="50" cy="50" r="45" fill="#212121" />
      <circle cx="50" cy="50" r="20" fill="#FFA000" />
      <rect x="47.5" y="20" width="5" height="30" fill="currentColor" />
      <rect x="40" y="50" width="20" height="10" fill="currentColor" />
    </svg>
  </>
);

export const SiloIcon = ({ className }: PropsWithChildren<Icon> = { className: '' }) => (
  <>
    <svg
      xmlns="http://www.w3.org/2000/svg" // generated by ChatGPT "Silo"
      width="90"
      height="90"
      viewBox="0 0 100 100"
      class={className}
    >
      <rect x="25" y="20" width="50" height="60" fill="#616161" opacity="0.5" />
      <rect x="20" y="15" width="60" height="10" fill="#9E9E9E" />
      <rect x="20" y="75" width="60" height="10" fill="#9E9E9E" />
      <rect x="30" y="30" width="40" height="40" fill="#1d4ed8" opacity="0.5" />
      <rect x="25" y="40" width="50" height="5" fill="#FFD600" />
      <rect x="25" y="55" width="50" height="5" fill="#FFD600" />
      <circle cx="50" cy="65" r="10" fill="currentColor" />
    </svg>
  </>
);

export const PowerPlantSolarIcon = ({ className }: PropsWithChildren<Icon> = { className: '' }) => (
  <>
    <svg // generated by ChatGPT "Solar Power Plant"
      xmlns="http://www.w3.org/2000/svg"
      width="90"
      height="90"
      viewBox="0 0 100 100"
      class={className}
    >
      <circle cx="50" cy="50" r="45" fill="#212121" />
      <rect x="20" y="20" width="60" height="60" fill="currentColor" />
      <rect x="30" y="19" width="40" height="11" fill="#212121" />
      <rect x="25" y="30" width="10" height="40" fill="#212121" />
      <rect x="65" y="30" width="10" height="40" fill="#212121" />
      <rect x="30" y="70" width="40" height="11" fill="#212121" />
    </svg>
  </>
);

export const PowerPlantFusionIcon = (
  { className }: PropsWithChildren<Icon> = { className: '' },
) => (
  <>
    <svg // generated by ChatGPT "Fusion Power Plant"
      xmlns="http://www.w3.org/2000/svg"
      width="90"
      height="90"
      viewBox="0 0 100 100"
      class={className}
    >
      <circle cx="50" cy="50" r="45" fill="#212121" />
      <circle cx="50" cy="50" r="30" fill="url(#plasma-gradient)" />
      <circle cx="50" cy="50" r="10" fill="currentColor" />
      <line x1="20" y1="50" x2="80" y2="50" stroke="currentColor" stroke-width="2" />
      <line x1="50" y1="20" x2="50" y2="80" stroke="currentColor" stroke-width="2" />
      <circle cx="50" cy="50" r="5" fill="currentColor" />
      <line x1="50" y1="50" x2="70" y2="70" stroke="currentColor" stroke-width="2" />
      <line x1="50" y1="50" x2="30" y2="30" stroke="currentColor" stroke-width="2" />
      <line x1="50" y1="50" x2="70" y2="30" stroke="currentColor" stroke-width="2" />
      <line x1="50" y1="50" x2="30" y2="70" stroke="currentColor" stroke-width="2" />

      <defs>
        <radialGradient id="plasma-gradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" style="stop-color:currentColor;stop-opacity:1" />
          {/* energy-secondary: color-orange-400*/}
          <stop offset="100%" style="stop-color:#fb923c;stop-opacity:0" />
        </radialGradient>
      </defs>
    </svg>
  </>
);
