# Enemy Progression & Stats Reference

## Level Progression Timeline

```
Level 1   Level 2   Level 3   Level 4   Level 5   Level 6   Level 7   Level 8   Level 9
├─────────├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ Normal  │         │         │Shielder│ Archer  │ Leaper  │ Berserker Healer Summoner
│ Speeder (from 3)  Speeder   │(from 4) │(from 5) │(from 6) │(from 7) (from 8)(from 9)
│                              │         │         │         │         │
└─ Intro  └─ Mix    └─ Mix    └─ Mix    └─ Mix    └─ Mix    └─ Mix    └─ Mix
```

---

## Enemy Stats Comparison

### Base Stats (Level 1)
```
             HP      Speed   Size       Damage  Cooldown  Range   Damage/s
Normal       40      90      40x55      10      1.2s      50px    8.3
Speeder      16      180     40x55      10      1.2s      50px    8.3
Shielder     40      90      45x58      10      1.2s      50px    8.3
Archer       32      76.5    40x55      18*     2.8s      280px   6.4*
Leaper       28      117     40x55      15*     3.0s      200px   5.0*
Berserker    60      81      44x60      10      (varies)  50px    (varies)
Healer       30      103.5   40x55      10      1.2s      180px   8.3
Summoner     48      67.5    44x58      10      1.2s      50px    8.3
```

* Archer: Projectile damage (18), Normal attack damage (10)
* Leaper: Leap damage multiplied by 1.5x

### Scaling per Level (+1)
```
HP:    +15 per level (applies multipliers after)
Speed: +10 per level (applies multipliers after)
```

### Example: Level 5 Stats
```
Archer at Level 5:
  Base HP: 40 + (5-1)*15 = 100
  Final HP: 100 * 0.8 = 80 HP
  
  Base Speed: 90 + (5-1)*10 = 130
  Final Speed: 130 * 0.85 = 110.5 px/s
```

---

## Enemy Type Details

### 1. ARCHER (Level 5+)
```
┌─────────────────────────────────────┐
│ ARCHER - Ranged Support Fighter     │
├─────────────────────────────────────┤
│ HP Multiplier:        0.8 (80%)     │
│ Speed Multiplier:     0.85 (85%)    │
│ Size:                 40x55 (normal)│
│ Color:                Orange/Yellow │
├─────────────────────────────────────┤
│ ATTACK                              │
│ ├─ Projectile Speed:  420 px/s      │
│ ├─ Projectile Damage: 18            │
│ ├─ Attack Cooldown:   2.8s          │
│ └─ Range:             280px         │
├─────────────────────────────────────┤
│ BEHAVIOR                            │
│ ├─ Shoot Range:       280px         │
│ ├─ Retreat Range:     120px         │
│ └─ Behavior:          Backpedal & fire
├─────────────────────────────────────┤
│ NOTES                               │
│ • Fires single charged shot         │
│ • Aimed at player position          │
│ • Retreats if player too close      │
│ • Holds position to shoot           │
└─────────────────────────────────────┘
```

### 2. LEAPER (Level 6+)
```
┌─────────────────────────────────────┐
│ LEAPER - Agile Jump Attacker        │
├─────────────────────────────────────┤
│ HP Multiplier:        0.7 (70%)     │
│ Speed Multiplier:     1.3 (130%)    │
│ Size:                 40x55 (normal)│
│ Color:                Teal/Green    │
├─────────────────────────────────────┤
│ ATTACK                              │
│ ├─ Leap Range:        200px         │
│ ├─ Leap Speed:        380 px/s (x)  │
│ ├─ Leap Arc:          -480 px/s (y) │
│ ├─ Damage Multiplier: 1.5x          │
│ ├─ Leap Cooldown:     3.0s          │
│ └─ Damage/Leap:       15 @ level 1  │
├─────────────────────────────────────┤
│ BEHAVIOR                            │
│ ├─ Leap Trigger:      When <200px   │
│ ├─ Trajectory:        Pounce at player
│ ├─ Damage Type:       Body collision│
│ └─ Landing:           Resets cooldown
├─────────────────────────────────────┤
│ NOTES                               │
│ • Leap IS the attack                │
│ • Fast horizontal movement          │
│ • Air time ~0.7s                    │
│ • Distance ~270px before landing    │
│ • Can hit during flight             │
└─────────────────────────────────────┘
```

