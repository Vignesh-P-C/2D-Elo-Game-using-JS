import { Entity } from "./Entity.js";
import { WORLD } from "../utils/Constants.js";

export const MOB_STATES = {
  IDLE: "idle",
  CHASE: "chase",
  STUNNED: "stunned",
  DEAD: "dead",
};

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

    // 🧠 Combat response
    this.hitStun = 0;
    this.knockbackVX = 0;
    this.maxKnockback = 500;

    this.state = MOB_STATES.CHASE;

  }

takeDamage(amount, attackerX = null) {
  this.health -= amount;
  this.hitThisSwing = true;
  this.hitFlashTimer = 0.12;

  // 🧠 Hit stun (milliseconds feel)
this.hitStun = 0.15;
this.state = MOB_STATES.STUNNED;

  // 💥 Directional knockback
  if (attackerX !== null) {
    const dir = this.x < attackerX ? -1 : 1;
    this.knockbackVX = dir * this.maxKnockback;
  }

  if (this.health <= 0) {
    this.isDead = true;
      this.state = MOB_STATES.DEAD;

  }
}

update(dt, canvas) {
  if (this.state === MOB_STATES.DEAD) return;

  if (this.state === MOB_STATES.STUNNED) {
    // 🧠 Stunned: apply knockback only
    this.hitStun -= dt;

    this.x += this.knockbackVX * dt;
    this.knockbackVX *= 0.85;

    if (this.hitStun <= 0) {
      this.state = MOB_STATES.CHASE;
    }
  } 
  else if (this.state === MOB_STATES.CHASE) {
    // 🏃 Normal movement
    this.vx = Math.sign(this.vx) * this.speed;
    super.update(dt);
  }

  // Clamp knockback (safety)
  this.knockbackVX = Math.max(
    -this.maxKnockback,
    Math.min(this.knockbackVX, this.maxKnockback)
  );

  // Hit flash timer
  if (this.hitFlashTimer > 0) {
    this.hitFlashTimer -= dt;
  }

  // Ground lock
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
