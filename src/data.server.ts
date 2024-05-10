import { mkdir, readFile, stat, writeFile } from 'fs/promises';
import { join } from 'path';

const FOLDER = './data';
// TODO? one file per session?
const GAME_FILE = join(FOLDER, 'game.json');

async function exists(path: string) {
  return stat(path).catch(() => false);
}

/**
 * Basic Data Persistence (File)
 * TODO? use an ORM or at least sqlite?
 */
export class DataService {
  async save(game: object) {
    await writeFile(GAME_FILE, JSON.stringify(game));
  }

  async load() {
    if (!(await exists(GAME_FILE))) {
      return;
    }
    const json = await readFile(GAME_FILE);
    return JSON.parse(json.toString());
  }

  async init() {
    if (!(await exists(FOLDER))) {
      await mkdir(FOLDER);
      return true;
    }
    return false;
  }
}
