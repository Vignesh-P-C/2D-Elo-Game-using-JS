# 2D ELO Game
**Version:** v0.5.0

A browser-based **2D side-scrolling action game** built with **JavaScript and HTML5 Canvas**.  
The player engages in real-time melee combat against enemies, gains progression through combat, and must survive increasingly challenging encounters.

The project is developed incrementally with a strong focus on **game feel, combat clarity, and clean architecture**.

---

## 🎮 Current Gameplay Features:

- Player movement, jumping, and camera follow
- Melee combat system featuring:
  - Attack wind-up and cooldown
  - Directional knockback
  - Hit stun for enemies
- Enemy AI with state-based behavior:
  - Chase
  - Attack
  - Stunned
  - Dead
- Contact-free enemy attacks (intentional attack logic)
- Player invincibility frames after taking damage
- Smooth percentage-based enemy health UI
- **Game Over / Respawn system**
  - Minecraft-style “YOU DIED” screen
  - Game freezes on death
  - Press `R` to respawn and continue

---

## 🧠 Architecture Highlights

- Modular ES6 structure using `import/export`
- Central game loop with clear `update` and `render` separation
- State-driven enemy AI system
- Global game state management via a State Manager
- Scalable systems designed to support bosses and advanced mechanics later

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
- Boss enemies

- Player knockback and advanced combat reactions

- Scoring / ELO progression system

- Pause menu

- Visual polish (sprites, animations, effects)

- Sound effects and music
```
