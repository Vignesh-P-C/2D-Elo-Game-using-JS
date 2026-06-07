// ============================================================
// Shop.js — In-game shop overlay. Opened from the settings menu.
// Items rotate per round; purchased effects persist across rounds
// and boss fights. Close with the button or ESC.
// ============================================================

import { SHOP_CATALOG } from '../utils/Constants.js';

export class Shop {
  /** @param {HTMLCanvasElement} canvas */
  constructor(canvas) {
    this.canvas = canvas;

    this._visible      = false;
    this._items        = [];          // Deep-copied items for the current round
    this._coins        = 0;
    this._permanentIds = new Set();   // Tracks one-time purchases (e.g. golden sword)

    // Set by Game.js
    this.onClose    = null;   // () => void
    this.onPurchase = null;   // (item) => void  — called only after coin check passes

    // Hit-test rects rebuilt each render frame
    this._closeBtn = null;
    this._itemBtns = [];

    // Purchase feedback toast
    this._feedbackText  = '';
    this._feedbackTimer = 0;

    this._boundClick   = (e) => this._handleClick(e);
    this._boundKeydown = (e) => { if (e.key === 'Escape' && this._visible) this.close(); };
    this.canvas.addEventListener('click',   this._boundClick);
    window.addEventListener('keydown', this._boundKeydown);
  }

  // -------------------------------------------------------
  // Public API
  // -------------------------------------------------------

  /**
   * Open the shop for the given round.
   * @param {number} round          Current level/round number (1-based)
   * @param {number} coins          Current player coin count
   * @param {Set}    permanentIds   IDs of already-purchased one-time items
   */
  open(round, coins, permanentIds = new Set()) {
    this._coins        = coins;
    this._permanentIds = permanentIds;
    this._items        = this._buildItems(round);
    this._visible      = true;
    this._feedbackText  = '';
    this._feedbackTimer = 0;
  }

  /** Sync coin count after a purchase (called by Game). */
  updateCoins(coins) { this._coins = coins; }

  close() {
    this._visible = false;
    if (this.onClose) this.onClose();
  }

  destroy() {
    this.canvas.removeEventListener('click',   this._boundClick);
    window.removeEventListener('keydown', this._boundKeydown);
  }

  // -------------------------------------------------------
  // Update / Render  (called from Game loop while open)
  // -------------------------------------------------------

  /** @param {number} dt  Delta time in seconds */
  update(dt) {
    if (this._feedbackTimer > 0) {
      this._feedbackTimer = Math.max(0, this._feedbackTimer - dt);
    }
  }

  /** @param {CanvasRenderingContext2D} ctx */
  render(ctx) {
    if (!this._visible) return;

    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const cx = cw / 2;
    const cy = ch / 2;

    const popW = 580;
    const popH = 430;
    const popX = cx - popW / 2;
    const popY = cy - popH / 2;

    ctx.save();

    // ── Backdrop ──────────────────────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.68)';
    ctx.fillRect(0, 0, cw, ch);

    // ── Panel ─────────────────────────────────────────────
    ctx.fillStyle = 'rgba(15,15,35,0.97)';
    this._roundRect(ctx, popX, popY, popW, popH, 14);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,215,0,0.35)';
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    // ── Title ─────────────────────────────────────────────
    ctx.fillStyle    = '#FFD700';
    ctx.font         = 'bold 22px monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('🛒  SHOP', cx, popY + 18);

    // ── Coin counter (top-right) ───────────────────────────
    ctx.font      = 'bold 15px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`🪙 ${this._coins}`, popX + popW - 20, popY + 22);

    // ── Divider ────────────────────────────────────────────
    ctx.strokeStyle = 'rgba(255,215,0,0.12)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(popX + 20, popY + 58);
    ctx.lineTo(popX + popW - 20, popY + 58);
    ctx.stroke();

    // ── Item cards ────────────────────────────────────────
    this._itemBtns = [];
    const cardW = Math.floor((popW - 60) / 3);   // ~173 px each
    const cardH = 260;
    const cardY = popY + 68;

    for (let i = 0; i < this._items.length; i++) {
      const cardX = popX + 20 + i * (cardW + 10);
      this._renderCard(ctx, this._items[i], cardX, cardY, cardW, cardH);
    }