### 3. BERSERKER (Level 7+)
```
┌─────────────────────────────────────┐
│ BERSERKER - Enrage Melee Fighter    │
├─────────────────────────────────────┤
│ HP Multiplier:        1.5 (150%)    │
│ Speed Multiplier:     0.9 (90%)     │
│ Size:                 44x60 (large) │
│ Color:                Purple/Red    │
├─────────────────────────────────────┤
│ NORMAL STATE                        │
│ ├─ Damage:            10            │
│ ├─ Cooldown:          1.2s          │
│ ├─ Range:             50px          │
│ └─ Speed:             90 @ level 1  │
├─────────────────────────────────────┤
│ ENRAGE (triggered at 50% HP)        │
│ ├─ Speed Boost:       140% → 126%   │
│ ├─ Attack Pattern:    Flurry mode   │
│ └─ Permanent:         Until death   │
├─────────────────────────────────────┤
│ FLURRY ATTACK                       │
│ ├─ Hits:              3 hits        │
│ ├─ Interval:          0.2s apart    │
│ ├─ Damage/Hit:        7 (70%)       │
│ ├─ Range:             65px (wider)  │
│ ├─ Flurry Cooldown:   3.5s          │
│ └─ Trigger:           In melee range│
├─────────────────────────────────────┤
│ NOTES                               │
│ • Enrage visible as red flash       │
│ • Flurry resets hitbox between hits │
│ • Total flurry damage: 21 HP        │
│ • Can chain flurries if enraged     │
│ • Stun interrupts flurry            │
└─────────────────────────────────────┘
```

### 4. HEALER (Level 8+)
```
┌─────────────────────────────────────┐
│ HEALER - Support Ally Mender        │
├─────────────────────────────────────┤
│ HP Multiplier:        0.75 (75%)    │
│ Speed Multiplier:     1.15 (115%)   │
│ Size:                 40x55 (normal)│
│ Color:                Light Green   │
├─────────────────────────────────────┤
│ ATTACK                              │
│ ├─ Damage:            10            │
│ ├─ Cooldown:          1.2s          │
│ ├─ Range:             50px          │
│ └─ Usage:             Only if cornered
├─────────────────────────────────────┤
│ HEALING ABILITY                     │
│ ├─ Heal Radius:       180px         │
│ ├─ Heal Amount:       3 HP          │
│ ├─ Interval:          Every 2.0s    │
│ ├─ Targets:           Allies only   │
│ └─ Self-Heal:         No            │
├─────────────────────────────────────┤
│ MOVEMENT                            │
│ ├─ Flee Range:        300px         │
│ ├─ Flee Speed:        1.2x speed    │
│ ├─ Direction:         Away from player
│ └─ Pattern:           Runs & heals  │
├─────────────────────────────────────┤
│ NOTES                               │
│ • Prioritizes healing over fighting │
│ • Green pulse ring on heal          │
│ • Keeps distance from player        │
│ • Weak HP pool                      │
│ • Good target for early elimination │
└─────────────────────────────────────┘
```

