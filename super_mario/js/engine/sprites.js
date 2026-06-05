const SPRITE_SIZE = 16;
const SPRITE_CANVAS = document.createElement('canvas');
SPRITE_CANVAS.width = SPRITE_SIZE * 20;
SPRITE_CANVAS.height = SPRITE_SIZE * 20;
const SCTX = SPRITE_CANVAS.getContext('2d');
SCTX.imageSmoothingEnabled = false;

const C = {
    SKIN: '#fca044',
    SKIN_DARK: '#d87830',
    RED: '#e02020',
    RED_DARK: '#a81010',
    BLUE: '#2040c0',
    BLUE_DARK: '#102080',
    CYAN: '#40c0ff',
    CYAN_DARK: '#2080c0',
    ICE_BLUE: '#80d8ff',
    ICE_BLUE_DARK: '#4090c0',
    BROWN: '#a05020',
    BROWN_DARK: '#703010',
    YELLOW: '#f8b800',
    YELLOW_DARK: '#c08000',
    GREEN: '#20a020',
    GREEN_DARK: '#106010',
    GREEN_LIGHT: '#40d040',
    WHITE: '#fcfcfc',
    BLACK: '#000000',
    GRAY: '#888888',
    GRAY_LIGHT: '#aaaaaa',
    GRAY_DARK: '#555555',
    ORANGE: '#e08020',
    ORANGE_DARK: '#a05010',
    PINK: '#fc80a0',
    PURPLE: '#a040d0',
    PURPLE_DARK: '#7020a0',
    BG_SKY: '#5c94fc',
    BG_UNDERGROUND: '#000000',
    BG_CASTLE: '#303030',
    GROUND: '#c84c09',
    GROUND_LIGHT: '#e09050',
    GROUND_UNDERGROUND: '#4060a0',
    GROUND_UNDERGROUND_LIGHT: '#6080c0',
    GROUND_CASTLE: '#606060',
    GROUND_CASTLE_LIGHT: '#808080',
    PIPE_GREEN: '#20a020',
    PIPE_GREEN_LIGHT: '#40d040',
    FLAG_GREEN: '#20a020',
    FLAG_POLE: '#888888',
    STAR: '#f8b800',
    STAR_DARK: '#c08000',
    FIRE_RED: '#e02020',
    FIRE_YELLOW: '#f8b800',
    FIRE_ORANGE: '#e08020',
    LAVA: '#e04010',
    LAVA_LIGHT: '#ff6030',
    LAVA_YELLOW: '#ffc000',
    WATER: '#2060e0',
    WATER_LIGHT: '#4080ff',
};

const SPRITES = {};

function createSprite(name, w, h, drawFn) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    drawFn(ctx, w, h);
    SPRITES[name] = canvas;
}

function px(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
}

function rect(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

function hLine(ctx, x, y, len, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, len, 1);
}

function vLine(ctx, x, y, len, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, len);
}

// ========== MARIO SPRITES ==========

function drawSmallMario(ctx, w, h, frame, facing) {
    const fx = facing > 0 ? 0 : 1;
    const hatX = fx ? 2 : 1;
    const faceX = fx ? 1 : 2;
    const eyeX = fx ? 7 : 6;

    rect(ctx, hatX + 1, 0, 10, 4, C.RED);
    rect(ctx, hatX, 1, 12, 3, C.RED);
    px(ctx, hatX + 1, 0, C.RED_DARK);
    px(ctx, hatX + 10, 0, C.RED_DARK);

    rect(ctx, faceX + 1, 4, 10, 3, C.SKIN);
    rect(ctx, faceX, 5, 12, 2, C.SKIN);
    px(ctx, eyeX, 5, C.BLACK);
    px(ctx, eyeX + 1, 5, C.BLACK);
    px(ctx, eyeX + 2, 5, C.BLACK);

    rect(ctx, 2, 7, 12, 2, C.RED);
    rect(ctx, 1, 9, 14, 2, C.RED);

    rect(ctx, 2, 11, 5, 2, C.BLUE);
    rect(ctx, 9, 11, 5, 2, C.BLUE);
    rect(ctx, 2, 13, 5, 2, C.BLUE_DARK);
    rect(ctx, 9, 13, 5, 2, C.BLUE_DARK);

    if (frame === 0) {
        rect(ctx, 2, 15, 4, 1, C.BROWN);
        rect(ctx, 10, 15, 4, 1, C.BROWN);
    } else if (frame === 1) {
        rect(ctx, 3, 15, 4, 1, C.BROWN);
        rect(ctx, 9, 15, 4, 1, C.BROWN);
    } else {
        rect(ctx, 1, 15, 4, 1, C.BROWN);
        rect(ctx, 11, 15, 4, 1, C.BROWN);
    }
}

function drawSmallMarioJump(ctx, w, h, facing) {
    const fx = facing > 0 ? 0 : 1;
    const hatX = fx ? 2 : 1;
    const faceX = fx ? 1 : 2;
    const eyeX = fx ? 7 : 6;

    rect(ctx, hatX + 1, 0, 10, 4, C.RED);
    rect(ctx, hatX, 1, 12, 3, C.RED);
    rect(ctx, faceX + 1, 4, 10, 3, C.SKIN);
    rect(ctx, faceX, 5, 12, 2, C.SKIN);
    px(ctx, eyeX, 5, C.BLACK);
    px(ctx, eyeX + 1, 5, C.BLACK);
    px(ctx, eyeX + 2, 5, C.BLACK);
    rect(ctx, 2, 7, 12, 2, C.RED);
    rect(ctx, 1, 9, 14, 2, C.RED);
    rect(ctx, 2, 11, 5, 2, C.BLUE);
    rect(ctx, 9, 11, 5, 2, C.BLUE);
    rect(ctx, 2, 13, 5, 2, C.BLUE_DARK);
    rect(ctx, 9, 13, 5, 2, C.BLUE_DARK);
    rect(ctx, 1, 15, 4, 1, C.BROWN);
    rect(ctx, 11, 15, 4, 1, C.BROWN);
}

function drawSmallMarioDead(ctx, w, h) {
    rect(ctx, 2, 0, 10, 4, C.RED);
    rect(ctx, 1, 1, 12, 3, C.RED);
    rect(ctx, 2, 4, 10, 3, C.SKIN);
    rect(ctx, 1, 5, 12, 2, C.SKIN);
    px(ctx, 6, 5, C.BLACK);
    px(ctx, 7, 5, C.BLACK);
    px(ctx, 8, 5, C.BLACK);
    rect(ctx, 2, 7, 12, 2, C.RED);
    rect(ctx, 1, 9, 14, 2, C.RED);
    rect(ctx, 2, 11, 5, 2, C.BLUE);
    rect(ctx, 9, 11, 5, 2, C.BLUE);
    rect(ctx, 2, 13, 5, 2, C.BLUE_DARK);
    rect(ctx, 9, 13, 5, 2, C.BLUE_DARK);
    rect(ctx, 2, 15, 4, 1, C.BROWN);
    rect(ctx, 10, 15, 4, 1, C.BROWN);
}

function drawBigMario(ctx, w, h, frame, facing) {
    const fx = facing > 0 ? 0 : 1;
    const hatX = fx ? 2 : 1;
    const faceX = fx ? 1 : 2;
    const eyeX = fx ? 8 : 6;

    rect(ctx, hatX + 1, 0, 10, 5, C.RED);
    rect(ctx, hatX, 1, 12, 4, C.RED);
    px(ctx, hatX + 1, 0, C.RED_DARK);
    px(ctx, hatX + 10, 0, C.RED_DARK);

    rect(ctx, faceX + 1, 5, 10, 4, C.SKIN);
    rect(ctx, faceX, 6, 12, 3, C.SKIN);
    px(ctx, eyeX, 7, C.BLACK);
    px(ctx, eyeX + 1, 7, C.BLACK);
    px(ctx, eyeX + 2, 7, C.BLACK);

    rect(ctx, 1, 9, 14, 3, C.RED);
    rect(ctx, 0, 12, 16, 3, C.RED);

    rect(ctx, 1, 15, 6, 3, C.BLUE);
    rect(ctx, 9, 15, 6, 3, C.BLUE);
    rect(ctx, 1, 18, 6, 3, C.BLUE_DARK);
    rect(ctx, 9, 18, 6, 3, C.BLUE_DARK);

    rect(ctx, 1, 21, 6, 3, C.BLUE);
    rect(ctx, 9, 21, 6, 3, C.BLUE);
    rect(ctx, 1, 24, 6, 3, C.BLUE_DARK);
    rect(ctx, 9, 24, 6, 3, C.BLUE_DARK);

    if (frame === 0) {
        rect(ctx, 1, 27, 6, 3, C.BROWN);
        rect(ctx, 9, 27, 6, 3, C.BROWN);
        rect(ctx, 1, 30, 6, 2, C.BROWN_DARK);
        rect(ctx, 9, 30, 6, 2, C.BROWN_DARK);
    } else if (frame === 1) {
        rect(ctx, 2, 27, 6, 3, C.BROWN);
        rect(ctx, 8, 27, 6, 3, C.BROWN);
        rect(ctx, 2, 30, 6, 2, C.BROWN_DARK);
        rect(ctx, 8, 30, 6, 2, C.BROWN_DARK);
    } else {
        rect(ctx, 0, 27, 6, 3, C.BROWN);
        rect(ctx, 10, 27, 6, 3, C.BROWN);
        rect(ctx, 0, 30, 6, 2, C.BROWN_DARK);
        rect(ctx, 10, 30, 6, 2, C.BROWN_DARK);
    }
}

