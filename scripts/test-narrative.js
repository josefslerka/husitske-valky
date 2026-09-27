#!/usr/bin/env node
const assert = require('node:assert/strict');
const { createLocalizedHarness } = require('./helpers/localized-harness');
const tests = [];
const test = (name, run) => tests.push({ name, run });

async function fixture(id, language = 'cs') {
    const h = await createLocalizedHarness(language);
    const game = h.newGame(id);
    return { h, game };
}

function unitState(game) { return JSON.stringify(game.units.map(unit => unit.serialize())); }
function pilgrims(game) { return game.units.filter(unit => unit.type === 'POUTNICI'); }
function setProkop(game, status) {
    const prokop = game.units.find(unit => unit.type === 'PROKOP_HOLY');
    prokop.health = status === 'alive' ? 1 : 0;
    prokop.escaped = status === 'escaped';
}

for (const lang of ['cs', 'en']) {
    for (const [remaining, variant] of [[3, 'allPilgrims'], [1, 'somePilgrims'], [0, 'noPilgrims']]) {
        test(`${lang}: Živohošť má vlastní závěr pro ${remaining} zbývajících skupin poutníků`, async () => {
            const { h, game } = await fixture('zivohost_1419', lang);
            pilgrims(game).forEach((unit, index) => { unit.health = index < remaining ? 1 : 0; });
            const before = unitState(game);
            game.showVictory('hussites');
            const key = `scenarios.zivohost_1419.debriefing.victoryVariants.${variant}`;
            assert.equal(h.i18n.hasTranslation(key), true);
            assert.equal(game.view.result.message, h.i18n.t(key));
            assert.match(game.view.result.message, lang === 'cs' ? /autorská fikce, nikoli citace pramene/ : /fiction, not a historical quotation/);
            assert.equal(unitState(game), before, 'narativ nemění pravidla ani jednotky');
            assert.doesNotMatch(game.view.result.message, /Posily z Nového Knína dorazily|Reinforcements from Nový Knín arrived/,
                'brzké vítězství nesmí oznamovat nedorazivší posily');
        });
    }

    for (const status of ['alive', 'fallen', 'escaped']) {
        test(`${lang}: lipanská zpráva ve 12. kole respektuje Prokopův stav ${status}`, async () => {
            const { game } = await fixture('lipany_1434', lang);
            setProkop(game, status);
            game.turnNumber = 12; game.updatePhase();
            const before = unitState(game), notifications = game.view.notifications.length;
            game.checkPhaseEvents(); game.checkPhaseEvents();
            const event = game.currentScenario.phases[3].events[0];
            assert.equal(game.view.notifications.length, notifications + 1);
            assert.equal(game.view.notifications.at(-1).text, event.unitStatus.texts[status]);
            assert.equal(game.processedEvents.has('phase4_evt0'), true, 'zachovat identitu eventu pro staré savy');
            assert.equal(unitState(game), before);
        });

        test(`${lang}: vítězný závěr Lipan respektuje Prokopův stav ${status}`, async () => {
            const { game } = await fixture('lipany_1434', lang);
            setProkop(game, status);
            // Výhra před nastražením léčky, vozy záměrně rozpojené.
            game.units.filter(unit => unit.isWagon()).forEach(unit => { unit.formationClosed = false; });
            game.showVictory('hussites');
            const ending = game.currentScenario.debriefing;
            assert.equal(game.view.result.message, `${ending.victory}\n\n${ending.unitStatus.texts[status]}`);
            assert.doesNotMatch(game.view.result.message, /zůstali ve vozové hradbě|stayed in the wagon fort|odhalil léčku|saw through the ruse/i);
        });
    }

    test(`${lang}: při porážce Lipan je skutečný Prokopův osud oddělen od stylizované kroniky`, async () => {
        const { h, game } = await fixture('lipany_1434', lang);
        game.showVictory('crusaders');
        assert.equal(h.i18n.hasTranslation('chronicle.enemyVoiceLabel'), true);
        const label = h.i18n.t('chronicle.enemyVoiceLabel');
        const ending = game.currentScenario.debriefing;
        assert.ok(game.view.result.message.startsWith(`${ending.defeat}\n\n${ending.unitStatus.texts.alive}`));
        assert.ok(game.view.result.message.includes(`\n\n${label}\n${h.ChronicleSystem.getEnemyChronicleText('lipany_1434', true)}`));
    });
}

