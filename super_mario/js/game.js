const GAME_STATE = { TITLE: 0, PLAYING: 1, DYING: 2, GAMEOVER: 3, LEVELCLEAR: 4, WIN: 5 };
const TILE = 16;

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.W = 256; this.H = 240;
        canvas.width = this.W; canvas.height = this.H;
        this.ctx.imageSmoothingEnabled = false;
        this.input = new InputManager();
        this.audio = new AudioEngine();
        this.physics = new PhysicsEngine();
        this.camera = new Camera(this.W, this.H);
        this.levelMgr = new LevelManager();
        this.saveMgr = new SaveManager();
        this.renderer = new SpriteRenderer(this.ctx);
        this.state = GAME_STATE.TITLE;
        this.mario = null;
        this.blocks = []; this.enemies = []; this.items = []; this.coins = [];
        this.groundTiles = []; this.flagpole = null;
        this.fireballs = []; this.shells = []; this.scorePopups = [];
        this.decorations = { bushes: [], hills: [], clouds: [] };
        this.pipes = [];
        this.levelW = 0; this.levelH = 0;
        this.time = 400; this.timeCounter = 0;
        this.stateTimer = 0;
        this.frameCount = 0;
        this.levelLoaded = false;
        this.levelData = null;
        this._prevInvincible = 0;
        this.currentLevelId = 1;
        this._pendingSaveData = null;
        this._loadBuiltinLevel();
    }
    _loadBuiltinLevel() {
        this.levelData = {
            levelId: 1, name: "World 1-1", timeLimit: 400, width: 210, height: 15,
            playerStart: { x: 48, y: 192 },
            platforms: [
                { x: 0, y: 208, w: 3360, h: 32 },
                { x: 360, y: 208, w: 720, h: 32 },
                { x: 1120, y: 208, w: 2240, h: 32 }
            ],
            blocks: [
                { x: 256, y: 160, type: 3, content: "mushroom" },
                { x: 320, y: 160, type: 2 },
                { x: 336, y: 160, type: 3, content: "coin" },
                { x: 352, y: 160, type: 2 },
                { x: 368, y: 160, type: 2 },
                { x: 384, y: 160, type: 2 },
                { x: 400, y: 160, type: 3, content: "mushroom" },
                { x: 416, y: 160, type: 2 },
                { x: 432, y: 160, type: 2 },
                { x: 336, y: 96, type: 3, content: "coin" },
                { x: 448, y: 160, type: 2 },
                { x: 464, y: 160, type: 2 },
                { x: 480, y: 160, type: 2 },
                { x: 496, y: 160, type: 5 },
                { x: 512, y: 160, type: 5 },
                { x: 528, y: 160, type: 5 },
                { x: 544, y: 160, type: 5 },
                { x: 496, y: 96, type: 3, content: "fire" },
                { x: 576, y: 160, type: 2 },
                { x: 592, y: 160, type: 2 },
                { x: 608, y: 160, type: 2 },
                { x: 624, y: 160, type: 3, content: "coin" },
                { x: 592, y: 96, type: 2 },
                { x: 608, y: 96, type: 2 },
                { x: 624, y: 96, type: 2 },
                { x: 608, y: 32, type: 3, content: "coin" }
            ],
            enemies: [
                { x: 480, y: 192, type: "goomba" },
                { x: 720, y: 192, type: "goomba" },
                { x: 960, y: 192, type: "goomba" },
                { x: 1008, y: 192, type: "goomba" },
                { x: 1200, y: 192, type: "goomba" },
                { x: 1400, y: 192, type: "koopa" }
            ],
            coins: [
                { x: 560, y: 128 },
                { x: 576, y: 128 },
                { x: 592, y: 128 },
                { x: 608, y: 128 }
            ],
            pipes: [
                { x: 688, y: 176, height: 2 }
            ],
            flagpole: { x: 1600, y: 48 },
            decorations: {
                bushes: [
                    { x: 208, y: 192 },
                    { x: 368, y: 192 },
                    { x: 560, y: 192 }
                ],
                hills: [
                    { x: 16, y: 192 },
                    { x: 128, y: 192 },
                    { x: 256, y: 192 }
                ],
                clouds: [
                    { x: 48, y: 32 },
                    { x: 160, y: 48 },
                    { x: 320, y: 32 }
                ]
            }
        };
    }
    startLevel() {
        const data = this.levelData;
        if (!data) { this.state = GAME_STATE.GAMEOVER; return; }
        this._buildLevel(data);
        this.state = GAME_STATE.PLAYING;
        this.time = data.timeLimit || 400;
        this.timeCounter = 0;
        this.levelLoaded = true;
        this.audio.playBGM('overworld');
    }
    _buildLevel(data) {
        this.blocks = []; this.enemies = []; this.items = []; this.coins = [];
        this.groundTiles = []; this.flagpole = null;
        this.fireballs = []; this.shells = []; this.scorePopups = [];
        this.pipes = [];
        this.decorations = { bushes: [], hills: [], clouds: [] };
        this.levelW = (data.width || 210) * TILE;
        this.levelH = (data.height || 15) * TILE;
        if (data.platforms) {
            for (const p of data.platforms) {
                for (let px = 0; px < p.w; px += TILE) {
                    for (let py = 0; py < p.h; py += TILE) {
                        this.groundTiles.push({
                            x: p.x + px, y: p.y + py,
                            w: TILE, h: TILE, type: 1
                        });
                    }
                }
            }
        }
        if (data.blocks) {
            for (const b of data.blocks) {
                this.blocks.push(new Block(b.x, b.y, b.type, b.content || null));
            }
        }
        if (data.enemies) {
            for (const e of data.enemies) {
                this.enemies.push(new Enemy(e.x, e.y - 16, e.type));
            }
        }
        if (data.coins) {
            for (const c of data.coins) {
                this.coins.push(new Coin(c.x, c.y));
            }
        }
        if (data.flagpole) {
            this.flagpole = { x: data.flagpole.x, y: data.flagpole.y, h: this.levelH - data.flagpole.y - TILE * 2 };
        }
        if (data.pipes) {
            for (const p of data.pipes) {
                for (let row = 0; row < p.height; row++) {
                    const py = p.y + row * TILE;
                    this.groundTiles.push({ x: p.x, y: py, w: TILE, h: TILE, type: 1 });
                    this.groundTiles.push({ x: p.x + TILE, y: py, w: TILE, h: TILE, type: 1 });
                }
                this.groundTiles.push({ x: p.x - TILE, y: p.y, w: TILE, h: TILE, type: 1 });
                this.groundTiles.push({ x: p.x + TILE * 2, y: p.y, w: TILE, h: TILE, type: 1 });
                this.pipes.push({ x: p.x, y: p.y, height: p.height, dest: p.dest || null });
            }
        }
        if (data.decorations) {
            this.decorations = {
                bushes: data.decorations.bushes || [],
                hills: data.decorations.hills || [],
                clouds: data.decorations.clouds || []
            };
        }
        const ps = data.playerStart || { x: 48, y: 192 };
        this.mario = new Mario(ps.x, ps.y - 16);
        this.mario._onFireball = (fb) => {
            if (this.fireballs.length < 2) {
                this.fireballs.push(fb);
                this.audio.playSound('fireball');
            }
        };
        this.mario._onJump = () => {
            this.audio.playSound('jump');
        };
        if (this._pendingSaveData) {
            this.mario.lives = this._pendingSaveData.lives || 3;
            this.mario.score = this._pendingSaveData.score || 0;
            this.mario.coins = this._pendingSaveData.coins || 0;
            this._pendingSaveData = null;
        }
        this.camera.follow(this.mario);
    }
    update() {
        this.input.update();
        this.frameCount++;
        if (this.state === GAME_STATE.TITLE) {
            if (this.input.justPressed('jump') || this.input.justPressed('enter')) {
                this.audio.init();
                this._pendingSaveData = this.saveMgr.load();
                if (this._pendingSaveData) {
                    this.currentLevelId = this._pendingSaveData.levelId || 1;
                }
                this.startLevel();
            }
            return;
        }
        if (this.state === GAME_STATE.GAMEOVER) {
            this.stateTimer++;
            if (this.stateTimer > 180) {
                this.state = GAME_STATE.TITLE;
                this.stateTimer = 0;
            }
            return;
        }
        if (this.state === GAME_STATE.LEVELCLEAR) {
            this.stateTimer++;
            if (this.stateTimer <= 60 && this.stateTimer % 2 === 0 && this.time > 0) {
                this.time -= 1;
                if (this.mario) this.mario.score += 50;
            }
            if (this.stateTimer > 120) {
                this._saveProgress();
                this.state = GAME_STATE.WIN;
                this.stateTimer = 0;
            }
            return;
        }
        if (this.state === GAME_STATE.WIN) {
            this.stateTimer++;
            if (this.stateTimer > 300) {
                const nextLevel = this.levelMgr.getNextLevel();
                if (nextLevel >= 0) {
                    this.currentLevelId = nextLevel + 1;
                    this.startLevel();
                } else {
                    this.state = GAME_STATE.TITLE;
                    this.stateTimer = 0;
                }
            }
            return;
        }
        if (!this.mario || !this.levelLoaded) return;
        if (this.mario.isDead && this.state === GAME_STATE.PLAYING) {
            this.state = GAME_STATE.DYING;
            this.stateTimer = 0;
            this.audio.stopBGM();
        }
        if (this.state === GAME_STATE.DYING) {
            this.mario.update(this.input, this.physics);
            this.stateTimer++;
            if (this.stateTimer > 120) {
                this.mario.lives--;
                if (this.mario.lives <= 0) {
                    this.state = GAME_STATE.GAMEOVER;
                    this.stateTimer = 0;
                    this.audio.playSound('gameover');
                } else {
                    this.startLevel();
                }
            }
            return;
        }
        this.mario.isGrounded = false;
        this.mario.update(this.input, this.physics);
        if (this.mario.invincibleTimer === 0 && this._prevInvincible > 0) {
            this.audio.playBGM('overworld');
        }
        this._prevInvincible = this.mario.invincibleTimer;
        this._handleGroundCollisions();
        this._handleBlockCollisions();
        this._handleEnemyCollisions();
        this._handleItemCollisions();
        this._handleCoinCollisions();
        this._handleFlagpole();
        this._handlePipeTransport();
        this._handleFireballs();
        this._handleShells();
        for (const e of this.enemies) {
            if (!e.isAlive) { e.update(this.physics); continue; }
            e.isGrounded = false;
            e.update(this.physics);
            this._handleEnemyGroundCollision(e);
            this._handleEnemyBlockCollision(e);
            e.checkCliff(this.groundTiles);
        }
        for (const item of this.items) {
            item.update(this.physics);
            if (!item.isEmerging && item.type !== 'coin_popup') {
                item.isGrounded = false;
                this._handleItemGroundCollision(item);
            }
        }
        for (const b of this.blocks) b.update();
        for (const pop of this.scorePopups) pop.update();
        this.items = this.items.filter(i => i.isAlive || i.type === 'coin_popup');
        this.fireballs = this.fireballs.filter(f => f.isAlive);
        this.shells = this.shells.filter(s => s.isAlive);
        this.scorePopups = this.scorePopups.filter(p => p.isAlive);
        this.enemies = this.enemies.filter(e => e.isAlive || e.squishTimer < 30);
        if (this.mario.y > this.levelH + 32) {
            this.mario.die(this.audio);
        }
        if (this.state === GAME_STATE.PLAYING) {
            this.timeCounter++;
            if (this.timeCounter >= 60) {
                this.timeCounter = 0;
                this.time--;
                if (this.time <= 0) this.mario.die(this.audio);
            }
        }
        this.camera.update(this.levelW, this.levelH);
    }
    _saveProgress() {
        if (this.mario) {
            this.saveMgr.save({
                levelId: this.levelData ? this.levelData.levelId + 1 : 1,
                lives: this.mario.lives,
                score: this.mario.score,
                coins: this.mario.coins
            });
        }
    }
    _getSolidColliders() {
        const colliders = [];
        for (const g of this.groundTiles) {
            if (this.camera.isVisible(g.x - TILE, g.y - TILE, g.w + TILE * 2, g.h + TILE * 2)) {
                colliders.push(g);
            }
        }
        for (const b of this.blocks) {
            if (b.breaking && b.breakTimer <= 0) continue;
            colliders.push(b);
        }
        return colliders;
    }
    _handleGroundCollisions() {
        const m = this.mario;
        const colliders = this._getSolidColliders();
        for (let iter = 0; iter < 4; iter++) {
            let resolved = false;
            for (const c of colliders) {
                if (!this.physics.checkAABB(m, c)) continue;
                const dir = this.physics.getCollisionDirection(m, c);
                if (c.type !== undefined && c.type !== 1 && c.isSolid && !c.isSolid()) continue;
                this.physics.resolveCollision(m, c, dir);
                if (dir === 'top' && c.type !== 1 && c.isSolid && c.isSolid()) {
                    this._handleBlockHit(c, dir);
                }
                resolved = true;
            }
            if (!resolved) break;
        }
    }
    _handleBlockCollisions() { }
    _handleBlockHit(b, dir) {
        if (dir !== 'top') return;
        const m = this.mario;
        if (b.type === 2 && m.state >= 1) {
            b.break();
            this.audio.playSound('brick');
            m.addCoin(this.audio);
        } else if (b.type === 3 && !b.isUsed) {
            b.bump();
            b.isUsed = true;
            b.type = 4;
            const content = b.content || 'coin';
            if (content === 'coin') {
                this.items.push(new Item(b.x, b.y, 'coin_popup'));
                m.addCoin(this.audio);
            } else if (content === 'mushroom') {
                this.items.push(new Item(b.x, b.y, 'mushroom'));
                this.audio.playSound('bump');
            } else if (content === 'fire') {
                this.items.push(new Item(b.x, b.y, 'fire'));
                this.audio.playSound('bump');
            } else if (content === 'star') {
                this.items.push(new Item(b.x, b.y, 'star'));
                this.audio.playSound('bump');
            } else if (content === 'oneup') {
                this.items.push(new Item(b.x, b.y, 'oneup'));
                this.audio.playSound('bump');
            }
        } else if (b.type === 2 && m.state === 0) {
            b.bump();
            this.audio.playSound('bump');
        } else if (b.type === 5) {
            this.audio.playSound('bump');
        }
    }
    _handleEnemyGroundCollision(e) {
        for (const g of this.groundTiles) {
            if (!this.camera.isVisible(g.x - TILE, g.y - TILE, g.w + TILE * 2, g.h + TILE * 2)) continue;
            if (!this.physics.checkAABB(e, g)) continue;
            const dir = this.physics.getCollisionDirection(e, g);
            if (dir === 'bottom') {
                e.y = g.y - e.h;
                e.vy = 0;
                e.isGrounded = true;
            } else if (dir === 'left' || dir === 'right') {
                e.vx = -e.vx;
                e.facing = -e.facing;
            }
        }
    }
    _handleEnemyBlockCollision(e) {
        for (const b of this.blocks) {
            if (b.breaking && b.breakTimer <= 0) continue;
            if (!b.isSolid || !b.isSolid()) continue;
            if (!this.physics.checkAABB(e, b)) continue;
            const dir = this.physics.getCollisionDirection(e, b);
            if (dir === 'left' || dir === 'right') {
                e.vx = -e.vx;
                e.facing = -e.facing;
            }
        }
    }
    _handleItemGroundCollision(item) {
        for (const g of this.groundTiles) {
            if (!this.physics.checkAABB(item, g)) continue;
            const dir = this.physics.getCollisionDirection(item, g);
            if (dir === 'bottom') {
                item.y = g.y - item.h;
                item.vy = 0;
                item.isGrounded = true;
            } else if (dir === 'left' || dir === 'right') {
                item.vx = -item.vx;
            }
        }
    }
    _handleEnemyCollisions() {
        const m = this.mario;
        if (m.invincibleTimer > 0 || m.isDead || m.isWinning) return;
        for (const e of this.enemies) {
            if (!e.isAlive) continue;
            if (!this.physics.checkAABB(m, e)) continue;
            if (m.vy > 0 && m.y + m.h - e.y < 10) {
                const shellResult = e.squash(this.audio);
                m.vy = -5;
                m.stompCombo++;
                const stompScores = [100, 200, 400, 800];
                const idx = Math.min(m.stompCombo - 1, stompScores.length - 1);
                const stompScore = stompScores[idx];
                m.score += stompScore;
                if (m.stompCombo >= 5) {
                    m.lives++;
                    this.audio.playSound('oneup');
                    this.scorePopups.push(new ScorePopup(e.x, e.y, '1UP'));
                } else {
                    this.scorePopups.push(new ScorePopup(e.x, e.y, stompScore));
                }
                if (shellResult === 'shell') {
                    this.shells.push(new KoopaShell(e.x, e.y + 8));
                }
            } else {
                if (m.takeDamage(this.audio)) {
                    m.stompCombo = 0;
                }
            }
        }
        if (m.isGrounded) m.stompCombo = 0;
    }
    _handleItemCollisions() {
        const m = this.mario;
        for (const item of this.items) {
            if (!item.isAlive || item.isEmerging) continue;
            if (!this.physics.checkAABB(m, item)) continue;
            if (item.type === 'mushroom') {
                m.powerUp('mushroom', this.audio);
            } else if (item.type === 'fire') {
                m.powerUp('fire', this.audio);
            } else if (item.type === 'star') {
                m.invincibleTimer = 600;
                m.score += 1000;
                this.audio.playStarMusic();
                this.audio.playSound('powerup');
            } else if (item.type === 'oneup') {
                m.lives++;
                this.audio.playSound('oneup');
                this.scorePopups.push(new ScorePopup(item.x, item.y, '1UP'));
            }
            item.isAlive = false;
        }
    }
    _handleCoinCollisions() {
        const m = this.mario;
        for (const c of this.coins) {
            if (c.collected) continue;
            if (this.physics.checkAABB(m, c)) {
                c.collected = true;
                m.addCoin(this.audio);
            }
        }
    }
    _handleFlagpole() {
        if (!this.flagpole || this.mario.isWinning || this.mario.isDead) return;
        const m = this.mario;
        const fp = this.flagpole;
        if (m.x + m.w > fp.x && m.x < fp.x + TILE && m.y < this.levelH - TILE * 3) {
            m.isWinning = true;
            m.vx = 0;
            m.vy = 0;
            m.winTimer = 0;
            this.state = GAME_STATE.LEVELCLEAR;
            this.stateTimer = 0;
            this.audio.stopBGM();
            this.audio.playSound('flagpole');
        }
    }
    _handlePipeTransport() {
        const m = this.mario;
        if (!m || m.isDead || m.isWinning) return;
        if (this.input.justPressed('down') && m.isGrounded) {
            for (const p of this.pipes) {
                if (m.x + m.w > p.x + 4 && m.x < p.x + TILE * 2 - 4) {
                    if (m.y + m.h >= p.y && m.y + m.h <= p.y + TILE + 4) {
                        if (p.dest) {
                            m.x = p.dest.x;
                            m.y = p.dest.y;
                        }
                        this.audio.playSound('bump');
                        return;
                    }
                }
            }
        }
    }
    _handleFireballs() {
        for (const fb of this.fireballs) {
            if (!fb.isAlive) continue;
            fb.isGrounded = false;
            fb.update(this.physics);
            for (const g of this.groundTiles) {
                if (!this.physics.checkAABB(fb, g)) continue;
                const dir = this.physics.getCollisionDirection(fb, g);
                if (dir === 'bottom') {
                    fb.bounceOnGround(g.y);
                } else if (dir === 'left' || dir === 'right' || dir === 'top') {
                    fb.bounceOnWall();
                }
            }
            for (const b of this.blocks) {
                if (!b.isSolid || !b.isSolid()) continue;
                if (b.breaking && b.breakTimer <= 0) continue;
                if (!this.physics.checkAABB(fb, b)) continue;
                fb.bounceOnWall();
            }
            for (const e of this.enemies) {
                if (!e.isAlive) continue;
                if (!this.physics.checkAABB(fb, e)) continue;
                e.isAlive = false;
                e.squishTimer = 0;
                fb.isAlive = false;
                if (this.mario) {
                    this.mario.score += 200;
                    this.scorePopups.push(new ScorePopup(e.x, e.y, 200));
                }
            }
        }
    }
    _handleShells() {
        const m = this.mario;
        for (const shell of this.shells) {
            if (!shell.isAlive) continue;
            shell.isGrounded = false;
            shell.update(this.physics);
            for (const g of this.groundTiles) {
                if (!this.camera.isVisible(g.x - TILE, g.y - TILE, g.w + TILE * 2, g.h + TILE * 2)) continue;
                if (!this.physics.checkAABB(shell, g)) continue;
                const dir = this.physics.getCollisionDirection(shell, g);
                if (dir === 'bottom') {
                    shell.y = g.y - shell.h;
                    shell.vy = 0;
                    shell.isGrounded = true;
                } else if (dir === 'left' || dir === 'right') {
                    shell.bounceWall();
                }
            }
            for (const b of this.blocks) {
                if (b.breaking && b.breakTimer <= 0) continue;
                if (!b.isSolid || !b.isSolid()) continue;
                if (!this.physics.checkAABB(shell, b)) continue;
                const dir = this.physics.getCollisionDirection(shell, b);
                if (dir === 'left' || dir === 'right') {
                    shell.bounceWall();
                }
            }
            for (const e of this.enemies) {
                if (!e.isAlive) continue;
                if (!this.physics.checkAABB(shell, e)) continue;
                e.isAlive = false;
                e.squishTimer = 0;
                if (m) {
                    m.score += 200;
                    this.scorePopups.push(new ScorePopup(e.x, e.y, 200));
                }
            }
            if (m && !m.isDead && m.invincibleTimer <= 0) {
                if (this.physics.checkAABB(m, shell)) {
                    if (!shell.moving) {
                        shell.kick(m.x < shell.x ? 1 : -1, this.audio);
                    } else {
                        if (m.takeDamage(this.audio)) {
                            m.stompCombo = 0;
                        }
                    }
                }
            }
        }
    }
    render() {
        this.ctx.fillStyle = '#5c94fc';
        this.ctx.fillRect(0, 0, this.W, this.H);
        if (this.state === GAME_STATE.TITLE) { this._drawTitle(); return; }
        if (this.state === GAME_STATE.GAMEOVER) { this._drawGameOver(); return; }
        if (this.state === GAME_STATE.WIN) { this._drawWin(); return; }
        this._drawBackground();
        this._drawDecorations();
        for (const g of this.groundTiles) {
            if (!this.camera.isVisible(g.x, g.y, g.w, g.h)) continue;
            const s = this.camera.toScreen(g.x, g.y);
            const sprite = getSprite('block_ground');
            if (sprite) {
                this.ctx.drawImage(sprite, s.x, s.y);
            } else {
                this.ctx.fillStyle = '#c84c09';
                this.ctx.fillRect(s.x, s.y, TILE, TILE);
            }
        }
        this._drawPipes();
        if (this.flagpole) {
            this._drawFlagpole();
        }
        for (const b of this.blocks) b.draw(this.ctx, this.camera);
        for (const c of this.coins) c.draw(this.ctx, this.camera);
        for (const e of this.enemies) e.draw(this.ctx, this.camera);
        for (const i of this.items) i.draw(this.ctx, this.camera);
        for (const fb of this.fireballs) fb.draw(this.ctx, this.camera);
        for (const shell of this.shells) shell.draw(this.ctx, this.camera);
        for (const pop of this.scorePopups) pop.draw(this.ctx, this.camera);
        if (this.mario) this.mario.draw(this.ctx, this.camera);
        this._drawUI();
        if (this.state === GAME_STATE.LEVELCLEAR) {
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '12px "Press Start 2P", monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('COURSE CLEAR!', this.W / 2, this.H / 2);
        }
    }
    _drawBackground() {
        const cx = this.camera.x;
        for (let i = 0; i < 5; i++) {
            const bx = (80 + i * 180 - cx * 0.1) % (this.W + 100) - 50;
            const by = 40 + (i % 3) * 20;
            const sprite = getSprite('cloud');
            if (sprite) {
                this.ctx.drawImage(sprite, bx, by);
            } else {
                this.ctx.fillStyle = 'rgba(255,255,255,0.8)';
                this.ctx.beginPath();
                this.ctx.ellipse(bx, by, 28, 10, 0, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.ellipse(bx + 18, by - 4, 18, 8, 0, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }
    _drawDecorations() {
        const bushSprite = getSprite('bush');
        const hillSprite = getSprite('hill');
        const cloudSprite = getSprite('cloud');
        if (cloudSprite) {
            for (const c of this.decorations.clouds) {
                const s = this.camera.toScreen(c.x, c.y);
                if (this.camera.isVisible(c.x, c.y, 16, 16)) {
                    this.ctx.drawImage(cloudSprite, s.x, s.y);
                }
            }
        }
        if (hillSprite) {
            for (const h of this.decorations.hills) {
                const s = this.camera.toScreen(h.x, h.y);
                if (this.camera.isVisible(h.x, h.y, 16, 16)) {
                    this.ctx.drawImage(hillSprite, s.x, s.y);
                }
            }
        }
        if (bushSprite) {
            for (const b of this.decorations.bushes) {
                const s = this.camera.toScreen(b.x, b.y);
                if (this.camera.isVisible(b.x, b.y, 16, 16)) {
                    this.ctx.drawImage(bushSprite, s.x, s.y);
                }
            }
        }
    }
    _drawPipes() {
        for (const p of this.pipes) {
            for (let row = 0; row < p.height; row++) {
                const py = p.y + row * TILE;
                const types = row === 0
                    ? ['pipe_tl', 'pipe_tr']
                    : ['pipe_bl', 'pipe_br'];
                const s0 = this.camera.toScreen(p.x, py);
                const s1 = this.camera.toScreen(p.x + TILE, py);
                if (this.camera.isVisible(p.x, py, TILE, TILE)) {
                    const left = getSprite(types[0]);
                    const right = getSprite(types[1]);
                    if (left) this.ctx.drawImage(left, s0.x, s0.y);
                    if (right) this.ctx.drawImage(right, s1.x, s1.y);
                }
            }
        }
    }
    _drawFlagpole() {
        const fp = this.flagpole;
        const poleSprite = getSprite('flag_pole');
        const topSprite = getSprite('flag_top');
        const castleSprite = getSprite('castle');
        for (let y = fp.y; y < fp.y + fp.h; y += TILE) {
            const s = this.camera.toScreen(fp.x, y);
            if (poleSprite) {
                this.ctx.drawImage(poleSprite, s.x, s.y);
            } else {
                this.ctx.fillStyle = '#888';
                this.ctx.fillRect(s.x + 7, s.y, 2, TILE);
            }
        }
        const sTop = this.camera.toScreen(fp.x, fp.y - TILE);
        if (topSprite) {
            this.ctx.drawImage(topSprite, sTop.x, sTop.y);
        } else {
            this.ctx.fillStyle = '#2d8b2d';
            this.ctx.fillRect(sTop.x + 1, sTop.y, 8, 10);
        }
        if (castleSprite && fp.x + 96 < this.levelW) {
            const sCastle = this.camera.toScreen(fp.x + 96, fp.y + fp.h - TILE * 2);
            this.ctx.drawImage(castleSprite, sCastle.x, sCastle.y);
        }
    }
    _drawUI() {
        if (!this.mario) return;
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '8px "Press Start 2P", monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('MARIO', 8, 16);
        this.ctx.fillText(String(this.mario.score).padStart(6, '0'), 8, 28);
        this.ctx.textAlign = 'center';
        const coinSprite = getSprite('item_coin_0');
        if (coinSprite) {
            this.ctx.drawImage(coinSprite, 76, 18, 8, 10);
        } else {
            this.ctx.fillStyle = '#f5d442';
            this.ctx.fillRect(76, 20, 8, 10);
        }
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText('x' + String(this.mario.coins).padStart(2, '0'), 92, 28);
        this.ctx.fillText('WORLD', 152, 16);
        this.ctx.fillText('1-1', 152, 28);
        this.ctx.textAlign = 'right';
        this.ctx.fillText('TIME', 248, 16);
        this.ctx.fillText(String(Math.max(0, Math.floor(this.time))), 248, 28);
    }
    _drawTitle() {
        this.ctx.fillStyle = '#5c94fc';
        this.ctx.fillRect(0, 0, this.W, this.H);
        const marioSprite = getSprite('mario_big_stand');
        if (marioSprite) {
            this.ctx.drawImage(marioSprite, this.W / 2 - 8, 90, 16, 32);
        } else {
            this.ctx.fillStyle = '#e52521';
            this.ctx.fillRect(this.W / 2 - 16, 100, 12, 16);
            this.ctx.fillRect(this.W / 2 - 13, 100, 8, 6);
            this.ctx.fillStyle = '#6b8cff';
            this.ctx.fillRect(this.W / 2 - 14, 106, 10, 6);
        }
        this.ctx.fillStyle = '#e52521';
        this.ctx.font = '16px "Press Start 2P", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('SUPER', this.W / 2, 60);
        this.ctx.fillText('MARIO', this.W / 2, 82);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '8px "Press Start 2P", monospace';
        if (Math.floor(this.frameCount / 30) % 2 === 0) {
            this.ctx.fillText('PRESS SPACE TO START', this.W / 2, 150);
        }
        this.ctx.fillStyle = '#f5d442';
        this.ctx.font = '7px "Press Start 2P", monospace';
        this.ctx.fillText('Arrows/WASD: Move', this.W / 2, 180);
        this.ctx.fillText('Space/Z: Jump  X: Fire', this.W / 2, 196);
    }
    _drawGameOver() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.W, this.H);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px "Press Start 2P", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.W / 2, this.H / 2);
    }
    _drawWin() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.W, this.H);
        this.ctx.fillStyle = '#f5d442';
        this.ctx.font = '14px "Press Start 2P", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('CONGRATULATIONS!', this.W / 2, 80);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '10px "Press Start 2P", monospace';
        this.ctx.fillText('SCORE: ' + (this.mario ? this.mario.score : 0), this.W / 2, 120);
    }
    loop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.loop());
    }
    start() { this.loop(); }
}