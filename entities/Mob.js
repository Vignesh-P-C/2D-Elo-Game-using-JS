import { Entity } from "./Entity.js";
import { WORLD } from "../utils/Constants.js";

export const MOB_STATES = {
  IDLE: "idle",
  CHASE: "chase",
  ATTACK: "attack",
  STUNNED: "stunned",
  DEAD: "dead",
};

// Configuration constants
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
  HEART_EMPTY: "#555",
  HEART_FILLED: "red",
};

export class Mob extends Entity {
  constructor(x, y, direction = -1) {
    super(x, y, 40, 40);

    // Movement
    this.speed = MOB_CONFIG.SPEED;
    this.vx = this.speed * direction;
    this.knockbackVX = 0;

    // Health
    this.maxHealth = MOB_CONFIG.MAX_HEALTH;
    this.health = this.maxHealth;

    // Combat state
    this.state = MOB_STATES.CHASE;
    this.isDead = false;
    
    // Hit response
    this.hitThisSwing = false;
    this.hitFlashTimer = 0;
    this.hitStun = 0;

    // Attack
    this.attackRange = MOB_CONFIG.ATTACK_RANGE;
    this.attackDamage = MOB_CONFIG.ATTACK_DAMAGE;
    this.attackCooldown = 0;
    this.attackCooldownTime = MOB_CONFIG.ATTACK_COOLDOWN;
    this.attackWindup = MOB_CONFIG.ATTACK_WINDUP;
    this.attackTimer = 0;
  }

  /**
   * Apply damage to the mob
   * @param {number} amount - Damage amount
   * @param {number|null} attackerX - X position of attacker for knockback direction
   */
  takeDamage(amount, attackerX = null) {
    if (this.isDead) return;

    this.health = Math.max(0, this.health - amount);
    this.hitThisSwing = true;
    this.hitFlashTimer = MOB_CONFIG.HIT_FLASH_DURATION;

    // Apply hit stun
    this.hitStun = MOB_CONFIG.HIT_STUN_DURATION;
    this.state = MOB_STATES.STUNNED;

    // Apply knockback
    if (attackerX !== null) {
      const direction = this.x < attackerX ? -1 : 1;
      this.knockbackVX = direction * MOB_CONFIG.MAX_KNOCKBACK;
    }

    // Check for death
    if (this.health <= 0) {
      this.die();
    }
  }

  /**
   * Handle mob death
   */
  die() {
    this.isDead = true;
    this.state = MOB_STATES.DEAD;
    this.vx = 0;
  }

  /**
   * Update mob state and behavior
   */
  update(dt, canvas, player) {
    if (this.state === MOB_STATES.DEAD) return;

    // Update timers
    this.updateTimers(dt);

    // State machine
    switch (this.state) {
      case MOB_STATES.STUNNED:
        this.updateStunned(dt);
        break;
      case MOB_STATES.CHASE:
        this.updateChase(dt, player);
        break;
      case MOB_STATES.ATTACK:
        this.updateAttack(dt, player);
        break;
    }

    // Lock to ground
    this.lockToGround(canvas);
  }

