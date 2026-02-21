// ============================================================
// HealthBar.js — Animated health bar for the HUD.
// Internal display value lerps toward actual HP each frame.
// ============================================================

import {
  HUD_BAR_WIDTH, HUD_BAR_HEIGHT, HUD_LERP,
  COLOR_HP_BAR, COLOR_HP_BG, COLOR_TEXT,
} from '../utils/Constants.js';
import { lerp, clamp } from '../utils/MathUtils.js';

export class HealthBar {
  /**
   * @param {number} x       Screen X (top-left of bar)
   * @param {number} y       Screen Y (top-left of bar)
   * @param {number} maxHp
   */
  constructor(x, y, maxHp) {
    this.x     = x;
    this.y     = y;
    this.maxHp = maxHp;

    // Actual value (set from outside each frame)
    this._targetRatio  = 1;
    // Animated display value
    this._displayRatio = 1;
  }

  /**
   * Update the target HP and animate the display value.
   * @param {number} currentHp
   * @param {number} dt
   */
  update(currentHp, dt) {
    this._targetRatio  = clamp(currentHp / this.maxHp, 0, 1);
    const factor       = Math.min(1, HUD_LERP * dt);
    this._displayRatio = lerp(this._displayRatio, this._targetRatio, factor);
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} currentHp  For the numeric label
   */
  render(ctx, currentHp) {
    const w = HUD_BAR_WIDTH;
    const h = HUD_BAR_HEIGHT;
    const x = this.x;
    const y = this.y;

    ctx.save();

    // Label
    ctx.fillStyle  = COLOR_TEXT;
    ctx.font       = 'bold 12px monospace';
    ctx.textAlign  = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('HP', x, y + h / 2);

    const barX = x + 30;

    // Background
    ctx.fillStyle = COLOR_HP_BG;
    ctx.fillRect(barX, y, w, h);

    // Filled portion — animated
    const fillW = w * this._displayRatio;
    const barColor = this._targetRatio > 0.5
      ? COLOR_HP_BAR
      : this._targetRatio > 0.25
        ? '#FF8820'
        : '#FF2020';

    ctx.fillStyle = barColor;
    ctx.fillRect(barX, y, fillW, h);

    // Shine overlay
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(barX, y, fillW, h / 2);

    // Border
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.lineWidth   = 1.5;
    ctx.strokeRect(barX, y, w, h);

    // Numeric value
    ctx.fillStyle    = COLOR_TEXT;
    ctx.font         = '11px monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.ceil(currentHp)} / ${this.maxHp}`, barX + w / 2, y + h / 2);

    ctx.restore();
  }
}
