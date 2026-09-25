#!/usr/bin/env node
const assert = require('node:assert/strict');
const { createHarness } = require('./helpers/game-harness');
const tests = [];
const test = (name, run) => tests.push({ name, run });

// Malý skutečný scénář: žádné přepisování metod Game ani ScenarioManager.
function fixture(overrides = {}) {
    const h = createHarness();
    h.Scenarios.event_regression = {
        id: 'event_regression', name: 'Regresní bitva', playerFaction: 'hussites',
        mapSize: { width: 16, height: 10 }, terrain: {},
        briefing: { hussites: 'Začátek bitvy' },
        forces: {
            hussites: { units: [{ type: 'CEPNICI', col: 1, row: 1 }] },
            crusaders: { units: [{ type: 'KOPINICI', col: 13, row: 8 }] }
        },
        phases: [
            { id: 1, name: 'Obrana', turnRange: [1, 2], events: [] },
            { id: 2, name: 'Protiútok', turnRange: [3, 6], events: [] }
        ],
        ...overrides
    };
    delete h.context.document;
    delete h.context.window;
    const game = h.newGame('event_regression');
    return { h, game, player: game.units[0], enemy: game.units[1] };
}

function addReinforcements(scenario, turn = 3) {
    scenario.forces.hussites.reinforcements = {
        turn, message: 'Husitské posily', units: [{ type: 'CEPNICI', col: 2, row: 1 }]
    };
    scenario.forces.crusaders.reinforcements = {
        turn, message: 'Křižácké posily', units: [{ type: 'HOUFNICE', col: 12, row: 8 }]
    };
    scenario.reinforcements = {
        allies: { turn, faction: 'hussites', message: 'Spojenci', units: [{ type: 'RUCNICARI', col: 3, row: 1 }] },
        reserve: { turn: turn + 1, units: [{ type: 'HALAPARTNICI', col: 11, row: 8 }] }
    };
}

function refresh(game, turn) {
    game.turnNumber = turn;
    game.updatePhase();
    game.checkPhaseEvents();
}

test('fáze přechází na hranici kola a opakovaná kontrola neopakuje log', () => {
    const { game } = fixture();
    assert.equal(game.currentPhase.id, 1);
    const before = game.log.length;
    game.updatePhase(); refresh(game, 2);
    assert.equal(game.currentPhase.id, 1);
    assert.equal(game.log.length, before);
    refresh(game, 3);
    assert.equal(game.currentPhase.id, 2);
    assert.equal(game.log.length, before + 1);
    refresh(game, 7);
    assert.equal(game.currentPhase.id, 2, 'po konci rozsahu zůstane poslední fáze');
    assert.equal(game.log.length, before + 1);
});

test('události stejného typu a kola mají samostatná ID a proběhnou právě jednou', () => {
    const { game } = fixture({ phases: [{ id: 1, name: 'Útok', turnRange: [1, 5], events: [
        { trigger: 'turn_1', type: 'message', text: 'První zpráva' },
        { id: 'second', trigger: 'turn_1', type: 'message', title: 'Titulek', text: 'Druhá zpráva' },
        { trigger: 'turn_2', type: 'message', text: 'Pozdější zpráva' }
    ] }] });
    game.checkPhaseEvents(); game.checkPhaseEvents();
    assert.deepEqual(game.view.notifications.map(event => event.text), ['První zpráva', 'Druhá zpráva']);
    assert.deepEqual([...game.processedEvents], ['phase1_evt0', 'second']);
    assert.equal(game.view.notifications[0].title, 'Útok');
    assert.equal(game.view.notifications[1].title, 'Titulek');
    refresh(game, 2); game.checkPhaseEvents();
    assert.equal(game.view.notifications.length, 3);
});

