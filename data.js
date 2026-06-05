window.GAME_DATA = (function() {
  // ═══════════════════════════════════════════════════════════════════════════════
  // 视觉系统规范 v2.0 - 差异化风格参数
  // ═══════════════════════════════════════════════════════════════════════════════

  // 基础风格参数（所有角色共享）
  const BASE_STYLE = 'high quality illustration, clean lines, no text, transparent background, soft lighting';

  // 塔防类别风格映射
  const TOWER_STYLES = {
    physical: {
      palette: 'warm earth tones, amber and rust accents',
      shape: 'sturdy angular silhouette, defined edges',
      mood: 'reliable defender, battle-worn charm',
      detail: 'metallic sheen on weapons, leather straps, wooden textures'
    },
    magical: {
      palette: 'mystical purples and blues, ethereal glow',
      shape: 'flowing robes, crystalline structures',
      mood: 'arcane wisdom, serene power',
      detail: 'floating runes, magic circles, sparkling particles'
    },
    elemental: {
      palette: 'vibrant element colors, dynamic gradients',
      shape: 'elemental form, organic curves',
      mood: 'raw natural force, untamed energy',
      detail: 'elemental particles, swirling auras, glowing cores'
    },
    nature: {
      palette: 'forest greens and browns, floral accents',
      shape: 'organic shapes, leaf and vine motifs',
      mood: 'gentle guardian, living harmony',
      detail: 'bark textures, leaf details, small flowers'
    },
    support: {
      palette: 'soft pastels, warm yellows and pinks',
      shape: 'friendly rounded forms, welcoming posture',
      mood: 'helpful ally, cheerful presence',
      detail: 'sparkles, hearts, gentle glow'
    },
    dark: {
      palette: 'deep purples and blacks, ghostly whites',
      shape: 'ethereal wispy forms, floating elements',
      mood: 'mysterious watcher, silent power',
      detail: 'mist effects, translucent parts, glowing eyes'
    },
    tech: {
      palette: 'metallic silver and blue, neon accents',
      shape: 'geometric precision, mechanical joints',
      mood: 'advanced technology, efficient design',
      detail: 'circuit patterns, LED indicators, sleek surfaces'
    }
  };

  // 怪物类别风格映射
  const MONSTER_STYLES = {
    slime: {
      palette: 'glossy translucent, vibrant jelly colors',
      shape: 'blobby amorphous, bouncy form',
      mood: 'playful innocent, harmless charm',
      detail: 'glossy highlights, wobble effect, inner bubbles'
    },
    beast: {
      palette: 'natural fur colors, warm browns and grays',
      shape: 'animal-like anatomy, cute proportions',
      mood: 'wild but friendly, curious nature',
      detail: 'fluffy fur texture, expressive ears, wagging tails'
    },
    plant: {
      palette: 'fresh greens, floral pinks and whites',
      shape: 'vegetable forms, leafy appendages',
      mood: 'lively vegetation, growing energy',
      detail: 'leaf veins, petal layers, root details'
    },
    undead: {
      palette: 'pale whites and grays, spectral blues',
      shape: 'floating ethereal, tattered edges',
      mood: 'spooky cute, harmless haunting',
      detail: 'translucent wisps, glowing eyes, floating particles'
    },
    elemental: {
      palette: 'elemental colors, fiery oranges or icy blues',
      shape: 'flame or crystal forms, dynamic shape',
      mood: 'elemental spirit, raw energy',
      detail: 'swirling particles, glowing core, elemental trails'
    },
    insect: {
      palette: 'chitin shells, iridescent highlights',
      shape: 'bug anatomy, multiple tiny legs',
      mood: 'busy worker, determined march',
      detail: 'shell patterns, wing details, antenna'
    },
    humanoid: {
      palette: 'skin tones, clothing colors',
      shape: 'small humanoid, expressive face',
      mood: 'mischievous character, personality',
      detail: 'clothing folds, accessories, facial features'
    },
    mechanical: {
      palette: 'metallic surfaces, painted details',
      shape: 'robotic joints, mechanical parts',
      mood: 'clockwork toy, friendly machine',
      detail: 'gear patterns, rivets, glowing indicators'
    },
    aquatic: {
      palette: 'ocean blues and teals, coral accents',
      shape: 'aquatic forms, flowing fins',
      mood: 'swimming grace, underwater charm',
      detail: 'scales, bubbles, fin membranes'
    }
  };

  // Boss 风格增强
  const BOSS_ENHANCEMENT = {
    palette: 'richer saturated colors, royal accents',
    shape: 'larger imposing, detailed silhouette',
    mood: 'commanding presence, formidable but fair',
    detail: 'ornate decorations, crown or symbols, aura effects, multiple detailed parts'
  };

  // 构建塔防提示词
  function buildTowerPrompt(basePrompt, category, tier) {
    const style = TOWER_STYLES[category] || TOWER_STYLES.physical;
    const tierDetail = tier >= 2 ? 'upgraded enhanced form, more ornate' : '';
    const tierDetail3 = tier >= 3 ? 'legendary ultimate form, majestic aura, glowing runes' : '';

    return `${BASE_STYLE}, ${style.palette}, ${style.shape}, ${style.mood}, ${style.detail}, ${tierDetail} ${tierDetail3}, ${basePrompt}`;
  }

  // 构建怪物提示词
  function buildMonsterPrompt(basePrompt, category, tier, isBoss) {
    const style = MONSTER_STYLES[category] || MONSTER_STYLES.beast;
    const bossStyle = isBoss ? `${BOSS_ENHANCEMENT.palette}, ${BOSS_ENHANCEMENT.shape}, ${BOSS_ENHANCEMENT.mood}, ${BOSS_ENHANCEMENT.detail}` : '';
    const tierSize = tier >= 3 ? 'larger size, more detailed' : tier >= 2 ? 'medium size, moderate detail' : 'small size, simple design';

    return `${BASE_STYLE}, ${style.palette}, ${style.shape}, ${style.mood}, ${style.detail}, ${tierSize}, ${bossStyle}, ${basePrompt}`;
  }

  // 旧版兼容函数（保持 API 不变）
  const PREFIX = 'Cute kawaii chibi cartoon, isolated object, single character, centered, big sparkly eyes, rounded shapes, pastel colors, soft lighting, high quality illustration, clean lines, no text, transparent background, ';
  const BG_PREFIX = 'Top-down cute kawaii chibi cartoon game background, vibrant grass lawn, soft lighting, isometric view, no characters, no path, decorative flowers and bushes, ';

  function T(id, name, nameEn, category, tier, dmg, range, fireRate, cost, special, prompt, t2, t3) {
    // 使用新的视觉系统构建提示词
    const fullPrompt = buildTowerPrompt(prompt, category, tier);
    return { id, name, nameEn, category, tier, dmg, range, fireRate, cost, special, prompt: fullPrompt, upgrade: { T2: t2, T3: t3 } };
  }
  function U(cost, prompt, desc) {
    // 升级提示词保持简洁，在运行时动态添加风格
    return { cost, prompt: PREFIX + prompt, desc };
  }

  const TOWERS = {
    T01: T('T01', '弓箭手', 'Archer', 'physical', 1, 12, 110, 1.0, 50, '单体直击',
      'tiny elf archer with wooden bow and quiver, mint tunic',
      U(80, 'silver archer with shiny bow and aiming scope, focused face', '暴击+15%'),
      U(150, 'golden archer with wind wings and glowing arrows, majestic pose', '穿透2怪')),
    T02: T('T02', '魔法塔', 'Magic Tower', 'magical', 1, 18, 100, 1.4, 75, '小型AoE法术球',
      'tiny wizard girl with pointed hat holding glowing amethyst crystal, lavender robes',
      U(120, 'arcane mage with purple staff and magic circle on ground', 'AoE+30%'),
      U(200, 'grand archmage with star moon robe and rainbow ray beam', '1.5倍溅射')),
    T03: T('T03', '冰冻塔', 'Frost Tower', 'elemental', 1, 8, 110, 0.9, 60, '减速40%持续2s',
      'adorable snowman tower with tiny top hat and snowflake crystal, icy blue white',
      U(100, 'large snowman with ice spike ring and frozen aura', '减速+20% 3s'),
      U(180, 'eternal frost heart tower with floating ice crystals and chill glow', '3%冻结1.5s')),
    T04: T('T04', '加农炮', 'Cannon', 'physical', 1, 35, 140, 2.2, 100, '重型炮击爆破',
      'chubby panda soldier holding round cannonball, bamboo helmet',
      U(150, 'flame cannon with red-hot barrel and ember texture', '点燃3s'),
      U(280, 'nuclear cannon with glowing core and radiation warning symbol', '命中小AoE')),
    T05: T('T05', '火焰塔', 'Flame Tower', 'elemental', 2, 14, 105, 0.6, 130, '持续AoE燃烧',
      'tiny flame spirit with cheerful smile, orange red flame body, apron',
      U(200, 'large flame spirit with glowing apron and ember halo', '燃烧AoE+25%'),
      U(350, 'hellfire pillar with magma base and infernal glow', '额外20dmg/s')),
    T06: T('T06', '雷电塔', 'Lightning Tower', 'elemental', 2, 22, 130, 1.1, 150, '链式闪电跳4目标',
      'tiny purple cloud creature with lightning bolt symbol, fluffy cheerful',
      U(230, 'storm cloud with twin lightning fork and crackle', '链+2衰减减半'),
      U(400, 'storm eye tower with circling thunder clouds and lightning crown', '链上减速30%')),
    T07: T('T07', '猫咪塔', 'Cat Tower', 'physical', 2, 10, 110, 0.7, 90, '弹射反弹3次',
      'calico cat sitting cutely with yarn ball tail, playful smile, pink nose',
      U(150, 'ninja cat with black belt and shuriken, focused face', '反弹+2'),
      U(280, 'nekomata cat with twin tails and will-o-wisp fire', '每3击分裂3支')),
    T08: T('T08', '狐狸塔', 'Fox Tower', 'magical', 2, 16, 125, 1.2, 120, '高暴击9尾',
      'tiny nine-tailed fox with cherry blossom hairpin, fluffy orange white fur',
      U(200, 'spirit fox with sakura staff and glowing aura', '暴击×2'),
      U(380, 'kyuubi no kitsune with full nine tails spread and fox fire', '暴击释妖火AoE')),
    T09: T('T09', '熊猫塔', 'Panda Tower', 'support', 2, 8, 100, 1.5, 110, '吃怪回血',
      'round chubby panda holding bamboo bowl, black white kawaii, blushing cheeks',
      U(180, 'kungfu panda with martial arts belt and chopsticks', '吃boss+20%'),
      U(320, 'master chef panda with golden bowl and radiant glow', '吃后5s攻速+50%')),
    T10: T('T10', '猫头鹰塔', 'Owl Tower', 'dark', 2, 28, 150, 1.6, 160, '远距狙击+夜怪+50%',
      'small purple owl wearing graduation cap, big round glasses, night theme',
      U(260, 'nocturnal scholar owl with bigger round glasses and starlight', '暴击+25%'),
      U(450, 'omniscient owl with third eye and full vision halo', '穿透全路径')),
    T11: T('T11', '仓鼠塔', 'Hamster Tower', 'physical', 1, 9, 95, 0.8, 40, '廉价快攻',
      'golden hamster with stuffed cheeks full of sunflower seeds, pink paws',
      U(70, 'fat hamster with double cheeks and seed pile', 'HP+50%'),
      U(130, 'hamster wheel tower with multi gun barrels', '邻格也射')),
    T12: T('T12', '树懒塔', 'Sloth Tower', 'nature', 2, 6, 90, 2.0, 70, 'AoE黏液减速50%',
      'sleepy sloth hugging tree branch yawning, brown green tones, lazy smile',
      U(120, 'lazy sloth in sleeping bag with drool bubble', '减速+2s'),
      U(220, 'ancient sloth with moss crown and ancient tree', '黏液地持续伤')),
    T13: T('T13', '樱花塔', 'Sakura Tower', 'support', 2, 5, 110, 1.3, 95, '治愈邻塔2HP/s',
      'cherry blossom fairy with pink petals, white pink kimono, gentle smile',
      U(160, 'sakura tree tower with petal ring floating around', '治愈半径×1.5'),
      U(300, 'spring goddess with green vine halo and bloom aura', '+10%攻速光环')),
    T14: T('T14', '蘑菇塔', 'Mushroom Tower', 'nature', 2, 11, 105, 1.0, 85, '毒伤持续5s',
      'purple amanita mushroom imp blowing poison bubbles, red spots, mischievous',
      U(150, 'large amanita king with poison gas cloud', '叠3层毒'),
      U(280, 'spore explosion mushroom with green light cloud', '死爆毒AoE')),
    T15: T('T15', '仙人掌塔', 'Cactus Tower', 'nature', 2, 24, 135, 1.8, 105, '远程刺弹减速30%',
      'round cute cactus with pink flower on top, smiling face, green pink',
      U(180, 'giant cactus with three-pronged spike launcher', '刺弹分3'),
      U(320, 'desert thorn king with sandstorm base', '穿透全路径')),
    T16: T('T16', '向日葵塔', 'Sunflower Tower', 'support', 2, 0, 0, 5.0, 80, '每5s产25g阳光',
      'big smiling sunflower with bright yellow petals, brown face, sun rays glowing',
      U(130, 'double-headed sunflower with golden pollen dust', '产速3s'),
      U(240, 'sun god flower with sun disc and radiant crown', '邻3格攻速+15%')),
    T17: T('T17', '竹子塔', 'Bamboo Tower', 'nature', 2, 13, 120, 0.9, 100, '穿透4目标',
      'tiny red panda hugging green bamboo, throwing leaf dart',
      U(170, 'sword bamboo with sharpened leaf tip', '贯穿伤不减'),
      U(320, 'bamboo forest tower with spike trap aura', '留竹刺陷阱3s')),
    T18: T('T18', '蛋糕塔', 'Cupcake Tower', 'magical', 2, 12, 110, 1.2, 110, '每10s召糖霜小弟',
      'cute cupcake with swirled cream frosting and cherry on top, sprinkles face, pink wrapper',
      U(190, 'three-layer cake with candles and frosting crown', '小弟+1血2倍'),
      U(360, 'wedding cake with sugar flowers and decorative halo', '小弟光环+30%攻速')),
    T19: T('T19', '甜甜圈塔', 'Donut Tower', 'support', 3, 20, 150, 1.4, 250, '环震波外推怪',
      'rainbow sprinkled donut with happy face in middle hole, pink frosting',
      U(400, 'frosted donut with sharp frosting spikes', '环波减速50%'),
      U(700, 'cosmic donut with rainbow ring and stardust', '环波穿透叠3')),
    T20: T('T20', '寿司塔', 'Sushi Tower', 'physical', 2, 15, 115, 1.0, 115, '15%晕1s',
      'cute salmon nigiri sushi with rice ball smiling, salmon slice, wasabi dot',
      U(190, 'sushi chef with apron and kitchen knife', '晕眩30%'),
      U(360, 'master sushi chef with golden trim and tall hat', '晕后1.5×伤')),
    T21: T('T21', '糖果塔', 'Candy Tower', 'magical', 2, 14, 125, 1.1, 125, '吸引糖力拉怪50px',
      'swirly pink blue lollipop with happy face, sparkly sugar crystals',
      U(200, 'candy net tower with shimmering sugar threads', '拉力翻倍'),
      U(380, 'candy queen tower with crown and candy light', '圈内+20%伤')),
    T22: T('T22', '奶茶塔', 'Bubble Tea Tower', 'support', 2, 10, 110, 1.0, 100, '珍珠反弹2次',
      'kawaii bubble tea cup with smiley face and cheese foam, tapioca pearls',
      U(170, 'thick milk foam bubble tea with extra pearls', '弹跳+2'),
      U(320, 'bubble tea doctor with glasses and test tubes', '留奶盖减速带')),
    T23: T('T23', '水晶塔', 'Crystal Tower', 'magical', 3, 25, 140, 1.3, 280, '棱镜7道细光',
      'giant magical prism crystal with rainbow refraction, inner light, floating on tiny cloud',
      U(450, 'perfect prism with enhanced rainbow beams', '光束+30%'),
      U(800, 'genesis crystal with nebula inside and star beams', '光束命中爆')),
    T24: T('T24', '巫师塔', 'Wizard Tower', 'magical', 3, 30, 130, 2.0, 320, '3%把怪变鸡3s',
      'old wizard with long white beard and starry night hat, gnarled staff with glowing orb',
      U(500, 'grand transmuter with double staff and swirling beard', '变鸡8%'),
      U(900, 'chaos wizard with golden eye and tattered cape', '变鸡+200%伤')),
    T25: T('T25', '幽灵塔', 'Ghost Tower', 'dark', 3, 20, 120, 1.5, 260, '无视护甲',
      'tiny translucent ghost with sparkly blue white glow, big cute eyes, arms outstretched',
      U(420, 'vengeful spirit with mist swirl and red eye', '减速40% 3s'),
      U(750, 'grim reaper with scythe halo and death aura', '击杀回10%HP')),
    T26: T('T26', '龙塔', 'Dragon Tower', 'elemental', 3, 40, 160, 2.5, 400, '龙息AoE锥形',
      'chubby baby dragon with tiny wings and cute horn, mint green scales, fire breath pose',
      U(650, 'fire dragon with red scales and flame breath', '点燃5s'),
      U(1200, 'ancient dragon with golden horn and eternal flame', '持续灼烧穿透')),
    T27: T('T27', '凤凰塔', 'Phoenix Tower', 'elemental', 3, 35, 145, 1.8, 380, '浴火重生',
      'baby phoenix with golden red flame feathers, long flowing tail, rebirth halo',
      U(620, 'blazing phoenix with twin wings and flame aura', '复活×2'),
      U(1100, 'undying phoenix with eternal flame and rebirth ring', '复活释360°火环')),
    T28: T('T28', '机器人塔', 'Robot Tower', 'tech', 3, 26, 135, 0.8, 350, '激光束26/s',
      'round headed kawaii robot with glowing laser eyes, antenna with heart, silver blue',
      U(550, 'battle robot with shoulder cannons and armor plates', '激光+1'),
      U(1000, 'mech core with halo and energy field', '灼烧地4s')),
    T29: T('T29', '卫星塔', 'Satellite Tower', 'tech', 3, 50, 320, 4.0, 380, '轨道炮击全图',
      'kawaii satellite with heart solar panels, cute antenna ears, floating in space',
      U(620, 'GPS satellite with three smaller satellites orbiting', '3卫协同'),
      U(1100, 'satellite matrix with laser pillars and orbital halo', '激光雨AoE')),
    T30: T('T30', '无人机塔', 'Drone Tower', 'tech', 3, 8, 100, 0.5, 320, '部署2架巡逻小机',
      'tiny quadcopter drone with propeller ears and smiling screen face, white red',
      U(520, 'armed drone with machine gun and camouflage paint', '小机+50%'),
      U(950, 'swarm commander with 4 drones and laser pointer', '4小机+激光')),
  };

  const MON_PREFIX = 'Cute kawaii chibi cartoon, isolated character, single creature, centered, big sparkly eyes, rounded shapes, pastel colors, soft lighting, high quality illustration, clean lines, no text, transparent background, ';

  function M(id, name, cat, hp, speed, armor, gold, tier, behavior, ability, prompt, opts) {
    // 使用新的视觉系统构建提示词
    const isBoss = opts && opts.boss;
    const fullPrompt = buildMonsterPrompt(prompt, cat, tier, isBoss);
    return Object.assign({ id, name, cat, hp, speed, armor, gold, tier, behavior, ability, prompt: fullPrompt }, opts || {});
  }

  const MONSTERS = {
    slime_01: M('slime_01', '史莱姆', 'slime', 20, 60, 0, 3, 1, 'walk', '死亡分裂2 mini', 'a smiling green jelly slime with a small leaf on top, glossy translucent body', { split: { id: 'mini_slime', count: 2, hp: 8 } }),
    beast_01: M('beast_01', '树懒', 'beast', 35, 28, 0, 4, 1, 'walk', '极慢受击加速', 'a sleepy kawaii sloth hugging a tiny branch, half-closed eyes, soft beige fur'),
    slime_02: M('slime_02', '甜甜圈怪', 'slime', 25, 65, 0, 4, 1, 'walk', '前3击免伤', 'a cute living donut with pink frosting and rainbow sprinkles, tiny legs, smiling'),
    plant_01: M('plant_01', '行走蘑菇', 'plant', 30, 50, 0, 5, 1, 'walk', '死放3孢子', 'an adorable red-cap mushroom with big eyes on the cap, stubby legs, bouncing', { split: { id: 'mini_spore', count: 3, hp: 8 } }),
    beast_02: M('beast_02', '小青蛙', 'beast', 22, 70, 0, 4, 1, 'jump', '每3s跳1格', 'a chubby bright green kawaii frog with bulging round eyes and a tiny gold crown'),
    undead_01: M('undead_01', '小幽灵', 'undead', 18, 75, 0, 5, 1, 'fly', '50%闪避', 'a tiny translucent white ghost holding a pink heart, blushing cheeks, floating', { flying: true }),
    plant_02: M('plant_02', '草莓怪', 'plant', 28, 50, 0, 5, 1, 'walk', '死裂2草莓籽', 'a cute anthropomorphic strawberry with leaf hat, tiny arms crossed, blushing', { split: { id: 'mini_seed', count: 2, hp: 12 } }),
    insect_01: M('insect_01', '瓢虫', 'insect', 26, 65, 2, 6, 1, 'walk', '甲壳护2+减速地', 'a round kawaii ladybug with a tiny backpack, big shiny eyes, soft red shell'),
    beast_03: M('beast_03', '小蝙蝠', 'beast', 55, 90, 1, 10, 2, 'fly', '飞行+全场1.2x', 'a fluffy purple kawaii bat with pink wings, sticking out tiny tongue, sparkly eyes', { flying: true }),
    humanoid_01: M('humanoid_01', '哥布林', 'humanoid', 60, 70, 0, 12, 2, 'walk', '致命伤丢钱袋+8g', 'a tiny green goblin with a money pouch, mischievous grin, big ears'),
    beast_04: M('beast_04', '企鹅', 'beast', 70, 80, 0, 11, 2, 'slide', '冰面+50%速', 'an adorable baby penguin sliding on ice, red scarf, waddling cheerfully'),
    plant_03: M('plant_03', '食人花', 'plant', 80, 45, 3, 13, 2, 'walk', '吃子弹回血30', 'a pink potted chomper plant with a wide open cute mouth, heart-shaped teeth'),
    slime_03: M('slime_03', '冰激凌', 'slime', 65, 55, 0, 12, 2, 'walk', '死分3小球', 'a three-scoop kawaii ice cream cone with a smiling cherry on top, melting slightly', { split: { id: 'mini_scoop', count: 3, hp: 20 } }),
    undead_02: M('undead_02', '木乃伊', 'undead', 75, 50, 4, 14, 2, 'walk', '绷带脱层加速', 'a kawaii mummy wrapped in soft white bandages, big teary eyes peeking out'),
    elemental_01: M('elemental_01', '火焰小精灵', 'elemental', 60, 75, 0, 13, 2, 'walk', '灼烧周围塔1HP/s', 'a tiny orange flame spirit wearing oven mitts, smiling warmly, soft glow', { fireRes: 0.8 }),
    beast_05: M('beast_05', '刺猬', 'beast', 85, 50, 6, 14, 2, 'walk', '尖刺反伤5', 'a chubby kawaii hedgehog with a tiny apple on its back, soft brown spines'),
    insect_02: M('insect_02', '蜜蜂', 'insect', 50, 100, 0, 14, 2, 'fly', '飞+撒蜜糖+攻速', 'a chubby fluffy kawaii bee carrying a tiny pollen basket, buzzing happily', { flying: true }),
    food_01: M('food_01', '寿司怪', 'aquatic', 70, 60, 0, 15, 2, 'walk', '波首只+20HP', 'a cute anthropomorphic nigiri sushi with a smiling salmon slice on rice'),
    mechanical_01: M('mechanical_01', '玩具机器人', 'mechanical', 90, 45, 5, 16, 2, 'walk', '发条提速30%', 'a vintage wind-up tin toy robot with a heart on chest, big round eyes, pastel teal'),
    aquatic_01: M('aquatic_01', '海马', 'aquatic', 55, 85, 0, 18, 2, 'fly', '飞低+3只盐雾腐', 'a tiny pastel yellow seahorse with a starfish hat, curly tail, smiling face', { flying: true }),
    beast_06: M('beast_06', '喷火小龙', 'beast', 220, 70, 3, 30, 3, 'fly', '飞+4s喷火球', 'a chubby pastel green baby dragon flapping tiny wings, pink smoke from nostrils', { flying: true, fireRes: 0.5 }),
    undead_03: M('undead_03', '小吸血鬼', 'undead', 180, 75, 2, 32, 3, 'walk', '吸塔5HP+隐身', 'an adorable baby vampire in a tiny top hat holding a milk bottle, cute fangs'),
    elemental_02: M('elemental_02', '雷电云朵', 'elemental', 200, 65, 0, 35, 3, 'fly', '飞+5s随机劈塔', 'a fluffy pastel purple thunder cloud with lightning bolt earrings, smiling face', { flying: true, elecRes: 0.8 }),
    plant_04: M('plant_04', '向日葵战士', 'plant', 260, 45, 4, 34, 3, 'walk', '叶盾吸60+治愈友军', 'a kawaii sunflower warrior wearing a tiny helmet, holding a leaf shield'),
    mechanical_02: M('mechanical_02', '齿轮魔像', 'mechanical', 300, 35, 8, 40, 3, 'walk', '正面无敌+死后震晕', 'a cute steampunk gear golem made of brass cogs, big clock on chest, friendly smile'),
    humanoid_02: M('humanoid_02', '食人魔Boss', 'humanoid', 1200, 40, 6, 150, 4, 'boss', 'HP<30%撒币逃跑', 'a chubby pastel green ogre wearing a bib, hugging a tiny carrot, big goofy smile', { boss: true }),
    beast_07: M('beast_07', '巨型小恐龙', 'beast', 1500, 50, 4, 180, 4, 'boss', '召baby_dino+跺脚晕', 'a chubby kawaii T-rex with pink spots, tiny short arms waving a flower, sparkly eyes', { boss: true }),
    slime_04: M('slime_04', '巨型汉堡王', 'slime', 900, 30, 3, 200, 4, 'boss', '越打越小+冲撞', 'a giant kawaii double cheeseburger with a sesame seed smiley face, juicy tomato', { boss: true }),
    mini_slime: M('mini_slime', '小史莱姆', 'slime', 8, 70, 0, 1, 1, 'walk', '子怪', 'a tiny mini green jelly slime, glossy translucent', { mini: true }),
    mini_spore: M('mini_spore', '小孢子', 'plant', 8, 60, 0, 1, 1, 'walk', '子怪', 'a tiny floating green spore with eyes', { mini: true }),
    mini_seed: M('mini_seed', '草莓籽', 'plant', 12, 55, 0, 2, 1, 'walk', '子怪', 'a tiny pink seed with cute eyes', { mini: true }),
    mini_scoop: M('mini_scoop', '小冰激凌', 'slime', 20, 60, 0, 4, 1, 'walk', '子怪', 'a tiny single-scoop ice cream with smile', { mini: true }),
  };

  function pathOf(arr) {
    const out = [];
    for (let i = 0; i < arr.length; i++) {
      const [c, r] = arr[i];
      if (i === 0) out.push([c, r]);
      else {
        const [pc, pr] = arr[i-1];
        if (pc === c) {
          const step = r > pr ? 1 : -1;
          for (let y = pr + step; y !== r + step; y += step) out.push([c, y]);
        } else if (pr === r) {
          const step = c > pc ? 1 : -1;
          for (let x = pc + step; x !== c + step; x += step) out.push([x, r]);
        } else out.push([c, r]);
      }
    }
    return out;
  }

  function lineH(c1, c2, r) { const out = []; for (let c = c1; c <= c2; c++) out.push([c, r]); return out; }
  function lineV(r1, r2, c) { const out = []; for (let r = r1; r <= r2; r++) out.push([c, r]); return out; }

  const L1 = pathOf([
    ...lineH(0, 8, 5),
    [8, 4], [8, 3], [8, 2], [8, 1],
    ...lineH(9, 17, 1),
  ]);
  const L2 = pathOf([
    ...lineH(0, 4, 3),
    [4, 4], [4, 5], [4, 6], [4, 7],
    ...lineH(5, 8, 7),
    [8, 6], [8, 5],
    ...lineH(9, 17, 5),
  ]);
  const L3 = pathOf([
    [0, 9], [1, 9], [2, 9],
    ...lineV(8, 5, 2),
    ...lineH(3, 5, 5),
    ...lineV(4, 1, 5),
    ...lineH(6, 9, 1),
    ...lineV(2, 4, 9),
    ...lineH(10, 12, 4),
    ...lineV(5, 7, 12),
    ...lineH(13, 15, 7),
    ...lineV(8, 9, 15),
    [16, 9], [17, 9],
  ]);
  const L4 = pathOf([
    ...lineH(0, 4, 5),
    ...lineV(6, 8, 4),
    ...lineH(5, 8, 8),
    [8, 7], [8, 6],
    ...lineH(9, 11, 6),
    ...lineV(7, 8, 11),
    ...lineH(12, 14, 8),
    [14, 7],
    ...lineH(15, 17, 7),
  ]);
  const L5 = pathOf([
    ...lineH(0, 2, 9),
    [2, 8], [2, 7],
    ...lineH(3, 14, 7),
    [14, 8], [14, 9],
    ...lineH(15, 17, 9),
  ]);
  const L5_AIR = pathOf([...lineH(0, 17, 2)]);

  function lvl(id, name, theme, path, bgPrompt, bg1, bg2, towers, heroAvail, lives, gold, waves, stars, airPath) {
    return { id, name, theme, path, bgPrompt: BG_PREFIX + bgPrompt, bgColor1: bg1, bgColor2: bg2, allowedTowers: towers, heroAvailable: heroAvail, startLives: lives, startGold: gold, waves, stars, airPath: airPath || null };
  }

  function w(mon, count, interval) { return { monsters: [{ id: mon, count, interval }], boss: false }; }
  function wb(mon, count, interval) { return { monsters: [{ id: mon, count, interval }], boss: true }; }

  const LEVELS = [
    lvl(1, '萝卜的故乡', 'grass', L1, 'sunny green meadow with pink sunset and curving river', '#9adb88', '#7cb86b', ['T01','T02','T03','T11','T13','T16'], true, 20, 150, [
      w('slime_01', 8, 1000),
      w('slime_01', 6, 900), { monsters: [{ id: 'slime_01', count: 6, interval: 900 }, { id: 'slime_02', count: 3, interval: 900 }], boss: false },
      { monsters: [{ id: 'slime_01', count: 4, interval: 800 }, { id: 'plant_01', count: 3, interval: 800 }, { id: 'beast_02', count: 2, interval: 800 }], boss: false },
      { monsters: [{ id: 'slime_01', count: 6, interval: 700 }, { id: 'insect_01', count: 4, interval: 700 }, { id: 'slime_02', count: 3, interval: 700 }], boss: false },
      { monsters: [{ id: 'slime_01', count: 8, interval: 600 }, { id: 'beast_03', count: 4, interval: 600 }, { id: 'plant_02', count: 3, interval: 600 }], boss: false },
      { monsters: [{ id: 'slime_01', count: 10, interval: 500 }, { id: 'beast_03', count: 6, interval: 500 }, { id: 'plant_04', count: 2, interval: 500 }], boss: false },
    ], { complete: 0, noLeak: 18, speed: 240 }),
    lvl(2, '沙漠商路', 'desert', L2, 'golden sand dunes with cactus groups and heat waves', '#f4d27a', '#e0a857', ['T03','T11','T14','T15','T17'], true, 15, 130, [
      { monsters: [{ id: 'slime_02', count: 5, interval: 900 }, { id: 'beast_01', count: 4, interval: 900 }], boss: false },
      { monsters: [{ id: 'slime_02', count: 8, interval: 800 }, { id: 'insect_01', count: 4, interval: 800 }], boss: false },
      { monsters: [{ id: 'slime_02', count: 6, interval: 700 }, { id: 'beast_01', count: 4, interval: 700 }, { id: 'plant_03', count: 2, interval: 700 }], boss: false },
      { monsters: [{ id: 'slime_02', count: 10, interval: 600 }, { id: 'beast_05', count: 3, interval: 600 }, { id: 'humanoid_01', count: 2, interval: 600 }], boss: false },
      { monsters: [{ id: 'beast_05', count: 6, interval: 600 }, { id: 'plant_03', count: 4, interval: 600 }, { id: 'beast_04', count: 3, interval: 600 }], boss: false },
      { monsters: [{ id: 'humanoid_01', count: 8, interval: 500 }, { id: 'beast_05', count: 5, interval: 500 }, { id: 'plant_04', count: 2, interval: 500 }], boss: false },
    ], { complete: 0, noLeak: 13, speed: 300 }),
    lvl(3, '雪山驿站', 'snow', L3, 'snowy pine trees with frozen lake and three-layer highland platforms', '#dff1ff', '#a8d4f0', ['T03','T04','T10','T17','T22'], true, 15, 180, [
      { monsters: [{ id: 'slime_03', count: 6, interval: 800 }, { id: 'beast_04', count: 3, interval: 800 }], boss: false },
      { monsters: [{ id: 'beast_04', count: 8, interval: 700 }, { id: 'slime_03', count: 4, interval: 700 }], boss: false },
      { monsters: [{ id: 'beast_04', count: 6, interval: 600 }, { id: 'undead_01', count: 4, interval: 600 }, { id: 'slime_03', count: 3, interval: 600 }], boss: false },
      { monsters: [{ id: 'beast_04', count: 10, interval: 500 }, { id: 'undead_01', count: 4, interval: 500 }, { id: 'mechanical_01', count: 2, interval: 500 }], boss: false },
      { monsters: [{ id: 'beast_04', count: 8, interval: 500 }, { id: 'undead_02', count: 4, interval: 500 }, { id: 'beast_03', count: 4, interval: 500 }], boss: false },
      { monsters: [{ id: 'mechanical_01', count: 4, interval: 400 }, { id: 'beast_04', count: 12, interval: 400 }, { id: 'undead_02', count: 4, interval: 400 }], boss: false },
    ], { complete: 0, noLeak: 13, speed: 300 }),
    lvl(4, '火山熔岩', 'volcano', L4, 'dark red volcano rock with lava river and steam vents', '#5a3a30', '#a04030', ['T04','T05','T06','T10','T25','T26'], true, 20, 200, [
      { monsters: [{ id: 'elemental_01', count: 6, interval: 800 }, { id: 'slime_01', count: 4, interval: 800 }], boss: false },
      { monsters: [{ id: 'elemental_01', count: 8, interval: 700 }, { id: 'plant_01', count: 4, interval: 700 }], boss: false },
      { monsters: [{ id: 'elemental_01', count: 6, interval: 600 }, { id: 'humanoid_01', count: 4, interval: 600 }, { id: 'beast_05', count: 3, interval: 600 }], boss: false },
      { monsters: [{ id: 'elemental_01', count: 10, interval: 500 }, { id: 'elemental_02', count: 3, interval: 500 }, { id: 'undead_02', count: 4, interval: 500 }], boss: false },
      { monsters: [{ id: 'elemental_02', count: 4, interval: 600 }, { id: 'mechanical_01', count: 4, interval: 600 }, { id: 'plant_04', count: 2, interval: 600 }], boss: false },
      { monsters: [{ id: 'elemental_02', count: 6, interval: 500 }, { id: 'mechanical_02', count: 3, interval: 500 }, { id: 'beast_06', count: 2, interval: 500 }], boss: false },
      { monsters: [{ id: 'humanoid_02', count: 1, interval: 0 }, { id: 'elemental_01', count: 8, interval: 400 }, { id: 'beast_06', count: 4, interval: 400 }], boss: true },
    ], { complete: 0, noLeak: 16, speed: 360 }),
    lvl(5, '浮空岛', 'sky', L5, 'rainbow sea of clouds with floating stone islands and breakable rainbow bridges', '#a0c8ff', '#ffd6e0', ['T02','T05','T06','T10','T25','T29'], true, 20, 220, [
      { monsters: [{ id: 'beast_03', count: 6, interval: 800 }, { id: 'slime_01', count: 4, interval: 800 }], boss: false },
      { monsters: [{ id: 'beast_03', count: 8, interval: 700 }, { id: 'insect_02', count: 4, interval: 700 }, { id: 'plant_02', count: 3, interval: 700 }], boss: false },
      { monsters: [{ id: 'beast_03', count: 6, interval: 600 }, { id: 'insect_02', count: 4, interval: 600 }, { id: 'beast_06', count: 2, interval: 600 }], boss: false },
      { monsters: [{ id: 'insect_02', count: 8, interval: 500 }, { id: 'beast_03', count: 6, interval: 500 }, { id: 'aquatic_01', count: 3, interval: 500 }], boss: false },
      { monsters: [{ id: 'beast_06', count: 4, interval: 500 }, { id: 'elemental_02', count: 4, interval: 500 }, { id: 'undead_03', count: 3, interval: 500 }], boss: false },
      { monsters: [{ id: 'beast_06', count: 4, interval: 500 }, { id: 'elemental_02', count: 4, interval: 500 }, { id: 'mechanical_02', count: 2, interval: 500 }], boss: false },
      { monsters: [{ id: 'beast_07', count: 1, interval: 0 }, { id: 'beast_06', count: 6, interval: 400 }, { id: 'elemental_02', count: 4, interval: 400 }], boss: true },
    ], { complete: 0, noLeak: 16, speed: 420 }, L5_AIR),
  ];

  const HERO = {
    id: 'hero_capi',
    name: '卡皮·萝卜队长',
    nameEn: 'Capi Carrot Captain',
    prompt: MON_PREFIX + 'cute kawaii chibi cartoon carrot knight hero character, tiny leaf helmet with white polka dots, stubby carrot sword, blushing pink cheeks, big sparkly eyes, white-and-green chibi armor, cape with radish emblem, full body, cheerful battle pose',
    skills: [
      { id: 's1', name: '胡萝卜冲锋', icon: '🥕', cd: 12, key: 'Q', desc: '向前200px冲刺,击退80+晕1s' },
      { id: 's2', name: '治愈雨', icon: '💚', cd: 25, key: 'W', desc: '友军+30%攻速+回血20,5s' },
      { id: 's3', name: '萝卜斩', icon: '⚔️', cd: 18, key: 'E', desc: '600px锥形100伤+击飞50' },
    ],
    passive: { name: '领袖光环', desc: '200px友军塔+10%攻速' },
    range: 200,
    baseAtk: 25,
    baseHp: 100,
  };

  const TALENTS = [
    { id: 't_gold', name: '财运亨通', desc: '初始金币+20', icon: '🪙', unlockLevel: 1, apply: (s) => { s.startGold += 20; } },
    { id: 't_speed', name: '战鼓激昂', desc: '所有塔攻速+5%', icon: '🥁', unlockLevel: 2, apply: (s) => { s.globalFireRateMul = (s.globalFireRateMul || 1) * 1.05; } },
    { id: 't_hp', name: '强身健体', desc: '出格塔(熊猫/向日葵/巫师/凤凰)+1HP', icon: '💪', unlockLevel: 3, apply: (s) => { s.outOfGridHpBonus = (s.outOfGridHpBonus || 0) + 1; } },
    { id: 't_greed', name: '贪婪之手', desc: '击杀金币+1', icon: '💰', unlockLevel: 4, apply: (s) => { s.goldBonusPerKill = (s.goldBonusPerKill || 0) + 1; } },
    { id: 't_hero', name: '英灵之力', desc: '英雄技能CD-15%', icon: '🌟', unlockLevel: 5, apply: (s) => { s.heroCdMul = (s.heroCdMul || 1) * 0.85; } },
  ];

  const CARROT_PROMPT = MON_PREFIX + 'cute kawaii chibi cartoon carrot character, big smile, blushing pink cheeks, small green leaf hat with white polka dots, stubby arms, happy expression, anthropomorphic vegetable, full body';

  const BG_PROMPTS = {};
  LEVELS.forEach(l => { BG_PROMPTS['bg_' + l.id] = l.bgPrompt; });

  return { TOWERS, MONSTERS, LEVELS, HERO, TALENTS, CARROT_PROMPT, BG_PROMPTS, PREFIX, MON_PREFIX, BG_PREFIX };
})();
