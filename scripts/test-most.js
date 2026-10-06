#!/usr/bin/env node
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createLocalizedHarness } = require('./helpers/localized-harness');
const tests = [];
const test = (name, run) => tests.push({ name, run });

async function fixture(language = 'cs', browserView = false) {
    const h = await createLocalizedHarness(language, { browserView });
    const game = h.newGame('most_1421');
    const players = [0, 1, 2].map(index => game.unitFactory.createUnit('CEPNICI', 2 + index, 9));
    const enemy = game.unitFactory.createUnit('KOPINICI', 17, 15);
    game.units = [...players, enemy];
    game.scheduleAI = () => {};
    const system = game.victoryConditionsSystem;
    const objective = id => game.currentScenario.victoryConditions.primary.objectives.find(item => item.id === id);
    const occupy = (id, count = Infinity) => {
        const offset = id === 'block_gate' ? 2 : 0;
        objective(id).positions.slice(0, count).forEach(([col, row], index) => {
            Object.assign(players[offset + index], { col, row });
        });
    };
    const tick = () => system.checkDualObjectiveProgress();
    return { h, game, players, enemy, system, objective, occupy, tick };
}

const state = game => JSON.stringify({ units: game.units.map(unit => unit.serialize()),
    counters: game.objectiveHeldTurns, turn: game.turnNumber, faction: game.currentFaction });

test('Most označuje tři skutečné cílové hexy, brána je na cestě, nikoli v městě', async () => {
    const f = await fixture('cs', true);
    assert.deepEqual(Array.from(f.objective('block_gate').positions, position => Array.from(position)), [[9, 12]]);
    assert.equal(f.game.hexGrid.getTerrain(9, 12), 'road');
    assert.equal(f.game.hexGrid.getTerrain(9, 13), 'town');
    assert.equal(f.game.hexGrid.escapeZoneKind, 'objective');
    assert.deepEqual(Array.from(f.game.hexGrid.escapeZoneHexes, hex => [hex.col, hex.row]), [[9, 0], [9, 1], [9, 12]]);
    const label = f.game.hexGrid.mapLabels.find(item => item.text === f.h.i18n.t('mapLabels.mostGate'));
    assert.deepEqual(Array.from(label.hexes, position => Array.from(position)), [[9, 12]]);
    assert.ok(Math.abs(label.offset[1]) < 2, 'offset popisku se měří v poloměrech hexu, nikoli pixelech');
    assert.equal(f.system.areDualObjectivesControlled(), false);
    f.game.destroy();
});

test('obsazení města bez brány a jediného pole hradu neplní cíle', async () => {
    const f = await fixture();
    f.occupy('capture_castle', 1);
    Object.assign(f.players[1], { col: 8, row: 13 });
    Object.assign(f.players[2], { col: 9, row: 13 });
    for (let i = 0; i < 6; i++) f.tick();
    assert.equal(f.game.gameState, 'playing');
    assert.deepEqual({ ...f.game.objectiveHeldTurns }, { capture_castle: 0, block_gate: 0 });
    f.system.evaluateSecondaryConditions('hussites');
    assert.equal(f.game.secondaryResults[0].achieved, false);
    f.game.destroy();
});

for (const language of ['cs', 'en']) {
    for (const [id, required, variant] of [['capture_castle', 2, 'castleCaptured'], ['block_gate', 6, 'gateBlocked']]) {
        test(`${language}: výhra pouze přes ${id} má správný závěr, bez bonusu za obě lokality`, async () => {
            const f = await fixture(language);
            f.occupy(id);
            for (let i = 1; i < required; i++) {
                f.tick();
                assert.equal(f.game.gameState, 'playing');
                assert.equal(f.game.objectiveHeldTurns[id], i);
            }
            f.tick();
            assert.equal(f.game.view.result.isVictory, true);
            assert.equal(f.game.secondaryResults[0].achieved, false);
            const ending = f.h.i18n.t(`scenarios.most_1421.debriefing.victoryVariants.${variant}`);
            assert.equal(f.game.view.result.message, ending);
            const entry = f.h.ChronicleSystem.getEntries()[0];
            assert.equal(entry.narrative.victoryVariant, variant);
            assert.equal(f.h.ChronicleSystem.getPersonalEpilogue(entry), ending);
            await f.h.i18n.setLanguage(language === 'cs' ? 'en' : 'cs');
            assert.equal(f.h.ChronicleSystem.getPersonalEpilogue(f.h.ChronicleSystem.getEntries()[0]),
                f.h.i18n.t(`scenarios.most_1421.debriefing.victoryVariants.${variant}`));
            f.game.destroy();
        });
    }

    test(`${language}: bonus za obě lokality vyžaduje jeden časový cíl a současné obsazení všech tří polí`, async () => {
        for (const reverse of [false, true]) {
            const f = await fixture(language);
            if (reverse) f.game.currentScenario.victoryConditions.primary.objectives.reverse();
            f.occupy('capture_castle'); f.occupy('block_gate');
            f.tick();
            assert.equal(f.game.gameState, 'playing');
            assert.equal(f.system.areDualObjectivesControlled(), false);
            f.tick();
            assert.deepEqual({ ...f.game.objectiveHeldTurns }, { capture_castle: 2, block_gate: 2 });
            assert.equal(f.game.view.result.isVictory, true);
            assert.equal(f.game.secondaryResults[0].achieved, true);
            assert.equal(f.game.view.result.message, f.game.currentScenario.debriefing.victoryVariants.bothControlled);
            assert.equal(f.h.ChronicleSystem.getEntries()[0].narrative.victoryVariant, 'bothControlled');
            f.game.destroy();
        }
    });
}

