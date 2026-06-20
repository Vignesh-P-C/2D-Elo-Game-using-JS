// ============================================================
// Constants.js — All tunable game values in one place.
// Import from here; never hard-code magic numbers in game files.
// ============================================================

// --- Physics ---
export const GRAVITY = 1400;
export const DT_CAP  = 0.05;

// --- Player ---
export const PLAYER_WIDTH              = 36;
export const PLAYER_HEIGHT             = 56;
export const PLAYER_SPEED              = 220;
export const PLAYER_JUMP_FORCE         = -520;
export const PLAYER_MAX_HP             = 100;
export const PLAYER_ATTACK_DAMAGE      = 20;
export const PLAYER_ATTACK_RANGE       = 60;
export const PLAYER_ATTACK_DURATION    = 0.18;
export const PLAYER_ATTACK_COOLDOWN    = 0.4;
export const PLAYER_INVULN_DURATION    = 0.8;
export const PLAYER_KNOCKBACK_X        = 280;
export const PLAYER_KNOCKBACK_Y        = -200;
export const PLAYER_START_X            = 200;

// --- Mob base ---
export const MOB_WIDTH                 = 40;
export const MOB_HEIGHT                = 55;
export const MOB_BASE_HP               = 40;
export const MOB_BASE_SPEED            = 90;
export const MOB_DAMAGE                = 10;
export const MOB_ATTACK_COOLDOWN       = 1.2;
export const MOB_ATTACK_RANGE          = 50;
export const MOB_ATTACK_DURATION       = 0.25;
export const MOB_CHASE_RANGE           = 300;
export const MOB_PATROL_RANGE          = 80;
export const MOB_STUN_DURATION         = 0.4;
export const MOB_DEATH_DURATION        = 0.5;
export const MOB_KNOCKBACK_X           = 200;
export const MOB_KNOCKBACK_Y           = -150;
export const MOB_ELO_VALUE             = 10;

// --- Speeder Enemy ---
export const SPEEDER_SPEED_MULTIPLIER  = 2.0;
export const SPEEDER_HP_MULTIPLIER     = 0.4;
export const COLOR_SPEEDER             = '#FFA500';
export const COLOR_SPEEDER_OUTLINE     = '#CC6600';

// --- Shielder Enemy ---
export const SHIELDER_WIDTH            = 45;
export const SHIELDER_HEIGHT           = 58;
export const COLOR_SHIELDER            = '#4169E1';
export const COLOR_SHIELDER_OUTLINE    = '#1E3A8A';
export const COLOR_SHIELDER_SHIELD     = '#87CEEB';
// Shield toggles on/off randomly; both phases stay above 0.25s
export const SHIELDER_SHIELD_MIN_UP    = 0.55;  // shortest time shield stays UP
export const SHIELDER_SHIELD_MAX_UP    = 1.1;   // longest  time shield stays UP
export const SHIELDER_SHIELD_MIN_DOWN  = 0.3;   // shortest attack window
export const SHIELDER_SHIELD_MAX_DOWN  = 0.75;  // longest  attack window

// --- Archer Enemy ---
export const ARCHER_SHOOT_RANGE        = 280;
export const ARCHER_RETREAT_RANGE      = 120;
export const ARCHER_PROJECTILE_SPEED   = 420;
export const ARCHER_PROJECTILE_DAMAGE  = 18;
export const ARCHER_ATTACK_COOLDOWN    = 2.8;
export const ARCHER_HP_MULTIPLIER      = 0.8;
export const ARCHER_SPEED_MULTIPLIER   = 0.85;
export const COLOR_ARCHER              = '#FFB347';
export const COLOR_ARCHER_OUTLINE      = '#CC7700';

// --- Leaper Enemy ---
export const LEAPER_LEAP_RANGE         = 200;
export const LEAPER_LEAP_VX            = 380;
export const LEAPER_LEAP_VY            = -480;
export const LEAPER_LEAP_DAMAGE_MULT   = 1.5;
export const LEAPER_LEAP_COOLDOWN      = 3.0;
export const LEAPER_HP_MULTIPLIER      = 0.7;
export const LEAPER_SPEED_MULTIPLIER   = 1.3;
export const COLOR_LEAPER              = '#40BFA0';
export const COLOR_LEAPER_OUTLINE      = '#1A6B58';

