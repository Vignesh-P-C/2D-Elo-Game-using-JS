# 2D ELO Game

A browser-based 2D side-scrolling combat game where the player fights mobs,
earns ELO through combat, and progresses through increasingly difficult levels.

## Current Features
- Player movement & camera follow
- Melee attack system
- Enemy knockback
- Basic enemy AI
- Health system

## In Progress
- Hit stun & invincibility frames
- Enemy state machine
- ELO progression tuning

## Tech Stack
- JavaScript (ES6)
- HTML5 Canvas

## Status
🚧 Active development

▶️ Run Locally
```
# clone the repo
git clone https://github.com/<your-username>/2d-elo-game.git

# move into project folder
cd 2d-elo-game

# start a local server (any ONE option)
python -m http.server
# OR
npx serve .
# OR (VS Code users)
# Right click index.html → Open with Live Server
```

Then open in your browser:
```
http://localhost:8000
```
⚠️ Important Note

This project uses modern JavaScript ES modules (import/export),
so it must be served over HTTP.
Opening index.html directly using file:// will not work.