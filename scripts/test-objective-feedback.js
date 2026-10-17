#!/usr/bin/env node
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { createLocalizedHarness } = require('./helpers/localized-harness');
const { scenarioGameplay } = require('./helpers/scenario-gameplay');
const tests = [];
const test = (name, run) => tests.push({ name, run });
const targets = {
    horice_1423: [[8, 5], [9, 5], [10, 5], [11, 5]],
    malesov_1424: [[7, 3], [8, 3], [9, 3], [10, 3]],
    domazlice_1431: [[16, 6], [17, 6]]
};
async function fixture(id = 'horice_1423', language = 'cs') {
    const h = await createLocalizedHarness(language, { browserView: true }), game = h.newGame(id);
    const players = Array.from({ length: 4 }, (_, i) => game.unitFactory.createUnit('CEPNICI', i + 1, 10));
    const enemy = game.unitFactory.createUnit('KOPINICI', 0, 0);
    game.units = [...players, enemy];
    const occupy = points => {
        players.forEach((unit, i) => Object.assign(unit, { col: i + 1, row: 10, health: unit.maxHealth, escaped: false, faction: 'hussites' }));
        points.forEach(([col, row], i) => Object.assign(players[i], { col, row }));
    };
    return { h, game, players, enemy, occupy, system: game.victoryConditionsSystem };
}
const state = game => JSON.stringify({ units: game.units.map(u => u.serialize()), faction: game.currentFaction,
    turn: game.turnNumber, events: [...game.processedEvents], counters: game.objectiveHeldTurns });

for (const language of ['cs', 'en']) {
    for (const [id, positions] of Object.entries(targets)) {
        test(`${language}: ${id} označuje přesná pole a panel, tooltip i výsledek sdílejí stejný počet`, async () => {
            const f = await fixture(id, language), { game, h, system } = f;
            const objective = game.currentScenario.victoryConditions.secondary[0];
            assert.deepEqual(JSON.parse(JSON.stringify(objective.positions)), positions);
            assert.deepEqual(Array.from(game.hexGrid.secondaryObjectiveHexes, p => [p.col, p.row]), positions);
            assert.equal(system.getSecondaryPositionProgress()[0].required, 2);
            f.occupy(positions.slice(0, 1));
            const before = state(game);
            game.view.panels.updateObjectiveProgress();
            const row = h.document.getElementById('secondary-objectives').children[0];
            const expected = h.i18n.t('game.optionalPositionProgress', { captured: 1, total: positions.length, required: 2 });
            assert.equal(row.children[1].children[0].textContent, objective.description);
            assert.equal(row.children[1].children[1].textContent, expected);
            assert.equal(row.children[1].children[2].textContent, h.i18n.t('game.optionalPositionHint'));
            assert.ok(game.view.tooltip.contentForHex({ col: positions[0][0], row: positions[0][1] }).includes(expected));
            assert.equal(state(game), before, 'prezentace nemění pravidla');
            system.evaluateSecondaryConditions('hussites'); assert.equal(game.secondaryResults[0].achieved, false);
            f.occupy(positions.slice(0, 2));
            system.evaluateSecondaryConditions('hussites'); assert.equal(game.secondaryResults[0].achieved, true);
            let result;
            h.context.window.showGameOver = (isVictory, message, stats) => { result = { isVictory, stats }; };
            game.showVictory('hussites');
            assert.equal(result.isVictory, true);
            assert.equal(result.stats.secondaryObjectives[0].achieved, true);
            assert.equal(game.secondaryResults[0].description, objective.description);
            game.destroy();
        });
    }
}

test('obsazení pouze tří geograficky pojmenovaných polí Gothardu nestačí', async () => {
    const f = await fixture();
    f.occupy(f.game.currentScenario.mapLabels.find(label => label.text === 'Gothard').hexes);
    assert.equal(f.system.getSecondaryPositionProgress()[0].captured, 1);
    f.system.evaluateSecondaryConditions('hussites'); assert.equal(f.game.secondaryResults[0].achieved, false);
    f.game.destroy();
});

