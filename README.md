# ⚔️ 2D ELO Game

> A browser-based 2D side-scrolling combat engine — built from scratch with vanilla JavaScript and HTML5 Canvas. No frameworks. No game engines. Just clean, modular systems architecture.

<br>

<!-- ============================================================ -->
<!-- PLACEHOLDER: Replace with a screen-recorded GIF of gameplay  -->
<!-- Recommended tool: LICEcap (Windows/Mac) or peek (Linux)       -->
<!-- Ideal length: 15–20s showing combat, dash, boss fight, HUD   -->
<!-- ============================================================ -->
![Gameplay Demo](./assets/demo.gif)

<br>

[![JavaScript](https://img.shields.io/badge/JavaScript-ES6-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![HTML5 Canvas](https://img.shields.io/badge/HTML5-Canvas-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
[![No Dependencies](https://img.shields.io/badge/Dependencies-None-brightgreen)](package.json)
[![Version](https://img.shields.io/badge/Version-1.0.0-blue)](#)

---

## 📌 Overview

This project is a fully custom 2D combat engine and game loop implemented without any external libraries or game frameworks. The goal was to deeply understand the systems that power action games — physics, AI state machines, collision detection, camera control, and player feel — by building each one from the ground up.

**Key engineering focus areas:**
- Responsive, frame-rate-independent player mechanics
- Scalable, modular architecture designed for future extension
- Clean separation between game logic, rendering, and input

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

The player controller prioritizes **game feel** through a set of intentional physics and timing decisions:

- **Friction-based horizontal movement** — acceleration and deceleration feel weighty, not instant
- **Jump buffering + coyote time** — inputs are queued so the game responds to player intent, not just frame-perfect timing
- **Dash system** — includes an attack-cancel window and a level-gated invulnerability unlock that rewards progression
- **Invincibility frames** — brief post-damage i-frames prevent frustrating chain-hits

### Combat System

- Directional hitboxes with wind-up and cooldown phases — attacks have commitment, creating readable timing for both player and enemies
- **Hit pause** on successful strikes for tactile feedback
- **Knockback physics** applied to both player and enemies, calculated independently from movement
- **Healing Orbs** spawn every 4 successful hits, rewarding aggressive play; an overheal system with decay prevents passive stacking

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
├── Game.js               # Central orchestrator — game loop, ELO state, subsystem wiring
├── Constants.js          # Single source of truth for all tunable values
├── InputManager.js       # Decoupled input handling
├── Camera.js             # Lerp-based follow with world clamping + screen shake
├── CollisionSystem.js    # Centralized AABB detection — entities do not self-resolve
├── LevelManager.js       # Procedural platform generation, wave scaling, transitions
├── HUD.js                # Animated HP bar, ELO bar, level indicator, event messages
├── entities/
│   ├── Player.js
│   ├── Enemy.js          # State machine: Idle → Chase → Attack → Stunned → Dead
│   └── Boss.js           # Phase 2 trigger, charge behavior, warning effects
```

### Design Decisions Worth Noting

**Centralized collision vs. entity self-resolution**  
All AABB collision detection runs through `CollisionSystem` rather than individual entities resolving their own overlaps. This keeps physics predictable and makes it straightforward to extend with new entity types or collision rules without touching existing entities.

**State machine AI**  
Each enemy runs a discrete state machine (`Idle → Chase → Attack → Stunned → Dead`). Transitions are explicit and readable. The boss extends this with phase-aware behavior and a charge attack that triggers at 50% HP, demonstrating the scalability of the pattern.

**Delta-time movement**  
All movement and physics calculations are multiplied by `deltaTime`, making the game frame-rate independent. This is critical for consistent feel across different hardware.

**`Constants.js` as tuning surface**  
Every gameplay value — speeds, cooldowns, ELO gains, knockback force — lives in a single file. This was a deliberate decision to support rapid iteration and avoid magic numbers scattered across the codebase.

---

## 📈 Progression System

```
Starting ELO: 1000
+10  per standard enemy defeated
+100 per boss defeated
```

- ELO is displayed as an animated **segmented bar** in the HUD
- Boss stats, wave composition, and platform layouts **scale with level**
- Bosses enter **Phase 2 at 50% HP** with enhanced behavior and reward multiplier
- Level transitions trigger automatically after wave + boss clear

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Language | JavaScript (ES6 Modules) |
| Rendering | HTML5 Canvas API |
| Architecture | Modular ES6, no bundler required |
| Physics | Custom AABB, friction, knockback |
| AI | Discrete state machines |
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
| Projectile-based boss phases | 🔄 In Progress |
| Sprite sheet animation pipeline | 🔄 In Progress |
| Sound effects & background music | 📋 Planned |
| Pause menu | 📋 Planned |
| Save / load progression | 📋 Planned |
| TypeScript migration | 📋 Planned |
| Performance optimization pass | 📋 Planned |
| Mini-engine extraction for reuse | 📋 Planned |

---

## 💡 What I Learned / Engineering Reflection

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

<!-- ============================================================ -->
<!-- PLACEHOLDER: Add your GitHub, LinkedIn, portfolio link       -->
<!-- ============================================================ -->

**[Vignesh P C]** — [[GitHub]](https://github.com/Vignesh-P-C) · [[LinkedIn]](https://www.linkedin.com/in/vignesh-p-c/)
