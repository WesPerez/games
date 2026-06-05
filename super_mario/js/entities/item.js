class Item {
    constructor(x, y, type) {
        this.x = x; this.y = y;
        this.w = 16; this.h = 16;
        this.vx = 0; this.vy = 0;
        this.type = type;
        this.isGrounded = false;
        this.isEmerging = true;
        this.emergeY = y;
        this.emergeTarget = y - 16;
        this.isAlive = true;
        this.animTimer = 0;
    }
    update(physics) {
        if (this.isEmerging) {
            this.y -= 1;
            if (this.y <= this.emergeTarget) {
                this.y = this.emergeTarget;
                this.isEmerging = false;
                if (this.type === 'mushroom' || this.type === 'oneup' || this.type === 'star') {
                    this.vx = 1.5;
                }
            }
            return;
        }
        if (this.type === 'coin_popup') {
            this.vy = -3;
            this.y += this.vy;
            this.animTimer++;
            if (this.animTimer > 20) this.isAlive = false;
            return;
        }
        physics.update(this);
    }
    getSpriteName() {
        switch (this.type) {
            case 'mushroom': return 'item_mushroom';
            case 'oneup': return 'item_oneup';
            case 'fire': return 'item_fireflower';
            case 'ice': return 'item_iceflower';
            case 'star': return 'item_star';
            case 'coin_popup':
            case 'coin': {
                const frame = Math.floor(Date.now() / 200) % 4;
                return 'item_coin_' + frame;
            }
            default: return null;
        }
    }
    draw(ctx, camera) {
        if (!this.isAlive) return;
        const s = camera.toScreen(this.x, this.y);
        const spriteName = this.getSpriteName();
        if (spriteName) {
            const sprite = getSprite(spriteName);
            if (sprite) {
                ctx.drawImage(sprite, s.x, s.y);
            }
        }
    }
}

class Coin {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.w = 16; this.h = 16;
        this.isAlive = true;
        this.collected = false;
    }
    draw(ctx, camera) {
        if (this.collected) return;
        const s = camera.toScreen(this.x, this.y);
        const frame = Math.floor(Date.now() / 200) % 4;
        const sprite = getSprite('item_coin_' + frame);
        if (sprite) {
            ctx.drawImage(sprite, s.x, s.y);
        }
    }
}
