#!/usr/bin/env node
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createHarness } = require('./helpers/game-harness');
const { createLocalizedHarness } = require('./helpers/localized-harness');
const { menuHarness } = require('./helpers/menu-harness');
const tests = [];
const test = (name, run) => tests.push({ name, run });
const plain = value => JSON.parse(JSON.stringify(value));
const state = game => JSON.stringify({ units: game.units.map(unit => unit.serialize()),
    turn: game.turnNumber, faction: game.currentFaction, events: [...game.processedEvents],
    log: game.log, fog: [...game.visibleHexes] });

async function fixture(language = 'cs', browserView = true) {
    const h = await createLocalizedHarness(language, { browserView });
    const game = h.newGame('zivohost_1419');
    h.context.window.game = game;
    const panels = browserView ? game.view.panels : new h.BattlePanels(game);
    return { h, game, panels, el: id => h.document.getElementById(id),
        original: game.units.filter(unit => unit.faction === 'hussites') };
}

function movementCosts(el) {
    return Object.fromEntries(el('movement-costs').children.map(row =>
        [row.dataset.terrain, row.children[1].textContent]));
}

test('Živohošť zachovává 8 původních oddílů, 40 %, 5 kol i posily v 5. kole', () => {
    const h = createHarness(), game = h.newGame('zivohost_1419');
    assert.equal(game.initialPlayerUnits, 8);
    assert.equal(game.currentScenario.victoryConditions.primary.minUnitsPercent, 40);
    assert.equal(game.currentScenario.victoryConditions.primary.turns, 5);
    assert.equal(game.currentScenario.maxTurns, 10, 'prezentační deadline nemění data scénáře');
    assert.equal(game.currentScenario.forces.hussites.reinforcements.turn, 5);
    assert.equal(game.currentScenario.forces.hussites.reinforcements.units.length, 9);
    assert.deepEqual(plain(game.victoryConditionsSystem.getSurvivalProgress()), {
        alive: 8, total: 8, minPercent: 40, turns: 5, minimum: 4, percent: 100, completedTurns: 0
    });
    game.destroy();
});

