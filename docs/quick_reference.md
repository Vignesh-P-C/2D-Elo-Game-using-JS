# Quick Reference: Exact Changes per File

## File 1: Constants.js
**Location**: In the constants file, between SHIELDER section and BOSS section

**Add these 61 lines:**
```javascript
// --- Archer ---
export const ARCHER_SHOOT_RANGE        = 280;
export const ARCHER_RETREAT_RANGE      = 120;
export const ARCHER_PROJECTILE_SPEED   = 420;
export const ARCHER_PROJECTILE_DAMAGE  = 18;
export const ARCHER_ATTACK_COOLDOWN    = 2.8;
export const ARCHER_HP_MULTIPLIER      = 0.8;
export const ARCHER_SPEED_MULTIPLIER   = 0.85;
export const COLOR_ARCHER              = '#FFB347';
export const COLOR_ARCHER_OUTLINE      = '#CC7700';

// ... (see CONSTANTS_ADDITIONS.js for complete list)
```

✅ **Use**: Copy entire `CONSTANTS_ADDITIONS.js` content into your Constants.js

---

## File 2: Mob.js
**Status**: COMPLETE REPLACEMENT

❌ **Don't edit** - Replace the entire file

✅ **Use**: Copy `Mob.js` to `src/entities/Mob.js`

**What changed**:
- Line 1-50: Imports expanded for new constants
- Line 53-55: Added `static _nextId = 0` and ID assignment in constructor
- Line 81-110: Constructor extended for new types (dimensions, stat multipliers)
- Line 281-357: Type-specific AI methods added
- Line 362-409: New type-specific attack methods
- Line 440-550: Type-specific rendering overlays added

---

## File 3: CollisionSystem.js
**Location**: In your existing CollisionSystem.js

### Change 1: Constructor signature (Line ~13)
**Find:**
```javascript
constructor({ player, mobs, boss, orbs, coins, platforms, ground, worldWidth, worldHeight, onEloGain, onSpawnOrb, onHitEvent, onCoinCollected })
```

**Replace with:**
```javascript
constructor({ player, mobs, boss, orbs, coins, projectiles, platforms, ground, worldWidth, worldHeight, onEloGain, onSpawnOrb, onHitEvent, onCoinCollected })
```

### Change 2: Add storage (Line ~18)
**After:**
```javascript
this.coins          = coins      || [];
```

**Add:**
```javascript
this.projectiles    = projectiles || [];
```

### Change 3: Call in run() (Line ~30)
**Find:**
```javascript
this._resolveAttacks();
this._resolveOrbPickups();
```

**Replace with:**
```javascript
this._resolveAttacks();
this._resolveProjectileHits();
this._resolveOrbPickups();
```

### Change 4: Add new method (After `_resolveAttacks()`)
```javascript
_resolveProjectileHits() {
    if (!this.player.alive) return;
    for (const proj of this.projectiles) {
      if (!proj.active || proj.owner !== 'mob') continue;
      if (aabbOverlap(proj.bounds, this.player.bounds)) {
        this.player.takeHit(proj.damage, proj.x);
        proj.hit();
        this.onHitEvent({ type: 'playerHit', isBoss: false });
      }
    }
}
```

✅ **Or use**: Copy entire `CollisionSystem.js`

---

## File 4: LevelManager.js
**Status**: COMPLETE REPLACEMENT (has significant structural changes)

❌ **Don't edit piece by piece** - Replace the entire file

✅ **Use**: Copy `LevelManager.js` to `src/game/LevelManager.js`

**Key additions**:
- Line 33: `this.projectiles = [];`
- Line 60: `spawnProjectile(opts)` method
- Line 65-67: Projectile update in `update()` method
- Line 105-140: New `_spawnMobs()` logic with progressive type selection
- Line 201-225: New `_wireMobCallbacks()` method
- Line 243-245: Call to `_wireMobCallbacks()` in `_buildLevel()`

---

## File 5: Game.js
**Location**: In your existing Game.js file

### Change 1: Add to _buildCollisionSystem() (Line ~61)
**Find:**
```javascript
this.collision = new CollisionSystem({
  player:          this.player,
  mobs:            this.levelManager.mobs,
  boss:            this.levelManager.boss,
  orbs:            this.levelManager.orbs,
  coins:           this.levelManager.coins,
  platforms:       this.levelManager.platforms,
```

**Add after `coins` line:**
```javascript
  projectiles:     this.levelManager.projectiles,
```

### Change 2: Add to _syncCollisionSystem() (Line ~95)
**Find:**
```javascript
this.collision.coins      = this.levelManager.coins;
this.collision.platforms  = this.levelManager.platforms;
```

**Replace with:**
```javascript
this.collision.coins       = this.levelManager.coins;
this.collision.projectiles = this.levelManager.projectiles;
this.collision.platforms   = this.levelManager.platforms;
```

### Change 3: Add rendering in _render() (Line ~180)
**Find:**
```javascript
    for (const orb  of this.levelManager.orbs)  orb.render(ctx);
    for (const coin of this.levelManager.coins)  coin.render(ctx);
    for (const mob  of this.levelManager.mobs)   mob.render(ctx);
```

**Replace with:**
```javascript
    for (const orb  of this.levelManager.orbs)        orb.render(ctx);
    for (const coin of this.levelManager.coins)       coin.render(ctx);
    for (const proj of this.levelManager.projectiles) proj.render(ctx);
    for (const mob  of this.levelManager.mobs)        mob.render(ctx);
```

✅ **Or use**: Copy entire `Game.js`

---

## Summary of File Actions

| File | Action | Method |
|------|--------|--------|
| Constants.js | Add 61 lines | Copy from `CONSTANTS_ADDITIONS.js` |
| Mob.js | Replace entire file | Use provided `Mob.js` |
| CollisionSystem.js | 4 targeted changes | Edit inline OR use provided file |
| LevelManager.js | Replace entire file | Use provided `LevelManager.js` |
| Game.js | 3 targeted changes | Edit inline OR use provided file |

---

## No Changes Needed

✅ Player.js - Uses existing attack and hit system
✅ Boss.js - Works with new enemies automatically
✅ Projectile.js - Already has full Projectile class
✅ Camera.js - No changes needed
✅ InputManager.js - No changes needed
✅ HUD.js - No changes needed
✅ All other files unchanged

---

## Verification

After integration, verify:

1. **No import errors** - All 5 new types should import without issues
2. **Constants compile** - Game loads without constant errors
3. **Mob.js compiles** - No syntax errors in new AI methods
4. **Level 5+** - See archers spawn
5. **Projectiles render** - See golden energy balls flying at player
6. **Healer visual** - Green pulse ring appears every 2 seconds
7. **Summoner works** - New mobs spawn when summoner casts
8. **Boss gate** - Boss doesn't spawn until summoner is dead

---

**Ready to implement? Start with Constants.js, then work through the other files in order!**