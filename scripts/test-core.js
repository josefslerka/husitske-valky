#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { createHarness } = require('./helpers/game-harness');
const { HexGrid, Unit } = createHarness();

global.UnitTypes = { TEST: {} };
global.i18n = { t: key => key };

const storageValues = new Map();
global.localStorage = {
    getItem: key => storageValues.has(key) ? storageValues.get(key) : null,
    setItem: (key, value) => storageValues.set(key, String(value)),
    removeItem: key => storageValues.delete(key)
};
global.Campaign = require('../js/data/campaign.js');
global.GameStorage = require('../js/core/GameStorage.js');
global.CampaignProgressSystem = require('../js/systems/CampaignProgressSystem.js');

const AI = require('../js/ai.js');
const tests = [];

function test(name, run) {
    tests.push({ name, run });
}

function loadScenarios() {
    const filePath = path.join(__dirname, '../js/data/scenarios.js');
    const context = { console };
    vm.createContext(context);
    vm.runInContext(`${fs.readFileSync(filePath, 'utf8')}\n;globalThis.__ScenarioData = { Scenarios, ScenarioManager };`, context, { filename: filePath });
    return context.__ScenarioData;
}

function loadBattleLore() {
    const filePath = path.join(__dirname, '../js/data/battleLore.js');
    const context = { console };
    vm.createContext(context);
    vm.runInContext(`${fs.readFileSync(filePath, 'utf8')}\n;globalThis.__LoreData = { BattleLore, getBattleLore };`, context, { filename: filePath });
    return context.__LoreData;
}

let generatedUnitId = 0;
function unit(overrides = {}) {
    return {
        id: overrides.id || `test-${++generatedUnitId}`,
        type: 'TEST',
        faction: 'crusaders',
        col: 0,
        row: 0,
        health: 100,
        maxHealth: 100,
        morale: 70,
        attack: 20,
        defense: 10,
        range: 1,
        special: null,
        formationClosed: true,
        isRouting: false,
        isCommander: () => false,
        isCavalry: () => false,
        isHeavyCavalry: () => false,
        isWagon: () => false,
        isRanged: () => false,
        canMove: () => true,
        canAttack: () => true,
        canAct: () => true,
        getAttackStrength: Unit.prototype.getAttackStrength,
        ...overrides
    };
}

function grid(units = []) {
    const hexGrid = new HexGrid({ getContext: () => ({}) }, 20, 20, 40);
    hexGrid.unitAt = (col, row) => units.find(candidate => candidate.col === col && candidate.row === row && candidate.health > 0);
    return hexGrid;
}

test('phase event zachová amount, title a vlastní pole', () => {
    const { ScenarioManager } = loadScenarios();
    const scenario = {
        phases: [{
            id: 7,
            name: 'Fallback',
            turnRange: [2, 2],
            events: [{
                id: 'contract',
                trigger: 'turn_2',
                type: 'morale_drop',
                amount: 17,
                title: 'Vlastní titulek',
                message: 'Text',
                customPayload: { preserved: true }
            }]
        }]
    };
    const [event] = ScenarioManager.checkPhaseEvents(scenario, 2);
    assert.strictEqual(event.amount, 17);
    assert.strictEqual(event.title, 'Vlastní titulek');
    assert.strictEqual(event.customPayload.preserved, true);
});

test('doktrína upřednostní dosažitelnou prchající jednotku', () => {
    const attacker = unit({ range: 3 });
    const weak = unit({ id: 'weak', faction: 'hussites', col: 1, health: 10 });
    const routed = unit({ id: 'routed', faction: 'hussites', col: 2, health: 90, isRouting: true });
    const hexGrid = grid([attacker, weak, routed]);
    const game = {
        currentScenario: { aiDoctrine: { pursueRouted: true } },
        hexGrid,
        getUnitAt: hexGrid.unitAt,
        combatSystem: { canReachThrough: () => false }
    };
    assert.strictEqual(AI.findBestAttackTarget(game, attacker, [weak, routed]).id, 'routed');
});