function drawBigMarioJump(ctx, w, h, facing) {
    const fx = facing > 0 ? 0 : 1;
    const hatX = fx ? 2 : 1;
    const faceX = fx ? 1 : 2;
    const eyeX = fx ? 8 : 6;

    rect(ctx, hatX + 1, 0, 10, 5, C.RED);
    rect(ctx, hatX, 1, 12, 4, C.RED);
    rect(ctx, faceX + 1, 5, 10, 4, C.SKIN);
    rect(ctx, faceX, 6, 12, 3, C.SKIN);
    px(ctx, eyeX, 7, C.BLACK);
    px(ctx, eyeX + 1, 7, C.BLACK);
    px(ctx, eyeX + 2, 7, C.BLACK);
    rect(ctx, 1, 9, 14, 3, C.RED);
    rect(ctx, 0, 12, 16, 3, C.RED);
    rect(ctx, 1, 15, 6, 3, C.BLUE);
    rect(ctx, 9, 15, 6, 3, C.BLUE);
    rect(ctx, 1, 18, 6, 3, C.BLUE_DARK);
    rect(ctx, 9, 18, 6, 3, C.BLUE_DARK);
    rect(ctx, 1, 21, 6, 3, C.BLUE);
    rect(ctx, 9, 21, 6, 3, C.BLUE);
    rect(ctx, 1, 24, 6, 3, C.BLUE_DARK);
    rect(ctx, 9, 24, 6, 3, C.BLUE_DARK);
    rect(ctx, 0, 27, 6, 3, C.BROWN);
    rect(ctx, 10, 27, 6, 3, C.BROWN);
    rect(ctx, 0, 30, 6, 2, C.BROWN_DARK);
    rect(ctx, 10, 30, 6, 2, C.BROWN_DARK);
}

function drawBigMarioCrouch(ctx, w, h, facing) {
    const fx = facing > 0 ? 0 : 1;
    const hatX = fx ? 2 : 1;
    const faceX = fx ? 1 : 2;
    const eyeX = fx ? 8 : 6;

    rect(ctx, hatX + 1, 0, 10, 5, C.RED);
    rect(ctx, hatX, 1, 12, 4, C.RED);
    rect(ctx, faceX + 1, 5, 10, 4, C.SKIN);
    rect(ctx, faceX, 6, 12, 3, C.SKIN);
    px(ctx, eyeX, 7, C.BLACK);
    px(ctx, eyeX + 1, 7, C.BLACK);
    px(ctx, eyeX + 2, 7, C.BLACK);
    rect(ctx, 1, 9, 14, 3, C.RED);
    rect(ctx, 0, 12, 16, 3, C.RED);
    rect(ctx, 1, 15, 6, 3, C.BLUE);
    rect(ctx, 9, 15, 6, 3, C.BLUE);
    rect(ctx, 1, 18, 6, 3, C.BLUE_DARK);
    rect(ctx, 9, 18, 6, 3, C.BLUE_DARK);
    rect(ctx, 1, 21, 6, 3, C.BLUE);
    rect(ctx, 9, 21, 6, 3, C.BLUE);
    rect(ctx, 1, 24, 6, 3, C.BLUE_DARK);
    rect(ctx, 9, 24, 6, 3, C.BLUE_DARK);
    rect(ctx, 1, 27, 6, 3, C.BROWN);
    rect(ctx, 9, 27, 6, 3, C.BROWN);
    rect(ctx, 1, 30, 6, 2, C.BROWN_DARK);
    rect(ctx, 9, 30, 6, 2, C.BROWN_DARK);
}

function drawFireMario(ctx, w, h, frame, facing) {
    const fx = facing > 0 ? 0 : 1;
    const hatX = fx ? 2 : 1;
    const faceX = fx ? 1 : 2;
    const eyeX = fx ? 8 : 6;

    rect(ctx, hatX + 1, 0, 10, 5, C.RED);
    rect(ctx, hatX, 1, 12, 4, C.RED);
    rect(ctx, faceX + 1, 5, 10, 4, C.SKIN);
    rect(ctx, faceX, 6, 12, 3, C.SKIN);
    px(ctx, eyeX, 7, C.BLACK);
    px(ctx, eyeX + 1, 7, C.BLACK);
    px(ctx, eyeX + 2, 7, C.BLACK);

    rect(ctx, 1, 9, 14, 3, C.WHITE);
    rect(ctx, 0, 12, 16, 3, C.WHITE);

    rect(ctx, 1, 15, 6, 3, C.RED);
    rect(ctx, 9, 15, 6, 3, C.RED);
    rect(ctx, 1, 18, 6, 3, C.RED_DARK);
    rect(ctx, 9, 18, 6, 3, C.RED_DARK);

    rect(ctx, 1, 21, 6, 3, C.RED);
    rect(ctx, 9, 21, 6, 3, C.RED);
    rect(ctx, 1, 24, 6, 3, C.RED_DARK);
    rect(ctx, 9, 24, 6, 3, C.RED_DARK);

    if (frame === 0) {
        rect(ctx, 1, 27, 6, 3, C.BROWN);
        rect(ctx, 9, 27, 6, 3, C.BROWN);
        rect(ctx, 1, 30, 6, 2, C.BROWN_DARK);
        rect(ctx, 9, 30, 6, 2, C.BROWN_DARK);
    } else if (frame === 1) {
        rect(ctx, 2, 27, 6, 3, C.BROWN);
        rect(ctx, 8, 27, 6, 3, C.BROWN);
        rect(ctx, 2, 30, 6, 2, C.BROWN_DARK);
        rect(ctx, 8, 30, 6, 2, C.BROWN_DARK);
    } else {
        rect(ctx, 0, 27, 6, 3, C.BROWN);
        rect(ctx, 10, 27, 6, 3, C.BROWN);
        rect(ctx, 0, 30, 6, 2, C.BROWN_DARK);
        rect(ctx, 10, 30, 6, 2, C.BROWN_DARK);
    }
}

function drawFireMarioJump(ctx, w, h, facing) {
    const fx = facing > 0 ? 0 : 1;
    const hatX = fx ? 2 : 1;
    const faceX = fx ? 1 : 2;
    const eyeX = fx ? 8 : 6;

    rect(ctx, hatX + 1, 0, 10, 5, C.RED);
    rect(ctx, hatX, 1, 12, 4, C.RED);
    rect(ctx, faceX + 1, 5, 10, 4, C.SKIN);
    rect(ctx, faceX, 6, 12, 3, C.SKIN);
    px(ctx, eyeX, 7, C.BLACK);
    px(ctx, eyeX + 1, 7, C.BLACK);
    px(ctx, eyeX + 2, 7, C.BLACK);
    rect(ctx, 1, 9, 14, 3, C.WHITE);
    rect(ctx, 0, 12, 16, 3, C.WHITE);
    rect(ctx, 1, 15, 6, 3, C.RED);
    rect(ctx, 9, 15, 6, 3, C.RED);
    rect(ctx, 1, 18, 6, 3, C.RED_DARK);
    rect(ctx, 9, 18, 6, 3, C.RED_DARK);
    rect(ctx, 1, 21, 6, 3, C.RED);
    rect(ctx, 9, 21, 6, 3, C.RED);
    rect(ctx, 1, 24, 6, 3, C.RED_DARK);
    rect(ctx, 9, 24, 6, 3, C.RED_DARK);
    rect(ctx, 0, 27, 6, 3, C.BROWN);
    rect(ctx, 10, 27, 6, 3, C.BROWN);
    rect(ctx, 0, 30, 6, 2, C.BROWN_DARK);
    rect(ctx, 10, 30, 6, 2, C.BROWN_DARK);
}

