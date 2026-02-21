// ============================================================
// EloBar.js — Animated ELO progress bar for the HUD.
// Bar fills per 100-ELO segment and resets, displaying progress
// toward next 100-ELO milestone.
// ============================================================

import {
  HUD_BAR_WIDTH, HUD_BAR_HEIGHT, HUD_LERP,
  ELO_BAR_SEGMENT,
  COLOR_ELO_BAR, COLOR_ELO_BG, COLOR_TEXT,
} from '../utils/Constants.js';
import { lerp, clamp } from '../utils/MathUtils.js';

export class EloBar {
  /**
   * @param {number} x  Screen X
   * @param {number} y  Screen Y
   */
  constructor(x, y) {
    this.x = x;
    this.y = y;

    // Animated display ratio within the current 100-ELO segment
    this._displayRatio = 0;
    this._targetRatio  = 0;
  }

  /**
   * @param {number} currentElo  Total ELO (e.g., 1150)
   * @param {number} dt
   */
  update(currentElo, dt) {
    // Ratio within current 100-ELO band
    const positionInSegment = currentElo % ELO_BAR_SEGMENT;
    this._targetRatio       = positionInSegment / ELO_BAR_SEGMENT;
    const factor            = Math.min(1, HUD_LERP * dt);
    this._displayRatio      = lerp(this._displayRatio, this._targetRatio, factor);
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} currentElo
   */
  render(ctx, currentElo) {
    const w = HUD_BAR_WIDTH;
    const h = HUD_BAR_HEIGHT;
    const x = this.x;
    const y = this.y;

    ctx.save();

    // Label
    ctx.fillStyle    = COLOR_TEXT;
    ctx.font         = 'bold 12px monospace';
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('ELO', x, y + h / 2);

    const barX = x + 36;

    // Background
    ctx.fillStyle = COLOR_ELO_BG;
    ctx.fillRect(barX, y, w, h);

    // Filled portion
    const fillW = w * this._displayRatio;
    ctx.fillStyle = COLOR_ELO_BAR;
    ctx.fillRect(barX, y, fillW, h);

    // Shine
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(barX, y, fillW, h / 2);

    // Segment tick marks every 25% of 100-ELO
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth   = 1;
    for (let i = 1; i < 4; i++) {
      const tickX = barX + (w * i) / 4;
      ctx.beginPath();
      ctx.moveTo(tickX, y);
      ctx.lineTo(tickX, y + h);
      ctx.stroke();
    }

    // Border
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.lineWidth   = 1.5;
    ctx.strokeRect(barX, y, w, h);

    // Numeric ELO
    ctx.fillStyle    = COLOR_TEXT;
    ctx.font         = '11px monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${currentElo}`, barX + w / 2, y + h / 2);

    ctx.restore();
  }
}
