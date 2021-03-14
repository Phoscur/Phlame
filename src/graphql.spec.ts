import { expect } from "chai";
import graph from "./graphql";

describe("GraphQL Interface", () => {
  it("should respond to queries", async () => {
    const gql = "{ hello }";
    expect(await graph.query(gql)).to.be.eql({
      data: {
        hello: "world",
      },
    });
  });
});
