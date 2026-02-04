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

    // 🗡 Melee
    this.isAttacking = false;
    this.attackTimer = 0;
    this.attackDuration = 0.15;
    this.attackCooldown = 0;
    this.attackCooldownDuration = 0.25;
    this.attackDamage = 20;

    // 🎞 Animation
    this.animState = "idle"; // idle | run | attack
    this.animTimer = 0;
    this.attackPhase = "none"; // windup | strike | recover
  }

  // ========================
  // DAMAGE
  // ========================
  takeDamage(amount) {
    if (this.invincible) return;
    this.health -= amount;
    this.invincible = true;
    this.invincibleTimer = this.invincibleDuration;
  }

  // ========================
  // INPUT
  // ========================
  handleInput(input) {
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

    // 🗡 Attack
    if (
      input.isAttacking() &&
      !this.isAttacking &&
      this.attackCooldown <= 0
    ) {
      this.isAttacking = true;
      this.attackTimer = this.attackDuration;
      this.animState = "attack";
      this.attackPhase = "windup";
      this.animTimer = 0;
    }
  }

  // ========================
  // UPDATE
  // ========================
  update(dt, input, canvas) {
    // Invincibility
    if (this.invincible) {
      this.invincibleTimer -= dt;
      if (this.invincibleTimer <= 0) this.invincible = false;
    }

    // 🗡 Attack animation phases
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

    this.handleInput(input);

    this.vy += this.gravity * dt;
    super.update(dt);

    // Ground
    const groundY = canvas.height - WORLD.GROUND_HEIGHT;
    if (this.y + this.height >= groundY) {
      this.y = groundY - this.height;
      this.vy = 0;
      this.isGrounded = true;
    }

    // Bounds
    if (this.x < 0) this.x = 0;
    if (this.x + this.width > WORLD.WIDTH) {
      this.x = WORLD.WIDTH - this.width;
    }

    // Animation state when not attacking
    if (!this.isAttacking) {
      this.animState = this.vx !== 0 ? "run" : "idle";
    }
  }

  // ========================
  // ATTACK HITBOX (STRIKE ONLY)
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
  // DRAW (ANIMATED)
  // ========================
  draw(ctx) {
    ctx.save();

    let color = this.invincible ? "#A5D6A7" : "#4CAF50";
    let drawWidth = this.width;
    let xOffset = 0;

    // 🏃 Run squash
    if (this.animState === "run") {
      drawWidth += Math.sin(Date.now() * 0.02) * 4;
    }

    // 🗡 Attack animation
    if (this.animState === "attack") {
      color = "#FFC107";

      if (this.attackPhase === "windup") {
        xOffset = -5 * this.facing;
      }

      if (this.attackPhase === "strike") {
        drawWidth += 10;
        xOffset = 5 * this.facing;
      }

      if (this.attackPhase === "recover") {
        drawWidth += 4;
      }
    }

    ctx.fillStyle = color;
    ctx.fillRect(this.x + xOffset, this.y, drawWidth, this.height);

    ctx.restore();
  }
}
