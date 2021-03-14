## Running unit tests

Run `nx test engine (--code-coverage|--watch)` to execute the unit tests via [Jest](https://jestjs.io).

# Engine centered around resources

Models resource flows between buildings in a factory, should be then usable on client- and serverside

## Overview

Already working:

- Resource
- Energy
- ResourceProcess
- Stock
- ResourceCalculation
- EnergyCalculation
- Prosumer

- Economy with Building as Prosumers

# Roadmap

- solve resource & energy calculations for each game tick ✔
- build a little idlegame: upgrade buildings (mines & stock) and tech
- integrate with a persistence layer (git via phlame-data)
- integrate with a simple UI, can be console based for the start
- add fleet for trade
- add combat and more fleet

## Resource Calculation

Integral part of the the game engine, calculates

- Resources in factory and its environment
- Energy and Heat levels
- Strategy to handle resource shortage

## Ideas

For naming additional Entities and/or ValueObjects:

- Action & Consequence (after delay), GameUnit, GameEntity
- Economy, Industry, Construction, Investment, BuildingProcess
- HeavenlyBody
- World, Empire
- Planet, SolarSystem
- Phlame(Entity|Value|Environment)
- Universe and PhlameBlock to collect all state
- Ephemeris (trajectory of HeavenlyBodies over time)

### P2P Game networking

- servers should be able to interact, peer to peer?
  need always-on address services... can we (ab)use github for all of this?
  α - every repo for is its own can be an alpha universe
  Ω - omega universe allows all kinds of (possibly cheated before played) worlds and empires as long as they stay compatible at the core
  β & γ - beta and gamma universes can be more serious or distantly forked