test('uprchlí poutníci nepatří mezi přítomné; posily ani cizí frakce je nenahrazují', async () => {
    const { game } = await fixture('zivohost_1419');
    for (const unit of pilgrims(game)) { unit.health = 0; unit.escaped = true; }
    game.spawnReinforcements({ type: 'POUTNICI', position: [16, 9] }, 'hussites');
    const enemy = game.unitFactory.createUnit('POUTNICI', 16, 10);
    enemy.faction = 'crusaders'; game.units.push(enemy);
    game.showVictory('hussites');
    assert.equal(game.view.result.message, game.currentScenario.debriefing.victoryVariants.noPilgrims);
    assert.doesNotMatch(game.view.result.message, /všichni.*padli|všichni.*zemřeli|všichni.*pobiti/i);
});

test('save/load zachová variantu Živohoště i rozlišení padlého a uprchlého Prokopa', async () => {
    for (const id of ['zivohost_1419', 'lipany_1434']) {
        for (const status of ['alive', 'fallen', 'escaped']) {
            const { h, game } = await fixture(id);
            if (id === 'lipany_1434') setProkop(game, status);
            else pilgrims(game).forEach((unit, index) => { unit.health = index === 0 ? 1 : 0; });
            const before = game.scenarioEventSystem.getDebriefing(true);
            assert.equal(game.saveGame(), true);
            const restored = h.SaveGameSystem.load(h.document.getElementById('game-canvas'), game);
            assert.equal(restored.scenarioEventSystem.getDebriefing(true), before);
            if (id === 'lipany_1434') {
                restored.turnNumber = 12; restored.updatePhase(); restored.checkPhaseEvents();
                assert.equal(restored.view.notifications.at(-1).text, restored.currentScenario.phases[3].events[0].unitStatus.texts[status]);
            }
        }
    }
});

test('chybějící Prokop ve starém savu neznamená automaticky jeho smrt', async () => {
    const { game } = await fixture('lipany_1434');
    game.units = game.units.filter(unit => unit.type !== 'PROKOP_HOLY');
    game.turnNumber = 12; game.updatePhase(); game.checkPhaseEvents();
    assert.equal(game.view.notifications.at(-1).text, game.currentScenario.phases[3].events[0].message);
    assert.equal(game.scenarioEventSystem.getDebriefing(true), game.currentScenario.debriefing.victory);
});

test('načtení po lipanské zprávě ji neopakuje a jiná frakce nemění Prokopův osud', async () => {
    const { h, game } = await fixture('lipany_1434');
    const impostor = game.unitFactory.createUnit('PROKOP_HOLY', 20, 12);
    impostor.faction = 'crusaders'; impostor.health = 0; game.units.push(impostor);
    game.turnNumber = 12; game.updatePhase(); game.checkPhaseEvents();
    assert.equal(game.view.notifications.at(-1).text, game.currentScenario.phases[3].events[0].unitStatus.texts.alive);
    assert.equal(game.saveGame(), true);
    const restored = h.SaveGameSystem.load(h.document.getElementById('game-canvas'), game);
    restored.checkPhaseEvents();
    assert.equal(restored.view.notifications.length, 0);
});

