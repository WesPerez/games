export type PlantType = 'sunflower' | 'peashooter' | 'wallnut' | 'cherrybomb' | 'snowpea' | 'repeater' | 'chomper' | 'potatomine' | 'twinsunflower' | 'garlic';
export type ZombieType = 'normal' | 'cone' | 'bucket' | 'flag' | 'polevaulter' | 'newspaper' | 'screendoor';
export type GameStatus = 'playing' | 'won' | 'lost' | 'paused';
export type ScreenState = 'start' | 'playing';

export interface Plant {
  type: PlantType;
  row: number;
  col: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  animTimer: number;
  animFrame: number;
  attackTimer: number;
  state: 'idle' | 'attacking' | 'producing' | 'dying' | 'exploding' | 'chomping' | 'armed' | 'arming';
  stateTimer: number;
  produceTimer: number;
  swayOffset: number;
  placeTimer: number;
}

export interface Zombie {
  type: ZombieType;
  row: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  baseSpeed: number;
  damage: number;
  animTimer: number;
  animFrame: number;
  state: 'walking' | 'attacking' | 'dying' | 'running' | 'jumping' | 'vaulting';
  stateTimer: number;
  targetPlant: Plant | null;
  flashTimer: number;
  bobOffset: number;
  slowTimer: number;
  newspaperHp: number;
  newspaperMaxHp: number;
  shieldHp: number;
  shieldMaxHp: number;
  hasFlag: boolean;
  hasPole: boolean;
  jumped: boolean;
}

export interface Projectile {
  x: number;
  y: number;
  row: number;
  damage: number;
  speed: number;
  alive: boolean;
  slows: boolean;
  trail: { x: number; y: number; alpha: number }[];
}

export interface Sun {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  value: number;
  state: 'falling' | 'idle' | 'collecting' | 'done';
  timer: number;
  scale: number;
  glowPhase: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
}

export interface PlantCard {
  type: PlantType;
  cooldownTimer: number;
  maxCooldown: number;
  ready: boolean;
}

export interface WaveInfo {
  zombies: { type: ZombieType; count: number }[];
  delay: number;
}

export interface LawnMower {
  row: number;
  x: number;
  y: number;
  active: boolean;
  triggered: boolean;
  speed: number;
}

export interface GameState {
  plants: Plant[];
  zombies: Zombie[];
  projectiles: Projectile[];
  suns: Sun[];
  particles: Particle[];
  mowers: LawnMower[];
  sunCount: number;
  selectedPlant: PlantType | null;
  selectedTool: 'plant' | 'shovel' | null;
  currentWave: number;
  totalWaves: number;
  waveTimer: number;
  waveActive: boolean;
  waveZombiesRemaining: number;
  gameStatus: GameStatus;
  screenState: ScreenState;
  sunFallTimer: number;
  plantCards: PlantCard[];
  mouseX: number;
  mouseY: number;
  hoveredCell: { row: number; col: number } | null;
  grid: (Plant | null)[][];
  totalTime: number;
  screenShake: number;
  waveAnnouncement: string;
  waveAnnouncementTimer: number;
  sunGlowPhase: number;
}