test('bonus lze získat i přes bránu; částečně obsazený nebo mrtvý hrad jej nesplní', async () => {
    const f = await fixture();
    f.occupy('block_gate');
    for (let i = 0; i < 5; i++) f.tick();
    f.occupy('capture_castle');
    f.players[1].health = 0;
    assert.equal(f.system.areDualObjectivesControlled(), false);
    f.players[1].health = 10;
    f.tick();
    assert.deepEqual({ ...f.game.objectiveHeldTurns }, { capture_castle: 1, block_gate: 6 });
    assert.equal(f.game.secondaryResults[0].achieved, true);
    f.game.destroy();
});

test('prázdné, nepřátelské, mrtvé či uprchlé cílové pole vynuluje počet při konci tahu', async () => {
    for (const change of [unit => { unit.col = 2; unit.row = 9; }, unit => { unit.faction = 'crusaders'; },
        unit => { unit.health = 0; }, unit => { unit.escaped = true; }]) {
        const f = await fixture();
        f.occupy('block_gate'); f.tick();
        assert.equal(f.game.objectiveHeldTurns.block_gate, 1);
        change(f.players[2]); f.tick();
        assert.equal(f.game.objectiveHeldTurns.block_gate, 0);
        assert.equal(f.game.gameState, 'playing');
        f.game.destroy();
    }
});

test('částečná ztráta hradu resetuje obě pole; obnovené držení začíná od nuly', async () => {
    const f = await fixture();
    f.occupy('capture_castle'); f.tick();
    Object.assign(f.players[1], { col: 3, row: 9 }); f.tick();
    assert.equal(f.game.objectiveHeldTurns.capture_castle, 0);
    f.occupy('capture_castle'); f.tick();
    assert.equal(f.game.objectiveHeldTurns.capture_castle, 1);
    assert.equal(f.game.gameState, 'playing');
    f.tick();
    assert.equal(f.game.view.result.isVictory, true);
    f.game.destroy();
});

test('skutečný endTurn započítá jen vlastní tah, nikoli nepřátelský', async () => {
    const f = await fixture();
    f.occupy('block_gate');
    f.game.endTurn();
    assert.equal(f.game.currentFaction, 'crusaders');
    assert.equal(f.game.objectiveHeldTurns.block_gate, 1);
    f.game.endTurn();
    assert.equal(f.game.currentFaction, 'hussites');
    assert.equal(f.game.objectiveHeldTurns.block_gate, 1);
    f.game.endTurn();
    assert.equal(f.game.objectiveHeldTurns.block_gate, 2);
    f.game.destroy();
});

test('limit deseti kol vyhodnotí i aktuální obsazení a starý vysoký čítač není výhra', async () => {
    for (const occupied of [false, true]) {
        const f = await fixture();
        f.game.objectiveHeldTurns.block_gate = 6;
        if (occupied) f.occupy('block_gate');
        f.game.turnNumber = 10;
        f.game.currentFaction = 'crusaders';
        f.game.endTurn();
        assert.equal(f.game.view.result.isVictory, occupied);
        assert.equal(f.game.view.result.stats.turns, 10);
        f.game.destroy();
    }
});

