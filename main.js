import { Game } from "./core/Game.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const game = new Game(ctx);

let lastTime = 0;

function gameLoop(time) {
  const delta = (time - lastTime) / 1000;
  lastTime = time;

  game.update(delta);
  game.render();

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
