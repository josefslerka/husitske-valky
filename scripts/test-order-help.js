#!/usr/bin/env node
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createLocalizedHarness } = require('./helpers/localized-harness');
const tests = [];
const test = (name, run) => tests.push({ name, run });

async function fixture(language = 'cs', browserView = false, type = 'CEPNICI') {
    const h = await createLocalizedHarness(language, { browserView });
    const game = h.newGame();
    const unit = game.unitFactory.createUnit(type, 4, 4);
    const ally = game.unitFactory.createUnit('CEPNICI', 1, 2);
    const enemy = game.unitFactory.createUnit('TEZKY_RYTIR', 6, 4);
    game.units = [unit, ally, enemy];
    for (const hex of game.hexGrid.hexes.values()) hex.terrain = 'plains';
    game.scheduleAI = () => {};
    return { h, game, unit, ally, enemy };
}

async function wagons(language = 'cs', browserView = false) {
    const f = await fixture(language, browserView, 'VOZOVA_HRADBA');
    f.line = [f.unit, ...[5, 6, 7].map(col => f.game.unitFactory.createUnit('VOZOVA_HRADBA', col, 4))];
    Object.assign(f.enemy, { col: 14, row: 8 });
    f.game.units = [...f.line, f.ally, f.enemy];
    return f;
}

const snapshot = game => JSON.stringify(game.units.map(unit => ({ id: unit.id, col: unit.col, row: unit.row,
    moved: unit.hasMoved, attacked: unit.hasAttacked, closed: unit.formationClosed, marching: unit.marching,
    health: unit.health, morale: unit.morale, routing: unit.isRouting, attempts: unit.rallyAttempts })));

test('rozevření i sepnutí jednoho vozu spotřebuje pohyb, ne výstřel', async () => {
    const { game, unit } = await wagons();
    assert.equal(unit.canMove(), false);
    assert.equal(game.toggleWagonFormation(unit), true);
    assert.equal(unit.formationClosed, false);
    assert.equal(unit.hasMoved, true);
    assert.equal(unit.hasAttacked, false);
    assert.equal(unit.canMove(), false, 'po rozevření se stejný tah samostatně nerozjede');
    assert.equal(unit.canAttack(), true);
    assert.equal(game.toggleWagonFormation(unit), false);
    unit.resetTurn();
    assert.equal(unit.canMove(), true);
    assert.equal(game.toggleWagonFormation(unit), true);
    assert.equal(unit.formationClosed, true);
    assert.equal(unit.hasMoved, true);
    assert.equal(unit.canAttack(), true);
    game.destroy();
});

test('Celá linie přejde přes použitý vůz, přeskočí jej i vůz už v cílovém stavu', async () => {
    const { game, unit, line } = await wagons();
    line[1].hasMoved = true;
    line[2].formationClosed = false;
    const enemyWagon = game.unitFactory.createUnit('VOZOVA_HRADBA', 8, 4);
    enemyWagon.faction = 'crusaders'; game.units.push(enemyWagon);
    assert.equal(game.connectedWagonLine(unit).length, 4);
    assert.equal(game.toggleWagonFormationLine(unit), true);
    assert.deepEqual(line.map(w => w.formationClosed), [false, true, false, false]);
    assert.deepEqual(line.map(w => w.hasMoved), [true, true, false, true]);
    assert.equal(line.some(w => w.hasAttacked), false);
    assert.equal(enemyWagon.formationClosed, true);
    assert.equal(game.toggleWagonFormationLine(unit), false, 'použitý výchozí vůz už rozkaz nevydá');
    game.destroy();
});