test('narativní úprava Lipan nemění kola událostí, léčku AI ani jednotky', async () => {
    const { game } = await fixture('lipany_1434');
    const scenario = game.currentScenario;
    assert.deepEqual(Array.from(scenario.phases, phase => Array.from(phase.turnRange)), [[1, 4], [5, 7], [8, 10], [11, 15]]);
    assert.deepEqual(Array.from(scenario.phases, phase => Array.from(phase.events, event => event.trigger)), [
        ['turn_1', 'turn_2'], ['turn_5', 'turn_6'], ['turn_8'], ['turn_12']
    ]);
    const before = unitState(game);
    game.turnNumber = 6; game.updatePhase(); game.checkPhaseEvents();
    assert.deepEqual(JSON.parse(JSON.stringify(game.aiStance)), {
        mode: 'lure', target: { col: 2, row: 6 }, untilTurn: 7, proximity: 3
    });
    assert.equal(unitState(game), before);
});

test('přepnutí CS → EN → CS obnoví všechny varianty, ale nezmění herní stav', async () => {
    for (const id of ['zivohost_1419', 'sudomere_1420', 'kutna_hora_1421', 'lipany_1434']) {
        const { h, game } = await fixture(id);
        h.context.window.game = game;
        const before = unitState(game), original = game.scenarioEventSystem.getDebriefing(true);
        await h.i18n.setLanguage('en');
        assert.notEqual(game.scenarioEventSystem.getDebriefing(true), original);
        const translated = h.getLocalizedScenario(id, h.Scenarios[id]);
        assert.deepEqual(game.currentScenario.debriefing, translated.debriefing);
        await h.i18n.setLanguage('cs');
        assert.equal(game.scenarioEventSystem.getDebriefing(true), original);
        assert.equal(unitState(game), before);
    }
});

test('vyšehradská zpráva používá český overlay a samostatné posily mají oba jazyky', async () => {
    const h = await createLocalizedHarness('cs');
    const czech = h.getLocalizedScenario('vysehrad_1420', h.Scenarios.vysehrad_1420);
    assert.equal(czech.phases[3].events[1].message,
        'Jednotky uvolněné z obléhání Vyšehradu se připojují k bitvě!');
    await h.i18n.setLanguage('en');
    const english = h.getLocalizedScenario('vysehrad_1420', h.Scenarios.vysehrad_1420);
    assert.equal(english.phases[3].events[1].message,
        'Units freed from besieging Vyšehrad join the battle!');
    assert.equal(english.reinforcements.vysehradske_oddily.message,
        'Troops freed from the siege of Vyšehrad join the battle!');
    const most = h.getLocalizedScenario('most_1421', h.Scenarios.most_1421);
    assert.match(most.reinforcements.misenska_armada.message, /Meissen army/);
});

test('změna jazyka přeloží otevřenou i čekající hlášku bez opakování eventů', async () => {
    const h = await createLocalizedHarness('cs', { browserView: true });
    const game = h.newGame('vysehrad_1420');
    h.context.window.game = game;
    game.turnNumber = 8; game.updatePhase(); game.checkPhaseEvents();
    const processed = [...game.processedEvents];
    const view = game.view;
    assert.ok(view.activeEventNotificationItem);
    assert.ok(view.eventNotificationQueue.length > 1);
    await h.i18n.setLanguage('en');
    assert.match(view.activeEventNotificationItem.text, /deadline has expired/);
    assert.match(view.activeEventNotificationElements.body.textContent, /deadline has expired/);
    assert.equal(view.activeEventNotificationElements.button.textContent, h.i18n.t('menu.continue'));
    assert.ok(view.eventNotificationQueue.some(item => item.text ===
        'Units freed from besieging Vyšehrad join the battle!'));
    assert.ok(view.eventNotificationQueue.some(item => item.text ===
        'Troops freed from the siege of Vyšehrad join the battle!'));
    assert.deepEqual([...game.processedEvents], processed);
    await h.i18n.setLanguage('cs');
    assert.match(view.activeEventNotificationItem.text, /Lhůta vypršela/);
    assert.deepEqual([...game.processedEvents], processed);
    game.destroy();
});

test('posily, které dorazí až po změně jazyka, už nemluví česky', async () => {
    const h = await createLocalizedHarness('cs');
    const game = h.newGame('most_1421');
    h.context.window.game = game;
    await h.i18n.setLanguage('en');
    assert.equal(game.currentScenario.reinforcements.mostecka_posadka.message,
        'The Most militia sallies from the city gate!');
    game.turnNumber = 3; game.updatePhase(); game.checkPhaseEvents();
    assert.ok(game.view.notifications.some(item => item.text ===
        'The Most militia sallies from the city gate!'));
    game.destroy();
});

