// ============================================================
// MathUtils.js — Pure math helpers. No game state, no imports.
// ============================================================

/**
 * Linear interpolation between a and b by factor t (0–1).
 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Clamp value between min and max.
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Return true if two AABB rectangles overlap.
 * Each rect: { x, y, width, height }
 */
export function aabbOverlap(a, b) {
  return (
    a.x < b.x + b.width  &&
    a.x + a.width  > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * Compute overlap depth on each axis for AABB pair.
 * Returns { dx, dy } — signed values indicating minimum push direction.
 * Useful for resolving physics overlap.
 */
export function aabbResolve(a, b) {
  const aCenterX = a.x + a.width  / 2;
  const aCenterY = a.y + a.height / 2;
  const bCenterX = b.x + b.width  / 2;
  const bCenterY = b.y + b.height / 2;

  const overlapX = (a.width  + b.width)  / 2 - Math.abs(aCenterX - bCenterX);
  const overlapY = (a.height + b.height) / 2 - Math.abs(aCenterY - bCenterY);

  const signX = aCenterX < bCenterX ? -1 : 1;
  const signY = aCenterY < bCenterY ? -1 : 1;

  return { overlapX: overlapX * signX, overlapY: overlapY * signY };
}

/**
 * Euclidean distance between two points.
 */
export function distance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Return a random float in [min, max).
 */
export function randFloat(min, max) {
  return min + Math.random() * (max - min);
}

/**
 * Return a random integer in [min, max] inclusive.
 */
export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Sign of a number: -1, 0, or 1.
 */
export function sign(n) {
  return n < 0 ? -1 : n > 0 ? 1 : 0;
}

/**
 * Smooth-step lerp for animations (ease-in-out curve).
 */
export function smoothStep(a, b, t) {
  const s = t * t * (3 - 2 * t);
  return lerp(a, b, s);
}
