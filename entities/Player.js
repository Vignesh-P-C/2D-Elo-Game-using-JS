import { Entity } from "./Entity.js";
import { WORLD } from "../utils/Constants.js";

export class Player extends Entity {
  constructor(x, y) {
    super(x, y, 40, 60);

    // ❤️ Health
    this.maxHealth = 100;
    this.health = this.maxHealth;

    // 🛡 Invincibility
    this.invincible = false;
    this.invincibleTimer = 0;
    this.invincibleDuration = 0.6; // seconds

    // 🏃 Movement
    this.speed = 250;
    this.facing = 1;

    // 🧠 Physics
    this.gravity = 1800;
    this.jumpForce = 650;
    this.isGrounded = false;

    // 🗡 Melee
    this.isAttacking = false;
    this.attackTimer = 0;
    this.attackDuration = 0.15;
    this.attackCooldown = 0;
    this.attackCooldownDuration = 0.25;
    this.attackDamage = 20;

    // 🎞 Animation
    this.animState = "idle";
    this.animTimer = 0;
    this.attackPhase = "none";

    // 🧨 Combat State
    this.isStunned = false;
    this.stunTimer = 0;
    this.stunDuration = 0.25;

    this.knockbackX = 0;
    this.knockbackY = 0;
  }

  // ========================
  // HIT / DAMAGE
  // ========================
  takeHit(sourceX, damage = 10) {
    if (this.invincible) return;

    this.health -= damage;

    const dir = this.x < sourceX ? -1 : 1;

    this.knockbackX = 420 * dir;
    this.knockbackY = -420;

    this.isStunned = true;
    this.stunTimer = this.stunDuration;

    this.invincible = true;
    this.invincibleTimer = this.invincibleDuration;
  }

  // ========================
  // INPUT
  // ========================
  handleInput(input) {
    if (this.isStunned) return;

    this.vx = 0;

    if (input.isKeyDown("KeyA")) {
      this.vx = -this.speed;
      this.facing = -1;
    }

    if (input.isKeyDown("KeyD")) {
      this.vx = this.speed;
      this.facing = 1;
    }

    if (input.isKeyDown("Space") && this.isGrounded) {
      this.vy = -this.jumpForce;
      this.isGrounded = false;
    }

    if (
      input.isAttacking() &&
      !this.isAttacking &&
      this.attackCooldown <= 0
    ) {
      this.isAttacking = true;
      this.attackTimer = this.attackDuration;
      this.attackPhase = "windup";
      this.animState = "attack";
      this.animTimer = 0;
    }
  }

  // ========================
  // UPDATE
  // ========================
  update(dt, input, canvas) {
    // 🧨 STUN
    if (this.isStunned) {
      this.stunTimer -= dt;

      this.vx = this.knockbackX;
      this.vy = this.knockbackY;

      if (this.stunTimer <= 0) {
        this.isStunned = false;
      }
    } else {
      this.handleInput(input);
    }

    // 🛡 INVINCIBILITY
    if (this.invincible) {
      this.invincibleTimer -= dt;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
      }
    }

    // 🗡 ATTACK
    if (this.isAttacking) {
      this.attackTimer -= dt;
      this.animTimer += dt;

      if (this.attackPhase === "windup" && this.animTimer > 0.05) {
        this.attackPhase = "strike";
        this.animTimer = 0;
      }

      if (this.attackPhase === "strike" && this.animTimer > 0.07) {
        this.attackPhase = "recover";
        this.animTimer = 0;
      }

      if (this.attackTimer <= 0) {
        this.isAttacking = false;
        this.attackCooldown = this.attackCooldownDuration;
        this.attackPhase = "none";
        this.animState = "idle";
      }
    }

    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
    }

    // 🧠 Physics
    this.vy += this.gravity * dt;
    super.update(dt);

    // 🌍 Ground
    const groundY = canvas.height - WORLD.GROUND_HEIGHT;
    if (this.y + this.height >= groundY) {
      this.y = groundY - this.height;
      this.vy = 0;
      this.isGrounded = true;
    }

    // 🧱 Bounds
    this.x = Math.max(0, Math.min(this.x, WORLD.WIDTH - this.width));

    if (!this.isAttacking) {
      this.animState = this.vx !== 0 ? "run" : "idle";
    }
  }

  // ========================
  // ATTACK HITBOX
  // ========================
  getAttackHitbox() {
    if (!this.isAttacking || this.attackPhase !== "strike") return null;

    const width = 45;
    const height = 35;

    return {
      x: this.facing === 1 ? this.x + this.width : this.x - width,
      y: this.y + this.height / 2 - height / 2,
      width,
      height,
    };
  }

  // ========================
  // DRAW
  // ========================
  draw(ctx) {
    ctx.save();

    if (this.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    ctx.font = "32px Arial";

    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    ctx.scale(this.facing, 1);
    ctx.fillText("🥷", -16, 16);

    ctx.restore();
  }
}