test('flankSeeking míří na konec souvislé vozové linie', () => {
    const wagons = [
        unit({ id: 'top', faction: 'hussites', col: 3, row: 0, isWagon: () => true }),
        unit({ id: 'middle', faction: 'hussites', col: 3, row: 1, isWagon: () => true }),
        unit({ id: 'bottom', faction: 'hussites', col: 3, row: 2, isWagon: () => true })
    ];
    const attacker = unit({ col: 0, row: 1 });
    const hexGrid = grid([attacker, ...wagons]);
    const game = { hexGrid, getUnitAt: hexGrid.unitAt };
    const target = AI.chooseAdvanceTarget(game, attacker, wagons, {
        pursueRouted: false,
        flankSeeking: true
    });
    assert.notStrictEqual(target.id, 'middle');
    assert.ok(target.id === 'top' || target.id === 'bottom');
});

test('opatrná jízda odmítne bezúčelný slabý charge', () => {
    const attacker = unit({ special: 'charge', attack: 10 });
    const target = unit({ faction: 'hussites', col: 2, health: 100, defense: 30 });
    const hexGrid = grid([attacker, target]);
    const baseGame = {
        hexGrid,
        getValidMoves: () => [{ col: 1, row: 0 }],
        currentScenario: { aiDoctrine: { charge: 'cautious' } }
    };
    assert.strictEqual(AI.findChargeOpportunity(baseGame, attacker, [target]), null);
    baseGame.currentScenario.aiDoctrine.charge = 'reckless';
    assert.ok(AI.findChargeOpportunity(baseGame, attacker, [target]));
});

test('holdWagonFort nerozpojuje ukotvený vůz', () => {
    const wagon = unit({
        isWagon: () => true,
        canAttack: () => false,
        formationClosed: true
    });
    const game = {
        currentScenario: { aiDoctrine: { holdWagonFort: true } },
        aiStance: { mode: 'default' },
        getEnemyUnits: () => [],
        hexGrid: grid([wagon])
    };
    assert.deepStrictEqual(AI.decideAction(game, wagon), { type: 'defend' });
});

test('velitel bez doprovodu neustupuje před vzdáleným nepřítelem, ale reaguje na skutečnou hrozbu', () => {
    const commander = unit({ id: 'commander', col: 5, row: 5, isCommander: () => true });
    const enemy = unit({ id: 'enemy', faction: 'hussites', col: 15, row: 5 });
    const hexGrid = grid([commander, enemy]);
    const game = {
        currentScenario: {}, aiStance: null, hexGrid,
        getEnemyUnits: () => [enemy],
        getUnitsOfFaction: () => [commander],
        getUnitAt: hexGrid.unitAt,
        getValidMoves: () => [{ col: 4, row: 5 }]
    };
    assert.deepStrictEqual(AI.decideAction(game, commander), { type: 'defend' });

    commander.morale = 5;
    assert.deepStrictEqual(AI.decideAction(game, commander), { type: 'defend' },
        'samotná nízká morálka nesmí velitele poslat na útěk');
    commander.morale = 70;

    enemy.col = 6;
    assert.deepStrictEqual(AI.decideAction(game, commander), { type: 'move', col: 4, row: 5 });
    enemy.col = 7;
    enemy.range = 2;
    assert.deepStrictEqual(AI.decideAction(game, commander), { type: 'move', col: 4, row: 5 });
    enemy.isRouting = true;
    assert.deepStrictEqual(AI.decideAction(game, commander), { type: 'defend' });
});

test('AI velitel nepřekročí při ústupu tři hexy za tah', () => {
    const commander = unit({ id: 'commander', col: 5, row: 5, isCommander: () => true });
    const enemy = unit({ id: 'enemy', faction: 'hussites', col: 15, row: 5 });
    const hexGrid = grid([commander, enemy]);
    const game = {
        currentScenario: {}, aiStance: { mode: 'retreat', target: { col: 19, row: 5 } }, hexGrid,
        getEnemyUnits: () => [enemy],
        getUnitsOfFaction: () => [commander],
        getUnitAt: hexGrid.unitAt,
        getValidMoves: () => [{ col: 9, row: 5 }, { col: 8, row: 5 }]
    };
    assert.deepStrictEqual(AI.decideAction(game, commander), { type: 'move', col: 8, row: 5 });
});

