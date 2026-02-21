// ============================================================
// CollisionSystem.js — All AABB collision detection and resolution.
// Nothing in entity files detects its own collisions.
// ============================================================

import { aabbOverlap, aabbResolve } from '../utils/MathUtils.js';
import { STATE, PLAYER_ATTACK_DAMAGE } from '../utils/Constants.js';

export class CollisionSystem {
  /**
   * @param {object} opts
   * @param {object}   opts.player
   * @param {Array}    opts.mobs
   * @param {object}   opts.boss       May be null
   * @param {Array}    opts.orbs       Array of HealingOrb instances
   * @param {Array}    opts.platforms  Array of { x, y, width, height }
   * @param {object}   opts.ground     { x, y, width, height }
   * @param {number}   opts.worldWidth
   * @param {number}   opts.worldHeight
   * @param {Function} opts.onEloGain  Callback(amount) when an enemy dies
   * @param {Function} opts.onSpawnOrb Callback(x, y) to spawn healing orb
   * @param {Function} opts.onHitEvent Callback({ type, isBoss }) for hit pause/shake
   */
  constructor({ player, mobs, boss, orbs, platforms, ground, worldWidth, worldHeight, onEloGain, onSpawnOrb, onHitEvent }) {
    this.player      = player;
    this.mobs        = mobs;
    this.boss        = boss;
    this.orbs        = orbs || [];
    this.platforms   = platforms;
    this.ground      = ground;
    this.worldWidth  = worldWidth;
    this.worldHeight = worldHeight;
    this.onEloGain   = onEloGain || (() => {});
    this.onSpawnOrb  = onSpawnOrb || (() => {});
    this.onHitEvent  = onHitEvent || (() => {});
  }

  /** Called once per game loop tick, after all entity updates. */
  run() {
    this._resolveEntityVsGround(this.player);

    for (const mob of this.mobs) {
      if (mob.state !== STATE.DEAD) {
        this._resolveEntityVsGround(mob);
      }
    }
    if (this.boss && this.boss.state !== STATE.DEAD) {
      this._resolveEntityVsGround(this.boss);
    }

    this._resolveAttacks();
    this._resolveOrbPickups();
  }

  // -------------------------------------------------------
  // Ground / platform resolution
  // -------------------------------------------------------

  /**
   * Resolve entity vs ground rectangle and all platforms.
   * Only resolves from above (landing), not sides or bottom.
   */
  _resolveEntityVsGround(entity) {
    const surfaces = [this.ground, ...this.platforms];

    for (const surface of surfaces) {
      if (!aabbOverlap(entity.bounds, surface)) continue;

      const { overlapX, overlapY } = aabbResolve(entity.bounds, surface);

      // Only resolve vertical from above (entity falling onto surface)
      const absOX = Math.abs(overlapX);
      const absOY = Math.abs(overlapY);

      if (absOY < absOX) {
        // Vertical collision — entity landed on top or hit underside
        if (overlapY < 0) {
          // Entity was above (landed on top)
          entity.y = surface.y - entity.height;
          entity.landOnGround();
        }
        // Don't resolve upward into platforms (allows jumping through from below)
      } else {
        // Horizontal collision — push out sideways only on ground
        if (surface === this.ground) {
          entity.x -= overlapX;
          if (entity.vx !== undefined) {
            if ((overlapX > 0 && entity.vx < 0) || (overlapX < 0 && entity.vx > 0)) {
              entity.vx = 0;
            }
          }
        }
      }
    }

    // World floor safety net (in case entity falls through everything)
    const floor = this.worldHeight - 60;
    if (entity.y + entity.height > floor) {
      entity.y = floor - entity.height;
      entity.landOnGround();
    }
  }

  // -------------------------------------------------------
  // Attack hit detection
  // -------------------------------------------------------

