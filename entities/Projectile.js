// ============================================================
// Projectile.js — Fully implemented but not used by current entities.
// Structured so Boss phase 2 can fire projectiles in a future update.
// Also contains HealingOrb class for player healing mechanic.
// ============================================================

import {
  HEALING_ORB_RADIUS, HEALING_ORB_LIFETIME,
  HEALING_ORB_FLOAT_SPEED, HEALING_ORB_FLOAT_HEIGHT,
  HEALING_ORB_HEAL,
} from '../utils/Constants.js';

export class Projectile {
  /**
   * @param {object} opts
   * @param {number} opts.x       Initial world X (center)
   * @param {number} opts.y       Initial world Y (center)
   * @param {number} opts.vx      Horizontal velocity px/s
   * @param {number} opts.vy      Vertical velocity px/s
   * @param {number} opts.damage  Damage dealt on hit
   * @param {string} opts.owner   'player' | 'mob' | 'boss'
   * @param {number} [opts.radius]  Visual/hitbox radius (default 6)
   * @param {number} [opts.worldWidth]  Deactivate when leaving bounds
   * @param {number} [opts.worldHeight]
   */
  constructor({ x, y, vx, vy, damage, owner, radius = 6, worldWidth = 10000, worldHeight = 10000 }) {
    this.x           = x;
    this.y           = y;
    this.vx          = vx;
    this.vy          = vy;
    this.damage      = damage;
    this.owner       = owner;   // Identifies who to apply damage to
    this.radius      = radius;
    this.active      = true;

    this._worldWidth  = worldWidth;
    this._worldHeight = worldHeight;

    // Visual pulse animation
    this._age = 0;
  }

  // -------------------------------------------------------
  // Update
  // -------------------------------------------------------

  /** @param {number} dt  Delta time in seconds */
  update(dt) {
    if (!this.active) return;

    this._age += dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Deactivate when leaving level bounds
    if (
      this.x < -this.radius ||
      this.x > this._worldWidth  + this.radius ||
      this.y < -this.radius ||
      this.y > this._worldHeight + this.radius
    ) {
      this.active = false;
    }
  }

  /**
   * Deactivate this projectile (e.g., after hitting an entity).
   */
  hit() {
    this.active = false;
  }

  // -------------------------------------------------------
  // Render
  // -------------------------------------------------------

  /** @param {CanvasRenderingContext2D} ctx */
  render(ctx) {
    if (!this.active) return;

    ctx.save();

    // Pulsing glow
    const pulse = 0.6 + 0.4 * Math.sin(this._age * 12);
    const r     = this.radius * pulse;

    // Outer glow
    ctx.beginPath();
    ctx.arc(this.x, this.y, r + 4, 0, Math.PI * 2);
    ctx.fillStyle   = 'rgba(255,220,50,0.2)';
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur  = 12;
    ctx.fill();

    // Core
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.fillStyle = '#FFE44A';
    ctx.fill();

    // Bright center
    ctx.beginPath();
    ctx.arc(this.x, this.y, r * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    ctx.restore();
  }

  // -------------------------------------------------------
  // Collision helpers
  // -------------------------------------------------------

  /**
   * AABB representation for CollisionSystem compatibility.
   * Returns a square bounding box centered on the projectile.
   */
  get bounds() {
    return {
      x:      this.x - this.radius,
      y:      this.y - this.radius,
      width:  this.radius * 2,
      height: this.radius * 2,
    };
  }

  get centerX() { return this.x; }
  get centerY() { return this.y; }
}

// ============================================================
// HealingOrb — Spawned every 4 successful hits, heals player.
// ============================================================

export class HealingOrb {
  /**
   * @param {number} x  World X position (spawn at enemy center)
   * @param {number} y  World Y position
   */
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.spawnY = y; // Reference for floating motion
    this.radius = HEALING_ORB_RADIUS;
    this.healAmount = HEALING_ORB_HEAL;
    this.active = true;
    this.lifetime = HEALING_ORB_LIFETIME;
    this._age = 0;
  }

  /** @param {number} dt  Delta time in seconds */
  update(dt) {
    if (!this.active) return;

    this._age += dt;
    this.lifetime -= dt;

    // Sinusoidal floating motion
    const floatOffset = Math.sin(this._age * HEALING_ORB_FLOAT_SPEED * Math.PI * 2) * HEALING_ORB_FLOAT_HEIGHT;
    this.y = this.spawnY + floatOffset;

    // Expire after lifetime
    if (this.lifetime <= 0) {
      this.active = false;
    }
  }

  /**
   * Called when player picks up the orb.
   */
  pickup() {
    this.active = false;
  }

  /** @param {CanvasRenderingContext2D} ctx */
  render(ctx) {
    if (!this.active) return;

    ctx.save();

    // Fade out in last 2 seconds
    const fadeStart = 2.0;
    if (this.lifetime < fadeStart) {
      ctx.globalAlpha = this.lifetime / fadeStart;
    }

    // Pulsing glow
    const pulse = 0.7 + 0.3 * Math.sin(this._age * 8);
    const r = this.radius * pulse;

    // Outer glow (green)
    ctx.beginPath();
    ctx.arc(this.x, this.y, r + 8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(50,255,100,0.15)';
    ctx.shadowColor = '#32FF64';
    ctx.shadowBlur = 20;
    ctx.fill();

    // Mid glow
    ctx.beginPath();
    ctx.arc(this.x, this.y, r + 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(80,255,120,0.3)';
    ctx.shadowBlur = 15;
    ctx.fill();

    // Core
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.fillStyle = '#50FF80';
    ctx.shadowBlur = 10;
    ctx.fill();

    // Bright center
    ctx.beginPath();
    ctx.arc(this.x, this.y, r * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowBlur = 5;
    ctx.fill();

    // Cross symbol (healing indicator)
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    const crossSize = r * 0.4;
    
    ctx.beginPath();
    ctx.moveTo(this.x - crossSize, this.y);
    ctx.lineTo(this.x + crossSize, this.y);
    ctx.stroke();
    //commit test
    ctx.beginPath();
    ctx.moveTo(this.x, this.y - crossSize);
    ctx.lineTo(this.x, this.y + crossSize);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * AABB for collision detection.
   */
  get bounds() {
    return {
      x: this.x - this.radius,
      y: this.y - this.radius,
      width: this.radius * 2,
      height: this.radius * 2,
    };
  }

  get centerX() { return this.x; }
  get centerY() { return this.y; }
}
