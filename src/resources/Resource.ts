
export default class Resource {
  static types = ["null"];

  readonly type: string;

  readonly amount: number; // int32

  constructor(type: string, amount: number) {
    // Instead of throwing an error, set resource amount to zero on underflow
    // TODO handle overflow? use BigIntegers?
    this.amount = amount < 0 ? 0 : amount | 0; // int32|0 handling is very fast in v8
    // Default to null type (!~ = not found)
    this.type = !~Resource.types.indexOf(type) ? Resource.types[0] : type;
  }

  get prettyAmount(): string {
    return `${this.amount}${this.type}`;
  }

  toString() {
    return `Resource[${this.prettyAmount}]`;
  }
}
