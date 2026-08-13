# 🪄 Magic Militia

**Cast. Fly. Conquer.**

Magic Militia is a fast 2D magical arena brawler: jetpack movement, spell projectiles, melee runes and short chaotic matches.

## Two playable targets

### Godot prototype

The native prototype contains the physics foundation:

- Four hard arena walls
- Custom wizard and spark SVG sprites
- Gravity, momentum and jetpack fuel
- Mouse aiming and Spark Wand casting
- Functional melee rune with damage, knockback and visual feedback
- HP, death and respawn
- Magical arena backdrop and traversal platforms

Run with **Godot 4.x** by importing `project.godot` and pressing **F6/F5**.

### Web game

The `web/` client is the player-facing version:

- Landing page with instant guest entry
- No account and no saved player data
- Create or join a room by code
- Maximum 5 players per room
- Ten-minute matches
- Highest kill count wins
- Respawns are allowed
- A practice fallback runs when the room server is unavailable
- Mouse casting, jetpack movement and **F** melee all work in-browser

## Run the web version

```bash
cd server
npm install
npm start
```

Then open **http://localhost:8080**.

The server keeps rooms, names, positions and scores **in memory only**. Restarting the server wipes everything. There is no database, account system, analytics store or persistent profile.

## Repository layout

```text
magic-militia/
├── game/                 # Godot prototype
├── web/                  # Landing page + browser game client
├── server/               # Ephemeral room/WebSocket server
├── assets/               # Custom SVG game art
└── docs/                 # Architecture and roadmap
```

## Match rules

- 5 players maximum
- 10:00 match timer
- Unlimited respawns
- Kills determine the winner
- Rooms disappear when their last player leaves
- No persistent data

## Controls

**A/D or Arrow keys:** move  ·  **Space:** jetpack  ·  **Mouse:** aim/cast  ·  **F:** melee
