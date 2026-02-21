// ============================================================
// Game.js — Top-level orchestrator. Owns the game loop,
// all subsystems, and ELO state. Nothing else has global state.
// ============================================================

import { Player         } from '../entities/Player.js';
import { Camera         } from './Camera.js';
import { LevelManager   } from './LevelManager.js';
import { CollisionSystem } from './CollisionSystem.js';
import { InputManager   } from '../input/InputManager.js';
import { HUD            } from '../ui/HUD.js';
import {
  ELO_START,
  DT_CAP,
  HIT_PAUSE_DURATION,
  COLOR_BACKGROUND_TOP, COLOR_BACKGROUND_BOT,
  COLOR_GROUND, COLOR_GROUND_EDGE,
  COLOR_PLATFORM, COLOR_PLATFORM_EDGE,
  PLAYER_ATTACK_DAMAGE,
  LEVEL_GROUND_THICKNESS,
} from '../utils/Constants.js';

export class Game {
  /** @param {HTMLCanvasElement} canvas */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');

    // --- ELO (game-level state) ---
    this.elo = ELO_START;

    // --- Subsystems ---
    this.input  = new InputManager();
    this.camera = new Camera(canvas.width, canvas.height);
    this.hud    = new HUD(canvas);

    // Player (LevelManager positions it per level)
    this.player = new Player(200, 200);

    // LevelManager wires itself to player, calls back here
    this.levelManager = new LevelManager({
      canvas:          this.canvas,
      player:          this.player,
      onLevelComplete: (nextLevel) => this._loadLevel(nextLevel),
      onEloGain:       (amount)    => this._addElo(amount),
    });

    // CollisionSystem reference — rebuilt each level
    this.collision = null;

    // Timing
    this._lastTimestamp = 0;
    this._running       = false;

    // Message display
    this._messageAlpha = 0;

    // NEW: Hit pause
    this._hitPauseTimer = 0;

