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

// --- Coins ---
// Coins per level (index 0 = level 1). Beyond index: last + COINS_PER_LEVEL_EXTRA each level.
export const COINS_PER_LEVEL           = [2, 3, 5, 8, 10, 12];
export const COINS_PER_LEVEL_EXTRA     = 2;   // added per level beyond the array
export const COIN_WIDTH                = 28;
export const COIN_HEIGHT               = 28;
export const COIN_MIN_X_OFFSET         = 400; // min X from world start
export const COIN_MAX_GROUND_OFFSET    = 250; // max px above ground (single-jump reachable)
export const COIN_MIN_GROUND_OFFSET    = 40;  // min px above ground