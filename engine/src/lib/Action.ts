import { TimeUnit } from './resources';

// it is a bit unwise to loosen the identifier type to string or number
// TODO? use nanoID: string xor number - I'm leaning towards strings for readability
// or just leave it to be constrained by the app to either...
export type ID = string | number;
export interface Entity {
  id: ID;
}

// TODO use `as const` instead of enum
export enum ActionTypes {
  CREATE = 'create',
  UPDATE = 'update',
}
export default interface Action<Type extends ActionTypes> {
  type: Type;
  concerns: Entity;
  consequence: {
    at: TimeUnit; // ticks
    type: Type; // event trigger
    payload: Record<string | number | symbol, unknown>;
  };
}
