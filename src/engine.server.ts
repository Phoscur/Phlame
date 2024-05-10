import { injectable, inject, Injector } from '@joist/di';
import { Zeit, Zeitgeber } from './app/signals/zeitgeber';
import { Debug } from './app/debug.element';
import { DataService } from './data.server';
import { EmpireEntity, EmpireService, emptyEmpire } from './app/engine';

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

  start() {
    const zeit = this.#zeit();
    this.#logger().log('Start', zeit.tick, zeit.time);
    zeit.start();
    return this;
  }

  async load(sid: string, eid: string) {
    const zeit = this.#zeit();
    const persistence = this.#persistence();
    const empire = this.#empire();
    if (await persistence.init()) {
      // first start
      const session = this.createSession(sid, eid);
      await persistence.save({
        ...this.time,
        game: {
          [sid]: session.empire,
        },
      });
      empire.setup(session.empire, session.empire.entities);
    } else {
      const { time, tick, game } = await persistence.load();
      console.log('Loading', tick, 'from', time, sid, eid, game);
      if (tick && tick !== zeit.tick) {
        zeit.stop();
        // TODO catch up ticks
        zeit.start(time, tick);
      }
      empire.setupFromJSON(game[sid].id, game[sid].entities);
    }
  }

  createSession(sid: string, eid: string) {
    //const factory = this.#factory();const empire = factory.createEmpire(eid);
    const data = this.#persistence();
    const empire = emptyEmpire(eid, data.generateID());
    return {
      sid,
      empire,
    };
  }
}

/**
 * TODO? this probably won't stay Singleton
 * One injector per open socket?
 * Injector lifetime?
 */
export const engineInjector = new Injector();
