import { GameState, Plant, Zombie, Sun, Particle, Projectile } from './types';
import { CANVAS_W, CANVAS_H, GRID_LEFT, GRID_TOP, CELL_W, CELL_H, GRID_COLS, GRID_ROWS, TOP_BAR_H, PLANT_CONFIG, PLANT_TYPES, GAME_STATES } from './constants';

export class Renderer {
  ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  render(state: GameState) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    this.drawBackground(state);
    this.drawLawn(state);
    this.drawHoverCell(state);
    this.drawPlants(state);
    this.drawProjectiles(state);
    this.drawZombies(state);
    this.drawSuns(state);
    this.drawParticles(state);
    this.drawTopBar(state);
    this.drawProgressBar(state);
    this.drawCursor(state);

    if (state.gameStatus === GAME_STATES.PLAYING && state.totalTime < 4) {
      this.drawStartHint(state);
    }

    if (state.gameStatus === GAME_STATES.WON || state.gameStatus === GAME_STATES.LOST) {
      this.drawDialog(state);
    }
  }

  drawBackground(state: GameState) {
    const ctx = this.ctx;
    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    grad.addColorStop(0, '#87CEEB');
    grad.addColorStop(0.25, '#a8d8ea');
    grad.addColorStop(0.4, '#b5d8a8');
    grad.addColorStop(1, '#4a7c3f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.fillStyle = '#5a9c4f';
    ctx.fillRect(0, TOP_BAR_H, CANVAS_W, CANVAS_H - TOP_BAR_H);

    const lawnGrad = ctx.createLinearGradient(0, TOP_BAR_H, 0, TOP_BAR_H + GRID_ROWS * CELL_H);
    lawnGrad.addColorStop(0, '#4a8c3f');
    lawnGrad.addColorStop(1, '#3d7a32');
    ctx.fillStyle = lawnGrad;
    ctx.fillRect(GRID_LEFT - 5, TOP_BAR_H, GRID_COLS * CELL_W + 10, GRID_ROWS * CELL_H + 10);

    ctx.fillStyle = '#3d3529';
    ctx.fillRect(0, GRID_TOP + GRID_ROWS * CELL_H + 5, CANVAS_W, CANVAS_H - GRID_TOP - GRID_ROWS * CELL_H - 5);

    const dirtGrad = ctx.createLinearGradient(0, GRID_TOP + GRID_ROWS * CELL_H + 5, 0, CANVAS_H);
    dirtGrad.addColorStop(0, '#4a3d2e');
    dirtGrad.addColorStop(1, '#2d2218');
    ctx.fillStyle = dirtGrad;
    ctx.fillRect(0, GRID_TOP + GRID_ROWS * CELL_H + 5, CANVAS_W, CANVAS_H - GRID_TOP - GRID_ROWS * CELL_H - 5);
  }

  drawLawn(state: GameState) {
    const ctx = this.ctx;
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const x = GRID_LEFT + c * CELL_W;
        const y = GRID_TOP + r * CELL_H;
        const light = (r + c) % 2 === 0;

        const cellGrad = ctx.createLinearGradient(x, y, x, y + CELL_H);
        if (light) {
          cellGrad.addColorStop(0, '#5cb85c');
          cellGrad.addColorStop(1, '#4da84d');
        } else {
          cellGrad.addColorStop(0, '#4cae4c');
          cellGrad.addColorStop(1, '#3d9e3d');
        }
        ctx.fillStyle = cellGrad;
        ctx.fillRect(x, y, CELL_W, CELL_H);

        if (light) {
          ctx.fillStyle = 'rgba(255,255,255,0.05)';
          ctx.fillRect(x + 2, y + 2, CELL_W - 4, CELL_H / 3);
        }

        ctx.strokeStyle = 'rgba(0,0,0,0.06)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x, y, CELL_W, CELL_H);
      }
    }

    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 2;
    ctx.strokeRect(GRID_LEFT, GRID_TOP, GRID_COLS * CELL_W, GRID_ROWS * CELL_H);

    ctx.strokeStyle = 'rgba(80,160,60,0.3)';
    ctx.lineWidth = 1;
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const x = GRID_LEFT + c * CELL_W;
        const y = GRID_TOP + (r + 1) * CELL_H;
        const seed = r * GRID_COLS + c;
        for (let g = 0; g < 3; g++) {
          const gx = x + 10 + ((seed * 7 + g * 23) % 60);
          const gh = 4 + ((seed * 3 + g * 11) % 6);
          ctx.beginPath();
          ctx.moveTo(gx, y);
          ctx.quadraticCurveTo(gx - 2, y - gh * 0.6, gx - 1, y - gh);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(gx + 3, y);
          ctx.quadraticCurveTo(gx + 5, y - gh * 0.5, gx + 4, y - gh + 1);
          ctx.stroke();
        }
      }
    }
  }

  drawHoverCell(state: GameState) {
    if (!state.hoveredCell) return;
    const ctx = this.ctx;
    const { row, col } = state.hoveredCell;
    const x = GRID_LEFT + col * CELL_W;
    const y = GRID_TOP + row * CELL_H;

    if (state.selectedPlant || state.selectedTool === 'shovel') {
      ctx.fillStyle = state.selectedTool === 'shovel'
        ? 'rgba(255,100,100,0.25)'
        : 'rgba(255,255,255,0.25)';
      ctx.fillRect(x, y, CELL_W, CELL_H);
      ctx.strokeStyle = state.selectedTool === 'shovel'
        ? 'rgba(255,100,100,0.6)'
        : 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, CELL_W - 2, CELL_H - 2);
    }
  }

  drawTopBar(state: GameState) {
    const ctx = this.ctx;
    const grad = ctx.createLinearGradient(0, 0, 0, TOP_BAR_H);
    grad.addColorStop(0, '#6b4422');
    grad.addColorStop(0.5, '#5c3a1e');
    grad.addColorStop(1, '#3d2510');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, TOP_BAR_H);

    ctx.fillStyle = '#2a1a0a';
    ctx.fillRect(0, TOP_BAR_H - 3, CANVAS_W, 3);

    const woodGrad = ctx.createLinearGradient(0, TOP_BAR_H - 6, 0, TOP_BAR_H);
    woodGrad.addColorStop(0, '#7a5a3a');
    woodGrad.addColorStop(1, '#5a3a1a');
    ctx.fillStyle = woodGrad;
    ctx.fillRect(0, TOP_BAR_H - 6, CANVAS_W, 3);

    this.drawSunCounter(state);
    this.drawPlantCards(state);
    this.drawShovel(state);
  }

  drawSunCounter(state: GameState) {
    const ctx = this.ctx;
    const x = 50;
    const y = 42;

    this.drawSunIcon(x, y, 18);

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 1;
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(state.sunCount), x, y + 28);
    ctx.restore();
  }

  drawSunIcon(x: number, y: number, r: number) {
    const ctx = this.ctx;
    ctx.save();

    const glow = ctx.createRadialGradient(x, y, r * 0.2, x, y, r * 1.8);
    glow.addColorStop(0, 'rgba(255,255,100,0.35)');
    glow.addColorStop(1, 'rgba(255,255,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, r * 1.8, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(angle) * r * 0.85, y + Math.sin(angle) * r * 0.85);
      ctx.lineTo(x + Math.cos(angle + 0.15) * r * 1.4, y + Math.sin(angle + 0.15) * r * 1.4);
      ctx.lineTo(x + Math.cos(angle - 0.15) * r * 1.4, y + Math.sin(angle - 0.15) * r * 1.4);
      ctx.closePath();
      ctx.fill();
    }

    const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
    grad.addColorStop(0, '#FFEE88');
    grad.addColorStop(0.5, '#FFD700');
    grad.addColorStop(1, '#FFA500');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,240,0.5)';
    ctx.beginPath();
    ctx.arc(x - r * 0.25, y - r * 0.25, r * 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawPlantCards(state: GameState) {
    const ctx = this.ctx;
    const startX = 100;
    const cardW = 60;
    const cardH = 70;
    const gap = 8;

    for (let i = 0; i < state.plantCards.length; i++) {
      const card = state.plantCards[i];
      const cx = startX + i * (cardW + gap);
      const cy = 8;
      const config = PLANT_CONFIG[card.type];
      const canAfford = state.sunCount >= config.cost;

      const cardGrad = ctx.createLinearGradient(cx, cy, cx, cy + cardH);
      if (state.selectedPlant === card.type) {
        cardGrad.addColorStop(0, '#7a5a2e');
        cardGrad.addColorStop(1, '#5a3a1e');
      } else {
        cardGrad.addColorStop(0, '#5a3a20');
        cardGrad.addColorStop(1, '#3a2510');
      }
      ctx.fillStyle = cardGrad;
      ctx.strokeStyle = state.selectedPlant === card.type ? '#FFD700' : '#6b5030';
      ctx.lineWidth = state.selectedPlant === card.type ? 3 : 1.5;
      this.roundRect(cx, cy, cardW, cardH, 6, true, true);

      if (!card.ready) {
        const progress = 1 - card.cooldownTimer / card.maxCooldown;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(cx + 2, cy + 2, cardW - 4, (cardH - 4) * (1 - progress));
      }

      if (!canAfford && card.ready) {
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(cx + 2, cy + 2, cardW - 4, cardH - 4);
      }

      this.drawPlantIcon(card.type, cx + cardW / 2, cy + 30, 0.4);

      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 2;
      ctx.fillStyle = canAfford ? '#FFD700' : '#ff6666';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(String(config.cost), cx + cardW / 2, cy + cardH - 3);
      ctx.restore();
    }
  }

  drawPlantIcon(type: string, x: number, y: number, scale: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    switch (type) {
      case PLANT_TYPES.SUNFLOWER:
        this.drawSunflowerShape(0, 0);
        break;
      case PLANT_TYPES.PEASHOOTER:
        this.drawPeashooterShape(0, 0);
        break;
      case PLANT_TYPES.WALLNUT:
        this.drawWallnutShape(0, 0, 1);
        break;
      case PLANT_TYPES.CHERRYBOMB:
        this.drawCherryBombShape(0, 0);
        break;
    }

    ctx.restore();
  }

  drawShovel(state: GameState) {
    const ctx = this.ctx;
    const startX = 100;
    const cardW = 60;
    const gap = 8;
    const sx = startX + state.plantCards.length * (cardW + gap) + 10;
    const sy = 8;
    const cardH = 70;

    const shovelGrad = ctx.createLinearGradient(sx, sy, sx, sy + cardH);
    if (state.selectedTool === 'shovel') {
      shovelGrad.addColorStop(0, '#7a5a2e');
      shovelGrad.addColorStop(1, '#5a3a1e');
    } else {
      shovelGrad.addColorStop(0, '#5a3a20');
      shovelGrad.addColorStop(1, '#3a2510');
    }
    ctx.fillStyle = shovelGrad;
    ctx.strokeStyle = state.selectedTool === 'shovel' ? '#FFD700' : '#6b5030';
    ctx.lineWidth = state.selectedTool === 'shovel' ? 3 : 1.5;
    this.roundRect(sx, sy, cardW, cardH, 6, true, true);

    ctx.save();
    ctx.translate(sx + cardW / 2, sy + 35);
    ctx.rotate(-0.3);
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(-3, -5, 6, 30);
    ctx.fillStyle = '#C0C0C0';
    ctx.beginPath();
    ctx.moveTo(-12, -5);
    ctx.lineTo(12, -5);
    ctx.lineTo(8, -18);
    ctx.lineTo(-8, -18);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#A0A0A0';
    ctx.fillRect(-10, -8, 20, 3);
    ctx.restore();
  }

  drawPlants(state: GameState) {
    for (const plant of state.plants) {
      this.drawPlant(plant, state);
    }
  }

  drawPlant(plant: Plant, state: GameState) {
    const ctx = this.ctx;
    if (plant.state === 'dying') {
      ctx.globalAlpha = Math.max(0, plant.stateTimer / 0.3);
    }
    if (plant.state === 'exploding') {
      ctx.globalAlpha = Math.max(0, plant.stateTimer / 0.8);
    }

    const px = plant.x;
    const py = plant.y + plant.swayOffset;

    ctx.save();
    ctx.translate(px, py);

    let scale = 1;
    if (plant.placeTimer > 0) {
      const t = 1 - plant.placeTimer / 0.3;
      scale = 1 + 0.3 * Math.sin(t * Math.PI);
    }
    if (plant.state === 'exploding') {
      scale = 1 + (0.8 - plant.stateTimer) * 2;
    }
    ctx.scale(scale, scale);

    switch (plant.type) {
      case PLANT_TYPES.SUNFLOWER:
        this.drawSunflowerShape(0, 0, plant);
        break;
      case PLANT_TYPES.PEASHOOTER:
        this.drawPeashooterShape(0, 0, plant);
        break;
      case PLANT_TYPES.WALLNUT:
        this.drawWallnutShape(0, 0, plant.hp / plant.maxHp);
        break;
      case PLANT_TYPES.CHERRYBOMB:
        this.drawCherryBombShape(0, 0, plant);
        break;
    }

    ctx.restore();
    ctx.globalAlpha = 1;
  }

  drawSunflowerShape(x: number, y: number, plant?: Plant) {
    const ctx = this.ctx;
    const sway = plant ? Math.sin(plant.animTimer * 3) * 3 : 0;

    ctx.fillStyle = '#3d7a2e';
    ctx.fillRect(x - 3, y + 10, 6, 25);

    ctx.fillStyle = '#4a9a3a';
    ctx.beginPath();
    ctx.ellipse(x - 12 + sway * 0.3, y + 20, 10, 5, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 12 + sway * 0.3, y + 22, 10, 5, 0.4, 0, Math.PI * 2);
    ctx.fill();

    const petalCount = 12;
    for (let i = 0; i < petalCount; i++) {
      const angle = (i / petalCount) * Math.PI * 2 + sway * 0.02;
      const px = x + Math.cos(angle) * 22;
      const py = y - 5 + Math.sin(angle) * 22;

      ctx.fillStyle = i % 2 === 0 ? '#FFD700' : '#FFC107';
      ctx.beginPath();
      ctx.ellipse(px, py, 10, 6, angle, 0, Math.PI * 2);
      ctx.fill();
    }

    const faceGrad = ctx.createRadialGradient(x - 3, y - 8, 2, x, y - 5, 14);
    faceGrad.addColorStop(0, '#8B4513');
    faceGrad.addColorStop(1, '#6B3410');
    ctx.fillStyle = faceGrad;
    ctx.beginPath();
    ctx.arc(x, y - 5, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(x - 5, y - 8, 2.5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 5, y - 8, 2.5, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x - 4, y - 9, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 6, y - 9, 1, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#4a2a10';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y - 2, 6, 0.1, Math.PI - 0.1);
    ctx.stroke();

    if (plant && plant.state === 'producing') {
      ctx.fillStyle = 'rgba(255,255,0,0.3)';
      ctx.beginPath();
      ctx.arc(x, y - 5, 25, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawPeashooterShape(x: number, y: number, plant?: Plant) {
    const ctx = this.ctx;
    const shooting = plant && plant.state === 'attacking';
    const recoil = shooting ? -3 : 0;

    ctx.fillStyle = '#3d7a2e';
    ctx.fillRect(x - 3, y + 10, 6, 25);

    ctx.fillStyle = '#4a9a3a';
    ctx.beginPath();
    ctx.ellipse(x - 14, y + 18, 11, 5, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 8, y + 22, 10, 5, 0.2, 0, Math.PI * 2);
    ctx.fill();

    const headGrad = ctx.createRadialGradient(x - 5, y - 10, 3, x, y - 5, 22);
    headGrad.addColorStop(0, '#7ddf64');
    headGrad.addColorStop(1, '#3d9a2e');
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.arc(x, y - 5, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#3d9a2e';
    ctx.beginPath();
    ctx.ellipse(x + 18 + recoil, y - 5, 12, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#2d7a1e';
    ctx.beginPath();
    ctx.ellipse(x + 22 + recoil, y - 5, 6, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1a5a10';
    ctx.beginPath();
    ctx.ellipse(x + 23 + recoil, y - 5, 3, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(x - 4, y - 10, 6, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 7, y - 10, 6, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(x - 2, y - 10, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 9, y - 10, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x - 1, y - 11, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 10, y - 11, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  drawWallnutShape(x: number, y: number, hpRatio: number) {
    const ctx = this.ctx;

    const bodyGrad = ctx.createRadialGradient(x - 8, y - 12, 5, x, y, 30);
    bodyGrad.addColorStop(0, '#d4a55a');
    bodyGrad.addColorStop(0.6, '#b8863a');
    bodyGrad.addColorStop(1, '#8B6914');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(x, y, 26, 32, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#7a5a14';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y, 26, 32, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.ellipse(x - 8, y - 15, 12, 8, -0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(x - 8, y - 5, 6, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 8, y - 5, 6, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(x - 6, y - 5, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 10, y - 5, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x - 5, y - 6, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 11, y - 6, 1.5, 0, Math.PI * 2);
    ctx.fill();

    if (hpRatio > 0.3) {
      ctx.strokeStyle = '#5a3a0a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y + 8, 8, 0.2, Math.PI - 0.2);
      ctx.stroke();
    } else {
      ctx.strokeStyle = '#5a3a0a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y + 5, 8, Math.PI + 0.3, -0.3);
      ctx.stroke();
    }

    if (hpRatio < 0.66) {
      ctx.strokeStyle = '#6a4a1a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x - 10, y - 20);
      ctx.lineTo(x - 5, y - 10);
      ctx.lineTo(x - 12, y - 5);
      ctx.stroke();
    }
    if (hpRatio < 0.33) {
      ctx.beginPath();
      ctx.moveTo(x + 8, y - 18);
      ctx.lineTo(x + 14, y - 8);
      ctx.lineTo(x + 6, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - 5, y + 10);
      ctx.lineTo(x + 5, y + 15);
      ctx.stroke();
    }
  }

  drawCherryBombShape(x: number, y: number, plant?: Plant) {
    const ctx = this.ctx;
    const pulse = plant && plant.state === 'exploding'
      ? Math.sin(plant.stateTimer * 20) * 5 : 0;

    ctx.strokeStyle = '#2d6a1e';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x - 5, y - 20);
    ctx.quadraticCurveTo(x, y - 35, x + 5, y - 20);
    ctx.stroke();

    ctx.fillStyle = '#3d8a2e';
    ctx.beginPath();
    ctx.ellipse(x + 8, y - 22, 8, 4, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x - 6, y - 24, 7, 3.5, -0.4, 0, Math.PI * 2);
    ctx.fill();

    const r1 = 16 + pulse;
    const r2 = 14 + pulse;

    const grad1 = ctx.createRadialGradient(x - 8, y - 8, 2, x - 8, y, r1);
    grad1.addColorStop(0, '#ff6666');
    grad1.addColorStop(0.5, '#ee2222');
    grad1.addColorStop(1, '#aa0000');
    ctx.fillStyle = grad1;
    ctx.beginPath();
    ctx.arc(x - 8, y, r1, 0, Math.PI * 2);
    ctx.fill();

    const grad2 = ctx.createRadialGradient(x + 10, y - 5, 2, x + 10, y + 3, r2);
    grad2.addColorStop(0, '#ff6666');
    grad2.addColorStop(0.5, '#ee2222');
    grad2.addColorStop(1, '#aa0000');
    ctx.fillStyle = grad2;
    ctx.beginPath();
    ctx.arc(x + 10, y + 3, r2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.arc(x - 12, y - 6, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 6, y - 3, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(x - 12, y - 2, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x - 4, y - 2, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 6, y + 1, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 14, y + 1, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#660000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x - 8, y + 8, 5, Math.PI + 0.3, -0.3);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + 10, y + 11, 4, Math.PI + 0.3, -0.3);
    ctx.stroke();
  }

  drawZombies(state: GameState) {
    const sorted = [...state.zombies].sort((a, b) => a.y - b.y);
    for (const zombie of sorted) {
      this.drawZombie(zombie, state);
    }
  }

  drawZombie(zombie: Zombie, state: GameState) {
    const ctx = this.ctx;

    if (zombie.state === 'dying') {
      ctx.globalAlpha = Math.max(0, zombie.stateTimer / 0.5);
    }

    const flash = zombie.flashTimer > 0;
    const bob = Math.sin(zombie.bobOffset) * 2;
    const walkCycle = zombie.state === 'walking' ? Math.sin(zombie.bobOffset * 1.5) : 0;
    const x = zombie.x;
    const y = zombie.y + bob;

    ctx.save();
    ctx.translate(x, y);

    if (flash) {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, Math.PI * 2);
      ctx.fill();
    }

    this.drawZombieBody(zombie, walkCycle);

    ctx.restore();
    ctx.globalAlpha = 1;

    if (zombie.hp < zombie.maxHp && zombie.state !== 'dying') {
      this.drawHealthBar(x, y - 45, zombie.hp / zombie.maxHp);
    }
  }

  drawZombieBody(zombie: Zombie, walkCycle: number) {
    const ctx = this.ctx;
    const legSwing = walkCycle * 8;

    ctx.fillStyle = '#4a4a5a';
    ctx.fillRect(-6 + legSwing * 0.5, 15, 5, 18);
    ctx.fillRect(1 - legSwing * 0.5, 15, 5, 18);

    ctx.fillStyle = '#3a3a4a';
    ctx.beginPath();
    ctx.ellipse(-4 + legSwing * 0.5, 33, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(3 - legSwing * 0.5, 33, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    const bodyGrad = ctx.createLinearGradient(-10, -5, 10, 15);
    bodyGrad.addColorStop(0, '#5a5a6a');
    bodyGrad.addColorStop(1, '#3a3a4a');
    ctx.fillStyle = bodyGrad;
    ctx.fillRect(-10, -5, 20, 22);

    ctx.fillStyle = '#4a4a5a';
    ctx.fillRect(-10, -5, 20, 3);

    const armSwing = zombie.state === 'attacking' ? Math.sin(Date.now() * 0.01) * 15 : walkCycle * 5;
    ctx.save();
    ctx.translate(-12, 0);
    ctx.rotate((-30 + armSwing) * Math.PI / 180);
    ctx.fillStyle = '#7a9a6a';
    ctx.fillRect(-3, 0, 5, 18);
    ctx.fillStyle = '#6a8a5a';
    ctx.beginPath();
    ctx.arc(0, 18, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(12, 0);
    ctx.rotate((30 - armSwing) * Math.PI / 180);
    ctx.fillStyle = '#7a9a6a';
    ctx.fillRect(-2, 0, 5, 18);
    ctx.fillStyle = '#6a8a5a';
    ctx.beginPath();
    ctx.arc(1, 18, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const headGrad = ctx.createRadialGradient(-3, -18, 3, 0, -15, 16);
    headGrad.addColorStop(0, '#8aaa7a');
    headGrad.addColorStop(1, '#5a7a4a');
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.ellipse(0, -15, 14, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(-5, -18, 5, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(6, -17, 4.5, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#300';
    ctx.beginPath();
    ctx.arc(-4, -18, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(7, -17, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-3, -19, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(8, -18, 1, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#3a4a2a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(1, -8, 5, 0.2, Math.PI - 0.2);
    ctx.stroke();

    ctx.fillStyle = '#4a3a2a';
    ctx.fillRect(-12, -28, 24, 4);
    ctx.fillRect(-8, -32, 16, 6);

    if (zombie.type === 'cone') {
      this.drawCone(zombie);
    } else if (zombie.type === 'bucket') {
      this.drawBucket(zombie);
    }
  }

  drawCone(zombie: Zombie) {
    const ctx = this.ctx;
    const coneHp = zombie.hp - 200;
    if (coneHp <= 0) return;

    const grad = ctx.createLinearGradient(-10, -50, 10, -25);
    grad.addColorStop(0, '#ff8c00');
    grad.addColorStop(0.5, '#ff6600');
    grad.addColorStop(1, '#cc4400');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -52);
    ctx.lineTo(-14, -28);
    ctx.lineTo(14, -28);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#aa3300';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.moveTo(-2, -48);
    ctx.lineTo(-8, -30);
    ctx.lineTo(-1, -30);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffaa44';
    ctx.fillRect(-14, -30, 28, 4);
  }

  drawBucket(zombie: Zombie) {
    const ctx = this.ctx;
    const bucketHp = zombie.hp - 200;
    if (bucketHp <= 0) {
      ctx.fillStyle = '#777';
      ctx.fillRect(-12, -30, 24, 6);
      return;
    }

    const grad = ctx.createLinearGradient(-12, -48, 12, -25);
    grad.addColorStop(0, '#aaa');
    grad.addColorStop(0.3, '#888');
    grad.addColorStop(0.7, '#666');
    grad.addColorStop(1, '#555');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-14, -28);
    ctx.lineTo(-10, -48);
    ctx.lineTo(10, -48);
    ctx.lineTo(14, -28);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#999';
    ctx.fillRect(-14, -30, 28, 4);
    ctx.fillRect(-12, -40, 24, 3);

    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(-8, -46, 4, 16);
  }

  drawHealthBar(x: number, y: number, ratio: number) {
    const ctx = this.ctx;
    const w = 30;
    const h = 4;

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x - w / 2, y, w, h);

    const color = ratio > 0.5 ? '#4caf50' : ratio > 0.25 ? '#ff9800' : '#f44336';
    ctx.fillStyle = color;
    ctx.fillRect(x - w / 2, y, w * ratio, h);

    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(x - w / 2, y, w, h);
  }

  drawProjectiles(state: GameState) {
    const ctx = this.ctx;
    for (const pea of state.projectiles) {
      if (!pea.alive) continue;

      const grad = ctx.createRadialGradient(pea.x - 2, pea.y - 2, 1, pea.x, pea.y, 7);
      grad.addColorStop(0, '#aaff55');
      grad.addColorStop(0.6, '#66cc22');
      grad.addColorStop(1, '#338800');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(pea.x, pea.y, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath();
      ctx.arc(pea.x - 2, pea.y - 2, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(100,255,50,0.2)';
      ctx.beginPath();
      ctx.arc(pea.x - 8, pea.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawSuns(state: GameState) {
    for (const sun of state.suns) {
      this.drawSun(sun);
    }
  }

  drawSun(sun: Sun) {
    const ctx = this.ctx;
    const pulse = Math.sin(sun.glowPhase) * 2;
    const r = 16 + pulse;
    const scale = sun.scale;

    ctx.save();
    ctx.translate(sun.x, sun.y);
    ctx.scale(scale, scale);

    const glow = ctx.createRadialGradient(0, 0, r * 0.3, 0, 0, r * 2);
    glow.addColorStop(0, 'rgba(255,255,100,0.3)');
    glow.addColorStop(1, 'rgba(255,255,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 2, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + sun.glowPhase * 0.1;
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * r * 0.8, Math.sin(angle) * r * 0.8);
      ctx.lineTo(Math.cos(angle + 0.18) * r * 1.3, Math.sin(angle + 0.18) * r * 1.3);
      ctx.lineTo(Math.cos(angle - 0.18) * r * 1.3, Math.sin(angle - 0.18) * r * 1.3);
      ctx.closePath();
      ctx.fill();
    }

    const grad = ctx.createRadialGradient(-3, -3, 1, 0, 0, r);
    grad.addColorStop(0, '#FFEE88');
    grad.addColorStop(0.5, '#FFD700');
    grad.addColorStop(1, '#FFA500');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFF8DC';
    ctx.beginPath();
    ctx.arc(-3, -3, r * 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawParticles(state: GameState) {
    const ctx = this.ctx;
    for (const p of state.particles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawProgressBar(state: GameState) {
    const ctx = this.ctx;
    const barY = CANVAS_H - 30;
    const barX = GRID_LEFT;
    const barW = GRID_COLS * CELL_W;
    const barH = 16;

    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    this.roundRect(barX, barY, barW, barH, 8, true, false);

    const progress = state.currentWave / state.totalWaves;
    if (progress > 0) {
      const fillGrad = ctx.createLinearGradient(barX, barY, barX + barW * progress, barY);
      fillGrad.addColorStop(0, '#4caf50');
      fillGrad.addColorStop(1, '#66bb6a');
      ctx.fillStyle = fillGrad;
      this.roundRect(barX, barY, barW * progress, barH, 8, true, false);
    }

    for (let i = 1; i < state.totalWaves; i++) {
      const flagX = barX + (i / state.totalWaves) * barW;
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.moveTo(flagX, barY - 2);
      ctx.lineTo(flagX + 10, barY - 10);
      ctx.lineTo(flagX, barY - 18);
      ctx.lineTo(flagX - 1, barY - 2);
      ctx.fill();
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(flagX - 1, barY - 18, 2, 18);
    }

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Wave ${Math.min(state.currentWave + 1, state.totalWaves)} / ${state.totalWaves}`, barX + barW / 2, barY + barH / 2);
  }

  drawCursor(state: GameState) {
    if (!state.selectedPlant) return;
    const ctx = this.ctx;
    ctx.globalAlpha = 0.6;
    this.drawPlantIcon(state.selectedPlant, state.mouseX, state.mouseY, 0.5);
    ctx.globalAlpha = 1;
  }

  drawDialog(state: GameState) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    const dw = 360;
    const dh = 220;
    const dx = (CANVAS_W - dw) / 2;
    const dy = (CANVAS_H - dh) / 2;

    const bgGrad = ctx.createLinearGradient(dx, dy, dx, dy + dh);
    bgGrad.addColorStop(0, state.gameStatus === GAME_STATES.WON ? '#2d5a1e' : '#5a1e1e');
    bgGrad.addColorStop(1, state.gameStatus === GAME_STATES.WON ? '#1a3a10' : '#3a1010');
    ctx.fillStyle = bgGrad;
    this.roundRect(dx, dy, dw, dh, 16, true, false);

    ctx.strokeStyle = state.gameStatus === GAME_STATES.WON ? '#66bb6a' : '#ef5350';
    ctx.lineWidth = 3;
    this.roundRect(dx, dy, dw, dh, 16, false, true);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      state.gameStatus === GAME_STATES.WON ? '🎉 胜利!' : '💀 失败!',
      CANVAS_W / 2, dy + 60
    );

    ctx.font = '16px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText(
      state.gameStatus === GAME_STATES.WON
        ? '你成功保卫了家园!'
        : '僵尸突破了防线...',
      CANVAS_W / 2, dy + 100
    );

    const btnW = 160;
    const btnH = 45;
    const btnX = CANVAS_W / 2 - btnW / 2;
    const btnY = dy + 140;

    const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH);
    btnGrad.addColorStop(0, '#ff9800');
    btnGrad.addColorStop(1, '#e65100');
    ctx.fillStyle = btnGrad;
    this.roundRect(btnX, btnY, btnW, btnH, 10, true, false);

    ctx.strokeStyle = '#ffcc80';
    ctx.lineWidth = 2;
    this.roundRect(btnX, btnY, btnW, btnH, 10, false, true);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('重新开始', CANVAS_W / 2, btnY + btnH / 2);
  }

  roundRect(x: number, y: number, w: number, h: number, r: number, fill: boolean, stroke: boolean) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  drawStartHint(state: GameState) {
    const ctx = this.ctx;
    const alpha = Math.min(1, (4 - state.totalTime) / 1.5);
    if (alpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(CANVAS_W / 2 - 200, CANVAS_H / 2 - 30, 400, 60);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('选择植物卡片，点击草坪种植', CANVAS_W / 2, CANVAS_H / 2 - 5);
    ctx.font = '14px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText('右键取消选择 | 点击阳光收集', CANVAS_W / 2, CANVAS_H / 2 + 18);
    ctx.restore();
  }
}
