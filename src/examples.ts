
import examples, { Types, ResourceTypes } from "./resources/examples";
import { Stock, ResourceCollection } from "./resources";
import Empire from "./Empire";
import Building, { BuildingType, ProsumptionLookup } from "./Building";
import BuildingRequirement from "./BuildingRequirement";

const { t3, s3 } = examples;
export const requirements: BuildingRequirement<Types>[] = [];
export const prosumption: ProsumptionLookup<BuildingType> = {
  12: {
    [ResourceTypes.Blubber]: (lvl: number) => {
      return -10 * lvl * lvl ** 1.1;
    },
    [ResourceTypes.Electricity]: (lvl: number) => {
      return 50 * lvl * lvl ** 1.1;
    },
  },
};
const b = new Building("B", requirements, prosumption, 1, 1);
const buildings: Building[] = [b];
export const resourceCollection = ResourceCollection.fromArray<Types>([t3, s3]);
const stock = new Stock<Types>(resourceCollection);

const empire = new Empire("Phlameland", stock, buildings);

export default empire;
