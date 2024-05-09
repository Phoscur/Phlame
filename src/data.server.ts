import { mkdir, readFile, stat, writeFile } from 'fs/promises';
import { join } from 'path';

const FOLDER = './data';
const GAME_FILE = join(FOLDER, 'game.json');

/**
 * Basic Data Persistence (File)
 * TODO? use an ORM or at least sqlite?
 */
export class DataService {
  async save(game: object) {
    await writeFile(GAME_FILE, JSON.stringify(game));
  }

  async load() {
    const json = await readFile(GAME_FILE);
    return JSON.parse(json.toString());
  }

  async init() {
    const exists = await stat(FOLDER).catch(() => false);
    if (!exists) await mkdir(FOLDER);
  }
}
