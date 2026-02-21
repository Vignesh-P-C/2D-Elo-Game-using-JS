// ============================================================
// InputManager.js — Keyboard state tracker.
// Tracks which keys are currently held and which were
// just pressed this frame (for single-fire actions like attack/jump).
// ============================================================

export class InputManager {
  constructor() {
    // Current held state
    this._held = new Set();
    // Keys pressed since last update() call
    this._justPressed = new Set();
    // Pending from event handlers (cleared each frame)
    this._pendingPress = new Set();

    // Mouse button tracking
    this._leftMousePressed = false;
    this._leftMouseJustPressed = false;
    this._rightMousePressed = false;
    this._rightMouseJustPressed = false;

    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp   = this._onKeyUp.bind(this);
    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);
    this._onContextMenu = this._onContextMenu.bind(this);

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup',   this._onKeyUp);
    window.addEventListener('mousedown', this._onMouseDown);
    window.addEventListener('mouseup', this._onMouseUp);
    window.addEventListener('contextmenu', this._onContextMenu);
  }

  _onKeyDown(e) {
    if (!this._held.has(e.code)) {
      this._pendingPress.add(e.code);
    }
    this._held.add(e.code);
    // Prevent arrow keys from scrolling the page
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
      e.preventDefault();
    }
  }

  _onKeyUp(e) {
    this._held.delete(e.code);
  }

  _onMouseDown(e) {
    if (e.button === 0) { // Left mouse button
      this._leftMouseJustPressed = true;
      e.preventDefault();
    } else if (e.button === 2) { // Right mouse button
      this._rightMouseJustPressed = true;
      e.preventDefault();
    }
  }

  _onMouseUp(e) {
    if (e.button === 0) {
      this._leftMousePressed = false;
    } else if (e.button === 2) {
      this._rightMousePressed = false;
    }
  }

  _onContextMenu(e) {
    // Prevent context menu on right-click
    e.preventDefault();
  }

  /**
   * Called once per game loop tick, before any entity updates.
   * Flushes the just-pressed buffer.
   */
  update() {
    this._justPressed = new Set(this._pendingPress);
    this._pendingPress.clear();
  }

  /** True while the key is held down. */
  isHeld(code) {
    return this._held.has(code);
  }

  /** True only on the frame the key was first pressed. */
  isJustPressed(code) {
    return this._justPressed.has(code);
  }

  // --- Semantic helpers ---

  get left()   { return this.isHeld('ArrowLeft')  || this.isHeld('KeyA'); }
  get right()  { return this.isHeld('ArrowRight') || this.isHeld('KeyD'); }
  get jump()   { return this.isJustPressed('ArrowUp') || this.isJustPressed('KeyW') || this.isJustPressed('Space'); }
  get attack() {
    const result = this._leftMouseJustPressed;
    this._leftMouseJustPressed = false; // Consume the input
    return result;
  }
  get dash() {
    const result = this._rightMouseJustPressed;
    this._rightMouseJustPressed = false; // Consume the input
    return result;
  }

  /**
   * Remove event listeners — call when tearing down the game.
   */
  destroy() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup',   this._onKeyUp);
    window.removeEventListener('mousedown', this._onMouseDown);
    window.removeEventListener('mouseup', this._onMouseUp);
    window.removeEventListener('contextmenu', this._onContextMenu);
  }
}