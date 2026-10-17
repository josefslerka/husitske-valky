#!/usr/bin/env node
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { createHarness } = require('./helpers/game-harness');
const { createLocalizedHarness } = require('./helpers/localized-harness');
const { scenarioGameplay } = require('./helpers/scenario-gameplay');
const tests = [], test = (name, run) => tests.push({ name, run });
const digest = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const state = game => JSON.stringify({units:game.units.map(unit => unit.serialize()),
    turn:game.turnNumber, faction:game.currentFaction, stats:game.stats, stance:game.aiStance,
    routing:[...game.routingUnits], moraleBroken:game.moraleBroken, choral:game.choralUsed,
    terrain:[...game.hexGrid.hexes], events:[...game.processedEvents]});
const entries = scenarios => Object.entries(scenarios).filter(([id]) => id !== 'tachov_1427')
    .flatMap(([id,scenario]) => scenario.phases.flatMap((phase,p) => (phase.events || []).map((event,e) => ({id,p,e,event}))));
function normalized(game,p,e) {
    const phase = game.currentScenario.phases[p], event = phase.events[e];
    return {...event, type:event.type || 'message', id:event.id || `phase${phase.id}_evt${e}`,
        title:event.title || phase.name, text:event.text || event.message};
}
function notify(game,p,e) {
    game.scenarioEventSystem.showScenarioEventNotification(normalized(game,p,e),'messages.messageTitle');
    return game.view.notifications.at(-1).text;
}
function actor(game, status) { return game.units.find(unit => unit.type === status.type && unit.faction === status.faction); }
function setActor(unit,status) {
    unit.health = ['fallen','escaped'].includes(status) ? 0 : unit.maxHealth;
    unit.escaped = status === 'escaped'; unit.isRouting = status === 'routing'; unit.isTerrified = false;
}
function group(game, status) {
    return game.units.filter(unit => unit.faction === status.faction &&
        (status.kind === 'cavalry' ? unit.isCavalry() : status.kind === 'ranged' ? unit.isRanged() : !unit.isCommander()));
}

