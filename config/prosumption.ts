import { ResourceTypes } from "./resources";
const { Crystal, Deuterium, Metal, Energy } = ResourceTypes;

/**
 * Game config for production and consumption
 */
export default {
  1: {
    [Metal]: (lvl) => 30 * lvl * lvl ** 1.1,
    // [Crystal] () => 0,
    // [Deuteriuml] () => 0,
    [Energy]: (lvl) => - 10 * lvl * lvl ** 1.1,
  },
  2: {
    [Crystal]: (lvl) => 20 * lvl * lvl ** 1.1,
    [Energy]: (lvl) => - 10 * lvl * lvl ** 1.1,
  },
  3: {
    [Deuterium]: (lvl, planet) => 10 * lvl * lvl ** 1.1 * (-0.002 * planet.maxTemperature + 1.28),
    [Energy]: (lvl) => - 10 * lvl * lvl ** 1.1,
  },
  4: {
    [Energy]: (lvl) => 20 * lvl * lvl ** 1.1,
  },
  12: {
    [Deuterium]: (lvl) => - 10 * lvl * lvl ** 1.1,
    [Energy]: (lvl) => 50 * lvl * lvl ** 1.1,
  },
  212: {
    [Energy]: (count, planet) => 0.1 * count (0.25 * planet.maxTemperature + 20),
  },
};
