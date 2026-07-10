import { phingerprint, canonicalJSON, Phormulae, Phormula, PhelopmentRequirement, ResourceCollection } from '..';

describe('Phingerprint', () => {
  it('should sort object keys but keep array order', () => {
    expect(canonicalJSON({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
    expect(canonicalJSON([3, 1, 2])).toBe('[3,1,2]');
    expect(canonicalJSON({ x: [{ q: 1, p: 2 }] })).toBe('{"x":[{"p":2,"q":1}]}');
  });

  it('should be deterministic and order-independent', () => {
    const a = phingerprint({ one: 1, two: 2 });
    const b = phingerprint({ two: 2, one: 1 });
    expect(a).toBe(b);
    expect(phingerprint({ one: 1, two: 2 })).toBe(a); // stable across calls
  });

  it('should be an 8-char hex string, sensitive to any change', () => {
    const base = phingerprint({ n: 1 });
    expect(base).toMatch(/^[0-9a-f]{8}$/);
    expect(phingerprint({ n: 2 })).not.toBe(base);
  });

  describe('as universe identity of a Phormulae (ADR 0011)', () => {
    it('changes with any rule, ignores authoring order', () => {
      const requirement = new PhelopmentRequirement<string, string>(
        'mine',
        ResourceCollection.fromArray([]),
        1.5,
        [],
      );
      const rulesA = new Phormulae(['gold', 'iron'], ['steam'])
        .withRequirements({ mine: requirement })
        .withProsumptions({ mine: { gold: Phormula.polynomial(30) } });
      // same content, requirements/prosumptions added in a different order
      const rulesB = new Phormulae(['gold', 'iron'], ['steam'])
        .withProsumptions({ mine: { gold: Phormula.polynomial(30) } })
        .withRequirements({ mine: requirement });

      expect(rulesA.phingerprint).toBe(rulesB.phingerprint);

      // a balancing tweak yields a different universe
      const tweaked = new Phormulae(['gold', 'iron'], ['steam'], 40)
        .withRequirements({ mine: requirement })
        .withProsumptions({ mine: { gold: Phormula.polynomial(31) } });
      expect(tweaked.phingerprint).not.toBe(rulesA.phingerprint);
    });

    it('treats type registries as sets (order does not change identity)', () => {
      const a = new Phormulae(['gold', 'iron'], ['steam', 'heat']);
      const b = new Phormulae(['iron', 'gold'], ['heat', 'steam']);
      expect(a.phingerprint).toBe(b.phingerprint);
      // but a genuinely different type set is a different universe
      expect(new Phormulae(['gold'], []).phingerprint).not.toBe(a.phingerprint);
    });
    it('is stable for the base rules (golden value guards against algorithm drift)', () => {
      // changed 2026-07: queueSlots joined the rules - new rules, new universe (ADR 0011)
      expect(new Phormulae().phingerprint).toBe('a63662e2');
    });
  });
});
