import { injectable, inject, Injector } from '@joist/di';
import type { EmpireJSON } from '@phlame/engine';
import { Zeit, Zeitgeber } from './app/signals/zeitgeber';
import { ConsoleDebug, Debug } from './app/debug.element';
import { Data, NanoID } from './data.server';
import {
  BuildingIdentifier,
  EmpireEntity,
  EmpireService,
  emptyEmpire,
  ResourceIdentifier,
} from './app/engine';

type SID = NanoID;

export interface Session {
  sid: SID;
  empire: EmpireEntity;
}
export interface PersistedSession {
  sid: SID;
  zeit: Zeit;
  empire: EmpireJSON<ResourceIdentifier, BuildingIdentifier>;
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

  async start(environment: string) {
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
   * @param sid SessionID
   * @returns error code
   */
  async load(sid: string): Promise<number> {
    const logger = this.#logger();
    const zeit = this.#zeit();
    const persistence = this.#persistence();
    try {
      const session = await persistence.loadSession(sid);
      const {
        zeit: { timeMS, tick },
        empire,
      } = session;
      logger.log('Loading session:', sid);
      logger.log(timeMS, 'Loading tick:', tick, `(${zeit.tick - tick} o.d.)`);
      logger.log(zeit.timeMS, 'Current tick:', zeit.tick);
      /* if (tick && tick !== zeit.tick) {
        zeit.stop();
        // TODO catch up ticks with actions
        zeit.start(time, tick);
      }*/
      this.#empire().setupFromJSON(empire);

      return 0;
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    } catch (e: any) {
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access */
      logger.log('Error loading session', sid, e?.code, e);
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-return */ /* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access */
      return e?.code ?? 1;
    }
  }

  async generateSession() {
    const zeit = this.#zeit();
    const persistence = this.#persistence();
    const sid = persistence.generateID();
    const session = this.createSession(sid, sid, sid, zeit.tick);
    await this.saveSession(session);
    this.#empire().setup(session.empire);
    return session;
  }

  async saveSession(session: Session) {
    const persistence = this.#persistence();
    const { time: zeit } = this;
    await persistence.saveSession({
      sid: session.sid,
      zeit,
      empire: session.empire.toJSON(),
    });
    this.#logger().log(zeit.timeMS, 'Saved session:', session.sid);
  }

  createSession(sid: string, eid: string, pid: string, tick?: number): Session {
    const empire = emptyEmpire(eid, pid, tick);
    return {
      sid,
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
