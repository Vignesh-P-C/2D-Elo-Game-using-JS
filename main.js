import { Game } from './game/Game.js';
import { preload } from './utils/AssetLoader.js';

const canvas = document.getElementById('gameCanvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

preload().then(() => {
  const game = new Game(canvas);
  game.start();
});