test('Hořice a Malešov dovolí pozici opustit a před výhrou znovu obsadit pěchotou', async () => {
    for (const id of ['horice_1423', 'malesov_1424']) {
        const f = await fixture(id);
        f.occupy(targets[id].slice(0, 2)); f.system.evaluateSecondaryConditions('hussites');
        assert.equal(f.game.secondaryResults[0].achieved, true);
        f.occupy([]); f.system.evaluateSecondaryConditions('hussites'); assert.equal(f.game.secondaryResults[0].achieved, false);
        f.occupy(targets[id].slice(2, 4)); f.system.evaluateSecondaryConditions('hussites');
        assert.equal(f.game.secondaryResults[0].achieved, true); f.game.destroy();
    }
});

test('jiný kopec Malešova nebo druhá řada města Domažlice nenahradí označená pole', async () => {
    for (const [id, positions] of [['malesov_1424', [[8, 3], [9, 4]]], ['domazlice_1431', [[16, 7], [17, 7]]]]) {
        const f = await fixture(id); f.occupy(positions); f.system.evaluateSecondaryConditions('hussites');
        assert.equal(f.game.secondaryResults[0].achieved, false); f.game.destroy();
    }
});

test('mrtví, uprchlí, protivníci a prázdné definice se za obsazení nepočítají', async () => {
    for (const alter of [unit => { unit.health = 0; }, unit => { unit.escaped = true; }, unit => { unit.faction = 'crusaders'; }]) {
        const f = await fixture(); f.occupy(targets.horice_1423.slice(0, 2)); alter(f.players[0]);
        assert.equal(f.system.getSecondaryPositionProgress()[0].captured, 1);
        f.system.evaluateSecondaryConditions('hussites'); assert.equal(f.game.secondaryResults[0].achieved, false);
        f.game.destroy();
    }
    const f = await fixture();
    for (const type of ['hold_position', 'capture_position']) {
        assert.equal(f.system.getPositionObjectiveProgress({ type, positions: [] }).achieved, false);
    }
    f.game.destroy();
});

test('Ukázat na mapě mění jen kameru a fokus; opakované vykreslení zachová tlačítko', async () => {
    const f = await fixture(), { game, h } = f;
    game.selectUnit(f.players[0]); const selected = game.selectedUnit, before = state(game);
    let centered; game.view.mapInput.centerOnWorld = (x, y) => { centered = { x, y }; };
    game.view.panels.updateObjectiveProgress();
    const row = h.document.getElementById('secondary-objectives').children[0], button = row.children[1].children[3];
    button.focus(); game.view.panels.updateObjectiveProgress();
    assert.equal(h.document.getElementById('secondary-objectives').children[0], row);
    button.dispatchEvent(new Event('click'));
    const points = targets.horice_1423.map(([col, row]) => game.hexGrid.hexToPixel(col, row));
    assert.deepEqual(centered, { x: points.reduce((s, p) => s + p.x, 0) / 4, y: points.reduce((s, p) => s + p.y, 0) / 4 });
    assert.equal(game.selectedUnit, selected); assert.equal(state(game), before);
    assert.equal(h.document.activeElement, h.document.getElementById('btn-objectives')); game.destroy();
});

test('skutečný přesun a jeho vrácení okamžitě obnoví počítadlo', async () => {
    const f = await fixture(); const [col, row] = targets.horice_1423[0];
    f.h.context.window.matchMedia = () => ({ matches: true });
    Object.assign(f.players[0], { col, row: row - 1 }); f.game.selectUnit(f.players[0]);
    assert.equal(f.system.getSecondaryPositionProgress()[0].captured, 0);
    const move = f.game.moveUnit(f.players[0], col, row); await f.h.advance(800); assert.equal(await move, true);
    assert.match(f.h.document.getElementById('secondary-objectives').children[0].children[1].children[1].textContent, /1\/4/);
    f.game.undoLastMove();
    assert.match(f.h.document.getElementById('secondary-objectives').children[0].children[1].children[1].textContent, /0\/4/);
    f.game.destroy();
});

