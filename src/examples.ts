
import examples, { Types, ResourceTypes, EnergyTypes } from "./resources/examples";
import { Stock, ResourceCollection } from "./resources";
import Empire from "./Empire";
import Building, { BuildingType, ProsumptionLookup } from "./Building";
import BuildingRequirement from "./BuildingRequirement";

const { t3, s3, b15 } = examples;
export const requirements: BuildingRequirement<Types>[] = [];
export const prosumption: ProsumptionLookup<BuildingType> = {
  0: {
    [ResourceTypes.Tumble]: () => { return 0; },
    [ResourceTypes.Salty]: () => { return 0; },
  },
  12: {
    [ResourceTypes.Blubber]: (lvl: number) => {
      return -10 * lvl * lvl ** 1.1;
    },
    [EnergyTypes.Electricity]: (lvl: number) => {
      return 50 * lvl * lvl ** 1.1;
    },
  },
};
const b = new Building(12, requirements, prosumption, 1, 100);
const b0 = new Building(0, requirements, prosumption, 1, 0);
export const buildings: Building<Types>[] = [b, b0];
export const resourceCollection = ResourceCollection.fromArray<Types>([t3, s3, b15]);
export const stock = new Stock<Types>(resourceCollection);

const empire = new Empire("Phlameland", stock, buildings);

export default empire;