test('Pochod i zastavení jsou zdarma; zastavení obnoví kryt hned, ne pohyb', async () => {
    const { game, unit, ally, line } = await wagons();
    Object.assign(ally, game.hexGrid.getNeighborInDirection(unit.col, unit.row, 0));
    const cover = game.combatSystem.isBehindClosedWagon(ally);
    assert.equal(cover, 1);
    assert.equal(game.isInWagonLine(line[1]).defenseBonus, 10);
    assert.equal(game.toggleWagonMarch(unit), true);
    assert.equal(line.every(w => w.marching && !w.hasMoved && !w.hasAttacked), true);
    assert.equal(game.combatSystem.isBehindClosedWagon(ally), 0.5);
    assert.equal(game.isInWagonLine(line[1]).defenseBonus, 5);
    line[1].hasMoved = true;
    assert.equal(game.getWagonMarchTargets(unit).length, 0);
    assert.equal(game.toggleWagonMarch(unit), true);
    assert.equal(line.every(w => !w.marching), true);
    assert.equal(line[1].hasMoved, true);
    assert.equal(game.combatSystem.isBehindClosedWagon(ally), 1);
    assert.equal(game.isInWagonLine(line[1]).defenseBonus, 10);
    game.destroy();
});

test('samotný pochod posune všechny vozy o jeden hex a ponechá jim palbu', async () => {
    const { game, unit, line } = await wagons();
    const before = line.map(w => ({ col: w.col, row: w.row }));
    game.toggleWagonMarch(unit);
    const target = game.getWagonMarchTargets(unit)[0];
    const dir = Array.from({ length: 6 }, (_, d) => d).find(d => {
        const n = game.hexGrid.getNeighborInDirection(unit.col, unit.row, d);
        return n.col === target.col && n.row === target.row;
    });
    assert.equal(game.marchWagonLine(unit, dir), true);
    line.forEach((w, index) => {
        const expected = game.hexGrid.getNeighborInDirection(before[index].col, before[index].row, dir);
        assert.deepEqual([w.col, w.row], [expected.col, expected.row]);
        assert.equal(w.hasMoved, true);
        assert.equal(w.hasAttacked, false);
        assert.equal(w.canAttack(), true);
    });
    const after = snapshot(game);
    assert.equal(game.marchWagonLine(unit, dir), false);
    assert.equal(snapshot(game), after);
    game.destroy();
});

for (const obstacle of ['water', 'unit', 'edge']) {
    test(`překážka ${obstacle} zastaví celou pochodující skupinu bez spotřeby pohybu`, async () => {
        const { game, unit, line, ally } = await wagons();
        let dir = 0;
        if (obstacle === 'edge') {
            line.forEach(w => { w.row = 0; });
            dir = Array.from({ length: 6 }, (_, d) => d).find(d => {
                const n = game.hexGrid.getNeighborInDirection(line[1].col, line[1].row, d);
                return !game.hexGrid.inBounds(n.col, n.row);
            });
        } else {
            const n = game.hexGrid.getNeighborInDirection(line[1].col, line[1].row, dir);
            if (obstacle === 'water') game.hexGrid.setTerrain(n.col, n.row, 'water');
            else Object.assign(ally, n);
        }
        game.toggleWagonMarch(unit);
        const before = snapshot(game);
        assert.equal(game.marchWagonLine(unit, dir), false);
        assert.equal(snapshot(game), before);
        assert.equal(line.some(w => w.hasMoved), false);
        game.destroy();
    });
}

test('zamrzlá řeka je výjimka z vodní překážky pochodu', async () => {
    const { game, unit, line } = await wagons();
    const n = game.hexGrid.getNeighborInDirection(line[1].col, line[1].row, 0);
    game.hexGrid.setTerrain(n.col, n.row, 'water');
    game.currentScenario = { specialMechanics: { frozenRiver: true } };
    game.toggleWagonMarch(unit);
    assert.equal(game.marchWagonLine(unit, 0), true);
    game.destroy();
});

