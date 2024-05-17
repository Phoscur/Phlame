import { customAlphabet } from 'nanoid';
import { mkdir, readFile, stat, writeFile } from 'fs/promises';
import { join } from 'path';
import { Zeit } from './app/signals/zeitgeber';
import { PersistedSession } from './engine.server';

const NANOID_ALPHABET = '123456789ABCDFGHJKLMNQRSTVWXYZ'; // 3M IDs 1% - check collision chances https://zelark.github.io/nano-id-cc/
const nanoid = customAlphabet(NANOID_ALPHABET, 8);

const FOLDER = './data';
const ZEIT_FILE = join(FOLDER, 'zeit.json');
const sessionFile = (sid: string) => join(FOLDER, `${sid}.json`);

const zeroTime: Zeit = { time: 0, tick: 0 };

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
export class DataService {
  async saveZeit(zeit: Zeit) {
    await this.save(ZEIT_FILE, zeit);
  }

  async saveSession(session: PersistedSession) {
    await this.save(sessionFile(session.sid), session);
  }

  async sessionExists(sid: NanoID) {
    return this.exists(sessionFile(sid));
  }

  async save(fileName: string, data: object) {
    console.log('Saving', fileName, data);
    await writeFile(fileName, JSON.stringify(data));
  }

  async loadZeit() {
    const json = await this.load(ZEIT_FILE);
    if (!json) {
      return zeroTime;
    }
    return json;
  }

  async loadSession(sid: NanoID): Promise<PersistedSession> {
    return this.load(sessionFile(sid));
  }

  /**
   * @throws NotFoundError|SessionCorruptError
   * @param fileName
   * @returns {PersistedSession}
   */
  async load(fileName: string) {
    if (!(await this.exists(fileName))) {
      throw new NotFoundError(`Not found: ${fileName}`);
    }
    try {
      const json = await readFile(fileName);
      return JSON.parse(json.toString());
    } catch (e: any) {
      throw new SessionCorruptError(`Session corrupt: ${fileName} - ${e}`);
    }
  }

  async init() {
    if (!(await this.exists(FOLDER))) {
      await mkdir(FOLDER);
      return true;
    }
    return false;
  }

  generateID() {
    return nanoid();
  }

  async exists(path: string) {
    return stat(path).catch(() => false);
  }
}

export type NanoID = string;
