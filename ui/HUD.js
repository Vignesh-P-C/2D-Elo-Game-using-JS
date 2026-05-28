// ============================================================
// HUD.js — Screen-space UI.
// ============================================================

import { HealthBar } from './HealthBar.js';
import { EloBar     } from './EloBar.js';
import {
  HUD_PADDING, HUD_BAR_WIDTH, HUD_BAR_HEIGHT,
  PLAYER_MAX_HP, COLOR_HUD_BG, COLOR_TEXT,
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
    this._retryBtn    = null;
    this._gearBtn     = null;
    this._paused      = false;
    this._musicOn     = true;

    // Settings popup button bounds
    this._settingsBtns = {};

    this._boundClick = (e) => this._handleClick(e);
    this.canvas.addEventListener('click', this._boundClick);
  }

  // -------------------------------------------------------
  // Public API
  // -------------------------------------------------------

  setRetryCallback(fn)       { this._onRetry       = fn; }
  setPauseCallback(fn)       { this._onPause       = fn; }
  setMusicToggleCallback(fn) { this._onMusicToggle = fn; }

  setPaused(paused) { this._paused = paused; }

  recordScore(elo, level) {
    this._scores.push({ elo, level });
    this._scores.sort((a, b) => b.elo - a.elo || b.level - a.level);
    this._currentRunRank = this._scores.findIndex(s => s.elo === elo && s.level === level);
  }

  update(dt, state) {
    this._hp    = state.hp;
    this._elo   = state.elo;
    this._level = state.level;
    this._coins = state.coins ?? 0;
    this.healthBar.update(state.hp, dt);
    this.eloBar.update(state.elo, dt);
  }

  render(ctx, message, messageAlpha) {
    this._renderStatsPanel(ctx);
    this._renderControls(ctx);

    if (message && messageAlpha > 0) this._renderMessage(ctx, message, messageAlpha);

    // Gear button (top-left, next to stats panel)
    this._gearBtn = this._drawGearButton(ctx);

    // Settings popup (when paused)
    if (this._paused) this._renderSettingsPopup(ctx);

    // Game over overlay
    if (this._hp <= 0) this._renderGameOver(ctx);
  }

  resize(canvas) {
    this.canvas.removeEventListener('click', this._boundClick);
    this.canvas = canvas;
    this.canvas.addEventListener('click', this._boundClick);
  }

  // -------------------------------------------------------
  // Stats panel (hp, elo, level, coins)
  // -------------------------------------------------------

  _renderStatsPanel(ctx) {
    const pad    = HUD_PADDING;
    const panelW = HUD_BAR_WIDTH + 80;
    const rowH   = HUD_BAR_HEIGHT + 10;
    // Extra height for coin row
    const panelH = rowH * 2 + 56;

    ctx.save();
    ctx.fillStyle = COLOR_HUD_BG;
    this._roundRect(ctx, pad - 6, pad - 6, panelW, panelH, 8);
    ctx.fill();
    ctx.restore();

    this.healthBar.render(ctx, Math.ceil(this._hp));
    this.eloBar.render(ctx, this._elo);

    // Level
    ctx.save();
    ctx.fillStyle    = COLOR_TEXT;
    ctx.font         = 'bold 13px monospace';
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`Level: ${this._level}`, pad, pad + rowH * 2 + 4);
    ctx.restore();

    // Coins
    ctx.save();
    ctx.font         = 'bold 13px monospace';
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle    = '#FFD700';
    ctx.fillText(`🪙 ${this._coins}`, pad, pad + rowH * 2 + 24);
    ctx.restore();
  }

  // -------------------------------------------------------
  // Gear / settings button
  // -------------------------------------------------------

  _drawGearButton(ctx) {
    const pad    = HUD_PADDING;
    const rowH   = HUD_BAR_HEIGHT + 10;
    const panelW = HUD_BAR_WIDTH + 80;
    const panelH = rowH * 2 + 56;

    // Position: right of the stats panel
    const btnSize = 32;
    const btnX    = pad - 6 + panelW + 8;
    const btnY    = pad - 6;

    // Button background
    ctx.save();
    ctx.fillStyle = this._paused ? 'rgba(255,255,255,0.2)' : COLOR_HUD_BG;
    this._roundRect(ctx, btnX, btnY, btnSize, btnSize, 6);
    ctx.fill();

    // Gear icon drawn with canvas arcs
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

    // Centre hole
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
    const popH = 300;
    const popX = cx - popW / 2;
    const popY = cy - popH / 2;

    // Backdrop
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, cw, ch);

    // Panel
    ctx.fillStyle = 'rgba(15,15,35,0.97)';
    this._roundRect(ctx, popX, popY, popW, popH, 14);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    // Title
    ctx.fillStyle    = '#FFFFFF';
    ctx.font         = 'bold 20px monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('⚙  SETTINGS', cx, popY + 20);

    // Divider
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(popX + 20, popY + 52);
    ctx.lineTo(popX + popW - 20, popY + 52);
    ctx.stroke();

    // Buttons
    const btns = [
      { key: 'music',    label: this._musicOn ? '🔊  Music: ON'  : '🔇  Music: OFF', active: this._musicOn },
      { key: 'sfx',      label: '🔔  Sound FX: Soon™',           active: false, disabled: true },
      { key: 'shop',     label: '🛒  Shop: Coming Soon',          active: false, disabled: true },
      { key: 'build',    label: '⚔️  Switch Build: Coming Soon',  active: false, disabled: true },
    ];

    this._settingsBtns = {};
    const btnH   = 44;
    const btnW   = popW - 48;
    const startY = popY + 64;

    for (let i = 0; i < btns.length; i++) {
      const b    = btns[i];
      const bx   = popX + 24;
      const by   = startY + i * (btnH + 8);

      // Button bg
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

      if (!b.disabled) {
        this._settingsBtns[b.key] = { x: bx, y: by, w: btnW, h: btnH };
      }
    }

    // Close hint
    ctx.fillStyle    = 'rgba(255,255,255,0.3)';
    ctx.font         = '11px monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Click ⚙ again to close', cx, popY + popH - 10);

    ctx.restore();
  }

  // -------------------------------------------------------
  // Controls hint
  // -------------------------------------------------------

  _renderControls(ctx) {
    ctx.save();
    ctx.fillStyle    = 'rgba(255,255,255,0.3)';
    ctx.font         = '11px monospace';
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(
      'Move: ←→ / AD   Jump: ↑ / W / Space   Attack: Left Click   Dash: Right Click',
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
    ctx.fillText('RANK', tableX + 36, headerY + 28);
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

  _handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mx   = e.clientX - rect.left;
    const my   = e.clientY - rect.top;

    // Gear button — always active
    if (this._gearBtn && this._hp > 0) {
      const g = this._gearBtn;
      if (mx >= g.x && mx <= g.x + g.w && my >= g.y && my <= g.y + g.h) {
        if (this._onPause) this._onPause();
        return;
      }
    }

    // Settings popup buttons
    if (this._paused) {
      const mb = this._settingsBtns.music;
      if (mb && mx >= mb.x && mx <= mb.x + mb.w && my >= mb.y && my <= mb.y + mb.h) {
        this._musicOn = !this._musicOn;
        if (this._onMusicToggle) this._onMusicToggle(this._musicOn);
        return;
      }
      // Swallow all other clicks while paused (except gear handled above)
      return;
    }

    // Retry button
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