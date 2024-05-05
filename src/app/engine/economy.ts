import { Economy } from '@phlame/engine';
import { Empire } from '@phlame/engine';
import type { Zeitgeber } from '../signals/zeitgeber';
import { defaultBuildings, emptyStock } from './buildings';

export function economyFactory(zeit: Zeitgeber) {}

export const economy = new Economy('Phlameplanet', emptyStock, defaultBuildings);
export const empire = new Empire('Phlameland', []);
