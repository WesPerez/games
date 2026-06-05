class SpriteRenderer {
    constructor(ctx) {
        this.ctx = ctx;
    }
    drawSprite(ctx, name, x, y, w, h) {
        const sprite = getSprite(name);
        if (sprite) ctx.drawImage(sprite, x, y, w, h);
    }
    drawRect(x, y, w, h, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, w, h);
    }
    drawText(text, x, y, color, size, align) {
        this.ctx.fillStyle = color || '#fff';
        this.ctx.font = (size || 16) + 'px "Press Start 2P", monospace';
        this.ctx.textAlign = align || 'left';
        this.ctx.fillText(text, x, y);
    }
}
