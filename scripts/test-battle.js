#!/usr/bin/env node
const assert = require('node:assert/strict');
const { createHarness } = require('./helpers/game-harness');
const tests = [];
const test = (name, run) => tests.push({ name, run });

function duel(h, attackerType = 'RUCNICARI', defenderType = 'TEZKY_RYTIR') {
    const game = h.newGame();
    const attacker = game.unitFactory.createUnit(attackerType, 5, 5);
    const defender = game.unitFactory.createUnit(defenderType, 6, 5);
    attacker.faction = 'hussites'; defender.faction = 'crusaders';
    game.units = [attacker, defender];
    return { game, attacker, defender };
}

test('všech 18 scénářů po prvním hráčově tahu pokračuje', () => {
    for (const id of Object.keys(createHarness().Scenarios)) {
        const h = createHarness(), game = h.newGame(id);
        game.endTurn();
        assert.equal(game.gameState, 'playing', id);
        assert.equal(game.currentFaction, 'crusaders', id);
        game.destroy();
    }
});

test('Sion vyhraje až po dokončení 12. nepřátelského tahu', () => {
    const h = createHarness(), game = h.newGame('sion_1437');
    game.turnNumber = 12;
    game.endTurn();
    assert.equal(game.gameState, 'playing');
    game.endTurn();
    assert.equal(game.gameState, 'victory');
    assert.ok(game.log.some(line => line.message.includes('victorySurviveTurns')));
});

test('Sion může před limitem prohrát smrtí velitele', () => {
    const h = createHarness(), game = h.newGame('sion_1437');
    game.units.filter(unit => unit.faction === 'hussites' && unit.isCommander()).forEach(unit => { unit.health = 0; });
    game.victoryConditionsSystem.checkVictory();
    assert.equal(game.gameState, 'victory');
    assert.ok(game.log.some(line => line.message.includes('commanderFallen')));
});

test('Plzeň vyhrají tři libovolná obsazená pole města', () => {
    const h = createHarness(), game = h.newGame('oblehani_plzne_1433');
    const hussites = game.units.filter(unit => unit.faction === 'hussites');
    // Pravý a horní okraj města dříve nebyl ve skryté šestici vítězných polí.
    [[18,4], [19,4]].forEach(([col, row], index) => {
        hussites[index].col = col;
        hussites[index].row = row;
    });
    game.victoryConditionsSystem.checkMidGameVictory();
    assert.equal(game.gameState, 'playing');

    hussites[2].col = 19;
    hussites[2].row = 8;
    game.victoryConditionsSystem.checkMidGameVictory();
    assert.equal(game.gameState, 'victory');
    assert.ok(game.log.some(line => line.message.includes('victoryCapturePosition')));
});

test('dvojklik spotřebuje jediný útok a během animace nelze ukončit tah', async () => {
    const h = createHarness(), { game, attacker, defender } = duel(h);
    game.selectedUnit = attacker;
    const hex = { col: defender.col, row: defender.row };
    game.handleHexClick(hex);
    const health = defender.health;
    game.handleHexClick(hex);
    assert.equal(attacker.attackCount, 1);
    assert.equal(defender.health, health);
    assert.equal(game.endTurn(), false);
    assert.equal(game.currentFaction, 'hussites');
    assert.equal(game.saveGame(), false);
    await h.advance(500);
    assert.equal(game.actions.busy, false);
    assert.equal(attacker.attackCount, 1);
    assert.equal(game.saveGame(), true);
});

