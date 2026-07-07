import { BaseResources, Phormulae, Resource, Energy, Building, BuildingRequirement, EnergyCalculation } from '..';

describe('Phormulae', () => {
  it('should default to the base rules', () => {
    const rules = new Phormulae();
    expect(rules.resourceTypes).toEqual([BaseResources.Null]);
    expect(rules.energyTypes).toEqual([BaseResources.Null]);
    expect(rules.buildTimeDivisor).toBe(2500 / 60);
    expect(rules.downgradeCostDivisor).toBe(2);
    expect(rules.rebalancingExponent).toBe(1.1);
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

  it('should serialize canonically for the rules hash', () => {
    const rules = new Phormulae(['gold'], [], 40, 2, 1.1);
    expect(JSON.parse(JSON.stringify(rules))).toEqual({
      resourceTypes: ['null', 'gold'],
      energyTypes: ['null'],
      buildTimeDivisor: 40,
      downgradeCostDivisor: 2,
      rebalancingExponent: 1.1,
    });
  });

  it('should back the deprecated static shims through Phormulae.current', () => {
    const previous = Phormulae.use(
      new Phormulae(['gold'], ['steam'], 100, 4, 1.5),
    );
    try {
      expect(Resource.types).toEqual([BaseResources.Null, 'gold']);
      expect(Energy.types).toEqual([BaseResources.Null, 'steam']);
      expect(Building.BUILD_TIME_DIVISOR).toBe(100);
      expect(BuildingRequirement.DOWNGRADECOST_DIVISOR).toBe(4);
      expect(EnergyCalculation.REBALANCING_EXPONENT).toBe(1.5);
      // unknown types still fall back to Null, now Phormulae-driven
      expect(new Resource('silver', 5).type).toBe(BaseResources.Null);
      expect(new Resource('gold', 5).type).toBe('gold');
    } finally {
      Phormulae.use(previous);
    }
  });

  it('should not register example fixture types on barrel import', () => {
    // regression for the fixture leak (ADR 0014): importing '@phlame/engine' used to
    // push tumbles/salties/blubbs into the registries via the examples export;
    // this spec deliberately never imports the examples module
    expect(Resource.types).toEqual([BaseResources.Null]);
    expect(Energy.types).toEqual([BaseResources.Null]);
  });
});
