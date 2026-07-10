import {
  BaseResources,
  Phormula,
  Phormulae,
  PhelopmentRequirement,
  ResourceCollection,
} from '..';

describe('Phormulae', () => {
  it('should default to the base rules', () => {
    const rules = new Phormulae();
    expect(rules.resourceTypes).toEqual([BaseResources.Null]);
    expect(rules.energyTypes).toEqual([BaseResources.Null]);
    expect(rules.buildTimeDivisor).toBe(2500 / 60);
    expect(rules.downgradeCostDivisor).toBe(2);
    expect(rules.rebalancingExponent).toBe(1.1);
    expect(rules.requirements).toEqual({});
    expect(rules.prosumptions).toEqual({});
  });

  it('should register types immutably', () => {
    const rules = new Phormulae();
    const withGold = rules.withResourceTypes('gold').withEnergyTypes('steam');
    expect(withGold.resourceTypes).toEqual([BaseResources.Null, 'gold']);
    expect(withGold.energyTypes).toEqual([BaseResources.Null, 'steam']);
    // the original stays untouched (ADR 0005)
    expect(rules.resourceTypes).toEqual([BaseResources.Null]);
    expect(rules.energyTypes).toEqual([BaseResources.Null]);
  });

  it('should always keep the Null type as constructor fallback', () => {
    const rules = new Phormulae(['gold'], ['steam']);
    expect(rules.resourceTypes[0]).toBe(BaseResources.Null);
    expect(rules.energyTypes[0]).toBe(BaseResources.Null);
  });

  it('should carry requirements and prosumption Phormulae (ADR 0015)', () => {
    const requirement = new PhelopmentRequirement<string, string>(
      'mine',
      ResourceCollection.fromArray([]),
      1.5,
      [],
    );
    const rules = new Phormulae(['gold'])
      .withRequirements({ mine: requirement })
      .withProsumptions({ mine: { gold: Phormula.polynomial(30) } });

    expect(rules.requirementFor('mine')).toBe(requirement);
    expect(() => rules.requirementFor('lab')).toThrow(
      'Unknown phelopment requirement, PhelopmentType: lab',
    );
    expect(rules.prosumptionFor('mine').gold?.at(1)).toBe(30);
    expect(rules.prosumptionFor('lab')).toEqual({});
  });

  it('should serialize canonically for the rules hash', () => {
    const rules = new Phormulae(['gold'], [], 40, 2, 1.1).withProsumptions({
      mine: { gold: Phormula.polynomial(30) },
    });
    expect(JSON.parse(JSON.stringify(rules))).toEqual({
      resourceTypes: ['null', 'gold'],
      energyTypes: ['null'],
      buildTimeDivisor: 40,
      downgradeCostDivisor: 2,
      rebalancingExponent: 1.1,
      minBuildTime: 2,
      queueSlots: { kind: 'constant', value: 5 },
      requirements: {},
      prosumptions: {
        mine: { gold: { kind: 'polynomial', coefficient: 30, exponent: 1.1 } },
      },
    });
  });

  it('rules the build queue capacity as a Phormula', () => {
    expect(new Phormulae().queueSlots.at(0)).toBe(5);
    // a future phelopment can drive it: e.g. constant base via level-polynomial config
    const roomy = new Phormulae([], [], 40, 2, 1.1, 2, Phormula.constant(9));
    expect(roomy.queueSlots.at(0)).toBe(9);
  });

  it('carries the rebalancing exponent as data (no static shim)', () => {
    // the global Phormulae.current and the Resource.types/Energy.types shims are gone;
    // rules are injected explicitly (ADR 0014, injection complete)
    expect(new Phormulae([], [], 40, 2, 1.5).rebalancingExponent).toBe(1.5);
  });
});
