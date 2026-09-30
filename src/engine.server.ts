import { injectable, inject, Injector } from '@joist/di';
import type { GenesisJSON, SaveJSON, SaveSettingsJSON } from '@phlame/engine';
import { Zeit, Zeitgeber } from './app/signals/zeitgeber';
import { ConsoleDebug, Debug } from './app/debug.element';
import { Data, NanoID, SessionCorruptError } from './data.server';
import { empireID, phlameID } from './app/engine/ids';
import {
  PhelopmentIdentifier,
  EmpireEntity,
  EmpireService,
  fromGenesis,
  genesisFor,
  phormulae,
  ResourceIdentifier,
} from './app/engine';

type SID = NanoID;

export interface Session {
  sid: SID;
  /** the deterministic birth kept with the session so saveSession can persist it (ADR 0012) */
  genesis: GenesisJSON;
  settings: SaveSettingsJSON;
  empire: EmpireEntity;
}
/** the immutable-per-session save metadata captured at load, so saveSession need only the empire */
interface SessionMeta {
  genesis: GenesisJSON;
  settings: SaveSettingsJSON;
}
export interface PersistedSession {
  sid: SID;
  /** the whole v2 save: genesis + empire under the universe Phingerprint (ADR 0011/0020) */
  save: SaveJSON<ResourceIdentifier, PhelopmentIdentifier>;
}
@injectable({
  providers: [
    [
      Debug,
      {
        factory(_i: Injector) {
          return {
            log(t: unknown, ...args: unknown[]) {
              // WIP cut timestamps a bit - should take advantage of i.parent access for decoration here probably (ConsoleDebug)
              if (typeof t === 'number') {
                console.log((t / 10000).toFixed(0), ...args);
                return;
              }
              console.log(t, ...args);
            },
          };
        },
      },
    ],
  ],
})
export class EngineService {
  #logger = inject(Debug);
  #zeit = inject(Zeitgeber);
  #persistence = inject(Data);
  #empire = inject(EmpireService);
  /** the runtime environment (set in start()); gates the dev-only verify-on-load */
  #environment = 'dev';
  /** genesis + settings captured per sid at load/birth, so a save can carry them (ADR 0012) */
  #sessions = new Map<SID, SessionMeta>();

  get time(): Zeit {
    const { tick, timeMS } = this.#zeit();
    return {
      tick,
      timeMS,
    };
  }

  get empire(): EmpireEntity {
    return this.#empire().current;
  }

  /**
   * Load the persistence layer and time management
   * @returns {boolean} isFirstStart
   */
  async start(environment: string) {
    this.#environment = environment;
    const logger = this.#logger();
    const zeit = this.#zeit();
    const persistence = this.#persistence();
    const firstStart = await persistence.init(environment);
    const z = await persistence.loadZeit();
    zeit.start(z.timeMS, z.tick);
    logger.log(zeit.timeMS, 'Start', z.tick, '->', zeit.tick, `(${zeit.tick - z.tick} o.d.)`);
    if (firstStart) {
      const t = this.time;
      await persistence.saveZeit(t);
      logger.log(t.timeMS, 'Zeit saved, tick:', t.tick);
    }
    return this;
  }

  /**
   * Load a session and return its empire DIRECTLY - callers must hold on to the
   * returned reference: the EmpireService singleton's `current` can be swapped by a
   * parallel request at any await point (session middleware rework pending, PLAN M1).
   * @throws NotFoundError|SessionCorruptError (`code` 404/401, see data.server.ts)
   */
  async loadEmpire(sid: string): Promise<EmpireEntity> {
    const logger = this.#logger();
    const persistence = this.#persistence();
    const { save } = await persistence.loadSession(sid);
    // v2 only: a v1 file (`{ sid, zeit, empire }`) has no `version`/genesis and its birth
    // tick is unrecoverable, so it cannot be replayed - ADR 0011 lets pre-1.0 saves break.
    if (save?.version !== 2 || save.universe !== phormulae.phingerprint) {
      throw new SessionCorruptError(`Session ${sid} is not a v2 save for this universe`);
    }
    logger.log('Loading session:', sid);
    const empire = this.#empire().setupFromJSON(save.empire).current;
    this.#sessions.set(sid, { genesis: save.genesis, settings: save.settings });
    return empire;
  }

  /**
   * @param sid SessionID
   * @returns error code
   */
  async load(sid: string): Promise<number> {
    try {
      await this.loadEmpire(sid);
      return 0;
    } catch (e: any) {
      this.#logger().log('Error loading session', sid, e?.code, e);
      return e?.code ?? 1;
    }
  }

  async generateSession() {
    const zeit = this.#zeit();
    const persistence = this.#persistence();
    const sid = persistence.generateID();
    // empire and planet share the session's stem, typed by prefix (see ids.ts)
    const session = this.createSession(sid, empireID(sid), phlameID(sid), zeit.tick);
    this.#sessions.set(sid, { genesis: session.genesis, settings: session.settings });
    await this.saveSession(session);
    this.#empire().setup(session.empire);
    return session;
  }

  /**
   * Persist the empire as its v2 save. Genesis + settings come from the per-sid meta
   * captured at load/birth, so callers behind the middleware pass only their captured
   * empire (see empire.middleware.ts) without threading immutable birth data through.
   */
  async saveSession({ sid, empire }: { sid: SID; empire: EmpireEntity }) {
    const persistence = this.#persistence();
    const meta = this.#sessions.get(sid);
    if (!meta) {
      throw new Error(`Cannot save session ${sid}: not loaded or generated`);
    }
    await persistence.saveSession({
      sid,
      save: {
        version: 2,
        universe: phormulae.phingerprint,
        genesis: meta.genesis,
        settings: meta.settings,
        empire: empire.toJSON(),
      },
    });
    this.#logger().log(this.time.timeMS, 'Saved session:', sid);
  }

  createSession(sid: string, eid: string, pid: string, tick?: number): Session {
    // deterministic birth (ADR 0012): the genesis derives the empire, both persisted together
    const genesis = genesisFor(eid, [pid], tick);
    const empire = fromGenesis(genesis);
    return {
      sid,
      genesis,
      settings: { timewarp: false },
      empire,
    };
  }
}

export async function startup(environment: string): Promise<Injector> {
  const injector = new Injector({ providers: [[Debug, { use: ConsoleDebug }]] });
  const engine = injector.inject(EngineService);
  await engine.start(environment);
  return injector;
}
