// ============================================================
// Camera.js — Horizontal-follow camera with lerp, clamping, and screen shake.
// ============================================================

import { CAMERA_LERP, SCREEN_SHAKE_DURATION, SCREEN_SHAKE_AMPLITUDE, SCREEN_SHAKE_DECAY } from '../utils/Constants.js';
import { clamp, lerp } from '../utils/MathUtils.js';

export class Camera {
  /**
   * @param {number} canvasWidth
   * @param {number} canvasHeight
   */
  constructor(canvasWidth, canvasHeight) {
    this.x = 0;         // World X of left edge of the camera view
    this.y = 0;         // Y is fixed (no vertical scroll)
    this.width  = canvasWidth;
    this.height = canvasHeight;
    this.worldWidth = canvasWidth; // Updated each level

    // Screen shake
    this.shakeX = 0;
    this.shakeY = 0;
    this.shakeTimer = 0;
    this.shakeIntensity = 0;
  }

  /**
   * Called after canvas resize.
   */
  resize(canvasWidth, canvasHeight) {
    this.width  = canvasWidth;
    this.height = canvasHeight;
  }

  /**
   * Set world bounds for this level.
   * @param {number} worldWidth
   */
  setWorldWidth(worldWidth) {
    this.worldWidth = worldWidth;
  }

  /**
   * Snap camera immediately to target (use at level start).
   * @param {object} target  Entity with x, y, width, height
   */
  snapTo(target) {
    this.x = this._targetX(target);
  }

  /**
   * Trigger screen shake effect.
   * @param {number} intensity  Multiplier for shake amplitude (default 1)
   */
  shake(intensity = 1) {
    this.shakeTimer = SCREEN_SHAKE_DURATION;
    this.shakeIntensity = intensity;
  }

  /**
   * Smoothly track the target entity.
   * @param {number} dt
   * @param {object} target  Entity with x, y, width, height
   */
  update(dt, target) {
    const targetX = this._targetX(target);
    // Lerp factor: CAMERA_LERP * dt gives frame-rate independent smoothing
    const factor  = Math.min(1, CAMERA_LERP * dt);
    this.x = lerp(this.x, targetX, factor);
    this.x = clamp(this.x, 0, Math.max(0, this.worldWidth - this.width));

    // Update screen shake
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      const progress = this.shakeTimer / SCREEN_SHAKE_DURATION;
      const amplitude = SCREEN_SHAKE_AMPLITUDE * this.shakeIntensity * progress;
      
      // Random shake offset with decay
      this.shakeX = (Math.random() - 0.5) * 2 * amplitude;
      this.shakeY = (Math.random() - 0.5) * 2 * amplitude;
      
      // Apply decay
      this.shakeX *= SCREEN_SHAKE_DECAY;
      this.shakeY *= SCREEN_SHAKE_DECAY;
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
      this.shakeIntensity = 0;
    }
  }

  /**
   * Compute the target camera X to center the entity horizontally.
   */
  _targetX(target) {
    const centerX = target.x + target.width / 2;
    return clamp(
      centerX - this.width / 2,
      0,
      Math.max(0, this.worldWidth - this.width)
    );
  }

  /**
   * Apply camera transform to ctx. Call before rendering world-space objects.
   * @param {CanvasRenderingContext2D} ctx
   */
  apply(ctx) {
    ctx.translate(
      -Math.round(this.x) + this.shakeX,
      this.shakeY
    );
  }

  /**
   * Reset ctx transform. Call before rendering screen-space UI.
   * @param {CanvasRenderingContext2D} ctx
   */
  reset(ctx) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
}
