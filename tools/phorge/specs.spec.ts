import { describe, it, expect } from 'vite-plus/test';
import { listSpecs, resolveSpec, type SpecList } from './specs';

describe('spec discovery', () => {
  it('finds its own spec files in the live tree (self-hosting)', async () => {
    // default root = cwd, the same assumption production makes (vitest runs
    // from the repo root, /phlame in the runner container)
    const specs = await listSpecs();
    expect(specs.app).toContain('tools/phorge/specs.spec.ts');
    expect(specs.app).toContain('tools/phorge/plan.spec.ts');
    expect(specs.engine).toContain('engine/src/index.spec.ts');
    expect(specs.e2e).toContain('tests/screenshot.spec.ts');
    // vite's cacheDir lives under src/app/node_modules — never a spec source
    expect(specs.app.some((p) => p.includes('node_modules'))).toBe(false);
  });
});

describe('spec resolution (set membership, not regex)', () => {
  const specs: SpecList = {
    app: ['src/actions.spec.ts', 'tools/phorge/plan.spec.ts'],
    engine: ['engine/src/index.spec.ts', 'engine/src/lib/Empire.spec.ts'],
    e2e: ['tests/build.spec.ts', 'tests/i18n.spec.ts'],
  };

  it('resolves exact paths, normalizing separators', () => {
    expect(resolveSpec('tools/phorge/plan.spec.ts', specs, 'test')).toEqual({
      kind: 'app',
      path: 'tools/phorge/plan.spec.ts',
    });
    expect(resolveSpec('.\\engine\\src\\index.spec.ts', specs, 'test')).toEqual({
      kind: 'engine',
      path: 'engine/src/index.spec.ts',
    });
  });

  it('resolves a unique basename as a convenience', () => {
    expect(resolveSpec('plan.spec.ts', specs, 'test')).toEqual({
      kind: 'app',
      path: 'tools/phorge/plan.spec.ts',
    });
    expect(resolveSpec('build.spec.ts', specs, 'e2e').path).toBe('tests/build.spec.ts');
  });

  it('scopes by verb: e2e never resolves vitest specs and vice versa', () => {
    expect(() => resolveSpec('plan.spec.ts', specs, 'e2e')).toThrow(/Unknown e2e spec/);
    expect(() => resolveSpec('tests/build.spec.ts', specs, 'test')).toThrow(/Unknown test spec/);
  });

  it('fails loudly on a miss, listing the known specs (error doubles as discovery)', () => {
    expect(() => resolveSpec('nope.spec.ts', specs, 'test')).toThrow(
      /Unknown test spec 'nope\.spec\.ts' — known: .*plan\.spec\.ts/,
    );
  });

  it('rejects invented paths and traversal — membership is the whole check', () => {
    expect(() => resolveSpec('../secrets.spec.ts', specs, 'test')).toThrow(/Unknown/);
    expect(() => resolveSpec('src/actions.spec.ts --reporter=json', specs, 'test')).toThrow(
      /Unknown/,
    );
  });

  it('reports ambiguity instead of guessing', () => {
    const ambiguous: SpecList = {
      app: ['src/a/index.spec.ts'],
      engine: ['engine/src/index.spec.ts'],
      e2e: [],
    };
    expect(() => resolveSpec('index.spec.ts', ambiguous, 'test')).toThrow(/Ambiguous.*candidates/);
  });
});