test('po konci bitvy lze jednotky jen prohlížet, ne jim vydávat rozkazy', () => {
    const h = createHarness({ browserView: true }), { game, attacker, defender } = duel(h);
    const before = game.units.map(unit => unit.serialize());

    game.gameState = 'victory';
    game.actions.destroy();
    game.handleHexClick({ col: defender.col, row: defender.row });

    assert.equal(game.selectedUnit, defender, 'lze otevřít i detail viditelného protivníka');
    assert.equal(game.hexGrid.selectedHex.col, defender.col);
    assert.equal(game.hexGrid.highlightedHexes.length, 0);
    assert.equal(game.hexGrid.attackableHexes.length, 0);
    assert.equal(h.document.getElementById('unit-actions').classList.contains('hidden'), true);
    assert.deepEqual(game.units.map(unit => unit.serialize()), before);

    const empty = [...game.hexGrid.hexes.values()].find(hex => !game.getUnitAt(hex.col, hex.row));
    game.handleHexClick(empty);
    assert.equal(game.selectedUnit, null);
    assert.equal(game.endTurn(), false);
    assert.deepEqual(game.units.map(unit => unit.serialize()), before);
});

test('rychlostřelba stále dovoluje dva dokončené útoky, třetí odmítne', async () => {
    const h = createHarness(), { game, attacker, defender } = duel(h, 'LUCISTNICI');
    await Promise.all([game.combatSystem.performAttack(attacker, defender), h.advance(500)]);
    await Promise.all([game.combatSystem.performAttack(attacker, defender), h.advance(500)]);
    assert.equal(attacker.attackCount, 2);
    assert.equal(await game.combatSystem.performAttack(attacker, defender), false);
});

test('konec tahu ponechá stojícím střelcům výstřel a ostatním nevyužitým oddílům zapne obranu', () => {
    const h = createHarness(), game = h.newGame();
    game.scheduleAI = () => {};
    const fresh = game.unitFactory.createUnit('CEPNICI', 1, 1);
    const moved = game.unitFactory.createUnit('CEPNICI', 2, 1); moved.hasMoved = true;
    const attacked = game.unitFactory.createUnit('CEPNICI', 3, 1); attacked.hasAttacked = true;
    const spent = game.unitFactory.createUnit('CEPNICI', 4, 1); spent.hasMoved = spent.hasAttacked = true;
    const rapid = game.unitFactory.createUnit('LUCISTNICI', 5, 1); rapid.faction = 'hussites'; rapid.attackCount = 1; rapid.hasAttacked = true;
    const fort = game.unitFactory.createUnit('POLNI_OPEVNENI', 6, 1);
    const routing = game.unitFactory.createUnit('CEPNICI', 7, 1); routing.isRouting = true;
    const enemy = game.unitFactory.createUnit('KOPINICI', 8, 1);
    const shooter = game.unitFactory.createUnit('RUCNICARI', 9, 1);
    const movedShooter = game.unitFactory.createUnit('RUCNICARI', 10, 1); movedShooter.hasMoved = true;
    const manualDefender = game.unitFactory.createUnit('RUCNICARI', 11, 1); manualDefender.defend();
    const firedShooter = game.unitFactory.createUnit('RUCNICARI', 12, 1); firedShooter.hasAttacked = true;
    const wagon = game.unitFactory.createUnit('VOZOVA_HRADBA', 13, 1);
    game.units = [fresh, moved, attacked, spent, rapid, fort, routing, enemy, shooter, movedShooter, manualDefender, firedShooter, wagon];

    game.endTurn();
    assert.equal(game.currentFaction, 'crusaders');
    for (const unit of [fresh, moved, attacked, movedShooter, manualDefender, firedShooter]) {
        assert.equal(unit.isDefending, true, unit.type);
        assert.equal(unit.hasMoved, true, unit.type);
        assert.equal(unit.hasAttacked, true, unit.type);
    }
    for (const unit of [rapid, fort, shooter, wagon]) {
        assert.equal(unit.isDefending, false, unit.type);
        assert.equal(unit.hasMoved, false, unit.type);
        assert.equal(game.isCoverFireReady(unit), true, unit.type);
    }
    for (const unit of [spent, routing, enemy]) assert.equal(unit.isDefending, false, unit.type);
    assert.equal(game.isCoverFireReady(manualDefender), false);
    assert.equal(game.log.filter(line => line.message.includes('gameLog.autoDefend')).length, 1);
    assert.ok(game.log.some(line => line.message.includes('gameLog.autoDefend') && line.message.includes('"count":5')));
    assert.ok(game.log.some(line => line.message.includes('gameLog.autoCoverFire') && line.message.includes('"count":4')));

    game.endTurn();
    assert.equal(game.currentFaction, 'hussites');
    for (const unit of [fresh, moved, attacked, spent, rapid, fort, routing, shooter, movedShooter, manualDefender, firedShooter, wagon]) {
        assert.equal(unit.isDefending, false, unit.type);
    }
    game.destroy();
});

