// ============================================================
// main.js — Entry point. Handles first load and game restarts.
// ============================================================

import { Game    } from './game/Game.js';
import { preload } from './utils/AssetLoader.js';

const canvas = document.getElementById('gameCanvas');
canvas.width  = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
});

let activeGame = null;

function startGame(previousScores = []) {
  activeGame = new Game(canvas, previousScores, () => {
    const scores = activeGame.getSessionScores();
    activeGame.destroy();
    startGame(scores);
  });
  activeGame.start();
}
preload().then(() => startGame());