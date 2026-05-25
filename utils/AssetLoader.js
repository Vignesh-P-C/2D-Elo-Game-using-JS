// ============================================================
// AssetLoader.js — Structured for sprite + audio support.
// Images are cached by URL; audio is managed by AudioManager.
// ============================================================

import { AudioManager } from './AudioManager.js';  // adjust path if needed

// -------------------------------------------------------
// Image loading
// -------------------------------------------------------

// Internal cache: Map<string, HTMLImageElement>
const cache = new Map();

/**
 * Load and cache a single image by URL.
 * Returns a Promise that resolves with the HTMLImageElement
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
 */
export function loadAll(manifest) {
  const entries = Object.entries(manifest);
  return Promise.all(
    entries.map(([key, url]) => loadImage(url).then(img => [key, img]))
  ).then(pairs => Object.fromEntries(pairs));
}

/**
 * Retrieve a previously cached image by URL (synchronous).
 */
export function getImage(url) {
  return cache.get(url);
}

// -------------------------------------------------------
// Audio
// -------------------------------------------------------

/**
 * Shared AudioManager instance — created lazily on first user gesture.
 * Import and use this wherever audio needs to be triggered.
 *
 *   import { audioManager } from '../utils/AssetLoader.js';
 *   audioManager.playMusic('boss');
 */
export const audioManager = new AudioManager();

// -------------------------------------------------------
// Preload — images + audio in one shot
// -------------------------------------------------------

/**
 * Preload all game assets.
 *
 * NOTE: AudioManager.init() requires a prior user gesture (browser autoplay
 * policy). Call this from your start-button click handler, not on page load.
 *
 * Returns a Promise that resolves when images are loaded.
 * Audio buffers are decoded in parallel and silently skipped if files are
 * missing (placeholder build).
 */
export async function preload() {
  // Initialise audio (decodes music tracks in the background)
  await audioManager.init();

  // No image assets yet — add entries here when sprites are ready:
  // return loadAll({
  //   player: 'assets/player_sheet.png',
  //   mob:    'assets/mob_sheet.png',
  //   boss:   'assets/boss_sheet.png',
  // });

  return Promise.resolve({});
}