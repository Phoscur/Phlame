
export default class Resource {
  readonly type: string;

  readonly amount: number;

  constructor(type: string, amount: number) {
    this.amount = amount;
    this.type = type;
  }

  get prettyAmount(): string {
    return `${this.amount}${this.type}`;
  }

  toString() {
    return `Resource[${this.prettyAmount}]`;
  }
}
