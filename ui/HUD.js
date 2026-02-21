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
  /**
   * @param {object} canvas  HTMLCanvasElement
   */
  constructor(canvas) {
    this.canvas = canvas;

    const pad    = HUD_PADDING;
    const startX = pad;
    const startY = pad;
    const rowH   = HUD_BAR_HEIGHT + 10;

    // Health bar — row 0
    this.healthBar = new HealthBar(startX, startY + rowH * 0, PLAYER_MAX_HP);
    // ELO bar    — row 1
    this.eloBar    = new EloBar(startX, startY + rowH * 1);

    // Cache last state values to avoid property access in render
    this._hp    = PLAYER_MAX_HP;
    this._elo   = 1000;
    this._level = 1;
  }

  /**
   * Update bar animations.
   * @param {number} dt
   * @param {object} state  { hp, elo, level }
   */
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
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} [message]        Center-screen message text
   * @param {number} [messageAlpha]   0–1 opacity
   */
  render(ctx, message, messageAlpha) {
    const pad    = HUD_PADDING;
    const panelW = HUD_BAR_WIDTH + 80;
    const panelH = HUD_BAR_HEIGHT * 2 + 40;

    // Semi-transparent panel background
    ctx.save();
    ctx.fillStyle = COLOR_HUD_BG;
    this._roundRect(ctx, pad - 6, pad - 6, panelW, panelH, 8);
    ctx.fill();
    ctx.restore();

    // Health and ELO bars
    this.healthBar.render(ctx, Math.ceil(this._hp));
    this.eloBar.render(ctx, this._elo);

    // Level indicator
    ctx.save();
    ctx.fillStyle    = COLOR_TEXT;
    ctx.font         = 'bold 13px monospace';
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`Level: ${this._level}`, pad, pad + (HUD_BAR_HEIGHT + 10) * 2 + 4);
    ctx.restore();

    // Controls hint (bottom-left, small)
    this._renderControls(ctx);

    // Center-screen message (level name, boss warning, etc.)
    if (message && messageAlpha > 0) {
      this._renderMessage(ctx, message, messageAlpha);
    }

    // Game over overlay
    if (this._hp <= 0) {
      this._renderGameOver(ctx);
    }
  }

  _renderControls(ctx) {
    ctx.save();
    ctx.fillStyle    = 'rgba(255,255,255,0.3)';
    ctx.font         = '11px monospace';
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Move: ←→ / AD   Jump: ↑ / W / Space   Attack: Left Click   Dash: Right Click', HUD_PADDING, this.canvas.height - HUD_PADDING);
    ctx.restore();
  }

  _renderMessage(ctx, message, alpha) {
    const cx = this.canvas.width  / 2;
    const cy = this.canvas.height / 3;

    ctx.save();
    ctx.globalAlpha = alpha;

    // Shadow
    ctx.fillStyle    = 'rgba(0,0,0,0.6)';
    ctx.font         = 'bold 42px monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(message, cx + 2, cy + 2);

    // Main text
    ctx.fillStyle = '#FFD700';
    ctx.fillText(message, cx, cy);

    ctx.restore();
  }

  _renderGameOver(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle    = '#FF3333';
    ctx.font         = 'bold 64px monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 30);

    ctx.fillStyle = '#FFFFFF';
    ctx.font      = '24px monospace';
    ctx.fillText('Refresh to play again', this.canvas.width / 2, this.canvas.height / 2 + 30);
    ctx.restore();
  }

  // Simple polyfill for roundRect (not available in all browsers)
  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  /** Called on canvas resize. */
  resize(canvas) {
    this.canvas = canvas;
  }
}