# ⚔️ 2D ELO Game

> A browser-based 2D side-scrolling combat engine — built from scratch with vanilla JavaScript and HTML5 Canvas. No frameworks. No game engines. Just clean, modular systems architecture.

[🌐 Play Live](https://vignesh-p-c.github.io/2D-Elo-Game-using-JS/)

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
- **Coins** scattered across each level as collectibles tied to progression rewards

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
├── entities/
│   ├── Player.js           # Controller: movement, dash, attack, double jump, i-frames
│   ├── Mob.js              # 8-type enemy with per-type AI state machines
│   ├── Boss.js             # Phase-aware boss with charge behavior and phase 2 trigger
│   ├── Projectile.js       # Archer projectile — velocity, lifetime, bounds, render
│   └── Coin.js             # Collectible with float animation and pickup detection
│
├── game/
│   ├── Game.js             # Central orchestrator — loop, ELO state, subsystem wiring
│   ├── LevelManager.js     # Wave scaling, platform generation, enemy spawning, level transitions
│   ├── CollisionSystem.js  # Centralised AABB detection for all entity pairs + projectiles
│   └── Camera.js           # Lerp-based follow with world clamping and screen shake
│
├── input/
│   └── InputManager.js     # Decoupled keyboard and mouse input with buffering
│
├── ui/
│   ├── HUD.js              # HP bar, ELO bar, level, coins, minimap, damage numbers, game over
│   ├── HealthBar.js        # Animated lerp health bar component
│   └── EloBar.js           # Segmented animated ELO bar component
│
└── utils/
    ├── Constants.js        # Single source of truth for all tunable values
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
`HUD` stores bound references to its `click` and `keydown` handlers and exposes a `destroy()` method. `Game.destroy()` calls it on retry, preventing listener accumulation across game sessions — a common source of compounding input bugs in canvas-based games.

**`Constants.js` as tuning surface**
Every gameplay value — speeds, cooldowns, ELO gains, knockback force, shield timing, enemy stat multipliers — lives in a single file. This was a deliberate decision to support rapid iteration and eliminate magic numbers scattered across the codebase.

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
| Sprite sheet animation pipeline | 🔄 In Progress |
| In-game shop (coin spending) | 📋 Planned |
| Build / loadout switching | 📋 Planned |
| Sound effects | 📋 Planned |
| Save / load progression | 📋 Planned |
| TypeScript migration | 📋 Planned |
| Performance optimisation pass | 📋 Planned |
| Mini-engine extraction for reuse | 📋 Planned |

---

## 💡 Engineering Reflection

<!-- ============================================================ -->
<!-- PLACEHOLDER: 2–4 sentences about your biggest takeaways.     -->
<!-- Recruiters value self-awareness. Examples:                    -->
<!-- - "Implementing coyote time taught me that game feel is a     -->
<!--   product of careful input buffering, not just physics."      -->
<!-- - "Centralizing collision detection forced me to think about  -->
<!--   system boundaries early — a pattern I now apply outside     -->
<!--   game development."                                          -->
<!-- ============================================================ -->

> *Add a short engineering reflection here — what surprised you, what you'd do differently, what this taught you about systems design.*

---

## 📬 Contact

**[Vignesh P C]** — [[GitHub]](https://github.com/Vignesh-P-C) · [[LinkedIn]](https://www.linkedin.com/in/vignesh-p-c/)