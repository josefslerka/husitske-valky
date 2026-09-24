#!/usr/bin/env node
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {
    Game, WAVE_COUNT, COLS, ROWS, PATH_CELLS, DEFENSES, ENEMIES, pointAt,
    START_GOLD, START_CAMP, EARLY_BONUS, HEXES, PATH, ROUTE,
    hexCenter, hexAt, hexDistance, hexesInRange, MAP_WIDTH, MAP_HEIGHT,
    HILLS, BARRICADES, BARRICADE_COST, CHOICES, PATH_LENGTH
} = require('../bonus/vozova-hradba/game.js');

function finishWave(game, buy = () => {}, choose = choice => choice.options[0]) {
    const launched = game.startWave();
    assert.ok(launched, 'a wave can be sent while preparing the defense');
    let ticks = 0;
    while ((game.state === 'running' || game.pendingChoice) && ticks++ < 6000) {
        if (game.pendingChoice) assert.equal(game.chooseTactic(choose(game.pendingChoice)), true);
        else game.tick(0.08);
        buy();
    }
    assert.ok(ticks < 6000, 'a wave eventually ends');
}

function closeTo(actual, expected, message) {
    assert.ok(Math.abs(actual - expected) < 1e-9, `${message}: ${actual} ≠ ${expected}`);
}

function distanceAt(col, row) {
    let distance = 0;
    for (let index = 1; index < PATH.length; index++) {
        distance += Math.hypot(PATH[index].x - PATH[index - 1].x, PATH[index].y - PATH[index - 1].y);
        if (PATH[index].col === col && PATH[index].row === row) return distance;
    }
    throw new Error(`Hex ${col},${row} is not on the road`);
}

function movementFixture(wagons = [], type = 'pesak', distance = distanceAt(3, 2)) {
    const game = new Game();
    game.gold = 5000;
    for (const [col, row, level] of wagons) {
        assert.equal(game.place(col, row, 'vuz'), true);
        for (let upgrade = 1; upgrade < level; upgrade++) assert.equal(game.upgrade(col, row), true);
    }
    game.startWave();
    const enemy = { id: 99, type, wave: 1, distance, ...pointAt(distance), health: 1000, maxHealth: 1000 };
    game.enemies.push(enemy);
    return { game, enemy };
}

{
    // Compare the bonus with the actual geometry used by the main game.
    const core = vm.createContext({});
    vm.runInContext(fs.readFileSync(path.resolve(__dirname, '../js/core/hex.js'), 'utf8')
        + '\nthis.ReferenceHexGrid = HexGrid;', core);
    const grid = Object.create(core.ReferenceHexGrid.prototype);
    grid.cols = COLS; grid.rows = ROWS;
    for (const a of HEXES) {
        assert.deepEqual(hexAt(a.x, a.y), { col: a.col, row: a.row }, 'hex centres must be selectable');
        const neighbors = grid.getNeighbors(a.col, a.row);
        const ring = hexesInRange(a.col, a.row, 1).filter(b => b.col !== a.col || b.row !== a.row);
        assert.equal(ring.length, neighbors.length, 'exactly six neighbors away from map edges');
        for (const b of HEXES) {
            assert.equal(hexDistance(a, b), grid.getDistance(a.col, a.row, b.col, b.row),
                'range agrees with the main game for both column parities');
        }
        for (const neighbor of neighbors) {
            const b = hexCenter(neighbor.col, neighbor.row);
            const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
            assert.deepEqual(hexAt(mid.x + (a.x - b.x) * 0.001, mid.y + (a.y - b.y) * 0.001),
                { col: a.col, row: a.row }, 'inside edge belongs to the selected hex');
            assert.deepEqual(hexAt(mid.x + (b.x - a.x) * 0.001, mid.y + (b.y - a.y) * 0.001),
                { col: neighbor.col, row: neighbor.row }, 'crossing an edge selects the neighboring hex');
        }
    }
    for (const [x, y] of [[0, 0], [MAP_WIDTH, MAP_HEIGHT], [-1, 2], [MAP_WIDTH + 1, 2]]) {
        assert.equal(hexAt(x, y), null, 'space outside the hex board cannot select an edge tile');
    }
    for (let index = 1; index < ROUTE.length; index++) {
        assert.equal(grid.getDistance(ROUTE[index - 1].col, ROUTE[index - 1].row,
            ROUTE[index].col, ROUTE[index].row), 1, 'the road crosses shared hex edges');
    }
    for (let distance = 0; distance < distanceAt(4, 10); distance += 0.04) {
        const p = pointAt(distance), hex = hexAt(p.x, p.y);
        if (hex) assert.ok(PATH_CELLS.has(hex.col + ',' + hex.row), 'movement stays on road hexes');
    }

    const game = new Game();
    for (const type of Object.keys(DEFENSES)) for (const level of [1, 2, 3]) {
        const tower = { type, level, col: 3, row: 3 };
        const range = game.towerStats(tower).range;
        assert.ok(Number.isInteger(range), 'every displayed and actual range is a whole number of hexes');
        if (type === 'cepnici') assert.equal(range, 1, 'flailmen remain melee units at every level');
        const highlight = new Set(hexesInRange(tower.col, tower.row, range).map(h => h.col + ',' + h.row));
        for (const hex of HEXES) {
            assert.equal(game.inRange(tower, hex), highlight.has(hex.col + ',' + hex.row),
                'highlighted hexes are the exact combat range');
        }
    }
}