    // Canvas resize
    window.addEventListener('resize', () => this._onResize());
  }

  // -------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------

  start() {
    this._running = true;
    this.levelManager.initFirstLevel();
    this._buildCollisionSystem();
    this.camera.setWorldWidth(this.levelManager.worldWidth);
    this.camera.snapTo(this.player);
    requestAnimationFrame((ts) => this._loop(ts));
  }

  _loadLevel(levelNumber) {
    this.levelManager.loadLevel(levelNumber);
    this._buildCollisionSystem();
    this.camera.setWorldWidth(this.levelManager.worldWidth);
    this.camera.snapTo(this.player);
  }

  _buildCollisionSystem() {
    this.collision = new CollisionSystem({
      player:      this.player,
      mobs:        this.levelManager.mobs,
      boss:        this.levelManager.boss,
      orbs:        this.levelManager.orbs,
      platforms:   this.levelManager.platforms,
      ground:      this.levelManager.ground,
      worldWidth:  this.levelManager.worldWidth,
      worldHeight: this.canvas.height,
      onEloGain:   (amount) => this._addElo(amount),
      onSpawnOrb:  (x, y) => this.levelManager.spawnOrb(x, y),
      onHitEvent:  (event) => this._handleHitEvent(event),
    });
  }

  _addElo(amount) {
    this.elo += amount;
  }

  _handleHitEvent(event) {
    // Trigger hit pause
    this._hitPauseTimer = HIT_PAUSE_DURATION;

    // Trigger screen shake
    switch (event.type) {
      case 'bossHit':
        this.camera.shake(1.2);
        break;
      case 'bossDeath':
        this.camera.shake(2.0);
        break;
      case 'playerHit':
        this.camera.shake(0.8);
        break;
      case 'mobHit':
        // No shake for regular mob hits (too frequent)
        break;
    }
  }

  // -------------------------------------------------------
  // Game Loop
  // -------------------------------------------------------

  _loop(timestamp) {
    if (!this._running) return;

    // 1. Delta time (capped)
    const rawDt = (timestamp - this._lastTimestamp) / 1000;
    this._lastTimestamp = timestamp;
    const dt = Math.min(rawDt || 0, DT_CAP);

    // NEW: Handle hit pause
    if (this._hitPauseTimer > 0) {
      this._hitPauseTimer -= dt;
      // During hit pause, skip game updates but continue rendering
      this._render();
      requestAnimationFrame((ts) => this._loop(ts));
      return;
    }

    // 2. Input
    this.input.update();

    // Only update game logic if player is alive
    if (this.player.alive) {
      // 3. Player (pass current level for dash invulnerability)
      this.player.update(dt, this.input, this.levelManager.worldWidth, this.levelManager.currentLevel);

      // 4. Mobs & Boss
      const allEnemies = [...this.levelManager.mobs];
      if (this.levelManager.boss) allEnemies.push(this.levelManager.boss);

      for (const enemy of allEnemies) {
        enemy.update(dt, this.player, this.levelManager.worldWidth);
      }

      // 5. Level manager (mob removal, boss spawning, level transitions)
      this.levelManager.update(dt);

      // Rebuild collision system if boss state changed
      this._syncCollisionSystem();

      // 6. Collision
      this.collision.run();

      // 7. Camera
      this.camera.update(dt, this.player);
    } else {
      // Still update camera even when dead
      this.camera.update(dt, this.player);
    }

    // 8. HUD update
    this._updateMessage(dt);
    this.hud.update(dt, {
      hp:    this.player.hp,
      elo:   this.elo,
      level: this.levelManager.currentLevel,
    });

    // 9. Render
    this._render();

    requestAnimationFrame((ts) => this._loop(ts));
  }

  _syncCollisionSystem() {
    // Update live references in CollisionSystem after mob removal / boss spawn
    this.collision.mobs      = this.levelManager.mobs;
    this.collision.boss      = this.levelManager.boss;
    this.collision.orbs      = this.levelManager.orbs;
    this.collision.platforms = this.levelManager.platforms;
    this.collision.ground    = this.levelManager.ground;
    this.collision.worldWidth = this.levelManager.worldWidth;
  }

  _updateMessage(dt) {
    if (this.levelManager.message) {
      this._messageAlpha = 1;
    } else {
      this._messageAlpha = Math.max(0, this._messageAlpha - dt * 0.8);
    }
  }

  // -------------------------------------------------------
  // Rendering
  // -------------------------------------------------------

  _render() {
    const ctx    = this.ctx;
    const canvas = this.canvas;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // --- Background (screen space, drawn before camera transform) ---
    this._renderBackground(ctx, canvas);

    // --- World space ---
    ctx.save();
    this.camera.apply(ctx);

    this._renderGround(ctx);
    this._renderPlatforms(ctx);

    // Healing orbs
    for (const orb of this.levelManager.orbs) {
      orb.render(ctx);
    }

    // Mobs (dead first so live renders on top)
    const mobs = this.levelManager.mobs;
    for (const mob of mobs) mob.render(ctx);

    // Boss
    if (this.levelManager.boss) this.levelManager.boss.render(ctx);

    // Player
    this.player.render(ctx);

    ctx.restore();

    // --- Screen space (HUD) ---
    this.camera.reset(ctx);
    this.hud.render(
      ctx,
      this.levelManager.message,
      this._messageAlpha
    );
  }

  _renderBackground(ctx, canvas) {
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0,   COLOR_BACKGROUND_TOP);
    grad.addColorStop(1,   COLOR_BACKGROUND_BOT);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle star field
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    // Use a deterministic set so stars don't flicker each frame
    for (let i = 0; i < 60; i++) {
      const sx = ((i * 137.5) % canvas.width);
      const sy = ((i * 93.7)  % (canvas.height * 0.7));
      const sr = 0.5 + (i % 3) * 0.5;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _renderGround(ctx) {
    const g = this.levelManager.ground;
    if (!g) return;

    // Main ground fill
    ctx.fillStyle = COLOR_GROUND;
    ctx.fillRect(g.x, g.y, g.width, g.height);

    // Top edge highlight
    ctx.fillStyle = COLOR_GROUND_EDGE;
    ctx.fillRect(g.x, g.y, g.width, 6);

    // Subtle grid lines on ground
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth   = 1;
    const step = 60;
    for (let x = 0; x < g.width; x += step) {
      ctx.beginPath();
      ctx.moveTo(g.x + x, g.y);
      ctx.lineTo(g.x + x, g.y + g.height);
      ctx.stroke();
    }
  }

  _renderPlatforms(ctx) {
    for (const plat of this.levelManager.platforms) {
      // Platform body
      ctx.fillStyle = COLOR_PLATFORM;
      ctx.fillRect(plat.x, plat.y, plat.width, plat.height);

      // Top edge
      ctx.fillStyle = COLOR_PLATFORM_EDGE;
      ctx.fillRect(plat.x, plat.y, plat.width, 4);

      // Outline
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth   = 1.5;
      ctx.strokeRect(plat.x, plat.y, plat.width, plat.height);
    }
  }

  // -------------------------------------------------------

  _onResize() {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.camera.resize(this.canvas.width, this.canvas.height);
    this.hud.resize(this.canvas);
  }
}
