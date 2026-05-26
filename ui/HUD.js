// ============================================================
// HUD.js — Screen-space UI. Renders after camera reset.
// Owns HealthBar and EloBar instances.
// ============================================================

import { HealthBar } from './HealthBar.js';
import { EloBar     } from './EloBar.js';
import {
  HUD_PADDING,
  HUD_BAR_WIDTH, HUD_BAR_HEIGHT,
  PLAYER_MAX_HP,
  COLOR_HUD_BG, COLOR_TEXT,
} from '../utils/Constants.js';

export class HUD {
  /** @param {object} canvas  HTMLCanvasElement */
  constructor(canvas) {
    this.canvas = canvas;

    const pad  = HUD_PADDING;
    const rowH = HUD_BAR_HEIGHT + 10;

    this.healthBar = new HealthBar(pad, pad + rowH * 0, PLAYER_MAX_HP);
    this.eloBar    = new EloBar  (pad, pad + rowH * 1);

    this._hp    = PLAYER_MAX_HP;
    this._elo   = 1000;
    this._level = 1;

    // --- Session leaderboard ---
    this._scores         = [];   // [{ elo, level }] — survives restarts via Game.js
    this._currentRunRank = 0;
    this._onRetry        = null; // set by Game via setRetryCallback()

    // Retry button bounds (updated each frame when game over is shown)
    this._retryBtn = null;

    // Click handler
    this._boundClick = (e) => this._handleClick(e);
    this.canvas.addEventListener('click', this._boundClick);
  }

  // -------------------------------------------------------
  // Public API
  // -------------------------------------------------------

  /** Game.js calls this once so the button can trigger a restart. */
  setRetryCallback(fn) {
    this._onRetry = fn;
  }

  /**
   * Push a completed run onto the leaderboard.
   * Called once by Game.js when the player dies.
   */
  recordScore(elo, level) {
    this._scores.push({ elo, level });
    this._scores.sort((a, b) => b.elo - a.elo || b.level - a.level);
    this._currentRunRank = this._scores.findIndex(s => s.elo === elo && s.level === level);
  }

  /** @param {number} dt  @param {{ hp, elo, level }} state */
  update(dt, state) {
    this._hp    = state.hp;
    this._elo   = state.elo;
    this._level = state.level;
    this.healthBar.update(state.hp, dt);
    this.eloBar.update(state.elo, dt);
  }

  /**
   * Render all HUD elements in screen space.
   * Call AFTER camera.reset(ctx).
   */
  render(ctx, message, messageAlpha) {
    const pad    = HUD_PADDING;
    const panelW = HUD_BAR_WIDTH + 80;
    const panelH = HUD_BAR_HEIGHT * 2 + 40;

    // Stats panel background
    ctx.save();
    ctx.fillStyle = COLOR_HUD_BG;
    this._roundRect(ctx, pad - 6, pad - 6, panelW, panelH, 8);
    ctx.fill();
    ctx.restore();

    this.healthBar.render(ctx, Math.ceil(this._hp));
    this.eloBar.render(ctx, this._elo);

    // Level label
    ctx.save();
    ctx.fillStyle    = COLOR_TEXT;
    ctx.font         = 'bold 13px monospace';
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`Level: ${this._level}`, pad, pad + (HUD_BAR_HEIGHT + 10) * 2 + 4);
    ctx.restore();

    this._renderControls(ctx);

    if (message && messageAlpha > 0) {
      this._renderMessage(ctx, message, messageAlpha);
    }

    if (this._hp <= 0) {
      this._renderGameOver(ctx);
    }
  }

  /** Called on canvas resize. */
  resize(canvas) {
    this.canvas.removeEventListener('click', this._boundClick);
    this.canvas = canvas;
    this.canvas.addEventListener('click', this._boundClick);
  }

  // -------------------------------------------------------
  // Private rendering
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

  _renderGameOver(ctx) {
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const cx = cw / 2;

    ctx.save();

    // Dim overlay
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(0, 0, cw, ch);

    // Title
    ctx.fillStyle    = '#FF3333';
    ctx.font         = 'bold 64px monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GAME  OVER', cx, ch * 0.16);

    // Leaderboard
    if (this._scores.length > 0) {
      this._renderLeaderboard(ctx, cx, ch);
    }

    // Retry button
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

    // Panel background
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    this._roundRect(
      ctx,
      tableX - pad,
      headerY - pad,
      tableW + pad * 2,
      pad * 2 + 44 + rowH * maxRows,
      10
    );
    ctx.fill();

    // Header
    ctx.fillStyle    = '#FFD700';
    ctx.font         = 'bold 18px monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('SESSION  LEADERBOARD', cx, headerY);

    // Column labels
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font      = '12px monospace';
    ctx.fillText('RANK',          tableX + 36,  headerY + 28);
    ctx.fillText('ELO',           tableX + 150, headerY + 28);
    ctx.fillText('LEVEL REACHED', cx + 70,      headerY + 28);

    for (let i = 0; i < maxRows; i++) {
      const s    = scores[i];
      const y    = startY + i * rowH;
      const isMe = i === this._currentRunRank;

      // Row highlight for current run
      if (isMe) {
        ctx.fillStyle = 'rgba(255,215,0,0.10)';
        this._roundRect(ctx, tableX - 8, y - 2, tableW + 16, rowH - 4, 6);
        ctx.fill();
      }

      // Rank colour: gold / silver / bronze / white
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

    ctx.fillStyle = '#BB1E1E';
    this._roundRect(ctx, btnX, btnY, btnW, btnH, 10);
    ctx.fill();

    ctx.strokeStyle = '#FF5555';
    ctx.lineWidth   = 2;
    ctx.stroke();

    ctx.shadowBlur = 0;

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
    if (!this._retryBtn || this._hp > 0) return;

    const rect = this.canvas.getBoundingClientRect();
    const mx   = e.clientX - rect.left;
    const my   = e.clientY - rect.top;
    const b    = this._retryBtn;

    if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
      if (this._onRetry) this._onRetry();
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