function measuredSpeed(game, enemy, dt = 0.05) {
    const before = enemy.distance;
    game.tick(dt);
    return (enemy.distance - before) / (ENEMIES[enemy.type].speed * dt);
}

{
    const game = new Game();
    assert.equal(WAVE_COUNT, 8);
    assert.equal(game.gold, START_GOLD);
    assert.equal(game.camp, START_CAMP);
    assert.equal(game.place(-1, 1, 'rucnicari'), false);
    assert.equal(game.place(COLS, ROWS, 'rucnicari'), false);
    assert.equal(game.place(1, 1, 'rucnicari'), false, 'road tiles are reserved');
    assert.equal(game.place(0, 0, 'rucnicari'), false, 'banner tile is reserved');
    assert.equal(game.place(3, 3, 'unknown'), false);
    assert.equal(game.place(3, 3, 'rucnicari'), true);
    assert.equal(game.place(3, 3, 'cepnici'), false, 'a tile holds one unit');
    assert.equal(game.gold, START_GOLD - DEFENSES.rucnicari.cost);
    assert.equal(game.upgrade(3, 3), true);
    assert.equal(game.towerAt(3, 3).level, 2);
    assert.equal(game.sell(3, 3), true);
    assert.equal(game.towerAt(3, 3), null);
    assert.ok(game.gold > START_GOLD - DEFENSES.rucnicari.cost);
    assert.equal(game.tick(60).length, 0, 'the first wave waits for the player');
    assert.ok(PATH_CELLS.has('4,8'), 'the final bend belongs to the road');
}

{
    const game = new Game();
    finishWave(game);
    assert.equal(game.state, 'ready');
    assert.ok(game.camp < START_CAMP, 'an undefended camp takes damage');
    assert.equal(game.choralUsed, false);
    assert.equal(game.startWave().wave, 2);
    assert.equal(game.activateChoral(), true);
    assert.equal(game.activateChoral(), false, 'chorale can be used only once');
    while (game.state === 'running') game.tick(0.08);
    assert.equal(game.state, 'lost', 'an undefended run must eventually fail');
    assert.equal(game.place(3, 3, 'cepnici'), false);
    assert.equal(game.startWave(), null);
}