// Ice Mario sprites
function drawIceMario(ctx, w, h, frame, facing) {
    const fx = facing > 0 ? 0 : 1;
    const hatX = fx ? 2 : 1;
    const faceX = fx ? 1 : 2;
    const eyeX = fx ? 8 : 6;

    rect(ctx, hatX + 1, 0, 10, 5, C.CYAN_DARK);
    rect(ctx, hatX, 1, 12, 4, C.CYAN_DARK);
    rect(ctx, faceX + 1, 5, 10, 4, C.SKIN);
    rect(ctx, faceX, 6, 12, 3, C.SKIN);
    px(ctx, eyeX, 7, C.BLACK);
    px(ctx, eyeX + 1, 7, C.BLACK);
    px(ctx, eyeX + 2, 7, C.BLACK);

    rect(ctx, 1, 9, 14, 3, C.ICE_BLUE);
    rect(ctx, 0, 12, 16, 3, C.ICE_BLUE);

    rect(ctx, 1, 15, 6, 3, C.CYAN);
    rect(ctx, 9, 15, 6, 3, C.CYAN);
    rect(ctx, 1, 18, 6, 3, C.CYAN_DARK);
    rect(ctx, 9, 18, 6, 3, C.CYAN_DARK);

    rect(ctx, 1, 21, 6, 3, C.CYAN);
    rect(ctx, 9, 21, 6, 3, C.CYAN);
    rect(ctx, 1, 24, 6, 3, C.CYAN_DARK);
    rect(ctx, 9, 24, 6, 3, C.CYAN_DARK);

    if (frame === 0) {
        rect(ctx, 1, 27, 6, 3, C.BROWN);
        rect(ctx, 9, 27, 6, 3, C.BROWN);
        rect(ctx, 1, 30, 6, 2, C.BROWN_DARK);
        rect(ctx, 9, 30, 6, 2, C.BROWN_DARK);
    } else if (frame === 1) {
        rect(ctx, 2, 27, 6, 3, C.BROWN);
        rect(ctx, 8, 27, 6, 3, C.BROWN);
        rect(ctx, 2, 30, 6, 2, C.BROWN_DARK);
        rect(ctx, 8, 30, 6, 2, C.BROWN_DARK);
    } else {
        rect(ctx, 0, 27, 6, 3, C.BROWN);
        rect(ctx, 10, 27, 6, 3, C.BROWN);
        rect(ctx, 0, 30, 6, 2, C.BROWN_DARK);
        rect(ctx, 10, 30, 6, 2, C.BROWN_DARK);
    }
}

function drawIceMarioJump(ctx, w, h, facing) {
    const fx = facing > 0 ? 0 : 1;
    const hatX = fx ? 2 : 1;
    const faceX = fx ? 1 : 2;
    const eyeX = fx ? 8 : 6;

    rect(ctx, hatX + 1, 0, 10, 5, C.CYAN_DARK);
    rect(ctx, hatX, 1, 12, 4, C.CYAN_DARK);
    rect(ctx, faceX + 1, 5, 10, 4, C.SKIN);
    rect(ctx, faceX, 6, 12, 3, C.SKIN);
    px(ctx, eyeX, 7, C.BLACK);
    px(ctx, eyeX + 1, 7, C.BLACK);
    px(ctx, eyeX + 2, 7, C.BLACK);
    rect(ctx, 1, 9, 14, 3, C.ICE_BLUE);
    rect(ctx, 0, 12, 16, 3, C.ICE_BLUE);
    rect(ctx, 1, 15, 6, 3, C.CYAN);
    rect(ctx, 9, 15, 6, 3, C.CYAN);
    rect(ctx, 1, 18, 6, 3, C.CYAN_DARK);
    rect(ctx, 9, 18, 6, 3, C.CYAN_DARK);
    rect(ctx, 1, 21, 6, 3, C.CYAN);
    rect(ctx, 9, 21, 6, 3, C.CYAN);
    rect(ctx, 1, 24, 6, 3, C.CYAN_DARK);
    rect(ctx, 9, 24, 6, 3, C.CYAN_DARK);
    rect(ctx, 0, 27, 6, 3, C.BROWN);
    rect(ctx, 10, 27, 6, 3, C.BROWN);
    rect(ctx, 0, 30, 6, 2, C.BROWN_DARK);
    rect(ctx, 10, 30, 6, 2, C.BROWN_DARK);
}

// Death animation (X eyes)
function drawMarioDeath(ctx, w, h, facing) {
    const fx = facing > 0 ? 0 : 1;
    const hatX = fx ? 2 : 1;
    const faceX = fx ? 1 : 2;

    rect(ctx, hatX + 1, 0, 10, 4, C.RED);
    rect(ctx, hatX, 1, 12, 3, C.RED);
    rect(ctx, faceX + 1, 4, 10, 3, C.SKIN);
    rect(ctx, faceX, 5, 12, 2, C.SKIN);
    // X eyes
    rect(ctx, 5, 5, 2, 2, C.BLACK);
    rect(ctx, 8, 5, 2, 2, C.BLACK);
    px(ctx, 5, 5, C.BLACK);
    px(ctx, 6, 6, C.BLACK);
    px(ctx, 8, 5, C.BLACK);
    px(ctx, 9, 6, C.BLACK);
    px(ctx, 5, 6, C.BLACK);
    px(ctx, 6, 5, C.BLACK);
    px(ctx, 8, 6, C.BLACK);
    px(ctx, 9, 5, C.BLACK);

    rect(ctx, 2, 7, 12, 2, C.RED);
    rect(ctx, 1, 9, 14, 2, C.RED);
    rect(ctx, 2, 11, 5, 2, C.BLUE);
    rect(ctx, 9, 11, 5, 2, C.BLUE);
    rect(ctx, 2, 13, 5, 2, C.BLUE_DARK);
    rect(ctx, 9, 13, 5, 2, C.BLUE_DARK);
    rect(ctx, 2, 15, 4, 1, C.BROWN);
    rect(ctx, 10, 15, 4, 1, C.BROWN);
}

// Mario head icon for lives display
function drawMarioHead(ctx, w, h) {
    rect(ctx, 2, 0, 8, 4, C.RED);
    rect(ctx, 1, 1, 10, 3, C.RED);
    rect(ctx, 2, 4, 8, 3, C.SKIN);
    rect(ctx, 1, 5, 10, 2, C.SKIN);
    px(ctx, 5, 5, C.BLACK);
    px(ctx, 6, 5, C.BLACK);
    px(ctx, 7, 5, C.BLACK);
    rect(ctx, 2, 7, 8, 1, C.BROWN);
}

// ========== ENEMY SPRITES ==========

function drawGoomba(ctx, w, h, frame) {
    rect(ctx, 2, 0, 12, 5, C.BROWN);
    rect(ctx, 1, 1, 14, 3, C.BROWN);
    rect(ctx, 0, 5, 16, 5, C.BROWN);
    rect(ctx, 1, 4, 14, 2, C.BROWN_DARK);

    rect(ctx, 3, 2, 4, 3, C.WHITE);
    rect(ctx, 9, 2, 4, 3, C.WHITE);
    px(ctx, 5, 3, C.BLACK);
    px(ctx, 6, 3, C.BLACK);
    px(ctx, 11, 3, C.BLACK);
    px(ctx, 12, 3, C.BLACK);

    rect(ctx, 2, 10, 12, 2, C.BROWN);
    rect(ctx, 1, 12, 14, 2, C.BROWN);

    if (frame === 0) {
        rect(ctx, 2, 14, 5, 2, C.BLACK);
        rect(ctx, 9, 14, 5, 2, C.BLACK);
    } else {
        rect(ctx, 1, 14, 5, 2, C.BLACK);
        rect(ctx, 10, 14, 5, 2, C.BLACK);
    }
}

function drawGoombaSquished(ctx, w, h) {
    rect(ctx, 0, 0, 16, 4, C.BROWN);
    rect(ctx, 1, 1, 14, 2, C.BROWN_DARK);
    rect(ctx, 3, 1, 4, 2, C.WHITE);
    rect(ctx, 9, 1, 4, 2, C.WHITE);
    px(ctx, 5, 2, C.BLACK);
    px(ctx, 11, 2, C.BLACK);
    rect(ctx, 0, 4, 16, 4, C.BROWN);
}

