
import Stock from "./Stock";

export default class ResourceCalculation {
  stock: Stock;

  constructor(stock: Stock) {
    this.stock = stock;
  }

  toString() {
    return `Resources[${this.stock}]`;
  }
}
