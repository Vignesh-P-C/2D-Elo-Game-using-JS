// ============================================================
// CollisionSystem.js — All AABB collision detection and resolution.
// ============================================================

import { aabbOverlap, aabbResolve } from '../utils/MathUtils.js';
import { STATE, PLAYER_ATTACK_DAMAGE } from '../utils/Constants.js';

export class CollisionSystem {
  constructor({ player, mobs, boss, orbs, coins, platforms, ground, worldWidth, worldHeight, onEloGain, onSpawnOrb, onHitEvent, onCoinCollected }) {
    this.player      = player;
    this.mobs        = mobs;
    this.boss        = boss;
    this.orbs        = orbs  || [];
    this.coins       = coins || [];
    this.platforms   = platforms;
    this.ground      = ground;
    this.worldWidth  = worldWidth;
    this.worldHeight = worldHeight;
    this.onEloGain      = onEloGain      || (() => {});
    this.onSpawnOrb     = onSpawnOrb     || (() => {});
    this.onHitEvent     = onHitEvent     || (() => {});
    this.onCoinCollected = onCoinCollected || (() => {});
  }

  run() {
    this._resolveEntityVsGround(this.player);

    for (const mob of this.mobs) {
      if (mob.state !== STATE.DEAD) this._resolveEntityVsGround(mob);
    }
    if (this.boss && this.boss.state !== STATE.DEAD) {
      this._resolveEntityVsGround(this.boss);
    }

    this._resolveAttacks();
    this._resolveOrbPickups();
    this._resolveCoinPickups();
  }

  // -------------------------------------------------------
  // Ground / platform resolution
  // -------------------------------------------------------

  _resolveEntityVsGround(entity) {
    const surfaces = [this.ground, ...this.platforms];

    for (const surface of surfaces) {
      if (!aabbOverlap(entity.bounds, surface)) continue;

      const { overlapX, overlapY } = aabbResolve(entity.bounds, surface);
      const absOX = Math.abs(overlapX);
      const absOY = Math.abs(overlapY);

      if (absOY < absOX) {
        if (overlapY < 0) {
          entity.y = surface.y - entity.height;
          entity.landOnGround();
        }
      } else {
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
    if (this.player.attackHitbox && this.player.state === STATE.ATTACKING) {
      const hitbox = this.player.attackHitbox;

      for (const mob of this.mobs) {
        if (mob.state === STATE.DEAD) continue;
        if (!mob._hitThisSwing && aabbOverlap(hitbox, mob.bounds)) {
          const prevHp = mob.hp;
          mob.takeHit(this._playerDamage(), this.player.centerX);
          mob._hitThisSwing = true;
          if (prevHp > 0 && mob.hp < prevHp) {
            const shouldSpawnOrb = this.player.registerSuccessfulHit();
            if (shouldSpawnOrb && mob.type !== 'speeder') {
              this.onSpawnOrb(mob.centerX, mob.centerY);
            }
            this.onHitEvent({ type: 'mobHit', isBoss: false });
          }
          if (mob.hp <= 0) this.onEloGain(mob.eloValue);
        }
      }

      if (this.boss && this.boss.state !== STATE.DEAD) {
        if (!this.boss._hitThisSwing && aabbOverlap(hitbox, this.boss.bounds)) {
          const prevHp = this.boss.hp;
          this.boss.takeHit(this._playerDamage(), this.player.centerX);
          this.boss._hitThisSwing = true;
          if (prevHp > 0 && this.boss.hp < prevHp) {
            const shouldSpawnOrb = this.player.registerSuccessfulHit();
            if (shouldSpawnOrb) this.onSpawnOrb(this.boss.centerX, this.boss.centerY);
            this.onHitEvent({ type: 'bossHit', isBoss: true });
          }
          if (this.boss.hp <= 0) {
            this.onEloGain(this.boss.eloValue);
            this.onHitEvent({ type: 'bossDeath', isBoss: true });
          }
        }
      }
    } else {
      for (const mob of this.mobs) mob._hitThisSwing = false;
      if (this.boss) this.boss._hitThisSwing = false;
    }

    if (!this.player.alive) return;

    for (const mob of this.mobs) {
      if (mob.state === STATE.DEAD || !mob.attackHitbox) continue;
      if (!mob._playerHitThisSwing && aabbOverlap(mob.attackHitbox, this.player.bounds)) {
        this.player.takeHit(mob.damage, mob.centerX);
        mob._playerHitThisSwing = true;
        this.onHitEvent({ type: 'playerHit', isBoss: false });
      }
    }
    for (const mob of this.mobs) {
      if (!mob.attackHitbox) mob._playerHitThisSwing = false;
    }

    if (this.boss && this.boss.state !== STATE.DEAD && this.boss.attackHitbox) {
      if (!this.boss._playerHitThisSwing && aabbOverlap(this.boss.attackHitbox, this.player.bounds)) {
        this.player.takeHit(this.boss.damage, this.boss.centerX);
        this.boss._playerHitThisSwing = true;
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

  // -------------------------------------------------------
  // Coin pickups
  // -------------------------------------------------------

  _resolveCoinPickups() {
    if (!this.player.alive) return;
    for (const coin of this.coins) {
      if (!coin.active || coin._collecting) continue;
      if (aabbOverlap(this.player.bounds, coin.bounds)) {
        coin.collect();
        this.onCoinCollected();
      }
    }
  }

  _playerDamage() {
    return PLAYER_ATTACK_DAMAGE;
  }
}