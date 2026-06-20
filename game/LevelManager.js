// ============================================================
// LevelManager.js — Level configuration with 5 new enemy types
// ============================================================

import { Mob        } from '../entities/Mob.js';
import { Boss       } from '../entities/Boss.js';
import { HealingOrb } from '../entities/Projectile.js';
import { Projectile } from '../entities/Projectile.js';
import { Coin       } from '../entities/Coin.js';
import {
  LEVEL_WORLD_BASE_WIDTH, LEVEL_WORLD_WIDTH_STEP,
  LEVEL_GROUND_THICKNESS,
  LEVEL_PLATFORM_WIDTH, LEVEL_PLATFORM_HEIGHT,
  LEVEL_NEXT_DELAY,
  PLAYER_START_X,
  BOSS_DEFEAT_HEAL,
  STATE,
  COINS_PER_LEVEL, COINS_PER_LEVEL_EXTRA,
  COIN_WIDTH, COIN_HEIGHT,
  COIN_MIN_X_OFFSET, COIN_MAX_GROUND_OFFSET, COIN_MIN_GROUND_OFFSET,
} from '../utils/Constants.js';
import { randFloat, randInt } from '../utils/MathUtils.js';

export class LevelManager {
  constructor({ canvas, player, onLevelComplete, onEloGain }) {
    this.canvas          = canvas;
    this.player          = player;
    this.onLevelComplete = onLevelComplete;
    this.onEloGain       = onEloGain;

    this.currentLevel = 1;

    // Live entity arrays
    this.mobs        = [];
    this.boss        = null;
    this.orbs        = [];
    this.coins       = [];
    this.projectiles = [];
    this.platforms   = [];
    this.ground      = null;
    this.worldWidth  = 0;

    // Phase tracking
    this._bossSpawned   = false;
    this._levelEndTimer = -1;
    this._levelComplete = false;

    // Message display
    this.message      = '';
    this.messageTimer = 0;
  }

  // -------------------------------------------------------
  // Public API
  // -------------------------------------------------------

  initFirstLevel() {
    this._buildLevel(1);
  }

  loadLevel(levelNumber) {
    this.currentLevel = levelNumber;
    this._buildLevel(levelNumber);
  }

  spawnOrb(x, y) {
    this.orbs.push(new HealingOrb(x, y));
  }

  spawnProjectile(opts) {
    this.projectiles.push(new Projectile(opts));
  }

  update(dt) {
    this.mobs = this.mobs.filter(m => !m.remove);

    if (this.boss && this.boss.remove) {
      this.boss = null;
    }

    for (const orb of this.orbs) orb.update(dt);
    this.orbs = this.orbs.filter(o => o.active);

    for (const proj of this.projectiles) proj.update(dt);
    this.projectiles = this.projectiles.filter(p => p.active);

    for (const coin of this.coins) coin.update(dt);
    this.coins = this.coins.filter(c => c.active || c._collecting);

    if (this.messageTimer > 0) {
      this.messageTimer -= dt;
      if (this.messageTimer <= 0) this.message = '';
    }

    if (this._levelComplete) {
      if (this._levelEndTimer > 0) {
        this._levelEndTimer -= dt;
        if (this._levelEndTimer <= 0) {
          this._levelComplete = false;
          this.onLevelComplete(this.currentLevel + 1);
        }
      }
      return;
    }

    if (!this._bossSpawned && this.mobs.length === 0) {
      this._spawnBoss();
    }

    if (this._bossSpawned && this.boss === null && !this._levelComplete) {
      this._triggerLevelComplete();
    }
  }

  // -------------------------------------------------------
  // Level building
  // -------------------------------------------------------

  _buildLevel(level) {
    const canvas = this.canvas;

    this.worldWidth = LEVEL_WORLD_BASE_WIDTH + (level - 1) * LEVEL_WORLD_WIDTH_STEP;

    this.ground = {
      x:      0,
      y:      canvas.height - LEVEL_GROUND_THICKNESS,
      width:  this.worldWidth,
      height: LEVEL_GROUND_THICKNESS,
    };

    this.platforms    = this._generatePlatforms(level, canvas);
    this.mobs         = this._spawnMobs(level, canvas);
    this.boss         = null;
    this.orbs         = [];
    this.projectiles  = [];
    this.coins        = this._spawnCoins(level, canvas);
    this._bossSpawned   = false;
    this._levelComplete = false;
    this._levelEndTimer = -1;

    this.player.x  = PLAYER_START_X;
    this.player.y  = canvas.height - LEVEL_GROUND_THICKNESS - this.player.height - 2;
    this.player.vx = 0;
    this.player.vy = 0;

    // Wire callbacks on all mobs
    this._wireMobCallbacks();

    this._showMessage(`Level ${level}`);
  }

  _generatePlatforms(level, canvas) {
    const count       = randInt(4, 6);
    const platforms   = [];
    const minY        = 200;
    const maxY        = canvas.height - LEVEL_GROUND_THICKNESS - 150;
    const minX        = 300;
    const maxX        = this.worldWidth - 400;
    const segmentSize = (maxX - minX) / count;

    for (let i = 0; i < count; i++) {
      const segStart = minX + i * segmentSize;
      const x = randFloat(segStart, segStart + segmentSize - LEVEL_PLATFORM_WIDTH);
      const y = randFloat(minY, maxY);
      platforms.push({ x, y, width: LEVEL_PLATFORM_WIDTH, height: LEVEL_PLATFORM_HEIGHT });
    }

    return platforms;
  }

