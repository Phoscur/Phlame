import { expect } from "chai";

import Empire from "./Empire";

describe("Empire Entity", () => {
  it("should be console printable", () => {
    const empire = new Empire("Empire");
    expect(empire.toString()).to.eql("Empire");
  });
});