test('starý both_objectives již není bezpodmínečný; prázdné a jiné scénáře nepřidají bonus', async () => {
    const f = await fixture();
    f.game.currentScenario.victoryConditions.secondary = [{ type: 'both_objectives' }];
    f.occupy('capture_castle'); f.game.objectiveHeldTurns.capture_castle = 2;
    f.system.evaluateSecondaryConditions('hussites');
    assert.equal(f.game.secondaryResults[0].achieved, false);
    f.occupy('block_gate'); f.game.objectiveHeldTurns.block_gate = 6;
    f.system.evaluateSecondaryConditions('hussites');
    assert.equal(f.game.secondaryResults[0].achieved, true);
    f.game.currentScenario.victoryConditions.primary.objectives = [];
    f.system.evaluateSecondaryConditions('hussites');
    assert.equal(f.game.secondaryResults[0].achieved, false);
    f.game.currentScenario.victoryConditions.primary.type = 'destroy_army';
    assert.equal(f.system.getDualObjectiveProgress().length, 0);
    f.game.destroy();
});

test('save/load zachová obě počítadla a načte novou definici bonusu ze scénáře', async () => {
    const f = await fixture();
    f.occupy('block_gate');
    for (let i = 0; i < 3; i++) f.tick();
    f.occupy('capture_castle'); f.tick();
    f.game.currentScenario.victoryConditions.secondary[0].type = 'both_objectives'; // starý scénář
    assert.equal(f.game.saveGame(), true);
    const restored = f.h.SaveGameSystem.load(f.h.document.getElementById('game-canvas'), f.game);
    assert.deepEqual({ ...restored.objectiveHeldTurns }, { capture_castle: 1, block_gate: 4 });
    assert.equal(restored.currentScenario.victoryConditions.secondary[0].type, 'control_objectives');
    restored.victoryConditionsSystem.checkDualObjectiveProgress();
    assert.equal(restored.view.result.isVictory, true);
    assert.equal(restored.secondaryResults[0].achieved, true);
    assert.equal(restored.view.result.message, restored.currentScenario.debriefing.victoryVariants.bothControlled);
    restored.destroy();
});

test('CS/EN panel, mapa a hover se překládají bez změny cílů nebo počítadel', async () => {
    const f = await fixture('cs', true);
    f.h.context.window.game = f.game;
    f.occupy('block_gate'); f.tick();
    const before = state(f.game);
    const coordinates = JSON.stringify(f.game.currentScenario.victoryConditions.primary.objectives.map(item => item.positions));
    for (const language of ['cs', 'en', 'cs']) {
        await f.h.i18n.setLanguage(language);
        f.game.view.panels.updateObjectiveProgress();
        const rows = f.h.document.getElementById('dual-objectives').children;
        assert.equal(rows.length, 2);
        const row = rows.find(item => item.dataset.objective === 'block_gate');
        assert.equal(row.children[0].textContent, f.h.i18n.t('mapLabels.mostGate'));
        assert.equal(row.children[1].textContent, f.objective('block_gate').description);
        assert.ok(row.children[2].textContent.includes(f.h.i18n.t('game.holdProgress', { held: 1, required: 6 })));
        assert.ok(f.h.document.getElementById('objective-hud-text').textContent.includes('1/6'));
        const html = f.game.view.tooltip.contentForHex({ col: 9, row: 12 });
        assert.ok(html.includes(f.objective('block_gate').description));
        assert.ok(html.includes(f.h.i18n.t('mapLabels.mostGate')));
        assert.equal(state(f.game), before);
        assert.equal(JSON.stringify(f.game.currentScenario.victoryConditions.primary.objectives.map(item => item.positions)), coordinates);
    }
    f.game.destroy();
});

test('Ukázat na mapě posune kameru ke správné lokalitě bez změny výběru či rozkazů', async () => {
    const f = await fixture('en', true);
    f.game.selectUnit(f.players[0]);
    const before = state(f.game), selected = f.game.selectedUnit;
    let centered;
    f.game.view.mapInput.centerOnWorld = (x, y) => { centered = { x, y }; };
    f.game.view.panels.updateObjectiveProgress();
    const rows = f.h.document.getElementById('dual-objectives').children;
    for (const row of rows) {
        f.h.document.getElementById('objectives-panel').classList.remove('hidden');
        row.children[3].dispatchEvent(new Event('click'));
        const points = f.objective(row.dataset.objective).positions.map(([col, row]) => f.game.hexGrid.hexToPixel(col, row));
        assert.equal(centered.x, points.reduce((sum, point) => sum + point.x, 0) / points.length);
        assert.equal(centered.y, points.reduce((sum, point) => sum + point.y, 0) / points.length);
        assert.equal(f.h.document.getElementById('objectives-panel').classList.contains('hidden'), true);
        assert.equal(f.h.document.activeElement, f.h.document.getElementById('btn-objectives'));
        assert.equal(f.game.selectedUnit, selected);
        assert.equal(state(f.game), before);
    }
    f.game.destroy();
});

