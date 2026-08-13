# Magic Militia Architecture

## Principle

Build the smallest complete gameplay loop first. Every later system should plug into stable interfaces instead of being embedded in the player controller.

## Runtime layers

```text
Game Root
├── Match / Arena
├── Player Actors
│   ├── Movement
│   ├── Health
│   ├── Loadout
│   └── Input
├── Combat
│   ├── Damage
│   ├── Projectiles
│   ├── Knockback
│   └── Status Effects
├── Pickups
├── UI
└── Networking (later)
```

## Player responsibilities

The player owns movement state, aim state, health state, and references to equipped gameplay components. The player should not contain weapon-specific behavior once the weapon system lands.

## Weapon contract

Future weapons should expose a common interface:

- `fire(origin, direction, owner)`
- `can_fire()`
- `cooldown`
- `damage_profile`
- `mana_cost`
- `knockback`
- `element`
- `rarity`

Weapons should be data-driven where possible so balancing does not require rewriting player logic.

## Physics

The prototype uses Godot `CharacterBody2D` movement and collision shapes. The final movement model should preserve the intended feel: momentum, jetpack fuel management, directional aiming, aerial dodging, and grapple-based mobility.

## Networking boundary

Do not make networking assumptions part of gameplay code prematurely. The eventual server owns authoritative match state, movement validation, damage validation, score, pickups, and win conditions. Clients own presentation, input collection, prediction, and interpolation.

## Rendering

Prototype characters and arena geometry are procedural drawing/gray-box assets. They are intentionally replaceable. Final production art will use modular sprite layers and biome-specific assets without changing gameplay interfaces.
