# Implementation Guide: 5 New Enemy Types

## Overview
Added 5 new enemy types to your 2D combat game, introducing at progressive levels:
- **Archer** (Level 5): Ranged enemy that fires projectiles
- **Leaper** (Level 6): Agile enemy that pounces at player
- **Berserker** (Level 7): Melee fighter with enrage mechanic
- **Healer** (Level 8): Support enemy that heals allies
- **Summoner** (Level 9): Enemy that spawns additional mobs

---

## Files to Update

### 1. **Constants.js**
**Action**: Add new constants

Copy all content from `CONSTANTS_ADDITIONS.js` and insert into your `Constants.js` file:
- After the `SHIELDER` constants section
- Before the `BOSS` constants section

**What it adds**:
- 61 new constants defining stats, ranges, colors, and timings for all 5 new types

---

### 2. **Mob.js** (COMPLETE REPLACEMENT)
**Action**: Replace entire file with new `Mob.js`

**Key changes**:
- Added static ID counter for unique mob identification (used by Summoner)
- Extended constructor to handle 5 new types with appropriate dimensions and stat multipliers
- Added 5 type-specific AI methods:
  - `_archerAI()`: Hold distance, fire projectiles when ready
  - `_leaperAI()`: Pounce at player from range
  - `_berserkerAI()`: Chase and enrage, triggering flurry attacks
  - `_healerAI()`: Flee from player while healing nearby mobs
  - `_summonerAI()`: Summon allies and fight back when needed
- Modified `_runAI()` to dispatch to type-specific AI methods
- Extended `takeHit()` to handle type-specific mechanics (damage reduction, state resets)
- Added visual rendering for each type with distinctive overlays:
  - Archer: Bow visual
  - Leaper: Motion trail during leap
  - Berserker: Red enrage aura and flash
  - Healer: Green cross symbol and heal pulse ring
  - Summoner: Spinning star and casting portal

**Callbacks added**:
- `onFireProjectile(x, y, vx, vy, damage)`: Archer fires projectiles
- `onSummonMob(x, y, type)`: Summoner creates new mobs
- `mobsRef`: Reference to mobs array (used by Healer and Summoner)

---

### 3. **CollisionSystem.js**
**Action**: Add projectiles parameter and collision handling

**Changes**:
1. Add `projectiles` parameter to constructor
2. Store `this.projectiles = projectiles || []`
3. Add new method `_resolveProjectileHits()` that:
   - Checks projectiles fired by mobs against player bounds
   - Applies damage on hit and deactivates projectile
   - Triggers hit event for screen shake
4. Call `_resolveProjectileHits()` in `run()` after `_resolveAttacks()`

---

### 4. **LevelManager.js**
**Action**: Replace entire file with new `LevelManager.js`

**Key changes**:
- Added `projectiles = []` array to store archer projectiles
- Added `spawnProjectile(opts)` method to add projectiles
- Extended `_spawnMobs()` with progressive enemy type selection:
  - Levels 5+: Archer introduced
  - Levels 6+: Leaper introduced
  - Levels 7+: Berserker introduced
  - Levels 8+: Healer introduced
  - Levels 9+: Summoner introduced
- Added `_wireMobCallbacks()` method that:
  - Wires `onFireProjectile` for Archers
  - Passes `mobsRef` to Healers and Summoners
  - Wires `onSummonMob` callback for Summoners
  - Tags summoned mobs with `summonedBy = summoner.id`
- Modified `update()` to update and filter projectiles
- **Boss spawn gate**: Boss spawns when `mobs.length === 0`, which naturally gates on Summoner death + all summons cleared

---

### 5. **Game.js**
**Action**: Add projectiles to collision system and rendering

**Changes**:
1. In `_buildCollisionSystem()`: Add `projectiles: this.levelManager.projectiles`
2. In `_syncCollisionSystem()`: Add `this.collision.projectiles = this.levelManager.projectiles`
3. In `_render()`: Add projectile rendering:
   ```javascript
   for (const proj of this.levelManager.projectiles) proj.render(ctx);
   ```
   (Place this before mob rendering so projectiles appear behind mobs)

---

## Integration Steps

1. **Add Constants**
   - Open `Constants.js`
   - Scroll to the Shielder constants section
   - Add all content from `CONSTANTS_ADDITIONS.js` before the Boss section