// --- Berserker Enemy ---
export const BERSERKER_WIDTH               = 44;
export const BERSERKER_HEIGHT              = 60;
export const BERSERKER_HP_MULTIPLIER       = 1.5;
export const BERSERKER_SPEED_MULTIPLIER    = 0.9;
export const BERSERKER_ENRAGE_THRESHOLD    = 0.5;
export const BERSERKER_FLURRY_HITS         = 3;
export const BERSERKER_FLURRY_HIT_INTERVAL = 0.2;
export const BERSERKER_FLURRY_DAMAGE_MULT  = 0.7;
export const BERSERKER_FLURRY_COOLDOWN     = 3.5;
export const BERSERKER_ENRAGE_SPEED_MULT   = 1.4;
export const COLOR_BERSERKER               = '#9966CC';
export const COLOR_BERSERKER_ENRAGED       = '#FF3344';
export const COLOR_BERSERKER_OUTLINE       = '#5511AA';

// --- Healer Enemy ---
export const HEALER_HP_MULTIPLIER      = 0.75;
export const HEALER_SPEED_MULTIPLIER   = 1.15;
export const HEALER_HEAL_RADIUS        = 180;
export const HEALER_HEAL_AMOUNT        = 3;
export const HEALER_HEAL_INTERVAL      = 2.0;
export const HEALER_FLEE_RANGE         = 300;
export const COLOR_HEALER              = '#88DD66';
export const COLOR_HEALER_OUTLINE      = '#336622';

// --- Summoner Enemy ---
export const SUMMONER_WIDTH            = 44;
export const SUMMONER_HEIGHT           = 58;
export const SUMMONER_HP_MULTIPLIER    = 1.2;
export const SUMMONER_SPEED_MULTIPLIER = 0.75;
export const SUMMONER_SUMMON_COOLDOWN  = 6.0;
export const SUMMONER_MAX_SUMMONS      = 3;
export const SUMMONER_CAST_DURATION    = 1.2;
export const SUMMONER_CAST_DMG_MULT    = 0.5;
export const COLOR_SUMMONER            = '#FF7799';
export const COLOR_SUMMONER_OUTLINE    = '#CC2255';
export const COLOR_SUMMONER_CAST       = '#FFAACC';

// --- Boss ---
export const BOSS_WIDTH                = 60;
export const BOSS_HEIGHT               = 80;
export const BOSS_BASE_HP              = 200;
export const BOSS_BASE_SPEED           = 130;
export const BOSS_DAMAGE               = 25;
export const BOSS_ATTACK_COOLDOWN      = 0.7;
export const BOSS_ATTACK_RANGE         = 70;
export const BOSS_ATTACK_DURATION      = 0.3;
export const BOSS_STUN_DURATION        = 0.25;
export const BOSS_KNOCKBACK_X          = 380;
export const BOSS_KNOCKBACK_Y          = -280;
export const BOSS_ELO_VALUE            = 100;
export const BOSS_PHASE2_THRESHOLD     = 0.5;
export const BOSS_PHASE2_SPEED_MULT    = 1.4;
export const BOSS_PHASE2_COOLDOWN_MULT = 0.5;

// --- ELO ---
export const ELO_START                 = 1000;
export const ELO_BAR_SEGMENT           = 100;

// --- Level ---
export const LEVEL_WORLD_BASE_WIDTH    = 3000;
export const LEVEL_WORLD_WIDTH_STEP    = 500;
export const LEVEL_GROUND_THICKNESS    = 60;
export const LEVEL_PLATFORM_WIDTH      = 180;
export const LEVEL_PLATFORM_HEIGHT     = 20;
export const LEVEL_NEXT_DELAY          = 1.5;

// --- Camera ---
export const CAMERA_LERP               = 6;

// --- HUD ---
export const HUD_BAR_WIDTH             = 200;
export const HUD_BAR_HEIGHT            = 18;
export const HUD_PADDING               = 14;
export const HUD_LERP                  = 8;

