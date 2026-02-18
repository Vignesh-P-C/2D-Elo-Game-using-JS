// ============================================================
// Boss.js — Boss entity. Extends Mob with larger stats,
// phase-2 behavior trigger at 50% HP, and distinct visuals.
// ============================================================

import { Mob } from './Mob.js';
import {
  BOSS_WIDTH, BOSS_HEIGHT,
  BOSS_BASE_HP, BOSS_BASE_SPEED,
  BOSS_DAMAGE, BOSS_ATTACK_COOLDOWN, BOSS_ATTACK_RANGE,
  BOSS_ATTACK_DURATION, BOSS_STUN_DURATION,
  BOSS_KNOCKBACK_X, BOSS_KNOCKBACK_Y,
  BOSS_ELO_VALUE,
  BOSS_PHASE2_THRESHOLD, BOSS_PHASE2_SPEED_MULT, BOSS_PHASE2_COOLDOWN_MULT,
  MOB_CHASE_RANGE, MOB_PATROL_RANGE, MOB_DEATH_DURATION,
  GRAVITY, STATE,
  COLOR_BOSS, COLOR_BOSS_PHASE2, COLOR_BOSS_OUTLINE,
} from '../utils/Constants.js';
import { clamp } from '../utils/MathUtils.js';

export class Boss extends Mob {
  /**
   * @param {number} x
   * @param {number} y
   * @param {number} level
   */
  constructor(x, y, level = 1) {
    // Call Mob constructor to set up base structure, then override values
    super(x, y, level);

    this.width  = BOSS_WIDTH;
    this.height = BOSS_HEIGHT;

    // Override scaled stats
    this.maxHp  = BOSS_BASE_HP + (level - 1) * 60;
    this.hp     = this.maxHp;
    this.speed  = BOSS_BASE_SPEED + (level - 1) * 12;

    this.damage         = BOSS_DAMAGE;
    this.attackCooldown = BOSS_ATTACK_COOLDOWN;
    this.eloValue       = BOSS_ELO_VALUE;

    // Boss-specific stun duration (shorter)
    this._stunDuration  = BOSS_STUN_DURATION;

    // Phase 2 state
    this.inPhase2     = false;

    // Override knockback values for takeHit
    this._knockbackX  = BOSS_KNOCKBACK_X;
    this._knockbackY  = BOSS_KNOCKBACK_Y;

    // Charge attack: boss periodically dashes at the player
    this._chargeTimer = 0;
    this._chargeCD    = 4.0;    // seconds between charges
    this._charging    = false;

    // Warning flash before charge
    this._warnTimer   = 0;
    this._warnFlash   = false;
  }

  // -------------------------------------------------------
  // Override takeHit to use boss knockback values
  // -------------------------------------------------------

  takeHit(damage, sourceX) {
    if (this.state === STATE.DEAD) return;

    this.hp = Math.max(0, this.hp - damage);

    const dir = this.x + this.width / 2 > sourceX ? 1 : -1;
    this.vx = dir * BOSS_KNOCKBACK_X;
    this.vy = BOSS_KNOCKBACK_Y;

    // Activate phase 2
    if (!this.inPhase2 && this.hp / this.maxHp <= BOSS_PHASE2_THRESHOLD) {
      this._activatePhase2();
    }

    if (this.hp <= 0) {
      this._die();
    } else {
      this.state     = STATE.STUNNED;
      this.stunTimer = this._stunDuration;
      this.attackHitbox = null;
    }
  }

  _activatePhase2() {
    this.inPhase2       = true;
    this.speed          = this.speed * BOSS_PHASE2_SPEED_MULT;
    this.attackCooldown = this.attackCooldown * BOSS_PHASE2_COOLDOWN_MULT;
    this._chargeCD      = 2.5; // charge more often in phase 2
  }

  // -------------------------------------------------------
  // Override _die to use Mob's death sequence
  // -------------------------------------------------------

  _die() {
    this.state      = STATE.DEAD;
    this.deathTimer = MOB_DEATH_DURATION * 1.5; // longer death anim for boss
    this.attackHitbox = null;
    this.vx = 0;
    this.vy = 0;
  }