for (const [type, moveFirst, fireAllowed] of [
    ['HOUFNICE', true, false], ['HOUFNICE', false, true],
    ['TARASNICE', true, true], ['TARASNICE', false, true]
]) {
    test(`${type}: skutečné pořadí ${moveFirst ? 'pohyb → výstřel' : 'výstřel → pohyb'} odpovídá nápovědě`, async () => {
        const { h, game, unit, enemy } = await fixture('cs', false, type);
        const move = async () => {
            const action = game.moveUnit(unit, 4, 5);
            await h.advance(1000);
            assert.equal(await action, true);
        };
        if (moveFirst) await move();
        const attack = game.combatSystem.performAttack(unit, enemy);
        await h.advance(1000);
        assert.equal(await attack, fireAllowed);
        assert.equal(unit.hasAttacked, fireAllowed);
        if (!moveFirst) await move();
        assert.equal(unit.hasMoved, true);
        assert.equal(await game.combatSystem.performAttack(unit, enemy), false);
        game.destroy();
    });
}

test('nepohyblivá bombarda nemá pohyb; krytí pohyblivého děla spotřebuje obě akce', async () => {
    const { game, unit } = await fixture('cs', false, 'BOMBARDA');
    assert.equal(unit.movement, 0);
    assert.equal(game.getValidMoves(unit).length, 0);
    assert.equal(unit.canAttack(), true);
    const gun = game.unitFactory.createUnit('HOUFNICE', 5, 4);
    game.units.push(gun);
    gun.defend();
    assert.equal(gun.canMove(), false);
    assert.equal(gun.canAttack(), false);
    game.destroy();
});

async function routing(language = 'cs', browserView = false, type = 'CEPNICI') {
    const f = await fixture(language, browserView, type);
    f.unit.reduceMorale(f.unit.maxMorale, 'test');
    f.h.context.Math.random = () => 0.99;
    return f;
}

test('úspěšné zformování vrátí prchajícímu oddílu útok a nezapočítá ztrátu', async () => {
    const { h, game, unit } = await routing();
    assert.equal(unit.canAttack(), false);
    h.context.Math.random = () => 0;
    game.moraleSystem.processRoutingUnits();
    assert.equal(unit.isRouting, false);
    assert.equal(unit.canAttack(), true);
    assert.equal(unit.morale, 30);
    assert.equal(unit.rallyAttempts, 0);
    assert.equal(game.fledByFaction.hussites, 0);
    assert.equal(game.lossesByFaction.hussites, 0);
    assert.ok(game.log.some(line => line.message === h.i18n.t('gameLog.rallySuccess', { unit: unit.name })));
    game.destroy();
});

test('bonus skutečného velitele mění šanci na zformování, nápověda nevyvolá další hod', async () => {
    for (const withCommander of [false, true]) {
        const { h, game, unit } = await routing('cs', true);
        let rolls = 0;
        h.context.Math.random = () => { rolls++; return 0.4; };
        if (withCommander) game.units.push(game.unitFactory.createUnit('JAN_ZIZKA', 4, 5));
        game.updateUnitPanel(unit);
        game.view.tooltip.contentForHex({ col: unit.col, row: unit.row });
        assert.equal(rolls, 0, 'vysvětlení stavu pouze čte pravidla');
        game.moraleSystem.processRoutingUnits();
        assert.equal(unit.isRouting, !withCommander);
        assert.equal(rolls, 1);
        game.destroy();
    }
});

test('dva neúspěchy dovolí ústup; třetí zpracování dezertuje uvnitř mapy bez dalšího hodu', async () => {
    const { h, game, unit, enemy } = await routing();
    let rolls = 0;
    h.context.Math.random = () => { rolls++; return 0.99; };
    for (let attempt = 1; attempt <= 2; attempt++) {
        const oldDistance = game.hexGrid.getDistance(unit.col, unit.row, enemy.col, enemy.row);
        game.moraleSystem.processRoutingUnits();
        assert.equal(unit.rallyAttempts, attempt);
        assert.ok(unit.health > 0);
        assert.ok(game.hexGrid.getDistance(unit.col, unit.row, enemy.col, enemy.row) > oldDistance);
    }
    assert.ok(unit.col > 0 && unit.row > 0);
    game.moraleSystem.processRoutingUnits();
    assert.equal(rolls, 2);
    assert.equal(unit.health, 0);
    assert.equal(unit.escaped, true);
    assert.equal(game.fledByFaction.hussites, 1);
    assert.equal(game.lossesByFaction.hussites, 0);
    assert.equal(game.log.at(-1).message, h.i18n.t('gameLog.unitDeserted', { unit: unit.name }));
    game.destroy();
});