function drawKoopa(ctx, w, h, frame) {
    rect(ctx, 2, 0, 12, 8, C.GREEN);
    rect(ctx, 1, 1, 14, 6, C.GREEN);
    rect(ctx, 0, 2, 16, 4, C.GREEN);
    rect(ctx, 1, 0, 14, 1, C.GREEN_LIGHT);

    rect(ctx, 4, 3, 3, 3, C.WHITE);
    rect(ctx, 9, 3, 3, 3, C.WHITE);
    px(ctx, 6, 4, C.BLACK);
    px(ctx, 11, 4, C.BLACK);

    rect(ctx, 2, 8, 12, 2, C.YELLOW);
    rect(ctx, 1, 10, 14, 2, C.YELLOW);
    rect(ctx, 0, 12, 16, 2, C.YELLOW);
    rect(ctx, 1, 14, 14, 2, C.YELLOW_DARK);

    if (frame === 0) {
        rect(ctx, 2, 14, 5, 2, C.ORANGE);
        rect(ctx, 9, 14, 5, 2, C.ORANGE);
    } else {
        rect(ctx, 1, 14, 5, 2, C.ORANGE);
        rect(ctx, 10, 14, 5, 2, C.ORANGE);
    }
}

function drawKoopaShell(ctx, w, h) {
    rect(ctx, 1, 0, 14, 4, C.GREEN);
    rect(ctx, 0, 1, 16, 2, C.GREEN);
    rect(ctx, 1, 4, 14, 4, C.GREEN);
    rect(ctx, 0, 5, 16, 2, C.GREEN);
    rect(ctx, 2, 8, 12, 4, C.YELLOW);
    rect(ctx, 1, 9, 14, 2, C.YELLOW);
    rect(ctx, 0, 12, 16, 2, C.YELLOW);
    rect(ctx, 1, 14, 14, 2, C.YELLOW_DARK);
    rect(ctx, 3, 2, 10, 2, C.GREEN_LIGHT);
    rect(ctx, 4, 6, 8, 2, C.GREEN_LIGHT);
}

// Piranha Plant
function drawPiranhaPlant(ctx, w, h, frame) {
    const mouthOpen = frame % 2 === 0;
    // Stem
    rect(ctx, 6, 6, 4, 10, C.GREEN);
    rect(ctx, 5, 7, 6, 8, C.GREEN_DARK);
    // Head
    rect(ctx, 2, 0, 12, 8, C.RED);
    rect(ctx, 1, 1, 14, 6, C.RED);
    rect(ctx, 0, 2, 16, 4, C.RED);
    rect(ctx, 1, 0, 14, 1, C.RED_DARK);
    // Mouth
    if (mouthOpen) {
        rect(ctx, 4, 4, 8, 3, C.BLACK);
        rect(ctx, 5, 5, 6, 1, C.WHITE);
        rect(ctx, 5, 6, 1, 1, C.WHITE);
        rect(ctx, 10, 6, 1, 1, C.WHITE);
    } else {
        rect(ctx, 4, 5, 8, 1, C.BLACK);
    }
    // Eyes
    rect(ctx, 5, 2, 2, 2, C.WHITE);
    rect(ctx, 9, 2, 2, 2, C.WHITE);
    px(ctx, 5, 2, C.BLACK);
    px(ctx, 9, 2, C.BLACK);
    // Leaves
    rect(ctx, 6, 7, 2, 2, C.GREEN_LIGHT);
    rect(ctx, 9, 9, 2, 2, C.GREEN_LIGHT);
}

// Buzzy Beetle
function drawBuzzyBeetle(ctx, w, h, frame) {
    // Shell
    rect(ctx, 1, 0, 14, 4, C.GRAY);
    rect(ctx, 0, 1, 16, 2, C.GRAY);
    rect(ctx, 1, 4, 14, 4, C.GRAY);
    rect(ctx, 0, 5, 16, 2, C.GRAY);
    rect(ctx, 2, 8, 12, 4, C.GRAY_DARK);
    rect(ctx, 1, 9, 14, 2, C.GRAY_DARK);
    rect(ctx, 3, 2, 10, 2, C.GRAY_LIGHT);
    rect(ctx, 4, 6, 8, 2, C.GRAY_LIGHT);
    // Head
    rect(ctx, 4, 0, 8, 4, C.ORANGE);
    rect(ctx, 3, 1, 10, 2, C.ORANGE);
    rect(ctx, 5, 1, 2, 2, C.WHITE);
    rect(ctx, 9, 1, 2, 2, C.WHITE);
    px(ctx, 6, 2, C.BLACK);
    px(ctx, 10, 2, C.BLACK);
    // Feet
    if (frame === 0) {
        rect(ctx, 2, 14, 5, 2, C.YELLOW);
        rect(ctx, 9, 14, 5, 2, C.YELLOW);
    } else {
        rect(ctx, 1, 14, 5, 2, C.YELLOW);
        rect(ctx, 10, 14, 5, 2, C.YELLOW);
    }
}

// Buzzy Beetle shell (flipped)
function drawBuzzyShell(ctx, w, h) {
    rect(ctx, 1, 0, 14, 4, C.GRAY);
    rect(ctx, 0, 1, 16, 2, C.GRAY);
    rect(ctx, 1, 4, 14, 4, C.GRAY);
    rect(ctx, 0, 5, 16, 2, C.GRAY);
    rect(ctx, 2, 8, 12, 4, C.GRAY_DARK);
    rect(ctx, 1, 9, 14, 2, C.GRAY_DARK);
    rect(ctx, 0, 12, 16, 2, C.GRAY);
    rect(ctx, 1, 14, 14, 2, C.GRAY_DARK);
    rect(ctx, 3, 2, 10, 2, C.GRAY_LIGHT);
    rect(ctx, 4, 6, 8, 2, C.GRAY_LIGHT);
}

// Lakitu
function drawLakituBody(ctx, w, h, frame) {
    // Cloud body
    rect(ctx, 2, 6, 12, 10, C.WHITE);
    rect(ctx, 0, 8, 16, 6, C.WHITE);
    rect(ctx, 1, 9, 14, 4, C.GRAY_LIGHT);
    // Head
    rect(ctx, 4, 0, 8, 7, C.YELLOW);
    rect(ctx, 3, 1, 10, 5, C.YELLOW);
    rect(ctx, 2, 2, 12, 3, C.YELLOW);
    rect(ctx, 5, 2, 2, 2, C.WHITE);
    rect(ctx, 9, 2, 2, 2, C.WHITE);
    px(ctx, 6, 3, C.BLACK);
    px(ctx, 10, 3, C.BLACK);
    // Glasses
    rect(ctx, 5, 3, 3, 3, C.BLACK);
    rect(ctx, 8, 3, 3, 3, C.BLACK);
    px(ctx, 6, 4, C.WHITE);
    px(ctx, 9, 4, C.WHITE);
    // Arms
    rect(ctx, 0, 8, 3, 2, C.YELLOW);
    rect(ctx, 13, 10, 3, 2, C.YELLOW);
}

// Spiny (thrown by Lakitu)
function drawSpiny(ctx, w, h, frame) {
    // Shell with spikes
    rect(ctx, 2, 2, 12, 10, C.RED);
    rect(ctx, 1, 3, 14, 8, C.RED);
    rect(ctx, 0, 4, 16, 6, C.RED);
    // Spikes
    rect(ctx, 4, 0, 2, 3, C.RED_DARK);
    rect(ctx, 8, 0, 2, 3, C.RED_DARK);
    rect(ctx, 12, 1, 2, 2, C.RED_DARK);
    rect(ctx, 0, 5, 2, 2, C.RED_DARK);
    rect(ctx, 14, 5, 2, 2, C.RED_DARK);
    // Face
    rect(ctx, 5, 5, 3, 3, C.WHITE);
    rect(ctx, 8, 5, 3, 3, C.WHITE);
    px(ctx, 6, 6, C.BLACK);
    px(ctx, 9, 6, C.BLACK);
    // Feet
    if (frame === 0) {
        rect(ctx, 2, 14, 5, 2, C.ORANGE);
        rect(ctx, 9, 14, 5, 2, C.ORANGE);
    } else {
        rect(ctx, 1, 14, 5, 2, C.ORANGE);
        rect(ctx, 10, 14, 5, 2, C.ORANGE);
    }
}

