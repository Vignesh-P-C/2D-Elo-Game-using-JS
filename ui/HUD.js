// ============================================================
// HUD.js — Screen-space UI.
// ============================================================

import { HealthBar } from './HealthBar.js';
import { EloBar     } from './EloBar.js';
import {
  HUD_PADDING, HUD_BAR_WIDTH, HUD_BAR_HEIGHT,
  PLAYER_MAX_HP, COLOR_HUD_BG, COLOR_TEXT,
  // Minimap
  MINIMAP_WIDTH, MINIMAP_HEIGHT, MINIMAP_PADDING,
  MINIMAP_BG, MINIMAP_BORDER,
  MINIMAP_PLAYER_COLOR, MINIMAP_MOB_COLOR, MINIMAP_BOSS_COLOR,
  MINIMAP_GROUND_COLOR,
  // Damage numbers
  DMG_NUM_DURATION, DMG_NUM_RISE_SPEED,
  DMG_NUM_PLAYER_COLOR, DMG_NUM_MOB_COLOR,
} from '../utils/Constants.js';

export class HUD {
  constructor(canvas) {
    this.canvas = canvas;

    const pad  = HUD_PADDING;
    const rowH = HUD_BAR_HEIGHT + 10;

    this.healthBar = new HealthBar(pad, pad + rowH * 0, PLAYER_MAX_HP);
    this.eloBar    = new EloBar  (pad, pad + rowH * 1);

    this._hp    = PLAYER_MAX_HP;
    this._elo   = 1000;
    this._level = 1;
    this._coins = 0;

    // Leaderboard
    this._scores         = [];
    this._currentRunRank = 0;

    // Callbacks
    this._onRetry       = null;
    this._onPause       = null;
    this._onMusicToggle = null;

    // State
    this._retryBtn     = null;
    this._gearBtn      = null;
    this._paused       = false;
    this._musicOn      = true;
    this._showControls = false;
        // ── ADD ──────────────────────────────────────────────────────────────────
    this._onShop      = null;
    this._shieldActive = false;
    this._shieldTimer  = 0;
    this._damageMult   = 1.0;
    // ── END ADD ──────────────────────────────────────────────────────────────

    this._settingsBtns = {};

    // ---- Damage numbers ----
    // Each entry: { wx, wy, amount, isPlayer, timer, screenX, screenY }
    this._damageNumbers = [];

    // ---- Minimap state (set by Game each frame) ----
    this._minimapData = null; // { mobs, boss, player, worldWidth, groundY }

    this._boundClick   = (e) => this._handleClick(e);
    this._boundKeydown = (e) => this._handleKeydown(e);
    this.canvas.addEventListener('click', this._boundClick);
    window.addEventListener('keydown', this._boundKeydown);
  }

  // -------------------------------------------------------
  // Public API
  // -------------------------------------------------------

  setRetryCallback(fn)       { this._onRetry       = fn; }
  setPauseCallback(fn)       { this._onPause       = fn; }
  setMusicToggleCallback(fn) { this._onMusicToggle = fn; }
  // ── ADD ──────────────────────────────────────────────────────────────────
  setShopCallback(fn) { this._onShop = fn; }
  // ── END ADD ──────────────────────────────────────────────────────────────
  setPaused(paused)          { this._paused = paused; }

  recordScore(elo, level) {
    this._scores.push({ elo, level });
    this._scores.sort((a, b) => b.elo - a.elo || b.level - a.level);
    this._currentRunRank = this._scores.findIndex(s => s.elo === elo && s.level === level);
  }

  /**
   * Called by Game each frame to pass world entities for minimap rendering.
   */
  setMinimapData(data) {
    this._minimapData = data;
  }

  /**
   * Spawn a floating damage number.
   * @param {number} worldX   World-space X of the hit
   * @param {number} worldY   World-space Y of the hit
   * @param {number} amount   Damage dealt
   * @param {boolean} isPlayer  true = player was hit (red), false = enemy hit (white)
   * @param {{ x:number, y:number }} cameraOffset  Camera translate at time of spawn
   */
  spawnDamageNumber(worldX, worldY, amount, isPlayer, cameraOffset) {
    this._damageNumbers.push({
      worldX,
      worldY,
      amount,
      isPlayer,
      timer:   DMG_NUM_DURATION,
      // Screen position is recalculated every frame using the current camera
      _camX: cameraOffset ? cameraOffset.x : 0,
      _camY: cameraOffset ? cameraOffset.y : 0,
    });
  }