test('překlad čekající lipanské zprávy zachová stav Prokopa v okamžiku události', async () => {
    const h = await createLocalizedHarness('cs', { browserView: true });
    const game = h.newGame('lipany_1434');
    h.context.window.game = game;
    game.turnNumber = 12; game.updatePhase(); game.checkPhaseEvents();
    const expected = h.i18n.t('scenarios.lipany_1434.phases.3.events.0.unitStatus.texts.alive');
    assert.ok(game.view.eventNotificationQueue.some(item => item.text === expected));
    game.units.find(unit => unit.type === 'PROKOP_HOLY').health = 0;
    await h.i18n.setLanguage('en');
    const translated = h.i18n.t('scenarios.lipany_1434.phases.3.events.0.unitStatus.texts.alive');
    assert.ok(game.view.eventNotificationQueue.some(item => item.text === translated));
    game.destroy();
});

for (const lang of ['cs', 'en']) {
    test(`${lang}: draze vyhraná Sudoměř má pravdivý závěr a běžná výhra původní`, async () => {
        const { game } = await fixture('sudomere_1420', lang);
        const hussites = game.units.filter(unit => unit.faction === 'hussites');
        hussites.forEach((unit, index) => { unit.health = index < 4 ? 1 : 0; });
        game.units.filter(unit => unit.faction === 'crusaders' && !unit.isCommander()).forEach(unit => { unit.health = 0; });
        assert.equal(game.scenarioEventSystem.getDebriefing(true),
            game.currentScenario.debriefing.victoryVariants.fieldArmyEliminated);

        hussites.forEach(unit => { unit.health = 1; });
        assert.equal(game.scenarioEventSystem.getDebriefing(true), game.currentScenario.debriefing.victory);
    });

    test(`${lang}: alternativní vítězství u Kutné Hory má vlastní závěr i záznam v Kronice`, async () => {
        const { h, game } = await fixture('kutna_hora_1421', lang);
        assert.match(game.currentScenario.victoryConditions.primary.description,
            lang === 'cs' ? /Alternativa/ : /Alternative/);
        game.units.filter(unit => unit.faction === 'crusaders' && !unit.isCommander())
            .forEach(unit => { unit.health = 0; });
        game.turnNumber = 9;
        game.victoryConditionsSystem.checkScenarioVictoryConditions();
        const expected = game.currentScenario.debriefing.victoryVariants.fieldArmyEliminated;
        assert.equal(game.view.result.isVictory, true);
        assert.equal(game.view.result.message, expected);
        assert.match(expected, lang === 'cs' ? /odchyluje/ : /diverges/);
        const entry = h.ChronicleSystem.getEntries()[0];
        assert.equal(entry.narrative.victoryVariant, 'fieldArmyEliminated');
        assert.equal(h.ChronicleSystem.getPersonalEpilogue(entry), expected);
    });
}

test('ostatní scénáře zachovají dosavadní texty debriefingu', async () => {
    const { h } = await fixture('sudomere_1420');
    for (const id of Object.keys(h.Scenarios).filter(id => !['zivohost_1419', 'sudomere_1420', 'lipany_1434'].includes(id))) {
        const game = h.newGame(id);
        for (const victory of [true, false]) {
            assert.equal(game.scenarioEventSystem.getDebriefing(victory), game.currentScenario.debriefing[victory ? 'victory' : 'defeat'], id);
        }
        game.destroy();
    }
});

(async () => {
    let failures = 0;
    for (const { name, run } of tests) {
        try { await run(); console.log(`✓ ${name}`); }
        catch (error) { failures++; console.error(`✗ ${name}\n${error.stack}`); }
    }
    console.log(`\n${tests.length - failures}/${tests.length} narrative testů.`);
    if (failures) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
