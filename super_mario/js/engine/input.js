class InputManager {
    constructor() {
        this.keys = {};
        this.keyJustPressed = {};
        this._prevKeys = {};
        this.mapping = {
            'ArrowLeft': 'left', 'ArrowRight': 'right', 'ArrowUp': 'up', 'ArrowDown': 'down',
            'KeyA': 'left', 'KeyD': 'right', 'KeyW': 'up', 'KeyS': 'down',
            'Space': 'jump', 'KeyZ': 'jump', 'KeyX': 'fire', 'Enter': 'enter'
        };
        window.addEventListener('keydown', e => {
            const action = this.mapping[e.code];
            if (action) { this.keys[action] = true; e.preventDefault(); }
        });
        window.addEventListener('keyup', e => {
            const action = this.mapping[e.code];
            if (action) { this.keys[action] = false; e.preventDefault(); }
        });
    }
    update() {
        for (const action of Object.values(this.mapping)) {
            this.keyJustPressed[action] = this.keys[action] && !this._prevKeys[action];
        }
        this._prevKeys = { ...this.keys };
    }
    isDown(action) { return !!this.keys[action]; }
    justPressed(action) { return !!this.keyJustPressed[action]; }
}
