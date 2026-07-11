import { describe, it, expect } from 'vite-plus/test';
import { Data, isValidSID } from './data.server';
import type { PersistedSession } from './engine.server';

describe('isValidSID', () => {
  it('accepts generated session IDs', () => {
    const data = new Data('test');
    for (let i = 0; i < 20; i++) {
      expect(isValidSID(data.generateID())).toBe(true);
    }
  });

  it('rejects malformed and traversal-style IDs', () => {
    expect(isValidSID('')).toBe(false);
    expect(isValidSID('SHORT')).toBe(false);
    expect(isValidSID('TOOLONGTOBEVALID')).toBe(false);
    expect(isValidSID('abcdefgh')).toBe(false); // lowercase not in alphabet
    expect(isValidSID('/../../foo')).toBe(false);
    expect(isValidSID('..\\..\\zeit')).toBe(false);
    expect(isValidSID('A/../A/..')).toBe(false);
  });
});

describe('Data session ID validation', () => {
  const data = new Data('test');
  const traversal = '/../../zeit';

  it('rejects loading a session with a traversal sid before touching the filesystem', async () => {
    await expect(data.loadSession(traversal)).rejects.toMatchObject({ code: 404 });
  });

  it('reports traversal sids as non-existent sessions', async () => {
    expect(await data.sessionExists(traversal)).toBe(false);
  });

  it('rejects saving a session with an invalid sid', async () => {
    const session = { sid: traversal, zeit: Data.zeroTime, empire: {} } as PersistedSession;
    await expect(data.saveSession(session)).rejects.toMatchObject({ code: 404 });
  });
});