  update(dt, state) {
    this._hp    = state.hp;
    this._elo   = state.elo;
    this._level = state.level;
    this._coins = state.coins ?? 0;
        // ── ADD ──────────────────────────────────────────────────────────────────
    this._shieldActive = state.shieldActive ?? false;
    this._shieldTimer  = state.shieldTimer  ?? 0;
    this._damageMult   = state.damageMult   ?? 1.0;
    // ── END ADD ──────────────────────────────────────────────────────────────
    this.healthBar.update(state.hp, dt);
    this.eloBar.update(state.elo, dt);

    // Tick damage numbers
    for (const dn of this._damageNumbers) dn.timer -= dt;
    this._damageNumbers = this._damageNumbers.filter(dn => dn.timer > 0);
  }

  render(ctx, message, messageAlpha, cameraOffsetX = 0, cameraOffsetY = 0) {
    this._renderStatsPanel(ctx);
    this._renderControls(ctx);
    this._renderMinimap(ctx);

    if (message && messageAlpha > 0) this._renderMessage(ctx, message, messageAlpha);

    // Damage numbers (rendered in screen-space using camera offset)
    this._renderDamageNumbers(ctx, cameraOffsetX, cameraOffsetY);

    this._gearBtn = this._drawGearButton(ctx);

    if (this._paused) {
      if (this._showControls) this._renderControlsPage(ctx);
      else                    this._renderSettingsPopup(ctx);
    }

    if (this._hp <= 0) this._renderGameOver(ctx);
  }

  resize(canvas) {
    this.canvas.removeEventListener('click', this._boundClick);
    this.canvas = canvas;
    this.canvas.addEventListener('click', this._boundClick);
  }
  destroy() {
  this.canvas.removeEventListener('click', this._boundClick);
  window.removeEventListener('keydown', this._boundKeydown);
}

  // -------------------------------------------------------
  // Damage Numbers
  // -------------------------------------------------------