test('podmíněný event čeká na podmínku i časové okno a později se neopakuje', () => {
    const area = { minCol: 0, maxCol: 3, minRow: 0, maxRow: 3 };
    const { game, enemy } = fixture({ phases: [{ id: 1, name: 'Léčka', turnRange: [1, 6], events: [
        { id: 'ambush', trigger: 'turn_2', triggerBefore: 'turn_4', type: 'message', text: 'Léčka',
            condition: { type: 'units_in_area', faction: 'crusaders', area } },
        { id: 'expired', trigger: 'turn_1', triggerBefore: 'turn_2', type: 'message', text: 'Pozdě',
            condition: { type: 'units_routing', faction: 'crusaders' } }
    ] }] });
    enemy.col = 2; enemy.row = 2;
    game.checkPhaseEvents();
    assert.equal(game.processedEvents.size, 0, 'podmínka sama před triggerem nestačí');
    enemy.col = 13; enemy.row = 8;
    refresh(game, 2);
    assert.equal(game.processedEvents.size, 0, 'čas sám bez podmínky nestačí');
    enemy.col = 2; enemy.row = 2; enemy.isRouting = true;
    refresh(game, 3); refresh(game, 4); refresh(game, 5);
    assert.deepEqual([...game.processedEvents], ['ambush']);
    assert.equal(game.view.notifications.length, 1);
});

test('podmínka prchajících jednotek respektuje volitelnou oblast', () => {
    const { h, game, enemy } = fixture();
    const condition = {
        type: 'units_routing', faction: 'crusaders', minCount: 1,
        area: { minCol: 0, maxCol: 3, minRow: 0, maxRow: 3 }
    };
    enemy.isRouting = true;
    assert.equal(h.ScenarioManager.checkEventCondition(game, condition), false);
    enemy.col = 2; enemy.row = 2;
    assert.equal(h.ScenarioManager.checkEventCondition(game, condition), true);
});

test('Plzeň nehlásí výpad ani neposiluje morálku, když posádka už nemůže jednat', () => {
    const h = createHarness();
    const game = h.newGame('oblehani_plzne_1433');
    const defenders = game.units.filter(unit => unit.faction === 'crusaders');
    for (const unit of defenders.slice(2)) unit.isRouting = true;
    refresh(game, 8);
    assert.equal(game.currentPhase.name, 'Boj o brány');
    assert.equal(game.processedEvents.has('phase3_evt0'), false);
    assert.equal(game.view.notifications.some(event => event.text.includes('výpad z bran')), false);
    refresh(game, 9);
    assert.equal(game.processedEvents.has('phase3_evt1'), false);
    assert.equal(game.view.notifications.some(event => event.text.includes('sebedůvěra')), false);
    game.destroy();

    const active = h.newGame('oblehani_plzne_1433');
    refresh(active, 8);
    assert.equal(active.processedEvents.has('phase3_evt0'), true);
    refresh(active, 9);
    assert.equal(active.processedEvents.has('phase3_evt1'), true);
    active.destroy();
});

test('Nekmíř ohlašuje hradbu, Hynka a ústup jen podle skutečného stavu', () => {
    const h = createHarness(), game = h.newGame('nekmir_1419');
    const wagons = game.units.filter(unit => unit.faction === 'hussites' && unit.isWagon());
    const hynek = game.units.find(unit => unit.type === 'HYNEK_NEKMIRE');
    const crusaders = game.units.filter(unit => unit.faction === 'crusaders');
    const defense = game.units.find(unit => unit.faction === 'hussites' && !unit.isWagon()).defense;

    refresh(game, 4);
    assert.equal(game.processedEvents.has('phase2_evt1'), false);
    assert.equal(game.units.find(unit => unit.faction === 'hussites' && !unit.isWagon()).defense, defense);
    wagons.slice(0, 3).forEach(unit => { unit.formationClosed = true; });
    game.checkPhaseEvents();
    assert.equal(game.processedEvents.has('phase2_evt1'), true);
    assert.equal(game.units.find(unit => unit.faction === 'hussites' && !unit.isWagon()).defense, defense,
        'narace nesmí přidat skrytý trvalý bonus');

    refresh(game, 6);
    assert.equal(game.processedEvents.has('phase4_evt0'), false);
    hynek.col = 8;
    game.checkPhaseEvents();
    assert.equal(game.processedEvents.has('phase4_evt0'), true);

    refresh(game, 9);
    assert.equal(game.processedEvents.has('phase5_evt0'), false);
    crusaders.slice(0, Math.ceil(crusaders.length / 2)).forEach(unit => { unit.health = 0; });
    game.checkPhaseEvents();
    assert.equal(game.processedEvents.has('phase5_evt0'), true);
    game.destroy();
});

