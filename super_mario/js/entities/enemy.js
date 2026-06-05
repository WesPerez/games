class Enemy {
    constructor(x, y, type) {
        this.x = x; this.y = y;
        this.w = 16; this.h = 16;
        this.vx = -1; this.vy = 0;
        this.type = type || 'goomba';
        this.isAlive = true;
        this.isGrounded = false;
        this.squishTimer = 0;
        this.facing = -1;
        this.animTimer = 0;
        this.animFrame = 0;
    }
    update(physics) {
        if (!this.isAlive) {
            this.squishTimer++;
            return;
        }
        this.animTimer++;
        if (this.animTimer > 10) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 2;
        }
        physics.update(this);
    }
    checkCliff(groundTiles) {
        if (!this.isAlive || !this.isGrounded) return;
        const checkX = this.x + (this.vx > 0 ? this.w : -1);
        const checkY = this.y + this.h + 1;
        let groundFound = false;
        for (const g of groundTiles) {
            if (checkX + this.w > g.x && checkX < g.x + g.w &&
                checkY >= g.y && checkY < g.y + g.h + 4) {
                groundFound = true;
                break;
            }
        }
        if (!groundFound) {
            this.vx = -this.vx;
            this.facing = this.vx > 0 ? 1 : -1;
        }
    }
    squash(audio) {
        if (this.type === 'koopa') {
            this.isAlive = false;
            this.squishTimer = 0;
            audio.playSound('stomp');
            return 'shell';
        }
        this.isAlive = false;
        this.h = 8;
        this.y += 8;
        this.vx = 0;
        this.vy = 0;
        this.squishTimer = 0;
        audio.playSound('stomp');
        return null;
    }
    draw(ctx, camera) {
        if (!this.isAlive && this.squishTimer > 30) return;
        const s = camera.toScreen(this.x, this.y);

        if (!this.isAlive) {
            if (this.type === 'goomba') {
                const sprite = getSprite('goomba_squished');
                if (sprite) ctx.drawImage(sprite, s.x, s.y);
            }
            return;
        }

        if (this.type === 'goomba') {
            const sprite = getSprite('goomba_walk' + (this.animFrame + 1));
            if (sprite) ctx.drawImage(sprite, s.x, s.y);
        } else if (this.type === 'koopa') {
            const sprite = getSprite('koopa_walk' + (this.animFrame + 1));
            if (sprite) {
                ctx.save();
                if (this.vx < 0) {
                    ctx.translate(s.x + this.w, s.y);
                    ctx.scale(-1, 1);
                    ctx.drawImage(sprite, 0, 0);
                } else {
                    ctx.drawImage(sprite, s.x, s.y);
                }
                ctx.restore();
            }
        }
    }
}

class KoopaShell {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.w = 16; this.h = 14;
        this.vx = 0; this.vy = 0;
        this.isGrounded = false;
        this.moving = false;
        this.isAlive = true;
    }
    update(physics) {
        if (!this.isAlive) return;
        if (this.moving) {
            physics.update(this);
        } else {
            physics.applyGravity(this);
            this.y += this.vy;
        }
    }
    kick(dir, audio) {
        this.vx = dir * 6;
        this.moving = true;
        audio.playSound('stomp');
    }
    bounceWall() {
        if (this.moving) {
            this.vx = -this.vx;
        }
    }
    draw(ctx, camera) {
        if (!this.isAlive) return;
        const s = camera.toScreen(this.x, this.y);
        const sprite = getSprite('koopa_shell');
        if (sprite) ctx.drawImage(sprite, s.x, s.y);
    }
}
