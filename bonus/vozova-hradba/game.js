// Arkádová pravidla bonusu. Názvy, ceny a role obránců vycházejí z hlavní hry;
// čas, zásahy a vlny jsou samostatná tower defense abstrakce.
const WagonDefense = (() => {
    const VERSION = '9';
    const COLS = 7;
    const ROWS = 11;
    const START_GOLD = 170;
    const START_CAMP = 20;
    const EARLY_BONUS = 16;
    // Flat-top, odd-q: stejná orientace a hexová vzdálenost jako HexGrid
    // hlavní hry. Jedna světová jednotka je vzdálenost sousedních středů.
    const HEX_RADIUS = 1 / Math.sqrt(3);
    const COL_STEP = Math.sqrt(3) / 2;
    const MARGIN = 0.08;
    const MAP_WIDTH = (COLS - 1) * COL_STEP + 2 * HEX_RADIUS + 2 * MARGIN;
    const MAP_HEIGHT = ROWS + 0.5 + 2 * MARGIN;

    function inBounds(col, row) {
        return Number.isInteger(col) && Number.isInteger(row)
            && col >= 0 && col < COLS && row >= 0 && row < ROWS;
    }

    function hexCenter(col, row) {
        return { x: MARGIN + HEX_RADIUS + col * COL_STEP,
            y: MARGIN + 0.5 + row + (col & 1) * 0.5 };
    }

    function cube(col, row) {
        const z = row - (col - (col & 1)) / 2;
        return { x: col, y: -col - z, z };
    }

    function hexDistance(a, b) {
        if (!a || !b) return Infinity;
        const u = cube(a.col, a.row), v = cube(b.col, b.row);
        return Math.max(Math.abs(u.x - v.x), Math.abs(u.y - v.y), Math.abs(u.z - v.z));
    }

    function hexAt(x, y) {
        if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
        const q = (x - MARGIN - HEX_RADIUS) / COL_STEP;
        const r = y - MARGIN - 0.5 - q / 2;
        const s = -q - r;
        let rq = Math.round(q), rr = Math.round(r), rs = Math.round(s);
        const dq = Math.abs(rq - q), dr = Math.abs(rr - r), ds = Math.abs(rs - s);
        if (dq > dr && dq > ds) rq = -rr - rs;
        else if (dr > ds) rr = -rq - rs;
        const col = rq, row = rr + (rq - (rq & 1)) / 2;
        return inBounds(col, row) ? { col, row } : null;
    }

    const HEXES = [];
    for (let col = 0; col < COLS; col++) for (let row = 0; row < ROWS; row++) {
        HEXES.push(Object.freeze({ col, row, ...hexCenter(col, row) }));
    }
    Object.freeze(HEXES);

    function hexesInRange(col, row, range) {
        return HEXES.filter(hex => hexDistance({ col, row }, hex) <= range);
    }

    const WAYPOINTS = [[1, 0], [1, 2], [5, 2], [5, 5], [1, 5], [1, 8], [4, 8], [4, 10]];
    const ROUTE = [];
    const BLOCKED = new Set(['0,0', '5,10', '6,10']);
    const PATH_CELLS = new Set();
    for (let index = 0; index < WAYPOINTS.length - 1; index++) {
        const [fromCol, fromRow] = WAYPOINTS[index];
        const [toCol, toRow] = WAYPOINTS[index + 1];
        const dc = Math.sign(toCol - fromCol);
        const dr = Math.sign(toRow - fromRow);
        let col = fromCol;
        let row = fromRow;
        while (true) {
            const key = col + ',' + row;
            if (!PATH_CELLS.has(key)) {
                PATH_CELLS.add(key);
                ROUTE.push({ col, row, ...hexCenter(col, row) });
            }
            if (col === toCol && row === toRow) break;
            col += dc;
            row += dr;
        }
    }
    const HILLS = new Set(['3,0', '6,6', '2,9']);
    const BARRICADE_COST = 25;
    // Two authored forks keep the whole route legible. Both branches are
    // reserved road, so a unit can never accidentally seal a future detour.
    const BARRICADES = Object.freeze({
        east: { id: 'east', mark: 'I', col: 5, row: 3, from: [5, 2], to: [5, 5],
            detour: [[6, 2], [6, 3], [6, 4], [6, 5]] },
        west: { id: 'west', mark: 'II', col: 1, row: 6, from: [1, 5], to: [1, 8],
            detour: [[0, 6], [0, 7], [0, 8], [0, 9]] }
    });
    for (const gate of Object.values(BARRICADES)) {
        for (const [col, row] of gate.detour) PATH_CELLS.add(col + ',' + row);
    }
    const ROAD_HEXES = HEXES.filter(hex => PATH_CELLS.has(hex.col + ',' + hex.row));

    function routeWithBarricades(closed) {
        const route = [];
        for (let index = 0; index < ROUTE.length; index++) {
            const hex = ROUTE[index];
            route.push(hex);
            const gate = Object.values(BARRICADES).find(item => closed.has(item.id)
                && item.from[0] === hex.col && item.from[1] === hex.row);
            if (!gate) continue;
            route.push(...gate.detour.map(([col, row]) => ({ col, row, ...hexCenter(col, row) })));
            index = ROUTE.findIndex(end => end.col === gate.to[0] && end.row === gate.to[1]) - 1;
        }
        return route;
    }

    function makePath(route) {
        const path = [
            { x: route[0].x, y: -0.5 }, ...route,
            { x: route[route.length - 1].x, y: MAP_HEIGHT + 0.5 }
        ];
        const segments = [];
        let length = 0;
        for (let index = 0; index < path.length - 1; index++) {
            const a = path[index], b = path[index + 1];
            const size = Math.hypot(b.x - a.x, b.y - a.y);
            segments.push({ a, b, start: length, length: size });
            length += size;
        }
        return { route, path, segments, length };
    }
    const BASE_PATH = makePath(ROUTE);
    const PATH = BASE_PATH.path, PATH_LENGTH = BASE_PATH.length;

    const TACTICS = Object.freeze({
        powder: { type: 'rucnicari', damageMultiplier: 1.2 },
        flails: { type: 'cepnici', damageMultiplier: 1.25 },
        reload: { type: 'houfnice', cooldownMultiplier: 0.75 },
        scatter: { type: 'houfnice', splash: 2, splashFalloff: [1, 0.65, 0.35] },
        obstacles: { type: 'vuz', slowBonus: 0.1 },
        formation: { type: 'vuz', boostBonus: 0.12 }
    });
    const CHOICES = Object.freeze([
        { wave: 2, options: ['powder', 'flails'] },
        { wave: 4, options: ['reload', 'scatter'] },
        { wave: 6, options: ['obstacles', 'formation'] }
    ]);

    function unitCost(type, fallback) {
        return typeof UnitTypes !== 'undefined' && UnitTypes[type]
            ? UnitTypes[type].cost : fallback;
    }

    const DEFENSES = Object.freeze({
        rucnicari: {
            unitType: 'RUCNICARI', cost: unitCost('RUCNICARI', 60),
            damage: 9, cooldown: 0.62, range: 2, role: 'ranged'
        },
        cepnici: {
            unitType: 'CEPNICI', cost: unitCost('CEPNICI', 40),
            damage: 19, cooldown: 1.05, range: 1, piercing: true, role: 'melee'
        },
        houfnice: {
            unitType: 'HOUFNICE', cost: unitCost('HOUFNICE', 100),
            damage: 27, cooldown: 1.85, range: 3, splash: 1, role: 'artillery'
        },
        vuz: {
            unitType: 'VOZOVA_HRADBA', cost: unitCost('VOZOVA_HRADBA', 120),
            range: 1, slow: 0.3, boost: 0.32, role: 'support'
        }
    });
    const ENEMIES = Object.freeze({
        pesak: { health: 31, speed: 1.2, armor: 0, reward: 8, breach: 1, unitType: 'PAVEZNICI_KRIZACI' },
        rytir: { health: 68, speed: 1.65, armor: 4, reward: 14, breach: 2, unitType: 'RYTIRI' },
        pavez: { health: 145, speed: 0.78, armor: 6, reward: 19, breach: 2, unitType: 'PAVEZNICI_KRIZACI' },
        prapor: { health: 540, speed: 0.54, armor: 7, reward: 100, breach: 9, unitType: 'VELITEL_KRIZACI' }
    });
    // [typ, počet, rozestup, zpoždění] — každá vlna má čitelnou novou hrozbu.
    const WAVES = [
        [['pesak', 8, 0.82, 0]],
        [['pesak', 7, 0.74, 0], ['rytir', 3, 1.15, 3]],
        [['rytir', 7, 0.72, 0], ['pesak', 5, 0.58, 2]],
        [['pavez', 3, 2.2, 0], ['pesak', 8, 0.55, 1]],
        [['rytir', 10, 0.58, 0]],
        [['pavez', 5, 1.5, 0], ['rytir', 5, 0.8, 2.5]],
        [['pesak', 15, 0.39, 0], ['pavez', 5, 1.3, 2]],
        [['prapor', 1, 1, 0], ['rytir', 8, 0.7, 3], ['pavez', 4, 1.6, 5]]
    ];

    function waveInfo(number) {
        return (WAVES[number - 1] || []).map(([type, count]) => ({ type, count }));
    }

    function pointAt(distance, track = BASE_PATH) {
        if (distance <= 0) return { ...track.path[0], angle: Math.PI / 2 };
        for (const segment of track.segments) {
            if (distance <= segment.start + segment.length) {
                const part = (distance - segment.start) / segment.length;
                return {
                    x: segment.a.x + (segment.b.x - segment.a.x) * part,
                    y: segment.a.y + (segment.b.y - segment.a.y) * part,
                    angle: Math.atan2(segment.b.y - segment.a.y, segment.b.x - segment.a.x)
                };
            }
        }
        return { ...track.path[track.path.length - 1], angle: Math.PI / 2 };
    }

    class Game {
        constructor() { this.reset(); }

        reset() {
            this.gold = START_GOLD;
            this.camp = START_CAMP;
            this.wave = 0;
            this.state = 'ready';
            this.time = 0;
            this.towers = [];
            this.enemies = [];
            this.queue = [];
            this.nextEnemyId = 1;
            this.kills = 0;
            this.leaks = 0;
            this.clearedWaves = new Set();
            this.tactics = new Set();
            this.pendingChoices = [];
            this.barricades = new Set();
            this.track = makePath(routeWithBarricades(this.barricades));
            this.choralUsed = false;
            this.choralRemaining = 0;
            this.metrics = {
                units: Object.fromEntries(Object.keys(DEFENSES).map(type => [type,
                    { built: 0, spent: 0, damage: 0, kills: 0, attacks: 0 }])),
                supportDamage: 0, slowedTime: 0, earned: 0, spent: 0, refunded: 0,
                earlyWaves: 0, hillsBuilt: 0, barricadesUsed: new Set()
            };
            return this;
        }

        summary() {
            return {
                version: VERSION, outcome: this.state, wave: this.wave, cleared: this.clearedWaves.size,
                camp: this.camp, kills: this.kills, leaks: this.leaks, seconds: Math.round(this.time),
                grade: this.state === 'won' ? (this.camp === START_CAMP ? 3 : this.camp >= 10 ? 2 : 1) : 0,
                gold: this.gold, spent: this.metrics.spent, refunded: this.metrics.refunded,
                earned: this.metrics.earned, earlyWaves: this.metrics.earlyWaves,
                hillsBuilt: this.metrics.hillsBuilt, barricades: [...this.metrics.barricadesUsed],
                tactics: [...this.tactics], choralUsed: this.choralUsed,
                units: Object.fromEntries(Object.entries(this.metrics.units).map(([type, unit]) =>
                    [type, { ...unit, damage: Math.round(unit.damage) }])),
                supportDamage: Math.round(this.metrics.supportDamage),
                slowedSeconds: Math.round(this.metrics.slowedTime)
            };
        }

        get route() { return this.track.route; }
        get path() { return this.track.path; }
        get pathLength() { return this.track.length; }
        get pendingChoice() { return this.pendingChoices[0] || null; }

        pointAt(distance) { return pointAt(distance, this.track); }

        isHill(col, row) { return HILLS.has(col + ',' + row); }

        barricadeAt(col, row) {
            return Object.values(BARRICADES).find(gate => gate.col === col && gate.row === row) || null;
        }

        previewBarricade(id) {
            if (!BARRICADES[id]) return null;
            const next = new Set(this.barricades);
            if (next.has(id)) next.delete(id); else next.add(id);
            return makePath(routeWithBarricades(next));
        }

        canToggleBarricade(id) {
            return Boolean(BARRICADES[id]) && this.state === 'ready' && !this.pendingChoice
                && !this.enemies.length && !this.queue.length
                && (this.barricades.has(id) || this.gold >= BARRICADE_COST);
        }

        toggleBarricade(id) {
            // Changing an empty battlefield avoids teleporting enemies or
            // repeatedly rerouting them away from the camp during a fight.
            if (!this.canToggleBarricade(id)) return false;
            this.track = this.previewBarricade(id);
            if (this.barricades.has(id)) {
                this.barricades.delete(id);
                this.gold += BARRICADE_COST;
                this.metrics.refunded += BARRICADE_COST;
            } else {
                this.barricades.add(id);
                this.gold -= BARRICADE_COST;
                this.metrics.spent += BARRICADE_COST;
                this.metrics.barricadesUsed.add(id);
            }
            return true;
        }

        chooseTactic(id) {
            if (!['ready', 'running'].includes(this.state) || !this.pendingChoice?.options.includes(id)) return false;
            const reloading = this.towers.filter(tower => tower.type === TACTICS[id].type)
                .map(tower => ({ tower, duration: this.towerStats(tower).cooldown }));
            this.tactics.add(id);
            for (const { tower, duration } of reloading) {
                tower.cooldown *= this.towerStats(tower).cooldown / duration;
            }
            this.pendingChoices.shift();
            return true;
        }

        tacticsFor(type) {
            return [...this.tactics].filter(id => TACTICS[id].type === type);
        }

        isBuildable(col, row) {
            return inBounds(col, row)
                && !PATH_CELLS.has(col + ',' + row)
                && !BLOCKED.has(col + ',' + row);
        }

        towerAt(col, row) {
            return this.towers.find(tower => tower.col === col && tower.row === row) || null;
        }

        place(col, row, type) {
            if (!['ready', 'running'].includes(this.state) || !this.isBuildable(col, row)
                || this.towerAt(col, row) || !DEFENSES[type] || this.gold < DEFENSES[type].cost) return false;
            const cost = DEFENSES[type].cost;
            this.gold -= cost;
            this.metrics.spent += cost;
            this.metrics.units[type].built++;
            this.metrics.units[type].spent += cost;
            if (this.isHill(col, row) && ['rucnicari', 'houfnice'].includes(type)) this.metrics.hillsBuilt++;
            this.towers.push({
                col, row, ...hexCenter(col, row), type, level: 1,
                cooldown: 0, spent: cost, angle: -Math.PI / 2
            });
            return true;
        }

        upgrade(col, row) {
            if (!['ready', 'running'].includes(this.state)) return false;
            const tower = this.towerAt(col, row);
            if (!tower || tower.level >= 3) return false;
            const cost = this.upgradeCost(tower);
            if (this.gold < cost) return false;
            this.gold -= cost;
            this.metrics.spent += cost;
            this.metrics.units[tower.type].spent += cost;
            tower.spent += cost;
            tower.level++;
            return true;
        }

        sell(col, row) {
            if (!['ready', 'running'].includes(this.state)) return false;
            const tower = this.towerAt(col, row);
            if (!tower) return false;
            const refund = Math.round(tower.spent * 0.6);
            this.gold += refund;
            this.metrics.refunded += refund;
            this.towers = this.towers.filter(other => other !== tower);
            return true;
        }

        upgradeCost(tower) {
            return Math.round(DEFENSES[tower.type].cost * 0.7 * tower.level);
        }

        supportingWagons(tower) {
            return this.towers.filter(other => other !== tower && other.type === 'vuz'
                && hexDistance(other, tower) === 1);
        }

        adjacentWagons(tower) {
            return this.supportingWagons(tower).length;
        }

        supportBoost(tower) {
            return Math.min(0.8, this.supportingWagons(tower)
                .reduce((total, wagon) => total + this.towerStats(wagon).boost, 0));
        }

        inRange(tower, point, range = this.towerStats(tower).range) {
            return hexDistance(tower, hexAt(point.x, point.y)) <= range;
        }

        movementEffectsAt(x, y) {
            // Stejná zasažitelná pole pro pohyb, palbu i vykreslení dosahu.
            // Překryv vozů použije nejsilnější účinek, ne jejich součet.
            const hex = hexAt(x, y);
            let wagonSlow = 0;
            for (const tower of this.towers) {
                if (tower.type !== 'vuz') continue;
                const stats = this.towerStats(tower);
                if (hexDistance(tower, hex) <= stats.range) {
                    wagonSlow = Math.max(wagonSlow, stats.slow);
                }
            }
            return {
                wagonSlow,
                speedMultiplier: (1 - wagonSlow) * (this.choralRemaining > 0 ? 0.75 : 1)
            };
        }

        towerStats(tower) {
            const spec = DEFENSES[tower.type];
            const levels = tower.level - 1;
            const perks = this.tacticsFor(tower.type).map(id => TACTICS[id]);
            const hillBonus = this.isHill(tower.col, tower.row)
                && ['ranged', 'artillery'].includes(spec.role) ? 1 : 0;
            return {
                damage: (spec.damage || 0) * (1 + 0.45 * levels)
                    * perks.reduce((value, perk) => value * (perk.damageMultiplier || 1), 1),
                cooldown: (spec.cooldown || 1) * (1 - 0.08 * levels)
                    * perks.reduce((value, perk) => value * (perk.cooldownMultiplier || 1), 1),
                // Cepníci vždy bojují zblízka. Ostatní oddíly získají na
                // třetí úrovni jeden celý hex dosahu navíc.
                range: spec.range + (spec.role !== 'melee' && levels === 2 ? 1 : 0) + hillBonus,
                hillBonus,
                splash: Math.max(spec.splash || 0, ...perks.map(perk => perk.splash || 0)),
                splashFalloff: perks.find(perk => perk.splashFalloff)?.splashFalloff || [1, 0.5],
                slow: (spec.slow || 0) + (spec.slow ? 0.06 * levels : 0)
                    + perks.reduce((value, perk) => value + (perk.slowBonus || 0), 0),
                boost: (spec.boost || 0) + (spec.boost ? 0.06 * levels : 0)
                    + perks.reduce((value, perk) => value + (perk.boostBonus || 0), 0),
                piercing: Boolean(spec.piercing)
            };
        }

        canCallEarly() {
            return this.state === 'running' && !this.pendingChoice
                && this.queue.length === 0 && this.wave < WAVES.length;
        }

        startWave() {
            const early = this.canCallEarly();
            if (this.state !== 'ready' && !early) return null;
            if (this.wave >= WAVES.length || this.pendingChoice) return null;
            if (early) {
                this.gold += EARLY_BONUS;
                this.metrics.earned += EARLY_BONUS;
                this.metrics.earlyWaves++;
            }
            this.wave++;
            this.state = 'running';
            const factor = 1 + (this.wave - 1) * 0.17;
            for (const [type, count, spacing, delay] of WAVES[this.wave - 1]) {
                for (let index = 0; index < count; index++) {
                    this.queue.push({ at: this.time + 0.35 + delay + index * spacing,
                        type, factor, wave: this.wave });
                }
            }
            this.queue.sort((a, b) => a.at - b.at);
            return { early, wave: this.wave };
        }

        activateChoral() {
            if (this.state !== 'running' || this.choralUsed || this.pendingChoice) return false;
            this.choralUsed = true;
            this.choralRemaining = 6;
            return true;
        }

        _damage(enemy, amount, piercing, source, withoutSupport = amount) {
            const armor = ENEMIES[enemy.type].armor;
            const afterArmor = value => piercing ? value * (armor > 0 ? 1.3 : 1) : Math.max(1, value - armor);
            const effective = afterArmor(amount);
            const health = Math.max(0, enemy.health);
            enemy.health -= effective;
            if (source && health > 0) {
                // Count only HP really removed. Overkill and overlapping blast
                // effects cannot inflate damage or credit a kill twice.
                const actual = Math.min(health, effective);
                this.metrics.units[source].damage += actual;
                if (enemy.health <= 0) this.metrics.units[source].kills++;
                this.metrics.supportDamage += Math.max(0, actual - Math.min(health, afterArmor(withoutSupport)));
            }
            return effective;
        }

        tick(seconds) {
            if (this.state !== 'running' || this.pendingChoice || !Number.isFinite(seconds) || seconds <= 0) return [];
            // Přepnutí panelu nebo návrat z pozadí nesmí přeskočit celou bitvu.
            const dt = Math.min(seconds, 0.08);
            const events = [];
            this.time += dt;
            this.choralRemaining = Math.max(0, this.choralRemaining - dt);
            while (this.queue.length && this.queue[0].at <= this.time) {
                const spawn = this.queue.shift();
                const spec = ENEMIES[spawn.type];
                const health = Math.round(spec.health * (spawn.type === 'prapor' ? 1 : spawn.factor));
                const position = this.pointAt(0);
                this.enemies.push({
                    id: this.nextEnemyId++, type: spawn.type, wave: spawn.wave, distance: 0,
                    x: position.x, y: position.y, angle: position.angle,
                    health, maxHealth: health
                });
                events.push({ type: 'spawn', enemyType: spawn.type });
            }

            const survivors = [];
            for (const enemy of this.enemies) {
                const spec = ENEMIES[enemy.type];
                const movement = this.movementEffectsAt(enemy.x, enemy.y);
                if (movement.wagonSlow > 0) {
                    const remaining = Math.max(0, this.pathLength - enemy.distance);
                    this.metrics.slowedTime += Math.min(dt, remaining / (spec.speed * movement.speedMultiplier));
                }
                enemy.distance += spec.speed * movement.speedMultiplier * dt;
                const position = this.pointAt(enemy.distance);
                enemy.x = position.x;
                enemy.y = position.y;
                enemy.angle = position.angle;
                if (enemy.distance >= this.pathLength) {
                    this.camp = Math.max(0, this.camp - spec.breach);
                    this.leaks++;
                    events.push({ type: 'breach', enemyType: enemy.type, amount: spec.breach });
                } else {
                    survivors.push(enemy);
                }
            }
            this.enemies = survivors;

            for (const tower of this.towers) {
                if (tower.type === 'vuz') continue;
                tower.cooldown = Math.max(0, tower.cooldown - dt);
                if (tower.cooldown > 0) continue;
                const stats = this.towerStats(tower);
                const target = this.enemies
                    .filter(enemy => enemy.health > 0
                        && this.inRange(tower, enemy, stats.range))
                    .sort((a, b) => b.distance - a.distance)[0];
                if (!target) continue;
                tower.angle = Math.atan2(target.y - tower.y, target.x - tower.x);
                const unboostedDamage = stats.damage * (this.choralRemaining > 0 ? 1.4 : 1);
                const damage = unboostedDamage * (1 + this.supportBoost(tower));
                if (stats.splash) {
                    for (const enemy of this.enemies) {
                        const blastDistance = hexDistance(hexAt(enemy.x, enemy.y), hexAt(target.x, target.y));
                        if (enemy.health > 0 && blastDistance <= stats.splash) {
                            const falloff = stats.splashFalloff[blastDistance];
                            this._damage(enemy, damage * falloff, false, tower.type, unboostedDamage * falloff);
                        }
                    }
                } else {
                    this._damage(target, damage, stats.piercing, tower.type, unboostedDamage);
                }
                this.metrics.units[tower.type].attacks++;
                tower.cooldown = stats.cooldown;
                events.push({
                    type: 'fire', weapon: tower.type, from: { x: tower.x, y: tower.y },
                    to: { x: target.x, y: target.y, ...hexAt(target.x, target.y) }, splash: stats.splash
                });
            }

            this.enemies = this.enemies.filter(enemy => {
                if (enemy.health > 0) return true;
                const reward = ENEMIES[enemy.type].reward + Math.floor((enemy.wave || this.wave) / 3);
                this.gold += reward;
                this.metrics.earned += reward;
                this.kills++;
                events.push({ type: 'kill', x: enemy.x, y: enemy.y, reward });
                return false;
            });
            if (this.camp <= 0) {
                this.state = 'lost';
                events.push({ type: 'lost' });
            } else {
                // Overlapping waves each keep their completion reward. Calling
                // reinforcements early must not erase the previous wave's pay.
                for (let wave = 1; wave <= this.wave; wave++) {
                    if (this.clearedWaves.has(wave)
                        || this.queue.some(spawn => spawn.wave === wave)
                        || this.enemies.some(enemy => enemy.wave === wave)) continue;
                    this.clearedWaves.add(wave);
                    const bonus = wave < WAVES.length ? 20 + 4 * wave : 0;
                    this.gold += bonus;
                    this.metrics.earned += bonus;
                    events.push({ type: 'waveComplete', wave, bonus });
                    const choice = CHOICES.find(item => item.wave === wave);
                    if (choice) {
                        this.pendingChoices.push(choice);
                        events.push({ type: 'choiceReady', wave });
                    }
                }
                if (!this.queue.length && !this.enemies.length) {
                    this.state = this.wave === WAVES.length ? 'won' : 'ready';
                    if (this.state === 'won') {
                        this.pendingChoices = [];
                        events.push({ type: 'won' });
                    }
                }
            }
            return events;
        }
    }

    return Object.freeze({
        Game, VERSION, COLS, ROWS, PATH, PATH_LENGTH, PATH_CELLS, ROUTE, ROAD_HEXES, BLOCKED, DEFENSES, ENEMIES,
        HILLS, BARRICADES, BARRICADE_COST, TACTICS, CHOICES,
        HEX_RADIUS, MAP_WIDTH, MAP_HEIGHT, HEXES, hexCenter, hexAt, hexDistance, hexesInRange,
        WAVE_COUNT: WAVES.length, START_GOLD, START_CAMP, EARLY_BONUS, pointAt, waveInfo
    });
})();

if (typeof module !== 'undefined' && module.exports) module.exports = WagonDefense;
