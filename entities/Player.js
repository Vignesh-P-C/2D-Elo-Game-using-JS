// ============================================================
// Player.js — Player entity: physics, state machine, rendering.
// ============================================================

import {
  PLAYER_WIDTH, PLAYER_HEIGHT,
  PLAYER_SPEED, PLAYER_JUMP_FORCE, GRAVITY,
  PLAYER_MAX_HP,
  PLAYER_ATTACK_DAMAGE, PLAYER_ATTACK_RANGE,
  PLAYER_ATTACK_DURATION, PLAYER_ATTACK_COOLDOWN,
  PLAYER_INVULN_DURATION,
  PLAYER_KNOCKBACK_X, PLAYER_KNOCKBACK_Y,
  DASH_DURATION, DASH_COOLDOWN, DASH_SPEED, DASH_INVULN_LEVEL, DASH_ATTACK_CANCEL_TIME,
  COYOTE_TIME, JUMP_BUFFER_TIME, ATTACK_BUFFER_TIME,
  OVERHEAL_DECAY_INTERVAL, OVERHEAL_CAP_MULTIPLIER, OVERHEAL_EFFICIENCY,
  HEALING_ORB_HITS_REQUIRED,
  STATE,
  COLOR_PLAYER_IDLE, COLOR_PLAYER_ATTACK,
  COLOR_PLAYER_HIT, COLOR_PLAYER_DEAD, COLOR_PLAYER_OUTLINE,
} from '../utils/Constants.js';
import { clamp } from '../utils/MathUtils.js';

export class Player {
  /**
   * @param {number} x  Starting world-space X
   * @param {number} y  Starting world-space Y
   */
  constructor(x, y) {
    // Position (top-left of bounding box)
    this.x = x;
    this.y = y;
    this.width  = PLAYER_WIDTH;
    this.height = PLAYER_HEIGHT;

    // Velocity
    this.vx = 0;
    this.vy = 0;

    // Health
    this.hp    = PLAYER_MAX_HP;
    this.maxHp = PLAYER_MAX_HP;

    // Facing: 1 = right, -1 = left
    this.facing = 1;

    // Flags
    this.onGround = false;
    this.alive    = true;

    // State machine
    this.state = STATE.IDLE;

    // Attack timing
    this.attackTimer   = 0;   // time remaining in current attack
    this.attackCooldown = 0;  // time until next attack allowed
    this.attackHitbox  = null; // { x, y, width, height } or null

    // Invulnerability
    this.invulnTimer = 0;

    // Knockback
    this._knockbackActive = false;

    // Visual flicker phase
    this._flickerTimer = 0;
    this._visible = true;

    // --- NEW: Dash system ---
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.dashInvulnerable = false; // Set based on level

    // --- NEW: Healing orb tracking ---
    this.successfulHits = 0;

    // --- NEW: Coyote time ---
    this.coyoteTimer = 0;

    // --- NEW: Jump buffer ---
    this.jumpBufferTimer = 0;

    // --- NEW: Attack buffer ---
    this.attackBuffered = false;

    // --- NEW: Overheal decay ---
    this.overhealDecayTimer = 0;
  }

  // -------------------------------------------------------
  // Public API
  // -------------------------------------------------------

  /** Called by CollisionSystem after resolving ground collision. */
  landOnGround() {
    this.onGround = true;
    if (this.vy > 0) this.vy = 0;
    this.coyoteTimer = COYOTE_TIME; // Reset coyote time when landing
  }

  /**
   * Apply a hit: reduce HP, enter invulnerability, apply knockback.
   * @param {number} damage
   * @param {number} sourceX  X center of attacker (determines knockback dir)
   */
  takeHit(damage, sourceX) {
    // Check dash invulnerability
    if (this.state === STATE.DASHING && this.dashInvulnerable) return;
    if (this.invulnTimer > 0 || !this.alive) return;

    this.hp = Math.max(0, this.hp - damage);
    this.invulnTimer = PLAYER_INVULN_DURATION;

    // Cancel dash on hit
    if (this.state === STATE.DASHING) {
      this.state = STATE.HIT;
      this.dashTimer = 0;
    }

    // Knockback direction: away from attacker
    const dir = this.x + this.width / 2 > sourceX ? 1 : -1;
    this.vx = dir * PLAYER_KNOCKBACK_X;
    this.vy = PLAYER_KNOCKBACK_Y;

    if (this.hp <= 0) {
      this.state = STATE.DEAD;
      this.alive = false;
    } else {
      this.state = STATE.HIT;
    }
  }