test('cílový hover respektuje mlhu války a skrytý nepřítel není odhalen popisem cíle', async () => {
    const f = await fixture('cs', true);
    f.game.fogOfWar = true;
    f.game.fogOfWarSystem.isHexExplored = () => false;
    assert.equal(f.game.view.tooltip.contentForHex({ col: 9, row: 12 }), '');
    f.game.fogOfWarSystem.isHexExplored = () => true;
    f.game.fogOfWarSystem.isEnemyVisible = () => false;
    Object.assign(f.enemy, { col: 9, row: 12 });
    const html = f.game.view.tooltip.contentForHex({ col: 9, row: 12 });
    assert.ok(html.includes(f.objective('block_gate').description));
    assert.ok(!html.includes(f.enemy.name));
    f.game.destroy();
});

test('brzké zničení nepřátel nevymýšlí dobytí hradu ani zablokování brány', async () => {
    const f = await fixture();
    f.enemy.health = 0;
    f.system.checkVictory();
    assert.equal(f.game.view.result.isVictory, true);
    assert.equal(f.game.view.result.message, f.game.currentScenario.debriefing.victory);
    assert.equal(f.game.secondaryResults[0].achieved, false);
    const entry = f.h.ChronicleSystem.getEntries()[0];
    assert.equal(entry.narrative.victoryVariant, null);
    await f.h.i18n.setLanguage('en');
    assert.equal(f.h.ChronicleSystem.getPersonalEpilogue(entry), f.h.i18n.t('scenarios.most_1421.debriefing.victory'));
    f.game.destroy();
});

test('alias dual_objective_battle používá shodný výpočet a prázdné souřadnice se nepočítají', async () => {
    const f = await fixture();
    f.game.currentScenario.victoryConditions.primary.type = 'dual_objective_battle';
    f.objective('capture_castle').positions = [];
    f.occupy('block_gate');
    for (let i = 0; i < 6; i++) f.tick();
    assert.equal(f.game.objectiveHeldTurns.capture_castle, 0);
    assert.equal(f.game.view.result.isVictory, true);
    assert.equal(f.game.secondaryResults[0].achieved, false);
    f.game.destroy();
});

test('detail jednotky má vlastní scroll, nízké okno a kompaktní režim posouvají celý panel', () => {
    const css = fs.readFileSync(path.join(__dirname, '../styles/field-theme.css'), 'utf8');
    assert.match(css, /#unit-panel:not\(\.empty-unit-panel\) #unit-info\s*\{[^}]*min-height: 0;[^}]*overflow-y: auto;/);
    assert.match(css, /\.compact-battle #unit-panel:not\(\.empty-unit-panel\) #unit-info\s*\{[^}]*flex: none;[^}]*overflow: visible;/);
    assert.match(css, /#unit-panel:not\(\.empty-unit-panel\)\s*\{\s*overflow-y: auto;/);
    assert.match(css, /@media \(max-height: 800px\)\s*\{\s*#unit-panel:not\(\.empty-unit-panel\) #unit-info\s*\{ flex: none; overflow: visible;/);
    assert.match(css, /#unit-panel\.collapsed:not\(\.expanded\) #unit-actions \{ display: none; \}/);
});

test('jiný oddíl otevře panel u rozkazů; aktualizace stejného oddílu zachová místo čtení', async () => {
    const f = await fixture('cs', true);
    const panel = f.h.document.getElementById('unit-panel'), info = f.h.document.getElementById('unit-info');
    f.game.selectUnit(f.players[0]);
    panel.scrollTop = 400; info.scrollTop = 200;
    f.game.view.panels.updateUnitPanel(f.players[0]);
    assert.equal(panel.scrollTop, 400); assert.equal(info.scrollTop, 200);
    f.game.selectUnit(f.players[1]);
    assert.equal(panel.scrollTop, 0); assert.equal(info.scrollTop, 0);
    panel.scrollTop = 80;
    f.game.deselectUnit();
    assert.equal(panel.scrollTop, 0);
    f.game.destroy();
});

(async () => {
    let failures = 0;
    for (const { name, run } of tests) {
        try { await run(); console.log(`✓ ${name}`); }
        catch (error) { failures++; console.error(`✗ ${name}\n${error.stack}`); }
    }
    console.log(`\n${tests.length - failures}/${tests.length} testů Mostu a panelu.`);
    if (failures) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
