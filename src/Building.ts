
export type BuildingType = string | number; // I'd prefer string, but if we want integer unitIDs...

export default class Building {
  readonly type: BuildingType;

  readonly level: number;

  readonly speed: number;

  constructor(type: BuildingType, level?: number, speed?: number) {
    this.type = type;
    this.level = level || 0;
    const defaultSpeed = (!speed || speed >= 1) ? 1 : speed;
    this.speed = defaultSpeed <= 0 ? 0 : defaultSpeed;
  }

  protected new(level?: number, speed?: number) {
    return new Building(this.type, level, speed);
  }

  get upgraded() {
    return this.new(this.level + 1, this.speed);
  }

  get downgraded() {
    return this.new(this.level - 1, this.speed);
  }

  at(speed: number) {
    return this.new(this.level, speed);
  }

  toString() {
    return `Building(${this.type}, ${this.level}, ${this.speed})`;
  }
}