test('oba formáty posil přijdou ve správném kole, na správnou stranu a jen jednou', () => {
    const { game } = fixture();
    addReinforcements(game.currentScenario);
    refresh(game, 2);
    assert.equal(game.units.length, 2);
    refresh(game, 3); game.checkReinforcements(); game.checkPhaseEvents();
    assert.equal(game.units.length, 5);
    assert.equal(game.initialPlayerUnits, 1);
    assert.equal(game.initialEnemyUnits, 1);
    const added = game.units.filter(unit => unit.isReinforcement);
    assert.deepEqual(Array.from(added, unit => [unit.type, unit.faction, unit.col, unit.row]), [
        ['CEPNICI', 'hussites', 2, 1], ['HOUFNICE', 'crusaders', 12, 8], ['RUCNICARI', 'hussites', 3, 1]
    ]);
    assert.equal(game.view.notifications.length, 3);
    assert.deepEqual([...game.processedEvents], ['reinf-hussites-3', 'reinf-crusaders-3', 'reinf-scenario-allies-3']);
    refresh(game, 4); game.checkReinforcements();
    assert.equal(game.units.length, 6);
    assert.equal(game.units[5].faction, 'crusaders', 'výchozí frakce scénářových posil');
});

test('obsazený vstup posil použije sousední volný průchodný hex', () => {
    const { game, player } = fixture();
    const neighbors = game.hexGrid.getNeighbors(player.col, player.row);
    game.hexGrid.setTerrain(neighbors[0].col, neighbors[0].row, 'water');
    game.spawnReinforcements({ type: 'CEPNICI', position: [player.col, player.row], count: 1 }, 'hussites');
    const unit = game.units[2];
    assert.equal(unit.col, neighbors[1].col); assert.equal(unit.row, neighbors[1].row);
    assert.equal(unit.isReinforcement, true);
});

test('početnější posily rezervují každé jednotce vlastní nejbližší hex', () => {
    const { game } = fixture();
    assert.equal(game.spawnReinforcements({ type: 'CEPNICI', position: [5, 5], count: 3 }, 'hussites'), 3);
    const added = game.units.slice(2);
    const neighbors = game.hexGrid.getNeighbors(5, 5);
    assert.deepEqual(Array.from(added, unit => [unit.col, unit.row]), [
        [5, 5], [neighbors[0].col, neighbors[0].row], [neighbors[1].col, neighbors[1].row]
    ]);
    assert.equal(new Set(game.units.map(unit => `${unit.col},${unit.row}`)).size, game.units.length);
});

test('plný vstup i jeho sousedé hledají místo za prvním prstencem', () => {
    const { game } = fixture();
    for (const pos of [{ col: 5, row: 5 }, ...game.hexGrid.getNeighbors(5, 5)]) {
        game.units.push(game.unitFactory.createUnit('CEPNICI', pos.col, pos.row));
    }
    assert.equal(game.spawnReinforcements({ type: 'CEPNICI', position: [5, 5] }, 'crusaders'), 1);
    const unit = game.units.at(-1);
    assert.equal(game.hexGrid.getDistance(5, 5, unit.col, unit.row), 2);
    assert.equal(unit.faction, 'crusaders');
    assert.equal(new Set(game.units.map(unit => `${unit.col},${unit.row}`)).size, game.units.length);
});

test('posily neobsadí vodu ani u volného vstupu na okraji mapy', () => {
    const { game } = fixture();
    game.hexGrid.setTerrain(0, 0, 'water');
    assert.equal(game.spawnReinforcements({ type: 'CEPNICI', position: [0, 0] }, 'hussites'), 1);
    const unit = game.units.at(-1);
    assert.equal(game.hexGrid.inBounds(unit.col, unit.row), true);
    assert.equal(game.hexGrid.isImpassable(unit.col, unit.row), false);
    assert.equal(game.hexGrid.getDistance(0, 0, unit.col, unit.row), 1);
});

test('mrtvá jednotka neblokuje vstup posil', () => {
    const { game, player } = fixture();
    player.health = 0;
    assert.equal(game.spawnReinforcements({ type: 'CEPNICI', position: [1, 1] }, 'hussites'), 1);
    assert.equal(game.units.at(-1).col, 1); assert.equal(game.units.at(-1).row, 1);
});