// Hammer Bro
function drawHammerBro(ctx, w, h, frame) {
    const armUp = frame % 2 === 0;
    // Helmet
    rect(ctx, 3, 0, 10, 4, C.GREEN);
    rect(ctx, 2, 1, 12, 3, C.GREEN);
    rect(ctx, 1, 0, 14, 1, C.GREEN_LIGHT);
    // Face
    rect(ctx, 4, 4, 8, 4, C.SKIN);
    rect(ctx, 3, 5, 10, 3, C.SKIN);
    rect(ctx, 5, 5, 2, 2, C.WHITE);
    rect(ctx, 9, 5, 2, 2, C.WHITE);
    px(ctx, 6, 6, C.BLACK);
    px(ctx, 10, 6, C.BLACK);
    // Body
    rect(ctx, 3, 8, 10, 4, C.GREEN);
    rect(ctx, 2, 9, 12, 2, C.GREEN);
    // Arms
    if (armUp) {
        rect(ctx, 0, 6, 3, 2, C.GREEN_DARK);
        rect(ctx, 13, 8, 3, 2, C.GREEN_DARK);
    } else {
        rect(ctx, 0, 8, 3, 2, C.GREEN_DARK);
        rect(ctx, 13, 8, 3, 2, C.GREEN_DARK);
    }
    // Shell
    rect(ctx, 3, 12, 10, 2, C.GRAY);
    rect(ctx, 2, 13, 12, 1, C.GRAY_DARK);
    // Feet
    if (frame === 0) {
        rect(ctx, 2, 14, 5, 2, C.BROWN);
        rect(ctx, 9, 14, 5, 2, C.BROWN);
    } else {
        rect(ctx, 1, 14, 5, 2, C.BROWN);
        rect(ctx, 10, 14, 5, 2, C.BROWN);
    }
}

// Hammer projectile
function drawHammer(ctx, w, h, frame) {
    const angle = (frame * 0.5) % 2;
    rect(ctx, 4, 4, 8, 4, C.GRAY);
    rect(ctx, 3, 5, 10, 2, C.GRAY);
    rect(ctx, 5, 3, 2, 2, C.BROWN_DARK);
    rect(ctx, 5, 8, 2, 2, C.BROWN_DARK);
    rect(ctx, 7, 4, 2, 4, C.GRAY_LIGHT);
}

// ========== BLOCK SPRITES ==========

function drawGroundBlock(ctx, w, h) {
    rect(ctx, 0, 0, 16, 16, C.GROUND);
    rect(ctx, 0, 0, 16, 2, C.GROUND_LIGHT);
    rect(ctx, 0, 0, 2, 16, C.GROUND_LIGHT);
    rect(ctx, 14, 0, 2, 16, C.BROWN_DARK);
    rect(ctx, 0, 14, 16, 2, C.BROWN_DARK);
    rect(ctx, 4, 4, 2, 2, C.BROWN_DARK);
    rect(ctx, 10, 8, 2, 2, C.BROWN_DARK);
    rect(ctx, 6, 12, 2, 2, C.BROWN_DARK);
}

function drawUndergroundBlock(ctx, w, h) {
    rect(ctx, 0, 0, 16, 16, C.GROUND_UNDERGROUND);
    rect(ctx, 0, 0, 16, 2, C.GROUND_UNDERGROUND_LIGHT);
    rect(ctx, 0, 0, 2, 16, C.GROUND_UNDERGROUND_LIGHT);
    rect(ctx, 14, 0, 2, 16, C.BLUE_DARK);
    rect(ctx, 0, 14, 16, 2, C.BLUE_DARK);
    rect(ctx, 4, 4, 2, 2, C.BLUE_DARK);
    rect(ctx, 10, 8, 2, 2, C.BLUE_DARK);
    rect(ctx, 6, 12, 2, 2, C.BLUE_DARK);
}

function drawCastleBlock(ctx, w, h) {
    rect(ctx, 0, 0, 16, 16, C.GROUND_CASTLE);
    rect(ctx, 0, 0, 16, 2, C.GROUND_CASTLE_LIGHT);
    rect(ctx, 0, 0, 2, 16, C.GROUND_CASTLE_LIGHT);
    rect(ctx, 14, 0, 2, 16, C.GRAY_DARK);
    rect(ctx, 0, 14, 16, 2, C.GRAY_DARK);
    rect(ctx, 4, 4, 2, 2, C.GRAY_DARK);
    rect(ctx, 10, 8, 2, 2, C.GRAY_DARK);
    rect(ctx, 6, 12, 2, 2, C.GRAY_DARK);
}

function drawBrickBlock(ctx, w, h) {
    rect(ctx, 0, 0, 16, 16, C.GROUND);
    rect(ctx, 0, 0, 16, 2, C.GROUND_LIGHT);
    rect(ctx, 0, 0, 2, 16, C.GROUND_LIGHT);
    rect(ctx, 14, 0, 2, 16, C.BROWN_DARK);
    rect(ctx, 0, 14, 16, 2, C.BROWN_DARK);
    rect(ctx, 7, 0, 2, 7, C.BLACK);
    rect(ctx, 0, 7, 16, 2, C.BLACK);
    rect(ctx, 3, 9, 2, 7, C.BLACK);
    rect(ctx, 11, 9, 2, 7, C.BLACK);
}

function drawQuestionBlock(ctx, w, h, frame) {
    rect(ctx, 0, 0, 16, 16, C.YELLOW);
    rect(ctx, 0, 0, 16, 2, C.YELLOW_DARK);
    rect(ctx, 0, 14, 16, 2, C.YELLOW_DARK);
    rect(ctx, 0, 0, 2, 16, C.YELLOW_DARK);
    rect(ctx, 14, 0, 2, 16, C.YELLOW_DARK);

    const qx = 4 + (frame % 2) * 2;
    const qy = 3 + (frame % 2);
    rect(ctx, qx, qy, 8, 8, C.WHITE);
    rect(ctx, qx + 1, qy + 1, 6, 6, C.YELLOW);
    rect(ctx, qx + 2, qy + 2, 2, 2, C.BROWN);
    rect(ctx, qx + 4, qy + 2, 2, 2, C.BROWN);
    rect(ctx, qx + 2, qy + 4, 4, 2, C.BROWN);
    rect(ctx, qx + 3, qy + 6, 2, 2, C.BROWN);
}

function drawUsedBlock(ctx, w, h) {
    rect(ctx, 0, 0, 16, 16, C.GRAY_DARK);
    rect(ctx, 0, 0, 16, 2, C.GRAY);
    rect(ctx, 0, 0, 2, 16, C.GRAY);
    rect(ctx, 14, 0, 2, 16, C.GRAY_DARK);
    rect(ctx, 0, 14, 16, 2, C.GRAY_DARK);
}

function drawHardBlock(ctx, w, h) {
    rect(ctx, 0, 0, 16, 16, C.GRAY);
    rect(ctx, 0, 0, 16, 2, C.GRAY_LIGHT);
    rect(ctx, 0, 0, 2, 16, C.GRAY_LIGHT);
    rect(ctx, 14, 0, 2, 16, C.GRAY_DARK);
    rect(ctx, 0, 14, 16, 2, C.GRAY_DARK);
    rect(ctx, 4, 4, 8, 8, C.GRAY_DARK);
    rect(ctx, 5, 5, 6, 6, C.GRAY);
}

// ========== ITEM SPRITES ==========

function drawMushroom(ctx, w, h) {
    rect(ctx, 2, 0, 12, 6, C.RED);
    rect(ctx, 1, 1, 14, 4, C.RED);
    rect(ctx, 0, 2, 16, 2, C.RED);
    rect(ctx, 3, 2, 3, 3, C.WHITE);
    rect(ctx, 10, 2, 3, 3, C.WHITE);
    rect(ctx, 1, 6, 14, 2, C.YELLOW);
    rect(ctx, 2, 8, 12, 6, C.YELLOW);
    rect(ctx, 1, 9, 14, 4, C.YELLOW);
    rect(ctx, 0, 10, 16, 2, C.YELLOW);
    rect(ctx, 2, 14, 12, 2, C.YELLOW_DARK);
}

function drawOneUpMushroom(ctx, w, h) {
    rect(ctx, 2, 0, 12, 6, C.GREEN);
    rect(ctx, 1, 1, 14, 4, C.GREEN);
    rect(ctx, 0, 2, 16, 2, C.GREEN);
    rect(ctx, 3, 2, 3, 3, C.WHITE);
    rect(ctx, 10, 2, 3, 3, C.WHITE);
    rect(ctx, 1, 6, 14, 2, C.YELLOW);
    rect(ctx, 2, 8, 12, 6, C.YELLOW);
    rect(ctx, 1, 9, 14, 4, C.YELLOW);
    rect(ctx, 0, 10, 16, 2, C.YELLOW);
    rect(ctx, 2, 14, 12, 2, C.YELLOW_DARK);
}

