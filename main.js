// ============================================================
// main.js — Entry point. Handles start screen, first load, restarts.
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

// -------------------------------------------------------
// Start Screen
// -------------------------------------------------------

function _spawnStars() {
  const layer = document.getElementById('starsLayer');
  if (!layer) return;
  for (let i = 0; i < 120; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    const size = 0.8 + Math.random() * 2;
    star.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random()*100}%;
      top:${Math.random()*100}%;
      --d:${(2 + Math.random()*4).toFixed(1)}s;
      animation-delay:${(Math.random()*3).toFixed(1)}s;
    `;
    layer.appendChild(star);
  }
}

function _showStartScreen() {
  const screen  = document.getElementById('startScreen');
  const playBtn = document.getElementById('playBtn');
  if (!screen || !playBtn) { _launchGame(); return; }

  _spawnStars();

  playBtn.addEventListener('click', () => {
    // Fade out start screen, then show canvas and launch
    screen.style.transition = 'opacity 0.4s ease';
    screen.style.opacity    = '0';
    screen.addEventListener('transitionend', () => {
      screen.style.display = 'none';
      canvas.style.display = 'block';
      _launchGame();
    }, { once: true });
  }, { once: true });
}

function _launchGame() {
  preload().then(() => startGame());
}

_showStartScreen();