for (const success of [false, true]) {
    test(`oddíl na okraji při ${success ? 'úspěšném zformování zůstane bojovat' : 'neúspěchu uprchne, ne dezertuje'}`, async () => {
        const { h, game, unit } = await routing();
        unit.col = 0;
        h.context.Math.random = () => success ? 0 : 0.99;
        game.moraleSystem.processRoutingUnits();
        assert.equal(unit.health > 0, success);
        assert.equal(game.fledByFaction.hussites, success ? 0 : 1);
        if (!success) {
            assert.equal(unit.escaped, true);
            assert.equal(game.log.at(-1).message, h.i18n.t('gameLog.unitFledBattlefield', { unit: unit.name }));
            assert.equal(game.log.some(line => line.message.includes(h.i18n.t('gameLog.unitDeserted', { unit: unit.name }))), false);
        }
        game.destroy();
    });
}

for (const type of ['HOUFNICE', 'POLNI_OPEVNENI']) {
    test(`${type} při neúspěšném zformování nemůže automaticky ustoupit a je zničen`, async () => {
        const { h, game, unit } = await routing('cs', false, type);
        game.moraleSystem.processRoutingUnits();
        assert.equal(unit.health, 0);
        assert.equal(!!unit.escaped, false);
        assert.equal(game.lossesByFaction.hussites, 1);
        assert.equal(game.fledByFaction.hussites, 0);
        assert.ok(game.log.some(line => line.message === h.i18n.t('gameLog.unitTrapped', { unit: unit.name })));
        assert.equal(game.log.some(line => line.message.includes('stále prchá')), false);
        game.destroy();
    });
}

test('zablokovaný ústup obyčejný oddíl nezničí', async () => {
    const { game, unit } = await routing();
    for (const n of game.hexGrid.getNeighbors(unit.col, unit.row)) game.hexGrid.setTerrain(n.col, n.row, 'water');
    const position = [unit.col, unit.row], health = unit.health;
    game.moraleSystem.processRoutingUnits();
    assert.deepEqual([unit.col, unit.row], position);
    assert.equal(unit.health, health);
    assert.equal(unit.rallyAttempts, 1);
    game.destroy();
});

test('automatické zformování probíhá až na začátku vlastního tahu', async () => {
    const { h, game, unit } = await routing();
    h.context.Math.random = () => 0;
    game.endTurn();
    assert.equal(game.currentFaction, 'crusaders');
    assert.equal(unit.isRouting, true);
    assert.equal(unit.rallyAttempts, 0);
    game.endTurn();
    assert.equal(game.currentFaction, 'hussites');
    assert.equal(unit.isRouting, false);
    assert.equal(unit.canAttack(), true);
    game.destroy();
});

