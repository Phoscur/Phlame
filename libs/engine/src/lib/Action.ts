import { TimeUnit } from "./resources";
import Entity from "./Entity.interface";
//interface ValueObject {}
type ValueObject = {
  [property: string]: number | string;
};

export enum ActionTypes {
  CREATE = "create",
  UPDATE = "update",
}
export default interface Action<Type extends ActionTypes> {
  type: Type;
  concerns: Entity;
  consequence: {
    at: TimeUnit; // ticks
    type: Type; // event trigger
    payload: ValueObject;
  };
}
