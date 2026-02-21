// ============================================================
// LevelManager.js — Level configuration, mob spawning,
// boss spawning, and level progression.
// ============================================================

import { Mob  } from '../entities/Mob.js';
import { Boss } from '../entities/Boss.js';
import { HealingOrb } from '../entities/Projectile.js';
import {
  LEVEL_WORLD_BASE_WIDTH, LEVEL_WORLD_WIDTH_STEP,
  LEVEL_GROUND_THICKNESS,
  LEVEL_PLATFORM_WIDTH, LEVEL_PLATFORM_HEIGHT,
  LEVEL_NEXT_DELAY,
  PLAYER_START_X,
  BOSS_DEFEAT_HEAL,
  STATE,
} from '../utils/Constants.js';
import { randFloat, randInt } from '../utils/MathUtils.js';

export class LevelManager {
  /**
   * @param {object} opts
   * @param {object}   opts.canvas
   * @param {object}   opts.player
   * @param {Function} opts.onLevelComplete  Called when boss is defeated
   * @param {Function} opts.onEloGain        Called with (amount)
   */
  constructor({ canvas, player, onLevelComplete, onEloGain }) {
    this.canvas          = canvas;
    this.player          = player;
    this.onLevelComplete = onLevelComplete;
    this.onEloGain       = onEloGain;

    this.currentLevel = 1;

    // Live entity arrays (Game.js reads these)
    this.mobs      = [];
    this.boss      = null;
    this.orbs      = []; // NEW: Healing orbs
    this.platforms = [];
    this.ground    = null;
    this.worldWidth = 0;

    // Phase tracking
    this._bossSpawned     = false;
    this._levelEndTimer   = -1;
    this._levelComplete   = false;

    // Message display
    this.message     = '';
    this.messageTimer = 0;
  }

  // -------------------------------------------------------
  // Public API
  // -------------------------------------------------------

  /** Build and start the first level. */
  initFirstLevel() {
    this._buildLevel(1);
  }

  /**
   * Load a specific level number.
   * Resets player position; does not reset ELO.
   */
  loadLevel(levelNumber) {
    this.currentLevel = levelNumber;
    this._buildLevel(levelNumber);
  }

  /**
   * Spawn a healing orb at the given position.
   * Called from CollisionSystem when player gets 4 successful hits.
   */
  spawnOrb(x, y) {
    this.orbs.push(new HealingOrb(x, y));
  }

  /**
   * Call each game tick. Handles mob death detection and level transition.
   * @param {number} dt
   */
  update(dt) {
    // Remove fully-dead mobs
    this.mobs = this.mobs.filter(m => !m.remove);

    // Remove boss if done
    if (this.boss && this.boss.remove) {
      this.boss = null;
    }

    // Update and remove inactive orbs
    for (const orb of this.orbs) {
      orb.update(dt);
    }
    this.orbs = this.orbs.filter(o => o.active);

    // Message timer
    if (this.messageTimer > 0) {
      this.messageTimer -= dt;
      if (this.messageTimer <= 0) this.message = '';
    }

    if (this._levelComplete) {
      // Waiting for level transition delay
      if (this._levelEndTimer > 0) {
        this._levelEndTimer -= dt;
        if (this._levelEndTimer <= 0) {
          this._levelComplete = false;
          this.onLevelComplete(this.currentLevel + 1);
        }
      }
      return;
    }

    // Spawn boss when all mobs are eliminated
    if (!this._bossSpawned && this.mobs.length === 0) {
      this._spawnBoss();
    }

    // Detect boss defeat
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

    // Ground
    this.ground = {
      x:      0,
      y:      canvas.height - LEVEL_GROUND_THICKNESS,
      width:  this.worldWidth,
      height: LEVEL_GROUND_THICKNESS,
    };

    // Platforms
    this.platforms    = this._generatePlatforms(level, canvas);
    this.mobs         = this._spawnMobs(level, canvas);
    this.boss         = null;
    this.orbs         = []; // Clear orbs on new level
    this._bossSpawned = false;
    this._levelComplete = false;
    this._levelEndTimer = -1;

    // Reset player
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
      // Space platforms evenly across the world to avoid clustering
      const segStart = minX + i * segmentSize;
      const x = randFloat(segStart, segStart + segmentSize - LEVEL_PLATFORM_WIDTH);
      const y = randFloat(minY, maxY);
      platforms.push({
        x,
        y,
        width:  LEVEL_PLATFORM_WIDTH,
        height: LEVEL_PLATFORM_HEIGHT,
      });
    }

    return platforms;
  }

  _spawnMobs(level, canvas) {
    const count  = 3 + level * 2; // 5 mobs level 1, 7 level 2, etc.
    const mobs   = [];
    const groundY = canvas.height - LEVEL_GROUND_THICKNESS;
    const step    = (this.worldWidth - 600) / count;

    for (let i = 0; i < count; i++) {
      const x = 400 + i * step + randFloat(0, step * 0.4);
      const y = groundY - 55 - 2; // just above ground
      mobs.push(new Mob(x, y, level));
    }

    return mobs;
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
    this._levelComplete   = true;
    this._levelEndTimer   = LEVEL_NEXT_DELAY;
    
    // NEW: Heal player on boss defeat
    this.player.heal(BOSS_DEFEAT_HEAL);
    
    this._showMessage(`Level ${this.currentLevel} Complete!`);
  }

  _showMessage(text) {
    this.message      = text;
    this.messageTimer = 2.5;
  }
}
