export const CANVAS_W = 900;
export const CANVAS_H = 600;

export const GRID_LEFT = 80;
export const GRID_TOP = 85;
export const CELL_W = 82;
export const CELL_H = 95;
export const GRID_COLS = 9;
export const GRID_ROWS = 5;

export const TOP_BAR_H = 85;
export const BOTTOM_BAR_H = 40;

export const PLANT_TYPES = {
  SUNFLOWER: 'sunflower',
  PEASHOOTER: 'peashooter',
  WALLNUT: 'wallnut',
  CHERRYBOMB: 'cherrybomb',
  SNOWPEA: 'snowpea',
  REPEATER: 'repeater',
  CHOMPER: 'chomper',
  POTATOMINE: 'potatomine',
  TWINSUNFLOWER: 'twinsunflower',
  GARLIC: 'garlic',
} as const;

export const ZOMBIE_TYPES = {
  NORMAL: 'normal',
  CONE: 'cone',
  BUCKET: 'bucket',
  FLAG: 'flag',
  POLEVAULTER: 'polevaulter',
  NEWSPAPER: 'newspaper',
  SCREENDOOR: 'screendoor',
} as const;

export const PLANT_CONFIG: Record<string, { cost: number; hp: number; cooldown: number; damage: number; attackSpeed: number }> = {
  sunflower:     { cost: 50,  hp: 100, cooldown: 7.5,  damage: 0,    attackSpeed: 0 },
  peashooter:    { cost: 100, hp: 100, cooldown: 7.5,  damage: 20,   attackSpeed: 1.5 },
  wallnut:       { cost: 50,  hp: 400, cooldown: 30,   damage: 0,    attackSpeed: 0 },
  cherrybomb:    { cost: 150, hp: 1,   cooldown: 50,   damage: 1800, attackSpeed: 0 },
  snowpea:       { cost: 175, hp: 100, cooldown: 7.5,  damage: 20,   attackSpeed: 1.5 },
  repeater:      { cost: 200, hp: 100, cooldown: 7.5,  damage: 20,   attackSpeed: 1.2 },
  chomper:       { cost: 150, hp: 100, cooldown: 42,   damage: 1800, attackSpeed: 0 },
  potatomine:    { cost: 25,  hp: 100, cooldown: 30,   damage: 1800, attackSpeed: 0 },
  twinsunflower: { cost: 125, hp: 100, cooldown: 7.5,  damage: 0,    attackSpeed: 0 },
  garlic:        { cost: 50,  hp: 200, cooldown: 7.5,  damage: 0,    attackSpeed: 0 },
};

export const ZOMBIE_CONFIG: Record<string, { hp: number; speed: number; damage: number }> = {
  normal:     { hp: 200,  speed: 22,  damage: 100 },
  cone:       { hp: 370,  speed: 22,  damage: 100 },
  bucket:     { hp: 1100, speed: 18,  damage: 100 },
  flag:       { hp: 200,  speed: 35,  damage: 100 },
  polevaulter:{ hp: 340,  speed: 40,  damage: 100 },
  newspaper:  { hp: 340,  speed: 22,  damage: 100 },
  screendoor: { hp: 350,  speed: 20,  damage: 100 },
};

export const INITIAL_SUN = 150;
export const SUN_VALUE = 25;
export const SUN_FALL_INTERVAL = 10;
export const SUNFLOWER_PRODUCE_INTERVAL = 24;
export const TWIN_SUNFLOWER_INTERVAL = 12;
export const SUN_LIFETIME = 8;
export const PEA_SPEED = 300;
export const CHERRY_EXPLOSION_RADIUS = 1;
export const CHOMPER_EAT_TIME = 1.5;
export const CHOMPER_CHEW_TIME = 42;
export const POTATO_ARM_TIME = 14;
export const POTATO_EXPLOSION_RADIUS = 1;
export const SLOW_FACTOR = 0.5;
export const SLOW_DURATION = 3;
export const MOWER_SPEED = 200;

export const WAVE_CONFIG = [
  { zombies: [{ type: 'normal', count: 3 }], delay: 5 },
  { zombies: [{ type: 'normal', count: 2 }, { type: 'cone', count: 1 }, { type: 'flag', count: 1 }], delay: 28 },
  { zombies: [{ type: 'normal', count: 2 }, { type: 'cone', count: 2 }, { type: 'polevaulter', count: 1 }], delay: 28 },
  { zombies: [{ type: 'normal', count: 3 }, { type: 'bucket', count: 1 }, { type: 'newspaper', count: 1 }], delay: 28 },
  { zombies: [{ type: 'cone', count: 2 }, { type: 'bucket', count: 1 }, { type: 'screendoor', count: 1 }, { type: 'flag', count: 1 }], delay: 28 },
  { zombies: [{ type: 'normal', count: 2 }, { type: 'cone', count: 2 }, { type: 'bucket', count: 2 }, { type: 'flag', count: 2 }, { type: 'polevaulter', count: 1 }], delay: 28 },
];

export const GAME_STATES = {
  PLAYING: 'playing',
  WON: 'won',
  LOST: 'lost',
  PAUSED: 'paused',
} as const;

export const SCREEN_STATES = {
  START: 'start',
  PLAYING: 'playing',
} as const;