  // -------------------------------------------------------
  // Update
  // -------------------------------------------------------

  update(dt, player, worldWidth) {
    if (this.state === STATE.DEAD) {
      this.deathTimer -= dt;
      this._deathAlpha  = Math.max(0, this.deathTimer / (MOB_DEATH_DURATION * 1.5));
      this._deathScaleY = Math.max(0.05, this._deathAlpha);
      if (this.deathTimer <= 0) this.remove = true;
      return;
    }

    if (!this.onGround) {
      this.vy += GRAVITY * dt;
    }

    if (this.state === STATE.STUNNED) {
      this.stunTimer -= dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.vx *= 0.80;
      this.attackHitbox = null;
      if (this.stunTimer <= 0) this.state = STATE.IDLE;
      this.onGround = false;
      return;
    }

    // Cooldown timers
    if (this._attackCDTimer > 0) this._attackCDTimer -= dt;
    if (this._chargeTimer   > 0) this._chargeTimer   -= dt;

    // Attack hitbox lifetime
    if (this.attackTimer > 0) {
      this.attackTimer -= dt;
      this._updateBossAttackHitbox();
      if (this.attackTimer <= 0) this.attackHitbox = null;
    }

    // Charge movement
    if (this._charging) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.x = clamp(this.x, 0, worldWidth - this.width);
      // End charge after 0.4s (handled by chargeTimer reset in _doCharge)
      this._chargeDuration -= dt;
      if (this._chargeDuration <= 0) {
        this._charging = false;
        this.vx = 0;
      }
      this.onGround = false;
      return;
    }

    // Phase 2 warning flash
    if (this.inPhase2) {
      this._warnTimer += dt;
      this._warnFlash = Math.floor(this._warnTimer / 0.15) % 2 === 0;
    }

