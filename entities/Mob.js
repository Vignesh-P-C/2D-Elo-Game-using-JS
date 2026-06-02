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
  SHIELDER_SHIELD_MIN_UP, SHIELDER_SHIELD_MAX_UP,
  SHIELDER_SHIELD_MIN_DOWN, SHIELDER_SHIELD_MAX_DOWN,
  ARCHER_SHOOT_RANGE, ARCHER_RETREAT_RANGE,
  ARCHER_PROJECTILE_SPEED, ARCHER_PROJECTILE_DAMAGE, ARCHER_ATTACK_COOLDOWN,
  ARCHER_HP_MULTIPLIER, ARCHER_SPEED_MULTIPLIER,
  LEAPER_LEAP_RANGE, LEAPER_LEAP_VX, LEAPER_LEAP_VY,
  LEAPER_LEAP_DAMAGE_MULT, LEAPER_LEAP_COOLDOWN,
  LEAPER_HP_MULTIPLIER, LEAPER_SPEED_MULTIPLIER,
  BERSERKER_WIDTH, BERSERKER_HEIGHT,
  BERSERKER_HP_MULTIPLIER, BERSERKER_SPEED_MULTIPLIER,
  BERSERKER_ENRAGE_THRESHOLD, BERSERKER_FLURRY_HITS,
  BERSERKER_FLURRY_HIT_INTERVAL, BERSERKER_FLURRY_DAMAGE_MULT,
  BERSERKER_FLURRY_COOLDOWN, BERSERKER_ENRAGE_SPEED_MULT,
  HEALER_HP_MULTIPLIER, HEALER_SPEED_MULTIPLIER,
  HEALER_HEAL_RADIUS, HEALER_HEAL_AMOUNT, HEALER_HEAL_INTERVAL,
  HEALER_FLEE_RANGE,
  SUMMONER_WIDTH, SUMMONER_HEIGHT,
  SUMMONER_HP_MULTIPLIER, SUMMONER_SPEED_MULTIPLIER,
  SUMMONER_SUMMON_COOLDOWN, SUMMONER_MAX_SUMMONS,
  SUMMONER_CAST_DURATION, SUMMONER_CAST_DMG_MULT,
  GRAVITY,
  STATE,
  COLOR_MOB, COLOR_MOB_STUNNED, COLOR_MOB_OUTLINE,
  COLOR_SPEEDER, COLOR_SPEEDER_OUTLINE,
  COLOR_SHIELDER, COLOR_SHIELDER_OUTLINE, COLOR_SHIELDER_SHIELD,
  COLOR_ARCHER, COLOR_ARCHER_OUTLINE,
  COLOR_LEAPER, COLOR_LEAPER_OUTLINE,
  COLOR_BERSERKER, COLOR_BERSERKER_ENRAGED, COLOR_BERSERKER_OUTLINE,
  COLOR_HEALER, COLOR_HEALER_OUTLINE,
  COLOR_SUMMONER, COLOR_SUMMONER_OUTLINE, COLOR_SUMMONER_CAST,
} from '../utils/Constants.js';
import { clamp } from '../utils/MathUtils.js';

export class Mob {
  static _nextId = 0;

