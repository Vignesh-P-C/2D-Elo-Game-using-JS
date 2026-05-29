// ============================================================
// Camera.js — Horizontal-follow camera with lerp, clamping, and screen shake.
// ============================================================

import { CAMERA_LERP, SCREEN_SHAKE_DURATION, SCREEN_SHAKE_AMPLITUDE, SCREEN_SHAKE_DECAY } from '../utils/Constants.js';
import { clamp, lerp } from '../utils/MathUtils.js';

export class Camera {
  constructor(canvasWidth, canvasHeight) {
    this.x = 0;
    this.y = 0;
    this.width  = canvasWidth;
    this.height = canvasHeight;
    this.worldWidth = canvasWidth;

    this.shakeX = 0;
    this.shakeY = 0;
    this.shakeTimer = 0;
    this.shakeIntensity = 0;
  }

  resize(canvasWidth, canvasHeight) {
    this.width  = canvasWidth;
    this.height = canvasHeight;
  }

  setWorldWidth(worldWidth) {
    this.worldWidth = worldWidth;
  }

  snapTo(target) {
    this.x = this._targetX(target);
  }

  shake(intensity = 1) {
    this.shakeTimer = SCREEN_SHAKE_DURATION;
    this.shakeIntensity = intensity;
  }

  update(dt, target) {
    const targetX = this._targetX(target);
    const factor  = Math.min(1, CAMERA_LERP * dt);
    this.x = lerp(this.x, targetX, factor);
    this.x = clamp(this.x, 0, Math.max(0, this.worldWidth - this.width));

    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      const progress  = this.shakeTimer / SCREEN_SHAKE_DURATION;
      const amplitude = SCREEN_SHAKE_AMPLITUDE * this.shakeIntensity * progress;
      this.shakeX = (Math.random() - 0.5) * 2 * amplitude * SCREEN_SHAKE_DECAY;
      this.shakeY = (Math.random() - 0.5) * 2 * amplitude * SCREEN_SHAKE_DECAY;
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
      this.shakeIntensity = 0;
    }
  }

  _targetX(target) {
    const centerX = target.x + target.width / 2;
    return clamp(
      centerX - this.width / 2,
      0,
      Math.max(0, this.worldWidth - this.width)
    );
  }

  apply(ctx) {
    ctx.translate(
      -Math.round(this.x) + this.shakeX,
      this.shakeY
    );
  }

  reset(ctx) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  /**
   * Returns the screen-space translation applied by apply().
   * Used by HUD to convert world positions to screen positions (e.g. damage numbers).
   * @returns {{ x: number, y: number }}
   */
  getOffset() {
    return {
      x: -Math.round(this.x) + this.shakeX,
      y: this.shakeY,
    };
  }
}