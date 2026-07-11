# Game Actions

- Creation & Destruction
  - Player
  - Galaxy & Solarsystems
  - Planet (refs: player, solarsystem)
  - Shipyard (refs: planet)
  - Moon (refs: planet)
  - Fleet (refs: planet, targetPlanet) mission cargo

- Update/Upgrade
  - Solarsystem (event)
  - Planet (building)
  - Shipyard (planet, ship/def)
  - Moon (building)

# Game Scenarios

- Player Control
  - 4 Player SignUp PlayerName and MainPlanetName
  - 8 View Empire: Planet(s) Info & Resources
  - 5 View Empire: Planet Shipyard
  - 2 View Empire: Moon
  - 6 View Galaxy & Solarsystems
  - 5 View Fleet (refs: planet, targetPlanet) set mission & cargo

- Events
  - Solarsystem (Meteorite)
  - Planet/Moon Building Queue
  - Shipyard Building Queue
  - Fleet Movement, Transport, Battle

# Game Loop!?

1. Load recent Data Cache
2. Evaluate recent Events
3. Save Data Cache
