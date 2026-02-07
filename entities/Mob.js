import { Entity } from "./Entity.js";
import { WORLD } from "../utils/Constants.js";

export const MOB_STATES = {
  IDLE: "idle",
  CHASE: "chase",
  ATTACK: "attack",
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
    
    // 🗡 Attack
this.attackRange = 40;
this.attackDamage = 10;
this.attackCooldown = 0;
this.attackCooldownTime = 1.0; // seconds
this.attackWindup = 0.25;
this.attackTimer = 0;

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

update(dt, canvas, player) {
  if (this.state === MOB_STATES.DEAD) return;

  // Cooldown tick
  if (this.attackCooldown > 0) {
    this.attackCooldown -= dt;
  }

  if (this.state === MOB_STATES.STUNNED) {
    this.hitStun -= dt;

    this.x += this.knockbackVX * dt;
    this.knockbackVX *= 0.85;

    if (this.hitStun <= 0) {
      this.state = MOB_STATES.CHASE;
    }
  }

  else if (this.state === MOB_STATES.CHASE) {
    const distance = Math.abs(this.x - player.x);

    // Enter attack
    if (distance < this.attackRange && this.attackCooldown <= 0) {
      this.state = MOB_STATES.ATTACK;
      this.attackTimer = this.attackWindup;
    } else {
      this.vx = Math.sign(player.x - this.x) * this.speed;
      super.update(dt);
    }
  }

  else if (this.state === MOB_STATES.ATTACK) {
    this.attackTimer -= dt;

    if (this.attackTimer <= 0) {
      this.performAttack(player);
      this.attackCooldown = this.attackCooldownTime;
      this.state = MOB_STATES.CHASE;
    }
  }

  // Ground lock
  const groundY = canvas.height - WORLD.GROUND_HEIGHT;
  this.y = groundY - this.height;
}

performAttack(player) {
  if (player.invincible) return;

  const hitbox = {
    x: this.x + (this.x < player.x ? this.width : -30),
    y: this.y,
    width: 30,
    height: this.height,
  };

  const hit =
    hitbox.x < player.x + player.width &&
    hitbox.x + hitbox.width > player.x &&
    hitbox.y < player.y + player.height &&
    hitbox.y + hitbox.height > player.y;

  if (hit) {
    player.takeDamage(this.attackDamage);
  }
}




  draw(ctx) {
    // Flash when hit
    ctx.fillStyle =
      this.hitFlashTimer > 0 ? "#FFCDD2" : "#E53935";

    super.draw(ctx);
// Health bar
// ❤️ Single-heart health (top-down drain)
const healthRatio = Math.max(0, this.health / this.maxHealth);

const heartX = this.x;
const heartY = this.y - 10;
const heartSize = 18;

// Empty heart (background)
ctx.font = `${heartSize}px Arial`;
ctx.fillStyle = "#555";
ctx.fillText("❤️", heartX, heartY);

// Red heart fill (clipped from top)
ctx.save();
ctx.beginPath();
ctx.rect(
  heartX,
  heartY - heartSize + heartSize * (1 - healthRatio), // start lower as health drops
  heartSize,
  heartSize * healthRatio
);
ctx.clip();

ctx.fillStyle = "red";
ctx.fillText("❤️", heartX, heartY);
ctx.restore();
  }
}
