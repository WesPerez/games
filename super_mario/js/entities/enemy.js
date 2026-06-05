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
        this.frozen = false;
        this.frozenTimer = 0;
    }
    update(physics) {
        if (!this.isAlive) {
            this.squishTimer++;
            return;
        }
        if (this.frozen) {
            this.frozenTimer--;
            this.vx = 0;
            this.vy = 0;
            if (this.frozenTimer <= 0) {
                this.frozen = false;
                this.vx = this.facing;
            }
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
        if (this.type === 'buzzy') {
            this.isAlive = false;
            this.squishTimer = 0;
            audio.playSound('stomp');
            return 'buzzy_shell';
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

        // Frozen tint
        if (this.frozen) {
            ctx.save();
            ctx.globalAlpha = 0.7;
        }

        const anim = this.animFrame + 1;
        if (this.type === 'goomba') {
            const sprite = getSprite('goomba_walk' + anim);
            if (sprite) ctx.drawImage(sprite, s.x, s.y);
        } else if (this.type === 'koopa') {
            const sprite = getSprite('koopa_walk' + anim);
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
        } else if (this.type === 'buzzy') {
            const sprite = getSprite('buzzy_walk' + anim);
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
        } else if (this.type === 'spiny') {
            const sprite = getSprite('spiny_walk' + anim);
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
        } else if (this.type === 'hammerbro') {
            const sprite = getSprite('hammerbro_' + (this.animFrame % 2));
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

        if (this.frozen) {
            ctx.restore();
            // Draw ice overlay
            ctx.strokeStyle = '#80d8ff';
            ctx.lineWidth = 1;
            ctx.strokeRect(s.x, s.y, this.w, this.h);
        }
    }
}

class KoopaShell {
    constructor(x, y, type) {
        this.x = x; this.y = y;
        this.w = 16; this.h = 14;
        this.vx = 0; this.vy = 0;
        this.isGrounded = false;
        this.moving = false;
        this.isAlive = true;
        this.type = type || 'koopa';
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
        const spriteName = this.type === 'buzzy' ? 'buzzy_shell' : 'koopa_shell';
        const sprite = getSprite(spriteName);
        if (sprite) ctx.drawImage(sprite, s.x, s.y);
    }
}

class PiranhaPlant {
    constructor(x, y, pipeY) {
        this.x = x;
        this.y = y;
        this.baseY = y;
        this.pipeY = pipeY;
        this.w = 16;
        this.h = 16;
        this.isAlive = true;
        this.animTimer = 0;
        this.animFrame = 0;
        this.riseTimer = 0;
        this.state = 'hidden'; // hidden, rising, visible, falling
        this.hiddenTimer = 60 + Math.random() * 60;
        this.riseSpeed = 0.8;
        this.maxRise = 32;
    }
    update(mario) {
        if (!this.isAlive) return;
        this.animTimer++;
        if (this.animTimer > 15) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 2;
        }

        this.hiddenTimer--;
        if (this.state === 'hidden') {
            if (this.hiddenTimer <= 0) {
                this.state = 'rising';
            }
        } else if (this.state === 'rising') {
            this.y -= this.riseSpeed;
            if (this.y <= this.baseY - this.maxRise) {
                this.y = this.baseY - this.maxRise;
                this.state = 'visible';
                this.riseTimer = 60;
            }
        } else if (this.state === 'visible') {
            this.riseTimer--;
            if (this.riseTimer <= 0) {
                this.state = 'falling';
            }
        } else if (this.state === 'falling') {
            this.y += this.riseSpeed;
            if (this.y >= this.baseY) {
                this.y = this.baseY;
                this.state = 'hidden';
                this.hiddenTimer = 60 + Math.random() * 60;
            }
        }
    }
    draw(ctx, camera) {
        if (!this.isAlive || this.state === 'hidden') return;
        const s = camera.toScreen(this.x, this.y);
        const sprite = getSprite('piranha_plant_' + this.animFrame);
        if (sprite) {
            ctx.drawImage(sprite, s.x, s.y);
        }
    }
}

class Lakitu {
    constructor(x, y, patrolLeft, patrolRight) {
        this.x = x;
        this.y = y;
        this.w = 16;
        this.h = 16;
        this.vx = 1.5;
        this.vy = 0;
        this.isAlive = true;
        this.animTimer = 0;
        this.animFrame = 0;
        this.patrolLeft = patrolLeft;
        this.patrolRight = patrolRight;
        this.throwTimer = 60 + Math.random() * 60;
    }
    update(physics) {
        if (!this.isAlive) return;
        this.animTimer++;
        if (this.animTimer > 10) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 2;
        }
        this.x += this.vx;
        if (this.x > this.patrolRight) {
            this.x = this.patrolRight;
            this.vx = -1.5;
        } else if (this.x < this.patrolLeft) {
            this.x = this.patrolLeft;
            this.vx = 1.5;
        }
        this.throwTimer--;
        if (this.throwTimer <= 0) {
            this.throwTimer = 90 + Math.random() * 60;
            if (typeof game !== 'undefined' && game.enemies) {
                const spiny = new Enemy(this.x, this.y + 16, 'spiny');
                spiny.vx = (Math.random() > 0.5 ? 1 : -1) * 1;
                spiny.vy = -2;
                game.enemies.push(spiny);
            }
        }
    }
    squash(audio) {
        this.isAlive = false;
        audio.playSound('stomp');
        return null;
    }
    draw(ctx, camera) {
        if (!this.isAlive) return;
        const s = camera.toScreen(this.x, this.y);
        const sprite = getSprite('lakitu_' + this.animFrame);
        if (sprite) {
            ctx.drawImage(sprite, s.x, s.y);
        }
    }
}

