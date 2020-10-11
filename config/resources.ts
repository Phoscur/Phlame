
/* eslint max-classes-per-file: "off" */
import Resource, { BaseResources } from "../src/resources/Resource";
import ResourceCollection from "../src/resources/ResourceCollection";
import Energy from "../src/resources/Energy";

export enum ResourceTypes {
  // ...BaseResources,
  Metal = "metal",
  Crystal = "crystal",
  Deuterium = "deuterium",
  Energy = "energy", // === BaseResources.Energy
}

export type Types = ResourceTypes | BaseResources;

// Add new resources to known resource types
const newResourceTypes: Types[] = [
  ResourceTypes.Metal,
  ResourceTypes.Crystal,
  ResourceTypes.Deuterium,
];
Resource.types.push(...newResourceTypes);

export class Metal extends Resource<ResourceTypes.Metal> {
  constructor(amount: number) {
    super(ResourceTypes.Metal, amount);
  }
}

export class Crystal extends Resource<ResourceTypes.Crystal> {
  constructor(amount: number) {
    super(ResourceTypes.Crystal, amount);
  }
}

export class Deuterium extends Resource<ResourceTypes.Deuterium> {
  constructor(amount: number) {
    super(ResourceTypes.Deuterium, amount);
  }
}

export class Electricity extends Energy<ResourceTypes.Energy> {
  constructor(amount: number) {
    super(ResourceTypes.Energy, amount);
  }
}

export type ResourceType = Metal | Crystal | Deuterium | Electricity | BaseResources;

export function fromArray(entries = []): ResourceCollection<Types> {
  return ResourceCollection.fromArray(entries);
}