    // ── Purchase feedback toast ────────────────────────────
    if (this._feedbackTimer > 0) {
      const alpha = Math.min(1, this._feedbackTimer / 0.4);
      ctx.globalAlpha  = alpha;
      ctx.fillStyle    = '#55DD88';
      ctx.font         = 'bold 13px monospace';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this._feedbackText, cx, popY + popH - 54);
      ctx.globalAlpha = 1;
    }

    // ── Close button ──────────────────────────────────────
    const closeBtnW = 140;
    const closeBtnH = 36;
    const closeBtnX = cx  - closeBtnW / 2;
    const closeBtnY = popY + popH - 42;

    ctx.fillStyle   = 'rgba(255,255,255,0.07)';
    this._roundRect(ctx, closeBtnX, closeBtnY, closeBtnW, closeBtnH, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.lineWidth   = 1;
    ctx.stroke();
    ctx.fillStyle    = 'rgba(255,255,255,0.80)';
    ctx.font         = 'bold 13px monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Close  [ESC]', closeBtnX + closeBtnW / 2, closeBtnY + closeBtnH / 2);
    this._closeBtn = { x: closeBtnX, y: closeBtnY, w: closeBtnW, h: closeBtnH };

    ctx.restore();
  }

  // -------------------------------------------------------
  // Private — card rendering
  // -------------------------------------------------------

  /**
   * Render a single item card and register its buy button if affordable.
   */
  _renderCard(ctx, item, x, y, w, h) {
    const isPurchased = !item.repeatable && this._permanentIds.has(item.id);
    const canAfford   = this._coins >= item.cost;

    // ── Card background ───────────────────────────────────
    ctx.fillStyle = isPurchased
      ? 'rgba(85,200,120,0.10)'
      : canAfford
        ? 'rgba(255,215,0,0.05)'
        : 'rgba(255,255,255,0.03)';
    this._roundRect(ctx, x, y, w, h, 10);
    ctx.fill();

    ctx.strokeStyle = isPurchased
      ? 'rgba(85,220,120,0.45)'
      : canAfford
        ? 'rgba(255,215,0,0.28)'
        : 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // ── Icon ──────────────────────────────────────────────
    ctx.globalAlpha  = isPurchased ? 0.4 : 1;
    ctx.font         = '46px serif';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.icon, x + w / 2, y + 56);
    ctx.globalAlpha = 1;

    // ── Label ─────────────────────────────────────────────
    ctx.fillStyle    = isPurchased ? 'rgba(255,255,255,0.40)' : '#FFFFFF';
    ctx.font         = 'bold 13px monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(item.label, x + w / 2, y + 96);

    // ── Description (word-wrapped) ────────────────────────
    ctx.fillStyle = 'rgba(255,255,255,0.42)';
    ctx.font      = '11px monospace';
    this._wrapText(ctx, item.desc, x + w / 2, y + 116, w - 18, 15);

    // ── Buy / Purchased button ────────────────────────────
    const btnW = w - 24;
    const btnH = 36;
    const btnX = x + 12;
    const btnY = y + h - 48;

    if (isPurchased) {
      ctx.fillStyle = 'rgba(85,220,120,0.15)';
      this._roundRect(ctx, btnX, btnY, btnW, btnH, 7);
      ctx.fill();
      ctx.fillStyle    = 'rgba(85,220,120,0.85)';
      ctx.font         = 'bold 12px monospace';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✓  Purchased', btnX + btnW / 2, btnY + btnH / 2);
    } else {
      ctx.fillStyle = canAfford
        ? 'rgba(255,215,0,0.18)'
        : 'rgba(255,255,255,0.04)';
      this._roundRect(ctx, btnX, btnY, btnW, btnH, 7);
      ctx.fill();
      ctx.strokeStyle = canAfford
        ? 'rgba(255,215,0,0.55)'
        : 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle    = canAfford ? '#FFD700' : 'rgba(255,255,255,0.22)';
      ctx.font         = 'bold 13px monospace';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`🪙 ${item.cost}  —  Buy`, btnX + btnW / 2, btnY + btnH / 2);

      // Only register hit-test rect for affordable items
      if (canAfford) {
        this._itemBtns.push({ x: btnX, y: btnY, w: btnW, h: btnH, item });
      }
    }
  }

  // -------------------------------------------------------
  // Private — item building
  // -------------------------------------------------------

  _buildItems(round) {
    // Clamp to last defined catalog entry for high rounds
    const idx     = Math.min(round - 1, SHOP_CATALOG.length - 1);
    const catalog = SHOP_CATALOG[idx];
    // Deep-copy so we never mutate catalog entries
    return catalog.map(entry => ({ ...entry }));
  }

  // -------------------------------------------------------
  // Private — click handling
  // -------------------------------------------------------

  _handleClick(e) {
    if (!this._visible) return;

    const rect = this.canvas.getBoundingClientRect();
    const mx   = e.clientX - rect.left;
    const my   = e.clientY - rect.top;

    // Close button
    if (this._closeBtn) {
      const b = this._closeBtn;
      if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
        this.close();
        return;
      }
    }

    // Item buy buttons (only populated for affordable, non-purchased items)
    for (const btn of this._itemBtns) {
      if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
        if (this._coins >= btn.item.cost && this.onPurchase) {
          this.onPurchase(btn.item);
          this._feedbackText  = `✓  ${btn.item.label} purchased!`;
          this._feedbackTimer = 1.8;
        }
        return;
      }
    }
  }

  // -------------------------------------------------------
  // Helpers
  // -------------------------------------------------------

  /** Simple word-wrap centred text renderer. */
  _wrapText(ctx, text, cx, y, maxWidth, lineH) {
    const words = text.split(' ');
    let line    = '';
    let lineY   = y;
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (ctx.measureText(candidate).width > maxWidth && line) {
        ctx.fillText(line, cx, lineY);
        line  = word;
        lineY += lineH;
      } else {
        line = candidate;
      }
    }
    if (line) ctx.fillText(line, cx, lineY);
  }

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y,     x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h,     x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y,         x + r, y);
    ctx.closePath();
  }
}