{
    const game = new Game();
    game.startWave();
    let steps = 0;
    while (!game.canCallEarly() && steps++ < 300) game.tick(0.08);
    assert.ok(game.canCallEarly());
    const gold = game.gold;
    const result = game.startWave();
    assert.equal(result.early, true);
    assert.equal(game.wave, 2);
    assert.equal(game.gold, gold + EARLY_BONUS);
}

{
    // Calling a wave early adds its bonus without erasing earned rewards.
    const game = new Game();
    game.startWave();
    while (!game.canCallEarly()) game.tick(0.08);
    game.startWave();
    const completions = [];
    let ticks = 0;
    while (game.state === 'running' && ticks++ < 1000) {
        completions.push(...game.tick(0.08).filter(event => event.type === 'waveComplete'));
    }
    assert.ok(ticks < 1000);
    assert.deepEqual(completions.map(event => event.wave), [1]);
    assert.equal(game.gold, START_GOLD + EARLY_BONUS + 24);
    assert.equal(game.clearedWaves.size, 1, 'only repelled waves count toward the record');
    assert.equal(game.clearedWaves.has(2), false);

    const overlap = new Game();
    overlap.startWave();
    for (let wave = 2; wave <= 3; wave++) {
        while (!overlap.canCallEarly()) overlap.tick(0.08);
        overlap.startWave();
    }
    const originalEnemy = overlap.enemies.find(enemy => enemy.wave === 1);
    assert.ok(originalEnemy);
    const gold = overlap.gold;
    originalEnemy.health = 0;
    overlap.tick(0.08);
    assert.equal(overlap.gold - gold, ENEMIES.pesak.reward,
        'an enemy keeps the reward of its own wave during overlapping attacks');
    assert.equal(overlap.clearedWaves.size, 0);
}

{
    // Weapon roles must matter in combat, not only in the build menu.
    const fight = type => {
        const game = new Game();
        assert.equal(game.place(3, 3, type), true);
        game.startWave();
        const distance = distanceAt(3, 2), position = pointAt(distance);
        game.enemies.push({ id: 1, type: 'rytir', distance,
            ...position, health: 68, maxHealth: 68 });
        game.tick(0.08);
        return game.enemies[0].health;
    };
    assert.ok(fight('cepnici') < fight('rucnicari'),
        'flails must be stronger than firearms against armour');

    for (const [offset, damage] of [[0.49, 19], [0.51, 0]]) {
        // The far edge of road hex (3,2) is still reachable by melee at
        // (3,3). Across that edge, road hex (4,2) is two hexes away.
        const { game, enemy } = movementFixture([], 'pesak', distanceAt(3, 2) + offset);
        game.place(3, 3, 'cepnici');
        game.tick(0.001);
        closeTo(1000 - enemy.health, damage, 'combat switches range at the displayed hex edge');
        const wagon = movementFixture([[3, 3, 1]], 'pesak', distanceAt(3, 2) + offset);
        closeTo(measuredSpeed(wagon.game, wagon.enemy, 0.001), damage ? 0.7 : 1,
            'slowing uses the same hex edge as attacks and highlights');
    }

    const artillery = new Game();
    artillery.place(3, 3, 'houfnice');
    artillery.startWave();
    for (const [id, distance] of [[1, distanceAt(3, 2)], [2, distanceAt(3, 2) + 0.2],
        [3, distanceAt(2, 2)], [4, distanceAt(1, 2)]]) {
        artillery.enemies.push({ id, type: 'pesak', distance,
            ...pointAt(distance), health: 1000, maxHealth: 1000 });
    }
    artillery.tick(0.08);
    assert.equal(artillery.enemies[0].health, 973, 'full damage in the target hex');
    assert.equal(artillery.enemies[1].health, 973, 'full damage to the whole group in that hex');
    assert.equal(artillery.enemies[2].health, 986.5, 'half damage in a neighboring hex');
    assert.equal(artillery.enemies[3].health, 1000, 'the blast cannot hit two hexes away');

}

