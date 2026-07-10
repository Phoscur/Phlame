import { customAlphabet } from 'nanoid';

// no lookalikes (0/O, 1/I, E/8...) - ids stay readable and typable (console: `cancel K7NQRSTV`)
// collision check: https://zelark.github.io/nano-id-cc/
export const NANOID_ALPHABET = '123456789ABCDFGHJKLMNQRSTVWXYZ';
export const NANOID_LENGTH = 8;

/**
 * Short id generator for sessions and actions (8 chars, ~10^11 ids at 1% collision risk).
 * Lives at the app boundary on purpose: the engine is pure and takes ids as arguments
 * (ADR 0009/0019) - randomness never enters `@phlame/engine`.
 */
export const generateID = customAlphabet(NANOID_ALPHABET, NANOID_LENGTH);

/**
 * Type prefixes make generated ids self-explaining in logs and saves (ADR 0019):
 * `E-XXXXXXXX` empire, `P-XXXXXXXX` planet/phlame, `A-XXXXXXXX` action.
 * Session ids stay bare on purpose: `isValidSID` (cookies -> file paths) accepts
 * exactly 8 alphabet chars, so entity ids can never pose as sessions.
 */
export const IDPrefix = {
  Empire: 'E',
  Phlame: 'P',
  Action: 'A',
} as const;

/** empire id, derived from a base (e.g. the session id) or freshly generated */
export const empireID = (base: string = generateID()) => `${IDPrefix.Empire}-${base}`;
/** planet id, derived from a base (e.g. the session id) or freshly generated */
export const phlameID = (base: string = generateID()) => `${IDPrefix.Phlame}-${base}`;
/** action/command id for the empire log */
export const actionID = () => `${IDPrefix.Action}-${generateID()}`;
