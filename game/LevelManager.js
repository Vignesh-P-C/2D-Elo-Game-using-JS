// ============================================================
// LevelManager.js — Level configuration, mob spawning,
// boss spawning, and level progression.
// ============================================================

import { Mob        } from '../entities/Mob.js';
import { Boss       } from '../entities/Boss.js';
import { HealingOrb } from '../entities/Projectile.js';
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
  constructor({ canvas, player, onLevelComplete, onEloGain, onDoubleJumpUnlock }) {
    this.canvas          = canvas;
    this.player          = player;
    this.onLevelComplete = onLevelComplete;
    this.onEloGain       = onEloGain;
    this.onDoubleJumpUnlock = onDoubleJumpUnlock || (() => {});

    this.currentLevel = 1;

    // Live entity arrays (Game.js reads these)
    this.mobs      = [];
    this.boss      = null;
    this.orbs      = [];
    this.coins     = [];   // NEW: collectible coins
    this.platforms = [];
    this.ground    = null;
    this.worldWidth = 0;

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

  update(dt) {
    this.mobs = this.mobs.filter(m => !m.remove);

    if (this.boss && this.boss.remove) {
      this.boss = null;
    }

    for (const orb of this.orbs) orb.update(dt);
    this.orbs = this.orbs.filter(o => o.active);

    // Update coins (collection pop animation)
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
    this.coins        = this._spawnCoins(level, canvas);  // NEW
    this._bossSpawned   = false;
    this._levelComplete = false;
    this._levelEndTimer = -1;

    this.player.x  = PLAYER_START_X;
    this.player.y  = canvas.height - LEVEL_GROUND_THICKNESS - this.player.height - 2;
    this.player.vx = 0;
    this.player.vy = 0;

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
      if (level >= 4) {
        const roll = Math.random();
        if (roll < 0.25)      type = 'shielder';
        else if (roll < 0.5)  type = 'speeder';
      } else if (level >= 3) {
        if (Math.random() < 0.3) type = 'speeder';
      }

      mobs.push(new Mob(x, y, level, type));
    }

    return mobs;
  }

  /**
   * Spawn coins at random reachable positions for this level.
   * Heights range from ground level up to single-jump height (~250px above ground).
   */
  _spawnCoins(level, canvas) {
    // Determine count
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
      // Spread evenly with jitter so coins don't cluster
      const x = minX + i * step + randFloat(0, step * 0.6);
      // Random height: from near-ground up to single-jump reachable
      const aboveGround = randFloat(COIN_MIN_GROUND_OFFSET, COIN_MAX_GROUND_OFFSET);
      const y = groundY - aboveGround - COIN_HEIGHT;

      coins.push(new Coin(x, y));
    }

    return coins;
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
    if (this.currentLevel === 3) this.onDoubleJumpUnlock();
    this._showMessage(`Level ${this.currentLevel} Complete!`);
  }

  _showMessage(text) {
    this.message      = text;
    this.messageTimer = 2.5;
  }
}