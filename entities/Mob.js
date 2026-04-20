// ============================================================
// Mob.js — Enemy entity with state-machine AI.
// ============================================================

import {
  MOB_WIDTH, MOB_HEIGHT,
  MOB_DAMAGE, MOB_ATTACK_COOLDOWN, MOB_ATTACK_RANGE,
  MOB_ATTACK_DURATION, MOB_CHASE_RANGE, MOB_PATROL_RANGE,
  MOB_STUN_DURATION, MOB_DEATH_DURATION,
  MOB_KNOCKBACK_X, MOB_KNOCKBACK_Y,
  MOB_ELO_VALUE,
  SPEEDER_SPEED_MULTIPLIER, SPEEDER_HP_MULTIPLIER,
  SHIELDER_WIDTH, SHIELDER_HEIGHT,
  GRAVITY,
  STATE,
  COLOR_MOB, COLOR_MOB_STUNNED, COLOR_MOB_OUTLINE,
  COLOR_SPEEDER, COLOR_SPEEDER_OUTLINE,
  COLOR_SHIELDER, COLOR_SHIELDER_OUTLINE, COLOR_SHIELDER_SHIELD,
} from '../utils/Constants.js';
import { clamp } from '../utils/MathUtils.js';

export class Mob {
  /**
   * @param {number} x       Spawn world-space X
   * @param {number} y       Spawn world-space Y
   * @param {number} level   Current game level (for scaling)
   * @param {string} type    Enemy type: 'normal', 'speeder', or 'shielder'
   */
  constructor(x, y, level = 1, type = 'normal') {
    this.type = type;  // Store enemy type
    
    this.x = x;
    this.y = y;
    
    // Dimensions based on type
    if (type === 'shielder') {
      this.width  = SHIELDER_WIDTH;
      this.height = SHIELDER_HEIGHT;
    } else {
      this.width  = MOB_WIDTH;
      this.height = MOB_HEIGHT;
    }

    this.vx = 0;
    this.vy = 0;

    this.onGround = false;
    this.facing   = -1; // face left initially

    // Scaled stats with type multipliers
    const baseHp = 40 + (level - 1) * 15;
    const baseSpeed = 90 + (level - 1) * 10;
    
    if (type === 'speeder') {
      this.maxHp = baseHp * SPEEDER_HP_MULTIPLIER;
      this.speed = baseSpeed * SPEEDER_SPEED_MULTIPLIER;
    } else {
      this.maxHp = baseHp;
      this.speed = baseSpeed;
    }
    
    this.hp = this.maxHp;

    this.damage         = MOB_DAMAGE;
    this.attackCooldown = MOB_ATTACK_COOLDOWN;
    this.eloValue       = MOB_ELO_VALUE;

    // State
    this.state = STATE.IDLE;

    // Spawn / patrol
    this.spawnX      = x;
    this.patrolDir   = 1; // 1 = right, -1 = left
    this.patrolTimer = 0;

    // Timers
    this.stunTimer      = 0;
    this.deathTimer     = 0;
    this.attackTimer    = 0;     // hitbox active duration
    this._attackCDTimer = 0;     // cooldown between attacks

    // Hitbox for attack
    this.attackHitbox = null;

    // Remove flag — set true when death animation finishes
    this.remove = false;

    // Death animation state
    this._deathAlpha  = 1;
    this._deathScaleY = 1;
    
    // Shielder-specific: blocking state
    this.isBlocking = false;
  }

  // -------------------------------------------------------

  landOnGround() {
    this.onGround = true;
    if (this.vy > 0) this.vy = 0;
  }

  /**
   * Receive a hit from the player.
   * @param {number} damage
   * @param {number} sourceX  X center of attacker
   */
  takeHit(damage, sourceX) {
    if (this.state === STATE.DEAD) return;

    // Shielder blocking logic
    if (this.type === 'shielder' && this.isBlocking) {
      // Blocked! No damage, but still apply knockback
      const dir = this.x + this.width / 2 > sourceX ? 1 : -1;
      this.vx = dir * MOB_KNOCKBACK_X * 0.3; // Reduced knockback when blocking
      this.vy = MOB_KNOCKBACK_Y * 0.3;
      return;
    }

    this.hp = Math.max(0, this.hp - damage);

    // Knockback direction: away from attacker
    const dir = this.x + this.width / 2 > sourceX ? 1 : -1;
    this.vx = dir * MOB_KNOCKBACK_X;
    this.vy = MOB_KNOCKBACK_Y;

    if (this.hp <= 0) {
      this._die();
    } else {
      this.state      = STATE.STUNNED;
      this.stunTimer  = MOB_STUN_DURATION;
      this.attackHitbox = null;
      this.isBlocking = false; // Drop block when stunned
    }
  }