for (const language of ['cs', 'en']) {
    test(`${language}: briefing a hlavní cíl uvádějí minimum před prvním tahem`, async () => {
        const h = await menuHarness(language, h => { h.BattleView.prototype.render = () => {}; });
        const el = id => h.document.getElementById(id);
        el('btn-first-battle').dispatchEvent(new Event('click'));
        const briefing = el('mission-briefing').textContent;
        const goal = el('mission-objectives-list').children[0].textContent;
        for (const text of [briefing, goal]) {
            assert.match(text, /40\s*%/);
            for (const count of ['4', '5', '8']) assert.ok(text.includes(count));
        }
        assert.match(briefing, language === 'cs' ? /posily.*nezapočítávají/i : /Reinforcements.*do not count/);
        assert.match(briefing, language === 'cs' ? /prchání nepřítele/ : /Routing the enemy/);
        assert.equal(el('mission-controls').open, true);
        assert.match(h.i18n.t('onboarding.movementStep'), language === 'cs' ? /body, ne počet polí/ : /points, not tiles/);
    });

    test(`${language}: kopec je určen názvem, nikoli zelenou barvou terénu`, async () => {
        const f = await fixture(language);
        const tip = f.game.currentScenario.phases[0].events[1].text;
        assert.ok(tip.includes('Červenka'));
        assert.match(tip, language === 'cs' ? /vpravo na mapě/ : /right of the map/);
        assert.match(tip, language === 'cs' ? /nikoli druh terénu/ : /not a terrain type/);
        const hill = f.game.hexGrid.mapLabels.find(label => label.text === 'Červenka');
        assert.ok(hill.hexes.every(([col, row]) => f.game.hexGrid.getTerrain(col, row) === 'hills'));
        assert.doesNotMatch(tip, /Přesuňte je na zelená pole|Move them to green fields/);
        f.game.destroy();
    });

    test(`${language}: živé počítadlo ignoruje posily, ukáže ztráty a neukončí bitvu předčasně`, async () => {
        const f = await fixture(language);
        f.panels.updateUI();
        assert.equal(f.el('survival-hud').classList.contains('hidden'), false);
        assert.equal(f.el('survival-hud').textContent,
            f.h.i18n.t('game.survival.counts', { alive: 8, total: 8, minimum: 4 }));
        assert.match(f.el('turn-number').textContent, /1\/5$/);
        assert.match(f.el('primary-objective').textContent, /40\s*%/);
        f.original.slice(3).forEach(unit => { unit.health = 0; });
        f.game.turnNumber = 5;
        f.game.checkReinforcements();
        assert.equal(f.game.units.filter(unit => unit.faction === 'hussites' && unit.isReinforcement).length, 9);
        f.panels.updateUI();
        assert.equal(f.el('survival-hud').textContent,
            f.h.i18n.t('game.survival.counts', { alive: 3, total: 8, minimum: 4 }));
        assert.equal(f.el('survival-hud').classList.contains('survival-at-risk'), true);
        assert.match(f.el('survival-turns').textContent, /4\/5/);
        f.game.currentFaction = 'crusaders';
        f.panels.updateUI();
        assert.match(f.el('survival-turns').textContent, /4\/5/, 'nepřátelský tah ještě není dokončené kolo');
        assert.equal(f.game.gameState, 'playing');
        f.game.destroy();
    });

    test(`${language}: pohyb ukazuje skutečné ceny pěchoty i jízdy a spotřebovaný přesun`, async () => {
        const f = await fixture(language);
        for (const type of ['CEPNICI', 'JIZDA_HUSITI']) {
            const unit = f.original.find(candidate => candidate.type === type);
            f.game.selectUnit(unit);
            assert.equal(f.el('movement-help').classList.contains('hidden'), false);
            const costs = movementCosts(f.el);
            for (const terrain of ['plains', 'road', 'hills', 'slope', 'forest', 'mud', 'swamp']) {
                assert.equal(costs[terrain], String(f.game.getTerrainMoveCost(terrain, unit)));
            }
            assert.equal(costs.hills, '2');
            assert.equal(costs.forest, type === 'CEPNICI' ? '2' : '3');
            assert.equal(costs.swamp, type === 'CEPNICI' ? '3' : '4');
            assert.equal(costs.water, f.h.i18n.t('tooltip.impassable'));
            assert.equal(f.el('movement-state').textContent, f.h.i18n.t('help.movement.ready'));
            unit.hasMoved = true;
            f.game.updateUnitPanel(unit);
            assert.equal(f.el('movement-state').textContent, f.h.i18n.t('help.movement.spent'));
            assert.equal(f.el('movement-standard').classList.contains('hidden'), false);
        }
        f.game.destroy();
    });

    test(`${language}: tooltip rozlišuje cenu vstupu od trasy a sdílí pohyb s pravidly`, async () => {
        const f = await fixture(language);
        const unit = f.original.find(candidate => candidate.type === 'CEPNICI');
        f.game.selectUnit(unit);
        const hex = { col: 13, row: 6 };
        const expected = f.h.i18n.t('help.movement.entryCost', { unit: unit.name, cost: 2 });
        assert.ok(f.game.view.tooltip.contentForHex(hex).includes(expected));
        f.game.currentScenario.specialMechanics = { frozenRiver: true };
        f.panels.updateMovementHelp(unit);
        assert.equal(movementCosts(f.el).water, '1');
        vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/i18n/encyclopediaRenderer.js'), 'utf8'), f.h.context);
        vm.runInContext('renderRulesTab()', f.h.context);
        const rules = f.el('tab-rules').innerHTML;
        for (const key of ['movement', 'movementExample', 'movementBlocks', 'movementStep']) {
            assert.ok(rules.includes(f.h.i18n.t('help.mechanics.' + key)), key);
        }
        f.game.destroy();
    });
}

test('hranice výsledku se nemění: 3 původní oddíly prohrají, 4 vyhrají až po 5 celých kolech', () => {
    for (let alive = 0; alive <= 8; alive++) {
        const h = createHarness(), game = h.newGame('zivohost_1419');
        game.units.filter(unit => unit.faction === 'hussites').slice(alive).forEach(unit => { unit.health = 0; });
        game.turnNumber = 5;
        game.checkReinforcements();
        game.units.filter(unit => unit.faction === 'crusaders').forEach(unit => { unit.isRouting = true; });
        game.victoryConditionsSystem.checkScenarioVictoryConditions();
        assert.equal(game.gameState, 'playing', 'nevyhodnocovat před posledním nepřátelským tahem');
        game.turnNumber = 6;
        game.victoryConditionsSystem.checkScenarioVictoryConditions();
        assert.equal(game.view.result.isVictory, alive >= 4, `${alive}/8 původních oddílů`);
        assert.equal(game.view.result.stats.turns, 5);
        game.destroy();
    }
});