test('střelec po konci tahu reaguje na nepřátelský přesun bez bonusu obrany', async () => {
    const h = createHarness(), game = h.newGame();
    game.scheduleAI = () => {};
    const shooter = game.unitFactory.createUnit('RUCNICARI', 5, 5);
    const enemy = game.unitFactory.createUnit('TEZKY_RYTIR', 7, 5);
    const reserve = game.unitFactory.createUnit('CEPNICI', 15, 9);
    game.units = [shooter, enemy, reserve];
    game.endTurn();
    assert.equal(game.currentFaction, 'crusaders');
    assert.equal(shooter.isDefending, false);
    assert.equal(game.isCoverFireReady(shooter), true);
    enemy.col = 6;
    const health = enemy.health;
    const reaction = game.triggerOverwatch(enemy);
    await h.advance(600); await reaction;
    assert.equal(shooter.attackCount, 1);
    assert.ok(enemy.health < health);
    assert.equal(game.isCoverFireReady(shooter), false);
    game.destroy();
});

test('automatická obrana se ukládá a načítá jako ručně zvolený postoj', () => {
    const h = createHarness(), game = h.newGame();
    const player = game.units.find(unit => unit.faction === 'hussites' && unit.range < 2);
    assert.ok(player, 'výchozí bitva obsahuje oddíl bez střelby na dálku');
    assert.ok(game.autoDefendUnusedUnits('hussites') > 0);
    assert.equal(player.isDefending, true);
    assert.equal(game.saveGame(), true);
    const restored = h.SaveGameSystem.load(h.document.getElementById('game-canvas'), game);
    assert.equal(restored.units.find(unit => unit.id === player.id).isDefending, true);
    restored.destroy();
});

test('uložení zachová připravenou krycí palbu i vědomou obranu střelce', () => {
    const h = createHarness(), game = h.newGame();
    const ready = game.unitFactory.createUnit('RUCNICARI', 5, 5);
    const defending = game.unitFactory.createUnit('RUCNICARI', 6, 5); defending.defend();
    const melee = game.unitFactory.createUnit('CEPNICI', 7, 5);
    const enemy = game.unitFactory.createUnit('TEZKY_RYTIR', 8, 5);
    game.units = [ready, defending, melee, enemy];
    game.autoDefendUnusedUnits('hussites');
    assert.equal(game.saveGame(), true);
    const restored = h.SaveGameSystem.load(h.document.getElementById('game-canvas'), game);
    const byId = id => restored.units.find(unit => unit.id === id);
    assert.equal(restored.isCoverFireReady(byId(ready.id)), true);
    assert.equal(byId(ready.id).isDefending, false);
    assert.equal(restored.isCoverFireReady(byId(defending.id)), false);
    assert.equal(byId(defending.id).isDefending, true);
    assert.equal(byId(melee.id).isDefending, true);
    restored.destroy();
});