  /**
   * Heal player with overheal logic.
   * @param {number} amount  HP to heal
   */
  heal(amount) {
    const newHP = this.hp + amount;
    
    if (newHP > this.maxHp) {
      // Calculate overheal
      const excess = newHP - this.maxHp;
      const overheal = excess * OVERHEAL_EFFICIENCY;
      this.hp = Math.min(this.maxHp + overheal, this.maxHp * OVERHEAL_CAP_MULTIPLIER);
    } else {
      this.hp = Math.min(newHP, this.maxHp);
    }
  }

  /**
   * Increment successful hit counter. Called by CollisionSystem.
   * @returns {boolean} True if should spawn healing orb (every 4 hits)
   */
  registerSuccessfulHit() {
    this.successfulHits++;
    if (this.successfulHits >= HEALING_ORB_HITS_REQUIRED) {
      this.successfulHits = 0;
      return true;
    }
    return false;
  }

  // -------------------------------------------------------
  // Update
  // -------------------------------------------------------

  /**
   * @param {number} dt   Delta time in seconds
   * @param {object} input InputManager instance
   * @param {number} worldWidth  Used to clamp horizontal position
   * @param {number} currentLevel  Current game level (for dash invuln)
   */
  update(dt, input, worldWidth, currentLevel = 1) {
    if (!this.alive) {
      // Still apply gravity so corpse falls
      this.vy += GRAVITY * dt;
      this.y  += this.vy * dt;
      this.attackHitbox = null;
      return;
    }

    // --- Overheal decay ---
    if (this.hp > this.maxHp) {
      this.overhealDecayTimer += dt;
      if (this.overhealDecayTimer >= OVERHEAL_DECAY_INTERVAL) {
        this.hp = Math.max(this.maxHp, this.hp - 1);
        this.overhealDecayTimer = 0;
      }
    } else {
      this.overhealDecayTimer = 0;
    }

    // --- Timers ---
    if (this.attackTimer   > 0) this.attackTimer   -= dt;
    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.invulnTimer   > 0) this.invulnTimer   -= dt;
    if (this.dashTimer     > 0) this.dashTimer     -= dt;
    if (this.dashCooldown  > 0) this.dashCooldown  -= dt;
    if (this.coyoteTimer   > 0) this.coyoteTimer   -= dt;
    if (this.jumpBufferTimer > 0) this.jumpBufferTimer -= dt;

    // Flicker effect during invulnerability
    if (this.invulnTimer > 0) {
      this._flickerTimer += dt;
      this._visible = Math.floor(this._flickerTimer / 0.07) % 2 === 0;
    } else {
      this._visible = true;
      this._flickerTimer = 0;
    }

    // Resolve HIT state (brief stagger)
    if (this.state === STATE.HIT && this.invulnTimer < PLAYER_INVULN_DURATION - 0.15) {
      this.state = STATE.IDLE;
    }

    // --- Dash input ---
    if (input.dash && this.dashCooldown <= 0 && this.state !== STATE.DEAD) {
      // Can dash if not attacking, or if enough time has passed in attack
      const canDashDuringAttack = this.state === STATE.ATTACKING && 
                                  (PLAYER_ATTACK_DURATION - this.attackTimer) >= DASH_ATTACK_CANCEL_TIME;
      
      if (this.state !== STATE.ATTACKING || canDashDuringAttack) {
        this._startDash(currentLevel);
      }
    }

