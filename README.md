# ⚔️ ASCENT — 2D Combat Game

> A browser-based 2D side-scrolling combat engine — built from scratch with vanilla JavaScript and HTML5 Canvas. No frameworks. No game engines. Just clean, modular systems architecture.

[🌐 Play Live](https://vignesh-p-c.github.io/Ascent-2D-combat-game/)

<br>

<!-- ============================================================ -->
<!-- PLACEHOLDER: Replace with a screen-recorded GIF of gameplay  -->
<!-- Recommended tool: LICEcap (Windows/Mac) or peek (Linux)       -->
<!-- Ideal length: 15–20s showing combat, dash, boss fight, HUD   -->
<!-- ============================================================ -->
![Gameplay gif](./assets/demo.gif)

<br>

[![JavaScript](https://img.shields.io/badge/JavaScript-ES6-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![HTML5 Canvas](https://img.shields.io/badge/HTML5-Canvas-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
[![No Dependencies](https://img.shields.io/badge/Dependencies-None-brightgreen)](package.json)
[![Version](https://img.shields.io/badge/Version-2.0.0-blue)](#)

---

## 📌 Overview

A fully custom 2D combat engine and game loop implemented without any external libraries or game frameworks. The goal was to deeply understand the systems that power action games — physics, AI state machines, collision detection, camera control, and player feel — by building each one from the ground up.

**Key engineering focus areas:**
- Frame-rate-independent player mechanics with jump buffering, coyote time, and dash
- Eight distinct enemy archetypes, each with a unique AI state machine and attack pattern
- In-game shop with per-round rotating inventory and persistent cross-round effects
- Scalable, modular architecture designed for continued extension
- Clean separation between game logic, rendering, input, and UI

---

## 🎮 Gameplay

<!-- ============================================================ -->
<!-- PLACEHOLDER: 2–3 side-by-side screenshots                    -->
<!-- Suggested shots: (1) combat hitbox flash, (2) boss fight,    -->
<!-- (3) HUD with ELO bar + healing orb                           -->
<!-- ============================================================ -->
| Combat | Boss Fight | HUD & Progression |
|--------|------------|-------------------|
| ![Combat](./assets/screenshots/combat.png) | ![Boss](./assets/screenshots/boss.png) | ![HUD](./assets/screenshots/hud.png) |

### Player Mechanics

The player controller prioritises **game feel** through a set of intentional physics and timing decisions:

- **Friction-based horizontal movement** — acceleration and deceleration feel weighty, not instant
- **Jump buffering + coyote time** — inputs are queued so the game responds to player intent, not just frame-perfect timing
- **Double jump** — unlocked as a mid-game progression reward; persists across levels
- **Dash system** — includes an attack-cancel window and a level-gated invulnerability unlock that rewards progression
- **Invincibility frames** — brief post-damage i-frames prevent frustrating chain-hits

### Combat System

- Directional hitboxes with wind-up and cooldown phases — attacks have commitment, creating readable timing for both player and enemies
- **Hit pause** on successful strikes for tactile feedback
- **Knockback physics** applied independently to both player and enemies, calculated from hit direction
- **Healing orbs** spawn every 4 successful hits, rewarding aggressive play; an overheal system with decay prevents passive stacking
- **Floating damage numbers** appear on every hit with animated scaling and fade, giving immediate feedback on effectiveness
- **Coins** scattered across each level, spent in the shop for strategic upgrades

### Shop System

An in-game shop accessible at any time from the settings menu. The inventory rotates every round, offering 3 items with escalating costs and power. All purchased effects carry over through boss fights and into subsequent rounds.

| Slot | Example Item | Cost | Effect |
|------|-------------|------|--------|
| 1 | +25 HP | 🪙 1 | Instant heal — repeatable |
| 2 | Iron Shield | 🪙 2 | 50% damage reduction for 10s — repeatable |
| 3 | Golden Sword | 🪙 3 | +10% damage permanently — one-time |

---

## 👾 Enemy Progression

Eight enemy types are introduced progressively, each adding a distinct challenge layer:

| Level | Enemy | Role | Key Mechanic |
|-------|-------|------|--------------|
| 1+ | **Normal** | Melee baseline | Chase and attack |
| 3+ | **Speeder** | Pressure | 2× movement speed, low HP |
| 4+ | **Shielder** | Defense | Random shield toggle (0.3–1.1s phases); must hit during shield-down window |
| 5+ | **Archer** | Ranged pressure | Fires projectiles; retreats if player closes in |
| 6+ | **Leaper** | Burst damage | Pounces at player; the leap itself is the attack (1.5× damage) |
| 7+ | **Berserker** | Sustained threat | Enrages at 50% HP; enters flurry mode (3 rapid hits, 3.5s cooldown) |
| 8+ | **Healer** | Support | Flees player; heals nearby allies 3 HP every 2s in a 180px radius |
| 9+ | **Summoner** | Tactical | Spawns Normal/Speeder mobs; boss gate — boss only spawns after Summoner and all its summons are dead |

### Boss

Each wave ends with a boss fight. The boss enters **Phase 2 at 50% HP**, gaining increased speed and halved attack cooldown. Defeating the boss heals the player for 50 HP (with an overheal cap at 1.5× max HP).

---

## 🧠 Architecture

The engine follows a **composition-over-inheritance** design. Systems are decoupled and communicate through a central `Game` orchestrator rather than tight coupling between entities.

<!-- ============================================================ -->
<!-- PLACEHOLDER: Architecture diagram                            -->
<!-- Suggested tool: draw.io, Excalidraw, or Mermaid (in GitHub)  -->
<!-- Show: Game loop → subsystems → entities → collision system   -->
<!-- ============================================================ -->
![Architecture Diagram](./assets/architecture.png)

### Module Structure

```
index.html
main.js                     # Entry point — start screen, game lifecycle, retry flow
style.css
│
├── assets/
│   └── audio/
│       ├── music_normal.mp3    # Background track for standard levels
│       └── music_boss.mp3      # Swapped in automatically on boss spawn
│
├── docs/
│   ├── Ascent_Product_Checklist.xlsx   # Feature tracking and release checklist
│   ├── implementation_guide.md         # Step-by-step integration notes for new systems
│   ├── quick_reference.md              # Per-file change summaries
│   └── stats_reference.md             # Enemy stats, multipliers, and progression tables
│
├── entities/
│   ├── Player.js           # Controller: movement, dash, attack, double jump, i-frames, buff system
│   ├── Mob.js              # 8-type enemy with per-type AI state machines
│   ├── Boss.js             # Phase-aware boss with charge behavior and phase 2 trigger
│   ├── Projectile.js       # Archer projectile — velocity, lifetime, bounds, render
│   └── Coin.js             # Collectible with float animation and pickup detection
│
├── game/
│   ├── Game.js             # Central orchestrator — loop, ELO state, shop state, subsystem wiring
│   ├── LevelManager.js     # Wave scaling, platform generation, enemy spawning, level transitions
│   ├── CollisionSystem.js  # Centralised AABB detection for all entity pairs + projectiles
│   └── Camera.js           # Lerp-based follow with world clamping and screen shake
│
├── input/
│   └── InputManager.js     # Decoupled keyboard and mouse input with buffering
│
├── ui/
│   ├── HUD.js              # HP bar, ELO bar, level, coins, minimap, damage numbers, buff indicators, game over
│   ├── Shop.js             # Round-rotating shop overlay with persistent upgrade effects
│   ├── HealthBar.js        # Animated lerp health bar component
│   └── EloBar.js           # Segmented animated ELO bar component
│
└── utils/
    ├── Constants.js        # Single source of truth for all tunable values + shop catalog
    ├── AssetLoader.js      # Asset preloading and audio manager export
    ├── AudioManager.js     # Music playback with normal/boss track switching
    └── MathUtils.js        # Shared helpers (clamp, lerp, AABB overlap)
```

### Design Decisions Worth Noting

**Centralised collision vs. entity self-resolution**
All AABB collision detection runs through `CollisionSystem` rather than individual entities resolving their own overlaps. This keeps physics predictable and makes it straightforward to add new entity types or collision rules — including projectile-vs-player — without touching existing entity code.

**Per-type AI state machines in a single class**
All eight enemy variants live in `Mob.js`, each dispatched to a dedicated AI method (`_archerAI`, `_berserkerAI`, etc.) via a type switch. This keeps spawning, collision, and rendering unified while making individual AI behaviour self-contained and independently testable.

**Delta-time movement**
All movement and physics calculations multiply by `deltaTime`, making the game frame-rate independent. This is critical for consistent feel across different hardware.

**Event listener lifecycle management**
`HUD` and `Shop` both store bound references to their event handlers and expose a `destroy()` method. `Game.destroy()` calls both on retry, preventing listener accumulation across game sessions — a common source of compounding input bugs in canvas-based games.

**Shop state isolation**
The shop owns its own open/close lifecycle and communicates purchases back to `Game` via a single `onPurchase` callback. `Game` applies effects to the player and deducts coins; `Shop` never touches game state directly. This keeps the overlay independently testable and trivially replaceable.

**`Constants.js` as tuning surface**
Every gameplay value — speeds, cooldowns, ELO gains, knockback force, shield timing, enemy stat multipliers, and the entire shop catalog — lives in a single file. This was a deliberate decision to support rapid iteration and eliminate magic numbers scattered across the codebase.

---

## 📈 Progression System

```
Starting ELO: 1000
+10  per standard enemy defeated
+100 per boss defeated
```

- ELO is displayed as an animated **segmented bar** in the HUD
- Boss stats, wave composition, and platform layouts **scale with level**
- Bosses enter **Phase 2 at 50% HP** with enhanced behaviour and reward multiplier
- **Double jump** unlocks as a mid-game milestone reward
- **Shop inventory** rotates every round; permanent upgrades (damage boosts) persist for the entire session
- Level transitions trigger automatically after wave + boss clear

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Language | JavaScript (ES6 Modules) |
| Rendering | HTML5 Canvas API |
| Architecture | Modular ES6, no bundler required |
| Physics | Custom AABB, friction, gravity, knockback |
| AI | Per-type discrete state machines |
| Audio | Web Audio API via AudioManager |
| Dependencies | **None** |

---

## ▶️ Run Locally

The project uses ES modules and must be served over HTTP (not `file://`).

**Python (recommended)**
```bash
python -m http.server
# Open http://localhost:8000
```

**Node.js**
```bash
npx serve .
```

**VS Code**
Install the Live Server extension → right-click `index.html` → Open with Live Server.

---

## 🗺️ Roadmap

| Feature | Status |
|---------|--------|
| 8 enemy types with unique AI (Archer, Leaper, Berserker, Healer, Summoner) | ✅ Complete |
| Projectile system (Archer) | ✅ Complete |
| Background music with boss track switching | ✅ Complete |
| Pause / settings menu | ✅ Complete |
| Floating damage numbers | ✅ Complete |
| Minimap | ✅ Complete |
| Coin collectibles | ✅ Complete |
| Double jump unlock | ✅ Complete |
| In-game shop (coin spending, rotating inventory, persistent upgrades) | ✅ Complete |
| Sprite sheet animation pipeline | 🔄 In Progress |
| Build / loadout switching | 📋 Planned |
| Sound effects | 📋 Planned |
| Save / load progression | 📋 Planned |
| TypeScript migration | 📋 Planned |
| Performance optimisation pass | 📋 Planned |
| Mini-engine extraction for reuse | 📋 Planned |

---

## 💡 Engineering Reflection

> The most counterintuitive lesson from this project is that game feel is orthogonal to physical accuracy. Coyote time and jump buffering are technically wrong — the player can jump after leaving a platform, and inputs register before they're made — but removing them makes the game feel broken. That gap between what is correct and what feels right is a deliberate design decision, not a compromise, and learning to commit to it was more valuable than any specific implementation detail.
Centralising collision detection in CollisionSystem rather than giving entities self-resolution logic was the architectural decision I'm most glad I made early. Adding projectile-vs-player detection, a new entity type, or shop-applied damage multipliers never required touching existing entity code — the system accepted new participants without modification. That same instinct for drawing system boundaries before writing logic now shapes how I approach service layer design in web applications.
Building eight enemy archetypes inside a single Mob.js via a type dispatch pattern taught me that the right abstraction is not always the obvious one. Separate classes per enemy type would have looked cleaner on paper; a shared spawning, collision, and rendering surface with independently testable AI methods proved significantly easier to extend in practice — especially when tuning interactions between types like Healer and Summoner.
The shop system exposed a discipline I had to enforce throughout the project: UI state in a canvas environment requires the same explicit lifecycle management as a component framework. Event listeners accumulate silently across retries without bound handler references and destroy() calls. That feels ceremonial the first time you write it, and invaluable the first time it prevents two hours of debugging a ghost input.

---

## 📬 Contact

**[Vignesh P C]** — [[GitHub]](https://github.com/Vignesh-P-C) · [[LinkedIn]](https://www.linkedin.com/in/vignesh-p-c/)