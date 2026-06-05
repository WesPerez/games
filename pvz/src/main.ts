import { Game } from './game';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
if (!canvas) throw new Error('Canvas not found');

const game = new Game(canvas);
game.start();