for (const language of ['cs','en']) {
    test(`${language}: reaktivní hlášky jsou krátké a nevysvětlují scénářový skript`, async () => {
        const h = await createLocalizedHarness(language);
        const technicalCopy = /samotná hláška|tato hláška|předem napsan|číslo kola|názvu fáze|scripted|prewritten|this message|phase itself|round number/i;
        for (const {id,p,e,event} of entries(h.Scenarios)) {
            if (!event.unitStatus && !event.forceStatus) continue;
            const texts = [event.text || event.message,
                ...Object.values(event.unitStatus?.texts || {}),
                ...Object.values(event.forceStatus?.texts || {})];
            for (const text of texts) {
                assert.equal(typeof text,'string',`${id} ${p}.${e}`);
                assert.ok(text.length <= 140,`${id} ${p}.${e}: příliš dlouhá hláška (${text.length})`);
                assert.doesNotMatch(text,technicalCopy,`${id} ${p}.${e}`);
            }
        }
    });

    test(`${language}: všechny hlášky velitelů rozlišují přítomnost, prchání, smrt a útěk`, async () => {
        const h = await createLocalizedHarness(language);
        for (const {id,p,e} of entries(h.Scenarios).filter(item => item.event.unitStatus)) {
            const game = h.newGame(id), event = game.currentScenario.phases[p].events[e];
            const unit = actor(game,event.unitStatus); assert.ok(unit, `${id}: ${event.unitStatus.type}`);
            const states = ['alive','fallen','escaped', ...(event.unitStatus.texts.routing ? ['routing'] : [])];
            for (const status of states) {
                setActor(unit,status); const before = state(game);
                assert.equal(notify(game,p,e),event.unitStatus.texts[status],`${id} ${status}`);
                assert.equal(state(game),before,'výběr hlášky neprovede rozkaz ani nepoužije RNG');
            }
            game.destroy();
        }
    });

    test(`${language}: všechny hlášky skupin rozlišují bojeschopné, prchající a nepřítomné oddíly`, async () => {
        const h = await createLocalizedHarness(language);
        for (const {id,p,e} of entries(h.Scenarios).filter(item => item.event.forceStatus)) {
            const game = h.newGame(id), event = game.currentScenario.phases[p].events[e];
            const units = group(game,event.forceStatus); assert.ok(units.length, id);
            for (const [status, fate] of [['ready','alive'],['routing','routing'],['absent','fallen'],['absent','escaped']]) {
                units.forEach(unit => setActor(unit,fate)); const before = state(game);
                assert.equal(notify(game,p,e),event.forceStatus.texts[status],`${id} ${status}`);
                assert.equal(state(game),before);
            }
            units.forEach(unit => setActor(unit,'routing')); setActor(units[0],'alive');
            assert.equal(notify(game,p,e),event.forceStatus.texts.ready,'část vojska prchá, ale celek není prohlášen za uprchlý');
            game.destroy();
        }
    });

    test(`${language}: Brod, Plzeň a Malešov neoznamují obsazení při předčasném vyřazení nepřítele`, async () => {
        const h = await createLocalizedHarness(language);
        for (const id of ['nemecky_brod_1422','oblehani_plzne_1433','malesov_1424']) {
            const game = h.newGame(id), before = state(game);
            assert.equal(game.scenarioEventSystem.captureNarrativeOutcome(true).victoryVariant,null,
                'samotná žádost o vítězný text při dosud živém nepříteli nedokazuje vyřazení');
            assert.equal(state(game),before);
            game.units.filter(unit => unit.faction === 'crusaders').forEach(unit => setActor(unit,'fallen'));
            game.enemiesKilled = game.initialEnemyUnits;
            game.victoryConditionsSystem.checkVictory();
            assert.equal(game.view.result.isVictory,true);
            const expected = game.currentScenario.debriefing.victoryVariants.enemyEliminated;
            assert.equal(game.view.result.message,expected);
            const entry = h.ChronicleSystem.getEntries()[0];
            assert.equal(entry.narrative.victoryVariant,'enemyEliminated');
            assert.equal(h.ChronicleSystem.getPersonalEpilogue(entry),expected);
            game.destroy();
            const occupied = h.newGame(id), primary = occupied.currentScenario.victoryConditions.primary;
            occupied.units.filter(unit => unit.faction === 'hussites').slice(0,primary.count)
                .forEach((unit,index) => { [unit.col,unit.row] = primary.positions[index]; });
            assert.equal(occupied.scenarioEventSystem.captureNarrativeOutcome(true).victoryVariant,null);
            assert.equal(occupied.scenarioEventSystem.getDebriefing(true),occupied.currentScenario.debriefing.victory);
            occupied.destroy();
        }
    });

    test(`${language}: Domažlice prohlásí přístup za zajištěný jen s oběma cílovými poli`, async () => {
        const h = await createLocalizedHarness(language), game = h.newGame('domazlice_1431');
        const target = game.currentScenario.victoryConditions.secondary[0];
        const units = game.units.filter(unit => unit.faction === 'hussites');
        assert.equal(game.scenarioEventSystem.captureNarrativeOutcome(true).victoryVariant,null);
        [units[0].col,units[0].row] = target.positions[0];
        assert.equal(game.scenarioEventSystem.captureNarrativeOutcome(true).victoryVariant,null);
        [units[1].col,units[1].row] = target.positions[1];
        assert.equal(game.scenarioEventSystem.captureNarrativeOutcome(true).victoryVariant,'approachSecured');
        assert.equal(game.scenarioEventSystem.captureNarrativeOutcome(false).victoryVariant,null);
        game.units.filter(unit => unit.faction === 'crusaders').forEach(unit => setActor(unit,'fallen'));
        game.enemiesKilled = game.initialEnemyUnits;
        game.victoryConditionsSystem.checkVictory();
        assert.equal(game.view.result.message,game.currentScenario.debriefing.victoryVariants.approachSecured);
        assert.equal(game.secondaryResults[0].achieved,true);
        const entry = h.ChronicleSystem.getEntries()[0];
        assert.equal(h.ChronicleSystem.getPersonalEpilogue(entry),game.view.result.message); game.destroy();
    });

    test(`${language}: závěr i Kronika Sionu uchovají skutečný Roháčův osud pro oba výsledky`, async () => {
        for (const status of ['alive','fallen','escaped']) for (const victory of [true,false]) {
            const h = await createLocalizedHarness(language), game = h.newGame('sion_1437');
            const debrief = game.currentScenario.debriefing;
            setActor(actor(game,debrief.unitStatus),status);
            game.showVictory(victory ? 'hussites':'crusaders');
            assert.ok(game.view.result.message.includes(debrief.unitStatus.texts[status]));
            const entry = h.ChronicleSystem.getEntries()[0];
            assert.equal(entry.narrative.unitState,status);
            assert.ok(h.ChronicleSystem.getPersonalEpilogue(entry).endsWith(debrief.unitStatus.texts[status]));
            game.units.find(unit => unit.type === 'JAN_ROHAC').health = 100;
            await h.i18n.setLanguage(language === 'cs' ? 'en':'cs');
            assert.ok(h.ChronicleSystem.getPersonalEpilogue(entry).endsWith(
                h.i18n.t(`scenarios.sion_1437.debriefing.unitStatus.texts.${status}`)));
            game.destroy();
        }
    });
}