function drawIceFlower(ctx, w, h) {
    rect(ctx, 6, 0, 4, 4, C.CYAN);
    rect(ctx, 5, 1, 6, 2, C.CYAN);
    rect(ctx, 4, 2, 8, 2, C.CYAN);
    rect(ctx, 3, 3, 10, 2, C.CYAN);
    rect(ctx, 2, 4, 12, 2, C.CYAN);
    rect(ctx, 1, 5, 14, 2, C.CYAN);
    rect(ctx, 0, 6, 16, 2, C.CYAN);
    rect(ctx, 1, 8, 14, 2, C.CYAN);
    rect(ctx, 2, 10, 12, 2, C.CYAN);
    rect(ctx, 3, 12, 10, 2, C.CYAN);
    rect(ctx, 4, 14, 8, 2, C.CYAN);
    rect(ctx, 5, 2, 2, 2, C.WHITE);
    rect(ctx, 9, 2, 2, 2, C.WHITE);
    rect(ctx, 3, 4, 2, 2, C.WHITE);
    rect(ctx, 11, 4, 2, 2, C.WHITE);
    rect(ctx, 6, 6, 4, 2, C.WHITE);
    rect(ctx, 7, 8, 2, 2, C.WHITE);
    rect(ctx, 6, 10, 4, 2, C.WHITE);
    rect(ctx, 7, 12, 2, 2, C.WHITE);
    rect(ctx, 6, 14, 4, 2, C.GREEN);
    rect(ctx, 5, 15, 6, 1, C.GREEN_DARK);
}

function drawFireFlower(ctx, w, h) {
    rect(ctx, 6, 0, 4, 4, C.FIRE_RED);
    rect(ctx, 5, 1, 6, 2, C.FIRE_RED);
    rect(ctx, 4, 2, 8, 2, C.FIRE_RED);
    rect(ctx, 3, 3, 10, 2, C.FIRE_RED);
    rect(ctx, 2, 4, 12, 2, C.FIRE_RED);
    rect(ctx, 1, 5, 14, 2, C.FIRE_RED);
    rect(ctx, 0, 6, 16, 2, C.FIRE_RED);
    rect(ctx, 1, 8, 14, 2, C.FIRE_RED);
    rect(ctx, 2, 10, 12, 2, C.FIRE_RED);
    rect(ctx, 3, 12, 10, 2, C.FIRE_RED);
    rect(ctx, 4, 14, 8, 2, C.FIRE_RED);
    rect(ctx, 5, 2, 2, 2, C.FIRE_YELLOW);
    rect(ctx, 9, 2, 2, 2, C.FIRE_YELLOW);
    rect(ctx, 3, 4, 2, 2, C.FIRE_YELLOW);
    rect(ctx, 11, 4, 2, 2, C.FIRE_YELLOW);
    rect(ctx, 6, 6, 4, 2, C.FIRE_YELLOW);
    rect(ctx, 7, 8, 2, 2, C.FIRE_YELLOW);
    rect(ctx, 6, 10, 4, 2, C.FIRE_YELLOW);
    rect(ctx, 7, 12, 2, 2, C.FIRE_YELLOW);
    rect(ctx, 6, 14, 4, 2, C.GREEN);
    rect(ctx, 5, 15, 6, 1, C.GREEN_DARK);
}

function drawStar(ctx, w, h) {
    rect(ctx, 6, 0, 4, 4, C.STAR);
    rect(ctx, 4, 2, 8, 2, C.STAR);
    rect(ctx, 2, 4, 12, 4, C.STAR);
    rect(ctx, 0, 6, 16, 4, C.STAR);
    rect(ctx, 2, 10, 12, 4, C.STAR);
    rect(ctx, 4, 12, 8, 2, C.STAR);
    rect(ctx, 6, 14, 4, 2, C.STAR);
    rect(ctx, 7, 3, 2, 2, C.WHITE);
    rect(ctx, 5, 5, 2, 2, C.WHITE);
    rect(ctx, 9, 5, 2, 2, C.WHITE);
    rect(ctx, 3, 7, 2, 2, C.WHITE);
    rect(ctx, 11, 7, 2, 2, C.WHITE);
    rect(ctx, 5, 11, 2, 2, C.WHITE);
    rect(ctx, 9, 11, 2, 2, C.WHITE);
    rect(ctx, 7, 13, 2, 2, C.WHITE);
}

function drawCoin(ctx, w, h, frame) {
    const widths = [8, 4, 2, 4];
    const cw = widths[frame % 4];
    const cx = 8 - cw / 2;
    rect(ctx, cx, 2, cw, 12, C.YELLOW);
    if (cw > 4) {
        rect(ctx, cx + 1, 3, cw - 2, 10, C.YELLOW_DARK);
        rect(ctx, cx + 2, 4, cw - 4, 8, C.YELLOW);
    }
    rect(ctx, cx, 2, cw, 1, C.YELLOW_DARK);
    rect(ctx, cx, 13, cw, 1, C.YELLOW_DARK);
}

// ========== PIPE SPRITES ==========

function drawPipeTL(ctx, w, h) {
    rect(ctx, 0, 0, 16, 16, C.PIPE_GREEN);
    rect(ctx, 0, 0, 4, 16, C.PIPE_GREEN_LIGHT);
    rect(ctx, 0, 0, 16, 2, C.PIPE_GREEN_LIGHT);
    rect(ctx, 14, 0, 2, 16, C.GREEN_DARK);
    rect(ctx, 0, 14, 16, 2, C.GREEN_DARK);
}

function drawPipeTR(ctx, w, h) {
    rect(ctx, 0, 0, 16, 16, C.PIPE_GREEN);
    rect(ctx, 12, 0, 4, 16, C.PIPE_GREEN_LIGHT);
    rect(ctx, 0, 0, 16, 2, C.PIPE_GREEN_LIGHT);
    rect(ctx, 14, 0, 2, 16, C.GREEN_DARK);
    rect(ctx, 0, 14, 16, 2, C.GREEN_DARK);
}

function drawPipeBL(ctx, w, h) {
    rect(ctx, 0, 0, 16, 16, C.PIPE_GREEN);
    rect(ctx, 2, 0, 4, 16, C.PIPE_GREEN_LIGHT);
    rect(ctx, 0, 0, 16, 2, C.PIPE_GREEN_LIGHT);
    rect(ctx, 14, 0, 2, 16, C.GREEN_DARK);
    rect(ctx, 0, 14, 16, 2, C.GREEN_DARK);
}

function drawPipeBR(ctx, w, h) {
    rect(ctx, 0, 0, 16, 16, C.PIPE_GREEN);
    rect(ctx, 10, 0, 4, 16, C.PIPE_GREEN_LIGHT);
    rect(ctx, 0, 0, 16, 2, C.PIPE_GREEN_LIGHT);
    rect(ctx, 14, 0, 2, 16, C.GREEN_DARK);
    rect(ctx, 0, 14, 16, 2, C.GREEN_DARK);
}

// ========== FLAG & CASTLE ==========

function drawFlagPole(ctx, w, h) {
    rect(ctx, 7, 0, 2, 16, C.FLAG_POLE);
    rect(ctx, 6, 0, 4, 1, C.GRAY_LIGHT);
    rect(ctx, 6, 15, 4, 1, C.GRAY_DARK);
}

function drawFlagTop(ctx, w, h) {
    rect(ctx, 7, 4, 2, 12, C.FLAG_POLE);
    rect(ctx, 1, 4, 6, 8, C.FLAG_GREEN);
    rect(ctx, 2, 5, 4, 6, C.GREEN_LIGHT);
    rect(ctx, 6, 4, 4, 1, C.GRAY_LIGHT);
}

function drawCastle(ctx, w, h) {
    rect(ctx, 0, 0, 16, 16, C.GRAY);
    rect(ctx, 0, 0, 16, 2, C.GRAY_LIGHT);
    rect(ctx, 0, 0, 2, 16, C.GRAY_LIGHT);
    rect(ctx, 14, 0, 2, 16, C.GRAY_DARK);
    rect(ctx, 0, 14, 16, 2, C.GRAY_DARK);
    rect(ctx, 4, 4, 8, 8, C.BLACK);
    rect(ctx, 5, 5, 6, 6, C.GRAY_DARK);
    rect(ctx, 6, 6, 4, 4, C.BLACK);
}

