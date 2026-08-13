# 🪄 Magic Militia

**Cast. Fly. Conquer.**

Magic Militia is a 2D physics-driven fantasy arena combat game inspired by the fast aerial combat of Mini Militia and the magical itemization of Terraria.

## Current milestone — 0.1 Movement Prototype

The first build intentionally focuses on game feel:

- 2D wizard controller
- Gravity and momentum
- Jetpack with fuel management
- Directional mouse aiming
- Spark Wand projectile
- Basic melee attack
- HP and respawn
- Gray-box arena
- Minimal HUD

Networking, progression, matchmaking, advanced weapons, destructible terrain, and final art are deliberately deferred until the movement/combat loop is fun.

## Engine

- Godot 4.x
- GDScript
- 2D physics

## Project structure

```text
magic-militia/
├── game/
│   ├── scenes/
│   ├── scripts/
│   └── weapons/
├── docs/
├── assets/
├── tests/
└── project.godot
```

## Run

1. Install Godot 4.x.
2. Import this repository as a Godot project.
3. Run `game/scenes/main.tscn`.
4. Move with **A/D** or **Left/Right**.
5. Hold **Space** for the jetpack.
6. Aim with the mouse and **Left Click** to cast.
7. Press **F** for the melee strike.
8. Press **R** to reset after a death.

## Design source

The initial product specification lives in the project planning conversation and defines the longer-term weapon, biome, game-mode, multiplayer, progression, and networking roadmap.