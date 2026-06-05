const BLOCK_TYPES = {
    EMPTY: 0, GROUND: 1, BRICK: 2, QUESTION: 3, USED: 4,
    HARD: 5, PIPE_TL: 6, PIPE_TR: 7, PIPE_BL: 8, PIPE_BR: 9,
    FLAG_POLE: 10, FLAG_TOP: 11, INVISIBLE: 12
};

const BLOCK_SPRITE_MAP = {
    [BLOCK_TYPES.GROUND]: 'block_ground',
    [BLOCK_TYPES.BRICK]: 'block_brick',
    [BLOCK_TYPES.QUESTION]: 'block_question',
    [BLOCK_TYPES.USED]: 'block_used',
    [BLOCK_TYPES.HARD]: 'block_hard',
    [BLOCK_TYPES.PIPE_TL]: 'pipe_tl',
    [BLOCK_TYPES.PIPE_TR]: 'pipe_tr',
    [BLOCK_TYPES.PIPE_BL]: 'pipe_bl',
    [BLOCK_TYPES.PIPE_BR]: 'pipe_br',
    [BLOCK_TYPES.FLAG_POLE]: 'flag_pole',
    [BLOCK_TYPES.FLAG_TOP]: 'flag_top'
};

class Block {
    constructor(x, y, type, content) {
        this.x = x; this.y = y;
        this.w = 16; this.h = 16;
        this.type = type;
        this.content = content || null;
        this.isUsed = false;
        this.bumpTimer = 0;
        this.bumpOffset = 0;
        this.breakTimer = 0;
        this.breaking = false;
        this.breakParticles = [];
    }
    bump() {
        if (this.bumpTimer > 0) return;
        this.bumpTimer = 8;
    }
    break() {
        this.breaking = true;
        this.breakTimer = 30;
        this.breakParticles = [];
        for (let i = 0; i < 4; i++) {
            this.breakParticles.push({
                x: this.x + (i % 2) * 8, y: this.y + Math.floor(i / 2) * 8,
                vx: (i % 2 === 0 ? -2 : 2) + Math.random() * 2 - 1,
                vy: -4 - Math.random() * 3
            });
        }
    }
    update() {
        if (this.bumpTimer > 0) {
            this.bumpTimer--;
            this.bumpOffset = this.bumpTimer > 4 ? -(8 - this.bumpTimer) : -this.bumpTimer;
        } else {
            this.bumpOffset = 0;
        }
        if (this.breaking) {
            this.breakTimer--;
            for (const p of this.breakParticles) {
                p.x += p.vx; p.y += p.vy; p.vy += 0.4;
            }
        }
    }
    isSolid() {
        return this.type !== BLOCK_TYPES.EMPTY &&
               this.type !== BLOCK_TYPES.FLAG_POLE &&
               this.type !== BLOCK_TYPES.FLAG_TOP;
    }
    getSpriteName() {
        if (this.type === BLOCK_TYPES.QUESTION) {
            if (this.isUsed) return 'block_used';
            const frame = Math.floor(Date.now() / 300) % 4;
            return 'block_question_' + frame;
        }
        return BLOCK_SPRITE_MAP[this.type] || null;
    }
    draw(ctx, camera) {
        if (this.breaking) {
            if (this.breakTimer <= 0) return;
            ctx.fillStyle = '#c84c09';
            for (const p of this.breakParticles) {
                const s = camera.toScreen(p.x, p.y);
                ctx.fillRect(s.x, s.y, 8, 8);
            }
            return;
        }
        const s = camera.toScreen(this.x, this.y + this.bumpOffset);
        const spriteName = this.getSpriteName();
        if (spriteName) {
            const sprite = getSprite(spriteName);
            if (sprite) {
                ctx.drawImage(sprite, s.x, s.y);
                return;
            }
        }
    }
}