// Checkpoint flag
function drawCheckpoint(ctx, w, h) {
    rect(ctx, 7, 0, 2, 16, C.GRAY);
    rect(ctx, 6, 0, 4, 1, C.GRAY_LIGHT);
    rect(ctx, 1, 2, 6, 6, C.ORANGE);
    rect(ctx, 2, 3, 4, 4, C.YELLOW);
    rect(ctx, 6, 8, 1, 1, C.GRAY_LIGHT);
}

// ========== DECORATION SPRITES ==========

function drawBush(ctx, w, h) {
    rect(ctx, 0, 4, 16, 12, C.GREEN);
    rect(ctx, 2, 2, 12, 4, C.GREEN);
    rect(ctx, 4, 0, 8, 4, C.GREEN);
    rect(ctx, 1, 5, 14, 10, C.GREEN_DARK);
    rect(ctx, 3, 3, 10, 2, C.GREEN_DARK);
    rect(ctx, 5, 1, 6, 2, C.GREEN_DARK);
}

function drawHill(ctx, w, h) {
    rect(ctx, 0, 8, 16, 8, C.GREEN);
    rect(ctx, 2, 6, 12, 4, C.GREEN);
    rect(ctx, 4, 4, 8, 4, C.GREEN);
    rect(ctx, 6, 2, 4, 4, C.GREEN);
    rect(ctx, 1, 9, 14, 6, C.GREEN_DARK);
    rect(ctx, 3, 7, 10, 2, C.GREEN_DARK);
    rect(ctx, 5, 5, 6, 2, C.GREEN_DARK);
    rect(ctx, 7, 3, 2, 2, C.GREEN_DARK);
}

function drawCloud(ctx, w, h) {
    rect(ctx, 0, 4, 16, 8, C.WHITE);
    rect(ctx, 2, 2, 12, 4, C.WHITE);
    rect(ctx, 4, 0, 8, 4, C.WHITE);
    rect(ctx, 1, 5, 14, 6, C.GRAY_LIGHT);
    rect(ctx, 3, 3, 10, 2, C.GRAY_LIGHT);
    rect(ctx, 5, 1, 6, 2, C.GRAY_LIGHT);
}

// ========== FIREBALL / ICEBALL ==========

function drawFireball(ctx, w, h, frame) {
    const fy = frame % 2;
    rect(ctx, 3, 2 + fy, 4, 4, C.FIRE_YELLOW);
    rect(ctx, 2, 3 + fy, 6, 2, C.FIRE_YELLOW);
    rect(ctx, 4, 1 + fy, 2, 2, C.FIRE_RED);
    rect(ctx, 4, 5 + fy, 2, 2, C.FIRE_RED);
    rect(ctx, 1, 4 + fy, 2, 2, C.FIRE_ORANGE);
    rect(ctx, 7, 4 + fy, 2, 2, C.FIRE_ORANGE);
    rect(ctx, 5, 0 + fy, 2, 2, C.FIRE_RED);
    rect(ctx, 5, 6 + fy, 2, 2, C.FIRE_RED);
}

function drawIceball(ctx, w, h, frame) {
    const fy = frame % 2;
    rect(ctx, 3, 2 + fy, 4, 4, C.WHITE);
    rect(ctx, 2, 3 + fy, 6, 2, C.WHITE);
    rect(ctx, 4, 1 + fy, 2, 2, C.ICE_BLUE);
    rect(ctx, 4, 5 + fy, 2, 2, C.ICE_BLUE);
    rect(ctx, 1, 4 + fy, 2, 2, C.CYAN);
    rect(ctx, 7, 4 + fy, 2, 2, C.CYAN);
    rect(ctx, 5, 0 + fy, 2, 2, C.ICE_BLUE);
    rect(ctx, 5, 6 + fy, 2, 2, C.ICE_BLUE);
}

// ========== WATER / LAVA TILES ==========

function drawWaterTile(ctx, w, h) {
    rect(ctx, 0, 0, 16, 16, C.WATER);
    rect(ctx, 0, 0, 16, 2, C.WATER_LIGHT);
    rect(ctx, 2, 4, 4, 2, C.WATER_LIGHT);
    rect(ctx, 10, 6, 4, 2, C.WATER_LIGHT);
    rect(ctx, 4, 10, 6, 2, C.WATER_LIGHT);
    rect(ctx, 0, 12, 4, 2, C.WATER_LIGHT);
    rect(ctx, 12, 14, 4, 2, C.WATER_LIGHT);
}

function drawLavaTile(ctx, w, h) {
    rect(ctx, 0, 0, 16, 16, C.LAVA);
    rect(ctx, 0, 0, 16, 2, C.LAVA_LIGHT);
    rect(ctx, 2, 4, 4, 2, C.LAVA_YELLOW);
    rect(ctx, 10, 6, 4, 2, C.LAVA_YELLOW);
    rect(ctx, 4, 10, 6, 2, C.LAVA_LIGHT);
    rect(ctx, 0, 12, 4, 2, C.LAVA_YELLOW);
    rect(ctx, 12, 14, 4, 2, C.LAVA_YELLOW);
}

// ========== PARTICLE SPRITES ==========

function drawBrickParticle(ctx, w, h) {
    rect(ctx, 0, 0, 8, 8, C.GROUND);
    rect(ctx, 0, 0, 8, 1, C.GROUND_LIGHT);
    rect(ctx, 0, 0, 1, 8, C.GROUND_LIGHT);
    rect(ctx, 7, 0, 1, 8, C.BROWN_DARK);
    rect(ctx, 0, 7, 8, 1, C.BROWN_DARK);
}

function drawCoinSparkle(ctx, w, h) {
    rect(ctx, 3, 0, 2, 2, C.YELLOW);
    rect(ctx, 0, 3, 2, 2, C.YELLOW);
    rect(ctx, 6, 3, 2, 2, C.YELLOW);
    rect(ctx, 3, 6, 2, 2, C.YELLOW);
    rect(ctx, 3, 3, 2, 2, C.WHITE);
}

function drawDustParticle(ctx, w, h) {
    rect(ctx, 2, 0, 4, 2, C.GROUND_LIGHT);
    rect(ctx, 0, 1, 8, 2, C.GROUND_LIGHT);
    rect(ctx, 1, 3, 6, 2, C.GROUND);
    rect(ctx, 2, 5, 4, 2, C.GROUND);
    rect(ctx, 3, 7, 2, 1, C.GROUND);
}

function drawSquishParticle(ctx, w, h) {
    rect(ctx, 2, 0, 4, 4, C.GROUND);
    rect(ctx, 1, 1, 6, 2, C.GROUND);
    rect(ctx, 0, 2, 8, 2, C.GROUND);
    rect(ctx, 1, 4, 2, 2, C.GROUND);
    rect(ctx, 5, 4, 2, 2, C.GROUND);
}

function drawPowerUpGlow(ctx, w, h) {
    const cx = 4, cy = 4;
    rect(ctx, cx, 0, 2, 2, C.WHITE);
    rect(ctx, 0, cy, 2, 2, C.WHITE);
    rect(ctx, 8, cy, 2, 2, C.WHITE);
    rect(ctx, cx, 8, 2, 2, C.WHITE);
    rect(ctx, 2, 2, 2, 2, C.WHITE);
    rect(ctx, 6, 2, 2, 2, C.WHITE);
    rect(ctx, 2, 6, 2, 2, C.WHITE);
    rect(ctx, 6, 6, 2, 2, C.WHITE);
}

// ========== INITIALIZE ALL SPRITES ==========

