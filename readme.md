# Engine centered around resources
Models resource flows between buildings in a factory, should be then usable on client- and serverside

# Roadmap
- solve resource & energy calculations for each game tick
- integrate with a persistence layer (git via phlame-data)
- integrate with a simple UI, can be console based for the start

## Resource Calculation
Integral part of the the game engine, calculates
- Resources in factory and its environment
- Energy and Heat levels
- Strategy to handle resource shortage


## Development
`npm start` - Runs jest in watch mode, use its `o` mode to run tests concerning recent file changes
`npm run coverage` - Generates a coverage report (should be 100%)

## Ideas
For naming the main Entity and/or ValueObject:
- Phlame(Entity|Value|Environment)
- Economy
- World
- Planet
- Factory <- don't like this one because we might still need a (X|Phlame)ObjectFactory at some point (just for now ValueObjects carry their own factories)
### P2P Game networking
- servers should be able to interact, peer to peer?
need always-on address services... can we (ab)use github for all of this?
α - every repo for is its own can be an alpha universe
Ω - omega universe allows all kinds of (possibly cheated) worlds and empires as long as they stay compatible at the core
β & γ - beta and gamma universes can be more serious or distantly forked