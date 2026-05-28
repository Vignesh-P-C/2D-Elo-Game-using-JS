// ============================================================
// Coin.js — Collectible coin entity. Renders as 🪙 emoji,
// floats with a sine wave, collected by player on touch.
// ============================================================

export class Coin {
  /**
   * @param {number} x  World-space X (centre)
   * @param {number} y  World-space Y (base position)
   */
  constructor(x, y) {
    this.x       = x;
    this.y       = y;
    this.width   = 28;
    this.height  = 28;
    this.active  = true;   // false once collected

    // Float animation
    this._time        = Math.random() * Math.PI * 2; // random phase offset
    this._floatAmp    = 10;   // px amplitude
    this._floatSpeed  = 2.2;  // Hz

    // Collection pop animation
    this._collecting     = false;
    this._collectTimer   = 0;
    this._collectDuration = 0.35;
    this._collectScale   = 1;
    this._collectAlpha   = 1;
  }

  // -------------------------------------------------------
  // Update
  // -------------------------------------------------------

  /** @param {number} dt */
  update(dt) {
    if (!this.active && !this._collecting) return;

    if (this._collecting) {
      this._collectTimer += dt;
      const p = this._collectTimer / this._collectDuration;
      this._collectScale = 1 + p * 0.8;   // grow
      this._collectAlpha = 1 - p;          // fade
      if (this._collectTimer >= this._collectDuration) {
        this.active      = false;
        this._collecting = false;
      }
      return;
    }

    this._time += dt;
  }

  /** Trigger the collection pop animation. */
  collect() {
    if (!this.active || this._collecting) return;
    this._collecting   = true;
    this._collectTimer = 0;
  }

  // -------------------------------------------------------
  // Render
  // -------------------------------------------------------

  /** @param {CanvasRenderingContext2D} ctx */
  render(ctx) {
    if (!this.active && !this._collecting) return;

    const floatY = this.y + Math.sin(this._time * this._floatSpeed * Math.PI * 2) * this._floatAmp;
    const cx     = this.x + this.width / 2;
    const cy     = floatY + this.height / 2;

    ctx.save();
    ctx.globalAlpha = this._collectAlpha;
    ctx.translate(cx, cy);
    ctx.scale(this._collectScale, this._collectScale);

    // Glow
    ctx.shadowColor = 'rgba(255, 210, 50, 0.7)';
    ctx.shadowBlur  = 12;

    ctx.font      = `${this.width}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🪙', 0, 0);

    ctx.restore();
  }

  // -------------------------------------------------------
  // Collision bounds (static, ignores float offset for simplicity)
  // -------------------------------------------------------

  get bounds() {
    const floatY = this.y + Math.sin(this._time * this._floatSpeed * Math.PI * 2) * this._floatAmp;
    return { x: this.x, y: floatY, width: this.width, height: this.height };
  }
}