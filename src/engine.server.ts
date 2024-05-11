import { injectable, inject, Injector } from '@joist/di';
import { Zeit, Zeitgeber } from './app/signals/zeitgeber';
import { Debug } from './app/debug.element';
import { DataService, NanoID } from './data.server';
import { BuildingIdentifier, EmpireEntity, EmpireService, emptyEmpire, Types } from './app/engine';
import { EmpireJSON } from '@phlame/engine';

type SID = NanoID;

export type Session = {
  sid: SID;
  empire: EmpireEntity;
};
export type PersistedSession = {
  sid: SID;
  zeit: Zeit;
  empire: EmpireJSON<Types, BuildingIdentifier>;
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
      persistence.saveZeit(this.time);
    }
    return this;
  }

  async load(sid: string) {
    const zeit = this.#zeit();
    const persistence = this.#persistence();
    const {
      zeit: { time, tick },
      empire,
    } = await persistence.loadSession(sid);
    console.log('Loading', tick, 'from', time, sid, empire);
    /* if (tick && tick !== zeit.tick) {
      zeit.stop();
      // TODO catch up ticks
      zeit.start(time, tick);
    }*/
    this.#empire().setupFromJSON(empire);
  }

  async generateSession() {
    const persistence = this.#persistence();
    const sid = persistence.generateID();
    const eid = persistence.generateID();
    const pid = persistence.generateID();
    const session = this.createSession(sid, eid, pid);
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

  createSession(sid: string, eid: string, pid: string): Session {
    const empire = emptyEmpire(eid, pid);
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