    // --- Dash state ---
    if (this.state === STATE.DASHING) {
      if (this.dashTimer > 0) {
        // Apply dash velocity with ease-out
        const progress = 1 - (this.dashTimer / DASH_DURATION);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const dashSpeed = DASH_SPEED * (1 - easeOut * 0.6);
        this.vx = this.facing * dashSpeed;
        this.attackHitbox = null; // No attack during dash
      } else {
        // Dash finished
        this.state = STATE.IDLE;
        this.vx *= 0.3; // Smooth slowdown
      }
    }

    // --- Horizontal movement (not during dash) ---
    let moving = false;
    if (this.state !== STATE.HIT && this.state !== STATE.DASHING) {
      if (input.left) {
        this.vx    = -PLAYER_SPEED;
        this.facing = -1;
        moving     = true;
      } else if (input.right) {
        this.vx    = PLAYER_SPEED;
        this.facing = 1;
        moving     = true;
      } else {
        // Friction
        this.vx *= 0.75;
        if (Math.abs(this.vx) < 2) this.vx = 0;
      }
    }

    // --- Jump buffer ---
    if (input.jump) {
      this.jumpBufferTimer = JUMP_BUFFER_TIME;
    }

    // --- Jump (with coyote time and buffer) ---
    const canJump = (this.onGround || this.coyoteTimer > 0) && 
                    this.state !== STATE.ATTACKING && 
                    this.state !== STATE.DASHING;
    
    if (this.jumpBufferTimer > 0 && canJump) {
      this.vy = PLAYER_JUMP_FORCE;
      this.onGround = false;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
    }

    // --- Attack buffer ---
    if (input.attack) {
      if (this.attackCooldown <= ATTACK_BUFFER_TIME && this.attackCooldown > 0) {
        this.attackBuffered = true;
      } else if (this.attackCooldown <= 0 && this.state !== STATE.DEAD && this.state !== STATE.DASHING) {
        this._startAttack();
      }
    }

    // Trigger buffered attack
    if (this.attackBuffered && this.attackCooldown <= 0 && this.state !== STATE.DEAD && this.state !== STATE.DASHING) {
      this.attackBuffered = false;
      this._startAttack();
    }

    // --- Attack hitbox lifetime ---
    if (this.state === STATE.ATTACKING) {
      if (this.attackTimer > 0) {
        this._updateAttackHitbox();
      } else {
        this.state = STATE.IDLE;
        this.attackHitbox = null;
      }
    } else if (this.state !== STATE.DASHING) {
      this.attackHitbox = null;
    }

    // --- Gravity ---
    if (!this.onGround && this.state !== STATE.DASHING) {
      this.vy += GRAVITY * dt;
    } else if (this.state === STATE.DASHING) {
      this.vy = 0; // No gravity during dash
    }

    // --- Apply velocity ---
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // --- World horizontal clamp ---
    this.x = clamp(this.x, 0, worldWidth - this.width);

    // Track when leaving ground (for coyote time)
    const wasOnGround = this.onGround;
    
    // Reset ground flag (CollisionSystem sets it back if needed)
    this.onGround = false;

    // Start coyote time when leaving ground (not from jump)
    if (wasOnGround && !this.onGround && this.vy >= 0) {
      this.coyoteTimer = COYOTE_TIME;
    }