test('úplné vyřazení protivníka dál dovoluje původní dřívější vítězství', () => {
    const h = createHarness(), game = h.newGame('zivohost_1419');
    game.units.filter(unit => unit.faction === 'hussites').slice(3).forEach(unit => { unit.health = 0; });
    game.units.filter(unit => unit.faction === 'crusaders').forEach(unit => { unit.health = 0; });
    game.turnNumber = 3;
    game.victoryConditionsSystem.checkVictory();
    assert.equal(game.view.result.isVictory, true);
    assert.match(game.view.result.stats.reason, /reasonEnemyDestroyed/);
    game.destroy();
});

test('přežití počítá oddíly, nikoli součet HP', async () => {
    const f = await fixture();
    f.original.slice(4).forEach(unit => { unit.health = 0; });
    f.original.slice(0, 4).forEach(unit => { unit.health = 1; });
    f.panels.updateSurvivalObjective();
    assert.equal(f.game.victoryConditionsSystem.getSurvivalProgress().percent, 50);
    assert.equal(f.el('survival-hud').classList.contains('survival-at-risk'), false);
    f.game.destroy();
});

test('save/load a změna jazyka zachovají počty, pohyb i otevřenou nápovědu', async () => {
    const f = await fixture();
    const unit = f.original.find(candidate => candidate.type === 'CEPNICI');
    f.game.selectUnit(unit);
    f.el('movement-help').open = true;
    f.original.slice(4).forEach(unit => { unit.health = 0; });
    f.game.turnNumber = 5;
    f.game.checkReinforcements();
    const before = state(f.game);
    await f.h.i18n.setLanguage('en');
    assert.equal(state(f.game), before);
    assert.equal(f.el('movement-help').open, true);
    assert.equal(f.el('survival-hud').textContent, 'Original units: 4/8 · minimum 4');
    assert.equal(f.game.saveGame(), true);
    const restored = f.h.SaveGameSystem.load(f.h.document.getElementById('game-canvas'), f.game);
    assert.equal(restored.victoryConditionsSystem.getSurvivalProgress().alive, 4);
    assert.equal(restored.victoryConditionsSystem.getSurvivalProgress().total, 8);
    assert.equal(f.el('survival-hud').textContent, 'Original units: 4/8 · minimum 4');
    restored.destroy();
});

test('jiná bitva a Quick Battle nezdědí počítadlo Živohoště', async () => {
    const f = await fixture();
    f.game.destroy();
    for (const id of ['sudomere_1420', 'most_1421', null]) {
        const game = f.h.newGame(id);
        assert.equal(f.el('survival-hud').classList.contains('hidden'), true);
        assert.equal(f.el('survival-objective').classList.contains('hidden'), true);
        assert.equal(f.el('survival-hud').textContent, '');
        game.destroy();
    }
});

test('nepohyblivé dělo a sepnuté vozy neslibují běžný přesun za body', async () => {
    const f = await fixture();
    const gun = f.game.unitFactory.createUnit('BOMBARDA', 1, 1);
    f.panels.updateMovementHelp(gun);
    assert.equal(f.el('movement-state').textContent, f.h.i18n.t('help.movement.fixed'));
    assert.equal(f.el('movement-standard').classList.contains('hidden'), true);
    const wagon = f.game.unitFactory.createUnit('VOZOVA_HRADBA', 2, 2);
    wagon.formationClosed = true;
    f.panels.updateMovementHelp(wagon);
    assert.equal(f.el('movement-state').textContent, f.h.i18n.t('help.movement.linked'));
    wagon.marching = true;
    f.panels.updateMovementHelp(wagon);
    assert.equal(f.el('movement-state').textContent, f.h.i18n.t('help.movement.group'));
    assert.equal(f.el('movement-standard').classList.contains('hidden'), true);
    wagon.hasMoved = true;
    f.panels.updateMovementHelp(wagon);
    assert.equal(f.el('movement-state').textContent, f.h.i18n.t('help.movement.spent'));
    f.game.deselectUnit();
    assert.equal(f.el('movement-help').classList.contains('hidden'), true);
    f.game.destroy();
});

