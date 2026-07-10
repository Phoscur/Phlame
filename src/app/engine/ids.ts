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
