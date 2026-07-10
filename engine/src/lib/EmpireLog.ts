import type { TimeUnit } from './resources';
import type { ActionType, EventType, ID } from './Action';

/**
 * The M0 save/log schema (ADR 0012 + 0018) - defined here so persistence and the
 * empire-log implementation (M1) grow into one shape instead of inventing three.
 *
 * A shared save is `genesis + actions` under a universe Phingerprint (ADR 0011);
 * consequences are the verifiable echo (ADR 0018): serialized while saves are
 * snapshot-based (open builds are state!), recomputable once saves are genesis + log.
 */

/**
 * Genesis - the deterministic birth of an empire (ADR 0012):
 * `derive(phormulae, genesis)` must always produce the same starting empire,
 * so a save can be just genesis + action log.
 */
export interface GenesisJSON {
  /** the universe these entities were born under: `Phormulae.phingerprint` (ADR 0011) */
  universe: string;
  /** reserved for deterministic derivations (planet env properties etc., Economy seed TODO) */
  seed: string;
  empire: ID;
  planets: ID[];
  /** birth tick on the universe's global timeline (ADR 0002) */
  tick: TimeUnit;
}

/**
 * One empire-log entry: a trusted, immutable command (ADR 0018).
 * Total order = (tick, seq); seq is strictly monotonic per empire (ADR 0012).
 */
export interface LogEntryJSON {
  seq: number;
  tick: TimeUnit;
  type: ActionType;
  /** every entity this command touches - per-entity history stays extractable */
  concerns: ID[];
  payload: Record<string, unknown>;
}

/**
 * A consequence echo entry (ADR 0018): deterministically derived by update(),
 * never believed by a verifier - always recomputable from genesis + actions.
 */
export interface ConsequenceJSON {
  /** derived, deterministic id, e.g. `${actionId}:started` - no randomness in the engine */
  id: string;
  at: TimeUnit;
  type: EventType;
  concerns: ID[];
  payload: Record<string, unknown>;
}

/**
 * The complete shareable empire save (target shape, implemented with M1's empire log)
 */
export interface EmpireLogJSON {
  /** `Phormulae.phingerprint` - replay is only defined within a matching universe */
  universe: string;
  genesis: GenesisJSON;
  actions: LogEntryJSON[];
  /** the echo - strippable from shared saves, required while saves are snapshot-based */
  consequences: ConsequenceJSON[];
}