  _spawnMobs(level, canvas) {
    const count   = 3 + level * 2;
    const mobs    = [];
    const groundY = canvas.height - LEVEL_GROUND_THICKNESS;
    const step    = (this.worldWidth - 600) / count;

    for (let i = 0; i < count; i++) {
      const x = 400 + i * step + randFloat(0, step * 0.4);
      const y = groundY - 55 - 2;

      let type = 'normal';

      // Progression: introduce new types at their level
      if (level >= 9) {
        const roll = Math.random();
        if (roll < 0.1)      type = 'summoner';
        else if (roll < 0.2) type = 'healer';
        else if (roll < 0.3) type = 'berserker';
        else if (roll < 0.4) type = 'leaper';
        else if (roll < 0.5) type = 'archer';
        else if (roll < 0.65) type = 'shielder';
        else if (roll < 0.8) type = 'speeder';
      } else if (level >= 8) {
        const roll = Math.random();
        if (roll < 0.12)     type = 'healer';
        else if (roll < 0.25) type = 'berserker';
        else if (roll < 0.38) type = 'leaper';
        else if (roll < 0.5)  type = 'archer';
        else if (roll < 0.65) type = 'shielder';
        else if (roll < 0.8)  type = 'speeder';
      } else if (level >= 7) {
        const roll = Math.random();
        if (roll < 0.12)     type = 'berserker';
        else if (roll < 0.24) type = 'leaper';
        else if (roll < 0.36) type = 'archer';
        else if (roll < 0.5)  type = 'shielder';
        else if (roll < 0.75) type = 'speeder';
      } else if (level >= 6) {
        const roll = Math.random();
        if (roll < 0.15)     type = 'leaper';
        else if (roll < 0.3)  type = 'archer';
        else if (roll < 0.45) type = 'shielder';
        else if (roll < 0.7)  type = 'speeder';
      } else if (level >= 5) {
        const roll = Math.random();
        if (roll < 0.2)      type = 'archer';
        else if (roll < 0.35) type = 'shielder';
        else if (roll < 0.6)  type = 'speeder';
      } else if (level >= 4) {
        const roll = Math.random();
        if (roll < 0.3)      type = 'shielder';
        else if (roll < 0.5)  type = 'speeder';
      } else if (level >= 3) {
        if (Math.random() < 0.3) type = 'speeder';
      }

      mobs.push(new Mob(x, y, level, type));
    }

    return mobs;
  }

  _spawnCoins(level, canvas) {
    const idx   = level - 1;
    let count;
    if (idx < COINS_PER_LEVEL.length) {
      count = COINS_PER_LEVEL[idx];
    } else {
      count = COINS_PER_LEVEL[COINS_PER_LEVEL.length - 1]
            + (idx - COINS_PER_LEVEL.length + 1) * COINS_PER_LEVEL_EXTRA;
    }

    const coins   = [];
    const groundY = canvas.height - LEVEL_GROUND_THICKNESS;
    const minX    = COIN_MIN_X_OFFSET;
    const maxX    = this.worldWidth - 200;
    const step    = (maxX - minX) / count;

    for (let i = 0; i < count; i++) {
      const x = minX + i * step + randFloat(0, step * 0.6);
      const aboveGround = randFloat(COIN_MIN_GROUND_OFFSET, COIN_MAX_GROUND_OFFSET);
      const y = groundY - aboveGround - COIN_HEIGHT;
      coins.push(new Coin(x, y));
    }

    return coins;
  }

  _wireMobCallbacks() {
    const damageCb = (wx, wy, amount, isPlayer) => {
      // This callback will be invoked from Game.js via _wireDamageNumbers
    };

    for (const mob of this.mobs) {
      // Archer: fire projectile callback
      if (mob.type === 'archer') {
        mob.onFireProjectile = (x, y, vx, vy, damage) => {
          this.spawnProjectile({
            x, y, vx, vy, damage,
            owner: 'mob',
            radius: 8,
            worldWidth: this.worldWidth,
            worldHeight: this.canvas.height,
          });
        };
      }

      // Healer: pass mob reference for healing
      if (mob.type === 'healer') {
        mob.mobsRef = this.mobs;
      }

      // Summoner: summon callback and mob reference for counting
      if (mob.type === 'summoner') {
        mob.mobsRef = this.mobs;
        mob.onSummonMob = (x, y, type) => {
          const summon = new Mob(x, y, this.currentLevel, type);
          summon.summonedBy = mob.id; // Tag this summon
          summon.mobsRef = this.mobs; // For healer-like future types
          this.mobs.push(summon);
        };
      }
    }
  }

  _spawnBoss() {
    this._bossSpawned = true;
    const canvas  = this.canvas;
    const groundY = canvas.height - LEVEL_GROUND_THICKNESS;
    const bossX   = this.worldWidth / 2 - 30;
    const bossY   = groundY - 80 - 2;
    this.boss     = new Boss(bossX, bossY, this.currentLevel);
    this._showMessage('BOSS INCOMING!');
  }

  _triggerLevelComplete() {
    this._levelComplete = true;
    this._levelEndTimer = LEVEL_NEXT_DELAY;
    this.player.heal(BOSS_DEFEAT_HEAL);
    this._showMessage(`Level ${this.currentLevel} Complete!`);
  }

  _showMessage(text) {
    this.message      = text;
    this.messageTimer = 2.5;
  }
}