  constructor(x, y, level = 1, type = 'normal') {
    this.id   = Mob._nextId++;
    this.type = type;

    this.x = x;
    this.y = y;

    // Dimensions based on type
    switch (type) {
      case 'shielder':  this.width = SHIELDER_WIDTH;   this.height = SHIELDER_HEIGHT;  break;
      case 'berserker': this.width = BERSERKER_WIDTH;  this.height = BERSERKER_HEIGHT; break;
      case 'summoner':  this.width = SUMMONER_WIDTH;   this.height = SUMMONER_HEIGHT;  break;
      default:          this.width = MOB_WIDTH;        this.height = MOB_HEIGHT;
    }

    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.facing   = -1;

    // Scaled base stats
    const baseHp    = 40 + (level - 1) * 15;
    const baseSpeed = 90 + (level - 1) * 10;

    // Apply type multipliers
    const HP_MULTS = {
      speeder:   SPEEDER_HP_MULTIPLIER,
      archer:    ARCHER_HP_MULTIPLIER,
      leaper:    LEAPER_HP_MULTIPLIER,
      berserker: BERSERKER_HP_MULTIPLIER,
      healer:    HEALER_HP_MULTIPLIER,
      summoner:  SUMMONER_HP_MULTIPLIER,
    };
    const SP_MULTS = {
      speeder:   SPEEDER_SPEED_MULTIPLIER,
      archer:    ARCHER_SPEED_MULTIPLIER,
      leaper:    LEAPER_SPEED_MULTIPLIER,
      berserker: BERSERKER_SPEED_MULTIPLIER,
      healer:    HEALER_SPEED_MULTIPLIER,
      summoner:  SUMMONER_SPEED_MULTIPLIER,
    };
    this.maxHp = Math.round(baseHp  * (HP_MULTS[type] ?? 1));
    this.speed = Math.round(baseSpeed * (SP_MULTS[type] ?? 1));
    this.hp    = this.maxHp;

    this.damage         = MOB_DAMAGE;
    this.attackCooldown = type === 'archer' ? ARCHER_ATTACK_COOLDOWN : MOB_ATTACK_COOLDOWN;
    this.eloValue       = MOB_ELO_VALUE;

    this.state       = STATE.IDLE;
    this.spawnX      = x;
    this.patrolDir   = 1;
    this.patrolTimer = 0;

    this.stunTimer      = 0;
    this.deathTimer     = 0;
    this.attackTimer    = 0;
    this._attackCDTimer = 0;
    this.attackHitbox   = null;
    this.remove         = false;
    this._deathAlpha    = 1;
    this._deathScaleY   = 1;

    // Shielder
    // Shielder
this.isBlocking    = false;
// Shield starts UP; timer drives the random toggle
this._shieldActive = type === 'shielder';
this._shieldTimer  = type === 'shielder'
  ? SHIELDER_SHIELD_MIN_UP + Math.random() * (SHIELDER_SHIELD_MAX_UP - SHIELDER_SHIELD_MIN_UP)
  : 0;

    // Archer
    this.onFireProjectile = null;

    // Leaper
    this._leaping            = false;
    this._leapCooldownTimer  = 0;
    this._normalDamage       = null;

    // Berserker
    this._enraged          = false;
    this._flurryActive     = false;
    this._flurryHitsLeft   = 0;
    this._flurryHitTimer   = 0;
    this._flurryPhase      = 'swing';
    this._flurryCDTimer    = 0;
    this._baseFlurryDamage = null;

    // Healer
    this.mobsRef            = null;
    this._healCooldownTimer = 0;
    this._healPulseVisual   = 0;

    // Summoner
    this.onSummonMob   = null;
    this._summonCDTimer = 0;
    this._isCasting     = false;
    this._castTimer     = 0;
    this.summonedBy     = null;

    this.onDamageNumber = null;
  }

  landOnGround() {
    this.onGround = true;
    if (this.vy > 0) this.vy = 0;
  }