for (const language of ['cs', 'en']) {
    test(`${language}: popisky vozů odpovídají stavu i počtu a rozbalovací nápověda nemění rozkazy`, async () => {
        const { h, game, unit, line, ally } = await wagons(language, true);
        line[1].hasMoved = true; line[2].formationClosed = false;
        game.updateUnitPanel(unit);
        const before = snapshot(game);
        const get = id => h.document.getElementById(id);
        assert.equal(get('wagon-order-help').classList.contains('hidden'), false);
        assert.equal(get('btn-formation').title, h.i18n.t('game.wagonOrders.openHint'));
        assert.equal(get('wagon-line-help').textContent, h.i18n.t('game.wagonOrders.lineHint', {
            count: 4, eligible: 2, state: h.i18n.t('game.wagonOrders.openState') }));
        get('wagon-order-help').open = true;
        game.updateUnitPanel(unit);
        assert.equal(get('wagon-order-help').open, true);
        assert.equal(snapshot(game), before);
        game.updateUnitPanel(ally);
        assert.equal(get('wagon-order-help').classList.contains('hidden'), true);
        assert.equal(get('formation-explanation').classList.contains('hidden'), true);
        assert.equal(get('wagon-order-help').open, false);
        game.updateUnitPanel(unit);
        game.toggleWagonMarch(unit);
        assert.equal(get('btn-formation-march').title, h.i18n.t('game.wagonOrders.stopHint'));
        assert.equal(get('formation-explanation').textContent, h.i18n.t('game.wagonOrders.marching'));
        game.destroy();
    });

    test(`${language}: houfnice, mobilní tarasnice a nepohyblivá bombarda mají správnou kartu`, async () => {
        const { h, game } = await fixture(language, true);
        for (const [type, kind] of [['HOUFNICE', 'normal'], ['TARASNICE', 'mobile'], ['BOMBARDA', 'fixed']]) {
            const gun = game.unitFactory.createUnit(type, 2, 4);
            game.units.push(gun);
            const before = snapshot(game);
            game.updateUnitPanel(gun);
            assert.ok(h.document.getElementById('unit-info').innerHTML.includes(h.i18n.t('game.artilleryOrders.' + kind)));
            assert.equal(snapshot(game), before);
        }
        game.destroy();
    });

    test(`${language}: detail i tooltip vysvětlí zbývající pokusy a nemožnost automatického ústupu`, async () => {
        const { h, game, unit } = await routing(language, true);
        for (let attempt = 0; attempt <= 2; attempt++) {
            unit.rallyAttempts = attempt;
            game.updateUnitPanel(unit);
            const text = attempt < 2 ? h.i18n.t('game.routingDetails.attempts', { count: 2 - attempt })
                : h.i18n.t('game.routingDetails.desertionDue');
            assert.ok(h.document.getElementById('unit-info').innerHTML.includes(text));
            assert.ok(game.view.tooltip.contentForHex({ col: unit.col, row: unit.row }).includes(text));
        }
        const gun = game.unitFactory.createUnit('HOUFNICE', 3, 4);
        gun.isRouting = true; game.units.push(gun);
        game.updateUnitPanel(gun);
        assert.ok(h.document.getElementById('unit-info').innerHTML.includes(h.i18n.t('game.routingDetails.noRetreat')));
        game.destroy();
    });

    test(`${language}: pravidla používají tytéž lokalizované texty bez zavádějící volby buď pohyb, nebo palba`, async () => {
        const h = await createLocalizedHarness(language);
        vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/i18n/encyclopediaRenderer.js'), 'utf8'), h.context);
        vm.runInContext('renderRulesTab()', h.context);
        const html = h.document.getElementById('tab-rules').innerHTML;
        for (const key of ['artillery', 'wagonSingle', 'wagonLine', 'wagonMarch', 'wagonLineBonus', 'routing', 'routingEscape', 'routingDesertion', 'routingNoRetreat']) {
            assert.ok(html.includes(h.i18n.t('help.mechanics.' + key)), key);
        }
        assert.doesNotMatch(html, /game\.routingDetails|help\.mechanics\.|either move or attack|buď pohyb, nebo útok/);
    });
}

test('živé přepnutí CS/EN zachová otevření nápovědy i akce vozů', async () => {
    const { h, game, unit } = await wagons('cs', true);
    game.selectedUnit = unit; h.context.window.game = game;
    game.updateUnitPanel(unit);
    h.document.getElementById('wagon-order-help').open = true;
    const before = snapshot(game);
    await h.i18n.setLanguage('en');
    assert.equal(snapshot(game), before);
    assert.equal(h.document.getElementById('wagon-order-help').open, true);
    assert.equal(h.document.getElementById('btn-formation').title, h.i18n.t('game.wagonOrders.openHint'));
    assert.equal(h.document.getElementById('wagon-line-help').textContent.includes('{'), false);
    game.destroy();
});

