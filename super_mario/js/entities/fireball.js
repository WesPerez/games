class Fireball {
    constructor(x, y, dir) {
        this.x = x; this.y = y;
        this.w = 8; this.h = 8;
        this.vx = dir * 4;
        this.vy = -4;
        this.isAlive = true;
        this.animTimer = 0;
        this.isGrounded = false;
        this.type = 'fire';
    }
    update(physics) {
        if (!this.isAlive) return;
        this.animTimer++;
        physics.applyGravity(this);
        this.x += this.vx;
        this.y += this.vy;
        if (this.y > 240) {
            this.isAlive = false;
        }
    }
    bounceOnGround(groundY) {
        if (this.vy > 0) {
            this.y = groundY - this.h;
            this.vy = -5;
        }
    }
    bounceOnWall() {
        this.vx = -this.vx;
        this.isAlive = false;
    }
    draw(ctx, camera) {
        if (!this.isAlive) return;
        const frame = Math.floor(this.animTimer / 4) % 2;
        const sprite = getSprite('fireball_' + frame);
        if (!sprite) return;
        const s = camera.toScreen(this.x, this.y);
        ctx.drawImage(sprite, s.x, s.y);
    }
}

class IceBall {
    constructor(x, y, dir) {
        this.x = x; this.y = y;
        this.w = 8; this.h = 8;
        this.vx = dir * 4;
        this.vy = -4;
        this.isAlive = true;
        this.animTimer = 0;
        this.isGrounded = false;
        this.type = 'ice';
    }
    update(physics) {
        if (!this.isAlive) return;
        this.animTimer++;
        physics.applyGravity(this);
        this.x += this.vx;
        this.y += this.vy;
        if (this.y > 240) {
            this.isAlive = false;
        }
    }
    bounceOnGround(groundY) {
        if (this.vy > 0) {
            this.y = groundY - this.h;
            this.vy = -5;
        }
    }
    bounceOnWall() {
        this.vx = -this.vx;
        this.isAlive = false;
    }
    draw(ctx, camera) {
        if (!this.isAlive) return;
        const frame = Math.floor(this.animTimer / 4) % 2;
        const sprite = getSprite('iceball_' + frame);
        if (!sprite) return;
        const s = camera.toScreen(this.x, this.y);
        ctx.drawImage(sprite, s.x, s.y);
    }
}