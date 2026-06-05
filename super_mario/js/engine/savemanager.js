class SaveManager {
    constructor() {
        this.storageKey = 'supermario_save';
    }
    save(data) {
        try {
            const saveData = {
                levelId: data.levelId || 1,
                lives: data.lives || 3,
                score: data.score || 0,
                coins: data.coins || 0,
                timestamp: Date.now()
            };
            localStorage.setItem(this.storageKey, JSON.stringify(saveData));
            return true;
        } catch (e) {
            return false;
        }
    }
    load() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (!raw) return null;
            const data = JSON.parse(raw);
            if (!data.levelId || !data.timestamp) return null;
            return data;
        } catch (e) {
            return null;
        }
    }
    clear() {
        try {
            localStorage.removeItem(this.storageKey);
        } catch (e) { }
    }
    hasSave() {
        return this.load() !== null;
    }
}