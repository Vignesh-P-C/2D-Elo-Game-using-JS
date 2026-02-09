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
    this.invincibleDuration = 0.6;

    // 🏃 Movement
    this.speed = 250;
    this.facing = 1;

    // 🧠 Physics
    this.gravity = 1800;
    this.jumpForce = 650;
    this.isGrounded = false;

    // 🗡 Attack core
    this.isAttacking = false;
    this.attackTimer = 0;
    this.attackDuration = 0.15;
    this.attackCooldown = 0;
    this.attackCooldownDuration = 0.25;
    this.attackPhase = "none";
    this.animTimer = 0;

    // 🥊 Combo system
    this.comboStep = 0;
    this.comboTimer = 0;
    this.comboWindow = 0.35;
    this.attackDamage = 20;

    // 🧨 Combat state
    this.isStunned = false;
    this.stunTimer = 0;
    this.stunDuration = 0.25;

    this.knockbackX = 0;
    this.knockbackY = 0;

    // 🎞 Animation
    this.animState = "idle";
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

    // Reset combo on getting hit
    this.comboStep = 0;
    this.comboTimer = 0;
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

    // 🥊 Combo attack input
    if (
      input.isAttacking() &&
      !this.isAttacking &&
      this.attackCooldown <= 0
    ) {
      this.startAttack();
    }
  }

  // ========================
  // ATTACK START
  // ========================
  startAttack() {
    this.isAttacking = true;
    this.attackTimer = this.attackDuration;
    this.attackPhase = "windup";
    this.animTimer = 0;
    this.animState = "attack";

    this.comboStep++;
    this.comboTimer = this.comboWindow;

    // Scale damage per combo hit
    this.attackDamage =
      this.comboStep === 1 ? 20 :
      this.comboStep === 2 ? 30 :
      45;
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

    // 🥊 COMBO TIMER
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
    } else {
      this.comboStep = 0;
    }

    // 🗡 ATTACK STATE
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

        // End combo after third hit
        if (this.comboStep >= 3) {
          this.comboStep = 0;
          this.comboTimer = 0;
        }
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