{
    // Measure real displacement, independently of the UI/effect description.
    for (const type of Object.keys(ENEMIES)) {
        for (const [level, multiplier] of [[1, 0.70], [2, 0.64], [3, 0.58]]) {
            const { game, enemy } = movementFixture([[2, 3, level]], type);
            closeTo(measuredSpeed(game, enemy), multiplier, `${type}: wagon level ${level}`);
        }
    }
    for (const [levels, multiplier] of [[[1, 1], 0.70], [[1, 3], 0.58], [[3, 1], 0.58]]) {
        const { game, enemy } = movementFixture([[2, 3, levels[0]], [3, 3, levels[1]]]);
        closeTo(measuredSpeed(game, enemy), multiplier, 'overlap uses the strongest wagon in either order');
    }
    for (const [level, multiplier] of [[0, 0.75], [1, 0.525], [2, 0.48], [3, 0.435]]) {
        const { game, enemy } = movementFixture(level ? [[2, 3, level]] : []);
        assert.equal(game.activateChoral(), true);
        closeTo(measuredSpeed(game, enemy), multiplier, 'chorale multiplies remaining movement speed');
        game.choralRemaining = 0;
        closeTo(measuredSpeed(game, enemy), level ? [0, 0.70, 0.64, 0.58][level] : 1,
            'ending the chorale preserves only the wagon effect');
    }

    const { game, enemy } = movementFixture([[2, 3, 1]], 'pesak', distanceAt(1, 0));
    closeTo(measuredSpeed(game, enemy), 1, 'an enemy approaching the affected hexes is not slowed early');
    let entered = false;
    for (let tick = 0; tick < 240 && enemy.distance < distanceAt(4, 2); tick++) {
        entered ||= game.movementEffectsAt(enemy.x, enemy.y).wagonSlow > 0;
        game.tick(0.05);
    }
    assert.ok(entered, 'walking into an affected hex applies the slow');
    closeTo(measuredSpeed(game, enemy), 1, 'leaving affected hexes restores full speed without a lingering slow');

    const upgraded = movementFixture([[2, 3, 1]], 'pesak', distanceAt(4, 2));
    closeTo(measuredSpeed(upgraded.game, upgraded.enemy), 1, 'outside the original wagon range');
    upgraded.game.upgrade(2, 3);
    closeTo(measuredSpeed(upgraded.game, upgraded.enemy), 1, 'level two strengthens the effect without extending range');
    upgraded.game.upgrade(2, 3);
    closeTo(measuredSpeed(upgraded.game, upgraded.enemy), 0.58, 'level three reaches one extra hex');
    upgraded.game.sell(2, 3);
    closeTo(measuredSpeed(upgraded.game, upgraded.enemy), 1, 'selling a wagon immediately removes its effect');
    upgraded.game.reset();
    closeTo(upgraded.game.movementEffectsAt(2.5, 2.5).speedMultiplier, 1, 'new games retain no slowing effect');
}

{
    // A support marker must correspond to real damage, including both
    // column parities, upgrades and the stacking cap.
    const damageWith = (wagons, col = 3, row = 3) => {
        const { game, enemy } = movementFixture(wagons);
        assert.equal(game.place(col, row, 'rucnicari'), true);
        game.tick(0.05);
        return 1000 - enemy.health;
    };
    closeTo(damageWith([]), 9, 'unsupported firearm damage');
    closeTo(damageWith([[2, 3, 1]]), 11.88, 'one wagon gives 32% attack');
    closeTo(damageWith([[4, 4, 1]]), 11.88, 'support follows a shared sloping edge');
    closeTo(damageWith([[2, 3, 3]]), 12.96, 'an upgraded wagon gives 44% attack');
    closeTo(damageWith([[2, 3, 1], [4, 4, 1]]), 14.76, 'two support bonuses add');
    closeTo(damageWith([[2, 3, 1], [4, 4, 1], [3, 4, 1]]), 16.2, 'support is capped at 80%');
    closeTo(damageWith([[6, 7, 3]]), 9, 'a distant wagon does not support a unit');
    closeTo(damageWith([[3, 4, 1]], 2, 3), 9, 'a square-grid diagonal is not necessarily a hex neighbor');
}

