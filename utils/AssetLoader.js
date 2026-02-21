// ============================================================
// AssetLoader.js — Structured for future sprite support.
// Currently resolves immediately; no assets needed for placeholder art.
// ============================================================

// Internal cache: Map<string, HTMLImageElement>
const cache = new Map();

/**
 * Load and cache a single image by URL.
 * Returns a Promise that resolves with the HTMLImageElement.
 *
 * Example usage (when sprites are added):
 *   const playerSprite = await loadImage('assets/player.png');
 */
export function loadImage(url) {
  if (cache.has(url)) {
    return Promise.resolve(cache.get(url));
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => { cache.set(url, img); resolve(img); };
    img.onerror = () => reject(new Error(`AssetLoader: failed to load "${url}"`));
    img.src = url;
  });
}

/**
 * Load multiple images in parallel.
 * Pass an object map of { key: url } and receive { key: HTMLImageElement }.
 *
 * Example:
 *   const assets = await loadAll({ player: 'assets/player.png', mob: 'assets/mob.png' });
 *   assets.player // HTMLImageElement
 */
export function loadAll(manifest) {
  const entries = Object.entries(manifest);
  return Promise.all(
    entries.map(([key, url]) => loadImage(url).then(img => [key, img]))
  ).then(pairs => Object.fromEntries(pairs));
}

/**
 * Retrieve a previously cached image by URL (synchronous).
 * Returns undefined if not yet loaded.
 */
export function getImage(url) {
  return cache.get(url);
}

/**
 * Preload all game assets. Currently returns immediately (no sprites yet).
 * When sprites are added, populate the manifest and call loadAll().
 *
 * Example of future use:
 *   return loadAll({
 *     player: 'assets/player_sheet.png',
 *     mob:    'assets/mob_sheet.png',
 *     boss:   'assets/boss_sheet.png',
 *   });
 */
export function preload() {
  // No assets to load for placeholder art build.
  return Promise.resolve({});
}