### 5. SUMMONER (Level 9+)
```
┌─────────────────────────────────────┐
│ SUMMONER - Mob Spawning Tactician   │
├─────────────────────────────────────┤
│ HP Multiplier:        1.2 (120%)    │
│ Speed Multiplier:     0.75 (75%)    │
│ Size:                 44x58 (large) │
│ Color:                Pink/Salmon   │
├─────────────────────────────────────┤
│ ATTACK                              │
│ ├─ Damage:            10            │
│ ├─ Cooldown:          1.2s          │
│ ├─ Range:             50px          │
│ └─ Usage:             When cornered │
├─────────────────────────────────────┤
│ SUMMONING ABILITY                   │
│ ├─ Summon Types:      Normal/Speeder
│ ├─ Spawn Chance:      50/50         │
│ ├─ Max Active:        3 summons     │
│ ├─ Cast Duration:     1.2s          │
│ ├─ Cooldown:          6.0s          │
│ └─ Spawn Offset:      ±60-140px     │
├─────────────────────────────────────┤
│ SPECIAL: CASTING                    │
│ ├─ Damage Taken:      50% (halved)  │
│ ├─ Movement:          Frozen        │
│ ├─ Visual:            Portal glow   │
│ └─ Interruption:      Can be stunned│
├─────────────────────────────────────┤
│ BOSS GATE MECHANIC                  │
│ ├─ Condition:         All mobs dead │
│ ├─ Includes:          Summoned mobs │
│ └─ Boss Trigger:      Summons cleared
├─────────────────────────────────────┤
│ NOTES                               │
│ • Slow movement (lowest speed)      │
│ • Tactical summoning pattern        │
│ • Summons scale to current level    │
│ • Each summoned mob tagged          │
│ • Player must kill summoner + summons
└─────────────────────────────────────┘
```

---

## Combat Effectiveness Chart

### DPS (Damage Per Second)
```
Normal:     10 / 1.2  = 8.3 DPS
Speeder:    10 / 1.2  = 8.3 DPS (but faster movement)
Shielder:   10 / 1.2  = 8.3 DPS (with blocking)
Archer:     18 / 2.8  = 6.4 DPS (ranged advantage)
Leaper:     15 / 3.0  = 5.0 DPS (spike damage on hit)
Berserker:  10 / 1.2  = 8.3 DPS (30.8 DPS during flurry!)
Healer:     10 / 1.2  = 8.3 DPS (mainly heals)
Summoner:   10 / 1.2  = 8.3 DPS (spawns allies)
```

### Threat Level (for player)
```
High:   Berserker (enrage + flurry)
        Leaper (spike damage + speed)
Medium: Archer (ranged, keeps distance)
        Summoner (summons reinforcements)
Low:    Shielder (defensive)
        Healer (prefers fleeing)
        Normal/Speeder (basic)
```

### Strategic Priority
```
1. Summoner (kills summons, gates boss)
2. Healer (removes ally support)
3. Berserker (before enrage + flurry)
4. Archer (prevent ranged kiting)
5. Leaper (before engagement)
6. Shielder (if blocking access)
7. Normal/Speeder (lowest threat)
```

---

## Difficulty Curve

```
Level 1-2: Only Normal mobs (baseline)
           ↓
Level 3: Introduce Speeder (speed challenge)
           ↓
Level 4: Add Shielder (blocking mechanic)
           ↓
Level 5: Add Archer (projectile threat)
           ↓
Level 6: Add Leaper (dodge spike damage)
           ↓
Level 7: Add Berserker (enrage mechanic)
           ↓
Level 8: Add Healer (managing support)
           ↓
Level 9: Add Summoner (tactical complexity)
           ↓
Level 10+: All types mixed (full challenge)
```

---

## Color Reference Guide
```
Normal:          #E24A4A (red)
Speeder:         #FFA500 (orange)
Shielder:        #4169E1 (bright blue)
┌────────────────────────────────────┐
│ NEW ENEMY COLORS                   │
├────────────────────────────────────┤
│ Archer:        #FFB347 (orange)    │
│ Leaper:        #40BFA0 (teal)      │
│ Berserker:     #9966CC (purple)    │
│              → #FF3344 (red/enrage)│
│ Healer:        #88DD66 (green)     │
│ Summoner:      #FF7799 (pink)      │
└────────────────────────────────────┘
Boss:            #6B2FA0 (dark purple)
```

---

This reference helps balance gameplay and understand progression!