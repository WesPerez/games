const GAME_STATE = { TITLE: 0, PLAYING: 1, DYING: 2, GAMEOVER: 3, LEVELCLEAR: 4, WIN: 5, PAUSED: 6, TRANSITION: 7 };
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
        this.piranhaPlants = [];
        this.lakitus = [];
        this.hammerBros = [];
        this.hammers = [];
        this.particles = [];
        this.waterTiles = [];
        this.lavaTiles = [];
        this.levelW = 0; this.levelH = 0;
        this.time = 400; this.timeCounter = 0;
        this.stateTimer = 0;
        this.frameCount = 0;
        this.levelLoaded = false;
        this.levelData = null;
        this._prevInvincible = 0;
        this.currentLevelId = 1;
        this._pendingSaveData = null;
        this.theme = 'overworld';
        this.shakeAmount = 0;
        this.shakeDecay = 0.9;
        this.checkpoint = null;
        this._loadBuiltinLevel();
        this._initInput();
    }
    _initInput() {
        // Pause key is handled in update
    }
    _loadBuiltinLevel() {
        this.levelData = {
            levelId: 1, name: "World 1-1", timeLimit: 400, width: 210, height: 15,
            theme: 'overworld',
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
                bushes: [{ x: 208, y: 192 }, { x: 368, y: 192 }, { x: 560, y: 192 }],
                hills: [{ x: 16, y: 192 }, { x: 128, y: 192 }, { x: 256, y: 192 }],
                clouds: [{ x: 48, y: 32 }, { x: 160, y: 48 }, { x: 320, y: 32 }]
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
        this.theme = data.theme || 'overworld';
        this.checkpoint = null;
        if (data.checkpoint) {
            this.checkpoint = { x: data.checkpoint.x, y: data.checkpoint.y, active: false };
        }
        this._playThemeMusic();
    }
    _playThemeMusic() {
        if (this.theme === 'underground') {
            this.audio.playBGM('underground');
        } else if (this.theme === 'castle') {
            this.audio.playBGM('castle');
        } else {
            this.audio.playBGM('overworld');
        }
    }
    _buildLevel(data) {
        this.blocks = []; this.enemies = []; this.items = []; this.coins = [];
        this.groundTiles = []; this.flagpole = null;
        this.fireballs = []; this.shells = []; this.scorePopups = [];
        this.pipes = []; this.piranhaPlants = []; this.lakitus = [];
        this.hammerBros = []; this.hammers = [];
        this.particles = [];
        this.waterTiles = []; this.lavaTiles = [];
        this.decorations = { bushes: [], hills: [], clouds: [] };
        this.levelW = (data.width || 210) * TILE;
        this.levelH = (data.height || 15) * TILE;
        if (data.platforms) {
            for (const p of data.platforms) {
                for (let px = 0; px < p.w; px += TILE) {
                    for (let py = 0; py < p.h; py += TILE) {
                        this.groundTiles.push({
                            x: p.x + px, y: p.y + py,
                            w: TILE, h: TILE, type: p.type || 1
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
                const ex = e.x, ey = e.y - 16;
                if (e.type === 'piranha') {
                    this.piranhaPlants.push(new PiranhaPlant(ex, ey, ey));
                } else if (e.type === 'lakitu') {
                    this.lakitus.push(new Lakitu(ex, ey, e.patrolLeft || 0, e.patrolRight || this.levelW));
                } else if (e.type === 'hammerbro') {
                    this.hammerBros.push(new HammerBro(ex, ey, e.patrolLeft || ex - 64, e.patrolRight || ex + 64));
                } else {
                    this.enemies.push(new Enemy(ex, ey, e.type));
                }
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
                this.pipes.push({ x: p.x, y: p.y, height: p.height, dest: p.dest || null, hasPlant: p.hasPlant || false });
                if (p.hasPlant) {
                    this.piranhaPlants.push(new PiranhaPlant(p.x + TILE / 2, p.y, p.y));
                }
            }
        }
        if (data.water) {
            for (const w of data.water) {
                for (let wx = 0; wx < w.w; wx += TILE) {
                    for (let wy = 0; wy < w.h; wy += TILE) {
                        this.waterTiles.push({ x: w.x + wx, y: w.y + wy, w: TILE, h: TILE });
                    }
                }
            }
        }
        if (data.lava) {
            for (const l of data.lava) {
                for (let lx = 0; lx < l.w; lx += TILE) {
                    for (let ly = 0; ly < l.h; ly += TILE) {
                        this.lavaTiles.push({ x: l.x + lx, y: l.y + ly, w: TILE, h: TILE });
                    }
                }
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
        this.mario._onFireball = (proj) => {
            if (this.fireballs.length < 2) {
                this.fireballs.push(proj);
                this.audio.playSound('fireball');
            }
        };
        this.mario._onJump = () => {
            this.audio.playSound('jump');
            this._spawnJumpDust(this.mario.x + this.mario.w / 2, this.mario.y + this.mario.h);
        };
        if (this._pendingSaveData) {
            this.mario.lives = this._pendingSaveData.lives || 3;
            this.mario.score = this._pendingSaveData.score || 0;
            this.mario.coins = this._pendingSaveData.coins || 0;
            this._pendingSaveData = null;
        }
        this.camera.follow(this.mario);
    }
    _spawnJumpDust(x, y) {
        for (let i = 0; i < 3; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 8,
                y: y,
                vx: (Math.random() - 0.5) * 1.5,
                vy: -Math.random() * 2,
                life: 15 + Math.random() * 10,
                type: 'dust',
                alpha: 1
            });
        }
    }
    _spawnCoinSparkle(x, y) {
        for (let i = 0; i < 4; i++) {
            this.particles.push({
                x: x + Math.random() * 16,
                y: y + Math.random() * 8,
                vx: (Math.random() - 0.5) * 2,
                vy: -Math.random() * 3 - 1,
                life: 20 + Math.random() * 10,
                type: 'sparkle',
                alpha: 1
            });
        }
    }
    _spawnSquishParticles(x, y) {
        for (let i = 0; i < 4; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 8,
                y: y,
                vx: (Math.random() - 0.5) * 3,
                vy: -Math.random() * 3 - 1,
                life: 20 + Math.random() * 10,
                type: 'squish',
                alpha: 1
            });
        }
    }
    _spawnPowerUpGlow(x, y) {
        for (let i = 0; i < 6; i++) {
            this.particles.push({
                x: x + Math.random() * 16,
                y: y + Math.random() * 16,
                vx: (Math.random() - 0.5) * 1,
                vy: -Math.random() * 2 - 2,
                life: 30 + Math.random() * 15,
                type: 'glow',
                alpha: 1
            });
        }
    }
    triggerShake(amount) {
        this.shakeAmount = Math.max(this.shakeAmount, amount);
    }
    update() {
        this.input.update();
        this.frameCount++;

        // Update shake
        if (this.shakeAmount > 0.1) {
            this.shakeAmount *= this.shakeDecay;
        } else {
            this.shakeAmount = 0;
        }

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
        if (this.state === GAME_STATE.TRANSITION) {
            this.stateTimer++;
            if (this.stateTimer > 90) {
                this.startLevel();
            }
            return;
        }
        // Pause toggle
        if (this.input.justPressed('pause') && (this.state === GAME_STATE.PLAYING || this.state === GAME_STATE.PAUSED)) {
            if (this.state === GAME_STATE.PLAYING) {
                this.state = GAME_STATE.PAUSED;
            } else {
                this.state = GAME_STATE.PLAYING;
            }
            return;
        }
        if (this.state === GAME_STATE.PAUSED) return;
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
                    this.state = GAME_STATE.TRANSITION;
                    this.stateTimer = 0;
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
                    this._respawnMario();
                }
            }
            return;
        }
        this.mario.isGrounded = false;
        this.mario.update(this.input, this.physics);
        if (this.mario.invincibleTimer === 0 && this._prevInvincible > 0) {
            this._playThemeMusic();
        }
        this._prevInvincible = this.mario.invincibleTimer;

        // Checkpoint
        if (this.checkpoint && !this.checkpoint.active && this.mario.x > this.checkpoint.x) {
            this.checkpoint.active = true;
            this.scorePopups.push(new ScorePopup(this.checkpoint.x, this.checkpoint.y - 16, 'CHECK'));
        }

        this._handleGroundCollisions();
        this._handleBlockCollisions();
        this._handleEnemyCollisions();
        this._handleItemCollisions();
        this._handleCoinCollisions();
        this._handleFlagpole();
        this._handlePipeTransport();
        this._handleFireballs();
        this._handleShells();
        this._handlePiranhaPlants();
        this._handleLakitus();
        this._handleHammerBros();
        this._handleHammers();
        this._handleWaterLava();

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
        for (const p of this.particles) {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.life--;
            p.alpha = Math.max(0, p.life / 30);
        }
        this.items = this.items.filter(i => i.isAlive || i.type === 'coin_popup');
        this.fireballs = this.fireballs.filter(f => f.isAlive);
        this.shells = this.shells.filter(s => s.isAlive);
        this.scorePopups = this.scorePopups.filter(p => p.isAlive);
        this.enemies = this.enemies.filter(e => e.isAlive || e.squishTimer < 30);
        this.particles = this.particles.filter(p => p.life > 0);
        this.hammers = this.hammers.filter(h => h.isAlive);
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
    _respawnMario() {
        this.fireballs = []; this.shells = []; this.hammers = [];
        this.particles = [];
        this.piranhaPlants = [];
        this.lakitus = [];
        this.hammerBros = [];
        this.audio.stopBGM();
        const data = this.levelData;
        const ps = this.checkpoint && this.checkpoint.active ? this.checkpoint : (data.playerStart || { x: 48, y: 192 });
        this.mario = new Mario(ps.x, ps.y - 16);
        this.mario._onFireball = (proj) => {
            if (this.fireballs.length < 2) {
                this.fireballs.push(proj);
                this.audio.playSound('fireball');
            }
        };
        this.mario._onJump = () => {
            this.audio.playSound('jump');
            this._spawnJumpDust(this.mario.x + this.mario.w / 2, this.mario.y + this.mario.h);
        };
        if (this._pendingSaveData) {
            this.mario.lives = this._pendingSaveData.lives || 3;
            this.mario.score = this._pendingSaveData.score || 0;
            this.mario.coins = this._pendingSaveData.coins || 0;
        }
        this.camera.follow(this.mario);
        this.state = GAME_STATE.PLAYING;
        this._playThemeMusic();
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
            this.triggerShake(2);
            this._spawnBrickParticles(b.x, b.y);
        } else if (b.type === 3 && !b.isUsed) {
            b.bump();
            b.isUsed = true;
            b.type = 4;
            const content = b.content || 'coin';
            if (content === 'coin') {
                this.items.push(new Item(b.x, b.y, 'coin_popup'));
                m.addCoin(this.audio);
                this._spawnCoinSparkle(b.x, b.y);
            } else if (content === 'mushroom') {
                this.items.push(new Item(b.x, b.y, 'mushroom'));
                this.audio.playSound('bump');
            } else if (content === 'fire') {
                this.items.push(new Item(b.x, b.y, 'fire'));
                this.audio.playSound('bump');
            } else if (content === 'ice') {
                this.items.push(new Item(b.x, b.y, 'ice'));
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
    _spawnBrickParticles(x, y) {
        for (let i = 0; i < 4; i++) {
            this.particles.push({
                x: x + (i % 2) * 8, y: y + Math.floor(i / 2) * 8,
                vx: (i % 2 === 0 ? -2 : 2) + Math.random() * 2 - 1,
                vy: -4 - Math.random() * 3,
                life: 30, type: 'brick', alpha: 1
            });
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
            if (!e.isAlive && !e.frozen) continue;
            if (!this.physics.checkAABB(m, e)) continue;
            if (e.frozen) {
                e.isAlive = false;
                e.squishTimer = 0;
                e.frozen = false;
                this._spawnSquishParticles(e.x, e.y);
                m.vy = -5;
                m.score += 100;
                this.scorePopups.push(new ScorePopup(e.x, e.y, 100));
                this.audio.playSound('stomp');
                continue;
            }
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
                this._spawnSquishParticles(e.x, e.y);
                if (shellResult === 'shell') {
                    this.shells.push(new KoopaShell(e.x, e.y + 8, 'koopa'));
                } else if (shellResult === 'buzzy_shell') {
                    this.shells.push(new KoopaShell(e.x, e.y + 8, 'buzzy'));
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
                this._spawnPowerUpGlow(item.x, item.y);
            } else if (item.type === 'fire') {
                m.powerUp('fire', this.audio);
                this._spawnPowerUpGlow(item.x, item.y);
            } else if (item.type === 'ice') {
                m.powerUp('ice', this.audio);
                this._spawnPowerUpGlow(item.x, item.y);
            } else if (item.type === 'star') {
                m.invincibleTimer = 600;
                m.score += 1000;
                this.audio.playStarMusic();
                this.audio.playSound('powerup');
                this._spawnPowerUpGlow(item.x, item.y);
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
                this._spawnCoinSparkle(c.x, c.y);
            }
        }
    }
    _handleFlagpole() {
        if (!this.flagpole || this.mario.isWinning || this.mario.isDead) return;
        const m = this.mario;
        const fp = this.flagpole;
        if (m.x + m.w > fp.x - 4 && m.x < fp.x + TILE + 4 && m.y < this.levelH - TILE * 3) {
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
                if (e.type === 'buzzy' && fb.type === 'fire') {
                    fb.bounceOnWall();
                    continue;
                }
                if (fb.type === 'ice') {
                    e.frozen = true;
                    e.frozenTimer = 180;
                    e.vx = 0;
                    e.vy = 0;
                    fb.isAlive = false;
                    if (this.mario) {
                        this.mario.score += 100;
                        this.scorePopups.push(new ScorePopup(e.x, e.y, 100));
                    }
                } else {
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
    _handlePiranhaPlants() {
        const m = this.mario;
        for (const pp of this.piranhaPlants) {
            pp.update(m);
            if (!pp.isAlive || pp.state === 'hidden') continue;
            if (m && !m.isDead && m.invincibleTimer <= 0) {
                if (this.physics.checkAABB(m, pp)) {
                    m.takeDamage(this.audio);
                }
            }
        }
    }
    _handleLakitus() {
        const m = this.mario;
        for (const l of this.lakitus) {
            l.update(this.physics);
            if (m && !m.isDead && m.invincibleTimer <= 0 && l.isAlive) {
                if (this.physics.checkAABB(m, l)) {
                    if (m.vy > 0 && m.y + m.h - l.y < 10) {
                        l.squash(this.audio);
                        m.vy = -5;
                        m.score += 400;
                        this.scorePopups.push(new ScorePopup(l.x, l.y, 400));
                        this._spawnSquishParticles(l.x, l.y);
                    } else {
                        m.takeDamage(this.audio);
                    }
                }
            }
        }
        this.lakitus = this.lakitus.filter(l => l.isAlive);
    }
    _handleHammerBros() {
        const m = this.mario;
        for (const hb of this.hammerBros) {
            if (!hb.isAlive) continue;
            hb.isGrounded = false;
            hb.update(this.physics);
            this._handleEnemyGroundCollision(hb);
            this._handleEnemyBlockCollision(hb);
            if (m && !m.isDead && m.invincibleTimer <= 0) {
                if (this.physics.checkAABB(m, hb)) {
                    if (m.vy > 0 && m.y + m.h - hb.y < 10) {
                        hb.squash(this.audio);
                        m.vy = -5;
                        m.score += 500;
                        this.scorePopups.push(new ScorePopup(hb.x, hb.y, 500));
                        this._spawnSquishParticles(hb.x, hb.y);
                    } else {
                        m.takeDamage(this.audio);
                    }
                }
            }
        }
        this.hammerBros = this.hammerBros.filter(hb => hb.isAlive);
    }
    _handleHammers() {
        const m = this.mario;
        for (const hm of this.hammers) {
            if (!hm.isAlive) continue;
            hm.isGrounded = false;
            hm.update(this.physics);
            for (const g of this.groundTiles) {
                if (!this.physics.checkAABB(hm, g)) continue;
                hm.isAlive = false;
            }
            if (m && !m.isDead && m.invincibleTimer <= 0) {
                if (this.physics.checkAABB(m, hm)) {
                    m.takeDamage(this.audio);
                    hm.isAlive = false;
                }
            }
        }
    }
    _handleWaterLava() {
        const m = this.mario;
        if (!m || m.isDead) return;
        for (const w of this.waterTiles) {
            if (this.physics.checkAABB(m, w)) {
                m.vy = -3;
                m.isGrounded = false;
            }
        }
        for (const l of this.lavaTiles) {
            if (this.physics.checkAABB(m, l)) {
                m.die(this.audio);
                return;
            }
        }
    }
    render() {
        const bgColor = this.theme === 'underground' ? '#000000' :
                         this.theme === 'castle' ? '#303030' : '#5c94fc';
        this.ctx.fillStyle = bgColor;
        this.ctx.fillRect(0, 0, this.W, this.H);

        if (this.state === GAME_STATE.TITLE) { this._drawTitle(); return; }
        if (this.state === GAME_STATE.GAMEOVER) { this._drawGameOver(); return; }
        if (this.state === GAME_STATE.TRANSITION) { this._drawTransition(); return; }
        if (this.state === GAME_STATE.WIN) { this._drawWin(); return; }

        // Apply screen shake
        let shakeX = 0, shakeY = 0;
        if (this.shakeAmount > 0.1) {
            shakeX = (Math.random() - 0.5) * this.shakeAmount * 2;
            shakeY = (Math.random() - 0.5) * this.shakeAmount * 2;
            this.ctx.save();
            this.ctx.translate(shakeX, shakeY);
        }

        this._drawBackground();
        this._drawDecorations();
        this._drawWaterLava();
        for (const g of this.groundTiles) {
            if (!this.camera.isVisible(g.x, g.y, g.w, g.h)) continue;
            const s = this.camera.toScreen(g.x, g.y);
            const spriteName = this.theme === 'underground' ? 'block_underground' :
                               this.theme === 'castle' ? 'block_castle' : 'block_ground';
            const sprite = getSprite(spriteName);
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
        if (this.checkpoint && !this.checkpoint.active) {
            this._drawCheckpoint();
        }
        for (const b of this.blocks) b.draw(this.ctx, this.camera);
        for (const c of this.coins) c.draw(this.ctx, this.camera);
        for (const e of this.enemies) e.draw(this.ctx, this.camera);
        for (const pp of this.piranhaPlants) pp.draw(this.ctx, this.camera);
        for (const l of this.lakitus) l.draw(this.ctx, this.camera);
        for (const hb of this.hammerBros) hb.draw(this.ctx, this.camera);
        for (const i of this.items) i.draw(this.ctx, this.camera);
        for (const fb of this.fireballs) fb.draw(this.ctx, this.camera);
        for (const shell of this.shells) shell.draw(this.ctx, this.camera);
        for (const hm of this.hammers) hm.draw(this.ctx, this.camera);
        for (const pop of this.scorePopups) pop.draw(this.ctx, this.camera);
        this._drawParticles();
        if (this.mario) this.mario.draw(this.ctx, this.camera);
        if (this.shakeAmount > 0.1) {
            this.ctx.restore();
        }
        this._drawUI();
        if (this.state === GAME_STATE.PAUSED) {
            this._drawPause();
        }
        if (this.state === GAME_STATE.LEVELCLEAR) {
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '12px "Press Start 2P", monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('COURSE CLEAR!', this.W / 2, this.H / 2);
        }
    }
    _drawBackground() {
        const cx = this.camera.x;
        // Parallax layers
        const layers = [
            { speed: 0.1, count: 6, yBase: 40, yJitter: 20, sprite: 'cloud', w: 60, h: 20 },
            { speed: 0.3, count: 4, yBase: 100, yJitter: 10, sprite: 'cloud', w: 40, h: 15 },
        ];
        if (this.theme === 'overworld') {
            for (const layer of layers) {
                for (let i = 0; i < layer.count; i++) {
                    const bx = ((layer.w * i * 2 + i * 80) - cx * layer.speed) % (this.W + 200) - 100;
                    const by = layer.yBase + (i % 3) * layer.yJitter;
                    const sprite = getSprite(layer.sprite);
                    if (sprite) {
                        this.ctx.drawImage(sprite, bx, by);
                    }
                }
            }
        } else if (this.theme === 'underground') {
            // Underground has no clouds, just dark sky
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, this.W, this.H);
        } else if (this.theme === 'castle') {
            // Castle has dark sky with occasional background elements
            this.ctx.fillStyle = '#303030';
            this.ctx.fillRect(0, 0, this.W, this.H);
        }
    }
    _drawDecorations() {
        const bushSprite = getSprite('bush');
        const hillSprite = getSprite('hill');
        const cloudSprite = getSprite('cloud');
        if (cloudSprite && this.theme === 'overworld') {
            for (const c of this.decorations.clouds) {
                const s = this.camera.toScreen(c.x, c.y);
                if (this.camera.isVisible(c.x, c.y, 16, 16)) {
                    this.ctx.drawImage(cloudSprite, s.x, s.y);
                }
            }
        }
        if (hillSprite && this.theme === 'overworld') {
            for (const h of this.decorations.hills) {
                const s = this.camera.toScreen(h.x, h.y);
                if (this.camera.isVisible(h.x, h.y, 16, 16)) {
                    this.ctx.drawImage(hillSprite, s.x, s.y);
                }
            }
        }
        if (bushSprite && this.theme !== 'castle') {
            for (const b of this.decorations.bushes) {
                const s = this.camera.toScreen(b.x, b.y);
                if (this.camera.isVisible(b.x, b.y, 16, 16)) {
                    this.ctx.drawImage(bushSprite, s.x, s.y);
                }
            }
        }
    }
    _drawWaterLava() {
        for (const w of this.waterTiles) {
            if (!this.camera.isVisible(w.x, w.y, w.w, w.h)) continue;
            const s = this.camera.toScreen(w.x, w.y);
            const sprite = getSprite('water_tile');
            if (sprite) {
                this.ctx.drawImage(sprite, s.x, s.y);
            } else {
                this.ctx.fillStyle = '#2060e0';
                this.ctx.fillRect(s.x, s.y, TILE, TILE);
            }
        }
        for (const l of this.lavaTiles) {
            if (!this.camera.isVisible(l.x, l.y, l.w, l.h)) continue;
            const s = this.camera.toScreen(l.x, l.y);
            const sprite = getSprite('lava_tile');
            if (sprite) {
                this.ctx.drawImage(sprite, s.x, s.y);
            } else {
                this.ctx.fillStyle = '#e04010';
                this.ctx.fillRect(s.x, s.y, TILE, TILE);
            }
        }
    }
    _drawParticles() {
        for (const p of this.particles) {
            const s = this.camera.toScreen(p.x, p.y);
            this.ctx.save();
            this.ctx.globalAlpha = p.alpha;
            let spriteName = null;
            if (p.type === 'brick') spriteName = 'brick_particle';
            else if (p.type === 'sparkle') spriteName = 'coin_sparkle';
            else if (p.type === 'dust') spriteName = 'dust_particle';
            else if (p.type === 'squish') spriteName = 'squish_particle';
            else if (p.type === 'glow') spriteName = 'powerup_glow';
            if (spriteName) {
                const sprite = getSprite(spriteName);
                if (sprite) {
                    this.ctx.drawImage(sprite, s.x, s.y);
                }
            }
            this.ctx.restore();
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
    _drawCheckpoint() {
        const cp = this.checkpoint;
        const s = this.camera.toScreen(cp.x, cp.y);
        const sprite = getSprite('checkpoint');
        if (sprite) {
            this.ctx.drawImage(sprite, s.x, s.y);
        } else {
            this.ctx.fillStyle = '#f80';
            this.ctx.fillRect(s.x + 7, s.y, 2, 16);
            this.ctx.fillStyle = '#ff0';
            this.ctx.fillRect(s.x + 1, s.y + 2, 6, 6);
        }
    }
    _drawUI() {
        if (!this.mario) return;
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '8px "Press Start 2P", monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('MARIO', 8, 16);
        this.ctx.fillText(String(this.mario.score).padStart(6, '0'), 8, 28);

        // Coin counter with animation
        this.ctx.textAlign = 'center';
        const coinSprite = getSprite('item_coin_0');
        const coinFrame = Math.floor(this.frameCount / 8) % 4;
        const animCoinSprite = getSprite('item_coin_' + coinFrame);
        if (animCoinSprite) {
            this.ctx.drawImage(animCoinSprite, 76, 18, 8, 10);
        } else if (coinSprite) {
            this.ctx.drawImage(coinSprite, 76, 18, 8, 10);
        } else {
            this.ctx.fillStyle = '#f5d442';
            this.ctx.fillRect(76, 20, 8, 10);
        }
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText('x' + String(this.mario.coins).padStart(2, '0'), 92, 28);

        // World display
        const levelName = this.levelData ? this.levelData.name || '1-1' : '1-1';
        this.ctx.fillText('WORLD', 152, 16);
        this.ctx.fillText(levelName, 152, 28);

        this.ctx.textAlign = 'right';
        this.ctx.fillText('TIME', 248, 16);
        this.ctx.fillText(String(Math.max(0, Math.floor(this.time))), 248, 28);

        // Lives display as Mario heads
        this.ctx.textAlign = 'left';
        const headSprite = getSprite('mario_head');
        for (let i = 0; i < Math.min(this.mario.lives, 5); i++) {
            const hx = 8 + i * 12;
            const hy = 34;
            if (headSprite) {
                this.ctx.drawImage(headSprite, hx, hy);
            } else {
                this.ctx.fillStyle = '#e52521';
                this.ctx.fillRect(hx + 2, hy, 6, 4);
                this.ctx.fillStyle = '#fca044';
                this.ctx.fillRect(hx + 2, hy + 4, 6, 3);
            }
        }
        if (this.mario.lives > 5) {
            this.ctx.fillStyle = '#fff';
            this.ctx.fillText('x' + this.mario.lives, 8 + 5 * 12 + 4, 42);
        }
    }
    _drawTitle() {
        // Animated background
        this.ctx.fillStyle = '#5c94fc';
        this.ctx.fillRect(0, 0, this.W, this.H);
        for (let i = 0; i < 6; i++) {
            const bx = ((80 + i * 180 + this.frameCount * 0.2) % (this.W + 200)) - 100;
            const by = 40 + (i % 3) * 20;
            const sprite = getSprite('cloud');
            if (sprite) {
                this.ctx.drawImage(sprite, bx, by);
            }
        }
        // Ground strip
        this.ctx.fillStyle = '#c84c09';
        this.ctx.fillRect(0, this.H - 32, this.W, 32);
        this.ctx.fillStyle = '#e09050';
        this.ctx.fillRect(0, this.H - 32, this.W, 2);

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
        this.ctx.fillText('P: Pause', this.W / 2, 210);
    }
    _drawTransition() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.W, this.H);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '10px "Press Start 2P", monospace';
        this.ctx.textAlign = 'center';
        const nextLevel = this.levelData ? (this.levelData.levelId + 1) : 2;
        this.ctx.fillText('WORLD ' + nextLevel, this.W / 2, this.H / 2 - 10);
        this.ctx.font = '8px "Press Start 2P", monospace';
        this.ctx.fillText('GET READY!', this.W / 2, this.H / 2 + 10);
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
    _drawPause() {
        this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
        this.ctx.fillRect(0, 0, this.W, this.H);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '14px "Press Start 2P", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSED', this.W / 2, this.H / 2 - 10);
        this.ctx.font = '8px "Press Start 2P", monospace';
        this.ctx.fillText('Press P to resume', this.W / 2, this.H / 2 + 10);
    }
    loop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.loop());
    }
    start() { this.loop(); }
}