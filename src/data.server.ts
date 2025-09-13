import { customAlphabet } from 'nanoid';
import { mkdir, readFile, stat, writeFile } from 'fs/promises';
import { join } from 'path';
import { Zeit } from './app/signals/zeitgeber';
import { PersistedSession } from './engine.server';

const NANOID_ALPHABET = '123456789ABCDFGHJKLMNQRSTVWXYZ'; // 3M IDs 1% - check collision chances https://zelark.github.io/nano-id-cc/
const nanoid = customAlphabet(NANOID_ALPHABET, 8);

class NotFoundError extends Error {
  public readonly code = 404;
}
class SessionCorruptError extends Error {
  public readonly code = 401;
}

/**
 * Basic Data Persistence (File)
 * TODO? use an ORM or at least sqlite?
 */
export class Data {
  static FOLDER = './data';
  static zeroTime: Zeit = { timeMS: 0, tick: 0 };

  get zeitFile() {
    return join(Data.FOLDER, 'zeit.json');
  }

  sessionFileNameByID(sid: string) {
    return join(Data.FOLDER, 'session', `${this.environment}-${sid}.json`);
  }

  constructor(public environment: string) {}

  async init(env: string) {
    this.environment = env;
    if (!(await this.exists(Data.FOLDER))) {
      await mkdir(Data.FOLDER);
      return true;
    }
    if (!(await this.exists(join(Data.FOLDER, 'session')))) {
      await mkdir(join(Data.FOLDER, 'session'));
      return true;
    }
    return false;
  }

  async saveZeit(zeit: Zeit) {
    await this.save(this.zeitFile, zeit);
  }

  async saveSession(session: PersistedSession) {
    await this.save(this.sessionFileNameByID(session.sid), session);
  }

  async sessionExists(sid: NanoID) {
    return this.exists(this.sessionFileNameByID(sid));
  }

  async save(fileName: string, data: object) {
    await writeFile(fileName, JSON.stringify(data, null, 2));
  }

  async loadZeit(): Promise<Zeit> {
    // TODO? would be great to have zod
    return this.load(this.zeitFile).catch(() => Data.zeroTime) as Promise<Zeit>;
  }
  async loadSession(sid: NanoID): Promise<PersistedSession> {
    // TODO? would be great to have zod
    return this.load(this.sessionFileNameByID(sid)) as Promise<PersistedSession>;
  }

  /**
   * @throws NotFoundError|SessionCorruptError
   */
  async load(fileName: string): Promise<object> {
    if (!(await this.exists(fileName))) {
      throw new NotFoundError(`Not found: ${fileName}`);
    }
    try {
      const json = await readFile(fileName);
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-return */
      return JSON.parse(json.toString());
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    } catch (e: any) {
      throw new SessionCorruptError(`Session corrupt: ${fileName} - ${e}`);
    }
  }

  generateID() {
    return nanoid();
  }

  async exists(path: string) {
    return stat(path).catch(() => false);
  }
}

export type NanoID = string;
