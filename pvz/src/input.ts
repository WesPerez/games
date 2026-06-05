import { Game } from './game';
import { GRID_LEFT, GRID_TOP, CELL_W, CELL_H, GRID_COLS, GRID_ROWS, TOP_BAR_H, CANVAS_W, CANVAS_H } from './constants';

export class InputHandler {
  canvas: HTMLCanvasElement;
  game: Game;

  constructor(canvas: HTMLCanvasElement, game: Game) {
    this.canvas = canvas;
    this.game = game;
    this.setupListeners();
  }

  setupListeners() {
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('click', (e) => this.onClick(e));
    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.game.clearSelection();
    });
    document.addEventListener('keydown', (e) => this.onKeyDown(e));
  }

  onKeyDown(e: KeyboardEvent) {
    if (e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      this.game.togglePause();
    }
  }

  getCanvasPos(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  onMouseMove(e: MouseEvent) {
    const { x, y } = this.getCanvasPos(e);
    const s = this.game.state;
    s.mouseX = x;
    s.mouseY = y;

    if (y >= GRID_TOP && y < GRID_TOP + GRID_ROWS * CELL_H &&
        x >= GRID_LEFT && x < GRID_LEFT + GRID_COLS * CELL_W) {
      const col = Math.floor((x - GRID_LEFT) / CELL_W);
      const row = Math.floor((y - GRID_TOP) / CELL_H);
      s.hoveredCell = { row, col };
    } else {
      s.hoveredCell = null;
    }
  }

  onClick(e: MouseEvent) {
    const { x, y } = this.getCanvasPos(e);
    const s = this.game.state;

    // Handle start screen click
    if (s.screenState === 'start') {
      this.checkStartScreenClick(x, y);
      return;
    }

    if (s.gameStatus !== 'playing') {
      this.checkDialogClick(x, y);
      return;
    }

    if (this.checkSunClick(x, y)) return;
    if (this.checkToolbarClick(x, y)) return;
    if (this.checkGridClick(x, y)) return;

    this.game.clearSelection();
  }

  checkStartScreenClick(x: number, y: number) {
    // Start button position
    const btnW = 220;
    const btnH = 55;
    const btnX = CANVAS_W / 2 - btnW / 2;
    const btnY = 340;

    if (x >= btnX && x <= btnX + btnW && y >= btnY && y <= btnY + btnH) {
      this.game.startGame();
    }
  }

  checkSunClick(x: number, y: number): boolean {
    const s = this.game.state;
    for (const sun of s.suns) {
      const dx = x - sun.x;
      const dy = y - sun.y;
      if (dx * dx + dy * dy < 25 * 25) {
        this.game.handleSunClick(sun);
        return true;
      }
    }
    return false;
  }

  checkToolbarClick(x: number, y: number): boolean {
    const s = this.game.state;
    const cardStartX = 100;
    const cardY = 10;
    const cardW = 60;
    const cardH = 70;
    const cardGap = 8;

    for (let i = 0; i < s.plantCards.length; i++) {
      const cx = cardStartX + i * (cardW + cardGap);
      if (x >= cx && x <= cx + cardW && y >= cardY && y <= cardY + cardH) {
        this.game.selectPlant(s.plantCards[i].type);
        return true;
      }
    }

    const shovelX = cardStartX + s.plantCards.length * (cardW + cardGap) + 10;
    if (x >= shovelX && x <= shovelX + cardW && y >= cardY && y <= cardY + cardH) {
      this.game.selectShovel();
      return true;
    }

    return false;
  }

  checkGridClick(x: number, y: number): boolean {
    if (y >= GRID_TOP && y < GRID_TOP + GRID_ROWS * CELL_H &&
        x >= GRID_LEFT && x < GRID_LEFT + GRID_COLS * CELL_W) {
      const col = Math.floor((x - GRID_LEFT) / CELL_W);
      const row = Math.floor((y - GRID_TOP) / CELL_H);
      this.game.handleCellClick(row, col);
      return true;
    }
    return false;
  }

  checkDialogClick(x: number, y: number) {
    const s = this.game.state;
    if (s.gameStatus === 'won' || s.gameStatus === 'lost') {
      const btnX = CANVAS_W / 2 - 80;
      const btnY = 380;
      const btnW = 160;
      const btnH = 45;
      if (x >= btnX && x <= btnX + btnW && y >= btnY && y <= btnY + btnH) {
        this.game.restart();
      }
    }
  }
}