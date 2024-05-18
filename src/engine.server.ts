import { injectable, inject, Injector } from '@joist/di';
import { Zeit, Zeitgeber } from './app/signals/zeitgeber';
import { ConsoleDebug, Debug } from './app/debug.element';
import { DataService, NanoID } from './data.server';
import {
  BuildingIdentifier,
  EmpireEntity,
  EmpireService,
  emptyEmpire,
  ResourceIdentifier,
} from './app/engine';
import { EmpireJSON } from '@phlame/engine';

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
@injectable
export class EngineService {
  static providers = [
    {
      provide: Debug,
      /* eslint-disable */
      factory(i: Injector) {
        return {
          log(t: any, ...args: any[]) {
            // WIP cut timestamps a bit - should take advantage of i.parent access for decoration here probably (ConsoleDebug)
            if (typeof t === 'number') {
              console.log(t / 10000, ...args);
              return;
            }
            console.log(t, ...args);
          },
        };
      },
      /* eslint-enable */
    },
  ];
  #logger = inject(Debug);
  #zeit = inject(Zeitgeber);
  #persistence = inject(DataService);
  #empire = inject(EmpireService);

  get time(): Zeit {
    const { tick, time } = this.#zeit();
    return {
      tick,
      time,
    };
  }

  get empire(): EmpireEntity {
    return this.#empire().current;
  }

  async start() {
    const logger = this.#logger();
    const zeit = this.#zeit();
    const persistence = this.#persistence();
    const firstStart = await persistence.init();
    const z = await persistence.loadZeit();
    zeit.start(z.time, z.tick);
    logger.log(zeit.time, 'Start', z.tick, '->', zeit.tick, `(${zeit.tick - z.tick})`);
    if (firstStart) {
      const t = this.time;
      await persistence.saveZeit(t);
      logger.log(t.time, 'Zeit saved, tick:', t.tick);
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
        zeit: { time, tick },
        empire,
      } = session;
      // Actually Session(User) Empire & MainPlanet could share an ID, then it could be ommitted for log readability?
      logger.log('Loading session:', sid, empire.id); //, empire.entities[0]?.id);
      logger.log(time, 'Loading tick:', tick, `(${zeit.tick - tick})`);
      logger.log(zeit.time, 'Current tick:', zeit.tick);
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
    const eid = persistence.generateID();
    const pid = persistence.generateID();
    const session = this.createSession(sid, eid, pid, zeit.tick);
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
    this.#logger().log(zeit.time, 'Saved session:', session.sid);
  }

  createSession(sid: string, eid: string, pid: string, tick?: number): Session {
    const empire = emptyEmpire(eid, pid, tick);
    return {
      sid,
      empire,
    };
  }
}

export async function startup(): Promise<Injector> {
  const injector = new Injector([{ provide: Debug, use: ConsoleDebug }]);
  const engine = injector.get(EngineService);
  await engine.start();
  return injector;
}