{
    // Both routes at each fork stay reserved, every detour is continuous,
    // and real enemies reach the camp without crossing a barricade.
    for (const ids of [[], ['east'], ['west'], ['east', 'west']]) {
        const game = new Game();
        for (const id of ids) {
            const preview = game.previewBarricade(id);
            assert.equal(game.toggleBarricade(id), true);
            assert.deepEqual(game.path, preview.path, 'the preview is the route actually used');
        }
        closeTo(game.pathLength, PATH_LENGTH + 2 * ids.length, 'each detour adds two whole hexes');
        assert.equal(game.gold, START_GOLD - BARRICADE_COST * ids.length);
        const road = new Set(game.route.map(hex => hex.col + ',' + hex.row));
        assert.equal(road.size, game.route.length, 'the route never loops over itself');
        for (let index = 1; index < game.route.length; index++) {
            assert.equal(hexDistance(game.route[index - 1], game.route[index]), 1);
        }
        for (const gate of Object.values(BARRICADES)) {
            assert.equal(road.has(gate.col + ',' + gate.row), !ids.includes(gate.id));
            for (const [col, row] of gate.detour) assert.equal(game.isBuildable(col, row), false);
            assert.equal(game.isBuildable(gate.col, gate.row), false);
        }
        game.state = 'running'; game.wave = 1;
        const enemy = { id: 1, type: 'pesak', wave: 1, distance: 0,
            ...game.pointAt(0), health: 1000, maxHealth: 1000 };
        game.enemies = [enemy];
        const visited = new Set();
        for (let tick = 0; game.state === 'running' && tick < 800; tick++) {
            const before = { x: enemy.x, y: enemy.y };
            game.tick(0.05);
            assert.ok(Math.hypot(enemy.x - before.x, enemy.y - before.y) <= ENEMIES.pesak.speed * 0.05 + 1e-9,
                'enemies move continuously through every fork');
            const hex = hexAt(enemy.x, enemy.y);
            if (hex) {
                const key = hex.col + ',' + hex.row;
                assert.ok(road.has(key), 'movement follows the active road, including detours');
                visited.add(key);
            }
        }
        assert.deepEqual(visited, road, 'the enemy traverses every active hex exactly along the chosen branch');
        assert.equal(game.leaks, 1);
        assert.equal(game.camp, START_CAMP - 1);
        assert.equal(game.state, 'ready');
        assert.ok(game.time >= game.pathLength / ENEMIES.pesak.speed);
        assert.ok(game.time < game.pathLength / ENEMIES.pesak.speed + 0.051);
    }
    const game = new Game();
    const originalPath = game.path;
    assert.equal(game.toggleBarricade('unknown'), false);
    game.gold = BARRICADE_COST - 1;
    assert.equal(game.toggleBarricade('east'), false);
    assert.strictEqual(game.path, originalPath, 'rejected changes cannot alter the route');
    game.gold = BARRICADE_COST;
    assert.equal(game.toggleBarricade('east'), true);
    assert.equal(game.gold, 0);
    assert.equal(game.toggleBarricade('east'), true);
    assert.equal(game.gold, BARRICADE_COST, 'removal returns precisely the paid cost');
    game.toggleBarricade('east'); game.startWave(); game.tick(0.08);
    const pathDuringCombat = game.path;
    assert.equal(game.toggleBarricade('east'), false, 'barricades cannot be moved during combat or a UI pause');
    assert.strictEqual(game.path, pathDuringCombat);
    assert.equal(game.gold, 0);
    game.reset();
    assert.equal(game.barricades.size, 0);
    closeTo(game.pathLength, PATH_LENGTH, 'restart restores the short route');
}