test('CS/EN a save/load zachovají souřadnice i stav obsazení; starý save dostane nové definice', async () => {
    const f = await fixture('malesov_1424'); f.occupy(targets.malesov_1424.slice(0, 2));
    f.h.context.window.game = f.game; const before = state(f.game);
    for (const language of ['en', 'cs']) {
        await f.h.i18n.setLanguage(language);
        const row = f.h.document.getElementById('secondary-objectives').children[0];
        assert.equal(row.children[1].children[0].textContent, f.h.i18n.t('scenarios.malesov_1424.objectives.secondary.0'));
        assert.equal(state(f.game), before);
    }
    f.game.currentScenario.victoryConditions.secondary[2] = { type: 'max_losses', maxLosses: 30 };
    assert.equal(f.game.saveGame(), true);
    const restored = f.h.SaveGameSystem.load(f.h.document.getElementById('game-canvas'), f.game);
    assert.equal(restored.currentScenario.victoryConditions.secondary[2].type, 'max_losses_percent');
    assert.equal(restored.victoryConditionsSystem.getSecondaryPositionProgress()[0].captured, 2);
    assert.equal(restored.hexGrid.secondaryObjectiveHexes.length, 4); restored.destroy();
});

test('Malešov měří méně než 30 procent původních oddílů, nikoli 30 kusů', async () => {
    const h = await createLocalizedHarness(), game = h.newGame('malesov_1424');
    const check = (initial, lost) => {
        game.initialPlayerUnits = initial; game.unitsLost = lost;
        game.victoryConditionsSystem.evaluateSecondaryConditions('hussites'); return game.secondaryResults[2].achieved;
    };
    assert.equal(check(26, 7), true); assert.equal(check(26, 8), false);
    assert.equal(check(10, 2), true); assert.equal(check(10, 3), false);
    assert.equal(check(0, 0), false); game.destroy();
});

test('Malešov vyžaduje živého Žižku; jiný vlastní ani nepřátelský velitel nestačí', async () => {
    const h = await createLocalizedHarness(), game = h.newGame('malesov_1424');
    const zizka = game.units.find(u => u.type === 'JAN_ZIZKA');
    for (const [health, escaped, faction, expected] of [[100, false, 'hussites', true], [0, false, 'hussites', false], [100, true, 'hussites', false], [100, false, 'crusaders', false]]) {
        Object.assign(zizka, { health, escaped, faction });
        game.victoryConditionsSystem.evaluateSecondaryConditions('hussites'); assert.equal(game.secondaryResults[1].achieved, expected);
    }
    game.destroy();
});

test('mlha a označené cíle neprozradí skrytého nepřítele ani neprozkoumaný terén', async () => {
    const f = await fixture(); const [col, row] = targets.horice_1423[0];
    Object.assign(f.enemy, { col, row }); f.game.fogOfWar = true; f.game.visibleHexes = new Set();
    f.game.exploredHexes = new Set();
    assert.equal(f.game.view.tooltip.contentForHex({ col, row }), '');
    f.game.exploredHexes.add(`${col},${row}`);
    const hidden = f.game.view.tooltip.contentForHex({ col, row });
    assert.ok(hidden.includes(f.game.currentScenario.victoryConditions.secondary[0].description));
    assert.ok(!hidden.includes(f.enemy.name)); assert.equal(f.system.getSecondaryPositionProgress()[0].captured, 0);
    f.enemy.col = 0; f.enemy.row = 0;
    assert.equal(f.game.view.tooltip.contentForHex({ col, row }), hidden); f.game.destroy();
});

test('herní data ostatních 15 scénářů se nemění; nová bitva nezdědí označení', async () => {
    const f = await fixture();
    const other = scenarioGameplay(Object.fromEntries(Object.entries(f.h.Scenarios).filter(([id]) => !Object.hasOwn(targets, id))));
    assert.equal(crypto.createHash('sha256').update(JSON.stringify(other)).digest('hex'),
        '0a3f138c7104755ff848efff6c1e477767c6ac0181ebc9d048991cc0a7452a60');
    f.game.initGameWithScenario(structuredClone(f.h.Scenarios.tachov_1427));
    assert.equal(f.game.hexGrid.secondaryObjectiveHexes.length, 0);
    assert.equal(f.game.victoryConditionsSystem.getSecondaryPositionProgress().length, 0);
    f.game.initGame(); assert.equal(f.game.hexGrid.secondaryObjectiveHexes.length, 0); f.game.destroy();
});

(async () => {
    let failed = 0;
    for (const { name, run } of tests) {
        try { await run(); console.log(`✓ ${name}`); }
        catch (error) { failed++; console.error(`✗ ${name}\n${error.stack}`); }
    }
    console.log(`\n${tests.length - failed}/${tests.length} testů označených cílů a vyhodnocování.`);
    process.exitCode = failed ? 1 : 0;
})();