test('neznámý, chybějící či duplicitní velitel nepředstírá smrt ani nepřevezme cizí hlas', async () => {
    for (const reason of ['missing','duplicate','wrongFaction']) {
        const h = await createLocalizedHarness(), game = h.newGame('horice_1423');
        const event = game.currentScenario.phases[3].events[0], unit = actor(game,event.unitStatus);
        if (reason === 'missing') game.units = game.units.filter(candidate => candidate !== unit);
        if (reason === 'duplicate') game.units.push(game.unitFactory.createUnit(unit.type,0,0));
        if (reason === 'wrongFaction') unit.faction = 'crusaders';
        assert.equal(notify(game,3,0),event.message);
        game.destroy();
    }
});
test('děs z ručnic není prchání; útěk má přednost před HP i starým příznakem prchání', async () => {
    const h = await createLocalizedHarness(), game = h.newGame('malesov_1424');
    const event = game.currentScenario.phases[3].events[0], unit = actor(game,event.unitStatus);
    unit.isTerrified = true; assert.equal(notify(game,3,0),event.unitStatus.texts.alive);
    const force = game.currentScenario.phases[3].events[1];
    group(game,force.forceStatus).forEach(candidate => { candidate.isTerrified = true; });
    assert.equal(notify(game,3,1),force.forceStatus.texts.ready);
    unit.isRouting = true; unit.health = 0; unit.escaped = true;
    assert.equal(notify(game,3,0),event.unitStatus.texts.escaped,'útěk má přednost před nulovým HP a starým routing flagem');
    game.destroy();
});
test('samotný stojící nepřátelský velitel nevytvoří bojeschopnou polní armádu', async () => {
    const h = await createLocalizedHarness(), game = h.newGame('horice_1423');
    const event = game.currentScenario.phases[3].events[1];
    group(game,event.forceStatus).forEach(unit => setActor(unit,'fallen'));
    assert.ok(game.units.some(unit => unit.faction === 'crusaders' && unit.isCommander() && unit.health > 0));
    assert.equal(notify(game,3,1),event.forceStatus.texts.absent); game.destroy();
});
test('prchání střelců neprohlásí za uprchlou celou vlastní pěchotu', async () => {
    const h = await createLocalizedHarness(), game = h.newGame('malesov_1424');
    const event = game.currentScenario.phases[2].events[0];
    group(game,event.forceStatus).forEach(unit => setActor(unit,'routing'));
    assert.ok(game.units.some(unit => unit.type === 'CEPNICI' && !unit.isRouting));
    assert.match(notify(game,2,0),/střelci/); game.destroy();
});
test('hláška velitele v mlze války neprozradí jeho smrt nebo prchání', async () => {
    const h = await createLocalizedHarness(), game = h.newGame('horice_1423');
    const event = game.currentScenario.phases[1].events[0], unit = actor(game,event.unitStatus);
    game.fogOfWar = true; game.visibleHexes = new Set();
    for (const status of ['alive','fallen','escaped','routing']) {
        setActor(unit,status); assert.equal(notify(game,1,0),event.message);
    }
    game.visibleHexes.add(`${unit.col},${unit.row}`);
    assert.equal(notify(game,1,0),event.unitStatus.texts.routing); game.destroy();
});
test('skrytá část nepřátelské skupiny zabrání tvrzení o útěku celé skupiny', async () => {
    const h = await createLocalizedHarness(), game = h.newGame('horice_1423');
    const event = game.currentScenario.phases[3].events[1], units = group(game,event.forceStatus);
    units.forEach(unit => setActor(unit,'routing')); game.fogOfWar = true;
    game.visibleHexes = new Set(units.map(unit => `${unit.col},${unit.row}`));
    game.visibleHexes.delete(`${units[0].col},${units[0].row}`);
    assert.equal(notify(game,3,1),event.message);
    game.visibleHexes.add(`${units[0].col},${units[0].row}`);
    assert.equal(notify(game,3,1),event.forceStatus.texts.routing); game.destroy();
});
test('čekající hlášky přeloží CS/EN, ale zachovají stav v okamžiku události', async () => {
    const h = await createLocalizedHarness('cs',{browserView:true}), game = h.newGame('horice_1423');
    h.context.window.game = game;
    const speaker = game.currentScenario.phases[3].events[0], force = game.currentScenario.phases[3].events[1];
    setActor(actor(game,speaker.unitStatus),'routing');
    group(game,force.forceStatus).forEach(unit => setActor(unit,'routing'));
    game.processEvent(normalized(game,3,0)); game.processEvent(normalized(game,3,1));
    const before = state(game), processed = [...game.processedEvents];
    await h.i18n.setLanguage('en');
    assert.equal(state(game),before);
    assert.ok(game.view.eventNotificationQueue.some(item => item.text ===
        h.i18n.t('scenarios.horice_1423.phases.3.events.0.unitStatus.texts.routing')));
    // Změna po vzniku zprávy ji nesmí přepsat na pozdější osud.
    actor(game,speaker.unitStatus).health = 0;
    group(game,force.forceStatus).forEach(unit => setActor(unit,'alive'));
    await h.i18n.setLanguage('cs');
    assert.ok(game.view.eventNotificationQueue.some(item => item.text === speaker.unitStatus.texts.routing));
    assert.ok(game.view.eventNotificationQueue.some(item => item.text === force.forceStatus.texts.routing));
    assert.deepEqual([...game.processedEvents],processed); game.destroy();
});
test('save před hláškou zachová osud; save po ní neprovede zprávu či účinky znovu', async () => {
    const h = await createLocalizedHarness(), game = h.newGame('horice_1423');
    setActor(game.units.find(unit => unit.type === 'JAN_ZIZKA'),'fallen');
    game.turnNumber = 8; assert.equal(game.saveGame(),true);
    let restored = h.SaveGameSystem.load(h.document.getElementById('game-canvas'),game);
    restored.turnNumber = 9; restored.updatePhase(); restored.checkPhaseEvents();
    assert.equal(restored.view.notifications.at(-1).text,restored.currentScenario.phases[3].events[0].unitStatus.texts.fallen);
    assert.equal(restored.processedEvents.has('phase4_evt0'),true);
    const before = state(restored); assert.equal(restored.saveGame(),true);
    restored = h.SaveGameSystem.load(h.document.getElementById('game-canvas'),restored);
    const count = restored.view.notifications.length; restored.checkPhaseEvents();
    assert.equal(restored.view.notifications.length,count); assert.equal(state(restored),before); restored.destroy();
});
test('nový narativ nemění účinky žádné scénářové události ani počet volání RNG', () => {
    const h = createHarness(), control = createHarness();
    for (const {id,p,e,event} of entries(h.Scenarios).filter(item => item.event.type &&
        !['message','tutorial','reinforcement'].includes(item.event.type))) {
        for (const fate of ['alive','routing','fallen']) {
            const game = h.newGame(id), baseline = control.newGame(id);
            for (const candidate of [game,baseline]) candidate.units.forEach(unit => setActor(unit,fate));
            for (const fixture of [h,control]) vm.runInContext('this.randomCalls = 0; Math.random = () => { randomCalls++; return 0.5; };',fixture.context);
            const actual = normalized(game,p,e), original = normalized(baseline,p,e);
            delete original.unitStatus; delete original.forceStatus;
            game.processEvent(actual); baseline.processEvent(original);
            assert.equal(state(game),state(baseline),`${id} ${event.type} ${fate}`);
            assert.equal(h.context.randomCalls,control.context.randomCalls);
            game.destroy(); baseline.destroy();
        }
    }
});
test('všechny jednotky, mapy, cíle, podmínky, účinky, ID a kola zůstaly nezměněné', () => {
    const h = createHarness();
    assert.equal(digest(scenarioGameplay(h.Scenarios)),'687eb15ae5192128341b0cf28dd9ce56ecef9fbe4e028127d47071340d5e9bca');
});
test('jazykový průchod zachoval všechny stavové a výsledkové větve', () => {
    const h = createHarness();
    const statusContract = status => status && {...status,texts:Object.keys(status.texts)};
    const contract = Object.fromEntries(Object.entries(h.Scenarios).map(([id,scenario]) => [id,{
        phases:scenario.phases.map(phase => ({id:phase.id,events:(phase.events || []).map(event => ({
            id:event.id,unitStatus:statusContract(event.unitStatus),forceStatus:statusContract(event.forceStatus)
        }))})),
        debriefing:scenario.debriefing && {
            unitStatus:statusContract(scenario.debriefing.unitStatus),
            victoryVariants:Object.keys(scenario.debriefing.victoryVariants || {})
        }
    }]));
    assert.equal(digest(contract),'189f3e4196ada48970fd57a26d8f4284f229ac3350b61a33aedee49404529986');
});
test('Tachov včetně všech českých i anglických textů zůstal zcela beze změny', () => {
    const h = createHarness();
    assert.equal(digest(h.Scenarios.tachov_1427),'78968c74ffb39a765c972342c870874a04014595da6836668fdb526032f64f82');
    for (const [lang,expected] of [['cs','fa5c7af3dbb2a082ecb620536ebfbaddebb047271cf1bc0ee1fd53b0ff187fbc'],
        ['en','13ffb2d0f9cffe2f230c7b41cd17ad423d8af88408d074191d3a04c3f834b748']]) {
        assert.equal(digest(JSON.parse(fs.readFileSync(path.join(__dirname,`../js/i18n/locales/${lang}.json`),'utf8')).scenarios.tachov_1427),expected);
    }
});
test('starší Kronika bez nových větví se nepřepíše ani si nedomyslí Roháčův osud', async () => {
    const h = await createLocalizedHarness();
    const legacy = {scenarioId:'sion_1437',result:'defeat',ts:1,
        narrative:{version:1,victoryVariant:null,unitState:null}};
    assert.equal(h.ChronicleSystem.normalizeEntry(legacy).narrative.unitState,null);
    assert.equal(h.ChronicleSystem.getPersonalEpilogue(legacy),h.ScenarioManager.getScenario('sion_1437').debriefing.defeat);
    const raw = JSON.stringify([legacy]); h.storage.set(h.ChronicleSystem.STORAGE_KEY,raw);
    h.ChronicleSystem.getEntries(); assert.equal(h.storage.get(h.ChronicleSystem.STORAGE_KEY),raw);
});
test('porážky samy nezabíjejí živého Žižku ani neprohlašují všechny poutníky za padlé', async () => {
    for (const lang of ['cs','en']) {
        const h = await createLocalizedHarness(lang);
        for (const id of ['zivohost_1419','sudomere_1420','kutna_hora_1421']) {
            const game = h.newGame(id), before = state(game), text = game.scenarioEventSystem.getDebriefing(false);
            assert.equal(state(game),before); assert.ok(text);
            assert.doesNotMatch(text,/kariéra končí|armáda zničena|pilgrims were slaughtered|career ends|army was destroyed/);
            game.destroy();
        }
    }
});
test('chybějící nepřítel ve staré hře sám nevybere závěr o vyřazení armády', async () => {
    const h = await createLocalizedHarness(), game = h.newGame('oblehani_plzne_1433');
    game.units = game.units.filter(unit => unit.faction === 'hussites');
    assert.equal(game.scenarioEventSystem.captureNarrativeOutcome(true).victoryVariant,null); game.destroy();
});

(async () => {
    let failed = 0;
    for (const {name,run} of tests) {
        try { await run(); console.log(`✓ ${name}`); }
        catch (error) { failed++; console.error(`✗ ${name}\n${error.stack}`); }
    }
    console.log(`\n${tests.length-failed}/${tests.length} testů hlášek podle stavu bitvy.`);
    process.exitCode = failed ? 1:0;
})();