  _renderDamageNumbers(ctx, camOffX, camOffY) {
    if (this._damageNumbers.length === 0) return;
    ctx.save();
    for (const dn of this._damageNumbers) {
      const progress = 1 - dn.timer / DMG_NUM_DURATION; // 0→1
      const alpha    = Math.max(0, dn.timer / DMG_NUM_DURATION);
      const riseY    = progress * DMG_NUM_RISE_SPEED;

      // Convert world pos → screen pos via camera offset
      const sx = dn.worldX + camOffX;
      const sy = dn.worldY + camOffY - riseY;

      // Scale: pop up from small, then shrink as it fades
      const scale = progress < 0.15
        ? 0.5 + (progress / 0.15) * 0.75   // quick grow
        : 1.25 - progress * 0.4;            // slow shrink

      const fontSize = Math.round(16 * Math.max(0.5, scale));
      const color    = dn.isPlayer ? DMG_NUM_PLAYER_COLOR : DMG_NUM_MOB_COLOR;

      ctx.globalAlpha = alpha;
      ctx.font        = `bold ${fontSize}px monospace`;
      ctx.textAlign   = 'center';
      ctx.textBaseline = 'middle';

      // Drop shadow
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillText(`-${dn.amount}`, sx + 1, sy + 1);

      // Main text
      ctx.fillStyle = color;
      ctx.fillText(`-${dn.amount}`, sx, sy);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // -------------------------------------------------------
  // Minimap  (top-right corner)
  // -------------------------------------------------------

  _renderMinimap(ctx) {
    const d = this._minimapData;
    if (!d || !d.player) return;

    const cw   = this.canvas.width;
    const mapW = MINIMAP_WIDTH;
    const mapH = MINIMAP_HEIGHT;
    const mapX = cw - mapW - MINIMAP_PADDING;
    const mapY = MINIMAP_PADDING;

    ctx.save();

    // Background
    ctx.fillStyle = MINIMAP_BG;
    this._roundRect(ctx, mapX, mapY, mapW, mapH, 4);
    ctx.fill();

    // Clip to minimap rect
    ctx.beginPath();
    this._roundRect(ctx, mapX, mapY, mapW, mapH, 4);
    ctx.clip();

    // Ground strip
    const groundRatio = d.groundY / (d.worldHeight || this.canvas.height);
    ctx.fillStyle = MINIMAP_GROUND_COLOR;
    ctx.fillRect(mapX, mapY + mapH * groundRatio, mapW, mapH * (1 - groundRatio));

    const toMapX = (wx) => mapX + (wx / d.worldWidth) * mapW;
    const toMapY = (wy) => mapY + (wy / (d.worldHeight || this.canvas.height)) * mapH;

    // Platforms
    if (d.platforms) {
      ctx.fillStyle = 'rgba(139,69,19,0.7)';
      for (const p of d.platforms) {
        const px = toMapX(p.x);
        const py = toMapY(p.y);
        const pw = (p.width  / d.worldWidth)                               * mapW;
        const ph = Math.max(2, (p.height / (d.worldHeight || this.canvas.height)) * mapH);
        ctx.fillRect(px, py, Math.max(3, pw), ph);
      }
    }

    // Mobs
    if (d.mobs) {
      ctx.fillStyle = MINIMAP_MOB_COLOR;
      for (const m of d.mobs) {
        if (m.remove) continue;
        ctx.beginPath();
        ctx.arc(toMapX(m.x + m.width / 2), toMapY(m.y + m.height / 2), 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Boss
    if (d.boss && !d.boss.remove) {
      ctx.fillStyle = MINIMAP_BOSS_COLOR;
      ctx.beginPath();
      ctx.arc(toMapX(d.boss.x + d.boss.width / 2), toMapY(d.boss.y + d.boss.height / 2), 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Player — bright blue dot
    ctx.fillStyle = MINIMAP_PLAYER_COLOR;
    ctx.beginPath();
    ctx.arc(toMapX(d.player.x + d.player.width / 2), toMapY(d.player.y + d.player.height / 2), 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Border (drawn outside clip)
    ctx.save();
    ctx.strokeStyle = MINIMAP_BORDER;
    ctx.lineWidth   = 1;
    this._roundRect(ctx, mapX, mapY, mapW, mapH, 4);
    ctx.stroke();
    ctx.restore();
  }

  // -------------------------------------------------------
  // Stats panel
  // -------------------------------------------------------

  _renderStatsPanel(ctx) {
    const pad    = HUD_PADDING;
    const rowH   = HUD_BAR_HEIGHT + 10;
    const panelW = HUD_BAR_WIDTH + 80;
    const panelH = rowH * 2 + 80;

    ctx.save();
    ctx.fillStyle = COLOR_HUD_BG;
    this._roundRect(ctx, pad - 6, pad - 6, panelW, panelH, 8);
    ctx.fill();
    ctx.restore();

    this.healthBar.render(ctx, Math.ceil(this._hp));
    this.eloBar.render(ctx, this._elo);

    ctx.save();
    ctx.fillStyle    = COLOR_TEXT;
    ctx.font         = 'bold 13px monospace';
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`Level: ${this._level}`, pad, pad + rowH * 2 + 4);

    ctx.fillStyle = '#FFD700';
    ctx.fillText(`🪙 ${this._coins}`, pad, pad + rowH * 2 + 24);
    ctx.restore();
        if (this._shieldActive) {
      ctx.fillStyle = '#87CEEB';
      ctx.fillText(`🛡️ ${Math.ceil(this._shieldTimer)}s`, pad, pad + rowH * 2 + 44);
    }
    if (this._damageMult > 1.0) {
      ctx.fillStyle = '#FFD700';
      const col = this._shieldActive ? pad + 70 : pad;
      ctx.fillText(`⚔️ ×${this._damageMult.toFixed(2)}`, col, pad + rowH * 2 + 44);
    }
  }

  // -------------------------------------------------------
  // Gear button
  // -------------------------------------------------------

  _drawGearButton(ctx) {
    const pad    = HUD_PADDING;
    const rowH   = HUD_BAR_HEIGHT + 10;
    const panelW = HUD_BAR_WIDTH + 80;

    const btnSize = 32;
    const btnX    = pad - 6 + panelW + 8;
    const btnY    = pad - 6;

    ctx.save();
    ctx.fillStyle = this._paused ? 'rgba(255,255,255,0.2)' : COLOR_HUD_BG;
    this._roundRect(ctx, btnX, btnY, btnSize, btnSize, 6);
    ctx.fill();
    this._drawGearIcon(ctx, btnX + btnSize / 2, btnY + btnSize / 2, 10);
    ctx.restore();

    return { x: btnX, y: btnY, w: btnSize, h: btnSize };
  }

  _drawGearIcon(ctx, cx, cy, r) {
    const teeth  = 8;
    const inner  = r * 0.55;
    const outer  = r;
    const toothW = (Math.PI * 2 / teeth) * 0.4;

    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    for (let i = 0; i < teeth; i++) {
      const angle = (i / teeth) * Math.PI * 2 - Math.PI / 2;
      const a1 = angle - toothW / 2;
      const a2 = angle + toothW / 2;
      ctx.arc(cx, cy, outer, a1, a2);
      ctx.arc(cx, cy, inner, a2 + toothW * 0.3, a1 + (Math.PI * 2 / teeth) - toothW * 0.3, true);
    }
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = COLOR_HUD_BG;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // -------------------------------------------------------
  // Settings popup
  // -------------------------------------------------------

  _renderSettingsPopup(ctx) {
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const cx = cw / 2;
    const cy = ch / 2;

    const popW = 320;
    const popH = 320;
    const popX = cx - popW / 2;
    const popY = cy - popH / 2;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, cw, ch);

    ctx.fillStyle = 'rgba(15,15,35,0.97)';
    this._roundRect(ctx, popX, popY, popW, popH, 14);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    ctx.fillStyle    = '#FFFFFF';
    ctx.font         = 'bold 20px monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('⚙  SETTINGS', cx, popY + 20);

    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(popX + 20, popY + 52);
    ctx.lineTo(popX + popW - 20, popY + 52);
    ctx.stroke();

    const btns = [
      { key: 'music',    label: this._musicOn ? '🔊  Music: ON'  : '🔇  Music: OFF', active: this._musicOn,  disabled: false },
      { key: 'controls', label: '🎮  Controls',                                       active: false,          disabled: false },
      { key: 'sfx',      label: '🔔  Sound FX: Soon™',                                active: false,          disabled: true  },
      { key: 'shop', label: '🛒  Shop',                                               active: false, disabled: false },
      { key: 'build',    label: '⚔️  Switch Build: Coming Soon',                      active: false,          disabled: true  },
    ];

    this._settingsBtns = {};
    const btnH   = 40;
    const btnW   = popW - 48;
    const startY = popY + 64;

    for (let i = 0; i < btns.length; i++) {
      const b  = btns[i];
      const bx = popX + 24;
      const by = startY + i * (btnH + 6);

      ctx.fillStyle = b.disabled
        ? 'rgba(255,255,255,0.04)'
        : b.active
          ? 'rgba(80,200,120,0.15)'
          : 'rgba(255,255,255,0.07)';
      this._roundRect(ctx, bx, by, btnW, btnH, 8);
      ctx.fill();

      if (!b.disabled) {
        ctx.strokeStyle = b.active ? 'rgba(80,200,120,0.4)' : 'rgba(255,255,255,0.1)';
        ctx.lineWidth   = 1;
        ctx.stroke();
      }

      ctx.fillStyle    = b.disabled ? 'rgba(255,255,255,0.25)' : '#FFFFFF';
      ctx.font         = `${b.disabled ? '' : 'bold '}14px monospace`;
      ctx.textAlign    = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.label, bx + 14, by + btnH / 2);

      if (b.key === 'controls') {
        ctx.fillStyle    = 'rgba(255,255,255,0.5)';
        ctx.textAlign    = 'right';
        ctx.fillText('›', bx + btnW - 12, by + btnH / 2);
      }

      if (!b.disabled) {
        this._settingsBtns[b.key] = { x: bx, y: by, w: btnW, h: btnH };
      }
    }

    ctx.fillStyle    = 'rgba(255,255,255,0.3)';
    ctx.font         = '11px monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Press ESC or click ⚙ to close', cx, popY + popH - 10);

    ctx.restore();
  }

  // -------------------------------------------------------
  // Controls page
  // -------------------------------------------------------

  _renderControlsPage(ctx) {
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const cx = cw / 2;
    const cy = ch / 2;

    const popW = 520;
    const popH = 420;
    const popX = cx - popW / 2;
    const popY = cy - popH / 2;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, cw, ch);

    ctx.fillStyle = 'rgba(15,15,35,0.97)';
    this._roundRect(ctx, popX, popY, popW, popH, 14);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    ctx.fillStyle    = '#FFFFFF';
    ctx.font         = 'bold 20px monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('🎮  CONTROLS', cx, popY + 20);

    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(popX + 20, popY + 52);
    ctx.lineTo(popX + popW - 20, popY + 52);
    ctx.stroke();

    const ks = 42;
    const kg = 5;
    const kr = 6;

    const drawKey = (label, x, y, w = ks, h = ks, highlight = false) => {
      ctx.fillStyle = highlight ? 'rgba(74,144,226,0.6)' : 'rgba(255,255,255,0.10)';
      this._roundRect(ctx, x, y, w, h, kr);
      ctx.fill();
      ctx.strokeStyle = highlight ? 'rgba(74,144,226,0.9)' : 'rgba(255,255,255,0.25)';
      ctx.lineWidth   = 1.5;
      ctx.stroke();
      ctx.fillStyle    = '#FFFFFF';
      ctx.font         = `bold ${label.length > 3 ? '9' : '12'}px monospace`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x + w / 2, y + h / 2);
    };

    const drawLabel = (text, x, y) => {
      ctx.fillStyle    = 'rgba(255,255,255,0.6)';
      ctx.font         = '12px monospace';
      ctx.textAlign    = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x, y);
    };

    const wasdX = popX + 44;
    const wasdY = popY + 80;

    drawKey('W', wasdX + ks + kg, wasdY, ks, ks, true);
    drawKey('A', wasdX,               wasdY + ks + kg, ks, ks, true);
    drawKey('S', wasdX + ks + kg,     wasdY + ks + kg, ks, ks);
    drawKey('D', wasdX + (ks + kg)*2, wasdY + ks + kg, ks, ks, true);

    const arrX = wasdX + (ks + kg) * 4;
    const arrY = wasdY;
    drawKey('↑', arrX + ks + kg, arrY,           ks, ks, true);
    drawKey('←', arrX,           arrY + ks + kg, ks, ks, true);
    drawKey('↓', arrX + ks + kg, arrY + ks + kg, ks, ks);
    drawKey('→', arrX+(ks+kg)*2, arrY + ks + kg, ks, ks, true);

    const lblX = wasdX + (ks + kg) * 7 + 16;
    drawLabel('← Move Left',   lblX, wasdY + (ks + kg) + ks / 2);
    drawLabel('→ Move Right',  lblX, wasdY + (ks + kg) + ks / 2 + 22);
    drawLabel('↑ Jump',        lblX, wasdY + ks / 2);

    const spaceY = wasdY + (ks + kg) * 2 + 16;
    drawKey('SPACE', wasdX, spaceY, ks * 3 + kg * 2, 34, true);
    drawLabel('Jump', wasdX + ks * 3 + kg * 2 + 10, spaceY + 17);

    const mouseX = popX + 44;
    const mouseY = spaceY + 34 + 20;

    ctx.fillStyle = 'rgba(74,144,226,0.6)';
    this._roundRect(ctx, mouseX, mouseY, 32, 44, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(74,144,226,0.9)';
    ctx.lineWidth   = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(mouseX + 16, mouseY);
    ctx.lineTo(mouseX + 16, mouseY + 44);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth   = 1;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    this._roundRect(ctx, mouseX, mouseY, 16, 44, 8);
    ctx.fill();
    ctx.fillStyle    = '#FFFFFF';
    ctx.font         = '9px monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('L', mouseX + 8,  mouseY + 22);
    ctx.fillText('R', mouseX + 24, mouseY + 22);
    drawLabel('Left Click — Attack', mouseX + 44, mouseY + 16);
    drawLabel('Right Click — Dash',  mouseX + 44, mouseY + 32);

    const escX = popX + popW - 44 - ks;
    const escY = popY + 80;
    drawKey('ESC', escX, escY, ks, ks * 0.75);
    drawLabel('Open / Close Settings', escX - 120, escY + ks * 0.75 / 2);

    const backW = 100;
    const backH = 34;
    const backX = popX + 20;
    const backY = popY + popH - 50;
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    this._roundRect(ctx, backX, backY, backW, backH, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth   = 1;
    ctx.stroke();
    ctx.fillStyle    = '#FFFFFF';
    ctx.font         = 'bold 13px monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('‹ Back', backX + backW / 2, backY + backH / 2);
    this._settingsBtns['back'] = { x: backX, y: backY, w: backW, h: backH };

    ctx.fillStyle    = 'rgba(255,255,255,0.3)';
    ctx.font         = '11px monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Press ESC to close', cx, popY + popH - 10);

    ctx.restore();
  }

  // -------------------------------------------------------
  // Controls hint (bottom bar)
  // -------------------------------------------------------

  _renderControls(ctx) {
    ctx.save();
    ctx.fillStyle    = 'rgba(255,255,255,0.3)';
    ctx.font         = '11px monospace';
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(
      'Move: ←→ / AD   Jump: ↑ / W / Space   Attack: Left Click   Dash: Right Click   Settings: ESC',
      HUD_PADDING, this.canvas.height - HUD_PADDING
    );
    ctx.restore();
  }

  _renderMessage(ctx, message, alpha) {
    const cx = this.canvas.width  / 2;
    const cy = this.canvas.height / 3;
    ctx.save();
    ctx.globalAlpha  = alpha;
    ctx.font         = 'bold 42px monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle    = 'rgba(0,0,0,0.6)';
    ctx.fillText(message, cx + 2, cy + 2);
    ctx.fillStyle    = '#FFD700';
    ctx.fillText(message, cx, cy);
    ctx.restore();
  }

  // -------------------------------------------------------
  // Game Over
  // -------------------------------------------------------

  _renderGameOver(ctx) {
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const cx = cw / 2;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(0, 0, cw, ch);

    ctx.fillStyle    = '#FF3333';
    ctx.font         = 'bold 64px monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GAME  OVER', cx, ch * 0.16);

    if (this._scores.length > 0) this._renderLeaderboard(ctx, cx, ch);

    this._retryBtn = this._drawRetryButton(ctx, cx, ch);
    ctx.restore();
  }

  _renderLeaderboard(ctx, cx, ch) {
    const scores  = this._scores;
    const maxRows = Math.min(scores.length, 5);
    const tableW  = 380;
    const tableX  = cx - tableW / 2;
    const headerY = ch * 0.27;
    const rowH    = 38;
    const startY  = headerY + 44;
    const pad     = 16;

    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    this._roundRect(ctx, tableX - pad, headerY - pad, tableW + pad * 2, pad * 2 + 44 + rowH * maxRows, 10);
    ctx.fill();

    ctx.fillStyle    = '#FFD700';
    ctx.font         = 'bold 18px monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('SESSION  LEADERBOARD', cx, headerY);

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font      = '12px monospace';
    ctx.fillText('RANK', tableX + 36,  headerY + 28);
    ctx.fillText('ELO',  tableX + 150, headerY + 28);
    ctx.fillText('LEVEL REACHED', cx + 70, headerY + 28);

    for (let i = 0; i < maxRows; i++) {
      const s    = scores[i];
      const y    = startY + i * rowH;
      const isMe = i === this._currentRunRank;

      if (isMe) {
        ctx.fillStyle = 'rgba(255,215,0,0.10)';
        this._roundRect(ctx, tableX - 8, y - 2, tableW + 16, rowH - 4, 6);
        ctx.fill();
      }

      const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
      ctx.fillStyle    = rankColors[i] ?? 'rgba(255,255,255,0.75)';
      ctx.font         = i < 3 ? 'bold 16px monospace' : '15px monospace';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`#${i + 1}`, tableX + 36,  y + rowH / 2 - 2);

      ctx.fillStyle = isMe ? '#FFD700' : 'rgba(255,255,255,0.88)';
      ctx.fillText(s.elo,   tableX + 150, y + rowH / 2 - 2);
      ctx.fillText(s.level, cx + 70,      y + rowH / 2 - 2);

      if (isMe) {
        ctx.fillStyle = 'rgba(255,215,0,0.65)';
        ctx.font      = '11px monospace';
        ctx.fillText('← YOU', cx + 130, y + rowH / 2 - 2);
      }
    }
  }

  _drawRetryButton(ctx, cx, ch) {
    const btnW = 210;
    const btnH = 54;
    const btnX = cx - btnW / 2;
    const btnY = ch * 0.85;

    ctx.shadowColor = 'rgba(255,80,80,0.55)';
    ctx.shadowBlur  = 20;
    ctx.fillStyle   = '#BB1E1E';
    this._roundRect(ctx, btnX, btnY, btnW, btnH, 10);
    ctx.fill();
    ctx.strokeStyle = '#FF5555';
    ctx.lineWidth   = 2;
    ctx.stroke();
    ctx.shadowBlur  = 0;

    ctx.fillStyle    = '#FFFFFF';
    ctx.font         = 'bold 22px monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('▶  RETRY', cx, btnY + btnH / 2);

    return { x: btnX, y: btnY, w: btnW, h: btnH };
  }

  // -------------------------------------------------------
  // Input
  // -------------------------------------------------------

  _handleKeydown(e) {
    if (e.key === 'Escape' && this._hp > 0) {
      if (this._showControls) {
        this._showControls = false;
      } else {
        this._paused = !this._paused;
        if (this._onPause) this._onPause();
      }
    }
  }

  _handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mx   = e.clientX - rect.left;
    const my   = e.clientY - rect.top;

    if (this._gearBtn && this._hp > 0) {
      const g = this._gearBtn;
      if (mx >= g.x && mx <= g.x + g.w && my >= g.y && my <= g.y + g.h) {
        if (this._showControls) {
          this._showControls = false;
        } else {
          this._paused = !this._paused;
          if (this._onPause) this._onPause();
        }
        return;
      }
    }

    if (this._paused) {
      if (this._showControls) {
        const back = this._settingsBtns['back'];
        if (back && mx >= back.x && mx <= back.x + back.w && my >= back.y && my <= back.y + back.h) {
          this._showControls = false;
        }
        return;
      }

      const mb = this._settingsBtns.music;
      if (mb && mx >= mb.x && mx <= mb.x + mb.w && my >= mb.y && my <= mb.y + mb.h) {
        this._musicOn = !this._musicOn;
        if (this._onMusicToggle) this._onMusicToggle(this._musicOn);
        return;
      }

      const cb = this._settingsBtns.controls;
      if (cb && mx >= cb.x && mx <= cb.x + cb.w && my >= cb.y && my <= cb.y + cb.h) {
        this._showControls = true;
        return;
      }
            const shb = this._settingsBtns.shop;
      if (shb && mx >= shb.x && mx <= shb.x + shb.w && my >= shb.y && my <= shb.y + shb.h) {
        this._paused = false;      // Close settings popup
        if (this._onShop) this._onShop();
        return;
      }
      return;
    }

    if (this._retryBtn && this._hp <= 0) {
      const b = this._retryBtn;
      if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
        if (this._onRetry) this._onRetry();
      }
    }
  }

  // -------------------------------------------------------
  // Helpers
  // -------------------------------------------------------

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y,     x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h,     x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y,         x + r, y);
    ctx.closePath();
  }
}