function blockMapExcept(game, positions) {
    const free = new Set(positions.map(pos => pos.join(',')));
    for (const hex of game.hexGrid.hexes.values()) {
        game.hexGrid.setTerrain(hex.col, hex.row, free.has(`${hex.col},${hex.row}`) ? 'plains' : 'water');
    }
}

for (const format of ['forces', 'scenario']) {
    test(`celá skupina ${format} počká bez ztráty ID a po save/load přijde právě jednou`, () => {
        const { h, game } = fixture();
        const reinf = { turn: 3, faction: 'hussites', message: 'Čekající posily', units: [
            { type: 'CEPNICI', col: 5, row: 5 }, { type: 'RUCNICARI', col: 5, row: 5 }
        ] };
        for (const scenario of [game.currentScenario, h.Scenarios.event_regression]) {
            if (format === 'forces') scenario.forces.hussites.reinforcements = reinf;
            else scenario.reinforcements = { waiting: reinf };
        }
        const key = format === 'forces' ? 'reinf-hussites-3' : 'reinf-scenario-waiting-3';
        blockMapExcept(game, [[1, 1], [13, 8], [5, 5]]); // jen jedno volné místo pro dva
        const nextId = game.unitFactory.nextId;
        refresh(game, 3); game.checkReinforcements(); refresh(game, 4);
        assert.equal(game.units.length, 2, 'žádné částečné umístění skupiny');
        assert.equal(game.unitFactory.nextId, nextId);
        assert.equal(game.processedEvents.has(key), false);
        assert.equal(game.processedEvents.has(`${key}:pending`), true);
        assert.equal(game.log.filter(line => line.message.includes('reinforcementsWaiting')).length, 1);
        assert.equal(game.view.notifications.length, 0, 'příchod se ohlásí až po umístění');
        assert.equal(game.saveGame(), true);
        const restored = h.SaveGameSystem.load(h.document.getElementById('game-canvas'), game);
        restored.checkReinforcements();
        assert.equal(restored.units.length, 2);
        restored.hexGrid.setTerrain(5, 6, 'plains');
        refresh(restored, 5); restored.checkReinforcements(); refresh(restored, 6);
        assert.deepEqual(Array.from(restored.units.slice(2), unit => [unit.id, unit.faction, unit.isReinforcement]), [
            [nextId, 'hussites', true], [nextId + 1, 'hussites', true]
        ]);
        assert.equal(restored.processedEvents.has(`${key}:pending`), false);
        assert.equal(restored.processedEvents.has(key), true);
        assert.equal(restored.view.notifications.length, 1);
        assert.equal(restored.saveGame(), true);
        assert.doesNotThrow(() => h.SaveGameSystem.read());
    });
}

test('přímý spawn na plné mapě nic nevytvoří ani nespotřebuje ID', () => {
    const { game } = fixture();
    blockMapExcept(game, [[1, 1], [13, 8]]);
    const nextId = game.unitFactory.nextId;
    assert.equal(game.spawnReinforcements({ type: 'CEPNICI', position: [5, 5], count: 2 }, 'hussites'), 0);
    assert.equal(game.units.length, 2); assert.equal(game.unitFactory.nextId, nextId);
});

test('neplatný požadavek na posily nemění jednotky ani jejich ID', () => {
    const { h, game } = fixture();
    h.context.console = { ...console, error() {} };
    const nextId = game.unitFactory.nextId;
    for (const request of [
        { type: 'missing', position: [5, 5] }, { type: 'toString', position: [5, 5] },
        { type: 'CEPNICI', position: [-1, 5] }, { type: 'CEPNICI', position: [5.5, 5] },
        { type: 'CEPNICI', position: [5, 5], count: 0 }, { type: 'CEPNICI', position: [5, 5], count: 1.5 },
        { type: 'CEPNICI', position: [5, 5], count: Infinity }
    ]) assert.equal(game.spawnReinforcements(request, 'hussites'), 0);
    assert.equal(game.units.length, 2); assert.equal(game.unitFactory.nextId, nextId);
});