test('nápověda nemění stav ani nečte skryté nepřátelské pozice', async () => {
    const f = await fixture();
    const unit = f.original.find(candidate => candidate.type === 'CEPNICI');
    const before = state(f.game);
    f.h.context.Math.random = () => { throw new Error('nápověda nesmí losovat'); };
    f.game.getUnitAt = () => { throw new Error('nápověda nesmí zkoumat obsazení'); };
    for (let i = 0; i < 3; i++) {
        f.panels.updateSurvivalObjective();
        f.panels.updateMovementHelp(unit);
    }
    assert.equal(state(f.game), before);
    f.game.destroy();
});

test('cena v tooltipu neprozradí nepřítele na prozkoumaném, ale neviditelném poli', async () => {
    const f = await fixture();
    const unit = f.original.find(candidate => candidate.type === 'CEPNICI');
    f.game.selectUnit(unit);
    f.game.fogOfWar = true;
    f.game.visibleHexes = new Set();
    f.game.exploredHexes = new Set(['7,7']);
    const enemy = f.game.unitFactory.createUnit('TEZKY_RYTIR', 7, 7);
    f.game.units.push(enemy);
    const hidden = f.game.view.tooltip.contentForHex({ col: 7, row: 7 });
    assert.ok(hidden.includes('tooltip-movement'));
    assert.ok(!hidden.includes(enemy.name));
    f.game.units = f.game.units.filter(candidate => candidate !== enemy);
    assert.equal(f.game.view.tooltip.contentForHex({ col: 7, row: 7 }), hidden);
    assert.equal(f.game.view.tooltip.contentForHex({ col: 7, row: 6 }), '');
    f.game.destroy();
});

function corridor() {
    const h = createHarness(), game = h.newGame();
    const unit = game.unitFactory.createUnit('CEPNICI', 3, 6);
    const enemy = game.unitFactory.createUnit('KOPINICI', 10, 8);
    game.units = [unit, enemy];
    for (const hex of game.hexGrid.hexes.values()) game.hexGrid.setTerrain(hex.col, hex.row, 'water');
    for (const row of [6, 5, 4]) game.hexGrid.setTerrain(3, row, 'plains');
    const reaches = (col, row) => game.getValidMoves(unit).some(hex => hex.col === col && hex.row === row);
    return { h, game, unit, enemy, reaches };
}

test('příklad 2 bodů, kopec a garantovaný krok odpovídají skutečnému pohybu', async () => {
    const f = corridor();
    assert.equal(f.unit.movement, 2);
    assert.equal(f.reaches(3, 4), true, 'dvě pláně za dva body');
    f.game.hexGrid.setTerrain(3, 5, 'hills');
    assert.equal(f.reaches(3, 5), true);
    assert.equal(f.reaches(3, 4), false, 'kopec spotřebuje dva body');
    f.unit.movement = 1;
    f.game.hexGrid.setTerrain(3, 5, 'swamp');
    assert.equal(f.reaches(3, 5), true, 'garantovaný krok do dražšího terénu');
    assert.equal(f.reaches(3, 4), false);
    const moving = f.game.moveUnit(f.unit, 3, 5);
    await f.h.advance(600);
    assert.equal(await moving, true);
    assert.equal(f.unit.hasMoved, true);
    assert.equal(f.game.getValidMoves(f.unit).length, 0);
    f.game.destroy();
});

test('spojenci, nepřátelé a zóna kontroly odpovídají vysvětleným překážkám', () => {
    const f = corridor();
    const ally = f.game.unitFactory.createUnit('CEPNICI', 3, 5);
    f.game.units.push(ally);
    assert.equal(f.reaches(3, 5), false, 'na spojenci nesmí skončit');
    assert.equal(f.reaches(3, 4), true, 'spojencem lze projít');
    ally.faction = 'crusaders';
    assert.equal(f.reaches(3, 4), false, 'nepřítelem nelze projít');
    f.game.units = [f.unit, f.enemy];
    Object.assign(f.enemy, { col: 4, row: 5 });
    f.game.hexGrid.setTerrain(4, 5, 'plains');
    assert.equal(f.reaches(3, 5), true);
    assert.equal(f.reaches(3, 4), false, 'zóna kontroly zastaví další průchod');
    f.game.destroy();
});

(async () => {
    let failed = 0;
    for (const { name, run } of tests) {
        try { await run(); console.log(`✓ ${name}`); }
        catch (error) { failed++; console.error(`✗ ${name}\n${error.stack}`); }
    }
    console.log(`\n${tests.length - failed}/${tests.length} testů zaučení Živohoště.`);
    if (failed) process.exitCode = 1;
})();
