import { CANVAS_W, CANVAS_H, GRID_LEFT, GRID_TOP, CELL_W, CELL_H, GRID_COLS, GRID_ROWS, TOP_BAR_H, PLANT_CONFIG, ZOMBIE_CONFIG, INITIAL_SUN, SUN_VALUE, SUN_FALL_INTERVAL, SUN_LIFETIME, PEA_SPEED, CHERRY_EXPLOSION_RADIUS, WAVE_CONFIG, GAME_STATES, PLANT_TYPES } from './constants';
import { GameState, Plant, Zombie, Projectile, Sun, Particle, PlantCard, PlantType, ZombieType, GameStatus } from './types';
import { Renderer } from './renderer';
import { InputHandler } from './input';

export class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  renderer: Renderer;
  input: InputHandler;
  state: GameState;
  lastTime: number = 0;
  running: boolean = false;
  animFrameId: number = 0;
  gameId: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    this.ctx = canvas.getContext('2d')!;
    this.renderer = new Renderer(this.ctx);
    this.input = new InputHandler(canvas, this);
    this.state = this.createInitialState();
  }

  createInitialState(): GameState {
    const grid: (Plant | null)[][] = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      grid[r] = [];
      for (let c = 0; c < GRID_COLS; c++) {
        grid[r][c] = null;
      }
    }

    const plantCards: PlantCard[] = [
      { type: PLANT_TYPES.SUNFLOWER, cooldownTimer: 0, maxCooldown: PLANT_CONFIG.sunflower.cooldown, ready: true },
      { type: PLANT_TYPES.PEASHOOTER, cooldownTimer: 0, maxCooldown: PLANT_CONFIG.peashooter.cooldown, ready: true },
      { type: PLANT_TYPES.WALLNUT, cooldownTimer: 0, maxCooldown: PLANT_CONFIG.wallnut.cooldown, ready: true },
      { type: PLANT_TYPES.CHERRYBOMB, cooldownTimer: 0, maxCooldown: PLANT_CONFIG.cherrybomb.cooldown, ready: true },
    ];

    return {
      plants: [],
      zombies: [],
      projectiles: [],
      suns: [],
      particles: [],
      sunCount: INITIAL_SUN,
      selectedPlant: null,
      selectedTool: null,
      currentWave: 0,
      totalWaves: WAVE_CONFIG.length,
      waveTimer: WAVE_CONFIG[0].delay,
      waveActive: false,
      waveZombiesRemaining: 0,
      gameStatus: GAME_STATES.PLAYING,
      sunFallTimer: 5,
      plantCards,
      mouseX: 0,
      mouseY: 0,
      hoveredCell: null,
      grid,
      totalTime: 0,
    };
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.animFrameId);
  }

  restart() {
    this.gameId++;
    this.state = this.createInitialState();
    this.lastTime = performance.now();
  }

  loop = (now: number) => {
    if (!this.running) return;
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    if (this.state.gameStatus === GAME_STATES.PLAYING) {
      this.update(dt);
    }

    this.renderer.render(this.state);
    this.animFrameId = requestAnimationFrame(this.loop);
  };

  update(dt: number) {
    const s = this.state;
    s.totalTime += dt;

    this.updatePlantCards(dt);
    this.updateSunSystem(dt);
    this.updateWaveSystem(dt);
    this.updateZombies(dt);
    this.updatePlants(dt);
    this.updateProjectiles(dt);
    this.updateSuns(dt);
    this.updateParticles(dt);
    this.checkCollisions();
    this.checkWinLose();
  }

  updatePlantCards(dt: number) {
    for (const card of this.state.plantCards) {
      if (!card.ready) {
        card.cooldownTimer -= dt;
        if (card.cooldownTimer <= 0) {
          card.ready = true;
          card.cooldownTimer = 0;
        }
      }
    }
  }

  updateSunSystem(dt: number) {
    const s = this.state;
    s.sunFallTimer -= dt;
    if (s.sunFallTimer <= 0) {
      s.sunFallTimer = SUN_FALL_INTERVAL;
      this.spawnFallingSun();
    }
  }

  spawnFallingSun() {
    const s = this.state;
    const targetX = GRID_LEFT + Math.random() * (GRID_COLS * CELL_W);
    const sun: Sun = {
      x: targetX,
      y: -30,
      targetX,
      targetY: TOP_BAR_H + Math.random() * (GRID_ROWS * CELL_H - 50),
      value: SUN_VALUE,
      state: 'falling',
      timer: SUN_LIFETIME,
      scale: 1,
      glowPhase: Math.random() * Math.PI * 2,
    };
    s.suns.push(sun);
  }

  spawnSunFromPlant(plant: Plant) {
    const s = this.state;
    const sun: Sun = {
      x: plant.x,
      y: plant.y - 20,
      targetX: plant.x + (Math.random() - 0.5) * 60,
      targetY: plant.y + 30 + Math.random() * 40,
      value: SUN_VALUE,
      state: 'falling',
      timer: SUN_LIFETIME,
      scale: 0.6,
      glowPhase: Math.random() * Math.PI * 2,
    };
    s.suns.push(sun);
  }

  updateWaveSystem(dt: number) {
    const s = this.state;
    if (s.currentWave >= s.totalWaves) return;

    if (!s.waveActive) {
      s.waveTimer -= dt;
      if (s.waveTimer <= 0) {
        this.startWave(s.currentWave);
      }
    }
  }

  startWave(index: number) {
    const s = this.state;
    const wave = WAVE_CONFIG[index];
    s.waveActive = true;
    s.currentWave = index;
    let totalZombies = 0;
    for (const group of wave.zombies) {
      totalZombies += group.count;
    }
    s.waveZombiesRemaining = totalZombies;

    let spawnDelay = 0;
    const currentGameId = this.gameId;
    for (const group of wave.zombies) {
      for (let i = 0; i < group.count; i++) {
        setTimeout(() => {
          if (this.gameId !== currentGameId) return;
          if (s.gameStatus !== GAME_STATES.PLAYING) return;
          this.spawnZombie(group.type as ZombieType);
        }, spawnDelay * 1000);
        spawnDelay += 3 + Math.random() * 4;
      }
    }
  }

  spawnZombie(type: ZombieType) {
    const s = this.state;
    const config = ZOMBIE_CONFIG[type];
    const row = Math.floor(Math.random() * GRID_ROWS);
    const zombie: Zombie = {
      type,
      row,
      x: CANVAS_W + 20 + Math.random() * 60,
      y: GRID_TOP + row * CELL_H + CELL_H / 2,
      hp: config.hp,
      maxHp: config.hp,
      speed: config.speed,
      damage: config.damage,
      animTimer: 0,
      animFrame: 0,
      state: 'walking',
      stateTimer: 0,
      targetPlant: null,
      flashTimer: 0,
      bobOffset: Math.random() * Math.PI * 2,
    };
    s.zombies.push(zombie);
  }

  updateZombies(dt: number) {
    const s = this.state;
    for (const zombie of s.zombies) {
      zombie.animTimer += dt;
      if (zombie.animTimer > 0.15) {
        zombie.animTimer = 0;
        zombie.animFrame = (zombie.animFrame + 1) % 4;
      }
      zombie.bobOffset += dt * 3;
      zombie.flashTimer = Math.max(0, zombie.flashTimer - dt);

      if (zombie.state === 'dying') {
        zombie.stateTimer -= dt;
        if (zombie.stateTimer <= 0) {
          zombie.stateTimer = -999;
        }
        continue;
      }

      const cellCol = Math.floor((zombie.x - GRID_LEFT) / CELL_W);
      let attacking = false;
      for (let c = Math.max(0, cellCol - 1); c <= Math.min(GRID_COLS - 1, cellCol + 1); c++) {
        const plant = s.grid[zombie.row]?.[c];
        if (plant && plant.state !== 'dying' && plant.state !== 'exploding') {
          const plantCenterX = GRID_LEFT + c * CELL_W + CELL_W / 2;
          if (Math.abs(zombie.x - plantCenterX) < CELL_W * 0.7) {
            zombie.state = 'attacking';
            zombie.targetPlant = plant;
            plant.hp -= zombie.damage * dt;
            if (plant.hp <= 0) {
              plant.state = 'dying';
              plant.stateTimer = 0.3;
              s.grid[plant.row][plant.col] = null;
              zombie.targetPlant = null;
              zombie.state = 'walking';
            }
            attacking = true;
            break;
          }
        }
      }
      if (!attacking) {
        zombie.state = 'walking';
        zombie.targetPlant = null;
        zombie.x -= zombie.speed * dt;
      }
    }

    for (const zombie of s.zombies) {
      if (zombie.hp <= 0 && zombie.state !== 'dying') {
        zombie.state = 'dying';
        zombie.stateTimer = 0.5;
        this.spawnDeathParticles(zombie.x, zombie.y, zombie.type);
        s.waveZombiesRemaining--;
      }
    }

    s.zombies = s.zombies.filter(z => {
      if (z.state === 'dying' && z.stateTimer <= -900) return false;
      return true;
    });
  }

  updatePlants(dt: number) {
    const s = this.state;
    for (const plant of s.plants) {
      plant.animTimer += dt;
      plant.swayOffset = Math.sin(s.totalTime * 2 + plant.x * 0.1) * 2;
      if (plant.placeTimer > 0) plant.placeTimer -= dt;

      if (plant.state === 'dying') {
        plant.stateTimer -= dt;
        continue;
      }
      if (plant.state === 'exploding') {
        plant.stateTimer -= dt;
        continue;
      }

      if (plant.type === PLANT_TYPES.SUNFLOWER) {
        plant.produceTimer += dt;
        if (plant.produceTimer >= 24) {
          plant.produceTimer = 0;
          plant.state = 'producing';
          plant.stateTimer = 0.6;
          this.spawnSunFromPlant(plant);
        }
        if (plant.state === 'producing') {
          plant.stateTimer -= dt;
          if (plant.stateTimer <= 0) {
            plant.state = 'idle';
          }
        }
      }

      if (plant.type === PLANT_TYPES.PEASHOOTER) {
        const hasZombieInRow = s.zombies.some(z => z.row === plant.row && z.x > plant.x && z.state !== 'dying');
        if (hasZombieInRow) {
          plant.attackTimer += dt;
          if (plant.attackTimer >= 1.5) {
            plant.attackTimer = 0;
            plant.state = 'attacking';
            plant.stateTimer = 0.3;
            this.firePea(plant);
          }
        }
        if (plant.state === 'attacking') {
          plant.stateTimer -= dt;
          if (plant.stateTimer <= 0) {
            plant.state = 'idle';
          }
        }
      }
    }

    s.plants = s.plants.filter(p => {
      if (p.state === 'dying' && p.stateTimer <= 0) return false;
      if (p.state === 'exploding' && p.stateTimer <= 0) return false;
      return true;
    });
  }

  firePea(plant: Plant) {
    const s = this.state;
    const pea: Projectile = {
      x: plant.x + 20,
      y: plant.y - 5,
      row: plant.row,
      damage: PLANT_CONFIG.peashooter.damage,
      speed: PEA_SPEED,
      alive: true,
    };
    s.projectiles.push(pea);
  }

  updateProjectiles(dt: number) {
    const s = this.state;
    for (const pea of s.projectiles) {
      pea.x += pea.speed * dt;
      if (pea.x > CANVAS_W + 20) {
        pea.alive = false;
      }
    }
    s.projectiles = s.projectiles.filter(p => p.alive);
  }

  updateSuns(dt: number) {
    const s = this.state;
    for (const sun of s.suns) {
      sun.glowPhase += dt * 3;

      if (sun.state === 'falling') {
        sun.y += 80 * dt;
        if (sun.y >= sun.targetY) {
          sun.y = sun.targetY;
          sun.state = 'idle';
        }
      }

      if (sun.state === 'idle') {
        sun.timer -= dt;
        if (sun.timer <= 0) {
          sun.state = 'done';
        }
      }

      if (sun.state === 'collecting') {
        const dx = 60 - sun.x;
        const dy = 15 - sun.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 10) {
          s.sunCount += sun.value;
          sun.state = 'done';
        } else {
          const speed = 600;
          sun.x += (dx / dist) * speed * dt;
          sun.y += (dy / dist) * speed * dt;
          sun.scale = Math.max(0.3, sun.scale - dt * 2);
        }
      }
    }
    s.suns = s.suns.filter(sun => sun.state !== 'done');
  }

  updateParticles(dt: number) {
    const s = this.state;
    for (const p of s.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 200 * dt;
      p.life -= dt;
      p.alpha = Math.max(0, p.life / p.maxLife);
    }
    s.particles = s.particles.filter(p => p.life > 0);
  }

  spawnDeathParticles(x: number, y: number, type: ZombieType) {
    const s = this.state;
    const colors = type === 'bucket' ? ['#888', '#666', '#aaa', '#555'] :
                   type === 'cone' ? ['#ff8c00', '#ff6600', '#ffaa00', '#cc5500'] :
                   ['#6b8e6b', '#8fbc8f', '#556b2f', '#7a8b7a'];
    for (let i = 0; i < 15; i++) {
      s.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 200,
        vy: -Math.random() * 200 - 50,
        life: 0.5 + Math.random() * 0.5,
        maxLife: 0.5 + Math.random() * 0.5,
        size: 3 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
      });
    }
  }

  spawnExplosionParticles(x: number, y: number) {
    const s = this.state;
    const colors = ['#ff0000', '#ff4444', '#ff8888', '#ffcc00', '#ff6600', '#ffaa00'];
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 300;
      s.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 100,
        life: 0.4 + Math.random() * 0.6,
        maxLife: 0.4 + Math.random() * 0.6,
        size: 4 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
      });
    }
  }

  checkCollisions() {
    const s = this.state;
    for (const pea of s.projectiles) {
      if (!pea.alive) continue;
      for (const zombie of s.zombies) {
        if (zombie.state === 'dying') continue;
        if (zombie.row === pea.row &&
            Math.abs(zombie.x - pea.x) < 25 &&
            Math.abs(zombie.y - pea.y) < 30) {
          zombie.hp -= pea.damage;
          zombie.flashTimer = 0.1;
          pea.alive = false;
          s.particles.push({
            x: pea.x, y: pea.y,
            vx: -50 + Math.random() * 20,
            vy: -30 + Math.random() * 20,
            life: 0.2, maxLife: 0.2,
            size: 3, color: '#7fff00', alpha: 1,
          });
          break;
        }
      }
    }
  }

  checkWinLose() {
    const s = this.state;
    for (const zombie of s.zombies) {
      if (zombie.x < GRID_LEFT - 30 && zombie.state !== 'dying') {
        s.gameStatus = GAME_STATES.LOST;
        return;
      }
    }

    const aliveZombies = s.zombies.filter(z => z.state !== 'dying').length;
    const allSpawned = s.currentWave >= s.totalWaves;

    if (allSpawned && aliveZombies === 0 && s.waveZombiesRemaining <= 0) {
      s.gameStatus = GAME_STATES.WON;
      return;
    }

    if (s.waveActive && s.waveZombiesRemaining <= 0 && aliveZombies === 0) {
      s.waveActive = false;
      s.currentWave++;
      if (s.currentWave < s.totalWaves) {
        s.waveTimer = WAVE_CONFIG[s.currentWave].delay;
      }
    }
  }

  handleCellClick(row: number, col: number) {
    const s = this.state;
    if (s.gameStatus !== GAME_STATES.PLAYING) return;

    if (s.selectedTool === 'shovel') {
      const plant = s.grid[row][col];
      if (plant) {
        plant.state = 'dying';
        plant.stateTimer = 0.3;
        s.grid[row][col] = null;
        s.selectedTool = null;
      }
      return;
    }

    if (s.selectedPlant) {
      if (s.grid[row][col]) return;
      const config = PLANT_CONFIG[s.selectedPlant];
      if (s.sunCount < config.cost) return;

      const card = s.plantCards.find(c => c.type === s.selectedPlant);
      if (!card || !card.ready) return;

      s.sunCount -= config.cost;
      card.ready = false;
      card.cooldownTimer = card.maxCooldown;

      const plant = this.createPlant(s.selectedPlant, row, col);
      s.plants.push(plant);
      s.grid[row][col] = plant;

      if (s.selectedPlant === PLANT_TYPES.CHERRYBOMB) {
        plant.state = 'exploding';
        plant.stateTimer = 0.8;
        this.spawnExplosionParticles(plant.x, plant.y);
        this.cherryBombExplode(row, col);
      }

      s.selectedPlant = null;
    }
  }

  createPlant(type: PlantType, row: number, col: number): Plant {
    const config = PLANT_CONFIG[type];
    return {
      type,
      row,
      col,
      x: GRID_LEFT + col * CELL_W + CELL_W / 2,
      y: GRID_TOP + row * CELL_H + CELL_H / 2,
      hp: config.hp,
      maxHp: config.hp,
      animTimer: 0,
      animFrame: 0,
      attackTimer: 0,
      state: 'idle',
      stateTimer: 0,
      produceTimer: 0,
      swayOffset: 0,
      placeTimer: 0.3,
    };
  }

  cherryBombExplode(row: number, col: number) {
    const s = this.state;
    const cx = GRID_LEFT + col * CELL_W + CELL_W / 2;
    const cy = GRID_TOP + row * CELL_H + CELL_H / 2;
    const radius = CHERRY_EXPLOSION_RADIUS;

    for (const zombie of s.zombies) {
      if (zombie.state === 'dying') continue;
      const zCol = Math.floor((zombie.x - GRID_LEFT) / CELL_W);
      if (Math.abs(zombie.row - row) <= radius && Math.abs(zCol - col) <= radius) {
        zombie.hp -= PLANT_CONFIG.cherrybomb.damage;
        zombie.flashTimer = 0.2;
      }
    }

    for (let r = row - radius; r <= row + radius; r++) {
      for (let c = col - radius; c <= col + radius; c++) {
        if (r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS) {
          const plant = s.grid[r][c];
          if (plant && plant.type !== PLANT_TYPES.CHERRYBOMB) {
            plant.hp -= 300;
            if (plant.hp <= 0) {
              plant.state = 'dying';
              plant.stateTimer = 0.3;
              s.grid[r][c] = null;
            }
          }
        }
      }
    }
  }

  handleSunClick(sun: Sun) {
    if (sun.state === 'idle' || sun.state === 'falling') {
      sun.state = 'collecting';
    }
  }

  selectPlant(type: PlantType) {
    const s = this.state;
    if (s.gameStatus !== GAME_STATES.PLAYING) return;
    if (s.selectedPlant === type) {
      s.selectedPlant = null;
      return;
    }
    const card = s.plantCards.find(c => c.type === type);
    if (!card || !card.ready) return;
    const config = PLANT_CONFIG[type];
    if (s.sunCount < config.cost) return;
    s.selectedPlant = type;
    s.selectedTool = null;
  }

  selectShovel() {
    const s = this.state;
    if (s.gameStatus !== GAME_STATES.PLAYING) return;
    if (s.selectedTool === 'shovel') {
      s.selectedTool = null;
      return;
    }
    s.selectedTool = 'shovel';
    s.selectedPlant = null;
  }

  clearSelection() {
    this.state.selectedPlant = null;
    this.state.selectedTool = null;
  }
}