// --- Colors ---
export const COLOR_BACKGROUND_TOP     = '#1a1a2e';
export const COLOR_BACKGROUND_BOT     = '#16213e';
export const COLOR_GROUND             = '#2D5A27';
export const COLOR_GROUND_EDGE        = '#1a3a18';
export const COLOR_PLATFORM           = '#8B4513';
export const COLOR_PLATFORM_EDGE      = '#5c2d0a';
export const COLOR_PLAYER_IDLE        = '#4A90E2';
export const COLOR_PLAYER_ATTACK      = '#66BBFF';
export const COLOR_PLAYER_HIT         = '#FF9944';
export const COLOR_PLAYER_DEAD        = '#888888';
export const COLOR_PLAYER_OUTLINE     = '#1a4a82';
export const COLOR_MOB                = '#E24A4A';
export const COLOR_MOB_STUNNED        = '#FF9999';
export const COLOR_MOB_OUTLINE        = '#8B0000';
export const COLOR_BOSS               = '#6B2FA0';
export const COLOR_BOSS_PHASE2        = '#9B1DDB';
export const COLOR_BOSS_OUTLINE       = '#000000';
export const COLOR_HP_BAR             = '#E84040';
export const COLOR_HP_BG              = '#4a1a1a';
export const COLOR_ELO_BAR            = '#F0C040';
export const COLOR_ELO_BG             = '#4a3a10';
export const COLOR_HUD_BG             = 'rgba(0,0,0,0.45)';
export const COLOR_TEXT               = '#FFFFFF';

// --- Dash ---
export const DASH_DURATION           = 0.18;
export const DASH_COOLDOWN           = 0.8;
export const DASH_SPEED              = 680;
export const DASH_INVULN_LEVEL       = 4;
export const DASH_ATTACK_CANCEL_TIME = 0.1;

// --- Healing Orbs ---
export const HEALING_ORB_HITS_REQUIRED = 4;
export const HEALING_ORB_HEAL          = 5;
export const HEALING_ORB_LIFETIME      = 8;
export const HEALING_ORB_RADIUS        = 12;
export const HEALING_ORB_FLOAT_SPEED   = 2;
export const HEALING_ORB_FLOAT_HEIGHT  = 15;

// --- Boss Defeat Healing ---
export const BOSS_DEFEAT_HEAL         = 50;
export const OVERHEAL_CAP_MULTIPLIER  = 1.5;
export const OVERHEAL_EFFICIENCY      = 0.5;
export const OVERHEAL_DECAY_INTERVAL  = 2.0;

// --- Feel Improvements ---
export const COYOTE_TIME              = 0.1;
export const JUMP_BUFFER_TIME         = 0.1;
export const ATTACK_BUFFER_TIME       = 0.1;
export const HIT_PAUSE_DURATION       = 0.04;

// --- Screen Shake ---
export const SCREEN_SHAKE_DURATION    = 0.25;
export const SCREEN_SHAKE_AMPLITUDE   = 8;
export const SCREEN_SHAKE_DECAY       = 0.9;

// --- Entity states ---
export const STATE = {
  IDLE:      'IDLE',
  RUNNING:   'RUNNING',
  JUMPING:   'JUMPING',
  ATTACKING: 'ATTACKING',
  HIT:       'HIT',
  DEAD:      'DEAD',
  CHASE:     'CHASE',
  STUNNED:   'STUNNED',
  DASHING:   'DASHING',
};

// --- Mini-map ---
export const MINIMAP_WIDTH             = 160;
export const MINIMAP_HEIGHT            = 40;
export const MINIMAP_PADDING           = 14;
export const MINIMAP_BG                = 'rgba(0,0,0,0.5)';
export const MINIMAP_BORDER            = 'rgba(255,255,255,0.15)';
export const MINIMAP_PLAYER_COLOR      = '#4A90E2';
export const MINIMAP_MOB_COLOR         = '#E24A4A';
export const MINIMAP_BOSS_COLOR        = '#9B1DDB';
export const MINIMAP_GROUND_COLOR      = 'rgba(45,90,39,0.8)';

// --- Damage Numbers ---
export const DMG_NUM_DURATION          = 0.9;
export const DMG_NUM_RISE_SPEED        = 55;
export const DMG_NUM_PLAYER_COLOR      = '#FF6644';
export const DMG_NUM_MOB_COLOR         = '#FFFFFF';
export const DMG_NUM_CRIT_COLOR        = '#FFD700';

// --- Coins ---
export const COINS_PER_LEVEL        = [2, 3, 5, 8, 10, 12];
export const COINS_PER_LEVEL_EXTRA  = 2;
export const COIN_WIDTH             = 28;
export const COIN_HEIGHT            = 28;
export const COIN_MIN_X_OFFSET      = 400;
export const COIN_MAX_GROUND_OFFSET = 84;
export const COIN_MIN_GROUND_OFFSET = 20;

