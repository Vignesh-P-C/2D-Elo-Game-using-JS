import { Entity } from "./Entity.js";
import { WORLD } from "../utils/Constants.js";

export const MOB_STATES = {
  CHASE: "chase",
  ATTACK: "attack",
  STUNNED: "stunned",
  DEAD: "dead",
};

const MOB_CONFIG = {
  SPEED: 120,
  MAX_HEALTH: 40,
  HIT_FLASH_DURATION: 0.12,
  HIT_STUN_DURATION: 0.15,
  MAX_KNOCKBACK: 500,
  KNOCKBACK_DECAY: 0.85,
  ATTACK_RANGE: 40,
  ATTACK_DAMAGE: 10,
  ATTACK_COOLDOWN: 1.0,
  ATTACK_WINDUP: 0.25,
  HITBOX_WIDTH: 30,
  HEALTH_BAR_OFFSET: 10,
  HEART_SIZE: 18,
};

const MOB_COLORS = {
  NORMAL: "#E53935",
  HIT_FLASH: "#FFCDD2",
  TELEGRAPH: "rgba(255, 235, 59, 0.9)", // yellow warning
  HEART_EMPTY: "#555",
  HEART_FILLED: "red",
};

export class Mob extends Entity {
  constructor(x, y, direction = -1) {
    super(x, y, 40, 40);

    // Movement
    this.speed = MOB_CONFIG.SPEED;
    this.vx = this.speed * direction;

    // Health
    this.maxHealth = MOB_CONFIG.MAX_HEALTH;
    this.health = this.maxHealth;

    // State
    this.state = MOB_STATES.CHASE;
    this.isDead = false;

    // Hit response
    this.hitThisSwing = false;
    this.hitFlashTimer = 0;
    this.hitStun = 0;
    this.knockbackVX = 0;

    // Attack
    this.attackRange = MOB_CONFIG.ATTACK_RANGE;
    this.attackDamage = MOB_CONFIG.ATTACK_DAMAGE;
    this.attackCooldown = 0;
    this.attackCooldownTime = MOB_CONFIG.ATTACK_COOLDOWN;
    this.attackWindup = MOB_CONFIG.ATTACK_WINDUP;
    this.attackTimer = 0;

    // Telegraph
    this.isWindingUp = false;

    // Flags used by Game.js
    this.hasHitPlayer = false;
  }

  // ========================
  // DAMAGE
  // ========================
  takeDamage(amount, attackerX) {
    if (this.isDead) return;

    this.health = Math.max(0, this.health - amount);
    this.hitThisSwing = true;
    this.hitFlashTimer = MOB_CONFIG.HIT_FLASH_DURATION;

    this.state = MOB_STATES.STUNNED;
    this.hitStun = MOB_CONFIG.HIT_STUN_DURATION;

    const dir = this.x < attackerX ? -1 : 1;
    this.knockbackVX = dir * MOB_CONFIG.MAX_KNOCKBACK;

    this.isWindingUp = false;

    if (this.health <= 0) this.die();
  }

  die() {
    this.isDead = true;
    this.state = MOB_STATES.DEAD;
    this.vx = 0;
    this.isWindingUp = false;
  }

  // ========================
  // UPDATE
  // ========================
  update(dt, canvas, player) {
    if (this.state === MOB_STATES.DEAD) return;

    this.updateTimers(dt);

    switch (this.state) {
      case MOB_STATES.STUNNED:
        this.updateStunned(dt);
        break;
      case MOB_STATES.CHASE:
        this.updateChase(dt, player);
        break;
      case MOB_STATES.ATTACK:
        this.updateAttack(dt);
        break;
    }

    this.lockToGround(canvas);
  }

  updateTimers(dt) {
    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;
  }

  updateStunned(dt) {
    this.hitStun -= dt;
    this.x += this.knockbackVX * dt;
    this.knockbackVX *= MOB_CONFIG.KNOCKBACK_DECAY;

    if (this.hitStun <= 0) {
      this.state = MOB_STATES.CHASE;
      this.knockbackVX = 0;
    }
  }

  updateChase(dt, player) {
    const distance = Math.abs(this.x - player.x);

    if (distance < this.attackRange && this.attackCooldown <= 0) {
      this.startAttack();
    } else {
      this.vx = Math.sign(player.x - this.x) * this.speed;
      super.update(dt);
    }
  }

  updateAttack(dt) {
    this.attackTimer -= dt;

    if (this.attackTimer <= 0) {
      this.isWindingUp = false;
      this.attackCooldown = this.attackCooldownTime;
      this.state = MOB_STATES.CHASE;
    }
  }

  startAttack() {
    this.state = MOB_STATES.ATTACK;
    this.attackTimer = this.attackWindup;
    this.vx = 0;
    this.isWindingUp = true;
  }

  // ========================
  // HITBOX (USED BY GAME.JS)
  // ========================
  getAttackHitbox(player) {
    if (this.state !== MOB_STATES.ATTACK) return null;

    const facingRight = this.x < player.x;

    return {
      x: this.x + (facingRight ? this.width : -MOB_CONFIG.HITBOX_WIDTH),
      y: this.y,
      width: MOB_CONFIG.HITBOX_WIDTH,
      height: this.height,
    };
  }

  lockToGround(canvas) {
    const groundY = canvas.height - WORLD.GROUND_HEIGHT;
    this.y = groundY - this.height;
  }

  // ========================
  // DRAW
  // ========================
  draw(ctx) {
    // Telegraph ring
    if (this.isWindingUp) {
      ctx.strokeStyle = MOB_COLORS.TELEGRAPH;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(
        this.x + this.width / 2,
        this.y + this.height / 2,
        28,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }

    // Body
    ctx.fillStyle =
      this.hitFlashTimer > 0 ? MOB_COLORS.HIT_FLASH : MOB_COLORS.NORMAL;

    super.draw(ctx);
    this.drawHealth(ctx);
  }

  drawHealth(ctx) {
    const ratio = this.health / this.maxHealth;
    const x = this.x;
    const y = this.y - MOB_CONFIG.HEALTH_BAR_OFFSET;

    ctx.font = `${MOB_CONFIG.HEART_SIZE}px Arial`;
    ctx.fillStyle = MOB_COLORS.HEART_EMPTY;
    ctx.fillText("❤️", x, y);

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y - 18 + 18 * (1 - ratio), 18, 18 * ratio);
    ctx.clip();

    ctx.fillStyle = MOB_COLORS.HEART_FILLED;
    ctx.fillText("❤️", x, y);
    ctx.restore();
  }
}
