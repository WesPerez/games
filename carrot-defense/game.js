window.Game = (function() {
  const COLS = 18, ROWS = 11, TILE = 32;
  const PLAY_W = COLS * TILE, PLAY_H = ROWS * TILE;
  const HUD_W = 120;
  const W = PLAY_W + HUD_W, H = PLAY_H;
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  canvas.width = W; canvas.height = H;
  const ORIGIN = (location.protocol === 'file:') ? 'http://localhost:8000' : location.origin;
  const API = ORIGIN + '/api/image?prompt=';

  const GD = window.GAME_DATA;
  const ASSET_URLS = {};
  const IMAGES = {};
  let LOADED = 0, TOTAL = 0;

  function imgUrl(prompt, size) { return API + encodeURIComponent(prompt) + '&image_size=' + (size || 'square_hd'); }
  function bgUrl(prompt) { return API + encodeURIComponent(prompt) + '&image_size=landscape_4_3'; }

  function loadImage(key, url) {
    return new Promise(resolve => {
      const img = new Image();
      const done = (v) => { IMAGES[key] = v; LOADED++; if (window.Game && window.Game.updateProgress) window.Game.updateProgress(); resolve(); };
      img.onload = () => done(img);
      img.onerror = () => done(null);
      img.src = url;
      setTimeout(() => { if (!(key in IMAGES)) done(null); }, 60000);
    });
  }

  const state = {
    scene: 'menu',
    level: null,
    lives: 20,
    gold: 150,
    wave: 0,
    totalKilled: 0,
    startTime: 0,
    paused: false,
    speedMul: 1,
    towers: [],
    enemies: [],
    projectiles: [],
    particles: [],
    damageNumbers: [],
    coins: [],
    hero: null,
    heroCd: {},
    selectedTowerType: null,
    selectedPlacedTower: null,
    hoverCell: null,
    waveInProgress: false,
    waveQueue: [],
    waveStartTime: 0,
    pathCellSet: new Set(),
    waypoints: [],
    airWaypoints: [],
    towerImgKey: {},
    carrotImg: null,
    bgImg: null,
    talentNotices: [],
    startedAt: 0,
    // 新增系统
    combo: 0,
    comboTimer: 0,
    maxCombo: 0,
    shakeX: 0,
    shakeY: 0,
    shakeTimer: 0,
    autoStart: false,
    achievementNotices: [],
    heroXp: 0,
    heroLevel: 1,
    beeDrones: [],
    beeLastSpawn: 0,
    goldMineTimers: {},
    shieldBlocks: [],
    goldTickTimers: {},
  };

  const talents = JSON.parse(localStorage.getItem('cd_talents') || '{}');
  const stars = JSON.parse(localStorage.getItem('cd_stars') || '{}');
  const unlockedAchievements = JSON.parse(localStorage.getItem('cd_achievements') || '{}');
  const totalStats = JSON.parse(localStorage.getItem('cd_stats') || '{"totalKilled":0,"totalGold":0,"gamesPlayed":0}');
  function saveStars() { localStorage.setItem('cd_stars', JSON.stringify(stars)); }
  function saveTalents() { localStorage.setItem('cd_talents', JSON.stringify(talents)); }
  function saveAchievements() { localStorage.setItem('cd_achievements', JSON.stringify(unlockedAchievements)); }
  function saveStats() { localStorage.setItem('cd_stats', JSON.stringify(totalStats)); }

  function applyTalents(s) {
    s.startGold = 150;
    s.globalFireRateMul = 1;
    s.globalDmgMul = 1;
    s.outOfGridHpBonus = 0;
    s.goldBonusPerKill = 0;
    s.heroCdMul = 1;
    s.towerHpMul = 1;
    GD.TALENTS.forEach(t => { if (talents[t.id]) t.apply(s); });
  }

  function buildPath(path) {
    const wp = [];
    const minX = -TILE / 2, minY = -TILE / 2;
    wp.push({ x: minX, y: path[0][1] * TILE + TILE / 2 });
    path.forEach(([c, r]) => wp.push({ x: c * TILE + TILE / 2, y: r * TILE + TILE / 2 }));
    wp.push({ x: PLAY_W + TILE / 2, y: wp[wp.length - 1].y });
    return wp;
  }

  function buildAirPath(path) {
    if (!path) return [];
    const wp = [];
    wp.push({ x: -TILE / 2, y: path[0][1] * TILE + TILE / 2 });
    path.forEach(([c, r]) => wp.push({ x: c * TILE + TILE / 2, y: r * TILE + TILE / 2 }));
    wp.push({ x: PLAY_W + TILE / 2, y: wp[wp.length - 1].y });
    return wp;
  }

  function setLevel(lv) {
    state.level = lv;
    state.pathCellSet = new Set(lv.path.map(([c, r]) => c + ',' + r));
    state.waypoints = buildPath(lv.path);
    state.airWaypoints = buildAirPath(lv.airPath);
    const init = { startGold: lv.startGold };
    applyTalents(init);
    state.lives = lv.startLives;
    state.gold = init.startGold;
    state.wave = 0;
    state.totalKilled = 0;
    state.startedAt = performance.now();
    state.towers = [];
    state.enemies = [];
    state.projectiles = [];
    state.particles = [];
    state.damageNumbers = [];
    state.coins = [];
    state.selectedTowerType = null;
    state.selectedPlacedTower = null;
    state.hoverCell = null;
    state.waveInProgress = false;
    state.waveQueue = [];
    state.combo = 0;
    state.comboTimer = 0;
    state.maxCombo = 0;
    state.shakeX = 0;
    state.shakeY = 0;
    state.shakeTimer = 0;
    state.autoStart = false;
    state.achievementNotices = [];
    state.beeDrones = [];
    state.beeLastSpawn = 0;
    state.goldMineTimers = {};
    state.shieldBlocks = [];
    state.goldTickTimers = {};
    // 英雄初始化
    state.heroXp = 0;
    state.heroLevel = 1;
    const heroHp = GD.HERO.baseHp;
    const heroAtk = GD.HERO.baseAtk;
    state.hero = { x: 9 * TILE, y: 5 * TILE, hp: heroHp, maxHp: heroHp, atk: heroAtk, lastS1: -99999, lastS2: -99999, lastS3: -99999, lastAtk: -99999, target: null, level: 1, xp: 0 };
    state.heroCd = {};
    GD.HERO.skills.forEach(s => state.heroCd[s.id] = 0);
    state.bgImg = IMAGES['bg_' + lv.id];
    state.carrotImg = IMAGES['carrot'];
    state.talentNotices = [];
    state.t = 0;
    state.scene = 'playing';
    buildShop();
    buildSkillBar();
    updateHUD();
    updateWavePreview();
  }

  function heroGainXp(amount) {
    if (!state.hero) return;
    state.hero.xp += amount;
    state.heroXp = state.hero.xp;
    const xpTable = GD.HERO.xpPerLevel;
    while (state.hero.level < xpTable.length - 1 && state.hero.xp >= xpTable[state.hero.level]) {
      state.hero.level++;
      state.heroLevel = state.hero.level;
      state.hero.maxHp += GD.HERO.levelUpBonus.hp;
      state.hero.hp = Math.min(state.hero.hp + GD.HERO.levelUpBonus.hp, state.hero.maxHp);
      state.hero.atk += GD.HERO.levelUpBonus.atk;
      state.particles.push({ x: state.hero.x, y: state.hero.y, vx: 0, vy: 0, life: 0.6, maxLife: 0.6, color: '#ffd700', size: 80, kind: 'ring' });
      showWaveBanner('⭐ 英雄升级! Lv.' + state.hero.level);
    }
    checkAchievements();
  }

  function checkAchievements() {
    if (!GD.ACHIEVEMENTS) return;
    GD.ACHIEVEMENTS.forEach(a => {
      if (unlockedAchievements[a.id]) return;
      if (a.check(state)) {
        unlockedAchievements[a.id] = true;
        saveAchievements();
        state.achievementNotices.push({ text: a.icon + ' ' + a.name + ' - ' + a.desc, life: 3.5, maxLife: 3.5 });
      }
    });
  }

  function buildSkillBar() {
    const bar = document.getElementById('skillBar');
    if (!bar) return;
    bar.innerHTML = '';
    GD.HERO.skills.forEach(s => {
      const btn = document.createElement('button');
      btn.className = 'skill-btn ready';
      btn.title = s.name + ' · ' + s.desc;
      btn.innerHTML = '<span>' + s.icon + '</span><span class="key">' + s.key + '</span><div class="cd" style="display:none;"></div>';
      btn.addEventListener('click', () => castSkill(s.id));
      bar.appendChild(btn);
    });
  }

  function canPlace(col, row) {
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return false;
    if (state.pathCellSet.has(col + ',' + row)) return false;
    if (state.towers.some(t => t.col === col && t.row === row)) return false;
    return true;
  }

  function placeTower(col, row, typeId) {
    const cfg = GD.TOWERS[typeId];
    if (!cfg || state.gold < cfg.cost || !canPlace(col, row)) return false;
    state.gold -= cfg.cost;
    const t = {
      col, row,
      x: col * TILE + TILE / 2,
      y: row * TILE + TILE / 2,
      typeId, tier: 1,
      lastFire: 0,
      angle: -Math.PI / 2,
      recoil: 0,
      bornAt: performance.now(),
      maxHp: 50,
      hp: 50,
      outOfGrid: ['T09', 'T16', 'T24', 'T27', 'T35', 'T36'].includes(typeId),
    };
    if (t.outOfGrid) { t.hp += (state.outOfGridHpBonus || 0); t.maxHp = t.hp; }
    if (state.towerHpMul) { t.hp = Math.floor(t.hp * state.towerHpMul); t.maxHp = t.hp; }
    state.towers.push(t);
    state.particles.push({ x: t.x, y: t.y, vx: 0, vy: 0, life: 0.3, maxLife: 0.3, color: '#fff5d6', size: 60, kind: 'ring' });
    checkAchievements();
    return true;
  }

  function upgradeTower(t, toTier) {
    const cfg = GD.TOWERS[t.typeId];
    const upgrade = cfg.upgrade['T' + toTier];
    if (!upgrade || state.gold < upgrade.cost) return false;
    state.gold -= upgrade.cost;
    t.tier = toTier;
    state.particles.push({ x: t.x, y: t.y, vx: 0, vy: 0, life: 0.5, maxLife: 0.5, color: '#ffd700', size: 70, kind: 'ring' });
    return true;
  }

  function spawnMonster(monId, atEnd) {
    const cfg = GD.MONSTERS[monId];
    if (!cfg) return;
    const useAir = cfg.flying && state.airWaypoints.length;
    const wp = useAir ? state.airWaypoints : state.waypoints;
    const e = {
      monId,
      type: cfg,
      cfg,
      x: wp[0].x, y: wp[0].y,
      hp: cfg.hp, maxHp: cfg.hp,
      speed: cfg.speed,
      baseSpeed: cfg.speed,
      armor: cfg.armor || 0,
      gold: cfg.gold,
      size: 24,
      flying: !!cfg.flying,
      segment: 0,
      slowUntil: 0,
      hitFlash: 0,
      walkPhase: Math.random() * Math.PI * 2,
      dying: 0,
      boss: !!cfg.boss,
      mini: !!cfg.mini,
      elapsed: 0,
      ability: cfg.ability,
      t: 0,
      dodge: cfg.dodge || 0,
      shieldActive: 0,
      stunned: 0,
    };
    if (cfg.boss) e.size = 36;
    if (cfg.sticky) e.sticky = true;
    state.enemies.push(e);
  }

  function applyDamage(e, dmg, slow, slowDur, burn, isCrit) {
    if (e.dying > 0) return;
    if (e.stunned > 0) return;
    // 闪避
    if (e.dodge && Math.random() < e.dodge) {
      state.damageNumbers.push({ x: e.x, y: e.y - e.size - 4, value: 'MISS', life: 0.7, maxLife: 0.7, color: '#b2bec3', crit: false });
      return;
    }
    let actual = dmg;
    if (state.globalDmgMul) actual *= state.globalDmgMul;
    if (e.armor) actual = Math.max(1, actual - e.armor);
    e.hp -= actual;
    e.hitFlash = 0.15;
    if (slow) e.slowUntil = performance.now() + slowDur;
    state.damageNumbers.push({ x: e.x, y: e.y - e.size - 4, value: Math.round(actual), life: 0.9, maxLife: 0.9, color: isCrit ? '#ffd700' : (slow ? '#74b9ff' : (burn ? '#ff7675' : '#fff')), crit: isCrit });
    if (e.hp <= 0) {
      killEnemy(e);
    }
  }

  function killEnemy(e) {
    const bonus = (state.goldBonusPerKill || 0);
    state.gold += e.gold + bonus;
    state.totalKilled++;
    totalStats.totalKilled++;
    totalStats.totalGold += e.gold + bonus;
    saveStats();
    // 连杀系统
    const now = performance.now();
    if (now - state.comboTimer < 2000) {
      state.combo++;
      if (state.combo > state.maxCombo) state.maxCombo = state.combo;
    } else {
      state.combo = 1;
    }
    state.comboTimer = now;
    // 英雄经验
    heroGainXp(e.gold);
    // Boss死亡震动
    if (e.boss) {
      state.shakeTimer = 0.5;
      state.shakeX = 12;
      state.shakeY = 8;
      for (let i = 0; i < 30; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = 120 + Math.random() * 200;
        state.particles.push({ x: e.x, y: e.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60, life: 1.2, maxLife: 1.2, color: '#ffd700', size: 4 + Math.random() * 6, kind: 'star' });
      }
      state.particles.push({ x: e.x, y: e.y, vx: 0, vy: 0, life: 0.6, maxLife: 0.6, color: '#ff7675', size: 200, kind: 'shockwave' });
    }
    spawnDeathParticles(e.x, e.y, e.cfg);
    if (e.cfg.split) {
      for (let i = 0; i < e.cfg.split.count; i++) {
        setTimeout(() => spawnMonster(e.cfg.split.id), i * 80);
      }
    }
    // 糖果怪死后留糖浆
    if (e.cfg.sticky) {
      state.particles.push({ x: e.x, y: e.y, vx: 0, vy: 0, life: 3, maxLife: 3, color: 'rgba(255,150,200,0.3)', size: 60, kind: 'sticky_pool' });
    }
    e.dying = 0.4;
    checkAchievements();
  }

  function spawnDeathParticles(x, y, cfg) {
    const color = cfg.cat === 'slime' ? '#00b894' : cfg.cat === 'beast' ? '#6c5ce7' : cfg.cat === 'plant' ? '#55a630' : cfg.cat === 'undead' ? '#dfe6e9' : cfg.cat === 'elemental' ? '#ff7675' : cfg.cat === 'insect' ? '#a29bfe' : cfg.cat === 'humanoid' ? '#fdcb6e' : cfg.cat === 'mechanical' ? '#74b9ff' : cfg.cat === 'aquatic' ? '#81ecec' : '#fab1a0';
    for (let i = 0; i < 12; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 80 + Math.random() * 120;
      state.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 30, life: 0.7 + Math.random() * 0.3, maxLife: 0.7, color, size: 3 + Math.random() * 5, kind: 'star' });
    }
    for (let i = 0; i < 4; i++) {
      state.coins.push({ x, y, vy: -180 - Math.random() * 60, life: 1.2, maxLife: 1.2, value: 5, color: '#ffd700' });
    }
  }

  function findTarget(t) {
    const cfg = getTowerCfg(t);
    const r2 = cfg.range * cfg.range;
    let best = null, bestP = -1;
    for (const e of state.enemies) {
      if (e.dying > 0) continue;
      if (!canTowerHit(t, e)) continue;
      const dx = e.x - t.x, dy = e.y - t.y;
      if (dx * dx + dy * dy <= r2) {
        const p = e.x + e.y * 0.01;
        if (p > bestP) { bestP = p; best = e; }
      }
    }
    return best;
  }

  function canTowerHit(t, e) {
    if (e.flying) {
      const atk = GD.TOWERS[t.typeId].category;
      if (!['magical', 'elemental', 'dark', 'tech'].includes(atk) && t.typeId !== 'T01' && t.typeId !== 'T32') return false;
    }
    return true;
  }

  function getTowerCfg(t) {
    const base = GD.TOWERS[t.typeId];
    if (t.tier === 1) return { ...base };
    if (t.tier === 2) {
      const dmgBoost = base.dmg * 1.4;
      return { ...base, dmg: dmgBoost, range: base.range + 8, fireRate: base.fireRate * 1.1 };
    }
    return { ...base, dmg: base.dmg * 2.0, range: base.range + 16, fireRate: base.fireRate * 1.2 };
  }

  function fireProjectile(t, target) {
    const cfg = getTowerCfg(t);
    const angle = Math.atan2(target.y - t.y, target.x - t.x);
    const muzzleX = t.x + Math.cos(angle) * 18;
    const muzzleY = t.y + Math.sin(angle) * 18;
    const color = cfg.category === 'magical' ? '#a29bfe' : cfg.category === 'elemental' ? '#74b9ff' : cfg.category === 'dark' ? '#6c5ce7' : cfg.category === 'tech' ? '#00cec9' : '#fdcb6e';
    const projSize = 6 + cfg.dmg * 0.04;
    const isCrit = cfg.category === 'physical' && Math.random() < 0.15;
    const dmg = isCrit ? cfg.dmg * 2 : cfg.dmg;
    state.projectiles.push({
      x: muzzleX, y: muzzleY,
      vx: Math.cos(angle) * 320, vy: Math.sin(angle) * 320,
      target,
      damage: dmg,
      color,
      size: projSize,
      kind: cfg.category,
      towerId: t.typeId,
      pierce: 0,
      slow: cfg.special && cfg.special.includes('减速') ? 0.4 : (cfg.special && cfg.special.includes('黏液') ? 0.5 : 0),
      slowDur: cfg.special && cfg.special.includes('3s') ? 3000 : 2000,
      isCrit,
    });
    t.recoil = 1;
    state.particles.push({ x: muzzleX, y: muzzleY, vx: 0, vy: 0, life: 0.15, maxLife: 0.15, color, size: 18, kind: 'muzzle' });
  }

  function flashScreen() {
    canvas.classList.add('hit');
    setTimeout(() => canvas.classList.remove('hit'), 200);
  }

  function endGame(won) {
    state.scene = won ? 'won' : 'lost';
    const timeSec = (performance.now() - state.startedAt) / 1000;
    const lv = state.level;
    totalStats.gamesPlayed++;
    saveStats();
    let earned = 0;
    if (won) {
      earned = 1;
      const noLeak = state.lives >= lv.stars.noLeak;
      const inTime = timeSec <= lv.stars.speed;
      if (noLeak) earned = 2;
      if (noLeak && inTime) earned = 3;
      const prev = stars[lv.id] || 0;
      if (earned > prev) {
        stars[lv.id] = earned;
        saveStars();
        if (earned === 3) {
          const t = GD.TALENTS.find(t => t.unlockLevel === lv.id);
          if (t && !talents[t.id]) {
            talents[t.id] = true;
            saveTalents();
            state.talentNotices.push(t);
          }
        }
      }
    }
    checkAchievements();
    showResultModal(won, earned, timeSec);
  }

  function startWave() {
    if (state.waveInProgress || state.scene !== 'playing') return;
    if (state.wave >= state.level.waves.length) return;
    state.wave++;
    state.waveInProgress = true;
    const wave = state.level.waves[state.wave - 1];
    state.waveQueue = [];
    wave.monsters.forEach(group => {
      let acc = 0;
      for (let i = 0; i < group.count; i++) {
        state.waveQueue.push({ monId: group.id, delay: acc });
        acc += group.interval;
      }
    });
    state.waveStartTime = performance.now();
    state.selectedTowerType = null;
    showWaveBanner('🌊 第 ' + state.wave + ' / ' + state.level.waves.length + ' 波');
    updateHUD();
    updateWavePreview();
  }

  function updateWavePreview() {
    const el = document.getElementById('wavePreview');
    if (!el || !state.level) return;
    const nextWaveIdx = state.wave;
    if (nextWaveIdx >= state.level.waves.length) {
      el.innerHTML = '<span style="color:#636e72">最终波!</span>';
      return;
    }
    const wave = state.level.waves[nextWaveIdx];
    const names = wave.monsters.map(g => {
      const cfg = GD.MONSTERS[g.id];
      return (cfg ? cfg.name : g.id) + '×' + g.count;
    }).join(' ');
    let html = '<span style="font-size:11px;color:#636e72;">下一波: </span>';
    html += '<span style="font-size:11px;color:#d35400;font-weight:bold;">' + names + '</span>';
    if (wave.boss) html += ' <span style="color:#d63031;">👑BOSS</span>';
    el.innerHTML = html;
  }

  function update(dt) {
    if (state.scene !== 'playing' || state.paused) return;
    const now = performance.now();
    const eff = state.speedMul;
    const eDt = dt * eff;
    state.t = (state.t || 0) + eDt;

    // 屏幕震动
    if (state.shakeTimer > 0) {
      state.shakeTimer -= eDt;
      state.shakeX = Math.sin(now * 0.06) * 12 * (state.shakeTimer / 0.5);
      state.shakeY = Math.cos(now * 0.07) * 8 * (state.shakeTimer / 0.5);
    } else {
      state.shakeX = 0;
      state.shakeY = 0;
    }

    // 连杀计时器
    if (state.comboTimer > 0 && now - state.comboTimer > 2000) {
      state.combo = 0;
    }

    // 成就通知计时器
    for (let i = state.achievementNotices.length - 1; i >= 0; i--) {
      state.achievementNotices[i].life -= eDt;
      if (state.achievementNotices[i].life <= 0) state.achievementNotices.splice(i, 1);
    }

    // 出怪
    if (state.waveInProgress === true && state.waveQueue.length) {
      const next = state.waveQueue[0];
      if (now - state.waveStartTime >= next.delay / eff) {
        spawnMonster(next.monId);
        state.waveQueue.shift();
        if (state.waveQueue.length === 0) state.waveInProgress = 'spawning_done';
      }
    }

    // 敌人移动
    for (let i = state.enemies.length - 1; i >= 0; i--) {
      const e = state.enemies[i];
      e.t += eDt;
      if (e.dying > 0) {
        e.dying -= eDt;
        if (e.dying <= 0) state.enemies.splice(i, 1);
        continue;
      }
      if (e.stunned > 0) { e.stunned -= eDt; continue; }
      if (e.shieldActive > 0) e.shieldActive -= eDt;
      const wp = (e.flying && state.airWaypoints.length) ? state.airWaypoints : state.waypoints;
      if (e.segment >= wp.length - 1) {
        state.lives -= e.boss ? 5 : 1;
        state.enemies.splice(i, 1);
        flashScreen();
        updateHUD();
        if (state.lives <= 0) { endGame(false); return; }
        continue;
      }
      const target = wp[e.segment + 1];
      const dx = target.x - e.x, dy = target.y - e.y;
      const dist = Math.hypot(dx, dy);
      const slowF = now < e.slowUntil ? 0.5 : 1.0;
      const step = e.speed * slowF * eDt;
      e.walkPhase += eDt * (slowF > 0.7 ? 8 : 4);
      if (dist <= step) { e.x = target.x; e.y = target.y; e.segment++; }
      else { e.x += (dx / dist) * step; e.y += (dy / dist) * step; }
      if (e.hitFlash > 0) e.hitFlash -= eDt;
      if (e.boss && e.t > 5) e.t = 0;
    }

    // 护盾塔效果
    for (const sb of state.shieldBlocks) {
      sb.life -= eDt;
      for (const e of state.enemies) {
        if (e.dying > 0) continue;
        const dx = e.x - sb.x, dy = e.y - sb.y;
        if (Math.abs(dx) < TILE && Math.abs(dy) < TILE) {
          e.slowUntil = Math.max(e.slowUntil, now + 200);
        }
      }
    }
    state.shieldBlocks = state.shieldBlocks.filter(sb => sb.life > 0);

    // 传送带/粘液池粒子
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      if (p.kind === 'sticky_pool') {
        p.life -= eDt;
        for (const e of state.enemies) {
          if (e.dying > 0) continue;
          if (Math.hypot(e.x - p.x, e.y - p.y) < p.size * 0.5) {
            e.slowUntil = Math.max(e.slowUntil, now + 500);
          }
        }
      }
    }

    // 金矿塔产金
    for (const t of state.towers) {
      if (t.typeId === 'T36') {
        const key = t.col + ',' + t.row;
        if (!state.goldTickTimers[key]) state.goldTickTimers[key] = 0;
        state.goldTickTimers[key] += eDt;
        const interval = t.tier >= 3 ? 3 : t.tier >= 2 ? 3 : 4;
        const amount = t.tier >= 3 ? 50 : t.tier >= 2 ? 40 : 30;
        if (state.goldTickTimers[key] >= interval) {
          state.goldTickTimers[key] -= interval;
          state.gold += amount;
          state.coins.push({ x: t.x, y: t.y - 10, vy: -120, life: 1, maxLife: 1, value: amount, color: '#ffd700' });
        }
      }
    }

    // 蜜蜂塔召蜜蜂
    for (const t of state.towers) {
      if (t.typeId !== 'T37') continue;
      const maxBees = t.tier >= 3 ? 4 : t.tier >= 2 ? 3 : 2;
      const spawnInterval = t.tier >= 2 ? 4 : 5;
      const myBees = state.beeDrones.filter(b => b.parentTower === t);
      if (myBees.length < maxBees && now - (state.beeLastSpawn || 0) > spawnInterval * 1000) {
        state.beeLastSpawn = now;
        state.beeDrones.push({ x: t.x, y: t.y, parentTower: t, target: null, lastHit: 0, dmg: t.tier >= 3 ? 15 : t.tier >= 2 ? 12 : 8, life: 999, angle: 0 });
        state.particles.push({ x: t.x, y: t.y, vx: 0, vy: 0, life: 0.3, maxLife: 0.3, color: '#fdcb6e', size: 30, kind: 'muzzle' });
      }
    }
    // 蜜蜂AI
    for (const bee of state.beeDrones) {
      if (!bee.target || bee.target.dying > 0 || !state.enemies.includes(bee.target)) {
        let nearest = null, nd = 9999;
        for (const e of state.enemies) {
          if (e.dying > 0) continue;
          const d = Math.hypot(e.x - bee.x, e.y - bee.y);
          if (d < nd && d < 200) { nd = d; nearest = e; }
        }
        bee.target = nearest;
      }
      if (bee.target) {
        const dx = bee.target.x - bee.x, dy = bee.target.y - bee.y;
        const dist = Math.hypot(dx, dy);
        bee.angle = Math.atan2(dy, dx);
        if (dist > 2) { bee.x += (dx / dist) * 100 * eDt; bee.y += (dy / dist) * 100 * eDt; }
        if (dist < 30 && now - bee.lastHit > 600) {
          applyDamage(bee.target, bee.dmg, 0, 0, false, false);
          bee.lastHit = now;
        }
      } else {
        const t = bee.parentTower;
        if (t) {
          const dx = t.x - bee.x, dy = t.y - bee.y;
          bee.x += dx * 0.5 * eDt;
          bee.y += dy * 0.5 * eDt;
        }
      }
    }

    // 塔攻击
    for (const t of state.towers) {
      const cfg = getTowerCfg(t);
      if (t.recoil > 0) t.recoil = Math.max(0, t.recoil - eDt * 5);
      if (t.typeId === 'T35') {
        // 护盾塔：定期生成路障
        if (!t.lastShield || now - t.lastShield > 5000) {
          t.lastShield = now;
          state.shieldBlocks.push({ x: t.x, y: t.y, life: 3, col: t.col, row: t.row });
          state.particles.push({ x: t.x, y: t.y, vx: 0, vy: 0, life: 0.3, maxLife: 0.3, color: '#74b9ff', size: 50, kind: 'ring' });
        }
        continue;
      }
      const target = findTarget(t);
      if (target) {
        t.angle = Math.atan2(target.y - t.y, target.x - t.x);
        const fr = cfg.fireRate * (state.globalFireRateMul || 1);
        if (now - t.lastFire >= 1000 / fr) {
          fireProjectile(t, target);
          t.lastFire = now;
        }
      }
    }

    // 弹丸移动
    for (let i = state.projectiles.length - 1; i >= 0; i--) {
      const p = state.projectiles[i];
      if (p.target && state.enemies.includes(p.target) && p.target.dying <= 0) {
        const dx = p.target.x - p.x, dy = p.target.y - p.y;
        const desired = Math.atan2(dy, dx);
        const curr = Math.atan2(p.vy, p.vx);
        let diff = desired - curr;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        const turn = Math.max(-0.4, Math.min(0.4, diff));
        const newAng = curr + turn;
        const speed = 320;
        p.vx = Math.cos(newAng) * speed;
        p.vy = Math.sin(newAng) * speed;
      }
      p.x += p.vx * eDt; p.y += p.vy * eDt;
      p.trail = p.trail || [];
      p.trail.push({ x: p.x, y: p.y, life: 0.18 });
      if (p.trail.length > 8) p.trail.shift();
      for (const tr of p.trail) tr.life -= eDt;
      p.trail = p.trail.filter(tr => tr.life > 0);

      let hit = false;
      for (const e of state.enemies) {
        if (e.dying > 0) continue;
        const dx = e.x - p.x, dy = e.y - p.y;
        if (dx * dx + dy * dy <= (e.size * 0.6) * (e.size * 0.6)) { hit = true; break; }
      }
      if (hit) {
        const target = state.enemies.find(e => !e.dying && Math.hypot(e.x - p.x, e.y - p.y) < e.size);
        if (target) applyDamage(target, p.damage, p.slow, p.slowDur, p.kind === 'elemental', p.isCrit);
        state.projectiles.splice(i, 1);
      } else if (p.x < -50 || p.x > PLAY_W + 50 || p.y < -50 || p.y > PLAY_H + 50) {
        state.projectiles.splice(i, 1);
      }
    }

    // 粒子更新
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      if (p.kind === 'muzzle' || p.kind === 'shockwave' || p.kind === 'ring' || p.kind === 'sticky_pool') {
        p.life -= eDt;
      } else {
        p.x += p.vx * eDt; p.y += p.vy * eDt;
        p.vy += 220 * eDt;
        p.vx *= 0.94; p.vy *= 0.94;
        p.life -= eDt;
      }
      if (p.life <= 0) state.particles.splice(i, 1);
    }
    for (let i = state.coins.length - 1; i >= 0; i--) {
      const c = state.coins[i];
      c.y += c.vy * eDt;
      c.vy += 400 * eDt;
      c.life -= eDt;
      if (c.life <= 0) state.coins.splice(i, 1);
    }
    for (let i = state.damageNumbers.length - 1; i >= 0; i--) {
      const d = state.damageNumbers[i];
      d.y -= 40 * eDt;
      d.life -= eDt;
      if (d.life <= 0) state.damageNumbers.splice(i, 1);
    }

    // 波结束检测
    if (state.waveInProgress === 'spawning_done' && state.enemies.filter(e => e.dying <= 0).length === 0) {
      state.waveInProgress = false;
      if (state.wave >= state.level.waves.length) {
        endGame(true);
        return;
      }
      updateHUD();
      updateWavePreview();
      // 自动开始下一波
      if (state.autoStart && state.scene === 'playing') {
        setTimeout(() => { if (state.scene === 'playing' && !state.waveInProgress && !state.paused) startWave(); }, 1500);
      }
    }

    // 英雄AI
    if (state.hero) {
      const h = state.hero;
      const cdMul = state.heroCdMul || 1;
      for (const s of GD.HERO.skills) {
        const base = s.cd * 1000 * cdMul;
        const ready = (now - h['last' + s.id.toUpperCase()]) >= base;
        state.heroCd[s.id] = ready ? 0 : (1 - (now - h['last' + s.id.toUpperCase()]) / base);
      }
      let nearest = null, nd = 9999;
      for (const e of state.enemies) {
        if (e.dying > 0) continue;
        const d = Math.hypot(e.x - h.x, e.y - h.y);
        if (d < nd) { nd = d; nearest = e; }
      }
      h.target = nearest;
      if (nearest && nd < 60) {
        const ang = Math.atan2(nearest.y - h.y, nearest.x - h.x);
        h.angle = ang;
        if (now - h.lastAtk > 800) {
          applyDamage(nearest, h.atk, 0, 0, false, false);
          h.lastAtk = now;
        }
      }
    }
  }

  function drawSprite(img, x, y, size, alpha, scale, rot, halo) {
    if (halo) {
      ctx.save();
      const grad = ctx.createRadialGradient(x, y, size * 0.18, x, y, size * 0.58);
      grad.addColorStop(0, halo);
      grad.addColorStop(0.65, halo);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(x, y, size * 0.58, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.beginPath();
      ctx.ellipse(x, y + size * 0.42, size * 0.32, size * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.translate(x, y);
    ctx.rotate(rot || 0);
    ctx.scale(scale || 1, scale || 1);
    if (img) {
      ctx.drawImage(img, -size / 2, -size / 2, size, size);
      ctx.strokeStyle = 'rgba(80, 50, 30, 0.18)';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(-size / 2 + 1, -size / 2 + 1, size - 2, size - 2);
    } else {
      ctx.fillStyle = '#fab1a0';
      ctx.beginPath();
      ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.floor(size * 0.4)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', 0, 0);
    }
    ctx.restore();
  }

  function render() {
    const nowMs = performance.now();
    ctx.clearRect(0, 0, W, H);

    if (state.scene === 'menu' || state.scene === 'levelSelect' || state.scene === 'talents') {
      renderBg();
      return;
    }

    ctx.save();
    if (state.shakeX !== 0 || state.shakeY !== 0) {
      ctx.translate(state.shakeX, state.shakeY);
    }

    renderPlaying();

    ctx.restore();

    // 渲染暂停覆盖层
    if (state.paused && state.scene === 'playing') {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⏸ 已暂停', W / 2, H / 2 - 20);
      ctx.font = '16px sans-serif';
      ctx.fillText('点击继续按钮或按 P 键', W / 2, H / 2 + 24);
    }

    // 成就通知
    for (let i = 0; i < state.achievementNotices.length; i++) {
      const n = state.achievementNotices[i];
      const t = Math.min(1, n.life / n.maxLife);
      const alpha = t < 0.2 ? t / 0.2 : 1;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      const tw = ctx.measureText(n.text).width + 40;
      ctx.fillRect(PLAY_W / 2 - tw / 2, 60 + i * 40, tw, 32);
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(n.text, PLAY_W / 2, 76 + i * 40);
      ctx.globalAlpha = 1;
    }
  }

  function renderBg() {
    if (IMAGES['bg_menu']) ctx.drawImage(IMAGES['bg_menu'], 0, 0, PLAY_W, PLAY_H);
    else {
      const grad = ctx.createLinearGradient(0, 0, 0, PLAY_H);
      grad.addColorStop(0, '#ffe5b4');
      grad.addColorStop(1, '#ffb3c6');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, PLAY_W, PLAY_H);
    }
    if (IMAGES.carrot) {
      const breathe = 1 + Math.sin(now() * 0.0025) * 0.05;
      drawSprite(IMAGES.carrot, PLAY_W / 2, PLAY_H / 2, 200, 1, breathe, 0, '#fff5d6');
    }
  }
  function now() { return performance.now(); }

  function renderPlaying() {
    if (state.level) {
      const lv = state.level;
      if (state.bgImg) ctx.drawImage(state.bgImg, 0, 0, PLAY_W, PLAY_H);
      else {
        const grad = ctx.createLinearGradient(0, 0, 0, PLAY_H);
        grad.addColorStop(0, lv.bgColor1);
        grad.addColorStop(1, lv.bgColor2);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, PLAY_W, PLAY_H);
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            if ((c + r) % 2 === 0) {
              ctx.fillStyle = 'rgba(255,255,255,0.06)';
              ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
            }
          }
        }
      }
      // 路径
      for (const [c, r] of lv.path) {
        const x = c * TILE, y = r * TILE;
        const grad = ctx.createLinearGradient(x, y, x + TILE, y + TILE);
        grad.addColorStop(0, '#c8956b');
        grad.addColorStop(1, '#a67c52');
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, TILE, TILE);
      }
      ctx.strokeStyle = 'rgba(101, 67, 33, 0.4)';
      ctx.lineWidth = 2;
      for (const [c, r] of lv.path) ctx.strokeRect(c * TILE + 1, r * TILE + 1, TILE - 2, TILE - 2);

      // 路径方向指示（流动动画）
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      const t = (performance.now() * 0.0005) % 1;
      for (let i = 0; i < Math.min(lv.path.length, 5); i++) {
        const [c, r] = lv.path[Math.floor((i + t * lv.path.length) % lv.path.length)];
        ctx.fillRect(c * TILE + 10, r * TILE + 10, 12, 12);
      }

      if (lv.airPath) {
        ctx.fillStyle = 'rgba(160, 200, 255, 0.18)';
        for (const [c, r] of lv.airPath) ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
        ctx.strokeStyle = 'rgba(116, 185, 255, 0.4)';
        ctx.setLineDash([4, 4]);
        for (const [c, r] of lv.airPath) ctx.strokeRect(c * TILE + 1, r * TILE + 1, TILE - 2, TILE - 2);
        ctx.setLineDash([]);
      }

      // 路障渲染
      for (const sb of state.shieldBlocks) {
        const alpha = Math.min(1, sb.life / 3);
        ctx.fillStyle = 'rgba(116, 185, 255, ' + (alpha * 0.5) + ')';
        ctx.fillRect(sb.x - TILE / 2, sb.y - TILE / 2, TILE, TILE);
        ctx.strokeStyle = 'rgba(116, 185, 255, ' + alpha + ')';
        ctx.lineWidth = 3;
        ctx.strokeRect(sb.x - TILE / 2 + 2, sb.y - TILE / 2 + 2, TILE - 4, TILE - 4);
      }

      // 放置预览
      if (state.hoverCell && state.selectedTowerType) {
        const { col, row } = state.hoverCell;
        const cfg = GD.TOWERS[state.selectedTowerType];
        const cx = col * TILE + TILE / 2, cy = row * TILE + TILE / 2;
        if (canPlace(col, row)) {
          ctx.fillStyle = 'rgba(108, 92, 231, 0.18)';
          ctx.beginPath();
          ctx.arc(cx, cy, cfg.range, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(108, 92, 231, 0.5)';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = 'rgba(108, 92, 231, 0.25)';
          ctx.fillRect(col * TILE + 4, row * TILE + 4, TILE - 8, TILE - 8);
          // Ghost tower preview
          const ghostImg = IMAGES[state.selectedTowerType];
          if (ghostImg) {
            ctx.globalAlpha = 0.4;
            ctx.drawImage(ghostImg, cx - TILE / 2, cy - TILE / 2, TILE, TILE);
            ctx.globalAlpha = 1;
          }
        } else {
          ctx.fillStyle = 'rgba(214, 48, 49, 0.3)';
          ctx.fillRect(col * TILE, row * TILE, TILE, TILE);
          ctx.strokeStyle = 'rgba(214, 48, 49, 0.7)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(col * TILE + 10, row * TILE + 10);
          ctx.lineTo(col * TILE + TILE - 10, row * TILE + TILE - 10);
          ctx.moveTo(col * TILE + TILE - 10, row * TILE + 10);
          ctx.lineTo(col * TILE + 10, row * TILE + TILE - 10);
          ctx.stroke();
        }
      }

      // 萝卜
      const last = lv.path[lv.path.length - 1];
      const carrotBreathe = 1 + Math.sin(now() * 0.0025) * 0.05;
      drawSprite(state.carrotImg || IMAGES.carrot, last[0] * TILE + TILE / 2, last[1] * TILE + TILE / 2, TILE * 1.3, 1, carrotBreathe, 0, '#fff5d6');

      // 塔
      for (const t of state.towers) {
        const cfg = getTowerCfg(t);
        const recoilOffset = Math.sin(t.recoil * Math.PI) * 6;
        const drawX = t.x - Math.cos(t.angle) * recoilOffset;
        const drawY = t.y - Math.sin(t.angle) * recoilOffset;
        const towerBreathe = 1 + Math.sin(now() * 0.004 + t.col * 0.5 + t.row * 0.7) * 0.02;
        const sz = TILE * (t.tier === 3 ? 1.1 : t.tier === 2 ? 1.05 : 1);
        if (state.selectedPlacedTower === t) {
          ctx.fillStyle = 'rgba(225, 112, 85, 0.2)';
          ctx.beginPath();
          ctx.arc(t.x, t.y, cfg.range + 4 + Math.sin(now() * 0.006) * 2, 0, Math.PI * 2);
          ctx.fill();
        }
        const img = IMAGES[t.typeId];
        drawSprite(img, drawX, drawY, sz, 1, towerBreathe, t.angle - Math.PI / 2, '#c8f0d8');
        if (t.tier > 1) {
          ctx.fillStyle = '#ffd700';
          ctx.beginPath();
          ctx.arc(t.x + 12, t.y - 12, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('T' + t.tier, t.x + 12, t.y - 12);
        }
      }

      // 蜜蜂
      for (const bee of state.beeDrones) {
        ctx.fillStyle = '#fdcb6e';
        ctx.beginPath();
        ctx.arc(bee.x, bee.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2d3436';
        ctx.beginPath();
        ctx.arc(bee.x + 2, bee.y - 2, 2, 0, Math.PI * 2);
        ctx.fill();
        // 翅膀
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath();
        ctx.ellipse(bee.x - 3, bee.y - 5, 4, 2, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(bee.x + 3, bee.y - 5, 4, 2, 0.3, 0, Math.PI * 2);
        ctx.fill();
      }

      // 敌人
      for (const e of state.enemies) {
        if (e.dying > 0) {
          const progress = 1 - e.dying / 0.4;
          drawSprite(IMAGES[e.monId], e.x, e.y, e.size * 1.6, 1 - progress, 1 - progress * 0.7, e.dying * 3);
          continue;
        }
        const bobY = Math.sin(e.walkPhase) * 3;
        const flash = e.hitFlash > 0;
        drawSprite(IMAGES[e.monId], e.x, e.y + bobY, e.size * 1.6, 1, 1, Math.sin(e.walkPhase) * 0.1, '#ffe5b4');
        if (flash) {
          ctx.fillStyle = 'rgba(255,255,255,0.7)';
          ctx.beginPath();
          ctx.arc(e.x, e.y + bobY, e.size * 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
        const hpW = e.size * 1.4, hpH = 4;
        const hpX = e.x - hpW / 2, hpY = e.y + bobY - e.size - 10;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(hpX - 1, hpY - 1, hpW + 2, hpH + 2);
        const hpPct = Math.max(0, e.hp / e.maxHp);
        const hpColor = hpPct > 0.6 ? '#00b894' : (hpPct > 0.3 ? '#fdcb6e' : '#d63031');
        ctx.fillStyle = hpColor;
        ctx.fillRect(hpX, hpY, hpW * hpPct, hpH);
        if (performance.now() < e.slowUntil) {
          ctx.fillStyle = 'rgba(116, 185, 255, 0.4)';
          ctx.beginPath();
          ctx.arc(e.x, e.y + bobY, e.size * 1.1, 0, Math.PI * 2);
          ctx.fill();
        }
        if (e.flying) {
          ctx.fillStyle = 'rgba(255,255,255,0.6)';
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('✈', e.x, e.y + bobY - e.size - 14);
        }
        if (e.shieldActive > 0) {
          ctx.strokeStyle = 'rgba(116, 185, 255, 0.8)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(e.x, e.y + bobY, e.size * 1.2, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // 弹丸
      for (const p of state.projectiles) {
        for (const t of (p.trail || [])) {
          const a = (t.life / 0.18) * 0.5;
          ctx.fillStyle = p.color;
          ctx.globalAlpha = a;
          ctx.beginPath();
          ctx.arc(t.x, t.y, p.size * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.save();
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;
        if (p.isCrit) {
          ctx.shadowBlur = 20;
          ctx.shadowColor = '#ffd700';
        }
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(p.x - p.size * 0.25, p.y - p.size * 0.25, p.size * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 粒子
      for (const p of state.particles) {
        const t = p.life / p.maxLife;
        ctx.globalAlpha = Math.max(0, t);
        if (p.kind === 'shockwave') {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 4 * t;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (1 - t), 0, Math.PI * 2);
          ctx.stroke();
        } else if (p.kind === 'ring') {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (1 - t) * 0.8, 0, Math.PI * 2);
          ctx.stroke();
        } else if (p.kind === 'muzzle') {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * t, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.kind === 'sticky_pool') {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (0.5 + t * 0.5), 0, Math.PI * 2);
          ctx.fill();
        } else if (p.kind === 'star') {
          ctx.fillStyle = p.color;
          const s = p.size * (0.5 + t * 0.5);
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.vx * 0.05);
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
            const a2 = a + Math.PI / 5;
            ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s);
            ctx.lineTo(Math.cos(a2) * s * 0.4, Math.sin(a2) * s * 0.4);
          }
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        } else {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (0.5 + t * 0.5), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      // 金币
      for (const c of state.coins) {
        const t = c.life / c.maxLife;
        ctx.globalAlpha = t;
        ctx.fillStyle = c.color;
        ctx.beginPath();
        ctx.arc(c.x, c.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff7d6';
        ctx.beginPath();
        ctx.arc(c.x - 2, c.y - 2, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // 伤害数字
      for (const d of state.damageNumbers) {
        const t = d.life / d.maxLife;
        ctx.globalAlpha = t;
        ctx.fillStyle = d.color;
        ctx.strokeStyle = 'rgba(0,0,0,0.7)';
        ctx.lineWidth = 3;
        ctx.font = `bold ${d.crit ? 18 : 14}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeText(d.value, d.x, d.y);
        ctx.fillText(d.value, d.x, d.y);
      }
      ctx.globalAlpha = 1;

      // 英雄
      if (state.hero) {
        const h = state.hero;
        const halo = 'rgba(255, 200, 100, 0.4)';
        drawSprite(IMAGES['hero_capi'], h.x, h.y, TILE, 1, 1 + Math.sin(now() * 0.005) * 0.05, h.angle || 0, halo);
        const hpW = 28, hpH = 4;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(h.x - hpW / 2 - 1, h.y - TILE / 2 - 12 - 1, hpW + 2, hpH + 2);
        ctx.fillStyle = '#ff7675';
        ctx.fillRect(h.x - hpW / 2, h.y - TILE / 2 - 12, hpW * (h.hp / h.maxHp), hpH);
        // 英雄等级
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Lv.' + h.level, h.x, h.y - TILE / 2 - 18);
      }
    }

    // HUD
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fillRect(PLAY_W, 0, HUD_W, H);
    ctx.strokeStyle = '#5b8a3a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(PLAY_W, 0); ctx.lineTo(PLAY_W, H);
    ctx.stroke();
    ctx.fillStyle = '#2d3436';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🥕 ' + state.lives, PLAY_W + HUD_W / 2, 26);
    ctx.fillText('🪙 ' + state.gold, PLAY_W + HUD_W / 2, 52);
    ctx.fillText('波 ' + state.wave + '/' + (state.level ? state.level.waves.length : 0), PLAY_W + HUD_W / 2, 78);
    if (state.hero) {
      const h = state.hero;
      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#5a3e36';
      ctx.fillText('HP ' + Math.floor(h.hp) + '/' + h.maxHp, PLAY_W + HUD_W / 2, 100);
      ctx.fillText('Lv.' + h.level + ' XP:' + h.xp, PLAY_W + HUD_W / 2, 116);
    }
    // 连杀
    if (state.combo >= 3) {
      ctx.fillStyle = state.combo >= 10 ? '#ff7675' : state.combo >= 5 ? '#fdcb6e' : '#fff';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('COMBO x' + state.combo, PLAY_W + HUD_W / 2, 138);
    }
    // 速度指示
    ctx.fillStyle = state.speedMul >= 2 ? '#ff7675' : '#636e72';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(state.speedMul + 'x', PLAY_W + HUD_W / 2, 158);

    // 暂停/速度按钮
    const btnY = H - 56;
    ctx.fillStyle = state.paused ? '#b2bec3' : '#fdcb6e';
    ctx.fillRect(PLAY_W + 10, btnY, HUD_W - 20, 24);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.paused ? '▶ 继续' : '⏸ 暂停', PLAY_W + HUD_W / 2, btnY + 12);

    // 速度切换
    const speedY = H - 28;
    ctx.fillStyle = state.speedMul === 1 ? '#e17055' : '#b2bec3';
    ctx.fillRect(PLAY_W + 10, speedY, 50, 22);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('1x', PLAY_W + 35, speedY + 11);
    ctx.fillStyle = state.speedMul === 2 ? '#e17055' : '#b2bec3';
    ctx.fillRect(PLAY_W + 62, speedY, 50, 22);
    ctx.fillStyle = '#fff';
    ctx.fillText('2x', PLAY_W + 87, speedY + 11);
  }

  function showWaveBanner(text) {
    const banner = document.getElementById('waveBanner');
    if (!banner) return;
    banner.innerHTML = '<div class="wave-banner-text">' + text + '</div>';
    const el = banner.querySelector('.wave-banner-text');
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { banner.innerHTML = ''; }, 2300);
  }

  function showResultModal(won, starsEarned, timeSec) {
    const overlay = document.getElementById('overlay');
    if (!overlay) return;
    const title = document.getElementById('resultTitle');
    const text = document.getElementById('resultText');
    const stats = document.getElementById('resultStats');
    const starsEl = document.getElementById('resultStars');
    const retryBtn = document.getElementById('resultRetry');
    const menuBtn = document.getElementById('resultMenu');
    if (won) {
      title.textContent = '🎉 胜利！';
      let s = '消灭了 ' + state.totalKilled + ' 怪, 用时 ' + Math.floor(timeSec) + 's';
      if (state.maxCombo >= 3) s += '  最高连杀: ' + state.maxCombo;
      text.textContent = '你成功保护了萝卜！';
      stats.textContent = s;
      if (starsEl) starsEl.innerHTML = '⭐'.repeat(Math.max(0, starsEarned)) + '<span style="color:#ccc">' + '⭐'.repeat(3 - Math.max(0, starsEarned)) + '</span>';
    } else {
      title.textContent = '💔 失败';
      text.textContent = '萝卜被吃掉了…';
      stats.textContent = `消灭了 ${state.totalKilled} 个怪物 | 最高连杀: ${state.maxCombo}`;
      if (starsEl) starsEl.innerHTML = '';
    }
    if (retryBtn) retryBtn.onclick = () => { overlay.classList.add('hidden'); setLevel(state.level); };
    if (menuBtn) menuBtn.onclick = () => { overlay.classList.add('hidden'); showLevelSelect(); };
    overlay.classList.remove('hidden');
  }

  function updateSkillBar() {
    const bar = document.getElementById('skillBar');
    if (!bar || !state.hero) return;
    const cdMul = state.heroCdMul || 1;
    const now = performance.now();
    const btns = bar.querySelectorAll('.skill-btn');
    GD.HERO.skills.forEach((s, i) => {
      const btn = btns[i];
      if (!btn) return;
      const last = state.hero['last' + s.id.toUpperCase()];
      const total = s.cd * 1000 * cdMul;
      const elapsed = now - last;
      const cdDiv = btn.querySelector('.cd');
      if (elapsed >= total) {
        btn.classList.add('ready');
        if (cdDiv) cdDiv.style.display = 'none';
      } else {
        btn.classList.remove('ready');
        if (cdDiv) { cdDiv.style.display = 'flex'; cdDiv.textContent = Math.ceil((total - elapsed) / 1000); }
      }
    });
  }

  function buildShop() {
    const shop = document.getElementById('shop');
    if (!shop) return;
    shop.innerHTML = '';
    const allowed = state.level.allowedTowers;
    allowed.forEach((id, idx) => {
      const cfg = GD.TOWERS[id];
      const card = document.createElement('div');
      card.className = 'card';
      card.dataset.tower = id;
      card.dataset.index = idx;
      const img = document.createElement('img');
      img.className = 'card-img';
      img.alt = cfg.name;
      const sprite = IMAGES[id];
      if (sprite instanceof HTMLCanvasElement) {
        img.src = sprite.toDataURL();
      } else if (sprite instanceof HTMLImageElement) {
        img.src = sprite.src;
      } else {
        const emoji = TOWER_EMOJI[id] || '❓';
        const fc = document.createElement('canvas'); fc.width = 64; fc.height = 64;
        const fcx = fc.getContext('2d');
        fcx.font = '48px sans-serif'; fcx.textAlign = 'center'; fcx.textBaseline = 'middle';
        fcx.fillText(emoji, 32, 32);
        img.src = fc.toDataURL();
      }
      card.appendChild(img);
      const name = document.createElement('div');
      name.className = 'card-name';
      name.textContent = cfg.name;
      card.appendChild(name);
      const stats = document.createElement('div');
      stats.className = 'card-stats';
      stats.textContent = `⚔ ${cfg.dmg}  ⓵ ${cfg.range}  ⏱${cfg.fireRate.toFixed(1)}s`;
      card.appendChild(stats);
      const cost = document.createElement('div');
      cost.className = 'card-cost';
      cost.textContent = '🪙 ' + cfg.cost;
      card.appendChild(cost);
      // 快捷键标签
      const key = document.createElement('div');
      key.className = 'card-key';
      key.style.cssText = 'position:absolute;top:4px;right:4px;background:#d35400;color:white;font-size:10px;padding:1px 5px;border-radius:4px;font-weight:bold;';
      key.textContent = (idx + 1);
      card.appendChild(key);
      card.addEventListener('click', () => {
        if (state.gold < cfg.cost) return;
        state.selectedTowerType = state.selectedTowerType === id ? null : id;
        state.selectedPlacedTower = null;
        hideUpgradePanel();
        updateHUD();
      });
      shop.appendChild(card);
    });
  }

  function updateHUD() {
    if (!state.level) return;
    document.getElementById('lives').textContent = state.lives;
    document.getElementById('gold').textContent = state.gold;
    document.getElementById('waveNum').textContent = state.wave;
    document.getElementById('killCount').textContent = state.totalKilled;
    // 波进度条
    const totalWaves = state.level.waves.length;
    const pct = Math.min(100, (state.wave / totalWaves) * 100);
    const wb = document.getElementById('waveProgress');
    if (wb) wb.style.width = pct + '%';
    const btn = document.getElementById('nextWave');
    if (state.waveInProgress && state.waveInProgress !== 'spawning_done') {
      btn.disabled = true;
      btn.textContent = '🌀 战斗中…';
    } else if (state.waveInProgress === 'spawning_done') {
      btn.disabled = true;
      btn.textContent = '🧹 清场中…';
    } else if (state.wave >= state.level.waves.length) {
      btn.disabled = true;
      btn.textContent = '🏆 已通关';
    } else {
      btn.disabled = false;
      btn.textContent = '▶ 第' + (state.wave + 1) + '波';
    }
    document.querySelectorAll('.card').forEach(card => {
      const cost = GD.TOWERS[card.dataset.tower].cost;
      card.classList.toggle('disabled', state.gold < cost);
      card.classList.toggle('selected', state.selectedTowerType === card.dataset.tower);
    });
    // 自动开始按钮
    const autoBtn = document.getElementById('autoStart');
    if (autoBtn) {
      autoBtn.textContent = state.autoStart ? '🔄 自动:开' : '🔄 自动:关';
      autoBtn.style.background = state.autoStart ? 'linear-gradient(180deg, #00b894, #00a381)' : 'linear-gradient(180deg, #b2bec3, #636e72)';
    }
    // 英雄等级
    const heroHud = document.getElementById('heroHud');
    const heroLvl = document.getElementById('heroLevel');
    if (heroHud && heroLvl && state.hero) {
      heroHud.style.display = '';
      heroLvl.textContent = 'Lv' + state.heroLevel;
    }
  }

  function showLevelSelect() {
    state.scene = 'levelSelect';
    state.selectedTowerType = null;
    state.selectedPlacedTower = null;
    state.beeDrones = [];
    state.shieldBlocks = [];
    hideUpgradePanel();
    document.getElementById('hud').style.display = 'none';
    document.getElementById('shop').style.display = 'none';
    document.getElementById('waveBanner').style.display = 'none';
    document.getElementById('wavePreview').style.display = 'none';
    const sel = document.getElementById('levelSelect');
    sel.style.display = 'flex';
    sel.innerHTML = '';
    const title = document.createElement('h2');
    title.textContent = '🥕 选择关卡 · Carrot Defense v3';
    title.style.cssText = 'color:#d35400;font-size:30px;margin-bottom:14px;text-shadow:2px 2px 0 #fff;';
    sel.appendChild(title);
    const sub = document.createElement('div');
    sub.style.cssText = 'color:#b8541e;font-size:14px;margin-bottom:18px;';
    sub.textContent = '★ = 通关 | ★★ = 不丢血 | ★★★ = 限时通关 | 每关三星解锁永久天赋';
    sel.appendChild(sub);
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(4,160px);gap:14px;';
    const themeEmojis = { grass: '🌱', desert: '🏜️', snow: '❄️', volcano: '🌋', sky: '☁️', jungle: '🌴', underwater: '🐠', candy: '🍬' };
    GD.LEVELS.forEach(lv => {
      const card = document.createElement('div');
      const unlocked = lv.id === 1 || (stars[lv.id - 1] && stars[lv.id - 1] > 0);
      card.style.cssText = 'width:160px;height:210px;background:linear-gradient(180deg,#fff,#fff8e7);border-radius:16px;border:3px solid ' + (unlocked ? '#dfe6e9' : '#bbb') + ';padding:8px;cursor:' + (unlocked ? 'pointer' : 'not-allowed') + ';display:flex;flex-direction:column;align-items:center;justify-content:flex-start;box-shadow:0 4px 0 #c8d0d3,0 6px 12px rgba(0,0,0,0.08);transition:transform 0.15s;';
      if (!unlocked) card.style.opacity = '0.5';
      if (unlocked) {
        card.addEventListener('mouseenter', () => { card.style.transform = 'translateY(-3px)'; card.style.boxShadow = '0 6px 0 #c8d0d3,0 8px 16px rgba(0,0,0,0.15)'; });
        card.addEventListener('mouseleave', () => { card.style.transform = ''; card.style.boxShadow = '0 4px 0 #c8d0d3,0 6px 12px rgba(0,0,0,0.08)'; });
      }
      const e = stars[lv.id] || 0;
      const themeEmoji = themeEmojis[lv.theme] || '🌱';
      card.innerHTML = '<div style="font-size:50px;margin-top:6px;">' + themeEmoji + '</div>' +
        '<div style="font-weight:bold;color:#2d3436;font-size:15px;margin-top:4px;">' + lv.id + '. ' + lv.name + '</div>' +
        '<div style="color:#636e72;font-size:11px;margin-top:2px;">' + lv.waves.length + ' 波 · 🪙' + lv.startGold + ' · ❤' + lv.startLives + '</div>' +
        '<div style="margin-top:6px;font-size:18px;color:#ffa502;letter-spacing:2px;">' + '⭐'.repeat(e) + '<span style="color:#ccc">' + '⭐'.repeat(3 - e) + '</span></div>';
      if (unlocked) {
        card.addEventListener('click', () => {
          sel.style.display = 'none';
          document.getElementById('hud').style.display = '';
          document.getElementById('shop').style.display = '';
          document.getElementById('waveBanner').style.display = '';
          document.getElementById('wavePreview').style.display = '';
          setLevel(lv);
        });
      }
      grid.appendChild(card);
    });
    sel.appendChild(grid);
    const talentsBtn = document.createElement('button');
    talentsBtn.textContent = '🌟 天赋 (' + Object.keys(talents).length + '/' + GD.TALENTS.length + ')';
    talentsBtn.style.cssText = 'margin-top:18px;padding:10px 24px;background:linear-gradient(180deg,#fdcb6e,#e17055);color:white;border:none;border-radius:22px;font-weight:bold;cursor:pointer;box-shadow:0 4px 0 #b85238;';
    talentsBtn.addEventListener('click', showTalents);
    sel.appendChild(talentsBtn);
    const achBtn = document.createElement('button');
    achBtn.textContent = '🏆 成就 (' + Object.keys(unlockedAchievements).length + '/' + GD.ACHIEVEMENTS.length + ')';
    achBtn.style.cssText = 'margin-top:10px;padding:10px 24px;background:linear-gradient(180deg,#ffd700,#fdcb6e);color:#2d3436;border:none;border-radius:22px;font-weight:bold;cursor:pointer;box-shadow:0 4px 0 #c8960e;';
    achBtn.addEventListener('click', showAchievements);
    sel.appendChild(achBtn);
  }

  function showTalents() {
    state.scene = 'talents';
    const sel = document.getElementById('levelSelect');
    sel.style.display = 'flex';
    sel.innerHTML = '';
    const title = document.createElement('h2');
    title.textContent = '🌟 永久天赋';
    title.style.cssText = 'color:#d35400;font-size:30px;margin-bottom:14px;text-shadow:2px 2px 0 #fff;';
    sel.appendChild(title);
    const sub = document.createElement('div');
    sub.style.cssText = 'color:#636e72;font-size:14px;margin-bottom:18px;';
    sub.textContent = '每关 3 星解锁一项,永久影响所有关卡';
    sel.appendChild(sub);
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(4,140px);gap:14px;';
    GD.TALENTS.forEach(t => {
      const unlocked = !!talents[t.id];
      const card = document.createElement('div');
      card.style.cssText = 'width:140px;height:160px;background:linear-gradient(180deg,' + (unlocked ? '#fff5d6,#ffe5b4' : '#f0f0f0,#ddd') + ');border-radius:14px;border:3px solid ' + (unlocked ? '#e17055' : '#bbb') + ';padding:8px;display:flex;flex-direction:column;align-items:center;';
      card.innerHTML = '<div style="font-size:40px;">' + t.icon + '</div>' +
        '<div style="font-weight:bold;font-size:14px;margin-top:4px;">' + t.name + '</div>' +
        '<div style="font-size:11px;color:#636e72;margin-top:4px;text-align:center;">' + t.desc + '</div>' +
        '<div style="margin-top:auto;font-size:11px;color:' + (unlocked ? '#d35400' : '#999') + ';">' + (unlocked ? '✓ 已解锁 (关' + t.unlockLevel + '三星)' : '关' + t.unlockLevel + '三星解锁') + '</div>';
      grid.appendChild(card);
    });
    sel.appendChild(grid);
    const back = document.createElement('button');
    back.textContent = '← 返回关卡选择';
    back.style.cssText = 'margin-top:18px;padding:10px 24px;background:#fff;color:#d35400;border:2px solid #d35400;border-radius:22px;font-weight:bold;cursor:pointer;';
    back.addEventListener('click', showLevelSelect);
    sel.appendChild(back);
  }

  function showAchievements() {
    state.scene = 'talents';
    const sel = document.getElementById('levelSelect');
    sel.style.display = 'flex';
    sel.innerHTML = '';
    const title = document.createElement('h2');
    title.textContent = '🏆 成就';
    title.style.cssText = 'color:#d35400;font-size:30px;margin-bottom:14px;text-shadow:2px 2px 0 #fff;';
    sel.appendChild(title);
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(5,130px);gap:10px;';
    GD.ACHIEVEMENTS.forEach(a => {
      const unlocked = !!unlockedAchievements[a.id];
      const card = document.createElement('div');
      card.style.cssText = 'width:130px;height:130px;background:linear-gradient(180deg,' + (unlocked ? '#fff5d6,#ffe5b4' : '#f0f0f0,#ddd') + ');border-radius:14px;border:3px solid ' + (unlocked ? '#ffd700' : '#bbb') + ';padding:8px;display:flex;flex-direction:column;align-items:center;text-align:center;';
      card.innerHTML = '<div style="font-size:36px;">' + (unlocked ? a.icon : '🔒') + '</div>' +
        '<div style="font-weight:bold;font-size:12px;margin-top:4px;">' + a.name + '</div>' +
        '<div style="font-size:10px;color:#636e72;margin-top:3px;">' + a.desc + '</div>';
      grid.appendChild(card);
    });
    sel.appendChild(grid);
    const back = document.createElement('button');
    back.textContent = '← 返回关卡选择';
    back.style.cssText = 'margin-top:18px;padding:10px 24px;background:#fff;color:#d35400;border:2px solid #d35400;border-radius:22px;font-weight:bold;cursor:pointer;';
    back.addEventListener('click', showLevelSelect);
    sel.appendChild(back);
  }

  function hideUpgradePanel() {
    const p = document.getElementById('upgradePanel');
    if (p) p.style.display = 'none';
  }

  function showUpgradePanel(t) {
    const p = document.getElementById('upgradePanel');
    if (!p) return;
    p.innerHTML = '';
    p.style.display = 'block';
    const cfg = GD.TOWERS[t.typeId];
    const title = document.createElement('div');
    title.style.cssText = 'font-weight:bold;font-size:15px;color:#d35400;margin-bottom:6px;';
    title.textContent = cfg.name + ' (T' + t.tier + ')';
    p.appendChild(title);
    if (t.tier < 3) {
      const next = cfg.upgrade['T' + (t.tier + 1)];
      const btn = document.createElement('button');
      btn.style.cssText = 'display:block;width:100%;margin-top:4px;padding:6px;background:linear-gradient(180deg,#fdcb6e,#e17055);color:white;border:none;border-radius:10px;cursor:pointer;font-weight:bold;';
      btn.textContent = '升 T' + (t.tier + 1) + ' · 🪙' + next.cost + ' · ' + next.desc;
      if (state.gold < next.cost) { btn.disabled = true; btn.style.opacity = '0.5'; }
      btn.addEventListener('click', () => { if (upgradeTower(t, t.tier + 1)) { hideUpgradePanel(); updateHUD(); } });
      p.appendChild(btn);
    } else {
      const done = document.createElement('div');
      done.style.cssText = 'color:#636e72;font-size:12px;margin-top:4px;';
      done.textContent = '已满级 · T3';
      p.appendChild(done);
    }
    // 出售（50%返还）
    const totalCost = cfg.cost + (t.tier >= 2 ? cfg.upgrade.T2.cost : 0) + (t.tier >= 3 ? cfg.upgrade.T3.cost : 0);
    const refund = Math.floor(totalCost * 0.5);
    const sell = document.createElement('button');
    sell.style.cssText = 'display:block;width:100%;margin-top:4px;padding:6px;background:#fff;color:#d35400;border:1px solid #d35400;border-radius:10px;cursor:pointer;';
    sell.textContent = '出售 (+' + refund + '🪙)';
    sell.addEventListener('click', () => {
      state.gold += refund;
      state.towers = state.towers.filter(x => x !== t);
      state.beeDrones = state.beeDrones.filter(b => b.parentTower !== t);
      hideUpgradePanel();
      state.selectedPlacedTower = null;
      updateHUD();
    });
    p.appendChild(sell);
    const close = document.createElement('button');
    close.style.cssText = 'display:block;width:100%;margin-top:4px;padding:4px;background:none;color:#636e72;border:none;cursor:pointer;font-size:12px;';
    close.textContent = '关闭';
    close.addEventListener('click', () => { state.selectedPlacedTower = null; hideUpgradePanel(); });
    p.appendChild(close);
  }

  function castSkill(skillId) {
    if (!state.hero) return;
    const h = state.hero;
    const now = performance.now();
    const cdMul = state.heroCdMul || 1;
    const sk = GD.HERO.skills.find(s => s.id === skillId);
    if (!sk) return;
    if (now - h['last' + sk.id.toUpperCase()] < sk.cd * 1000 * cdMul) return;
    h['last' + sk.id.toUpperCase()] = now;
    if (sk.id === 's1') {
      const ang = h.angle || 0;
      for (let i = 0; i < 10; i++) {
        h.x += Math.cos(ang) * 20;
        h.y += Math.sin(ang) * 20;
      }
      for (const e of state.enemies) {
        if (e.dying > 0) continue;
        if (Math.hypot(e.x - h.x, e.y - h.y) < 80) {
          e.x += Math.cos(ang) * 80;
          e.slowUntil = now + 1000;
        }
      }
      state.particles.push({ x: h.x, y: h.y, vx: 0, vy: 0, life: 0.4, maxLife: 0.4, color: '#ffa502', size: 100, kind: 'shockwave' });
    } else if (sk.id === 's2') {
      h.hp = Math.min(h.maxHp, h.hp + 20);
      for (const t of state.towers) {
        if (Math.hypot(t.x - h.x, t.y - h.y) < 200) t.buffUntil = now + 5000;
      }
    } else if (sk.id === 's3') {
      const ang = h.angle || 0;
      for (const e of state.enemies) {
        if (e.dying > 0) continue;
        const d = Math.hypot(e.x - h.x, e.y - h.y);
        if (d < 200) {
          const a = Math.atan2(e.y - h.y, e.x - h.x);
          if (Math.abs(a - ang) < Math.PI / 3 || Math.abs(a - ang + Math.PI * 2) < Math.PI / 3) {
            applyDamage(e, 100, 0, 0, false, true);
            e.x += Math.cos(a) * 50;
            e.y += Math.sin(a) * 50;
          }
        }
      }
      state.particles.push({ x: h.x, y: h.y, vx: 0, vy: 0, life: 0.4, maxLife: 0.4, color: '#ff7675', size: 200, kind: 'shockwave' });
    }
  }

  function init() {
    document.getElementById('nextWave').addEventListener('click', startWave);
    const autoBtn = document.getElementById('autoStart');
    if (autoBtn) {
      autoBtn.addEventListener('click', () => {
        state.autoStart = !state.autoStart;
        updateHUD();
      });
    }
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => { state.paused = !state.paused; });
    }
    canvas.addEventListener('mousemove', e => {
      if (state.scene !== 'playing') return;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (W / rect.width);
      const y = (e.clientY - rect.top) * (H / rect.height);
      if (x > PLAY_W) { state.hoverCell = null; return; }
      state.hoverCell = { col: Math.floor(x / TILE), row: Math.floor(y / TILE) };
    });
    canvas.addEventListener('mouseleave', () => { state.hoverCell = null; });
    canvas.addEventListener('click', e => {
      if (state.scene !== 'playing') return;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (W / rect.width);
      const y = (e.clientY - rect.top) * (H / rect.height);
      if (x > PLAY_W) {
        // 暂停按钮
        if (y > H - 56 && y < H - 32) state.paused = !state.paused;
        // 速度按钮
        if (y > H - 28) {
          if (x < PLAY_W + 60) state.speedMul = 1;
          else state.speedMul = 2;
        }
        return;
      }
      const col = Math.floor(x / TILE), row = Math.floor(y / TILE);
      if (state.selectedTowerType) {
        if (placeTower(col, row, state.selectedTowerType)) {
          updateHUD();
        }
        return;
      }
      const clicked = state.towers.find(t => t.col === col && t.row === row);
      if (clicked) {
        state.selectedPlacedTower = clicked;
        showUpgradePanel(clicked);
      } else {
        if (state.hero && state.level.heroAvailable) {
          const h = state.hero;
          if (Math.hypot(x - h.x, y - h.y) < TILE) {
            h.dragging = true;
            return;
          }
          h.x = x; h.y = y;
        }
        state.selectedPlacedTower = null;
        hideUpgradePanel();
      }
    });

    document.addEventListener('keydown', e => {
      if (state.scene !== 'playing') return;
      if (e.key === '1' || e.key.toLowerCase() === 'q') castSkill('s1');
      else if (e.key === '2' || e.key.toLowerCase() === 'w') castSkill('s2');
      else if (e.key === '3' || e.key.toLowerCase() === 'e') castSkill('s3');
      else if (e.key === ' ') { e.preventDefault(); startWave(); }
      else if (e.key.toLowerCase() === 'p') { state.paused = !state.paused; }
      else if (e.key.toLowerCase() === 'a') { state.autoStart = !state.autoStart; updateHUD(); }
      else if (e.key === 's') { state.speedMul = state.speedMul === 1 ? 2 : 1; }
      // 数字键选择塔
      else if (e.key >= '1' && e.key <= '9') {
        const idx = parseInt(e.key) - 1;
        const allowed = state.level.allowedTowers;
        if (idx < allowed.length) {
          const id = allowed[idx];
          const cfg = GD.TOWERS[id];
          if (state.gold >= cfg.cost) {
            state.selectedTowerType = state.selectedTowerType === id ? null : id;
            state.selectedPlacedTower = null;
            hideUpgradePanel();
            updateHUD();
          }
        }
      }
      // ESC 取消选择
      else if (e.key === 'Escape') {
        state.selectedTowerType = null;
        state.selectedPlacedTower = null;
        hideUpgradePanel();
        updateHUD();
      }
    });

    preload().then(() => {
      showLevelSelect();
    });
  }

  function updateProgress() {
    const p = document.getElementById('progress');
    if (p) p.textContent = LOADED + ' / ' + TOTAL;
  }
  function updateProgressBar(pct) {
    const bar = document.getElementById('progressBar');
    if (bar) bar.style.width = pct + '%';
  }

  async function preload() {
    generateFallbackSprites();
    startLazyImageLoad();

    const loading = document.getElementById('loading');
    if (loading) {
      loading.classList.add('hidden');
      setTimeout(() => { loading.style.display = 'none'; }, 400);
    }
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }

  function isPlaceholderImage(img) {
    const S = 64;
    const c = document.createElement('canvas'); c.width = S; c.height = S;
    const cx = c.getContext('2d');
    cx.drawImage(img, 0, 0, S, S);
    const data = cx.getImageData(0, 0, S, S).data;
    const totalPx = S * S;
    let transparent = 0, rSum = 0, gSum = 0, bSum = 0, n = 0;
    const rVals = [], gVals = [], bVals = [];
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
      if (a < 128) { transparent++; continue; }
      rSum += r; gSum += g; bSum += b; n++;
      rVals.push(r); gVals.push(g); bVals.push(b);
    }
    if (transparent / totalPx > 0.5) return true;
    if (n < 100) return true;
    const rMean = rSum/n, gMean = gSum/n, bMean = bSum/n;
    const variance = (arr, mean) => arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length;
    const avgVar = (variance(rVals, rMean) + variance(gVals, gMean) + variance(bVals, bMean)) / 3;
    if (avgVar < 200) return true;
    const whiteRatio = rVals.filter((v, i) => v > 230 && gVals[i] > 230 && bVals[i] > 230).length / n;
    if (whiteRatio > 0.85) return true;
    const grayRatio = rVals.filter((v, i) => Math.abs(v - gVals[i]) < 20 && Math.abs(gVals[i] - bVals[i]) < 20 && v > 180 && v < 250).length / n;
    if (grayRatio > 0.7) return true;
    return false;
  }

  function startLazyImageLoad() {
    const tasks = [];
    GD.LEVELS.forEach(lv => {
      tasks.push(['bg_' + lv.id, bgUrl(lv.bgPrompt)]);
    });
    tasks.push(['carrot', imgUrl(GD.CARROT_PROMPT)]);
    tasks.push(['hero_capi', imgUrl(GD.HERO.prompt)]);
    Object.entries(GD.TOWERS).forEach(([id, cfg]) => {
      tasks.push([id, imgUrl(cfg.prompt)]);
    });
    Object.entries(GD.MONSTERS).forEach(([id, cfg]) => {
      tasks.push([id, imgUrl(cfg.prompt)]);
    });

    const BATCH_SIZE = 3;
    const BATCH_DELAY = 1500;
    const MAX_RETRIES = 2;
    let batchIdx = 0;

    function loadOne(key, url, retries) {
      return new Promise(resolve => {
        const img = new Image();
        img.onload = () => {
          if (isPlaceholderImage(img)) {
            if (retries > 0) {
              setTimeout(() => loadOne(key, url, retries - 1).then(resolve), 3000);
            } else {
              resolve();
            }
          } else {
            IMAGES[key] = img;
            if (key.startsWith('bg_') && state.bgImg !== img) state.bgImg = img;
            if (key === 'carrot' && state.carrotImg !== img) state.carrotImg = img;
            const cardImg = document.querySelector(`.card[data-tower="${key}"] .card-img`);
            if (cardImg) cardImg.src = img.src;
            resolve();
          }
        };
        img.onerror = () => {
          if (retries > 0) {
            setTimeout(() => loadOne(key, url, retries - 1).then(resolve), 3000);
          } else {
            resolve();
          }
        };
        img.src = url;
      });
    }

    function loadBatch() {
      const batch = tasks.slice(batchIdx, batchIdx + BATCH_SIZE);
      if (batch.length === 0) return;
      let pending = batch.length;
      batch.forEach(([key, url]) => {
        loadOne(key, url, MAX_RETRIES).then(() => {
          pending--;
          if (pending === 0) {
            batchIdx += BATCH_SIZE;
            setTimeout(loadBatch, BATCH_DELAY);
          }
        });
      });
    }
    setTimeout(loadBatch, 1000);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // 程序化精灵生成系统 v2.0
  // ═══════════════════════════════════════════════════════════════════════════════

  const CAT_COLORS = {
    physical: '#e17055', magical: '#6c5ce7', nature: '#00b894', tech: '#0984e3',
    support: '#fdcb6e', elemental: '#74b9ff', dark: '#636e72',
    slime: '#00cec9', beast: '#e84393', undead: '#b2bec3', insect: '#55efc4',
    elemental_m: '#ff7675', mechanical: '#a29bfe', humanoid: '#ffeaa7', plant: '#55a630',
    aquatic: '#81ecec'
  };

  const TOWER_EMOJI = {
    T01: '🏹', T02: '🔮', T03: '❄️', T04: '💣', T05: '🔥', T06: '⚡', T07: '🐱',
    T08: '🦊', T09: '🐼', T10: '🦉', T11: '🐹', T12: '🦥', T13: '🌸', T14: '🍄',
    T15: '🌵', T16: '🌻', T17: '🎋', T18: '🧁', T19: '🍩', T20: '🍣', T21: '🍭',
    T22: '🧋', T23: '💎', T24: '🧙', T25: '👻', T26: '🐉', T27: '🦅', T28: '🤖',
    T29: '🛰️', T30: '🚁',
    T31: '🪃', T32: '🔫', T33: '🐍', T34: '💨', T35: '🛡️', T36: '🪙', T37: '🐝', T38: '🔊'
  };

  const MONSTER_EMOJI = {
    slime_01: '🟢', beast_01: '🦥', slime_02: '🍩', plant_01: '🍄', beast_02: '🐸',
    undead_01: '👻', plant_02: '🍓', insect_01: '🐞', beast_03: '🦇', humanoid_01: '👺',
    beast_04: '🐧', plant_03: '🪴', slime_03: '🍦', undead_02: '🧟', elemental_01: '🔥',
    beast_05: '🦔', insect_02: '🐝', food_01: '🍣', mechanical_01: '🤖', aquatic_01: '🪼',
    beast_06: '🐲', undead_03: '🧛', elemental_02: '⛈️', plant_04: '🌻', mechanical_02: '⚙️',
    humanoid_02: '👹', beast_07: '🦖', slime_04: '🍔',
    mini_slime: '💧', mini_spore: '🟤', mini_seed: '🫘', mini_scoop: '🍨',
    spider_01: '🕷️', jellyfish_01: '🪼', robot_01: '🤖', ninja_01: '🥷', wizard_01: '🧙',
    turtle_01: '🐢', snowman_01: '☃️', candy_01: '🍬'
  };

  const CATEGORY_DRAWERS = {
    physical: (cx, S, color) => {
      cx.fillStyle = 'rgba(0,0,0,0.12)';
      cx.beginPath(); cx.ellipse(S/2, S*0.88, S*0.32, S*0.08, 0, 0, Math.PI*2); cx.fill();
      cx.fillStyle = color;
      cx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3 - Math.PI / 6;
        const r = S * 0.36;
        const x = S/2 + Math.cos(a) * r;
        const y = S*0.48 + Math.sin(a) * r * 0.85;
        if (i === 0) cx.moveTo(x, y); else cx.lineTo(x, y);
      }
      cx.closePath(); cx.fill();
      const grad = cx.createLinearGradient(S*0.3, S*0.3, S*0.7, S*0.7);
      grad.addColorStop(0, 'rgba(255,255,255,0.3)');
      grad.addColorStop(0.5, 'rgba(255,255,255,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.15)');
      cx.fillStyle = grad;
      cx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3 - Math.PI / 6;
        const r = S * 0.36;
        const x = S/2 + Math.cos(a) * r;
        const y = S*0.48 + Math.sin(a) * r * 0.85;
        if (i === 0) cx.moveTo(x, y); else cx.lineTo(x, y);
      }
      cx.closePath(); cx.fill();
      cx.strokeStyle = 'rgba(0,0,0,0.25)'; cx.lineWidth = 2.5;
      cx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3 - Math.PI / 6;
        const r = S * 0.36;
        const x = S/2 + Math.cos(a) * r;
        const y = S*0.48 + Math.sin(a) * r * 0.85;
        if (i === 0) cx.moveTo(x, y); else cx.lineTo(x, y);
      }
      cx.closePath(); cx.stroke();
    },
    magical: (cx, S, color) => {
      const glow = cx.createRadialGradient(S/2, S*0.5, S*0.1, S/2, S*0.5, S*0.45);
      glow.addColorStop(0, color);
      glow.addColorStop(0.6, color);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      cx.fillStyle = glow; cx.beginPath(); cx.arc(S/2, S*0.5, S*0.45, 0, Math.PI*2); cx.fill();
      cx.fillStyle = color;
      cx.beginPath();
      cx.moveTo(S/2, S*0.15);
      cx.bezierCurveTo(S*0.85, S*0.25, S*0.85, S*0.7, S/2, S*0.82);
      cx.bezierCurveTo(S*0.15, S*0.7, S*0.15, S*0.25, S/2, S*0.15);
      cx.fill();
      cx.strokeStyle = 'rgba(255,255,255,0.5)'; cx.lineWidth = 2;
      cx.beginPath(); cx.arc(S/2, S*0.48, S*0.25, 0, Math.PI*2); cx.stroke();
      cx.fillStyle = 'rgba(255,255,255,0.7)';
      drawStar(cx, S/2, S*0.48, 5, S*0.08, S*0.04);
    },
    elemental: (cx, S, color) => {
      const outerGlow = cx.createRadialGradient(S/2, S*0.5, S*0.15, S/2, S*0.5, S*0.5);
      outerGlow.addColorStop(0, lighten(color, 60));
      outerGlow.addColorStop(0.5, color);
      outerGlow.addColorStop(1, 'rgba(0,0,0,0)');
      cx.fillStyle = outerGlow; cx.beginPath(); cx.arc(S/2, S*0.5, S*0.5, 0, Math.PI*2); cx.fill();
      cx.fillStyle = color;
      cx.beginPath();
      cx.moveTo(S/2, S*0.12);
      for (let i = 0; i <= 20; i++) {
        const t = i / 20;
        const angle = Math.PI * t;
        const r = S * 0.35 * (1 + 0.3 * Math.sin(angle * 3));
        const x = S/2 + Math.cos(angle + Math.PI/2) * r * 0.8;
        const y = S*0.5 + Math.sin(angle + Math.PI/2) * r;
        if (i === 0) cx.moveTo(x, y); else cx.lineTo(x, y);
      }
      cx.closePath(); cx.fill();
      const core = cx.createRadialGradient(S/2, S*0.45, S*0.02, S/2, S*0.45, S*0.15);
      core.addColorStop(0, '#fff');
      core.addColorStop(1, lighten(color, 40));
      cx.fillStyle = core; cx.beginPath(); cx.arc(S/2, S*0.45, S*0.15, 0, Math.PI*2); cx.fill();
    },
    nature: (cx, S, color) => {
      cx.fillStyle = 'rgba(0,0,0,0.1)';
      cx.beginPath(); cx.ellipse(S/2, S*0.85, S*0.30, S*0.07, 0, 0, Math.PI*2); cx.fill();
      const grad = cx.createRadialGradient(S*0.4, S*0.35, S*0.05, S/2, S*0.5, S*0.38);
      grad.addColorStop(0, lighten(color, 50));
      grad.addColorStop(1, color);
      cx.fillStyle = grad; cx.beginPath(); cx.arc(S/2, S*0.48, S*0.36, 0, Math.PI*2); cx.fill();
      cx.fillStyle = darken(color, 20);
      for (let i = 0; i < 3; i++) {
        const a = i * Math.PI * 2 / 3 - Math.PI / 2;
        drawLeaf(cx, S/2 + Math.cos(a) * S*0.2, S*0.48 + Math.sin(a) * S*0.2, S*0.12, a);
      }
      cx.strokeStyle = darken(color, 30); cx.lineWidth = 2;
      cx.beginPath(); cx.arc(S/2, S*0.48, S*0.36, 0, Math.PI*2); cx.stroke();
    },
    support: (cx, S, color) => {
      const glow = cx.createRadialGradient(S/2, S*0.5, S*0.1, S/2, S*0.5, S*0.45);
      glow.addColorStop(0, lighten(color, 40));
      glow.addColorStop(0.7, color);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      cx.fillStyle = glow; cx.beginPath(); cx.arc(S/2, S*0.5, S*0.45, 0, Math.PI*2); cx.fill();
      cx.fillStyle = color; cx.beginPath(); cx.arc(S/2, S*0.48, S*0.35, 0, Math.PI*2); cx.fill();
      cx.fillStyle = 'rgba(255,255,255,0.6)';
      drawHeart(cx, S/2, S*0.48, S*0.12);
      cx.fillStyle = '#fff';
      cx.beginPath(); cx.arc(S*0.35, S*0.35, S*0.04, 0, Math.PI*2); cx.fill();
    },
    dark: (cx, S, color) => {
      for (let i = 0; i < 5; i++) {
        const a = i * Math.PI * 2 / 5;
        const x = S/2 + Math.cos(a) * S*0.25;
        const y = S*0.5 + Math.sin(a) * S*0.2;
        const grad = cx.createRadialGradient(x, y, S*0.05, x, y, S*0.2);
        grad.addColorStop(0, color);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        cx.fillStyle = grad; cx.beginPath(); cx.arc(x, y, S*0.2, 0, Math.PI*2); cx.fill();
      }
      cx.fillStyle = color;
      cx.beginPath();
      cx.moveTo(S*0.3, S*0.75);
      cx.quadraticCurveTo(S*0.3, S*0.2, S/2, S*0.15);
      cx.quadraticCurveTo(S*0.7, S*0.2, S*0.7, S*0.75);
      for (let i = 0; i <= 4; i++) {
        const x = S*0.7 - i * S*0.1;
        const y = S*0.75 + (i % 2 === 0 ? 0 : S*0.08);
        cx.lineTo(x, y);
      }
      cx.closePath(); cx.fill();
      cx.fillStyle = '#fff';
      cx.beginPath(); cx.arc(S*0.4, S*0.4, S*0.06, 0, Math.PI*2); cx.fill();
      cx.beginPath(); cx.arc(S*0.6, S*0.4, S*0.06, 0, Math.PI*2); cx.fill();
    },
    tech: (cx, S, color) => {
      cx.fillStyle = 'rgba(0,0,0,0.15)';
      cx.beginPath(); cx.ellipse(S/2, S*0.88, S*0.28, S*0.06, 0, 0, Math.PI*2); cx.fill();
      const grad = cx.createLinearGradient(S*0.25, S*0.25, S*0.75, S*0.75);
      grad.addColorStop(0, lighten(color, 30));
      grad.addColorStop(0.5, color);
      grad.addColorStop(1, darken(color, 20));
      cx.fillStyle = grad;
      drawRoundRect(cx, S*0.22, S*0.18, S*0.56, S*0.6, S*0.08);
      cx.fill();
      cx.strokeStyle = lighten(color, 50); cx.lineWidth = 1.5;
      cx.beginPath();
      cx.moveTo(S*0.3, S*0.35); cx.lineTo(S*0.45, S*0.35); cx.lineTo(S*0.45, S*0.5);
      cx.moveTo(S*0.7, S*0.35); cx.lineTo(S*0.55, S*0.35); cx.lineTo(S*0.55, S*0.5);
      cx.stroke();
      cx.fillStyle = lighten(color, 60);
      cx.beginPath(); cx.arc(S*0.35, S*0.28, S*0.04, 0, Math.PI*2); cx.fill();
      cx.beginPath(); cx.arc(S*0.65, S*0.28, S*0.04, 0, Math.PI*2); cx.fill();
      cx.strokeStyle = darken(color, 30); cx.lineWidth = 2;
      drawRoundRect(cx, S*0.22, S*0.18, S*0.56, S*0.6, S*0.08);
      cx.stroke();
    }
  };

  const MONSTER_DRAWERS = {
    slime: (cx, S, color) => {
      const grad = cx.createRadialGradient(S*0.4, S*0.35, S*0.05, S/2, S*0.5, S*0.4);
      grad.addColorStop(0, lighten(color, 60));
      grad.addColorStop(0.7, color);
      grad.addColorStop(1, darken(color, 15));
      cx.fillStyle = grad;
      cx.beginPath();
      cx.ellipse(S/2, S*0.52, S*0.38, S*0.32, 0, 0, Math.PI*2);
      cx.fill();
      cx.fillStyle = 'rgba(255,255,255,0.5)';
      cx.beginPath(); cx.ellipse(S*0.38, S*0.4, S*0.12, S*0.08, -0.3, 0, Math.PI*2); cx.fill();
    },
    beast: (cx, S, color) => {
      const grad = cx.createRadialGradient(S*0.4, S*0.35, S*0.05, S/2, S*0.5, S*0.38);
      grad.addColorStop(0, lighten(color, 40));
      grad.addColorStop(1, color);
      cx.fillStyle = grad; cx.beginPath(); cx.arc(S/2, S*0.48, S*0.36, 0, Math.PI*2); cx.fill();
      cx.fillStyle = color;
      cx.beginPath(); cx.ellipse(S*0.32, S*0.22, S*0.12, S*0.18, -0.2, 0, Math.PI*2); cx.fill();
      cx.beginPath(); cx.ellipse(S*0.68, S*0.22, S*0.12, S*0.18, 0.2, 0, Math.PI*2); cx.fill();
    },
    plant: (cx, S, color) => {
      cx.fillStyle = darken(color, 30);
      cx.beginPath();
      cx.moveTo(S*0.35, S*0.75);
      cx.lineTo(S*0.65, S*0.75);
      cx.lineTo(S*0.58, S*0.55);
      cx.lineTo(S*0.42, S*0.55);
      cx.closePath(); cx.fill();
      const grad = cx.createRadialGradient(S/2, S*0.35, S*0.05, S/2, S*0.4, S*0.3);
      grad.addColorStop(0, lighten(color, 50));
      grad.addColorStop(1, color);
      cx.fillStyle = grad; cx.beginPath(); cx.arc(S/2, S*0.38, S*0.3, 0, Math.PI*2); cx.fill();
    },
    undead: (cx, S, color) => {
      cx.fillStyle = color;
      cx.beginPath();
      cx.moveTo(S*0.28, S*0.78);
      for (let i = 0; i <= 6; i++) {
        const x = S*0.28 + i * S*0.44 / 6;
        const y = S*0.78 + (i % 2 === 0 ? 0 : S*0.06);
        cx.lineTo(x, y);
      }
      cx.quadraticCurveTo(S*0.72, S*0.2, S/2, S*0.15);
      cx.quadraticCurveTo(S*0.28, S*0.2, S*0.28, S*0.78);
      cx.fill();
      cx.fillStyle = '#000';
      cx.beginPath(); cx.arc(S*0.4, S*0.4, S*0.05, 0, Math.PI*2); cx.fill();
      cx.beginPath(); cx.arc(S*0.6, S*0.4, S*0.05, 0, Math.PI*2); cx.fill();
    },
    elemental: (cx, S, color) => {
      const grad = cx.createRadialGradient(S/2, S*0.4, S*0.05, S/2, S*0.5, S*0.4);
      grad.addColorStop(0, '#fff');
      grad.addColorStop(0.3, lighten(color, 50));
      grad.addColorStop(1, color);
      cx.fillStyle = grad;
      cx.beginPath();
      cx.moveTo(S/2, S*0.12);
      cx.bezierCurveTo(S*0.85, S*0.3, S*0.75, S*0.8, S/2, S*0.82);
      cx.bezierCurveTo(S*0.25, S*0.8, S*0.15, S*0.3, S/2, S*0.12);
      cx.fill();
    },
    insect: (cx, S, color) => {
      const grad = cx.createRadialGradient(S*0.4, S*0.35, S*0.05, S/2, S*0.5, S*0.35);
      grad.addColorStop(0, lighten(color, 40));
      grad.addColorStop(1, color);
      cx.fillStyle = grad; cx.beginPath(); cx.ellipse(S/2, S*0.48, S*0.32, S*0.28, 0, 0, Math.PI*2); cx.fill();
      cx.strokeStyle = darken(color, 30); cx.lineWidth = 2;
      cx.beginPath(); cx.moveTo(S/2, S*0.22); cx.lineTo(S/2, S*0.72); cx.stroke();
    },
    humanoid: (cx, S, color) => {
      const grad = cx.createRadialGradient(S*0.4, S*0.35, S*0.05, S/2, S*0.5, S*0.35);
      grad.addColorStop(0, lighten(color, 30));
      grad.addColorStop(1, color);
      cx.fillStyle = grad; cx.beginPath(); cx.arc(S/2, S*0.38, S*0.28, 0, Math.PI*2); cx.fill();
      cx.fillStyle = darken(color, 10);
      cx.beginPath(); cx.ellipse(S/2, S*0.68, S*0.22, S*0.18, 0, 0, Math.PI*2); cx.fill();
    },
    mechanical: (cx, S, color) => {
      const grad = cx.createLinearGradient(S*0.25, S*0.25, S*0.75, S*0.75);
      grad.addColorStop(0, lighten(color, 30));
      grad.addColorStop(0.5, color);
      grad.addColorStop(1, darken(color, 20));
      cx.fillStyle = grad;
      drawRoundRect(cx, S*0.25, S*0.2, S*0.5, S*0.6, S*0.1);
      cx.fill();
      cx.fillStyle = darken(color, 30);
      [[0.3, 0.28], [0.7, 0.28], [0.3, 0.72], [0.7, 0.72]].forEach(([rx, ry]) => {
        cx.beginPath(); cx.arc(S*rx, S*ry, S*0.04, 0, Math.PI*2); cx.fill();
      });
    },
    aquatic: (cx, S, color) => {
      const grad = cx.createRadialGradient(S*0.4, S*0.35, S*0.05, S/2, S*0.5, S*0.38);
      grad.addColorStop(0, lighten(color, 50));
      grad.addColorStop(1, color);
      cx.fillStyle = grad; cx.beginPath(); cx.ellipse(S/2, S*0.5, S*0.2, S*0.35, 0, 0, Math.PI*2); cx.fill();
      cx.fillStyle = darken(color, 10);
      cx.beginPath(); cx.moveTo(S*0.5, S*0.2); cx.lineTo(S*0.65, S*0.35); cx.lineTo(S*0.5, S*0.35); cx.fill();
      cx.beginPath(); cx.moveTo(S*0.5, S*0.8); cx.lineTo(S*0.65, S*0.65); cx.lineTo(S*0.5, S*0.65); cx.fill();
    }
  };

  function drawStar(cx, x, y, points, outerR, innerR) {
    cx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const a = (i * Math.PI) / points - Math.PI / 2;
      const px = x + Math.cos(a) * r;
      const py = y + Math.sin(a) * r;
      if (i === 0) cx.moveTo(px, py); else cx.lineTo(px, py);
    }
    cx.closePath(); cx.fill();
  }

  function drawLeaf(cx, x, y, size, angle) {
    cx.save();
    cx.translate(x, y);
    cx.rotate(angle);
    cx.beginPath();
    cx.moveTo(0, -size);
    cx.bezierCurveTo(size*0.6, -size*0.5, size*0.6, size*0.5, 0, size);
    cx.bezierCurveTo(-size*0.6, size*0.5, -size*0.6, -size*0.5, 0, -size);
    cx.fill();
    cx.restore();
  }

  function drawHeart(cx, x, y, size) {
    cx.beginPath();
    cx.moveTo(x, y + size * 0.3);
    cx.bezierCurveTo(x - size, y - size * 0.5, x - size * 0.5, y - size, x, y - size * 0.5);
    cx.bezierCurveTo(x + size * 0.5, y - size, x + size, y - size * 0.5, x, y + size * 0.3);
    cx.fill();
  }

  function drawRoundRect(cx, x, y, w, h, r) {
    cx.beginPath();
    cx.moveTo(x + r, y);
    cx.lineTo(x + w - r, y);
    cx.quadraticCurveTo(x + w, y, x + w, y + r);
    cx.lineTo(x + w, y + h - r);
    cx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    cx.lineTo(x + r, y + h);
    cx.quadraticCurveTo(x, y + h, x, y + h - r);
    cx.lineTo(x, y + r);
    cx.quadraticCurveTo(x, y, x + r, y);
    cx.closePath();
  }

  function lighten(hex, amt) {
    let r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    r = Math.min(255, r + amt); g = Math.min(255, g + amt); b = Math.min(255, b + amt);
    return `rgb(${r},${g},${b})`;
  }

  function darken(hex, amt) {
    let r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    r = Math.max(0, r - amt); g = Math.max(0, g - amt); b = Math.max(0, b - amt);
    return `rgb(${r},${g},${b})`;
  }

  function generateFallbackSprites() {
    Object.entries(GD.TOWERS).forEach(([id, cfg]) => {
      const color = CAT_COLORS[cfg.category] || '#fab1a0';
      const drawer = CATEGORY_DRAWERS[cfg.category] || CATEGORY_DRAWERS.physical;
      IMAGES[id] = makeProceduralSprite(drawer, color, cfg.name, cfg.tier, id);
    });
    Object.entries(GD.MONSTERS).forEach(([id, cfg]) => {
      const color = CAT_COLORS[cfg.cat] || CAT_COLORS[cfg.category] || '#fab1a0';
      const drawer = MONSTER_DRAWERS[cfg.cat] || MONSTER_DRAWERS.beast;
      const tier = cfg.tier || 1;
      const isBoss = cfg.boss;
      IMAGES[id] = makeProceduralSprite(drawer, color, cfg.name, tier, id, isBoss);
    });
    IMAGES['carrot'] = makeProceduralSprite(CATEGORY_DRAWERS.support, '#e17055', '萝卜', 1, 'carrot');
    IMAGES['hero_capi'] = makeProceduralSprite(CATEGORY_DRAWERS.physical, '#fdcb6e', '卡皮', 3, 'hero');
    GD.LEVELS.forEach((lv, i) => {
      IMAGES['bg_' + lv.id] = makeBg(lv, i);
    });
  }

  function makeProceduralSprite(drawer, color, label, tier, id, isBoss) {
    const S = 128;
    const c = document.createElement('canvas'); c.width = S; c.height = S;
    const cx = c.getContext('2d');
    drawer(cx, S, color);
    addKawaiiFace(cx, S, isBoss);
    if (tier >= 2) {
      cx.fillStyle = '#ffd700'; cx.font = `${S*0.12}px sans-serif`; cx.textAlign = 'center';
      const stars = tier >= 3 ? '★★★' : '★★';
      cx.fillText(stars, S/2, S*0.12);
    }
    if (isBoss) {
      cx.fillStyle = '#d63031'; cx.font = `bold ${S*0.1}px sans-serif`;
      cx.fillText('BOSS', S/2, S*0.95);
    }
    return c;
  }

  function addKawaiiFace(cx, S, isBoss) {
    const eyeSize = isBoss ? S*0.07 : S*0.055;
    const eyeY = S*0.42;
    const eyeSpacing = isBoss ? S*0.18 : S*0.14;
    cx.fillStyle = '#2d3436';
    cx.beginPath(); cx.arc(S/2 - eyeSpacing, eyeY, eyeSize, 0, Math.PI*2); cx.fill();
    cx.beginPath(); cx.arc(S/2 + eyeSpacing, eyeY, eyeSize, 0, Math.PI*2); cx.fill();
    cx.fillStyle = '#fff';
    cx.beginPath(); cx.arc(S/2 - eyeSpacing + eyeSize*0.3, eyeY - eyeSize*0.3, eyeSize*0.35, 0, Math.PI*2); cx.fill();
    cx.beginPath(); cx.arc(S/2 + eyeSpacing + eyeSize*0.3, eyeY - eyeSize*0.3, eyeSize*0.35, 0, Math.PI*2); cx.fill();
    cx.fillStyle = 'rgba(255,150,150,0.35)';
    cx.beginPath(); cx.ellipse(S*0.30, S*0.52, S*0.06, S*0.035, 0, 0, Math.PI*2); cx.fill();
    cx.beginPath(); cx.ellipse(S*0.70, S*0.52, S*0.06, S*0.035, 0, 0, Math.PI*2); cx.fill();
    cx.strokeStyle = '#2d3436'; cx.lineWidth = 1.5;
    cx.beginPath();
    cx.arc(S/2, S*0.52, S*0.06, 0.1*Math.PI, 0.9*Math.PI);
    cx.stroke();
  }

  function makeBg(lv, levelIdx) {
    const W = 576, H = 352;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const cx = c.getContext('2d');

    const THEMES = {
      grass: { bg1: '#a8e6a3', bg2: '#7cb86b', path: '#c8956b', pathBorder: '#8b6914', decor: ['#ff9ff3', '#feca57', '#48dbfb'] },
      desert: { bg1: '#f5deb3', bg2: '#e0a857', path: '#d4a574', pathBorder: '#8b6914', decor: ['#ff9f43', '#feca57', '#ff6b6b'] },
      snow: { bg1: '#c8ddf0', bg2: '#a8c8d8', path: '#e8f0f8', pathBorder: '#6c8ebf', decor: ['#74b9ff', '#a29bfe', '#dfe6e9'] },
      volcano: { bg1: '#d4a0a0', bg2: '#a05050', path: '#8b4040', pathBorder: '#4a2020', decor: ['#ff7675', '#fdcb6e', '#e17055'] },
      sky: { bg1: '#b8c8e8', bg2: '#98b8d8', path: '#d8e8f8', pathBorder: '#6c8ebf', decor: ['#a29bfe', '#74b9ff', '#fd79a8'] },
      jungle: { bg1: '#2d5a27', bg2: '#1a3a18', path: '#5a3a20', pathBorder: '#3a2010', decor: ['#00b894', '#55a630', '#a7c957'] },
      underwater: { bg1: '#1a5276', bg2: '#0d3b66', path: '#7fb3d8', pathBorder: '#4a8ab5', decor: ['#81ecec', '#74b9ff', '#a29bfe'] },
      candy: { bg1: '#ff9ff3', bg2: '#f368e0', path: '#feca57', pathBorder: '#e1a81e', decor: ['#ff7675', '#fdcb6e', '#74b9ff'] }
    };
    const theme = THEMES[lv.theme] || THEMES.grass;

    // 第一层：渐变背景
    const bgGrad = cx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, theme.bg1);
    bgGrad.addColorStop(1, theme.bg2);
    cx.fillStyle = bgGrad; cx.fillRect(0, 0, W, H);

    // 第二层：大气效果（光晕、雾气）
    const sunX = W * 0.8, sunY = H * 0.2;
    const sunGlow = cx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 150);
    sunGlow.addColorStop(0, 'rgba(255,255,200,0.3)');
    sunGlow.addColorStop(0.5, 'rgba(255,255,200,0.1)');
    sunGlow.addColorStop(1, 'rgba(255,255,200,0)');
    cx.fillStyle = sunGlow; cx.fillRect(0, 0, W, H);

    // 第三层：网格点阵（微妙的纹理）
    cx.fillStyle = 'rgba(0,0,0,0.03)';
    for (let x = 0; x < W; x += 32) {
      for (let y = 0; y < H; y += 32) {
        cx.beginPath(); cx.arc(x+16, y+16, 1.5, 0, Math.PI*2); cx.fill();
      }
    }

    // 第四层：路径
    if (lv && lv.path) {
      cx.fillStyle = 'rgba(0,0,0,0.15)';
      for (const [pc, pr] of lv.path) {
        cx.fillRect(pc * 32 + 2, pr * 32 + 2, 32, 32);
      }
      const pathGrad = cx.createLinearGradient(0, 0, W, H);
      pathGrad.addColorStop(0, theme.path);
      pathGrad.addColorStop(1, darken(theme.path, 15));
      cx.fillStyle = pathGrad;
      for (const [pc, pr] of lv.path) {
        cx.fillRect(pc * 32, pr * 32, 32, 32);
      }
      cx.strokeStyle = theme.pathBorder; cx.lineWidth = 1;
      for (const [pc, pr] of lv.path) {
        cx.strokeRect(pc * 32 + 0.5, pr * 32 + 0.5, 31, 31);
      }
    }

    // 第五层：装饰元素（散布的形状）
    cx.globalAlpha = 0.12;
    const seed = levelIdx * 13 + 7;
    for (let i = 0; i < 15; i++) {
      const x = ((seed + i * 47) % 17) * 34 + 16;
      const y = ((seed + i * 31) % 10) * 35 + 16;
      const color = theme.decor[i % theme.decor.length];
      const size = 8 + (i % 3) * 4;
      cx.fillStyle = color;
      if (i % 3 === 0) {
        cx.beginPath(); cx.arc(x, y, size, 0, Math.PI*2); cx.fill();
      } else if (i % 3 === 1) {
        cx.beginPath(); cx.ellipse(x, y, size, size*0.6, i*0.5, 0, Math.PI*2); cx.fill();
      } else {
        drawStar(cx, x, y, 5, size, size*0.5);
      }
    }
    cx.globalAlpha = 1;

    // 第六层：空气路径（如果有）
    if (lv && lv.airPath) {
      cx.fillStyle = 'rgba(160, 200, 255, 0.12)';
      for (const [pc, pr] of lv.airPath) {
        cx.fillRect(pc * 32, pr * 32, 32, 32);
      }
      cx.strokeStyle = 'rgba(116, 185, 255, 0.3)';
      cx.setLineDash([4, 4]);
      for (const [pc, pr] of lv.airPath) {
        cx.strokeRect(pc * 32 + 1, pr * 32 + 1, 30, 30);
      }
      cx.setLineDash([]);
    }

    return c;
  }

  function startLevel(id) { setLevel(GD.LEVELS.find(l => l.id === id)); }

  let lastTime = 0;
  function loop(t) {
    const dt = Math.min((t - lastTime) / 1000, 0.05);
    lastTime = t;
    if (state.scene === 'playing') {
      if (!state.paused) { update(dt); updateSkillBar(); }
      render();
    } else if (state.scene === 'menu' || state.scene === 'levelSelect' || state.scene === 'talents') {
      renderBg();
    } else if (state.scene === 'won' || state.scene === 'lost') {
      render();
    }
    requestAnimationFrame(loop);
  }

  return {
    init, startLevel, updateProgress, updateProgressBar,
    state, COLS, ROWS, TILE, W, H, PLAY_W, PLAY_H
  };
})();