test('starý save bez evidence posil neopakuje jejich již minulé kolo', () => {
    const { h, game } = fixture();
    addReinforcements(game.currentScenario); addReinforcements(h.Scenarios.event_regression);
    game.turnNumber = 5;
    assert.equal(game.saveGame(), true);
    const data = JSON.parse(h.storage.get(h.SaveGameSystem.STORAGE_KEY));
    data.version = 1; delete data.processedEvents;
    h.storage.set(h.SaveGameSystem.STORAGE_KEY, JSON.stringify(data));
    const restored = h.SaveGameSystem.load(h.document.getElementById('game-canvas'), game);
    restored.checkReinforcements(); refresh(restored, 6);
    assert.equal(restored.units.length, 2);
    assert.equal(restored.processedEvents.size, 0);
});

test('Živohošť po obsazení vstupu posil i sousedů zůstane uložitelná a načitatelná', () => {
    const h = createHarness(), game = h.newGame('zivohost_1419');
    const entry = game.currentScenario.forces.hussites.reinforcements.units[0];
    for (const pos of [entry, ...game.hexGrid.getNeighbors(entry.col, entry.row)]) {
        if (!game.getUnitAt(pos.col, pos.row)) game.units.push(game.unitFactory.createUnit('CEPNICI', pos.col, pos.row));
    }
    refresh(game, 5); game.checkReinforcements();
    const alive = game.units.filter(unit => unit.health > 0);
    assert.equal(new Set(alive.map(unit => `${unit.col},${unit.row}`)).size, alive.length);
    assert.equal(game.units.filter(unit => unit.isReinforcement).length, 9);
    assert.equal(game.saveGame(), true);
    assert.doesNotThrow(() => h.SaveGameSystem.load(h.document.getElementById('game-canvas'), game));
});

test('přechod z nepřátelského tahu vyřídí fázi, event i posily právě jednou', () => {
    const { game } = fixture();
    addReinforcements(game.currentScenario);
    game.currentScenario.phases[1].events = [{ trigger: 'turn_3', type: 'message', text: 'Nová fáze' }];
    game.currentFaction = 'crusaders'; game.turnNumber = 2;
    game.endTurn();
    assert.equal(game.currentFaction, 'hussites'); assert.equal(game.turnNumber, 3);
    assert.equal(game.currentPhase.id, 2); assert.equal(game.units.length, 5);
    assert.deepEqual(game.view.notifications.map(event => event.text), ['Nová fáze', 'Husitské posily', 'Křižácké posily', 'Spojenci']);
    assert.equal(game.gameState, 'playing');
});

test('načtení před příchodem posil nehraje úvod znovu a zachová budoucí eventy', () => {
    const { h, game, enemy } = fixture({ phases: [{ id: 1, name: 'Bitva', turnRange: [1, 6], events: [
        { id: 'initial', trigger: 'turn_1', type: 'morale_drop', amount: 3, text: 'Úvod' },
        { id: 'later', trigger: 'turn_3', type: 'morale_drop', amount: 2, text: 'Později' }
    ] }] });
    // Data patří scénáři, ne savu: registrovaná báze musí znát budoucí posily.
    addReinforcements(game.currentScenario);
    addReinforcements(h.Scenarios.event_regression);
    const morale = enemy.morale;
    assert.equal(game.saveGame(), true);
    const restored = h.SaveGameSystem.load(h.document.getElementById('game-canvas'), game);
    restored.checkPhaseEvents();
    assert.equal(restored.units[1].morale, morale);
    assert.equal(restored.view.notifications.length, 0);
    assert.deepEqual([...restored.processedEvents], ['initial']);
    refresh(restored, 3); restored.checkPhaseEvents();
    assert.equal(restored.units[1].morale, morale - 10);
    assert.equal(restored.units.length, 5);
    assert.equal(restored.view.notifications.filter(event => event.text === 'Později').length, 1);
});