test('ústup použije scénářový únikový bod místo spodního okraje mapy', () => {
    const runner = unit({ col: 10, row: 6 });
    const hexGrid = grid([runner]);
    const game = {
        currentScenario: { specialMechanics: { escapeTarget: { col: 19, row: 6 } } },
        hexGrid,
        getValidMoves: () => [{ col: 11, row: 6 }, { col: 10, row: 9 }]
    };
    assert.deepStrictEqual(AI.findRetreatMove(game, runner), { col: 11, row: 6 });
});

test('velitel drží výhodnou podpůrnou pozici místo bezúčelného přesunu', () => {
    const commander = unit({ id: 'commander', col: 5, row: 5, isCommander: () => true });
    const allies = [
        unit({ id: 'ally-a', col: 5, row: 6 }),
        unit({ id: 'ally-b', col: 6, row: 5 })
    ];
    const enemy = unit({ id: 'enemy', faction: 'hussites', col: 13, row: 5 });
    const hexGrid = grid([commander, ...allies, enemy]);
    const game = {
        currentScenario: {}, aiStance: null, hexGrid,
        getEnemyUnits: () => [enemy],
        getUnitsOfFaction: () => [commander, ...allies],
        getUnitAt: hexGrid.unitAt,
        getValidMoves: () => [{ col: 4, row: 5 }]
    };
    assert.strictEqual(AI.findCommanderSupportPosition(game, commander, [enemy]), null);
    assert.deepStrictEqual(AI.decideAction(game, commander), { type: 'defend' });
});

test('velitelé prvních tří scénářů už v úvodním tahu neutíkají od chráněné linie', () => {
    const h = createHarness();
    for (const [scenarioId, leaderType] of [
        ['zivohost_1419', 'PETR_STERNBERK'],
        ['nekmir_1419', 'BOHUSLAV_SVAMBERK'],
        ['sudomere_1420', 'BOHUSLAV_SVAMBERK']
    ]) {
        const game = h.newGame(scenarioId);
        const leader = game.units.find(candidate => candidate.type === leaderType && candidate.faction === 'crusaders');
        assert.ok(leader, scenarioId);
        assert.strictEqual(h.AI.decideAction(game, leader)?.type, 'defend', scenarioId);
        game.destroy();
    }
});

test('Tachov a Domažlice začínají odporem zadního voje, ne okamžitým ústupem', () => {
    const h = createHarness();
    for (const [scenarioId, untilTurn] of [
        ['tachov_1427', 4],
        ['domazlice_1431', 3]
    ]) {
        const game = h.newGame(scenarioId);
        assert.strictEqual(game.aiStance.mode, 'defensive', scenarioId);
        assert.strictEqual(game.aiStance.untilTurn, untilTurn, scenarioId);
        game.destroy();
    }
});

test('plzeňská bombarda začíná v dostřelu obránců', () => {
    const h = createHarness(), game = h.newGame('oblehani_plzne_1433');
    const bombarda = game.units.find(candidate => candidate.type === 'BOMBARDA');
    const defenders = game.units.filter(candidate => candidate.faction === 'crusaders');
    const nearest = Math.min(...defenders.map(defender =>
        game.hexGrid.getDistance(bombarda.col, bombarda.row, defender.col, defender.row)));
    assert.strictEqual(bombarda.movement, 0);
    assert.ok(nearest <= bombarda.range, `nejbližší obránce je ${nearest} hexů, dostřel ${bombarda.range}`);
    game.destroy();
});

test('Plzeň má stejnou městskou, pojmenovanou a vítěznou zónu', () => {
    const { Scenarios } = loadScenarios();
    const scenario = Scenarios.oblehani_plzne_1433;
    const normalize = positions => Array.from(positions, ([col, row]) => `${col},${row}`).sort();
    const town = normalize(scenario.terrain.town);
    const label = normalize(scenario.mapLabels.find(item => item.text === 'Plzeň').hexes);
    const objective = normalize(scenario.victoryConditions.primary.positions);

    assert.equal(town.length, 20);
    assert.deepEqual(label, town);
    assert.deepEqual(objective, town);
    assert.equal(scenario.victoryConditions.primary.count, 3);
});

