# 2D ELO Game
**Version:** v1.0.0

A browser-based **2D side-scrolling combat engine** built with **JavaScript (ES6 Modules)** and **HTML5 Canvas**.
The player engages in **responsive melee combat**, defeats **scaled enemies and bosses**, gains **ELO progression**, and advances through increasingly difficult levels.

The project is developed incrementally with a strong focus on **combat responsiveness, modular architecture, scalability,** and **clean system design**.

---

## 🎮 Current Gameplay Features:
- **Player movement system** featuring:
  - Friction-based horizontal control
  - Jump buffering
  - Coyote time

- **Advanced melee combat** system:
  - Attack wind-up and cooldown
  - Directional hitboxes
  - Hit pause feedback
  - Enemy hit stun

- **Dash mechanic**:
  - Attack cancel window
  - Cooldown system
  - Level-based invulnerability unlock

- **Invincibility frames (i-frames)** after taking damage

- **Knockback physics** for both player and enemies

- **Healing Orb** system:
  - Spawned every 4 successful hits
  - **Overheal** system with decay

- **Enemy AI** with state-based behavior:
  - Idle patrol
  - Chase
  - Attack
  - Stunned
  - Dead

- **Boss system**:
  - Scaled stats per level
  - **Phase 2 trigger at 50% HP**
  - **Charge attack behavior**
  - Warning flash effects
  - Enhanced ELO reward

- **Level system**:
  - Procedural platform generation
  - Scaled enemy waves
  - Boss spawn after wave clear
  - Automatic level transitions
  
- **ELO progression** system:
  - Starting ELO: 1000
  - +10 per mob
  - +100 per boss
  - Animated segmented ELO bar

- **Camera system**:
  - Smooth lerp-based follow
  - World clamping
  - Screen shake on major combat events

- **HUD system**:
  - Animated HP bar
  - Animated ELO bar
  - Level indicator
  - Center-screen event messages


- **Game Over** system:
  - Screen overlay
  - Game loop freeze on death


---

## 🧠 Architecture Highlights

- **Modular ES6 structure** using `import/export`
- Top-level `Game` **orchestrator** controlling:
  - Central game loop
  - ELO state
  - Subsystem wiring
- Fully separated subsystems:
  - `LevelManager`
  - `CollisionSystem`
  - `Camera`
  - `InputManager`
  - `HUD`
- Centralized **AABB collision detection** (entities do not self-resolve collisions)
- **State-driven AI system** for mobs and boss
- Centralized tunable configuration via **`Constants.js`**
- **Frame-rate independent movement** using delta-time
- Scalable structure designed for:
  - Projectiles
  - Advanced boss phases
  - Sprite animation pipeline
  - Future TypeScript migration

---

## ▶️ Run Locally

This project uses **modern JavaScript ES modules**, so it **must be served over HTTP**.

### Option 1: Python (recommended)
```bash
python -m http.server
```
Then open:
```
http://localhost:8000
```
### Option 2: Node.js
```
npx serve .
```
### Option 3: VS Code

Install the Live Server extension

Right-click index.html

Select Open with Live Server

⚠️ Opening index.html directly using file:// will not work.


🛠 Tech Stack
```
- JavaScript (ES6)

- HTML5 Canvas

- CSS

- No external libraries or frameworks
```

🚧 In Progress / Planned
```
- Projectile-based boss phases
- Sprite sheet animation system
- Sound effects and background music
- Pause menu
- Save / load progression
- Performance optimization pass
- TypeScript migration for type safety
- Mini-engine extraction for reuse in future games

```
