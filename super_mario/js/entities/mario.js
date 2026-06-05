const MARIO_STATES = { SMALL: 0, BIG: 1, FIRE: 2 };
const MARIO_SIZES = {
    [MARIO_STATES.SMALL]: { w: 16, h: 16 },
    [MARIO_STATES.BIG]:   { w: 16, h: 32 },
    [MARIO_STATES.FIRE]:  { w: 16, h: 32 }
};

class Mario {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.vx = 0; this.vy = 0;
        this.w = 16; this.h = 16;
        this.state = MARIO_STATES.SMALL;
        this.facing = 1;
        this.isGrounded = false;
        this.isDead = false;
        this.lives = 3;
        this.coins = 0;
        this.score = 0;
        this.invincibleTimer = 0;
        this.deathTimer = 0;
        this.winTimer = 0;
        this.isWinning = false;
        this.maxSpeed = 3;
        this.accel = 0.15;
        this.decel = 0.1;
        this.jumpForce = -7.5;
        this.jumpHoldForce = -0.3;
        this.jumpHoldTimer = 0;
        this.maxJumpHold = 15;
        this.isJumping = false;
        this.animFrame = 0;
        this.animTimer = 0;
        this.stompCombo = 0;
        this.fireCooldown = 0;
        this.isCrouching = false;
        this.setSize();
    }
    setSize() {
        const s = MARIO_SIZES[this.state];
        this.w = s.w; this.h = s.h;
    }
    update(input, physics) {
        if (this.isDead) {
            this.deathTimer++;
            if (this.deathTimer < 20) this.vy = -4;
            else physics.applyGravity(this);
            this.y += this.vy;
            return;
        }
        if (this.isWinning) {
            this.winTimer++;
            if (this.winTimer < 60) { this.vy = 2; this.y += this.vy; }
            else { this.vx = 1.5; this.x += this.vx; }
            return;
        }
        if (this.invincibleTimer > 0) this.invincibleTimer--;
        if (this.fireCooldown > 0) this.fireCooldown--;

        this.isCrouching = false;
        if (this.state >= MARIO_STATES.BIG && input.isDown('down') && this.isGrounded) {
            this.isCrouching = true;
        }

        let moving = false;
        if (!this.isCrouching) {
            if (input.isDown('left')) {
                this.vx -= this.accel;
                this.facing = -1;
                moving = true;
            } else if (input.isDown('right')) {
                this.vx += this.accel;
                this.facing = 1;
                moving = true;
            }
        }
        if (!moving) {
            if (this.vx > 0) { this.vx -= this.decel; if (this.vx < 0) this.vx = 0; }
            else if (this.vx < 0) { this.vx += this.decel; if (this.vx > 0) this.vx = 0; }
        }
        if (this.vx > this.maxSpeed) this.vx = this.maxSpeed;
        if (this.vx < -this.maxSpeed) this.vx = -this.maxSpeed;

        if (input.justPressed('jump') && this.isGrounded) {
            this.vy = this.jumpForce;
            this.isJumping = true;
            this.jumpHoldTimer = 0;
            this.isGrounded = false;
            if (this._onJump) this._onJump();
        }
        if (input.isDown('jump') && this.isJumping && this.jumpHoldTimer < this.maxJumpHold) {
            this.vy += this.jumpHoldForce;
            this.jumpHoldTimer++;
        }
        if (!input.isDown('jump')) this.isJumping = false;

        if (this.state === MARIO_STATES.FIRE && input.justPressed('fire') && this.fireCooldown <= 0) {
            this.shootFireball();
        }

        const originalH = this.h;
        if (this.isCrouching) {
            this.h = 24;
        }
        physics.update(this);
        this.h = originalH;

        this.animTimer++;
        if (this.animTimer > 6) { this.animTimer = 0; this.animFrame++; }
    }
    shootFireball() {
        if (typeof game === 'undefined' || !game.fireballs) return;
        if (game.fireballs.length >= 2) return;
        this.fireCooldown = 20;
        const fb = new Fireball(
            this.x + (this.facing > 0 ? this.w : -8),
            this.y + this.h / 2 - 4,
            this.facing
        );
        game.fireballs.push(fb);
        game.audio.playSound('fireball');
    }
    takeDamage(audio) {
        if (this.invincibleTimer > 0) return false;
        if (this.state === MARIO_STATES.SMALL) {
            this.die(audio);
            return true;
        }
        this.state--;
        this.setSize();
        this.y += 16;
        this.invincibleTimer = 120;
        audio.playSound('hurt');
        return true;
    }
    die(audio) {
        this.isDead = true;
        this.deathTimer = 0;
        this.vy = -4;
        this.vx = 0;
        audio.playSound('death');
    }
    powerUp(type, audio) {
        if (type === 'mushroom' && this.state === MARIO_STATES.SMALL) {
            this.state = MARIO_STATES.BIG;
            this.setSize();
            this.y -= 16;
            audio.playSound('powerup');
        } else if (type === 'fire' && this.state === MARIO_STATES.BIG) {
            this.state = MARIO_STATES.FIRE;
            audio.playSound('powerup');
        } else if (type === 'mushroom' && this.state >= MARIO_STATES.BIG) {
            this.score += 1000;
            audio.playSound('powerup');
        }
    }
    addCoin(audio) {
        this.coins++;
        this.score += 100;
        audio.playSound('coin');
        if (this.coins >= 100) {
            this.coins -= 100;
            this.lives++;
            audio.playSound('oneup');
        }
    }
    getSpriteName() {
        if (this.isDead) {
            return 'mario_small_dead';
        }
        const prefix = this.state === MARIO_STATES.SMALL ? 'mario_small' :
                       this.state === MARIO_STATES.BIG ? 'mario_big' : 'mario_fire';
        if (this.isCrouching && this.state >= MARIO_STATES.BIG) {
            return 'mario_big_crouch';
        }
        if (!this.isGrounded) {
            return prefix + '_jump';
        }
        if (Math.abs(this.vx) > 0.5) {
            const walkFrame = (Math.floor(this.animFrame / 2) % 3) + 1;
            return prefix + '_walk' + walkFrame;
        }
        return prefix + '_stand';
    }
    draw(ctx, camera) {
        if (this.isDead && this.deathTimer > 120) return;
        if (this.invincibleTimer > 0 && Math.floor(this.invincibleTimer / 4) % 2 === 0) return;

        const spriteName = this.getSpriteName();
        const sprite = getSprite(spriteName);
        if (!sprite) return;

        const s = camera.toScreen(this.x, this.y);

        ctx.save();
        if (this.facing < 0) {
            ctx.translate(s.x + this.w, s.y);
            ctx.scale(-1, 1);
            ctx.drawImage(sprite, 0, 0);
        } else {
            ctx.drawImage(sprite, s.x, s.y);
        }
        ctx.restore();
    }
}