{
    // Elevation affects actual attacks, but never extends flails or wagon support.
    const game = new Game();
    for (const key of HILLS) {
        const [col, row] = key.split(',').map(Number);
        assert.ok(game.isBuildable(col, row), 'every hill can hold a unit');
        for (const type of Object.keys(DEFENSES)) for (const level of [1, 2, 3]) {
            const base = game.towerStats({ type, level });
            const stats = game.towerStats({ type, level, col, row });
            assert.equal(stats.range - base.range, ['rucnicari', 'houfnice'].includes(type) ? 1 : 0);
        }
    }
    const hill = { col: 3, row: 0 };
    assert.equal(game.place(hill.col, hill.row, 'rucnicari'), true);
    const target = ROUTE.find(hex => hexDistance(hill, hex) === 3);
    assert.ok(target);
    const distance = distanceAt(target.col, target.row);
    const enemy = { id: 90, type: 'pesak', wave: 1, distance, ...pointAt(distance), health: 1000, maxHealth: 1000 };
    game.startWave(); game.enemies.push(enemy); game.tick(0.001);
    closeTo(enemy.health, 991, 'a handgun really fires into the extra hill hex');
    assert.equal(game.inRange(game.towers[0], enemy, 2), false, 'the same shot is beyond ordinary range');
}

function grantTactic(game, id) {
    // Focused combat fixture. Earning these choices is exercised separately below.
    game.pendingChoices.push(CHOICES.find(choice => choice.options.includes(id)));
    assert.equal(game.chooseTactic(id), true);
}

{
    for (const [id, weapon, expected] of [['powder', 'rucnicari', 10.8], ['flails', 'cepnici', 23.75]]) {
        const { game, enemy } = movementFixture();
        game.place(3, 3, weapon); grantTactic(game, id); game.tick(0.01);
        closeTo(1000 - enemy.health, expected, 'the chosen attack perk affects real damage');
        assert.equal(game.chooseTactic(id), false, 'a choice cannot be claimed again');
        const stats = game.towerStats({ type: weapon, level: 1, col: 3, row: 0 });
        closeTo(stats.damage, expected, 'future units receive the same perk');
        assert.equal(stats.range, weapon === 'rucnicari' ? 3 : 1, 'terrain and perks compose');
    }
    const support = movementFixture([[2, 3, 1]]);
    support.game.place(3, 3, 'rucnicari'); grantTactic(support.game, 'formation'); support.game.tick(0.01);
    closeTo(1000 - support.enemy.health, 12.96, 'the formation perk changes supported weapon damage');
    for (const level of [1, 2, 3]) {
        const { game, enemy } = movementFixture([[2, 3, level]]);
        grantTactic(game, 'obstacles');
        closeTo(measuredSpeed(game, enemy), 0.6 - 0.06 * (level - 1), 'chains add ten percentage points of slow');
        game.activateChoral();
        closeTo(measuredSpeed(game, enemy), (0.6 - 0.06 * (level - 1)) * 0.75, 'chains still combine multiplicatively with chorale');
    }
    const artillery = new Game();
    grantTactic(artillery, 'scatter'); artillery.place(3, 3, 'houfnice'); artillery.startWave();
    for (const [id, col, row] of [[1, 3, 2], [2, 2, 2], [3, 1, 2], [4, 1, 0]]) {
        const distance = distanceAt(col, row);
        artillery.enemies.push({ id, type: 'pesak', distance, ...pointAt(distance), health: 1000, maxHealth: 1000 });
    }
    const fire = artillery.tick(0.001).find(event => event.type === 'fire');
    assert.equal(fire.splash, 2, 'the explosion shown by the UI uses the upgraded blast radius');
    for (const [index, expected] of [27, 17.55, 9.45, 0].entries()) {
        closeTo(1000 - artillery.enemies[index].health, expected,
            'wide scatter deals full, 65% and 35% damage and stops at two hexes');
    }

    const reloading = movementFixture([], 'pavez');
    reloading.game.place(3, 3, 'houfnice'); grantTactic(reloading.game, 'reload');
    assert.ok(reloading.game.tick(0.001).some(event => event.type === 'fire'));
    let elapsed = 0, shot = false;
    while (!shot && elapsed < 2) {
        shot = reloading.game.tick(0.01).some(event => event.type === 'fire'); elapsed += 0.01;
    }
    assert.ok(shot && Math.abs(elapsed - 1.85 * 0.75) < 0.011, 'the next shot happens after the shortened reload');
    const inProgress = movementFixture([], 'pavez');
    inProgress.game.place(3, 3, 'houfnice'); inProgress.game.tick(0.01);
    const oldCooldown = inProgress.game.towers[0].cooldown;
    grantTactic(inProgress.game, 'reload');
    closeTo(inProgress.game.towers[0].cooldown, oldCooldown * 0.75, 'the perk shortens an existing reload too');
    reloading.game.reset();
    assert.equal(reloading.game.tactics.size, 0);
    assert.equal(reloading.game.pendingChoice, null);
    closeTo(reloading.game.towerStats({ type: 'houfnice', level: 1 }).cooldown, 1.85, 'perks do not leak into a new run');
}