test('Sudoměř uzná draze zaplacené vítězství, jen když z protivníka zůstal samotný velitel', () => {
    const h = createHarness();
    const prepare = () => {
        const game = h.newGame('sudomere_1420');
        game.turnNumber = 13;
        const player = game.units.filter(unit => unit.faction === 'hussites');
        player.slice(4).forEach(unit => { unit.health = 0; });
        return game;
    };

    const won = prepare();
    won.units.filter(unit => unit.faction === 'crusaders' && !unit.isCommander()).forEach(unit => { unit.health = 0; });
    won.victoryConditionsSystem.checkScenarioVictoryConditions();
    assert.equal(won.view.result.isVictory, true);
    assert.match(won.view.result.stats.reason, /victoryFieldArmyEliminated/);

    const lost = prepare();
    const fieldUnits = lost.units.filter(unit => unit.faction === 'crusaders' && !unit.isCommander());
    fieldUnits.slice(1).forEach(unit => { unit.health = 0; });
    lost.victoryConditionsSystem.checkScenarioVictoryConditions();
    assert.equal(lost.view.result.isVictory, false);
    assert.match(lost.view.result.stats.reason, /defeatSurvival/);
});

test('Kutná Hora na konci uzná rozbití polní armády, jen pokud Žižka přežije', () => {
    const h = createHarness();
    const prepare = () => {
        const game = h.newGame('kutna_hora_1421');
        game.units.filter(unit => unit.faction === 'crusaders' && !unit.isCommander())
            .forEach(unit => { unit.health = 0; });
        return game;
    };

    const historical = h.newGame('kutna_hora_1421');
    historical.escapedUnits = 5;
    historical.turnNumber = 4;
    historical.victoryConditionsSystem.checkScenarioVictoryConditions();
    assert.equal(historical.view.result.isVictory, true, 'historický ústup zůstává hlavní okamžitou cestou');
    assert.match(historical.view.result.stats.reason, /victoryEscape/);
    historical.destroy();

    const early = prepare();
    early.turnNumber = 8;
    early.victoryConditionsSystem.checkScenarioVictoryConditions();
    assert.equal(early.gameState, 'playing', 'alternativa se nesmí vyhodnotit před koncem bitvy');
    early.destroy();

    const won = prepare();
    won.turnNumber = 9;
    won.victoryConditionsSystem.checkScenarioVictoryConditions();
    assert.equal(won.view.result.isVictory, true);
    assert.match(won.view.result.stats.reason, /victoryAlternativeFieldArmy/);
    won.destroy();

    const fieldUnitSurvives = prepare();
    fieldUnitSurvives.units.find(unit => unit.faction === 'crusaders' && !unit.isCommander()).health = 1;
    fieldUnitSurvives.turnNumber = 9;
    fieldUnitSurvives.victoryConditionsSystem.checkScenarioVictoryConditions();
    assert.equal(fieldUnitSurvives.view.result.isVictory, false);
    fieldUnitSurvives.destroy();

    const zizkaFell = prepare();
    zizkaFell.units.find(unit => unit.type === 'JAN_ZIZKA').health = 0;
    zizkaFell.turnNumber = 9;
    zizkaFell.victoryConditionsSystem.checkScenarioVictoryConditions();
    assert.equal(zizkaFell.view.result.isVictory, false);
    zizkaFell.destroy();
});

test('Nekmíř vede Hynka do boje a vyžaduje jeho vyřazení, ne jen pasivní přežití', () => {
    const h = createHarness(), game = h.newGame('nekmir_1419');
    game.currentFaction = 'crusaders';
    const hynek = game.units.find(unit => unit.type === 'HYNEK_NEKMIRE');
    const action = h.AI.decideAction(game, hynek);
    assert.equal(action.type, 'move');
    const before = Math.min(...game.getEnemyUnits('crusaders').map(unit =>
        game.hexGrid.getDistance(hynek.col, hynek.row, unit.col, unit.row)));
    const after = Math.min(...game.getEnemyUnits('crusaders').map(unit =>
        game.hexGrid.getDistance(action.col, action.row, unit.col, unit.row)));
    assert.ok(after < before, 'Hynek má postupovat k boji, ne do severozápadního lesa');

    game.currentFaction = 'hussites';
    game.view.notifications = [];
    game.turnNumber = 6; hynek.col = 8;
    game.updatePhase(); game.checkPhaseEvents();
    assert.equal(game.currentPhase.id, 4);
    assert.ok(game.view.notifications.some(event => event.text.includes('Hynek')));

    game.turnNumber = 11;
    game.victoryConditionsSystem.checkScenarioVictoryConditions();
    assert.equal(game.view.result.isVictory, false, 'pouhé čekání a přežití nestačí');
    assert.match(game.view.result.stats.reason, /defeatSurvivalTarget/);
    game.destroy();

    const active = h.newGame('nekmir_1419');
    active.units.find(unit => unit.type === 'HYNEK_NEKMIRE').health = 0;
    active.turnNumber = 11;
    active.victoryConditionsSystem.checkScenarioVictoryConditions();
    assert.equal(active.view.result.isVictory, true, 'po vyřazení Hynka je přežití platné vítězství');
    active.destroy();
});

