# ⚔️ ASCENT — 2D Combat Game

> A browser-based 2D side-scrolling combat engine built from scratch with vanilla JavaScript and HTML5 Canvas. No frameworks. No game engines. Just clean, modular systems architecture.

[![Play Live](🌐)](https://vignesh-p-c.github.io/Ascent-2D-combat-game/)

![JavaScript](https://img.shields.io/badge/JAVASCRIPT-ES6-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-CANVAS-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![Dependencies](https://img.shields.io/badge/DEPENDENCIES-NONE-blue?style=for-the-badge)
![Version](https://img.shields.io/badge/VERSION-2.0.0-orange?style=for-the-badge)

---

![Gameplay](./assets/demo.gif)

---

## Overview

A fully custom 2D combat engine and game loop — no libraries, no frameworks. Built to deeply understand the systems that power action games: physics, AI state machines, collision detection, camera control, and player feel — by implementing each one from scratch.

**Engineering focus areas:**
- Frame-rate-independent physics with jump buffering, coyote time, and dash
- Eight enemy archetypes, each with a unique AI state machine and attack pattern
- In-game shop with rotating inventory and persistent cross-round upgrade effects
- Composition-over-inheritance architecture with a centralised collision system
- Clean separation between game logic, rendering, input, and UI

---

## 📸 Screenshots

| Combat | Boss Fight | HUD & Progression |
|--------|------------|-------------------|
| ![Combat](./assets/screenshots/combat.png) | ![Boss](./assets/screenshots/boss.png) | ![HUD](./assets/screenshots/hud.png) |

---

## Gameplay

### Player Mechanics

- **Friction-based movement** — acceleration and deceleration feel weighty, not instant
- **Jump buffering + coyote time** — inputs queue so the game responds to intent, not frame-perfect timing
- **Double jump** — unlocked as a mid-game progression reward; persists across levels
- **Dash system** — includes attack-cancel window and level-gated invulnerability unlock
- **Invincibility frames** — brief post-damage i-frames prevent frustrating chain-hits

### Combat System

- Directional hitboxes with wind-up and cooldown phases — attacks have commitment and readable timing
- **Hit pause** on successful strikes for tactile feedback
- **Knockback physics** applied independently to player and enemies, calculated from hit direction
- **Healing orbs** spawn every 4 hits, rewarding aggressive play; overheal system with decay prevents passive stacking
- **Floating damage numbers** on every hit with animated scaling and fade
- **Coins** collectible across each level, spent in the shop for strategic upgrades

### Shop System

Accessible at any time from the settings menu. Inventory rotates every round with 3 items at escalating costs. All effects persist through boss fights and into subsequent rounds.

| Slot | Example Item | Cost | Effect |
|------|-------------|------|--------|
| 1 | +25 HP | 🪙 1 | Instant heal — repeatable |
| 2 | Iron Shield | 🪙 2 | 50% damage reduction for 10s — repeatable |
| 3 | Golden Sword | 🪙 3 | +10% damage permanently — one-time |

---

## Enemy Progression

Eight enemy types introduced progressively, each adding a distinct challenge layer:

| Level | Enemy | Role | Key Mechanic |
|-------|-------|------|--------------|
| 1+ | **Normal** | Melee baseline | Chase and attack |
| 3+ | **Speeder** | Pressure | 2× speed, low HP |
| 4+ | **Shielder** | Defense | Random shield toggle (0.3–1.1s phases) |
| 5+ | **Archer** | Ranged | Fires projectiles; retreats when player closes in |
| 6+ | **Leaper** | Burst damage | Pounces at player; leap itself is the attack (1.5× damage) |
| 7+ | **Berserker** | Sustained threat | Enrages at 50% HP; flurry mode (3 rapid hits, 3.5s cooldown) |
| 8+ | **Healer** | Support | Flees player; heals nearby allies 3 HP/2s in 180px radius |
| 9+ | **Summoner** | Tactical | Spawns mobs; boss gate — boss only spawns after Summoner and all summons are dead |

**Boss:** enters Phase 2 at 50% HP with increased speed and halved attack cooldown. Defeating the boss heals player 50 HP (overheal cap at 1.5× max HP).

---

## Architecture

Composition-over-inheritance throughout. Systems are decoupled and communicate through a central `Game` orchestrator.

![Architecture Diagram](./assets/architecture.png)

### Module Structure

```
index.html
main.js                         # Entry point — start screen, game lifecycle, retry flow
style.css
│
├── assets/
│   └── audio/
│       ├── music_normal.mp3    # Standard level background track
│       └── music_boss.mp3      # Swapped in automatically on boss spawn
│
├── entities/
│   ├── Player.js               # Movement, dash, attack, double jump, i-frames, buff system
│   ├── Mob.js                  # 8-type enemy with per-type AI state machines
│   ├── Boss.js                 # Phase-aware boss with charge behaviour and phase 2 trigger
│   ├── Projectile.js           # Archer projectile — velocity, lifetime, bounds, render
│   └── Coin.js                 # Collectible with float animation and pickup detection
│
├── game/
│   ├── Game.js                 # Central orchestrator — loop, ELO, shop state, subsystem wiring
│   ├── LevelManager.js         # Wave scaling, platform generation, enemy spawning, transitions
│   ├── CollisionSystem.js      # Centralised AABB detection for all entity pairs + projectiles
│   └── Camera.js               # Lerp-based follow with world clamping and screen shake
│
├── input/
│   └── InputManager.js         # Decoupled keyboard and mouse input with buffering
│
├── ui/
│   ├── HUD.js                  # HP bar, ELO bar, level, coins, minimap, damage numbers, game over
│   ├── Shop.js                 # Rotating shop overlay with persistent upgrade effects
│   ├── HealthBar.js            # Animated lerp health bar component
│   └── EloBar.js               # Segmented animated ELO bar component
│
└── utils/
    ├── Constants.js            # Single source of truth for all tunable values + shop catalog
    ├── AssetLoader.js          # Asset preloading and audio manager export
    ├── AudioManager.js         # Music playback with normal/boss track switching
    └── MathUtils.js            # Shared helpers: clamp, lerp, AABB overlap
```

### Key Design Decisions

**Centralised collision system**
All AABB detection runs through `CollisionSystem` rather than individual entities resolving their own overlaps. Adding a new entity type or collision rule — projectile-vs-player, shop-applied damage multipliers — never requires touching existing entity code.

**Per-type AI in a single class**
All eight enemy variants live in `Mob.js`, dispatched via type switch to dedicated AI methods (`_archerAI`, `_berserkerAI`, etc.). Spawning, collision, and rendering stay unified while individual AI behaviour remains independently testable.

**Delta-time physics**
All movement and physics multiply by `deltaTime`, making the game frame-rate independent across different hardware.

**Event listener lifecycle management**
`HUD` and `Shop` store bound handler references and expose `destroy()`. `Game.destroy()` calls both on retry, preventing listener accumulation — a common source of ghost input bugs in canvas games.

**`Constants.js` as tuning surface**
Every gameplay value — speeds, cooldowns, knockback, shield timing, enemy multipliers, shop catalog — lives in one file. Eliminates magic numbers and makes iteration fast.

---

## Progression System

```
Starting ELO: 1000
+10  per enemy defeated
+100 per boss defeated
```

- ELO shown as an animated segmented bar in the HUD
- Boss stats, wave composition, and platforms scale with level
- Double jump unlocks as a mid-game milestone
- Permanent upgrades (damage boosts) persist for the full session

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Language | JavaScript ES6 Modules |
| Rendering | HTML5 Canvas API |
| Physics | Custom AABB, friction, gravity, knockback |
| AI | Per-type discrete state machines |
| Audio | Web Audio API |
| Bundler | None — native ES modules |
| Dependencies | None |

---

## Run Locally

ES modules require HTTP — can't be opened as a `file://` URL directly.

```bash
# Python
python -m http.server
# open http://localhost:8000

# Node
npx serve .
```

Or use the VS Code **Live Server** extension → right-click `index.html` → Open with Live Server.

---

## Roadmap

| Feature | Status |
|---------|--------|
| 8 enemy types with unique AI | ✅ Complete |
| Projectile system | ✅ Complete |
| Boss music track switching | ✅ Complete |
| Pause / settings menu | ✅ Complete |
| Floating damage numbers | ✅ Complete |
| Minimap | ✅ Complete |
| In-game shop with persistent upgrades | ✅ Complete |
| Sprite sheet animation pipeline | 🔄 In Progress |
| Sound effects | 📋 Planned |
| Build / loadout switching | 📋 Planned |
| Save / load progression | 📋 Planned |
| TypeScript migration | 📋 Planned |
| Mini-engine extraction for reuse | 📋 Planned |

---

## Engineering Reflection

The most counterintuitive lesson from this project: game feel is orthogonal to physical accuracy. Coyote time and jump buffering are technically wrong — the player can jump after leaving a platform, inputs register before they're made — but removing them makes the game feel broken. That gap between what is correct and what feels right is a deliberate design decision, not a compromise.

Centralising collision in `CollisionSystem` was the architectural call I'm most glad I made early. Adding projectile-vs-player detection or a new entity type never required touching existing code. That instinct for drawing system boundaries before writing logic now shapes how I approach service layer design in web applications.

Eight enemy archetypes in a single `Mob.js` via type dispatch taught me that the right abstraction isn't always the obvious one. Separate classes per type would have looked cleaner on paper; a shared rendering surface with independently testable AI methods was significantly easier to extend — especially when tuning Healer and Summoner interactions.

The shop system enforced a discipline I carried through the whole project: UI state in a canvas environment needs the same explicit lifecycle management as a component framework. Event listeners accumulate silently without bound references and `destroy()` calls. Ceremonial the first time. Invaluable the first time it saves two hours of ghost input debugging.

---

## Contact

**Vignesh P C** — [GitHub](https://github.com/Vignesh-P-C) · [LinkedIn](https://www.linkedin.com/in/vignesh-p-c/)