function initSprites() {
    // Small Mario
    createSprite('mario_small_stand', 16, 16, (ctx, w, h) => drawSmallMario(ctx, w, h, 0, 1));
    createSprite('mario_small_walk1', 16, 16, (ctx, w, h) => drawSmallMario(ctx, w, h, 1, 1));
    createSprite('mario_small_walk2', 16, 16, (ctx, w, h) => drawSmallMario(ctx, w, h, 2, 1));
    createSprite('mario_small_walk3', 16, 16, (ctx, w, h) => drawSmallMario(ctx, w, h, 0, 1));
    createSprite('mario_small_jump', 16, 16, (ctx, w, h) => drawSmallMarioJump(ctx, w, h, 1));
    createSprite('mario_small_dead', 16, 16, (ctx, w, h) => drawSmallMarioDead(ctx, w, h));

    // Big Mario
    createSprite('mario_big_stand', 16, 32, (ctx, w, h) => drawBigMario(ctx, w, h, 0, 1));
    createSprite('mario_big_walk1', 16, 32, (ctx, w, h) => drawBigMario(ctx, w, h, 1, 1));
    createSprite('mario_big_walk2', 16, 32, (ctx, w, h) => drawBigMario(ctx, w, h, 2, 1));
    createSprite('mario_big_walk3', 16, 32, (ctx, w, h) => drawBigMario(ctx, w, h, 0, 1));
    createSprite('mario_big_jump', 16, 32, (ctx, w, h) => drawBigMarioJump(ctx, w, h, 1));
    createSprite('mario_big_crouch', 16, 32, (ctx, w, h) => drawBigMarioCrouch(ctx, w, h, 1));

    // Fire Mario
    createSprite('mario_fire_stand', 16, 32, (ctx, w, h) => drawFireMario(ctx, w, h, 0, 1));
    createSprite('mario_fire_walk1', 16, 32, (ctx, w, h) => drawFireMario(ctx, w, h, 1, 1));
    createSprite('mario_fire_walk2', 16, 32, (ctx, w, h) => drawFireMario(ctx, w, h, 2, 1));
    createSprite('mario_fire_walk3', 16, 32, (ctx, w, h) => drawFireMario(ctx, w, h, 0, 1));
    createSprite('mario_fire_jump', 16, 32, (ctx, w, h) => drawFireMarioJump(ctx, w, h, 1));

    // Ice Mario
    createSprite('mario_ice_stand', 16, 32, (ctx, w, h) => drawIceMario(ctx, w, h, 0, 1));
    createSprite('mario_ice_walk1', 16, 32, (ctx, w, h) => drawIceMario(ctx, w, h, 1, 1));
    createSprite('mario_ice_walk2', 16, 32, (ctx, w, h) => drawIceMario(ctx, w, h, 2, 1));
    createSprite('mario_ice_walk3', 16, 32, (ctx, w, h) => drawIceMario(ctx, w, h, 0, 1));
    createSprite('mario_ice_jump', 16, 32, (ctx, w, h) => drawIceMarioJump(ctx, w, h, 1));

    // Death animation
    createSprite('mario_death', 16, 16, (ctx, w, h) => drawMarioDeath(ctx, w, h, 1));

    // Mario head icon
    createSprite('mario_head', 10, 8, drawMarioHead);

    // Goomba
    createSprite('goomba_walk1', 16, 16, (ctx, w, h) => drawGoomba(ctx, w, h, 0));
    createSprite('goomba_walk2', 16, 16, (ctx, w, h) => drawGoomba(ctx, w, h, 1));
    createSprite('goomba_squished', 16, 8, (ctx, w, h) => drawGoombaSquished(ctx, w, h));

    // Koopa
    createSprite('koopa_walk1', 16, 16, (ctx, w, h) => drawKoopa(ctx, w, h, 0));
    createSprite('koopa_walk2', 16, 16, (ctx, w, h) => drawKoopa(ctx, w, h, 1));
    createSprite('koopa_shell', 16, 16, (ctx, w, h) => drawKoopaShell(ctx, w, h));

    // Piranha Plant
    createSprite('piranha_plant_0', 16, 16, (ctx, w, h) => drawPiranhaPlant(ctx, w, h, 0));
    createSprite('piranha_plant_1', 16, 16, (ctx, w, h) => drawPiranhaPlant(ctx, w, h, 1));

    // Buzzy Beetle
    createSprite('buzzy_walk1', 16, 16, (ctx, w, h) => drawBuzzyBeetle(ctx, w, h, 0));
    createSprite('buzzy_walk2', 16, 16, (ctx, w, h) => drawBuzzyBeetle(ctx, w, h, 1));
    createSprite('buzzy_shell', 16, 16, (ctx, w, h) => drawBuzzyShell(ctx, w, h));

    // Lakitu
    createSprite('lakitu_0', 16, 16, (ctx, w, h) => drawLakituBody(ctx, w, h, 0));
    createSprite('lakitu_1', 16, 16, (ctx, w, h) => drawLakituBody(ctx, w, h, 1));

    // Spiny
    createSprite('spiny_walk1', 16, 16, (ctx, w, h) => drawSpiny(ctx, w, h, 0));
    createSprite('spiny_walk2', 16, 16, (ctx, w, h) => drawSpiny(ctx, w, h, 1));

    // Hammer Bro
    createSprite('hammerbro_0', 16, 16, (ctx, w, h) => drawHammerBro(ctx, w, h, 0));
    createSprite('hammerbro_1', 16, 16, (ctx, w, h) => drawHammerBro(ctx, w, h, 1));

    // Hammer projectile
    createSprite('hammer_0', 12, 12, (ctx, w, h) => drawHammer(ctx, w, h, 0));
    createSprite('hammer_1', 12, 12, (ctx, w, h) => drawHammer(ctx, w, h, 1));

    // Blocks
    createSprite('block_ground', 16, 16, drawGroundBlock);
    createSprite('block_underground', 16, 16, drawUndergroundBlock);
    createSprite('block_castle', 16, 16, drawCastleBlock);
    createSprite('block_brick', 16, 16, drawBrickBlock);
    createSprite('block_question_0', 16, 16, (ctx, w, h) => drawQuestionBlock(ctx, w, h, 0));
    createSprite('block_question_1', 16, 16, (ctx, w, h) => drawQuestionBlock(ctx, w, h, 1));
    createSprite('block_question_2', 16, 16, (ctx, w, h) => drawQuestionBlock(ctx, w, h, 2));
    createSprite('block_question_3', 16, 16, (ctx, w, h) => drawQuestionBlock(ctx, w, h, 3));
    createSprite('block_used', 16, 16, drawUsedBlock);
    createSprite('block_hard', 16, 16, drawHardBlock);

    // Items
    createSprite('item_mushroom', 16, 16, drawMushroom);
    createSprite('item_oneup', 16, 16, drawOneUpMushroom);
    createSprite('item_fireflower', 16, 16, drawFireFlower);
    createSprite('item_iceflower', 16, 16, drawIceFlower);
    createSprite('item_star', 16, 16, drawStar);
    createSprite('item_coin_0', 16, 16, (ctx, w, h) => drawCoin(ctx, w, h, 0));
    createSprite('item_coin_1', 16, 16, (ctx, w, h) => drawCoin(ctx, w, h, 1));
    createSprite('item_coin_2', 16, 16, (ctx, w, h) => drawCoin(ctx, w, h, 2));
    createSprite('item_coin_3', 16, 16, (ctx, w, h) => drawCoin(ctx, w, h, 3));

    // Pipes
    createSprite('pipe_tl', 16, 16, drawPipeTL);
    createSprite('pipe_tr', 16, 16, drawPipeTR);
    createSprite('pipe_bl', 16, 16, drawPipeBL);
    createSprite('pipe_br', 16, 16, drawPipeBR);

    // Flag & Castle
    createSprite('flag_pole', 16, 16, drawFlagPole);
    createSprite('flag_top', 16, 16, drawFlagTop);
    createSprite('castle', 16, 16, drawCastle);
    createSprite('checkpoint', 16, 16, drawCheckpoint);

    // Fireball / Iceball
    createSprite('fireball_0', 8, 8, (ctx, w, h) => drawFireball(ctx, w, h, 0));
    createSprite('fireball_1', 8, 8, (ctx, w, h) => drawFireball(ctx, w, h, 1));
    createSprite('iceball_0', 8, 8, (ctx, w, h) => drawIceball(ctx, w, h, 0));
    createSprite('iceball_1', 8, 8, (ctx, w, h) => drawIceball(ctx, w, h, 1));

    // Decorations
    createSprite('bush', 16, 16, drawBush);
    createSprite('hill', 16, 16, drawHill);
    createSprite('cloud', 16, 16, drawCloud);

    // Water / Lava
    createSprite('water_tile', 16, 16, drawWaterTile);
    createSprite('lava_tile', 16, 16, drawLavaTile);

    // Particles
    createSprite('brick_particle', 8, 8, drawBrickParticle);
    createSprite('coin_sparkle', 8, 8, drawCoinSparkle);
    createSprite('dust_particle', 8, 8, drawDustParticle);
    createSprite('squish_particle', 8, 8, drawSquishParticle);
    createSprite('powerup_glow', 10, 10, drawPowerUpGlow);
}

function getSprite(name) {
    return SPRITES[name] || null;
}

initSprites();