test('Nekmíř nelze vyhrát opakovaným ukončováním tahů bez rozkazů', async () => {
    const h = createHarness(), game = h.newGame('nekmir_1419');
    for (let i = 0; i < 12 && game.gameState === 'playing'; i++) {
        game.endTurn();
        await h.advance(60000);
    }
    assert.ok(game.view.result, 'bitva musí dojít k výsledku');
    assert.equal(game.view.result.isVictory, false);
    assert.ok(game.units.find(unit => unit.type === 'HYNEK_NEKMIRE').health > 0);
    game.destroy();
});

test('protizásah započítá smrt a škodu ještě před animací', async () => {
    const h = createHarness(), { game, attacker, defender } = duel(h, 'CEPNICI', 'HALAPARTNICI');
    attacker.health = 1;
    const attacking = game.combatSystem.performAttack(attacker, defender);
    assert.ok(attacker.health <= 0);
    assert.equal(game.unitsLost, 1);
    assert.ok(game.stats.damageTaken > 0);
    await h.advance(600); await attacking;
    assert.equal(game.unitsLost, 1);
});

test('celý jezdecký nájezd AI skončí před předáním tahu i při zrychlení', async () => {
    const h = createHarness(), game = h.newGame();
    const rider = game.unitFactory.createUnit('TEZKY_RYTIR', 4, 5);
    const player = game.unitFactory.createUnit('CEPNICI', 7, 5);
    const reserve = game.unitFactory.createUnit('CEPNICI', 15, 9);
    game.units = [rider, player, reserve]; game.currentFaction = 'crusaders'; game.fastForwardAI = true;
    const action = h.AI.decideAction(game, rider);
    assert.equal(action.type, 'move'); assert.equal(action.followUpAttack, player);
    const running = game.runAI();
    await h.advance(90);
    assert.equal(game.currentFaction, 'crusaders');
    await h.advance(2000); await running;
    assert.equal(game.currentFaction, 'hussites');
    assert.equal(rider.attackCount, 1);
    const health = player.health;
    await h.advance(2000);
    assert.equal(player.health, health);
});

test('smrt v reakční palbě zruší navazující nájezd', async () => {
    const h = createHarness(), game = h.newGame();
    const rider = game.unitFactory.createUnit('TEZKY_RYTIR', 4, 5);
    const watcher = game.unitFactory.createUnit('RUCNICARI', 6, 5);
    rider.health = 1; game.units = [rider, watcher]; game.currentFaction = 'crusaders';
    const moving = game.moveUnit(rider, 5, 5, watcher);
    await h.advance(1000); await moving;
    assert.equal(rider.attackCount, 0);
    assert.ok(rider.health <= 0);
    assert.equal(watcher.health, watcher.maxHealth);
    assert.equal(watcher.attackCount, 1);
});