2. **Replace Mob.js**
   - Delete your existing `Mob.js`
   - Copy the new `Mob.js` file to `src/entities/Mob.js`

3. **Update CollisionSystem.js**
   - Open your `CollisionSystem.js`
   - In constructor, add `projectiles` parameter and storage
   - Add the `_resolveProjectileHits()` method
   - Call it in `run()`

4. **Replace LevelManager.js**
   - Delete your existing `LevelManager.js`
   - Copy the new `LevelManager.js` file to `src/game/LevelManager.js`

5. **Update Game.js**
   - Open your `Game.js`
   - In `_buildCollisionSystem()`: add `projectiles` parameter
   - In `_syncCollisionSystem()`: add `projectiles` sync
   - In `_render()`: add projectile rendering (after orbs, before mobs)

---

## Enemy Mechanics Summary

### Archer (Level 5+)
- **Stats**: 80% HP, 85% speed
- **Behavior**: 
  - Shoots from 280px range
  - Retreats if player gets within 120px
  - Charged projectile with 2.8s cooldown
- **Damage**: Projectile deals 18 damage
- **Visual**: Orange-yellow body with bow icon

### Leaper (Level 6+)
- **Stats**: 70% HP, 130% speed
- **Behavior**:
  - Pounces at player from up to 200px away
  - Leap is the attack (deals 1.5x normal damage)
  - 3.0s cooldown between leaps
- **Visual**: Teal-green with motion trail during leap

### Berserker (Level 7+)
- **Stats**: 150% HP, 90% speed (140% when enraged)
- **Behavior**:
  - Enrages at 50% HP threshold (permanent)
  - When enraged: triggers flurry attacks
  - Flurry: 3 rapid hits (0.2s apart) at 70% damage each
  - 3.5s cooldown between flurries
- **Visual**: Purple body, red flash during enrage and flurry

### Healer (Level 8+)
- **Stats**: 75% HP, 115% speed
- **Behavior**:
  - Flees from player at 300px range
  - Heals all nearby mobs in 180px radius
  - Heals 3 HP every 2.0s to allies only
  - Does not heal itself
- **Visual**: Light green body with white cross, green heal pulse ring

### Summoner (Level 9+)
- **Stats**: 120% HP, 75% speed
- **Behavior**:
  - Can summon normal or speeder mobs (50/50 chance)
  - Max 3 active summons at a time
  - Cast duration: 1.2s (takes 50% damage during cast)
  - Summon cooldown: 6.0s
  - Fights back with melee when player is close
  - **Boss gate**: Boss only spawns after Summoner dies AND all summons are eliminated
- **Visual**: Pink/salmon body with spinning star, casting portal glow

---

## Testing Checklist

- [ ] Level 5: Archers spawn, fire projectiles correctly
- [ ] Level 6: Leapers spawn, pounce and deal leap damage
- [ ] Level 7: Berserkers spawn, enrage at 50% HP with flurry attacks
- [ ] Level 8: Healers spawn, flee and heal nearby mobs
- [ ] Level 9: Summoners spawn, can summon mobs, cast feedback is visible
- [ ] Boss gate works: Boss doesn't spawn until all mobs (including summons) are dead
- [ ] Archer projectiles collide with player and deal damage
- [ ] Leaper body collision works during leap
- [ ] Berserker flurry can land multiple hits without resets
- [ ] Healer visual pulse appears every 2 seconds
- [ ] Summoner portal glow shows during casting

---

## Performance Notes

- Static mob ID counter increments for each spawned mob (never resets)
- Summoned mobs are tagged with `summonedBy: summoner.id` for counting active summons
- Projectiles are updated and filtered every frame (lightweight)
- No major performance impact expected; all systems are efficient

---

## Future Extensions

These implementations are designed to be extended:
- **Archer**: Easy to add burst fire mode or homing projectiles
- **Leaper**: Can add wall-bounce or double-jump mechanics
- **Berserker**: Can add spin attack variation in enrage phase
- **Healer**: Can add heal beam visual or priority targeting
- **Summoner**: Can add elite summons or boss-specific summon mechanics

---

**Implementation complete!** Your 5 new enemies are now ready to challenge players across levels 5-9.