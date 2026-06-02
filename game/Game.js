// ============================================================
// Game.js — Top-level orchestrator.
// ============================================================

import { Player          } from '../entities/Player.js';
import { Camera          } from './Camera.js';
import { LevelManager    } from './LevelManager.js';
import { CollisionSystem } from './CollisionSystem.js';
import { InputManager    } from '../input/InputManager.js';
import { HUD             } from '../ui/HUD.js';
import { audioManager    } from '../utils/AssetLoader.js';
import {
  ELO_START, DT_CAP, HIT_PAUSE_DURATION,
  COLOR_BACKGROUND_TOP, COLOR_BACKGROUND_BOT,
  COLOR_GROUND, COLOR_GROUND_EDGE,
  COLOR_PLATFORM, COLOR_PLATFORM_EDGE,
  LEVEL_GROUND_THICKNESS,
} from '../utils/Constants.js';

export class Game {
  constructor(canvas, previousScores = [], onRetry = null) {
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');

    this.elo                 = ELO_START;
    this.coins               = 0;
    this.doubleJumpUnlocked  = false;

    this.input  = new InputManager();
    this.camera = new Camera(canvas.width, canvas.height);
    this.hud    = new HUD(canvas);

    this.hud.setRetryCallback(() => { if (onRetry) onRetry(); });
    this.hud.setPauseCallback(() => this._togglePause());
    this.hud.setMusicToggleCallback((enabled) => {
      if (enabled) audioManager.playMusic(this._isBossLevel ? 'boss' : 'normal');
      else         audioManager.stopMusic();
      this._musicEnabled = enabled;
    });
    if (previousScores.length > 0) this.hud._scores = [...previousScores];

    this.player = new Player(200, 200);

    // Wire damage number callback on the player
    this.player.onDamageNumber = (wx, wy, amount, isPlayer) => {
      this._spawnDamageNumber(wx, wy, amount, isPlayer);
    };

    this.levelManager = new LevelManager({
      canvas:             this.canvas,
      player:             this.player,
      onLevelComplete:    (n)  => this._loadLevel(n),
      onEloGain:          (a)  => this._addElo(a),
      onDoubleJumpUnlock: ()   => this._unlockDoubleJump(),
    });

    // Audio
    this._isBossLevel  = false;
    this._musicEnabled = true;
    window.addEventListener('keydown',     () => this._initAudio(), { once: true });
    window.addEventListener('pointerdown', () => this._initAudio(), { once: true });

    this.collision = null;

    this._lastTimestamp = 0;
    this._running       = false;
    this._paused        = false;
    this._messageAlpha  = 0;
    this._hitPauseTimer = 0;
    this._scoreRecorded = false;

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

  getSessionScores() { return this.hud._scores; }

  destroy() {
    this._running = false;
    audioManager.stopMusic();
  }

  // -------------------------------------------------------
  // Private
  // -------------------------------------------------------

  _loadLevel(levelNumber) {
    this.levelManager.loadLevel(levelNumber);
    this._buildCollisionSystem();
    this.camera.setWorldWidth(this.levelManager.worldWidth);
    this.camera.snapTo(this.player);
  }

  _buildCollisionSystem() {
    this.collision = new CollisionSystem({
      player:          this.player,
      mobs:            this.levelManager.mobs,
      boss:            this.levelManager.boss,
      orbs:            this.levelManager.orbs,
      coins:           this.levelManager.coins,
      platforms:       this.levelManager.platforms,
      ground:          this.levelManager.ground,
      worldWidth:      this.levelManager.worldWidth,
      worldHeight:     this.canvas.height,
      onEloGain:       (a)  => this._addElo(a),
      onSpawnOrb:      (x, y) => this.levelManager.spawnOrb(x, y),
      onHitEvent:      (e)  => this._handleHitEvent(e),
      onCoinCollected: ()   => { this.coins++; },
    });

    // Wire damage number callbacks on all current mobs/boss
    this._wireDamageNumbers();
  }

  /** Attach onDamageNumber to every enemy so hits spawn floating numbers. */
  _wireDamageNumbers() {
    const cb = (wx, wy, amount, isPlayer) => this._spawnDamageNumber(wx, wy, amount, isPlayer);
    for (const mob of this.levelManager.mobs) mob.onDamageNumber = cb;
    if (this.levelManager.boss) this.levelManager.boss.onDamageNumber = cb;
  }

  _spawnDamageNumber(wx, wy, amount, isPlayer) {
    const offset = this.camera.getOffset(); // { x, y }
    this.hud.spawnDamageNumber(wx, wy, amount, isPlayer, offset);
  }

  _addElo(amount)  { this.elo += amount; }

  _togglePause() {
    this._paused = !this._paused;
    this.hud.setPaused(this._paused);
  }

  _unlockDoubleJump() {
    if (this.doubleJumpUnlocked) return;
    this.doubleJumpUnlocked = true;
    this.player.unlockDoubleJump();
    this.levelManager._showMessage('DOUBLE JUMP UNLOCKED!');
  }

  _handleHitEvent(event) {
    this._hitPauseTimer = HIT_PAUSE_DURATION;
    switch (event.type) {
      case 'bossHit':   this.camera.shake(1.2); break;
      case 'bossDeath': this.camera.shake(2.0); break;
      case 'playerHit': this.camera.shake(0.8); break;
    }
  }

  // -------------------------------------------------------
  // Game Loop
  // -------------------------------------------------------

  _loop(timestamp) {
    if (!this._running) return;

    const rawDt = (timestamp - this._lastTimestamp) / 1000;
    this._lastTimestamp = timestamp;
    const dt = Math.min(rawDt || 0, DT_CAP);

    // Hit pause — freeze everything except rendering
    if (this._hitPauseTimer > 0) {
      this._hitPauseTimer -= dt;
      this._render();
      requestAnimationFrame((ts) => this._loop(ts));
      return;
    }

    // Game pause — FULLY stop all updates, render only
    if (this._paused) {
      this._render();
      requestAnimationFrame((ts) => this._loop(ts));
      return;
    }

    this.input.update();

    if (this.player.alive) {
      this.player.update(dt, this.input, this.levelManager.worldWidth, this.levelManager.currentLevel);

      const allEnemies = [...this.levelManager.mobs];
      if (this.levelManager.boss) allEnemies.push(this.levelManager.boss);
      for (const enemy of allEnemies) enemy.update(dt, this.player, this.levelManager.worldWidth);

      this.levelManager.update(dt);
      this._updateMusic();
      this._syncCollisionSystem();
      this.collision.run();
      this.camera.update(dt, this.player);

      // Re-wire damage numbers for any newly spawned enemies
      this._wireDamageNumbers();
    } else {
      if (!this._scoreRecorded) {
        this._scoreRecorded = true;
        this.hud.recordScore(this.elo, this.levelManager.currentLevel);
        audioManager.stopMusic();
      }
      this.camera.update(dt, this.player);
    }

    this._updateMessage(dt);
    this.hud.update(dt, {
      hp:    this.player.hp,
      elo:   this.elo,
      level: this.levelManager.currentLevel,
      coins: this.coins,
    });

    // Push minimap data to HUD every frame
    const ground = this.levelManager.ground;
    this.hud.setMinimapData({
      player:      this.player,
      mobs:        this.levelManager.mobs,
      boss:        this.levelManager.boss,
      platforms:   this.levelManager.platforms,
      worldWidth:  this.levelManager.worldWidth,
      worldHeight: this.canvas.height,
      groundY:     ground ? ground.y : this.canvas.height - 60,
    });

    this._render();
    requestAnimationFrame((ts) => this._loop(ts));
  }

  _syncCollisionSystem() {
    this.collision.mobs       = this.levelManager.mobs;
    this.collision.boss       = this.levelManager.boss;
    this.collision.orbs       = this.levelManager.orbs;
    this.collision.coins      = this.levelManager.coins;
    this.collision.platforms  = this.levelManager.platforms;
    this.collision.ground     = this.levelManager.ground;
    this.collision.worldWidth = this.levelManager.worldWidth;
  }

  _updateMessage(dt) {
    if (this.levelManager.message) this._messageAlpha = 1;
    else this._messageAlpha = Math.max(0, this._messageAlpha - dt * 0.8);
  }

  // -------------------------------------------------------
  // Audio
  // -------------------------------------------------------

  async _initAudio() {
    await audioManager.init();
    if (this._running && this._musicEnabled) {
      audioManager.playMusic('normal');
      this._isBossLevel = false;
    }
  }

  _updateMusic() {
    if (!this._musicEnabled) return;
    const bossActive = this.levelManager.boss !== null;
    if (bossActive && !this._isBossLevel) {
      audioManager.playMusic('boss');
      this._isBossLevel = true;
    } else if (!bossActive && this._isBossLevel) {
      audioManager.playMusic('normal');
      this._isBossLevel = false;
    }
  }

  // -------------------------------------------------------
  // Rendering
  // -------------------------------------------------------

  _render() {
    const ctx    = this.ctx;
    const canvas = this.canvas;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this._renderBackground(ctx, canvas);

    ctx.save();
    this.camera.apply(ctx);

    this._renderGround(ctx);
    this._renderPlatforms(ctx);

    for (const orb  of this.levelManager.orbs)  orb.render(ctx);
    for (const coin of this.levelManager.coins)  coin.render(ctx);
    for (const mob  of this.levelManager.mobs)   mob.render(ctx);
    if (this.levelManager.boss) this.levelManager.boss.render(ctx);
    this.player.render(ctx);

    ctx.restore();

    this.camera.reset(ctx);

    // Camera offset for damage numbers (world → screen conversion)
    const off = (this.camera.getOffset)
      ? this.camera.getOffset()
      : { x: -(this.camera.x ?? 0), y: -(this.camera.y ?? 0) };
    this.hud.render(ctx, this.levelManager.message, this._messageAlpha, off.x, off.y);
  }

  _renderBackground(ctx, canvas) {
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, COLOR_BACKGROUND_TOP);
    grad.addColorStop(1, COLOR_BACKGROUND_BOT);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
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
    ctx.fillStyle = COLOR_GROUND;
    ctx.fillRect(g.x, g.y, g.width, g.height);
    ctx.fillStyle = COLOR_GROUND_EDGE;
    ctx.fillRect(g.x, g.y, g.width, 6);
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth   = 1;
    for (let x = 0; x < g.width; x += 60) {
      ctx.beginPath();
      ctx.moveTo(g.x + x, g.y);
      ctx.lineTo(g.x + x, g.y + g.height);
      ctx.stroke();
    }
  }

  _renderPlatforms(ctx) {
    for (const plat of this.levelManager.platforms) {
      ctx.fillStyle = COLOR_PLATFORM;
      ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
      ctx.fillStyle = COLOR_PLATFORM_EDGE;
      ctx.fillRect(plat.x, plat.y, plat.width, 4);
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth   = 1.5;
      ctx.strokeRect(plat.x, plat.y, plat.width, plat.height);
    }
  }

  _onResize() {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.camera.resize(this.canvas.width, this.canvas.height);
    this.hud.resize(this.canvas);
  }
}