test('druhá reakční jednotka nestřílí do již mrtvého cíle', async () => {
    const h = createHarness(), game = h.newGame();
    const rider = game.unitFactory.createUnit('TEZKY_RYTIR', 4, 5);
    const first = game.unitFactory.createUnit('RUCNICARI', 6, 5);
    const second = game.unitFactory.createUnit('RUCNICARI', 6, 6);
    rider.health = 1; game.units = [rider, first, second]; game.currentFaction = 'crusaders';
    const moving = game.moveUnit(rider, 5, 5);
    await h.advance(1000); await moving;
    assert.equal(first.attackCount, 1); assert.equal(second.attackCount, 0);
    assert.equal(game.enemiesKilled, 1);
});

test('mlha má stejná pravidla pro zvýraznění i skutečný útok', async () => {
    const h = createHarness(), game = h.newGame();
    const player = game.unitFactory.createUnit('TARASNICE', 2, 3);
    const scout = game.unitFactory.createUnit('ZVED_KRIZACI', 5, 4);
    game.units = [player, scout]; game.fogOfWar = true;
    game.hexGrid.setTerrain(5, 4, 'forest'); game.fogOfWarSystem.updateVisibility();
    assert.equal(game.fogOfWarSystem.isEnemyVisible(scout), false);
    assert.equal(game.combatSystem.getValidAttackTargets(player).length, 0);
    assert.equal(await game.combatSystem.performAttack(player, scout), false);
    game.fogOfWar = false;
    assert.equal(game.combatSystem.canAttack(player, scout), true);
});

test('žízeň se aplikuje jednou za sudé kolo', () => {
    const h = createHarness(), { game, attacker, defender } = duel(h, 'CEPNICI', 'KOPINICI');
    game.currentScenario = { playerFaction: 'hussites', specialMechanics: { noWater: true } };
    game.turnNumber = 2;
    const morale = attacker.morale;
    game.moraleSystem.regenerateMorale();
    game.currentFaction = defender.faction;
    game.moraleSystem.regenerateMorale();
    assert.equal(attacker.morale, morale - 5);
});

test('načtení během jiné bitvy obnoví správný scénář, grid a jednotky', () => {
    const h = createHarness(), saved = h.newGame('zivohost_1419');
    saved.turnNumber = 3; saved.saveGame(); saved.destroy();
    const other = h.newGame('sion_1437');
    const restored = h.SaveGameSystem.load(h.document.getElementById('game-canvas'), other);
    assert.equal(other.gameState, 'destroyed');
    assert.equal(restored.currentScenario.id, 'zivohost_1419');
    assert.equal(restored.hexGrid.cols, h.Scenarios.zivohost_1419.mapSize.width);
    assert.equal(restored.turnNumber, 3);
    assert.equal(restored.units[0].type, saved.units[0].type);
    assert.equal(restored.view.notifications.length, 0, 'nespouštět znovu úvodní eventy');
});

test('save v4 zachová celý stabilní snapshot včetně terénu a statistik', () => {
    const h = createHarness(), game = h.newGame('most_1421');
    game.hexGrid.setTerrain(0, 0, 'mud'); game.units[0].health = 0;
    game.units[0].escaped = true; game.units[0]._deathCounted = true;
    game.fledByFaction.hussites = 1; game.unitsLost = 1;
    game.units[1].breachedTurns = 1; game.campaignReputation = 0;
    game.objectiveHeldTurns = { city: 1 }; game.aiStance = { mode: 'hold', target: null, untilTurn: 8, proximity: 3 };
    game.saveGame();
    const before = JSON.parse(h.storage.get(h.SaveGameSystem.STORAGE_KEY));
    const restored = h.SaveGameSystem.load(h.document.getElementById('game-canvas'), game);
    restored.saveGame();
    const after = JSON.parse(h.storage.get(h.SaveGameSystem.STORAGE_KEY));
    assert.deepEqual(after, before);
});

