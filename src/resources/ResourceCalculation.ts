
import Stock from "./Stock";

export default class ResourceCalculation<Types> {
  stock: Stock<Types>;

  constructor(stock: Stock<Types>) {
    this.stock = stock;
  }

  toString() {
    return `Resources[${this.stock}]`;
  }
}
