class PhysicsEngine {
    constructor() {
        this.gravity = 0.45;
        this.maxFallSpeed = 10;
    }
    applyGravity(entity) {
        if (!entity.isGrounded) {
            entity.vy += this.gravity;
            if (entity.vy > this.maxFallSpeed) entity.vy = this.maxFallSpeed;
        }
    }
    update(entity) {
        this.applyGravity(entity);
        entity.x += entity.vx;
        entity.y += entity.vy;
    }
    resolveCollision(entity, block, direction) {
        if (direction === 'bottom') {
            entity.y = block.y - entity.h;
            if (entity.vy > 0) entity.vy = 0;
            entity.isGrounded = true;
        } else if (direction === 'top') {
            entity.y = block.y + block.h;
            if (entity.vy < 0) entity.vy = 0;
        } else if (direction === 'left') {
            entity.x = block.x - entity.w;
            if (entity.vx > 0) entity.vx = 0;
        } else if (direction === 'right') {
            entity.x = block.x + block.w;
            if (entity.vx < 0) entity.vx = 0;
        }
    }
    resolveCollisionWithResponse(a, b) {
        if (!this.checkAABB(a, b)) return null;
        return this.getCollisionDirection(a, b);
    }
    checkAABB(a, b) {
        return a.x < b.x + b.w && a.x + a.w > b.x &&
               a.y < b.y + b.h && a.y + a.h > b.y;
    }
    getCollisionDirection(a, b) {
        const overlapLeft = (a.x + a.w) - b.x;
        const overlapRight = (b.x + b.w) - a.x;
        const overlapTop = (a.y + a.h) - b.y;
        const overlapBottom = (b.y + b.h) - a.y;
        const minOverlapX = Math.min(overlapLeft, overlapRight);
        const minOverlapY = Math.min(overlapTop, overlapBottom);
        if (minOverlapX < minOverlapY) {
            return overlapLeft < overlapRight ? 'left' : 'right';
        } else {
            return overlapTop < overlapBottom ? 'top' : 'bottom';
        }
    }
    checkGroundBelow(entity, groundTiles, blocks) {
        const checkX = entity.x + entity.w / 2;
        const checkY = entity.y + entity.h;
        const maxCheckY = checkY + 32;
        const allSolids = [...groundTiles];
        if (blocks) {
            for (const b of blocks) {
                if (b.breaking && b.breakTimer <= 0) continue;
                if (!b.isSolid || b.isSolid()) allSolids.push(b);
            }
        }
        for (const solid of allSolids) {
            if (checkX >= solid.x && checkX <= solid.x + solid.w) {
                if (solid.y >= checkY && solid.y <= maxCheckY) {
                    return true;
                }
            }
        }
        return false;
    }
}