test('starší savy v1–v3 lze načíst a obnovit uložený tah AI jen jednou', async () => {
    for (const version of [1, 2, 3]) {
        const h = createHarness(), original = h.newGame('zivohost_1419');
        original.saveGame();
        const data = JSON.parse(h.storage.get(h.SaveGameSystem.STORAGE_KEY));
        data.version = version; delete data.terrain; data.currentFaction = 'crusaders';
        h.storage.set(h.SaveGameSystem.STORAGE_KEY, JSON.stringify(data));
        const game = h.SaveGameSystem.load(h.document.getElementById('game-canvas'), original);
        let runs = 0;
        h.AI.takeTurn = async () => { runs++; await game.actions.wait(100); game.endTurn(); };
        await h.advance(500);
        game.runAI();
        await h.advance(1000);
        assert.equal(runs, 1); assert.equal(game.currentFaction, 'hussites');
    }
});

test('poškozený nebo nekompatibilní save ponechá současnou bitvu beze změny', () => {
    const h = createHarness(), game = h.newGame('sion_1437');
    game.saveGame(); const data = JSON.parse(h.storage.get(h.SaveGameSystem.STORAGE_KEY));
    for (const bad of ['{', { ...data, version: 999 }, { ...data, scenarioId: 'missing' },
        { ...data, units: [{ ...data.units[0], type: 'missing' }] },
        { ...data, units: [{ ...data.units[0], col: -1 }] }, { ...data, stats: {} },
        { ...data, nextUnitId: 1.5 }, { ...data, wavering: 'broken' },
        { ...data, fogOfWar: 'false' }]) {
        h.storage.set(h.SaveGameSystem.STORAGE_KEY, typeof bad === 'string' ? bad : JSON.stringify(bad));
        assert.throws(() => h.SaveGameSystem.load(h.document.getElementById('game-canvas'), game));
        assert.equal(game.gameState, 'playing'); assert.equal(game.actions.destroyed, false);
    }
});

test('pauza zastaví rozpracovanou akci; pokračování dokončí zbývající animaci', async () => {
    const h = createHarness(), { game, attacker, defender } = duel(h);
    const pending = game.combatSystem.performAttack(attacker, defender);
    await h.advance(100); game.setPaused(true);
    await h.advance(1000);
    assert.equal(game.actions.busy, true); assert.equal(game.endTurn(), false);
    game.setPaused(false); await h.advance(199);
    assert.equal(game.actions.busy, true);
    await h.advance(1); await pending;
    assert.equal(game.actions.busy, false);
});

test('nahrazení hry během útoku zruší staré callbacky a nepoškodí novou hru', async () => {
    const h = createHarness(), { game, attacker, defender } = duel(h, 'CEPNICI', 'HALAPARTNICI');
    game.saveGame();
    const attack = game.combatSystem.performAttack(attacker, defender);
    await h.advance(300);
    assert.equal(game.actions.busy, true, 'protiútok ještě není dokončen');
    assert.ok(game.view.effects.length > 0, 'číslo poškození už je zobrazeno');
    const restored = h.SaveGameSystem.load(h.document.getElementById('game-canvas'), game);
    const hp = restored.units.map(unit => unit.health);
    await h.advance(5000); await attack;
    assert.equal(game.gameState, 'destroyed');
    assert.deepEqual(restored.units.map(unit => unit.health), hp);
    assert.equal(restored.gameState, 'playing');
    assert.equal(game.actions.waits.size, 0);
    assert.equal(game.view.effects.length, 0, 'odstranit vizuální efekty staré bitvy');
    assert.equal(game.view.destroyed, true);
});

(async () => {
    let failures = 0;
    for (const { name, run } of tests) {
        let timeout;
        try {
            await Promise.race([run(), new Promise((_, reject) => {
                timeout = setTimeout(() => reject(new Error('Test did not settle')), 2000);
            })]);
            console.log(`✓ ${name}`);
        }
        catch (error) { failures++; console.error(`✗ ${name}\n${error.stack}`); }
        finally { clearTimeout(timeout); }
    }
    console.log(`\n${tests.length - failures}/${tests.length} battle testů.`);
    if (failures) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
