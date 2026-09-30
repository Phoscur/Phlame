import type { ResourceIdentifier, TimeUnit } from './resources';
import type { PhelopmentIdentifier } from './Phelopment';
import type { ActionType, EventType, ID } from './Action';
import type { EmpireJSON } from './Empire';

/**
 * The save/log schema (ADR 0012 + 0018) - defined here so persistence, the kit and the
 * app carry one shape instead of inventing three.
 *
 * A save is `genesis + empire` under a universe Phingerprint (ADR 0011): the empire's
 * command log IS the authoritative history (`empire.log`), the snapshot its cache, and
 * consequences live inside the entities as the verifiable echo (ADR 0018) - so
 * `replay(genesis, empire.log)` must reproduce `empire`. No duplicate fields, no
 * save-level tick: entities carry their own (`empire.lastTick`), global time stays in
 * data/zeit.json.
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
 * Game settings that travel with a save but are NOT universe rules: they change how the
 * player interacts, not how the economy computes, so they are deliberately outside the
 * Phingerprint (ADR 0011) - a different `timewarp` setting is the same universe.
 */
export interface SaveSettingsJSON {
  /** the player's timewarp-slider setting (backdating into the unobserved window, ADR 0020) */
  timewarp: boolean;
}

/**
 * The complete empire save (v2): every persisted empire carries its genesis so
 * `replay(genesis, empire.log)` can verify the snapshot (ADR 0012/0020). `actions` IS
 * `empire.log`; consequences are recomputed from it, they are not stored separately.
 */
export interface SaveJSON<
  ResourceType extends ResourceIdentifier,
  PhelopmentType extends PhelopmentIdentifier,
> {
  /** save-format version - loaders refuse anything but 2 (no v1 migration, ADR 0011) */
  version: 2;
  /** `Phormulae.phingerprint` - replay is only defined within a matching universe */
  universe: string;
  genesis: GenesisJSON;
  settings: SaveSettingsJSON;
  empire: EmpireJSON<ResourceType, PhelopmentType>;
}
