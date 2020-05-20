
import { ResourceIdentifier } from "./Resource";
import Stock from "./Stock";

export default class ResourceCalculation<Types extends ResourceIdentifier> {
  stock: Stock<Types>;

  constructor(stock: Stock<Types>) {
    this.stock = stock;
  }

  toString() {
    return `Resources[${this.stock}]`;
  }
}
