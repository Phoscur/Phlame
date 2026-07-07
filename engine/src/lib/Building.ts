import type { ResourceIdentifier } from './resources/Resource';
import type { BuildingIdentifier } from './Phormulae';

// BuildingIdentifier moved to Phormulae.ts (ADR 0015), re-exported here for compatibility
export type { BuildingIdentifier } from './Phormulae';

export interface BuildingJSON<Type extends BuildingIdentifier> {
  type: Type;
  level: number;
  speed: number;
};

/**
 * Building - pure state, exactly its JSON: type, level, speed (ADR 0015)
 * Costs, build times and prosumption are computed by the Economy interpreting
 * the Phormulae; ResourceType stays a type parameter only for API symmetry
 * with Economy/Phlame/Empire.
 */
export class Building<
  _ResourceType extends ResourceIdentifier,
  BuildingType extends BuildingIdentifier,
> {
  constructor(
    readonly type: BuildingType,
    readonly level = 0,
    readonly speed = 100,
  ) {
    const defaultSpeed = speed >= 100 ? 100 : speed;
    this.speed = defaultSpeed <= 0 ? 0 : defaultSpeed;
  }

  protected new(level?: number, speed?: number): Building<_ResourceType, BuildingType> {
    return new Building(this.type, level, speed);
  }

  get upgraded(): Building<_ResourceType, BuildingType> {
    return this.new(this.level + 1, this.speed);
  }

  get downgraded(): Building<_ResourceType, BuildingType> {
    return this.new(this.level - 1, this.speed);
  }

  at(speed: number): Building<_ResourceType, BuildingType> {
    return this.new(this.level, speed);
  }

  get disabled(): Building<_ResourceType, BuildingType> {
    return this.at(0);
  }

  toString(): string {
    return `Building(${this.type}, ${this.level}, ${this.speed}%)`;
  }

  toJSON(): BuildingJSON<BuildingType> {
    const { type, level, speed } = this;
    return { type, level, speed };
  }
}
