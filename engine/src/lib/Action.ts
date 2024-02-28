import { TimeUnit } from './resources';

export type ID = string | number;
export interface Entity {
  id: ID;
}

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
