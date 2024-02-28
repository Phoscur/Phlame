import { stock, requirements, prosumption, ResourceLike } from "./examples";
import Building, { BuildingIdentifier } from "./Building";
import { ResourceCollection } from "./resources";
import { SaltyResource, TumbleResource } from "./resources/examples";

describe("Building", () => {
  it("should be console printable", () => {
    const b = new Building<BuildingIdentifier, ResourceLike>("B", requirements, prosumption);
    expect(b.toString()).to.eql("Building(B, 0, 100%)");
  });

  it("should have resources, costs and speed", () => {
    const speed = 50;
    const level = 5;
    const building = new Building<BuildingIdentifier, ResourceLike>(
      "Scraper",
      requirements,
      prosumption,
      level,
      speed,
    );
    const mine = new Building<BuildingIdentifier, ResourceLike>(
      1,
      requirements,
      prosumption,
      level,
      speed,
    );
    expect(building.toString()).to.eql("Building(Scraper, 5, 50%)");
    expect(building.upgraded.toString()).to.eql("Building(Scraper, 6, 50%)");
    expect(building.downgraded.toString()).to.eql("Building(Scraper, 4, 50%)");
    expect(building.at(100).toString()).to.eql("Building(Scraper, 5, 100%)");
    expect(() => {
      expect(building.upgradeCost).to.eql(undefined);
    }).to.throw("Unknown building requirement, BuildingType: Scraper");
    expect(() => {
      expect(building.downgradeCost).to.eql(undefined);
    }).to.throw("Unknown building requirement, BuildingType: Scraper");

    expect(mine.toString()).to.eql("Building(1, 5, 50%)");
    expect(mine.upgradeCost).to.eql(
      ResourceCollection.fromArray([new TumbleResource(683), new SaltyResource(170)]),
    );
    expect(mine.downgradeCost).to.eql(
      ResourceCollection.fromArray([new TumbleResource(341), new SaltyResource(79)]),
    );
    expect(mine.upgradeTime).to.eql(20);
    expect(mine.downgradeTime).to.eql(10);
  });

  it("should be a prosumer", () => {
    const b = new Building<BuildingIdentifier, ResourceLike>(12, requirements, prosumption, 1, 50);
    const bnot = new Building<BuildingIdentifier, ResourceLike>(12, requirements, {}, 1, 0);
    expect(b.prosumes(stock).toString()).to.eql(
      "Prosumer(12, 50%, ResourceProcessCollection[15blubbs-5, 0energy+25])",
    );
    expect(bnot.prosumes(stock).toString()).to.eql("Prosumer(12, 0%, ResourceProcessCollection[])");
  });

  it("should ignore over- and underspeed", () => {
    const b = new Building<BuildingIdentifier, ResourceLike>(
      "B",
      requirements,
      prosumption,
      1,
      -200,
    );
    const b2 = new Building<BuildingIdentifier, ResourceLike>(
      "B",
      requirements,
      prosumption,
      1,
      200,
    );
    expect(b.toString()).to.eql("Building(B, 1, 0%)");
    expect(b2.toString()).to.eql("Building(B, 1, 100%)");
  });
});
