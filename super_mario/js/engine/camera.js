class Camera {
    constructor(viewW, viewH) {
        this.x = 0; this.y = 0;
        this.viewW = viewW; this.viewH = viewH;
        this.target = null;
        this.lerpFactor = 0.08;
    }
    follow(target) { this.target = target; }
    update(levelW, levelH) {
        if (!this.target) return;
        const targetX = this.target.x + this.target.w / 2 - this.viewW / 2;
        const targetY = this.target.y + this.target.h / 2 - this.viewH / 2;
        this.x += (targetX - this.x) * this.lerpFactor;
        this.y += (targetY - this.y) * this.lerpFactor;
        if (this.x < 0) this.x = 0;
        if (this.x > levelW - this.viewW) this.x = levelW - this.viewW;
        if (this.y < 0) this.y = 0;
        if (this.y > levelH - this.viewH) this.y = levelH - this.viewH;
    }
    isVisible(x, y, w, h) {
        return x + w > this.x && x < this.x + this.viewW &&
               y + h > this.y && y < this.y + this.viewH;
    }
    toScreen(x, y) { return { x: x - this.x, y: y - this.y }; }
}