  takeHit(damage, sourceX) {
    if (this.state === STATE.DEAD) return;

    // Shielder blocking
    if (this.type === 'shielder' && this.isBlocking) {
      const dir = this.x + this.width / 2 > sourceX ? 1 : -1;
      this.vx = dir * MOB_KNOCKBACK_X * 0.3;
      this.vy = MOB_KNOCKBACK_Y * 0.3;
      return;
    }

    // Summoner cast damage reduction
    if (this.type === 'summoner' && this._isCasting) {
      damage = Math.floor(damage * SUMMONER_CAST_DMG_MULT);
    }

    this.hp = Math.max(0, this.hp - damage);

    if (this.onDamageNumber) {
      this.onDamageNumber(this.x + this.width / 2, this.y, damage, false);
    }

    const dir = this.x + this.width / 2 > sourceX ? 1 : -1;
    this.vx = dir * MOB_KNOCKBACK_X;
    this.vy = MOB_KNOCKBACK_Y;

    if (this.hp <= 0) {
      this._die();
    } else {
      this.state      = STATE.STUNNED;
      this.stunTimer  = MOB_STUN_DURATION;
      this.attackHitbox = null;
      this.isBlocking = false;

      // Reset type-specific active states on hit
      if (this.type === 'leaper' && this._leaping) {
        this._leaping = false;
        if (this._normalDamage !== null) {
          this.damage = this._normalDamage;
          this._normalDamage = null;
        }
      }
      if (this.type === 'berserker' && this._flurryActive) {
        this._flurryActive = false;
        if (this._baseFlurryDamage !== null) {
          this.damage = this._baseFlurryDamage;
          this._baseFlurryDamage = null;
        }
      }
      if (this.type === 'summoner') {
        this._isCasting = false;
      }
    }
  }

  _die() {
    this.state       = STATE.DEAD;
    this.deathTimer  = MOB_DEATH_DURATION;
    this.attackHitbox = null;
    this.vx = 0;
  }

  // -------------------------------------------------------
  // Update
  // -------------------------------------------------------