  _die() {
    this.state      = STATE.DEAD;
    this.deathTimer = MOB_DEATH_DURATION;
    this.attackHitbox = null;
    this.vx = 0;
  }

  // -------------------------------------------------------
  // Update
  // -------------------------------------------------------

  /**
   * @param {number} dt
   * @param {object} player  Player instance (for AI targeting)
   * @param {number} worldWidth
   */
  update(dt, player, worldWidth) {
    // --- Death animation ---
    if (this.state === STATE.DEAD) {
      this.deathTimer -= dt;
      this._deathAlpha  = Math.max(0, this.deathTimer / MOB_DEATH_DURATION);
      this._deathScaleY = Math.max(0.05, this.deathTimer / MOB_DEATH_DURATION);
      this.vy += GRAVITY * dt;
      this.y  += this.vy * dt;
      this.attackHitbox = null;
      if (this.deathTimer <= 0) this.remove = true;
      return;
    }

    // --- Gravity ---
    if (!this.onGround) {
      this.vy += GRAVITY * dt;
    }

    // --- Stun ---
    if (this.state === STATE.STUNNED) {
      this.stunTimer -= dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.vx *= 0.85;
      this.attackHitbox = null;
      if (this.stunTimer <= 0) {
        this.state = STATE.IDLE;
      }
      this.onGround = false;
      return;
    }

    // Attack cooldown timer
    if (this._attackCDTimer > 0) this._attackCDTimer -= dt;

    // Attack hitbox duration
    if (this.attackTimer > 0) {
      this.attackTimer -= dt;
      this._updateAttackHitbox();
      if (this.attackTimer <= 0) {
        this.attackHitbox = null;
      }
    }

    // --- AI ---
    this._runAI(dt, player);

    // --- Movement ---
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // World horizontal clamp
    this.x = clamp(this.x, 0, worldWidth - this.width);

    this.onGround = false;
  }

  _runAI(dt, player) {
    if (!player || !player.alive) {
      this._patrol(dt);
      this.isBlocking = false;
      return;
    }

    const mobCX   = this.x + this.width  / 2;
    const mobCY   = this.y + this.height / 2;
    const playCX  = player.x + player.width  / 2;
    const playCY  = player.y + player.height / 2;
    const distX   = Math.abs(mobCX - playCX);
    const dist    = Math.sqrt(distX * distX + (mobCY - playCY) ** 2);

    // Shielder blocking logic: block when player is in front
    if (this.type === 'shielder') {
      const playerIsInFront = (this.facing === 1 && playCX > mobCX) || 
                              (this.facing === -1 && playCX < mobCX);
      // Block if player in front and not currently attacking
      this.isBlocking = playerIsInFront && this.state !== STATE.ATTACKING;
    }

    if (dist <= MOB_ATTACK_RANGE && this._attackCDTimer <= 0) {
      this._doAttack(player);
    } else if (dist <= MOB_CHASE_RANGE) {
      this._chase(playCX);
    } else {
      this._patrol(dt);
    }
  }

  _patrol(dt) {
    this.state = STATE.IDLE;
    this.patrolTimer += dt;

    // Change direction every ~1.5s or at patrol bounds
    const leftBound  = this.spawnX - MOB_PATROL_RANGE;
    const rightBound = this.spawnX + MOB_PATROL_RANGE;

    if (this.x <= leftBound)  this.patrolDir =  1;
    if (this.x >= rightBound) this.patrolDir = -1;

    if (this.patrolTimer > 1.5) {
      this.patrolDir   = -this.patrolDir;
      this.patrolTimer = 0;
    }

    this.vx     = this.patrolDir * (this.speed * 0.4);
    this.facing = this.patrolDir;
  }

  _chase(targetCX) {
    this.state  = STATE.CHASE;
    const dir   = targetCX > this.x + this.width / 2 ? 1 : -1;
    this.vx     = dir * this.speed;
    this.facing = dir;
  }

  _doAttack(player) {
    this.state         = STATE.ATTACKING;
    this.attackTimer   = MOB_ATTACK_DURATION;
    this._attackCDTimer = this.attackCooldown;
    this.vx = 0;
    this.isBlocking = false; // Drop shield during attack
    this._updateAttackHitbox();
  }

  _updateAttackHitbox() {
    const cx = this.x + this.width  / 2;
    const cy = this.y + this.height / 2;
    const range = MOB_ATTACK_RANGE * 1.2;
    this.attackHitbox = {
      x:      cx + this.facing * (this.width / 2) - (this.facing === 1 ? 0 : range),
      y:      cy - 18,
      width:  range,
      height: 36,
    };
  }

  // -------------------------------------------------------
  // Render
  // -------------------------------------------------------

