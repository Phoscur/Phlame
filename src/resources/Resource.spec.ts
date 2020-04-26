import { expect } from "chai";

import Resource from "./Resource";

describe("Resource ValueObject", () => {
  it("should be console printable", () => {
    Resource.types.push("irrelevant");
    const resource = new Resource("irrelevant", 0);
    expect(resource.toString()).to.eql("Resource[0irrelevant]");
  });
});
