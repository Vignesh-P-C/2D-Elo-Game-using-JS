// ============================================================
// AudioManager.js — Handles background music for the game.
// Plays one looping track at a time; crossfades between tracks.
//
// Usage:
//   const audio = new AudioManager();
//   await audio.init();           // must call after a user gesture
//   audio.playMusic('normal');    // plays normal level music
//   audio.playMusic('boss');      // crossfades to boss music
//   audio.stopMusic();            // fades out current track
// ============================================================

const FADE_DURATION = 1.0;   // seconds for crossfade
const MUSIC_VOLUME  = 0.5;   // master music volume (0–1)

export class AudioManager {
  constructor() {
    /** @type {AudioContext|null} */
    this._ctx = null;

    /** @type {GainNode|null} — master gain for fading */
    this._masterGain = null;

    /** @type {AudioBufferSourceNode|null} — currently playing source */
    this._currentSource = null;

    /** @type {GainNode|null} — gain node for the current track */
    this._currentGain = null;

    /** @type {string|null} — key of the track currently playing */
    this._currentTrack = null;

    /** @type {Map<string, AudioBuffer>} — decoded audio buffers */
    this._buffers = new Map();

    /** Whether the AudioContext has been unlocked by a user gesture */
    this._unlocked = false;

    // Track definitions — swap in real filenames when ready
    this._tracks = {
      normal: 'assets/audio/music_normal.mp3',
      boss:   'assets/audio/music_boss.mp3',
    };
  }

  // -------------------------------------------------------
  // Init — call once after a user gesture (click / keydown)
  // -------------------------------------------------------

  /**
   * Creates the AudioContext and decodes all music tracks.
   * Must be called after a user interaction to satisfy browser autoplay policy.
   * Safe to call multiple times (no-op after first call).
   */
  async init() {
    if (this._unlocked) return;

    try {
      this._ctx        = new (window.AudioContext || window.webkitAudioContext)();
      this._masterGain = this._ctx.createGain();
      this._masterGain.gain.setValueAtTime(MUSIC_VOLUME, this._ctx.currentTime);
      this._masterGain.connect(this._ctx.destination);

      // Decode all tracks in parallel
      await Promise.all(
        Object.entries(this._tracks).map(([key, url]) => this._loadTrack(key, url))
      );

      this._unlocked = true;
    } catch (err) {
      console.warn('AudioManager: failed to initialise —', err);
    }
  }

  // -------------------------------------------------------
  // Public API
  // -------------------------------------------------------

  /**
   * Play a looping music track. Crossfades from whatever is currently playing.
   * @param {'normal'|'boss'} trackKey
   */
  playMusic(trackKey) {
    if (!this._unlocked || !this._ctx) return;
    if (this._currentTrack === trackKey) return; // already playing

    const buffer = this._buffers.get(trackKey);
    if (!buffer) {
      console.warn(`AudioManager: track "${trackKey}" not loaded`);
      return;
    }

    // Fade out current track
    if (this._currentSource && this._currentGain) {
      this._fadeOut(this._currentGain, this._currentSource, FADE_DURATION);
    }

    // Create new source + gain and fade in
    const gainNode = this._ctx.createGain();
    gainNode.gain.setValueAtTime(0, this._ctx.currentTime);
    gainNode.connect(this._masterGain);

    const source      = this._ctx.createBufferSource();
    source.buffer     = buffer;
    source.loop       = true;
    source.connect(gainNode);
    source.start(0);

    gainNode.gain.linearRampToValueAtTime(1, this._ctx.currentTime + FADE_DURATION);

    this._currentSource = source;
    this._currentGain   = gainNode;
    this._currentTrack  = trackKey;
  }

  /**
   * Fade out and stop whichever track is currently playing.
   */
  stopMusic() {
    if (!this._currentSource || !this._currentGain) return;
    this._fadeOut(this._currentGain, this._currentSource, FADE_DURATION);
    this._currentSource = null;
    this._currentGain   = null;
    this._currentTrack  = null;
  }

  /**
   * Set master music volume (0–1). Applies immediately.
   * @param {number} volume
   */
  setVolume(volume) {
    if (!this._masterGain) return;
    this._masterGain.gain.setValueAtTime(
      Math.max(0, Math.min(1, volume)),
      this._ctx.currentTime
    );
  }

  // -------------------------------------------------------
  // Internal helpers
  // -------------------------------------------------------

  /**
   * Fetch and decode an audio file into an AudioBuffer.
   * @param {string} key
   * @param {string} url
   */
  async _loadTrack(key, url) {
    try {
      const response = await fetch(url);
      const arrayBuf = await response.arrayBuffer();
      const decoded  = await this._ctx.decodeAudioData(arrayBuf);
      this._buffers.set(key, decoded);
    } catch (err) {
      // Placeholder: file doesn't exist yet — silently skip
      console.warn(`AudioManager: could not load "${url}" (placeholder missing) —`, err.message);
    }
  }

  /**
   * Fade a gain node to 0 then stop and disconnect its source.
   * @param {GainNode}              gainNode
   * @param {AudioBufferSourceNode} source
   * @param {number}                duration  seconds
   */
  _fadeOut(gainNode, source, duration) {
    const now = this._ctx.currentTime;
    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
    gainNode.gain.linearRampToValueAtTime(0, now + duration);
    // Stop after fade completes
    try {
      source.stop(now + duration);
    } catch (_) { /* already stopped */ }
  }
}