test('velká armáda a přeskočení zkrátí prezentační prodlevy AI', () => {
    assert.strictEqual(AI.getActionDelay({ fastForwardAI: false }, { type: 'move' }, 20), 500);
    assert.strictEqual(AI.getActionDelay({ fastForwardAI: false }, { type: 'move' }, 48), 250);
    assert.strictEqual(AI.getActionDelay({ fastForwardAI: false }, { type: 'attack' }, 48), 350);
    assert.strictEqual(AI.getActionDelay({ fastForwardAI: true }, { type: 'attack' }, 48), 320);
    assert.strictEqual(AI.getActionDelay({ fastForwardAI: true }, { type: 'move' }, 48), 40);
});

test('Lipanská léčka se spustí přiblížením hráče', () => {
    const stance = { mode: 'lure', target: { col: 5, row: 5 }, untilTurn: 7, proximity: 2 };
    const player = unit({ faction: 'hussites', col: 4, row: 5 });
    const game = {
        aiStance: stance,
        turnNumber: 6,
        getEnemyUnits: () => [player],
        hexGrid: grid([player]),
        addLog: () => {}
    };
    AI.updateAiStance(game);
    assert.strictEqual(stance.mode, 'aggressive');
    assert.strictEqual(stance.target, null);
});

test('bucket E používá počet jednotek a zachovává scénářové cíle', () => {
    const { Scenarios } = loadScenarios();
    const count = (scenario, faction) => scenario.forces[faction].units.length;

    assert.ok(count(Scenarios.horice_1423, 'crusaders') > count(Scenarios.horice_1423, 'hussites'));
    assert.ok(count(Scenarios.tachov_1427, 'crusaders') > count(Scenarios.tachov_1427, 'hussites'));
    assert.ok(count(Scenarios.domazlice_1431, 'crusaders') > count(Scenarios.domazlice_1431, 'hussites'));
    assert.strictEqual(
        Scenarios.usti_1426.forces.hussites.units.filter(unitDef =>
            unitDef.type === 'SLECHTICKA_JIZDA_HUSITI'
        ).length,
        2
    );
    assert.strictEqual(Scenarios.domazlice_1431.victoryConditions.primary.type, 'destroy_or_rout');

    const plzenDesertion = Scenarios.oblehani_plzne_1433.phases
        .flatMap(phase => phase.events)
        .find(event => event.trigger === 'turn_13');
    assert.strictEqual(plzenDesertion.type, 'morale');
    assert.strictEqual(plzenDesertion.faction, 'hussites');

    const mostPrimary = Scenarios.most_1421.victoryConditions.primary;
    assert.strictEqual(mostPrimary.type, 'dual_objective');
    assert.deepStrictEqual(
        Array.from(mostPrimary.objectives, objective => objective.holdTurns),
        [2, 6]
    );
});

test('kampaň odemyká akty a opakováním nefarmí pověst', () => {
    CampaignProgressSystem.reset();
    assert.strictEqual(CampaignProgressSystem.isActUnlocked(1), true);
    assert.strictEqual(CampaignProgressSystem.isActUnlocked(2), false);
    assert.strictEqual(CampaignProgressSystem.isActCompleted(1), false);
    assert.strictEqual(CampaignProgressSystem.isActCompleted(99), false);

    const firstAct = ['zivohost_1419', 'nekmir_1419', 'sudomere_1420'];
    for (const scenarioId of firstAct) {
        CampaignProgressSystem.recordBattle({ scenarioId, result: 'victory', turns: 9, maxTurns: 10, lossRatio: 0.4 });
    }
    assert.strictEqual(CampaignProgressSystem.isActUnlocked(2), true);
    assert.strictEqual(CampaignProgressSystem.isActCompleted(1), false,
        'odemčení II. aktu po třech vítězstvích není dokončení Zrození');

    const reputation = CampaignProgressSystem.getReputation();
    CampaignProgressSystem.recordBattle({
        scenarioId: 'zivohost_1419', result: 'victory', turns: 9, maxTurns: 10, lossRatio: 0.4
    });
    assert.strictEqual(CampaignProgressSystem.getReputation(), reputation);

    CampaignProgressSystem.recordBattle({ scenarioId: 'vitkov_1420', result: 'victory', turns: 9, maxTurns: 10, lossRatio: 0.4 });
    const completion = CampaignProgressSystem.recordBattle({
        scenarioId: 'vysehrad_1420', result: 'victory', turns: 9, maxTurns: 10, lossRatio: 0.4
    });
    assert.strictEqual(completion.actCompleted, 1);
    assert.strictEqual(CampaignProgressSystem.isActCompleted(1), true);
    CampaignProgressSystem.recordBattle({ scenarioId: 'vysehrad_1420', result: 'defeat', turns: 10 });
    assert.strictEqual(CampaignProgressSystem.isActCompleted(1), true,
        'opakovaná prohra už získanou odměnu nevezme');
});

