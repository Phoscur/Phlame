import { injectable, inject, Injector } from '@joist/di';
import { Zeit, Zeitgeber } from './app/signals/zeitgeber';
import { Debug } from './app/debug.element';
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
};
export interface PersistedSession {
  sid: SID;
  zeit: Zeit;
  empire: EmpireJSON<ResourceIdentifier, BuildingIdentifier>;
};
@injectable
export class EngineService {
  #logger = inject(Debug);
  #zeit = inject(Zeitgeber);
  #persistence = inject(DataService);
  #empire = inject(EmpireService);

  get time(): Zeit {
    const { tick, time } = this.#zeit();
    this.#logger().log('Tick', tick, time);
    return {
      tick,
      time,
    };
  }

  get empire(): EmpireEntity {
    return this.#empire().current;
  }

  async start() {
    const zeit = this.#zeit();
    const persistence = this.#persistence();
    const firstStart = await persistence.init();
    const z = await persistence.loadZeit();
    zeit.start(z.time, z.tick);
    this.#logger().log('Start', z, zeit.tick, zeit.time);
    if (firstStart) {
      await persistence.saveZeit(this.time);
    }
    return this;
  }

  /**
   * @param sid SessionID
   * @returns error code
   */
  async load(sid: string): Promise<number> {
    const zeit = this.#zeit();
    const persistence = this.#persistence();
    try {
      const session = await persistence.loadSession(sid);
      const {
        zeit: { time, tick },
        empire,
      } = session;
      console.log('Current', zeit.tick, 'at  ', zeit.time);
      // Actually Session(User) Empire & MainPlanet could share an ID, then it could be ommitted for log readability?
      console.log('Loading', tick, 'from', time, sid); //, empire.id, empire.entities[0]?.id);
      console.log('Created', zeit.tick - tick, 'ticks ago.');
      /* if (tick && tick !== zeit.tick) {
        zeit.stop();
        // TODO catch up ticks with actions
        zeit.start(time, tick);
      }*/
      this.#empire().setupFromJSON(empire);

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
    const eid = persistence.generateID();
    const pid = persistence.generateID();
    const session = this.createSession(sid, eid, pid, zeit.tick);
    await this.saveSession(session);
    this.#empire().setup(session.empire);
    return session;
  }

  async saveSession(session: Session) {
    const persistence = this.#persistence();
    await persistence.saveSession({
      sid: session.sid,
      zeit: this.time,
      empire: session.empire.toJSON(),
    });
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
  const injector = new Injector();
  const engine = injector.get(EngineService);
  await engine.start();
  return injector;
}
