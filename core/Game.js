import { Mob } from "../entities/Mob.js";
import { WORLD } from "../utils/Constants.js";
import { InputManager } from "../input/InputManager.js";
import { Player } from "../entities/Player.js";
import { StateManager } from "./StateManager.js";


export class Game {
  constructor(ctx) {
    this.ctx = ctx;
    this.canvas = ctx.canvas;

    this.cameraX = 0;

    this.input = new InputManager(this.canvas);
    this.player = new Player(100, 400);

    this.mobs = [];
    this.spawnTimer = 0;
    this.spawnInterval = 2;
    this.stateManager = new StateManager();

  }

  update(dt) {
    if (this.stateManager.isGameOver()) {
  // Respawn input
  if (this.input.isKeyDown("KeyR")) {
    this.resetLevel();
    this.player.health = this.player.maxHealth;
    this.stateManager.setState("playing");
  }
  return;
}

    // ---- PLAYER ----
    this.player.update(dt, this.input, this.canvas);

    // ---- CAMERA ----
    const halfScreen = this.canvas.width / 2;
    const maxCameraX = WORLD.WIDTH - this.canvas.width;

    if (
      this.player.x > halfScreen &&
      this.player.x < WORLD.WIDTH - halfScreen
    ) {
      this.cameraX = this.player.x - halfScreen;
    }

    this.cameraX = Math.max(0, Math.min(this.cameraX, maxCameraX));

    // ---- SPAWN MOBS ----
    this.spawnTimer += dt;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;

      const fromLeft = Math.random() < 0.5;
      const y = this.canvas.height - WORLD.GROUND_HEIGHT - 40;

      const x = fromLeft
        ? this.cameraX - 50
        : this.cameraX + this.canvas.width + 50;

      const direction = fromLeft ? 1 : -1;
      this.mobs.push(new Mob(x, y, direction));
    }

    // ---- UPDATE MOBS + COMBAT ----
    const attackHitbox = this.player.getAttackHitbox();

    this.mobs.forEach((mob) => {
mob.update(dt, this.canvas, this.player);

      // 🗡 Player → Mob (melee)
      if (
        attackHitbox !== null &&
        !mob.hitThisSwing &&
        !mob.isDead
      ) {
        if (isColliding(attackHitbox, mob)) {
mob.takeDamage(this.player.attackDamage, this.player.x);
        }
      }

      // Reset hit flag after attack ends
      if (!this.player.isAttacking) {
        mob.hitThisSwing = false;
      }
    });

    // Remove dead mobs
    this.mobs = this.mobs.filter((mob) => !mob.isDead);

    // ---- DEATH CHECK ----
    if (this.player.y > this.canvas.height + WORLD.DEATH_Y_OFFSET) {
      this.resetLevel();
    }

if (this.player.health <= 0) {
  this.stateManager.setState("game_over");
}

  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // ===== WORLD SPACE =====
    this.ctx.save();
    this.ctx.translate(-this.cameraX, 0);

    // Ground
    this.ctx.fillStyle = "#555";
    this.ctx.fillRect(
      0,
      this.canvas.height - WORLD.GROUND_HEIGHT,
      WORLD.WIDTH,
      WORLD.GROUND_HEIGHT
    );

    // Player
    this.player.draw(this.ctx);

    // Mobs
    this.mobs.forEach((mob) => mob.draw(this.ctx));

    // 🟥 SAFE DEBUG: attack hitbox
    const hb = this.player.getAttackHitbox();
    if (hb) {
      this.ctx.fillStyle = "rgba(255, 0, 0, 0.4)";
      this.ctx.fillRect(hb.x, hb.y, hb.width, hb.height);
    }

    this.ctx.restore();

    // ===== UI =====
    const barWidth = 200;
    const barHeight = 16;
    const healthRatio = this.player.health / this.player.maxHealth;

    this.ctx.fillStyle = "#333";
    this.ctx.fillRect(20, 90, barWidth, barHeight);

    this.ctx.fillStyle = "#E53935";
    this.ctx.fillRect(20, 90, barWidth * healthRatio, barHeight);

    this.ctx.strokeStyle = "white";
    this.ctx.strokeRect(20, 90, barWidth, barHeight);

    this.ctx.fillStyle = "white";
    this.ctx.font = "20px Arial";
    this.ctx.fillText("Game running", 20, 30);
    this.ctx.fillText(`Mobs: ${this.mobs.length}`, 20, 60);

    if (this.stateManager.isGameOver()) {
  this.drawDeathScreen();
}

  }
drawDeathScreen() {
  const ctx = this.ctx;
  const w = this.canvas.width;
  const h = this.canvas.height;

  // Dark overlay
  ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
  ctx.fillRect(0, 0, w, h);

  // YOU DIED
  ctx.fillStyle = "#ff3333";
  ctx.font = "bold 64px Arial";
  ctx.textAlign = "center";
  ctx.fillText("YOU DIED", w / 2, h / 2 - 40);

  // Optional emoji flair
  ctx.font = "32px Arial";
  ctx.fillText("💀", w / 2, h / 2);

  // Respawn hint
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Press R to Respawn", w / 2, h / 2 + 60);

  ctx.textAlign = "left";
}


  resetLevel() {
    this.player.x = 100;
    this.player.y = 0;
    this.player.vx = 0;
    this.player.vy = 0;
    this.cameraX = 0;
    this.mobs = [];
  }
  
}

// ✅ SAFE collision (prevents freezes forever)
function isColliding(a, b) {
  if (!a || !b) return false;

  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}