    // AI
    this._runBossAI(dt, player);

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.x = clamp(this.x, 0, worldWidth - this.width);
    this.onGround = false;
  }

  _runBossAI(dt, player) {
    if (!player || !player.alive) {
      this.state = STATE.IDLE;
      this.vx    = 0;
      return;
    }

    const mobCX  = this.x + this.width  / 2;
    const playCX = player.x + player.width  / 2;
    const dist   = Math.abs(mobCX - playCX);

    // Charge attack when in phase 2 and cooldown ready
    if (this.inPhase2 && this._chargeTimer <= 0 && dist > 150) {
      this._doCharge(playCX > mobCX ? 1 : -1);
      return;
    }

    if (dist <= BOSS_ATTACK_RANGE && this._attackCDTimer <= 0) {
      this._doBossAttack();
    } else {
      // Chase
      this.state  = STATE.CHASE;
      const dir   = playCX > mobCX ? 1 : -1;
      this.vx     = dir * this.speed;
      this.facing = dir;
    }
  }

  _doBossAttack() {
    this.state          = STATE.ATTACKING;
    this.attackTimer    = BOSS_ATTACK_DURATION;
    this._attackCDTimer = this.attackCooldown;
    this.vx = 0;
    this._updateBossAttackHitbox();
  }

  _doCharge(dir) {
    this._charging      = true;
    this._chargeDuration = 0.4;
    this._chargeTimer   = this._chargeCD;
    this.vx             = dir * this.speed * 2.5;
    this.facing         = dir;
    this.state          = STATE.ATTACKING;
    // Charge hitbox is whole body + extended front
    this.attackHitbox = {
      x:      dir === 1 ? this.x + this.width : this.x - 40,
      y:      this.y,
      width:  50,
      height: this.height,
    };
    this.attackTimer = this._chargeDuration;
  }

  _updateBossAttackHitbox() {
    const cx    = this.x + this.width  / 2;
    const cy    = this.y + this.height / 2;
    const range = BOSS_ATTACK_RANGE;
    this.attackHitbox = {
      x:      cx + this.facing * (this.width / 2) - (this.facing === 1 ? 0 : range),
      y:      cy - 24,
      width:  range,
      height: 48,
    };
  }

  // -------------------------------------------------------
  // Render
  // -------------------------------------------------------

  render(ctx) {
    if (this.remove) return;

    ctx.save();

    if (this.state === STATE.DEAD) {
      ctx.globalAlpha = this._deathAlpha;
      const scaleY  = this._deathScaleY;
      const offsetY = this.height * (1 - scaleY);
      ctx.fillStyle   = COLOR_BOSS;
      ctx.strokeStyle = COLOR_BOSS_OUTLINE;
      ctx.lineWidth   = 3;
      ctx.fillRect(this.x, this.y + offsetY, this.width, this.height * scaleY);
      ctx.strokeRect(this.x, this.y + offsetY, this.width, this.height * scaleY);
      ctx.restore();
      return;
    }

    // Body color — phase 2 gets different fill + flash
    let fill = this.inPhase2
      ? (this._warnFlash ? COLOR_BOSS_PHASE2 : COLOR_BOSS)
      : COLOR_BOSS;

    ctx.shadowColor   = 'rgba(107,47,160,0.5)';
    ctx.shadowOffsetY = 6;
    ctx.shadowBlur    = 12;

    ctx.fillStyle   = fill;
    ctx.strokeStyle = COLOR_BOSS_OUTLINE;
    ctx.lineWidth   = 3;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.strokeRect(this.x, this.y, this.width, this.height);

    ctx.shadowColor = 'transparent';

    // Phase 2 crown / aura
    if (this.inPhase2) {
      this._renderPhase2Aura(ctx);
    }

    // Health bar
    this._renderBossHealthBar(ctx);

    // Face
    this._renderBossFace(ctx);

    // Attack hitbox
    if (this.attackHitbox) {
      ctx.fillStyle   = 'rgba(155,29,219,0.2)';
      ctx.strokeStyle = 'rgba(155,29,219,0.7)';
      ctx.lineWidth   = 1.5;
      ctx.fillRect(this.attackHitbox.x, this.attackHitbox.y, this.attackHitbox.width, this.attackHitbox.height);
      ctx.strokeRect(this.attackHitbox.x, this.attackHitbox.y, this.attackHitbox.width, this.attackHitbox.height);
    }

    ctx.restore();
  }

  _renderPhase2Aura(ctx) {
    ctx.save();
    ctx.globalAlpha = 0.3 + 0.2 * Math.sin(Date.now() / 200);
    ctx.strokeStyle = '#FF44FF';
    ctx.lineWidth   = 3;
    ctx.strokeRect(this.x - 4, this.y - 4, this.width + 8, this.height + 8);
    ctx.restore();
  }

  _renderBossHealthBar(ctx) {
    const barW = this.width + 20;
    const barH = 8;
    const barX = this.x - 10;
    const barY = this.y - 16;
    const ratio = this.hp / this.maxHp;

    ctx.fillStyle = '#2a0a3a';
    ctx.fillRect(barX, barY, barW, barH);

    const barColor = this.inPhase2 ? '#DD44FF' : '#9B1DDB';
    ctx.fillStyle  = barColor;
    ctx.fillRect(barX, barY, barW * ratio, barH);

    ctx.strokeStyle = '#000';
    ctx.lineWidth   = 1.5;
    ctx.strokeRect(barX, barY, barW, barH);

    // HP text
    ctx.fillStyle  = '#fff';
    ctx.font       = 'bold 10px monospace';
    ctx.textAlign  = 'center';
    ctx.fillText(`BOSS  ${this.hp}/${this.maxHp}`, barX + barW / 2, barY - 3);
  }

  _renderBossFace(ctx) {
    // Two glowing eyes
    const eyeY = this.y + 18;
    const eyeOX = 12;
    const cx = this.x + this.width / 2;
    const eyeColor = this.inPhase2 ? '#FF44FF' : '#FF0000';

    ctx.fillStyle = eyeColor;
    ctx.shadowColor = eyeColor;
    ctx.shadowBlur  = 8;

    [-1, 1].forEach(side => {
      ctx.beginPath();
      ctx.arc(cx + side * eyeOX, eyeY, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.shadowBlur = 0;
  }

  get bounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }
}