test('pověst mění morálku, paniku a zlomí se u Lipan', () => {
    assert.ok(CampaignProgressSystem.getStartingMoraleModifier('tachov_1427', 80) < 0);
    assert.ok(CampaignProgressSystem.getStartingMoraleModifier('tachov_1427', 20) > 0);
    assert.strictEqual(CampaignProgressSystem.adjustPanicLevel(2, 'domazlice_1431', 80), 3);
    assert.strictEqual(CampaignProgressSystem.adjustPanicLevel(2, 'domazlice_1431', 20), 1);

    const lipany = CampaignProgressSystem.recordBattle({
        scenarioId: 'lipany_1434', result: 'victory', turns: 10, maxTurns: 14, lossRatio: 0.4
    });
    assert.ok(lipany.reputation <= 35);
});

test('nulová pověst se při načtení nezmění na výchozí', () => {
    storageValues.set(CampaignProgressSystem.STORAGE_KEY, JSON.stringify({
        version: CampaignProgressSystem.VERSION,
        reputation: 0,
        battles: {},
        completedActs: [],
        lipanyBreakApplied: false
    }));
    assert.strictEqual(CampaignProgressSystem.getReputation(), 0);
});

test('porážku zapisuje kronika vítězné protistrany a Sion zachová oba prameny', () => {
    const scenarioData = loadScenarios();
    const loreData = loadBattleLore();
    global.ScenarioManager = scenarioData.ScenarioManager;
    global.getBattleLore = loreData.getBattleLore;
    global.getLocalizedScenario = (_id, base) => base;
    global.getLocalizedBattleLore = (_id, base) => base;
    const ChronicleSystem = require('../js/systems/ChronicleSystem.js');

    const lipanyText = ChronicleSystem.generateText({
        scenarioId: 'lipany_1434', result: 'defeat', turns: 7
    });
    assert.ok(lipanyText.includes(loreData.BattleLore.lipany.enemyChronicle.text));
    assert.ok(lipanyText.includes(loreData.BattleLore.lipany.enemyChronicle.source));

    const sionText = ChronicleSystem.generateText({
        scenarioId: 'sion_1437', result: 'defeat', turns: 10
    });
    assert.ok(sionText.includes(loreData.BattleLore.sion.enemyChronicle.text));
    assert.ok(sionText.includes(loreData.BattleLore.sion.enemyChronicle.counterText));
});

test('shrnutí aktu se do kroniky uloží jen jednou', () => {
    const ChronicleSystem = require('../js/systems/ChronicleSystem.js');
    ChronicleSystem.clear();
    ChronicleSystem.recordActSummary(2);
    ChronicleSystem.recordActSummary(2);
    const summaries = ChronicleSystem.getEntries().filter(entry => entry.type === 'actSummary');
    assert.strictEqual(summaries.length, 1);
    assert.strictEqual(summaries[0].actId, 2);
});

let failures = 0;
for (const { name, run } of tests) {
    try {
        run();
        console.log(`✓ ${name}`);
    } catch (error) {
        failures++;
        console.error(`✗ ${name}`);
        console.error(error.stack || error.message);
    }
}

if (failures > 0) process.exit(1);
console.log(`\nOK: ${tests.length} core testů.`);
