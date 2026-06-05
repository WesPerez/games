class ScorePopup {
    constructor(x, y, score) {
        this.x = x;
        this.y = y;
        this.score = score;
        this.life = 30;
        this.vy = -1.5;
        this.isAlive = true;
    }
    update() {
        this.y += this.vy;
        this.life--;
        if (this.life <= 0) this.isAlive = false;
        this.vy -= 0.02;
    }
    draw(ctx, camera) {
        if (!this.isAlive) return;
        const s = camera.toScreen(this.x, this.y);
        ctx.fillStyle = '#fff';
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(this.score === '1UP' ? '1UP' : String(this.score), s.x + 8, s.y);
    }
}