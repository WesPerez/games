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
} as const;

export const ZOMBIE_TYPES = {
  NORMAL: 'normal',
  CONE: 'cone',
  BUCKET: 'bucket',
} as const;

export const PLANT_CONFIG: Record<string, { cost: number; hp: number; cooldown: number; damage: number; attackSpeed: number }> = {
  sunflower: { cost: 50, hp: 100, cooldown: 7.5, damage: 0, attackSpeed: 0 },
  peashooter: { cost: 100, hp: 100, cooldown: 7.5, damage: 20, attackSpeed: 1.5 },
  wallnut: { cost: 50, hp: 400, cooldown: 30, damage: 0, attackSpeed: 0 },
  cherrybomb: { cost: 150, hp: 1, cooldown: 50, damage: 1800, attackSpeed: 0 },
};

export const ZOMBIE_CONFIG: Record<string, { hp: number; speed: number; damage: number }> = {
  normal: { hp: 200, speed: 22, damage: 100 },
  cone: { hp: 370, speed: 22, damage: 100 },
  bucket: { hp: 1100, speed: 18, damage: 100 },
};

export const INITIAL_SUN = 150;
export const SUN_VALUE = 25;
export const SUN_FALL_INTERVAL = 10;
export const SUNFLOWER_PRODUCE_INTERVAL = 24;
export const SUN_LIFETIME = 8;
export const PEA_SPEED = 300;
export const CHERRY_EXPLOSION_RADIUS = 1;

export const WAVE_CONFIG = [
  { zombies: [{ type: 'normal', count: 3 }], delay: 5 },
  { zombies: [{ type: 'normal', count: 2 }, { type: 'cone', count: 1 }], delay: 28 },
  { zombies: [{ type: 'normal', count: 2 }, { type: 'cone', count: 1 }, { type: 'bucket', count: 1 }], delay: 28 },
];

export const GAME_STATES = {
  PLAYING: 'playing',
  WON: 'won',
  LOST: 'lost',
  PAUSED: 'paused',
} as const;