  _resolveAttacks() {
    // --- Player attack vs mobs / boss ---
    if (this.player.attackHitbox && this.player.state === STATE.ATTACKING) {
      const hitbox = this.player.attackHitbox;

      for (const mob of this.mobs) {
        if (mob.state === STATE.DEAD) continue;
        if (!mob._hitThisSwing && aabbOverlap(hitbox, mob.bounds)) {
          const prevHp = mob.hp;
          mob.takeHit(this._playerDamage(), this.player.centerX);
          mob._hitThisSwing = true;
          
          // Register successful hit
          if (prevHp > 0 && mob.hp < prevHp) {
            const shouldSpawnOrb = this.player.registerSuccessfulHit();
            if (shouldSpawnOrb) {
              this.onSpawnOrb(mob.centerX, mob.centerY);
            }
            // Trigger hit pause
            this.onHitEvent({ type: 'mobHit', isBoss: false });
          }
          
          if (mob.hp <= 0) {
            this.onEloGain(mob.eloValue);
          }
        }
      }

      if (this.boss && this.boss.state !== STATE.DEAD) {
        if (!this.boss._hitThisSwing && aabbOverlap(hitbox, this.boss.bounds)) {
          const prevHp = this.boss.hp;
          this.boss.takeHit(this._playerDamage(), this.player.centerX);
          this.boss._hitThisSwing = true;
          
          // Register successful hit
          if (prevHp > 0 && this.boss.hp < prevHp) {
            const shouldSpawnOrb = this.player.registerSuccessfulHit();
            if (shouldSpawnOrb) {
              this.onSpawnOrb(this.boss.centerX, this.boss.centerY);
            }
            // Trigger hit pause and screen shake for boss
            this.onHitEvent({ type: 'bossHit', isBoss: true });
          }
          
          if (this.boss.hp <= 0) {
            this.onEloGain(this.boss.eloValue);
            // Boss death shake
            this.onHitEvent({ type: 'bossDeath', isBoss: true });
          }
        }
      }
    } else {
      // Reset hit-this-swing flags when player is not attacking
      for (const mob of this.mobs) mob._hitThisSwing = false;
      if (this.boss) this.boss._hitThisSwing = false;
    }

    // --- Mob attacks vs player ---
    if (!this.player.alive) return;

    for (const mob of this.mobs) {
      if (mob.state === STATE.DEAD || !mob.attackHitbox) continue;
      if (!mob._playerHitThisSwing && aabbOverlap(mob.attackHitbox, this.player.bounds)) {
        this.player.takeHit(mob.damage, mob.centerX);
        mob._playerHitThisSwing = true;
        // Player damage shake
        this.onHitEvent({ type: 'playerHit', isBoss: false });
      }
    }

    // Reset mob player-hit flag when mob not attacking
    for (const mob of this.mobs) {
      if (!mob.attackHitbox) mob._playerHitThisSwing = false;
    }

    // --- Boss attack vs player ---
    if (this.boss && this.boss.state !== STATE.DEAD && this.boss.attackHitbox) {
      if (!this.boss._playerHitThisSwing && aabbOverlap(this.boss.attackHitbox, this.player.bounds)) {
        this.player.takeHit(this.boss.damage, this.boss.centerX);
        this.boss._playerHitThisSwing = true;
        // Player damage shake
        this.onHitEvent({ type: 'playerHit', isBoss: false });
      }
    }
    if (this.boss && !this.boss?.attackHitbox) {
      if (this.boss) this.boss._playerHitThisSwing = false;
    }
  }

  // -------------------------------------------------------
  // Healing orb pickups
  // -------------------------------------------------------

  _resolveOrbPickups() {
    if (!this.player.alive) return;

    for (const orb of this.orbs) {
      if (!orb.active) continue;
      if (aabbOverlap(this.player.bounds, orb.bounds)) {
        this.player.heal(orb.healAmount);
        orb.pickup();
      }
    }
  }

  _playerDamage() {
    return PLAYER_ATTACK_DAMAGE;
  }
}