class HammerBro {
    constructor(x, y, patrolLeft, patrolRight) {
        this.x = x;
        this.y = y;
        this.w = 16;
        this.h = 16;
        this.vx = 0.8;
        this.vy = 0;
        this.isAlive = true;
        this.isGrounded = true;
        this.animTimer = 0;
        this.animFrame = 0;
        this.patrolLeft = patrolLeft;
        this.patrolRight = patrolRight;
        this.throwTimer = 60;
        this.facing = -1;
        this.jumpTimer = 0;
        this.isJumping = false;
    }
    update(physics) {
        if (!this.isAlive) return;
        this.animTimer++;
        if (this.animTimer > 8) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 2;
        }

        this.x += this.vx;
        this.facing = this.vx > 0 ? 1 : -1;

        if (this.x > this.patrolRight) {
            this.x = this.patrolRight;
            this.vx = -0.8;
        } else if (this.x < this.patrolLeft) {
            this.x = this.patrolLeft;
            this.vx = 0.8;
        }

        this.jumpTimer++;
        if (this.jumpTimer > 60 && this.isGrounded) {
            this.vy = -6;
            this.isGrounded = false;
            this.jumpTimer = 0;
        }
        physics.update(this);

        this.throwTimer--;
        if (this.throwTimer <= 0) {
            this.throwTimer = 40 + Math.random() * 40;
            if (typeof game !== 'undefined' && game.hammers) {
                const hm = new Hammer(this.x, this.y, this.facing);
                game.hammers.push(hm);
                if (game.audio) game.audio.playSound('fireball');
            }
        }
    }
    squash(audio) {
        this.isAlive = false;
        this.h = 8;
        this.y += 8;
        this.vx = 0;
        this.vy = 0;
        audio.playSound('stomp');
        return null;
    }
    draw(ctx, camera) {
        if (!this.isAlive) return;
        const s = camera.toScreen(this.x, this.y);
        const sprite = getSprite('hammerbro_' + this.animFrame);
        if (sprite) {
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
}

class Hammer {
    constructor(x, y, dir) {
        this.x = x;
        this.y = y;
        this.w = 12;
        this.h = 12;
        this.vx = dir * 2;
        this.vy = -5;
        this.isAlive = true;
        this.animTimer = 0;
        this.isGrounded = false;
    }
    update(physics) {
        if (!this.isAlive) return;
        this.animTimer++;
        physics.applyGravity(this);
        this.x += this.vx;
        this.y += this.vy;
        if (this.y > 300) this.isAlive = false;
    }
    draw(ctx, camera) {
        if (!this.isAlive) return;
        const s = camera.toScreen(this.x, this.y);
        const frame = Math.floor(this.animTimer / 4) % 2;
        const sprite = getSprite('hammer_' + frame);
        if (sprite) {
            ctx.drawImage(sprite, s.x, s.y);
        } else {
            ctx.fillStyle = '#888';
            ctx.fillRect(s.x + 2, s.y + 2, 8, 4);
            ctx.fillStyle = '#703010';
            ctx.fillRect(s.x + 5, s.y, 2, 4);
            ctx.fillRect(s.x + 5, s.y + 6, 2, 4);
        }
    }
}