test('načtení po příchodu posil zachová ID, účinky i deduplikaci obou formátů', () => {
    const { h, game } = fixture();
    addReinforcements(game.currentScenario);
    addReinforcements(h.Scenarios.event_regression);
    refresh(game, 3);
    const ids = Array.from(game.units, unit => unit.id);
    const processed = [...game.processedEvents];
    assert.equal(game.saveGame(), true);
    const restored = h.SaveGameSystem.load(h.document.getElementById('game-canvas'), game);
    restored.checkPhaseEvents(); restored.checkReinforcements();
    assert.deepEqual(Array.from(restored.units, unit => unit.id), ids);
    assert.deepEqual([...restored.processedEvents], processed);
    assert.equal(restored.currentPhase.id, 2);
    assert.equal(restored.view.notifications.length, 0);
    refresh(restored, 4);
    assert.equal(restored.units.length, 6);
    assert.equal(new Set(restored.units.map(unit => unit.id)).size, 6);
});

test('nová bitva nepřebírá zpracované eventy předchozího scénáře', () => {
    const { h, game } = fixture({ phases: [{ id: 1, name: 'Úvod', turnRange: [1, 3], events: [
        { id: 'opening', trigger: 'turn_1', type: 'message', text: 'Úvodní zpráva' }
    ] }] });
    assert.equal(game.processedEvents.size, 1);
    game.destroy();
    const restarted = h.newGame('event_regression');
    assert.deepEqual([...restarted.processedEvents], ['opening']);
    assert.equal(restarted.view.notifications.length, 1);
    restarted.initGame();
    assert.equal(restarted.currentScenario, null); assert.equal(restarted.currentPhase, null);
    assert.equal(restarted.processedEvents.size, 0);
    const count = restarted.units.length;
    restarted.checkPhaseEvents(); restarted.checkReinforcements();
    assert.equal(restarted.units.length, count);
});

// Mechanické účinky událostí: očekávané hodnoty jsou zachycené před extrakcí.
for (const [name, event, verify] of [
    ['morale', { type: 'morale', faction: 'crusaders', amount: 3 }, ({ enemy }, before) => {
        assert.equal(enemy.attack, before.attack - 3); assert.equal(enemy.morale, before.morale - 15);
    }],
    ['morale_boost', { type: 'morale_boost', modifier: 15 }, ({ enemy }, before) => {
        assert.equal(enemy.morale, before.morale + 15); assert.equal(enemy.attack, before.attack);
    }],
    ['morale_drop', { type: 'morale_drop', amount: 3 }, ({ enemy }, before) => {
        assert.equal(enemy.morale, before.morale - 15); assert.equal(enemy.attack, before.attack);
    }],
    ['panic', { type: 'panic', faction: 'crusaders', level: 2 }, ({ enemy }, before) => {
        assert.equal(enemy.attack, before.attack - 10); assert.equal(enemy.morale, before.morale);
    }],
    ['rout', { type: 'rout', faction: 'crusaders' }, ({ game, enemy }) => {
        assert.equal(enemy.isRouting, true); assert.equal(game.routingUnits.has(enemy.id), true);
        assert.equal(game.moraleBroken, true);
    }],
    ['charge_bonus', { type: 'charge_bonus', faction: 'crusaders', amount: 15 }, ({ enemy }, before) => {
        assert.equal(enemy.attack, Math.round(before.attack * 1.15));
    }],
    ['terrain_change', { type: 'terrain_change', changes: [{ col: 4, row: 4, terrain: 'mud' }] }, ({ game }) => {
        assert.equal(game.hexGrid.getTerrain(4, 4), 'mud');
    }],
    ['ai_stance', { type: 'ai_stance', mode: 'lure', target: { col: 4, row: 4 }, untilTurn: 5, proximity: 2 }, ({ game }) => {
        assert.deepEqual({ ...game.aiStance, target: { ...game.aiStance.target } }, {
            mode: 'lure', target: { col: 4, row: 4 }, untilTurn: 5, proximity: 2
        });
    }]
]) {
    test(`event ${name} zachová původní mechanický účinek`, () => {
        const state = fixture();
        state.enemy.morale = 60;
        const before = { attack: state.enemy.attack, morale: state.enemy.morale };
        state.game.processEvent(event);
        verify(state, before);
    });
}

let failures = 0;
for (const { name, run } of tests) {
    try { run(); console.log(`✓ ${name}`); }
    catch (error) { failures++; console.error(`✗ ${name}\n${error.stack}`); }
}
console.log(`\n${tests.length - failures}/${tests.length} scenario event testů.`);
if (failures) process.exitCode = 1;
