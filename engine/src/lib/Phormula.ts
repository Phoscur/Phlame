export type PhormulaJSON =
  | { kind: 'zero' }
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
      case 'polynomial':
        return this.coefficient * level * level ** this.exponent;
    }
  }

  toString(): string {
    switch (this.kind) {
      case 'zero':
        return 'Phormula[0]';
      case 'polynomial':
        return `Phormula[${this.coefficient}*lvl^(1+${this.exponent})]`;
    }
  }

  toJSON(): PhormulaJSON {
    switch (this.kind) {
      case 'zero':
        return { kind: this.kind };
      case 'polynomial': {
        const { kind, coefficient, exponent } = this;
        return { kind, coefficient, exponent };
      }
    }
  }
}