  /**
   * Update all timers
   */
  updateTimers(dt) {
    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
    }
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
    }
  }

  /**
   * Update stunned state
   */
  updateStunned(dt) {
    this.hitStun -= dt;

    // Apply knockback with decay
    this.x += this.knockbackVX * dt;
    this.knockbackVX *= MOB_CONFIG.KNOCKBACK_DECAY;

    // Exit stun
    if (this.hitStun <= 0) {
      this.state = MOB_STATES.CHASE;
      this.knockbackVX = 0;
    }
  }

  /**
   * Update chase state
   */
  updateChase(dt, player) {
    const distanceToPlayer = Math.abs(this.x - player.x);

    // Check if in attack range
    if (distanceToPlayer < this.attackRange && this.attackCooldown <= 0) {
      this.startAttack();
    } else {
      // Move towards player
      this.vx = Math.sign(player.x - this.x) * this.speed;
      super.update(dt);
    }
  }

  /**
   * Update attack state
   */
  updateAttack(dt, player) {
    this.attackTimer -= dt;

    if (this.attackTimer <= 0) {
      this.performAttack(player);
      this.attackCooldown = this.attackCooldownTime;
      this.state = MOB_STATES.CHASE;
    }
  }

  /**
   * Start attack sequence
   */
  startAttack() {
    this.state = MOB_STATES.ATTACK;
    this.attackTimer = this.attackWindup;
    this.vx = 0; // Stop moving during attack
  }

  /**
   * Execute attack on player
   */
  performAttack(player) {
    if (player.invincible || player.isDead) return;

    const hitbox = this.getAttackHitbox(player);

    if (this.checkHitboxCollision(hitbox, player)) {
      player.takeDamage(this.attackDamage);
    }
  }

  /**
   * Get attack hitbox based on mob and player positions
   */
  getAttackHitbox(player) {
    const facingRight = this.x < player.x;
    return {
      x: this.x + (facingRight ? this.width : -MOB_CONFIG.HITBOX_WIDTH),
      y: this.y,
      width: MOB_CONFIG.HITBOX_WIDTH,
      height: this.height,
    };
  }

  /**
   * Check collision between hitbox and player
   */
  checkHitboxCollision(hitbox, player) {
    return (
      hitbox.x < player.x + player.width &&
      hitbox.x + hitbox.width > player.x &&
      hitbox.y < player.y + player.height &&
      hitbox.y + hitbox.height > player.y
    );
  }

  /**
   * Lock mob to ground level
   */
  lockToGround(canvas) {
    const groundY = canvas.height - WORLD.GROUND_HEIGHT;
    this.y = groundY - this.height;
  }

  /**
   * Draw mob and health bar
   */
  draw(ctx) {
    // Draw mob body with hit flash
    ctx.fillStyle = this.hitFlashTimer > 0 
      ? MOB_COLORS.HIT_FLASH 
      : MOB_COLORS.NORMAL;
    
    super.draw(ctx);

    // Draw health indicator
    this.drawHealth(ctx);
  }

  /**
   * Draw health as a heart with fill based on health percentage
   */
  drawHealth(ctx) {
    const healthRatio = Math.max(0, Math.min(1, this.health / this.maxHealth));
    const heartX = this.x;
    const heartY = this.y - MOB_CONFIG.HEALTH_BAR_OFFSET;
    const heartSize = MOB_CONFIG.HEART_SIZE;

    // Draw empty heart background
    ctx.font = `${heartSize}px Arial`;
    ctx.fillStyle = MOB_COLORS.HEART_EMPTY;
    ctx.fillText("❤️", heartX, heartY);

    // Draw filled portion (clipped from top)
    ctx.save();
    ctx.beginPath();
    ctx.rect(
      heartX,
      heartY - heartSize + heartSize * (1 - healthRatio),
      heartSize,
      heartSize * healthRatio
    );
    ctx.clip();

    ctx.fillStyle = MOB_COLORS.HEART_FILLED;
    ctx.fillText("❤️", heartX, heartY);
    ctx.restore();
  }

  /**
   * Check if mob is alive
   */
  isAlive() {
    return !this.isDead && this.health > 0;
  }

  /**
   * Get current health percentage
   */
  getHealthPercentage() {
    return (this.health / this.maxHealth) * 100;
  }

  /**
   * Reset mob to initial state (useful for respawning)
   */
  reset(x, y, direction = -1) {
    this.x = x;
    this.y = y;
    this.health = this.maxHealth;
    this.isDead = false;
    this.state = MOB_STATES.CHASE;
    this.vx = this.speed * direction;
    this.knockbackVX = 0;
    this.hitStun = 0;
    this.attackCooldown = 0;
    this.hitFlashTimer = 0;
  }
}