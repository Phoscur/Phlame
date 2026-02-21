import { BuildingIdentifier } from './Building';
import { TimeUnit } from './resources';

// it is a bit unwise to loosen the identifier type to string or number
// TODO? use nanoID: string xor number - I'm leaning towards strings for readability
// or just leave it to be constrained by the app to either...
export type ID = string | number;
export interface Entity {
  id: ID;
}

export const ActionTypes = {
  CREATE: 'create',
  UPDATE: 'update',
  DESTROY: 'destroy',
} as const;

export type ActionType = (typeof ActionTypes)[keyof typeof ActionTypes];
/**
 * basic ActionJSON
 */
export interface Action<Type extends ActionType> {
  type: Type;
  concerns: Entity;
  // TODO! multi consequences? just queue additional actions...?!
  consequence: {
    at: TimeUnit; // ticks
    type: Type; // event trigger
    payload: Record<string | number | symbol, unknown>;
  };
}

export class ActionFactory {
  create<Type extends ActionType>(
    type: Type,
    at: TimeUnit,
    concerns: Entity,
    payload: Record<string | number | symbol, unknown>,
  ): Action<Type> {
    return {
      type,
      concerns,
      consequence: {
        at,
        type,
        payload,
      },
    };
  }

  createBuilding(at: TimeUnit, concerns: Entity, buildingID: BuildingIdentifier) {
    return this.create(ActionTypes.CREATE, at, concerns, { buildingID });
  }
  updateBuilding(
    at: TimeUnit,
    concerns: Entity,
    buildingID: BuildingIdentifier,
    grade: 'up' | 'down',
  ) {
    return this.create(ActionTypes.UPDATE, at, concerns, { buildingID, grade });
  }
}

export const EventTypes = {
  ACTION: 'action',
  CONSEQUENCE: 'consequence',
  SYSTEM: 'system',
} as const;

export type EventType = (typeof EventTypes)[keyof typeof EventTypes];
export interface Event {
  at: TimeUnit;
  type: EventType;
  concerns: ID;
  action: Action<ActionType>;
}

export class EventFactory {
  create(type: EventType, at: TimeUnit, concerns: ID, action: Action<ActionType>): Event {
    return {
      at,
      type,
      concerns,
      action,
    };
  }
  fromAction(at: TimeUnit, action: Action<ActionType>): Event {
    return this.create(EventTypes.ACTION, at, action.concerns.id, action);
  }
}