  update(dt, player, worldWidth) {
    if (this.state === STATE.DEAD) {
      this.deathTimer   -= dt;
      this._deathAlpha   = Math.max(0, this.deathTimer / MOB_DEATH_DURATION);
      this._deathScaleY  = Math.max(0.05, this.deathTimer / MOB_DEATH_DURATION);
      this.vy           += GRAVITY * dt;
      this.y            += this.vy * dt;
      this.attackHitbox  = null;
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
    if (this._leapCooldownTimer > 0) this._leapCooldownTimer -= dt;

    // Attack hitbox duration
    if (this.attackTimer > 0) {
      this.attackTimer -= dt;
      if (this.type !== 'archer' && this.type !== 'leaper') {
        this._updateAttackHitbox();
      }
      if (this.attackTimer <= 0) {
        if (this.type !== 'leaper' || !this._leaping) {
          this.attackHitbox = null;
        }
      }
    }

    // Healer heal pulse visual decay
    if (this._healPulseVisual > 0) {
      this._healPulseVisual = Math.max(0, this._healPulseVisual - dt * 1.5);
    }

        // Shielder: randomly toggle shield between up/down phases
    if (this.type === 'shielder') {
      this._shieldTimer -= dt;
      if (this._shieldTimer <= 0) {
        this._shieldActive = !this._shieldActive;
        if (this._shieldActive) {
          // Shield rising — hold it up for a random duration
          this._shieldTimer = SHIELDER_SHIELD_MIN_UP + Math.random() * (SHIELDER_SHIELD_MAX_UP - SHIELDER_SHIELD_MIN_UP);
        } else {
          // Shield dropping — hold it down for a random duration (the attack window)
          this._shieldTimer = SHIELDER_SHIELD_MIN_DOWN + Math.random() * (SHIELDER_SHIELD_MAX_DOWN - SHIELDER_SHIELD_MIN_DOWN);
        }
      }
    }

    // AI
    this._runAI(dt, player);

    // Movement
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.x = clamp(this.x, 0, worldWidth - this.width);
    this.onGround = false;
  }

  // -------------------------------------------------------
  // AI Dispatch
  // -------------------------------------------------------

  _runAI(dt, player) {
    if (!player || !player.alive) {
      this._patrol(dt);
      this.isBlocking = false;
      return;
    }

    // Type-specific AI
    switch (this.type) {
      case 'archer':    this._archerAI(dt, player);    return;
      case 'leaper':    this._leaperAI(dt, player);    return;
      case 'berserker': this._berserkerAI(dt, player); return;
      case 'healer':    this._healerAI(dt, player);    return;
      case 'summoner':  this._summonerAI(dt, player);  return;
    }

    // --- Default AI (normal, speeder, shielder) ---
    const mobCX  = this.x + this.width  / 2;
    const mobCY  = this.y + this.height / 2;
    const playCX = player.x + player.width  / 2;
    const playCY = player.y + player.height / 2;
    const distX  = Math.abs(mobCX - playCX);
    const dist   = Math.sqrt(distX * distX + (mobCY - playCY) ** 2);

    if (this.type === 'shielder') {
      const playerIsInFront = (this.facing === 1 && playCX > mobCX) ||
                              (this.facing === -1 && playCX < mobCX);
      // Block only when the shield phase is active AND player is in front
      this.isBlocking = playerIsInFront && this._shieldActive && this.state !== STATE.ATTACKING;
    }

    if (dist <= MOB_ATTACK_RANGE && this._attackCDTimer <= 0) {
      this._doAttack(player);
    } else if (dist <= MOB_CHASE_RANGE) {
      this._chase(playCX);
    } else {
      this._patrol(dt);
    }
  }

  // -------------------------------------------------------
  // Archer AI
  // -------------------------------------------------------

  _archerAI(dt, player) {
    const mobCX  = this.x + this.width  / 2;
    const playCX = player.x + player.width  / 2;
    const dist   = Math.abs(mobCX - playCX);

    this.facing = playCX > mobCX ? 1 : -1;

    if (dist < ARCHER_RETREAT_RANGE) {
      const retreatDir = mobCX > playCX ? 1 : -1;
      this.state = STATE.CHASE;
      this.vx    = retreatDir * this.speed * 1.2;
    } else if (dist <= ARCHER_SHOOT_RANGE) {
      this.state = STATE.IDLE;
      this.vx    = 0;
      if (this._attackCDTimer <= 0) {
        this._doFire(player);
      }
    } else {
      this._patrol(dt);
    }
  }

  _doFire(player) {
    if (!this.onFireProjectile) return;
    const cx     = this.x + this.width  / 2;
    const cy     = this.y + this.height / 2;
    const playCX = player.x + player.width  / 2;
    const playCY = player.y + player.height / 2;
    const dx     = playCX - cx;
    const dy     = playCY - cy;
    const len    = Math.sqrt(dx * dx + dy * dy);
    const vx     = (dx / len) * ARCHER_PROJECTILE_SPEED;
    const vy     = (dy / len) * ARCHER_PROJECTILE_SPEED;

    this.onFireProjectile(cx, cy, vx, vy, ARCHER_PROJECTILE_DAMAGE);
    this._attackCDTimer = ARCHER_ATTACK_COOLDOWN;
    this.state          = STATE.ATTACKING;
    this.attackTimer    = 0.25;
  }

  // -------------------------------------------------------
  // Leaper AI
  // -------------------------------------------------------

  _leaperAI(dt, player) {
    if (this._leaping) {
      this.attackHitbox = { x: this.x, y: this.y, width: this.width, height: this.height };
      if (this.onGround) {
        this._leaping = false;
        if (this._normalDamage !== null) {
          this.damage = this._normalDamage;
          this._normalDamage = null;
        }
        this.attackHitbox = null;
        this.state = STATE.IDLE;
      }
      return;
    }

    const mobCX  = this.x + this.width  / 2;
    const playCX = player.x + player.width  / 2;
    const dist   = Math.abs(mobCX - playCX);

    if (dist <= LEAPER_LEAP_RANGE && this._leapCooldownTimer <= 0) {
      this._doLeap(player);
    } else if (dist <= MOB_CHASE_RANGE) {
      this._chase(playCX);
    } else {
      this._patrol(dt);
    }
  }

  _doLeap(player) {
    const mobCX = this.x + this.width  / 2;
    const playCX = player.x + player.width / 2;
    const dir   = playCX > mobCX ? 1 : -1;

    this._normalDamage       = this.damage;
    this.damage              = Math.round(this.damage * LEAPER_LEAP_DAMAGE_MULT);
    this.vx                  = dir * LEAPER_LEAP_VX;
    this.vy                  = LEAPER_LEAP_VY;
    this._leaping            = true;
    this._leapCooldownTimer  = LEAPER_LEAP_COOLDOWN;
    this.state               = STATE.ATTACKING;
    this.facing              = dir;
    this.attackHitbox        = { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  // -------------------------------------------------------
  // Berserker AI
  // -------------------------------------------------------

  _berserkerAI(dt, player) {
    if (!this._enraged && this.hp / this.maxHp <= BERSERKER_ENRAGE_THRESHOLD) {
      this._enraged = true;
      this.speed = Math.round(this.speed * BERSERKER_ENRAGE_SPEED_MULT);
    }

    if (this._flurryCDTimer > 0) this._flurryCDTimer -= dt;

    if (this._flurryActive) {
      this.vx = 0;
      this._flurryHitTimer -= dt;

      if (this._flurryPhase === 'swing' && this._flurryHitTimer <= 0) {
        if (this._flurryHitsLeft > 0) {
          this._flurryHitsLeft--;
          this._updateFlurryHitbox();
          this._flurryHitTimer = BERSERKER_FLURRY_HIT_INTERVAL * 0.45;
          this._flurryPhase    = 'pause';
        } else {
          this._endFlurry();
        }
      } else if (this._flurryPhase === 'pause' && this._flurryHitTimer <= 0) {
        this.attackHitbox    = null;
        this._flurryHitTimer = BERSERKER_FLURRY_HIT_INTERVAL * 0.55;
        this._flurryPhase    = 'swing';
      }
      return;
    }

    const mobCX  = this.x + this.width  / 2;
    const playCX = player.x + player.width  / 2;
    const dist   = Math.abs(mobCX - playCX);

    if (this._enraged && this._flurryCDTimer <= 0 && dist <= MOB_ATTACK_RANGE * 1.5) {
      this._startFlurry();
      return;
    }

    if (dist <= MOB_ATTACK_RANGE && this._attackCDTimer <= 0) {
      this._doAttack(player);
    } else if (dist <= MOB_CHASE_RANGE) {
      this._chase(playCX);
    } else {
      this._patrol(dt);
    }
  }

  _startFlurry() {
    this._flurryActive     = true;
    this._flurryHitsLeft   = BERSERKER_FLURRY_HITS;
    this._flurryHitTimer   = 0;
    this._flurryPhase      = 'swing';
    this._baseFlurryDamage = this.damage;
    this.damage            = Math.round(this.damage * BERSERKER_FLURRY_DAMAGE_MULT);
    this.state             = STATE.ATTACKING;
    this.vx                = 0;
  }

  _endFlurry() {
    this._flurryActive = false;
    this.attackHitbox  = null;
    if (this._baseFlurryDamage !== null) {
      this.damage = this._baseFlurryDamage;
      this._baseFlurryDamage = null;
    }
    this._flurryCDTimer = BERSERKER_FLURRY_COOLDOWN;
    this.state = STATE.IDLE;
  }

  _updateFlurryHitbox() {
    const cx    = this.x + this.width  / 2;
    const cy    = this.y + this.height / 2;
    const range = MOB_ATTACK_RANGE * 1.4;
    this.attackHitbox = {
      x:      cx + this.facing * (this.width / 2) - (this.facing === 1 ? 0 : range),
      y:      cy - 22,
      width:  range,
      height: 44,
    };
  }

  // -------------------------------------------------------
  // Healer AI
  // -------------------------------------------------------

  _healerAI(dt, player) {
    this._healCooldownTimer -= dt;
    if (this._healCooldownTimer <= 0) {
      this._healCooldownTimer = HEALER_HEAL_INTERVAL;
      this._doHeal();
    }

    const mobCX  = this.x + this.width  / 2;
    const playCX = player.x + player.width  / 2;
    const dist   = Math.abs(mobCX - playCX);

    if (dist < HEALER_FLEE_RANGE) {
      const fleeDir = mobCX > playCX ? 1 : -1;
      this.state    = STATE.CHASE;
      this.vx       = fleeDir * this.speed * 1.2;
      this.facing   = fleeDir;
    } else {
      this._patrol(dt);
    }
  }

  _doHeal() {
    if (!this.mobsRef) return;
    this._healPulseVisual = 1.0;
    const cx = this.x + this.width  / 2;
    const cy = this.y + this.height / 2;
    for (const mob of this.mobsRef) {
      if (mob === this || mob.state === STATE.DEAD || mob.remove) continue;
      const dx   = mob.centerX - cx;
      const dy   = mob.centerY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= HEALER_HEAL_RADIUS) {
        mob.hp = Math.min(mob.maxHp, mob.hp + HEALER_HEAL_AMOUNT);
      }
    }
  }

  // -------------------------------------------------------
  // Summoner AI
  // -------------------------------------------------------

  _summonerAI(dt, player) {
    if (this._summonCDTimer > 0) this._summonCDTimer -= dt;

    if (this._isCasting) {
      this._castTimer -= dt;
      this.vx = 0;
      if (this._castTimer <= 0) {
        this._isCasting = false;
        this._completeSummon();
      }
      return;
    }

    const mobCX  = this.x + this.width  / 2;
    const playCX = player.x + player.width  / 2;
    const dist   = Math.abs(mobCX - playCX);

    if (dist <= MOB_ATTACK_RANGE && this._attackCDTimer <= 0) {
      this._doAttack(player);
      return;
    }

    const activeSummons = this._countActiveSummons();
    if (this._summonCDTimer <= 0 && activeSummons < SUMMONER_MAX_SUMMONS) {
      this._startCast();
      return;
    }

    if (dist <= MOB_CHASE_RANGE) {
      this.state = STATE.IDLE;
      this.vx    = 0;
    } else {
      this._patrol(dt);
    }
  }

  _countActiveSummons() {
    if (!this.mobsRef) return 0;
    return this.mobsRef.filter(m => m.summonedBy === this.id && m.state !== STATE.DEAD && !m.remove).length;
  }

  _startCast() {
    this._isCasting     = true;
    this._castTimer     = SUMMONER_CAST_DURATION;
    this._summonCDTimer = SUMMONER_SUMMON_COOLDOWN;
    this.state          = STATE.IDLE;
    this.vx             = 0;
  }

  _completeSummon() {
    if (!this.onSummonMob) return;
    const offset  = (Math.random() > 0.5 ? 1 : -1) * (60 + Math.random() * 80);
    const spawnX  = Math.max(50, this.x + offset);
    const sumType = Math.random() < 0.5 ? 'normal' : 'speeder';
    this.onSummonMob(spawnX, this.y, sumType);
  }

  // -------------------------------------------------------
  // Shared Helpers
  // -------------------------------------------------------

  _patrol(dt) {
    this.state        = STATE.IDLE;
    this.patrolTimer += dt;
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
    this.state          = STATE.ATTACKING;
    this.attackTimer    = MOB_ATTACK_DURATION;
    this._attackCDTimer = this.attackCooldown;
    this.vx             = 0;
    this.isBlocking     = false;
    this._updateAttackHitbox();
  }

  _updateAttackHitbox() {
    if (this.type === 'archer') return;
    if (this.type === 'leaper' && this._leaping) return;
    const cx    = this.x + this.width  / 2;
    const cy    = this.y + this.height / 2;
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

  render(ctx) {
    if (this.remove) return;
    ctx.save();

    if (this.state === STATE.DEAD) {
      this._renderDead(ctx);
      ctx.restore();
      return;
    }

    const { fill, outline } = this._getColors();

    ctx.shadowColor   = 'rgba(0,0,0,0.35)';
    ctx.shadowOffsetY = 3;
    ctx.shadowBlur    = 5;

    ctx.fillStyle   = fill;
    ctx.strokeStyle = outline;
    ctx.lineWidth   = 2;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.strokeRect(this.x, this.y, this.width, this.height);
    ctx.shadowColor = 'transparent';

    this._renderTypeOverlay(ctx);
    this._renderHealthBar(ctx);
    this._renderFace(ctx);

    if (this.attackHitbox) {
      ctx.fillStyle   = 'rgba(226,74,74,0.25)';
      ctx.strokeStyle = 'rgba(226,74,74,0.7)';
      ctx.lineWidth   = 1;
      ctx.fillRect(this.attackHitbox.x, this.attackHitbox.y, this.attackHitbox.width, this.attackHitbox.height);
      ctx.strokeRect(this.attackHitbox.x, this.attackHitbox.y, this.attackHitbox.width, this.attackHitbox.height);
    }

    ctx.restore();
  }

  _getColors() {
    const stunned = this.state === STATE.STUNNED;
    switch (this.type) {
      case 'speeder':
        return { fill: COLOR_SPEEDER, outline: COLOR_SPEEDER_OUTLINE };
      case 'shielder':
        return { fill: stunned ? COLOR_MOB_STUNNED : COLOR_SHIELDER, outline: COLOR_SHIELDER_OUTLINE };
      case 'archer':
        return { fill: stunned ? COLOR_MOB_STUNNED : COLOR_ARCHER, outline: COLOR_ARCHER_OUTLINE };
      case 'leaper':
        return { fill: stunned ? COLOR_MOB_STUNNED : COLOR_LEAPER, outline: COLOR_LEAPER_OUTLINE };
      case 'berserker':
        return {
          fill: stunned ? COLOR_MOB_STUNNED : (this._enraged && this._flurryActive ? COLOR_BERSERKER_ENRAGED : COLOR_BERSERKER),
          outline: COLOR_BERSERKER_OUTLINE,
        };
      case 'healer':
        return { fill: stunned ? COLOR_MOB_STUNNED : COLOR_HEALER, outline: COLOR_HEALER_OUTLINE };
      case 'summoner':
        return { fill: stunned ? COLOR_MOB_STUNNED : COLOR_SUMMONER, outline: COLOR_SUMMONER_OUTLINE };
      default:
        return { fill: stunned ? COLOR_MOB_STUNNED : COLOR_MOB, outline: COLOR_MOB_OUTLINE };
    }
  }

  _renderTypeOverlay(ctx) {
    switch (this.type) {
      case 'shielder': this._renderShielderOverlay(ctx); break;
      case 'archer':   this._renderArcherOverlay(ctx);   break;
      case 'leaper':   this._renderLeaperOverlay(ctx);   break;
      case 'berserker': this._renderBerserkerOverlay(ctx); break;
      case 'healer':   this._renderHealerOverlay(ctx);   break;
      case 'summoner': this._renderSummonerOverlay(ctx); break;
    }
  }

  _renderShielderOverlay(ctx) {
    if (!this._shieldActive) return;
    const shieldX = this.facing === 1 ? this.x + this.width : this.x - 8;
    const shieldY = this.y + this.height * 0.2;
    const shieldH = this.height * 0.6;
    ctx.fillStyle   = COLOR_SHIELDER_SHIELD;
    ctx.globalAlpha = 0.7;
    ctx.fillRect(shieldX, shieldY, 8, shieldH);
    ctx.strokeStyle = COLOR_SHIELDER_OUTLINE;
    ctx.lineWidth   = 2;
    ctx.strokeRect(shieldX, shieldY, 8, shieldH);
    ctx.globalAlpha = 1;
  }

  _renderArcherOverlay(ctx) {
    const bx   = this.facing === 1 ? this.x + this.width : this.x;
    const by   = this.y + this.height * 0.35;
    const bh   = this.height * 0.45;
    const xOff = this.facing * 4;
    ctx.strokeStyle = '#6B3A0A';
    ctx.lineWidth   = 2.5;
    ctx.lineCap     = 'round';
    ctx.beginPath();
    ctx.arc(bx, by + bh / 2, bh / 2, -Math.PI * 0.6, Math.PI * 0.6, this.facing === 1);
    ctx.stroke();
    if (this.state === STATE.ATTACKING) {
      ctx.strokeStyle = 'rgba(255,200,50,0.85)';
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      ctx.moveTo(bx + xOff, by);
      ctx.lineTo(bx + xOff, by + bh);
      ctx.stroke();
    }
  }

  _renderLeaperOverlay(ctx) {
    if (!this._leaping) return;
    const trailOff = -this.facing * 14;
    ctx.globalAlpha = 0.3;
    ctx.fillStyle   = COLOR_LEAPER;
    ctx.fillRect(this.x + trailOff, this.y + 4, this.width, this.height - 8);
    ctx.globalAlpha = 0.15;
    ctx.fillRect(this.x + trailOff * 2, this.y + 8, this.width, this.height - 16);
    ctx.globalAlpha = 1;
  }

  _renderBerserkerOverlay(ctx) {
    if (!this._enraged) return;
    const pulse = 0.25 + 0.15 * Math.sin(Date.now() / 120);
    ctx.globalAlpha = pulse;
    ctx.fillStyle   = COLOR_BERSERKER_ENRAGED;
    ctx.fillRect(this.x - 3, this.y - 3, this.width + 6, this.height + 6);
    ctx.globalAlpha = 1;
  }

  _renderHealerOverlay(ctx) {
    const cx = this.x + this.width  / 2;
    const cy = this.y + this.height / 2;
    const cs = 7;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth   = 2.5;
    ctx.lineCap     = 'round';
    ctx.beginPath(); ctx.moveTo(cx - cs, cy); ctx.lineTo(cx + cs, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy - cs); ctx.lineTo(cx, cy + cs); ctx.stroke();

    if (this._healPulseVisual > 0) {
      const r = (1 - this._healPulseVisual) * HEALER_HEAL_RADIUS;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(136,221,102,${this._healPulseVisual * 0.55})`;
      ctx.lineWidth   = 2;
      ctx.stroke();
    }
  }

  _renderSummonerOverlay(ctx) {
    const cx = this.x + this.width  / 2;
    const cy = this.y + this.height / 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth   = 1.5;
    const r = 7, spokes = 4;
    for (let i = 0; i < spokes; i++) {
      const angle = (i / spokes) * Math.PI * 2 + Date.now() / 1200;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
      ctx.stroke();
    }

    if (this._isCasting) {
      const progress = Math.max(0, 1 - this._castTimer / SUMMONER_CAST_DURATION);
      const castR    = 20 + 20 * progress;
      const alpha    = 0.35 + 0.2 * Math.sin(Date.now() / 80);
      ctx.globalAlpha = alpha;
      ctx.fillStyle   = COLOR_SUMMONER_CAST;
      ctx.beginPath();
      ctx.arc(cx, cy, castR, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = COLOR_SUMMONER_OUTLINE;
      ctx.lineWidth   = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, castR + 4, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
      ctx.stroke();
    }
  }

  _renderDead(ctx) {
    ctx.globalAlpha = this._deathAlpha;
    const scaleY  = this._deathScaleY;
    const offsetY = this.height * (1 - scaleY);
    const colors  = this._getColors();
    ctx.fillStyle   = colors.fill;
    ctx.strokeStyle = colors.outline;
    ctx.lineWidth   = 2;
    ctx.fillRect(this.x, this.y + offsetY, this.width, this.height * scaleY);
    ctx.strokeRect(this.x, this.y + offsetY, this.width, this.height * scaleY);
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
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(eyeX + this.facing * 1.5, eyeY + 1, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  get bounds()  { return { x: this.x, y: this.y, width: this.width, height: this.height }; }
  get centerX() { return this.x + this.width  / 2; }
  get centerY() { return this.y + this.height / 2; }
}