// --- Shop ---
// SHOP_CATALOG[i] = the 3 items available during round (i+1).
// The last entry is reused for all rounds beyond the defined range.
// id      — unique string; one-time items use it to track purchases
// repeatable — true = can buy multiple times per shop visit
export const SHOP_CATALOG = [
  // Round 1
  [
    { id: 'r1_hp',     cost: 1, icon: '❤️',  label: '+25 HP',        desc: 'Restore 25 HP instantly. Repeatable.',             type: 'heal',   value: 25,         repeatable: true  },
    { id: 'r1_shield', cost: 2, icon: '🛡️',  label: 'Iron Shield',   desc: '50% less damage for 10 seconds.',                  type: 'shield', duration: 10, reduction: 0.50, repeatable: true  },
    { id: 'r1_sword',  cost: 3, icon: '⚔️',  label: 'Golden Sword',  desc: '+10% damage permanently. Persists all rounds.',    type: 'damage', multiplier: 1.10,  repeatable: false },
  ],
  // Round 2
  [
    { id: 'r2_hp',     cost: 2, icon: '❤️',  label: '+35 HP',        desc: 'Restore 35 HP instantly. Repeatable.',             type: 'heal',   value: 35,         repeatable: true  },
    { id: 'r2_shield', cost: 3, icon: '🛡️',  label: 'Tower Shield',  desc: '60% less damage for 12 seconds.',                  type: 'shield', duration: 12, reduction: 0.60, repeatable: true  },
    { id: 'r2_sword',  cost: 5, icon: '⚔️',  label: 'Runic Blade',   desc: '+15% damage permanently. Persists all rounds.',    type: 'damage', multiplier: 1.15,  repeatable: false },
  ],
  // Round 3
  [
    { id: 'r3_hp',     cost: 2, icon: '❤️',  label: '+45 HP',        desc: 'Restore 45 HP instantly. Repeatable.',             type: 'heal',   value: 45,         repeatable: true  },
    { id: 'r3_shield', cost: 4, icon: '🛡️',  label: 'Aegis',         desc: '70% less damage for 10 seconds.',                  type: 'shield', duration: 10, reduction: 0.70, repeatable: true  },
    { id: 'unlock_dash', cost: 5, icon: '💨', label: 'Dash',          desc: 'Unlock right-click dash permanently.',              type: 'ability', ability: 'dash',  repeatable: false },
  ],
  // Round 4
  [
    { id: 'r4_hp',     cost: 3, icon: '❤️',  label: '+60 HP',        desc: 'Restore 60 HP instantly. Repeatable.',             type: 'heal',   value: 60,         repeatable: true  },
    { id: 'r4_shield', cost: 5, icon: '🛡️',  label: 'Divine Shield', desc: '75% less damage for 15 seconds.',                  type: 'shield', duration: 15, reduction: 0.75, repeatable: true  },
    { id: 'r4_sword',  cost: 8, icon: '⚔️',  label: 'Excalibur',     desc: '+25% damage permanently. Persists all rounds.',    type: 'damage', multiplier: 1.25,  repeatable: false },
  ],
  // Round 5
  [
    { id: 'r5_hp',     cost: 3, icon: '❤️',  label: '+70 HP',        desc: 'Restore 70 HP instantly. Repeatable.',             type: 'heal',   value: 70,         repeatable: true  },
    { id: 'unlock_double_jump', cost: 7, icon: '🪽', label: 'Double Jump', desc: 'Unlock a second jump permanently.',           type: 'ability', ability: 'doubleJump', repeatable: false },
    { id: 'r5_sword',  cost: 9, icon: '⚔️',  label: 'Starforged Edge', desc: '+25% damage permanently. Persists all rounds.',  type: 'damage', multiplier: 1.25,  repeatable: false },
  ],
  // Round 6+ (reused for all higher rounds)
  [
    { id: 'r6_hp',     cost: 4, icon: '❤️',  label: '+80 HP',        desc: 'Restore 80 HP instantly. Repeatable.',             type: 'heal',   value: 80,         repeatable: true  },
    { id: 'r6_shield', cost: 6, icon: '🛡️',  label: 'Divine Shield', desc: '75% less damage for 15 seconds.',                  type: 'shield', duration: 15, reduction: 0.75, repeatable: true  },
    { id: 'r6_sword',  cost: 10, icon: '⚔️', label: 'Excalibur',     desc: '+25% damage permanently. Persists all rounds.',    type: 'damage', multiplier: 1.25,  repeatable: false },
  ],
];