{
    // Earn the first council with overlapping waves, freeze all simulation
    // clocks, and resume the unfinished attack after making a valid choice.
    const game = new Game(); game.camp = 1000;
    assert.equal(game.chooseTactic('powder'), false, 'unearned perks are rejected');
    game.startWave();
    for (let wave = 2; wave <= 3; wave++) {
        while (!game.canCallEarly()) game.tick(0.08);
        game.startWave();
    }
    const events = [];
    let ticks = 0;
    while (!game.pendingChoice && game.state === 'running' && ticks++ < 1200) events.push(...game.tick(0.08));
    assert.ok(ticks < 1200);
    assert.equal(game.pendingChoice.wave, 2);
    assert.equal(events.filter(event => event.type === 'choiceReady').length, 1);
    assert.equal(game.state, 'running');
    assert.ok(game.enemies.some(enemy => enemy.wave === 3));
    const before = JSON.stringify(game);
    assert.deepEqual(game.tick(10), []);
    assert.equal(JSON.stringify(game), before, 'time, enemies, economy and cooldowns freeze during the council');
    assert.equal(game.startWave(), null);
    assert.equal(game.activateChoral(), false);
    assert.equal(game.toggleBarricade('east'), false);
    assert.equal(game.chooseTactic('scatter'), false, 'only the offered pair can be selected');
    assert.equal(game.chooseTactic('powder'), true);
    assert.equal(game.chooseTactic('flails'), false, 'the alternative is unavailable for the rest of the run');
    const time = game.time; game.tick(0.08);
    assert.ok(game.time > time, 'the current wave resumes after the choice');
}

{
    const { game, enemy } = movementFixture([[2, 3, 1]]);
    game.place(3, 3, 'rucnicari'); game.tick(0.05);
    closeTo(game.metrics.units.rucnicari.damage, 11.88, 'the result counts actual supported damage');
    closeTo(game.metrics.supportDamage, 2.88, 'wagon contribution is only the additional damage');
    closeTo(game.metrics.slowedTime, 0.05, 'slowing time measures the real enemy movement step');
    enemy.health = 1; game.towerAt(3, 3).cooldown = 0; game.tick(0.05);
    closeTo(game.metrics.units.rucnicari.damage, 12.88, 'overkill never inflates the damage table');
    closeTo(game.metrics.supportDamage, 2.88, 'a shot that kills without support adds no extra contribution');
    assert.equal(game.metrics.units.rucnicari.kills, 1);
    assert.equal(game.kills, 1);
    game.sell(3, 3);
    assert.equal(game.summary().units.rucnicari.kills, 1, 'withdrawn units keep their contribution');
    const summary = game.summary(); summary.units.rucnicari.damage = -1; summary.tactics.push('fake');
    assert.ok(game.summary().units.rucnicari.damage > 0, 'reports are detached snapshots');
    assert.equal(game.tactics.has('fake'), false);
    const overlap = movementFixture([[2, 3, 1], [3, 3, 3]]);
    overlap.game.tick(0.05);
    closeTo(overlap.game.metrics.slowedTime, 0.05, 'overlapping wagons count each enemy only once');
    const hymn = movementFixture(); hymn.game.activateChoral(); hymn.game.tick(0.05);
    assert.equal(hymn.game.metrics.slowedTime, 0, 'wagons receive no credit for chorale alone');
    for (const [camp, grade] of [[20, 3], [19, 2], [10, 2], [9, 1]]) {
        game.state = 'won'; game.camp = camp; assert.equal(game.summary().grade, grade);
    }
    game.state = 'lost'; assert.equal(game.summary().grade, 0);
    game.reset(); assert.equal(game.summary().supportDamage, 0);
    assert.equal(game.summary().units.rucnicari.built, 0);
}