    // --- State ---
    if (this.state !== STATE.ATTACKING && this.state !== STATE.HIT && this.state !== STATE.DASHING) {
      if (!this.onGround) {
        this.state = STATE.JUMPING;
      } else if (moving) {
        this.state = STATE.RUNNING;
      } else {
        this.state = STATE.IDLE;
      }
    }
  }

  _startDash(currentLevel) {
    this.state = STATE.DASHING;
    this.dashTimer = DASH_DURATION;
    this.dashCooldown = DASH_COOLDOWN;
    this.dashInvulnerable = currentLevel >= DASH_INVULN_LEVEL;
    this.attackHitbox = null;
    this.attackTimer = 0;
  }

  _startAttack() {
    this.state         = STATE.ATTACKING;
    this.attackTimer   = PLAYER_ATTACK_DURATION;
    this.attackCooldown = PLAYER_ATTACK_COOLDOWN;
    this._updateAttackHitbox();
  }

  _updateAttackHitbox() {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2 - 4;
    if (this.facing === 1) {
      this.attackHitbox = {
        x: this.x + this.width,
        y: cy - 20,
        width:  PLAYER_ATTACK_RANGE,
        height: 40,
      };
    } else {
      this.attackHitbox = {
        x: this.x - PLAYER_ATTACK_RANGE,
        y: cy - 20,
        width:  PLAYER_ATTACK_RANGE,
        height: 40,
      };
    }
  }

  // -------------------------------------------------------
  // Render
  // -------------------------------------------------------

  /** @param {CanvasRenderingContext2D} ctx */
  render(ctx) {
    if (!this._visible) return;

    ctx.save();

    // Body color by state
    let fillColor = COLOR_PLAYER_IDLE;
    if (this.state === STATE.ATTACKING) fillColor = COLOR_PLAYER_ATTACK;
    if (this.state === STATE.HIT)       fillColor = COLOR_PLAYER_HIT;
    if (this.state === STATE.DEAD)      fillColor = COLOR_PLAYER_DEAD;
    if (this.state === STATE.DASHING)   fillColor = '#66DDFF'; // Cyan dash color

    // Drop shadow
    ctx.shadowColor   = 'rgba(0,0,0,0.4)';
    ctx.shadowOffsetY = 4;
    ctx.shadowBlur    = 6;

    // Dash trail effect
    if (this.state === STATE.DASHING) {
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = fillColor;
      ctx.fillRect(this.x - this.facing * 12, this.y, this.width, this.height);
      ctx.fillRect(this.x - this.facing * 24, this.y, this.width, this.height);
      ctx.globalAlpha = 1;
    }

    // Body
    ctx.fillStyle   = fillColor;
    ctx.strokeStyle = COLOR_PLAYER_OUTLINE;
    ctx.lineWidth   = 2;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.strokeRect(this.x, this.y, this.width, this.height);

    ctx.shadowColor = 'transparent';

    // Dash invuln indicator
    if (this.state === STATE.DASHING && this.dashInvulnerable) {
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 3;
      ctx.strokeRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);
    }

    // Eyes / facing indicator
    this._renderFaceIndicator(ctx);

    // Attack hitbox (debug / visual cue)
    if (this.attackHitbox && this.state === STATE.ATTACKING) {
      ctx.fillStyle = 'rgba(102,187,255,0.3)';
      ctx.strokeStyle = 'rgba(102,187,255,0.8)';
      ctx.lineWidth = 1;
      ctx.fillRect(
        this.attackHitbox.x, this.attackHitbox.y,
        this.attackHitbox.width, this.attackHitbox.height
      );
      ctx.strokeRect(
        this.attackHitbox.x, this.attackHitbox.y,
        this.attackHitbox.width, this.attackHitbox.height
      );
    }

    ctx.restore();
  }

  _renderFaceIndicator(ctx) {
    // Two white "eyes"
    const eyeY  = this.y + 14;
    const eyeR  = 4;
    const eyeOX = 8; // offset from center
    const cx    = this.x + this.width / 2;

    ctx.fillStyle = '#fff';
    // Left eye relative to facing
    ctx.beginPath();
    ctx.arc(cx + this.facing * eyeOX - eyeR, eyeY, eyeR, 0, Math.PI * 2);
    ctx.fill();
    // Right eye (trailing)
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(cx - this.facing * eyeOX + eyeR, eyeY, eyeR * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Facing arrow on chest
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    const arrowX = cx + this.facing * 6;
    const arrowY = this.y + this.height / 2 + 2;
    ctx.beginPath();
    if (this.facing === 1) {
      ctx.moveTo(arrowX,     arrowY - 6);
      ctx.lineTo(arrowX + 8, arrowY);
      ctx.lineTo(arrowX,     arrowY + 6);
    } else {
      ctx.moveTo(arrowX,     arrowY - 6);
      ctx.lineTo(arrowX - 8, arrowY);
      ctx.lineTo(arrowX,     arrowY + 6);
    }
    ctx.fill();
  }

  /** Axis-aligned bounding box for collision queries. */
  get bounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  get centerX() { return this.x + this.width  / 2; }
  get centerY() { return this.y + this.height / 2; }
}
