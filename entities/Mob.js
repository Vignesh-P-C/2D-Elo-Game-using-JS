import { Entity } from "./Entity.js";
import { WORLD } from "../utils/Constants.js";

export class Mob extends Entity {
  constructor(x, y, direction = -1) {
    super(x, y, 40, 40);

    this.speed = 120;
    this.vx = this.speed * direction;

    // ❤️ Health
    this.maxHealth = 40;
    this.health = this.maxHealth;

    // 🗡 Hit control
    this.hitThisSwing = false;
    this.hitFlashTimer = 0;

    // 💀 State
    this.isDead = false;
  }

  takeDamage(amount) {
    this.health -= amount;
    this.hitThisSwing = true;
    this.hitFlashTimer = 0.12; // flash duration

    if (this.health <= 0) {
      this.isDead = true;
    }
  }

  update(dt, canvas) {
    if (this.isDead) return;

    super.update(dt);

    // Hit flash timer
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
    }

    // Ground lock (safe)
    const groundY = canvas.height - WORLD.GROUND_HEIGHT;
    this.y = groundY - this.height;
  }

  draw(ctx) {
    // Flash when hit
    ctx.fillStyle =
      this.hitFlashTimer > 0 ? "#FFCDD2" : "#E53935";

    super.draw(ctx);

    // Small health bar
    ctx.fillStyle = "black";
    ctx.fillRect(this.x, this.y - 6, this.width, 4);

    ctx.fillStyle = "lime";
    ctx.fillRect(
      this.x,
      this.y - 6,
      this.width * (this.health / this.maxHealth),
      4
    );
  }
}
