class LevelManager {
    constructor() {
        this.currentLevel = null;
        this.levelIndex = 0;
        this.levels = ['levels/level1.json'];
    }
    async loadLevel(index) {
        this.levelIndex = index;
        const url = this.levels[index] || this.levels[0];
        try {
            const resp = await fetch(url);
            const data = await resp.json();
            this.currentLevel = this._parseLevel(data);
            return this.currentLevel;
        } catch (e) {
            console.error('关卡加载失败:', e);
            return null;
        }
    }
    _parseLevel(data) {
        const TILE = 16;
        const parsed = {
            levelId: data.levelId || 1,
            name: data.name || 'World 1-1',
            timeLimit: data.timeLimit || 400,
            width: data.width || 210,
            height: data.height || 15,
            playerStart: data.playerStart || { x: 48, y: 192 },
            platforms: data.platforms || [],
            blocks: data.blocks || [],
            enemies: data.enemies || [],
            coins: data.coins || [],
            pipes: data.pipes || [],
            flagpole: data.flagpole || null
        };
        if (data.tilemap && Array.isArray(data.tilemap)) {
            const tilePlatforms = [];
            const tileBlocks = [];
            for (let row = 0; row < data.tilemap.length; row++) {
                for (let col = 0; col < data.tilemap[row].length; col++) {
                    const val = data.tilemap[row][col];
                    const x = col * TILE;
                    const y = row * TILE;
                    if (val === 1) {
                        tilePlatforms.push({ x, y, w: TILE, h: TILE });
                    } else if (val === 2) {
                        tileBlocks.push({ x, y, type: 2, content: null });
                    } else if (val === 3) {
                        tileBlocks.push({ x, y, type: 3, content: 'coin' });
                    } else if (val === 5) {
                        tileBlocks.push({ x, y, type: 5, content: null });
                    }
                }
            }
            if (tilePlatforms.length > 0) {
                parsed.platforms = parsed.platforms.concat(tilePlatforms);
            }
            if (tileBlocks.length > 0) {
                parsed.blocks = parsed.blocks.concat(tileBlocks);
            }
        }
        if (data.pipes && Array.isArray(data.pipes)) {
            parsed.pipes = data.pipes;
        }
        return parsed;
    }
    getNextLevel() {
        const next = this.levelIndex + 1;
        if (next < this.levels.length) return next;
        return -1;
    }
}
