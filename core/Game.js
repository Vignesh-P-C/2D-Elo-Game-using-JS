import { Mob } from "../entities/Mob.js";
import { WORLD } from "../utils/Constants.js";
import { InputManager } from "../input/InputManager.js";
import { Player } from "../entities/Player.js";
import { StateManager } from "./StateManager.js";

export class Game {
  constructor(ctx) {
    this.ctx = ctx;
    this.canvas = ctx.canvas;

    // 🎥 Camera
    this.cameraX = 0;

    // 🎮 Core systems
    this.input = new InputManager(this.canvas);
    this.player = new Player(100, 400);
    this.stateManager = new StateManager();

    // 👾 Enemies
    this.mobs = [];
    this.spawnTimer = 0;
    this.spawnInterval = 2;

    // 🧊 Hit-stop
    this.hitStopTimer = 0;
    this.hitStopDuration = 0.06;

    // 🎥 Screen Shake
    this.shakeTime = 0;
    this.shakeIntensity = 0;
  }

  // ========================
  // EFFECT TRIGGERS
  // ========================
  triggerHitStop(duration = this.hitStopDuration) {
    this.hitStopTimer = Math.max(this.hitStopTimer, duration);
  }

  triggerScreenShake(intensity = 6, duration = 0.12) {
    this.shakeIntensity = intensity;
    this.shakeTime = duration;
  }

  // ========================
  // UPDATE
  // ========================
  update(dt) {
    // 🎥 Update shake EVEN during hit-stop
    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
    }

    // 🧊 HIT-STOP FREEZE
    if (this.hitStopTimer > 0) {
      this.hitStopTimer -= dt;
      return;
    }

    // ☠ GAME OVER
    if (this.stateManager.isGameOver()) {
      if (this.input.isKeyDown("KeyR")) {
        this.resetLevel();
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
        ? this.cameraX - 60
        : this.cameraX + this.canvas.width + 60;

      const direction = fromLeft ? 1 : -1;
      this.mobs.push(new Mob(x, y, direction));
    }

    // ---- COMBAT ----
    const attackHitbox = this.player.getAttackHitbox();

    this.mobs.forEach((mob) => {
      mob.update(dt, this.canvas, this.player);

      // 🗡 PLAYER → MOB
      if (
        attackHitbox &&
        !mob.isDead &&
        !mob.hitThisSwing &&
        isColliding(attackHitbox, mob)
      ) {
        mob.takeDamage(this.player.attackDamage, this.player.x);
        mob.hitThisSwing = true;

        this.triggerHitStop(0.05);
        this.triggerScreenShake(6, 0.1);
      }

      // 👊 MOB → PLAYER
      if (
        !mob.isDead &&
        !mob.hasHitPlayer &&
        !this.player.invincible &&
        isColliding(mob, this.player)
      ) {
        this.player.takeHit(mob.x, mob.damage ?? 10);
        mob.hasHitPlayer = true;

        this.triggerHitStop(0.08);
        this.triggerScreenShake(10, 0.15);
      }
    });

    // Reset mob flags
    if (!this.player.isAttacking) {
      this.mobs.forEach((mob) => (mob.hitThisSwing = false));
    }

    if (!this.player.invincible) {
      this.mobs.forEach((mob) => (mob.hasHitPlayer = false));
    }

    // ---- CLEANUP ----
    this.mobs = this.mobs.filter((mob) => !mob.isDead);

    // ---- DEATH CHECKS ----
    if (
      this.player.y > this.canvas.height + WORLD.DEATH_Y_OFFSET ||
      this.player.health <= 0
    ) {
      this.stateManager.setState("game_over");
    }
  }

  // ========================
  // RENDER
  // ========================
  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 🎥 Shake offset
    let shakeX = 0;
    let shakeY = 0;
    if (this.shakeTime > 0) {
      shakeX = (Math.random() - 0.5) * this.shakeIntensity;
      shakeY = (Math.random() - 0.5) * this.shakeIntensity;
    }

    // ===== WORLD SPACE =====
    ctx.save();
    ctx.translate(-this.cameraX + shakeX, shakeY);

    // Ground
    ctx.fillStyle = "#555";
    ctx.fillRect(
      0,
      this.canvas.height - WORLD.GROUND_HEIGHT,
      WORLD.WIDTH,
      WORLD.GROUND_HEIGHT
    );

    this.player.draw(ctx);
    this.mobs.forEach((mob) => mob.draw(ctx));

    // Debug hitbox
    const hb = this.player.getAttackHitbox();
    if (hb) {
      ctx.fillStyle = "rgba(255,0,0,0.4)";
      ctx.fillRect(hb.x, hb.y, hb.width, hb.height);
    }

    ctx.restore();

    this.drawUI();

    if (this.stateManager.isGameOver()) {
      this.drawDeathScreen();
    }
  }

  // ========================
  // UI
  // ========================
  drawUI() {
    const ctx = this.ctx;
    const ratio = this.player.health / this.player.maxHealth;

    ctx.fillStyle = "#333";
    ctx.fillRect(20, 90, 200, 16);

    ctx.fillStyle = "#E53935";
    ctx.fillRect(20, 90, 200 * ratio, 16);

    ctx.strokeStyle = "white";
    ctx.strokeRect(20, 90, 200, 16);

    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText("Game running", 20, 30);
    ctx.fillText(`Mobs: ${this.mobs.length}`, 20, 60);
  }

  // ========================
  // DEATH SCREEN
  // ========================
  drawDeathScreen() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "#ff3333";
    ctx.font = "bold 64px Arial";
    ctx.textAlign = "center";
    ctx.fillText("YOU DIED", w / 2, h / 2 - 40);

    ctx.font = "32px Arial";
    ctx.fillText("💀", w / 2, h / 2);

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
    this.player.health = this.player.maxHealth;

    this.cameraX = 0;
    this.mobs = [];
  }
}

// ========================
// COLLISION
// ========================
function isColliding(a, b) {
  if (!a || !b) return false;

  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}
