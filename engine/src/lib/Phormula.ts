export type PhormulaJSON =
  | { kind: 'zero' }
  | { kind: 'constant'; value: number }
  | { kind: 'polynomial'; coefficient: number; exponent: number };

export type PhormulaKind = PhormulaJSON['kind'];

/**
 * Phormula - a single game formula as data (ADR 0015)
 * Kind-discriminated so it stays canonically serializable (functions don't hash);
 * new kinds extend the union (e.g. an environment-aware one for temperature factors).
 * Deliberately import-free: Phormulae and its Phormula are the hashable rule document,
 * the Economy layer interprets them (ADR 0011/0014).
 */
export class Phormula {
  protected constructor(
    readonly kind: PhormulaKind,
    readonly coefficient = 0,
    readonly exponent = 1.1,
  ) {}

  static zero(): Phormula {
    return new Phormula('zero');
  }

  /**
   * A level-independent rule value (e.g. base queue slots) - stored in the
   * coefficient field, serialized as `value`
   */
  static constant(value: number): Phormula {
    return new Phormula('constant', value);
  }

  /**
   * The shape of (so far) every growth formula: `coefficient * level * level ** exponent`
   * A negative coefficient models consumption.
   */
  static polynomial(coefficient: number, exponent = 1.1): Phormula {
    return new Phormula('polynomial', coefficient, exponent);
  }

  static fromJSON(json: PhormulaJSON): Phormula {
    switch (json.kind) {
      case 'zero':
        return Phormula.zero();
      case 'constant':
        return Phormula.constant(json.value);
      case 'polynomial':
        return Phormula.polynomial(json.coefficient, json.exponent);
    }
  }

  /**
   * Evaluate the formula at a phelopment level (rate per tick, not yet rounded -
   * ResourceProcess owns the integer cast, ADR 0003)
   */
  at(level: number): number {
    switch (this.kind) {
      case 'zero':
        return 0;
      case 'constant':
        return this.coefficient;
      case 'polynomial':
        return this.coefficient * level * level ** this.exponent;
    }
  }

  toString(): string {
    switch (this.kind) {
      case 'zero':
        return 'Phormula[0]';
      case 'constant':
        return `Phormula[${this.coefficient}]`;
      case 'polynomial':
        return `Phormula[${this.coefficient}*lvl^(1+${this.exponent})]`;
    }
  }

  toJSON(): PhormulaJSON {
    switch (this.kind) {
      case 'zero':
        return { kind: this.kind };
      case 'constant':
        return { kind: this.kind, value: this.coefficient };
      case 'polynomial': {
        const { kind, coefficient, exponent } = this;
        return { kind, coefficient, exponent };
      }
    }
  }
}