  /** @param {CanvasRenderingContext2D} ctx */
  render(ctx) {
    if (this.remove) return;

    ctx.save();

    if (this.state === STATE.DEAD) {
      ctx.globalAlpha = this._deathAlpha;
      const scaleY = this._deathScaleY;
      const offsetY = this.height * (1 - scaleY);
      
      // Color based on type
      let fillColor = COLOR_MOB;
      if (this.type === 'speeder') fillColor = COLOR_SPEEDER;
      if (this.type === 'shielder') fillColor = COLOR_SHIELDER;
      
      let outlineColor = COLOR_MOB_OUTLINE;
      if (this.type === 'speeder') outlineColor = COLOR_SPEEDER_OUTLINE;
      if (this.type === 'shielder') outlineColor = COLOR_SHIELDER_OUTLINE;
      
      ctx.fillStyle   = fillColor;
      ctx.strokeStyle = outlineColor;
      ctx.lineWidth   = 2;
      ctx.fillRect(this.x, this.y + offsetY, this.width, this.height * scaleY);
      ctx.strokeRect(this.x, this.y + offsetY, this.width, this.height * scaleY);
      ctx.restore();
      return;
    }

    // Body color based on type and state
    let fill = COLOR_MOB;
    let outline = COLOR_MOB_OUTLINE;
    
    if (this.type === 'speeder') {
      fill = this.state === STATE.STUNNED ? COLOR_SPEEDER : COLOR_SPEEDER;
      outline = COLOR_SPEEDER_OUTLINE;
    } else if (this.type === 'shielder') {
      fill = this.state === STATE.STUNNED ? COLOR_MOB_STUNNED : COLOR_SHIELDER;
      outline = COLOR_SHIELDER_OUTLINE;
    } else {
      fill = this.state === STATE.STUNNED ? COLOR_MOB_STUNNED : COLOR_MOB;
      outline = COLOR_MOB_OUTLINE;
    }

    ctx.shadowColor   = 'rgba(0,0,0,0.35)';
    ctx.shadowOffsetY = 3;
    ctx.shadowBlur    = 5;

    ctx.fillStyle   = fill;
    ctx.strokeStyle = outline;
    ctx.lineWidth   = 2;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.strokeRect(this.x, this.y, this.width, this.height);

    ctx.shadowColor = 'transparent';

    // Shielder shield visual when blocking
    if (this.type === 'shielder' && this.isBlocking) {
      const shieldX = this.facing === 1 
        ? this.x + this.width 
        : this.x - 8;
      const shieldY = this.y + this.height * 0.2;
      const shieldH = this.height * 0.6;
      
      ctx.fillStyle = COLOR_SHIELDER_SHIELD;
      ctx.globalAlpha = 0.7;
      ctx.fillRect(shieldX, shieldY, 8, shieldH);
      ctx.strokeStyle = COLOR_SHIELDER_OUTLINE;
      ctx.lineWidth = 2;
      ctx.strokeRect(shieldX, shieldY, 8, shieldH);
      ctx.globalAlpha = 1;
    }

    // Health bar above mob
    this._renderHealthBar(ctx);

    // Eye / facing
    this._renderFace(ctx);

    // Attack hitbox visualisation
    if (this.attackHitbox) {
      ctx.fillStyle   = 'rgba(226,74,74,0.25)';
      ctx.strokeStyle = 'rgba(226,74,74,0.7)';
      ctx.lineWidth   = 1;
      ctx.fillRect(this.attackHitbox.x, this.attackHitbox.y, this.attackHitbox.width, this.attackHitbox.height);
      ctx.strokeRect(this.attackHitbox.x, this.attackHitbox.y, this.attackHitbox.width, this.attackHitbox.height);
    }

    ctx.restore();
  }

  _renderHealthBar(ctx) {
    const barW = this.width;
    const barH = 5;
    const barX = this.x;
    const barY = this.y - 10;
    const ratio = this.hp / this.maxHp;

    ctx.fillStyle = '#4a1a1a';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = '#e84040';
    ctx.fillRect(barX, barY, barW * ratio, barH);
    ctx.strokeStyle = '#000';
    ctx.lineWidth   = 1;
    ctx.strokeRect(barX, barY, barW, barH);
  }

  _renderFace(ctx) {
    const eyeX = this.facing === 1
      ? this.x + this.width * 0.65
      : this.x + this.width * 0.2;
    const eyeY = this.y + 14;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, 4, 0, Math.PI * 2);
    ctx.fill();
    // Pupil
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(eyeX + this.facing * 1.5, eyeY + 1, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  get bounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  get centerX() { return this.x + this.width  / 2; }
  get centerY() { return this.y + this.height / 2; }
}