test('živé přepnutí CS/EN zachová zbývající pokusy i rozpracované akce prchajícího oddílu', async () => {
    const { h, game, unit } = await routing('cs', true);
    unit.rallyAttempts = 1; unit.hasMoved = true;
    game.selectedUnit = unit; h.context.window.game = game;
    game.updateUnitPanel(unit);
    const before = snapshot(game);
    await h.i18n.setLanguage('en');
    assert.equal(snapshot(game), before);
    assert.ok(h.document.getElementById('unit-info').innerHTML.includes(h.i18n.t('game.routingDetails.attempts', { count: 1 })));
    assert.equal(h.document.getElementById('btn-attack').disabled, true);
    game.destroy();
});

test('prchající skrytý nepřítel neprozradí stav ani zbývající pokusy tooltipem', async () => {
    const { game, enemy } = await fixture('cs', true);
    enemy.col = 15; enemy.row = 9; enemy.isRouting = true; enemy.rallyAttempts = 1;
    game.fogOfWar = true; game.fogOfWarSystem.updateVisibility();
    assert.equal(game.fogOfWarSystem.isEnemyVisible(enemy), false);
    const html = game.view.tooltip.contentForHex({ col: enemy.col, row: enemy.row });
    assert.equal(html, '');
    game.destroy();
});

test('scénářové bez milosti je popsáno pouze tam a tehdy, kde skutečně platí', async () => {
    const { h, game, unit } = await routing('cs', true);
    unit.faction = 'crusaders';
    game.currentScenario = { playerFaction: 'hussites', specialMechanics: { noQuarterGiven: {
        activeFromTurn: 3, requiresEvent: 'trap', area: { minCol: 3, maxCol: 5, minRow: 3, maxRow: 5 }
    } } };
    const expected = h.i18n.t('game.routingDetails.noQuarter');
    assert.notEqual(game.view.panels.routingExplanation(unit), expected);
    game.turnNumber = 3;
    assert.notEqual(game.view.panels.routingExplanation(unit), expected);
    game.processedEvents.add('trap');
    assert.equal(game.view.panels.routingExplanation(unit), expected);
    unit.col = 8;
    assert.notEqual(game.view.panels.routingExplanation(unit), expected);
    game.destroy();
});

test('nové popisky jsou propojené s tlačítky a dostupné nativním details bez hoveru', () => {
    const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
    for (const [button, description] of [['btn-formation', 'wagon-single-help'],
        ['btn-formation-line', 'wagon-line-help'], ['btn-formation-march', 'wagon-march-help']]) {
        assert.ok(html.includes(`id="${button}" class="hidden" aria-describedby="${description}"`));
        assert.ok(html.includes(`id="${description}"`));
    }
    assert.match(html, /<details id="wagon-order-help"[\s\S]*?<summary data-i18n="game\.wagonOrders\.title"/);
    const css = fs.readFileSync(path.join(__dirname, '../styles/field-theme.css'), 'utf8');
    assert.match(css, /#unit-panel:has\(\.wagon-order-help\[open\]\) #unit-info\s*\{\s*flex: none;\s*overflow: visible;/,
        'rozbalená nápověda nesmí nechat detail jednotky vysoký nula pixelů ani na desktopu');
});

(async () => {
    let failed = 0;
    for (const { name, run } of tests) {
        try { await run(); console.log(`✓ ${name}`); }
        catch (error) { failed++; console.error(`✗ ${name}\n${error.stack}`); }
    }
    console.log(`\n${tests.length - failed}/${tests.length} testů rozkazů a nápovědy.`);
    process.exitCode = failed ? 1 : 0;
})();
