import type { ResourceIdentifier } from './resources/Resource';
import type { PhelopmentIdentifier } from './Phormulae';

// PhelopmentIdentifier moved to Phormulae.ts (ADR 0015), re-exported here for compatibility
export type { PhelopmentIdentifier } from './Phormulae';

export interface PhelopmentJSON<Type extends PhelopmentIdentifier> {
  type: Type;
  level: number;
  speed: number;
};

/**
 * Phelopment - pure state, exactly its JSON: type, level, speed (ADR 0015)
 * Costs, build times and prosumption are computed by the Economy interpreting
 * the Phormulae; ResourceType stays a type parameter only for API symmetry
 * with Economy/Phlame/Empire.
 */
export class Phelopment<
  _ResourceType extends ResourceIdentifier,
  PhelopmentType extends PhelopmentIdentifier,
> {
  constructor(
    readonly type: PhelopmentType,
    readonly level = 0,
    readonly speed = 100,
  ) {
    const defaultSpeed = speed >= 100 ? 100 : speed;
    this.speed = defaultSpeed <= 0 ? 0 : defaultSpeed;
  }

  protected new(level?: number, speed?: number): Phelopment<_ResourceType, PhelopmentType> {
    return new Phelopment(this.type, level, speed);
  }

  get upgraded(): Phelopment<_ResourceType, PhelopmentType> {
    return this.new(this.level + 1, this.speed);
  }

  get downgraded(): Phelopment<_ResourceType, PhelopmentType> {
    return this.new(this.level - 1, this.speed);
  }

  at(speed: number): Phelopment<_ResourceType, PhelopmentType> {
    return this.new(this.level, speed);
  }

  get disabled(): Phelopment<_ResourceType, PhelopmentType> {
    return this.at(0);
  }

  toString(): string {
    return `Phelopment(${this.type}, ${this.level}, ${this.speed}%)`;
  }

  toJSON(): PhelopmentJSON<PhelopmentType> {
    const { type, level, speed } = this;
    return { type, level, speed };
  }
}
