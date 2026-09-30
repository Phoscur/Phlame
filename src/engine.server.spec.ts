import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm, readFile, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { Injector } from '@joist/di';
import { EngineService } from './engine.server';
import { Data } from './data.server';
import { ConsoleDebug, Debug } from './app/debug.element';

/**
 * Exercises the v2 save round trip and the dev/test verify-on-load. Uses the real Data
 * class pointed at a throwaway tmpdir (Data.FOLDER is a static), wiring EngineService
 * through the Injector the way engine.server.ts's startup() does.
 */
describe('EngineService v2 persistence', () => {
  const originalFolder = Data.FOLDER;
  let folder: string;

  async function newEngine(environment = 'test') {
    const injector = new Injector({ providers: [[Debug, { use: ConsoleDebug }]] });
    const engine = injector.inject(EngineService);
    await engine.start(environment);
    return engine;
  }

  function sessionFile(sid: string) {
    return new Data('test').sessionFileNameByID(sid);
  }

  beforeEach(async () => {
    folder = await mkdtemp(join(tmpdir(), 'phlame-save-'));
    Data.FOLDER = folder;
  });

  afterEach(async () => {
    Data.FOLDER = originalFolder;
    await rm(folder, { recursive: true, force: true });
  });

  it('round-trips a generated session through save and load', async () => {
    const engine = await newEngine();
    const session = await engine.generateSession();

    const loaded = await engine.loadEmpire(session.sid);
    expect(loaded.toJSON()).toEqual(session.empire.toJSON());
  });

  it('refuses a v1-shaped save with code 401', async () => {
    const engine = await newEngine();
    const sid = new Data('test').generateID();
    // the legacy v1 shape `{ sid, zeit, empire }`: no version, no genesis (ADR 0011)
    await writeFile(
      sessionFile(sid),
      JSON.stringify({ sid, zeit: Data.zeroTime, empire: { id: sid, entities: [], log: [] } }),
    );

    await expect(engine.loadEmpire(sid)).rejects.toMatchObject({ code: 401 });
  });

  it('refuses a save whose snapshot disagrees with its replay', async () => {
    const engine = await newEngine();
    const session = await engine.generateSession();

    // hand-tamper the persisted snapshot so it no longer matches genesis + log replay
    const file = sessionFile(session.sid);
    const persisted = JSON.parse((await readFile(file)).toString());
    persisted.save.empire.id = `${persisted.save.empire.id}-tampered`;
    await writeFile(file, JSON.stringify(persisted));

    await expect(engine.loadEmpire(session.sid)).rejects.toMatchObject({
      code: 401,
      message: expect.stringContaining('replay mismatch'),
    });
  });
});