for (const detours of [false, true]) {
    // A mixed defense funded only by rewards wins with both sets of perks,
    // including buying both barricades in the second run.
    const game = new Game();
    const buildOrder = [
        ['houfnice', 3, 3], ['rucnicari', 4, 4], ['cepnici', 0, 5],
        ['rucnicari', 4, 1], ['cepnici', 3, 4], ['houfnice', 3, 6],
        ['rucnicari', 0, 2], ['cepnici', 5, 9], ['vuz', 2, 3],
        ['houfnice', 2, 7], ['cepnici', 4, 6], ['houfnice', 3, 7],
        ['houfnice', 2, 4], ['rucnicari', 0, 4], ['rucnicari', 6, 6],
        ['cepnici', 2, 9], ['houfnice', 5, 7]
    ];
    let next = 0;
    const buy = () => {
        if (detours && game.wave > 0 && game.state === 'ready') {
            for (const id of Object.keys(BARRICADES)) if (!game.barricades.has(id) && game.canToggleBarricade(id)) {
                game.toggleBarricade(id);
            }
        }
        while (next < buildOrder.length && game.gold >= DEFENSES[buildOrder[next][0]].cost) {
            const [type, col, row] = buildOrder[next++];
            assert.equal(game.place(col, row, type), true);
        }
    };
    buy();
    for (let wave = 1; wave <= WAVE_COUNT; wave++) {
        finishWave(game, buy, choice => choice.options[detours ? 1 : 0]);
        assert.ok(game.camp > 0, `camp must hold after wave ${wave}`);
    }
    assert.equal(game.state, 'won');
    assert.equal(next, buildOrder.length);
    assert.equal(game.tactics.size, 3, 'each of the three councils is earned and resolved');
    assert.equal(game.barricades.size, detours ? 2 : 0);
    const report = game.summary();
    assert.equal(Object.values(report.units).reduce((total, unit) => total + unit.kills, 0), game.kills,
        'every real kill appears exactly once in the contribution table');
    assert.equal(game.gold, START_GOLD + report.earned - report.spent + report.refunded,
        'report economy reconciles with the real wallet');
    assert.equal(game.startWave(), null);
}

const root = path.resolve(__dirname, '..');
const appDir = path.join(root, 'bonus/vozova-hradba');
const html = fs.readFileSync(path.join(appDir, 'index.html'), 'utf8');
for (const file of ['game.js', 'ui.js', 'style.css']) {
    assert.ok(fs.statSync(path.join(appDir, file)).isFile());
    assert.ok(html.includes(file), `${file} must be loaded by the game page`);
}
for (const file of ['js/data/unitTypes.js', 'js/ui/WoodcutRenderer.js']) {
    assert.ok(fs.statSync(path.join(root, file)).isFile());
    assert.ok(html.includes('../../' + file), `${file} must be shared with the main game`);
}
console.log('✓ Vozová hradba: hexy, návrší, průchodné objížďky, porady, účinky výhod, vozy a obě vítězné sestavy');
