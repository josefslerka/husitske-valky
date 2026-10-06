#!/usr/bin/env node
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createHarness } = require('./helpers/game-harness');
const { createLocalizedHarness } = require('./helpers/localized-harness');
const { TestBattleView } = require('./helpers/test-battle-view');
const tests = [];
const test = (name, run) => tests.push({ name, run });

const domainFiles = ['js/core/game.js', 'js/systems/CombatSystem.js', 'js/systems/ScenarioEventSystem.js'];

test('Game, souboj a scénářové události neobsahují DOM ani animační smyčku', () => {
    for (const file of domainFiles) {
        const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
        assert.doesNotMatch(source, /\b(document|window|requestAnimationFrame|cancelAnimationFrame)\b/, file);
    }
});

test('headless adaptér implementuje celý prezentační kontrakt herních pravidel', () => {
    const { BattleView } = createHarness();
    for (const file of domainFiles) {
        const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
        for (const [, name] of source.matchAll(/\bthis\.(?:game\.)?view\.(\w+)\(/g)) {
            assert.equal(typeof TestBattleView.prototype[name], 'function', `headless: ${name}`);
            assert.equal(typeof BattleView.prototype[name], 'function', `browser: ${name}`);
        }
    }
});

test('výběr, pohyb, souboj a načtení fungují bez globálního document/window', async () => {
    const h = createHarness();
    delete h.context.document;
    delete h.context.window;
    const game = h.newGame();
    const attacker = game.unitFactory.createUnit('CEPNICI', 5, 5);
    const defender = game.unitFactory.createUnit('HALAPARTNICI', 7, 5);
    game.units = [attacker, defender];
    game.fogOfWar = true;
    game.selectUnit(attacker);
    const moving = game.moveUnit(attacker, 6, 5);
    await h.advance(1); await moving;
    assert.equal(attacker.col, 6);
    assert.ok(game.visibleHexes.size > 0, 'viditelnost se přepočítá i bez vykreslování');
    const fighting = game.combatSystem.performAttack(attacker, defender);
    await h.advance(600); await fighting;
    assert.ok(defender.health < defender.maxHealth);
    assert.equal(game.saveGame(), true);
    const restored = h.SaveGameSystem.load(h.document.getElementById('game-canvas'), game);
    assert.ok(restored.view instanceof TestBattleView);
    assert.equal(restored.units[1].health, defender.health);
    assert.equal(game.view.destroyed, true);
});

test('vykreslení panelů, mapy a tooltipu nemění herní stav', () => {
    const h = createHarness({ browserView: true }), game = h.newGame();
    const unit = game.units[0];
    game.selectUnit(unit);
    const snapshot = () => JSON.stringify({
        units: game.units.map(unit => unit.serialize()), turn: game.turnNumber,
        faction: game.currentFaction, log: game.log, stats: game.stats,
        morale: game.armyMorale, visible: [...game.visibleHexes], explored: [...game.exploredHexes]
    });
    const before = snapshot();
    Object.freeze(game.armyMorale);
    game.fogOfWarSystem.updateVisibility = () => { throw new Error('Render nesmí přepočítávat pravidla'); };
    game.view.updateUI();
    game.view.updateUnitPanel(unit);
    game.view.render();
    game.view.tooltip.showTooltip({ col: unit.col, row: unit.row }, 100, 100);
    assert.equal(snapshot(), before);
    game.destroy();
});

for (const language of ['cs', 'en']) {
    test(`${language}: nová bitva nezdědí kartu krycí palby předchozího střelce`, async () => {
        const h = await createLocalizedHarness(language, { browserView: true });
        const game = h.newGame();
        const shooter = game.unitFactory.createUnit('RUCNICARI', 5, 5);
        game.units.push(shooter);
        game.selectUnit(shooter);
        const panel = h.document.getElementById('unit-cover-fire');
        assert.equal(panel.classList.contains('hidden'), false);
        game.destroy();
        const nextGame = h.newGame();
        assert.equal(panel.classList.contains('hidden'), true);
        assert.equal(panel.dataset.state, '');
        nextGame.destroy();
    });

    test(`${language}: karta i tooltip vysvětlí pohyb, výstřel, kryt a ústup střelce`, async () => {
        const h = await createLocalizedHarness(language, { browserView: true }), game = h.newGame();
        const shooter = game.unitFactory.createUnit('RUCNICARI', 5, 5);
        const target = game.unitFactory.createUnit('TEZKY_RYTIR', 7, 5);
        const reserve = game.unitFactory.createUnit('CEPNICI', 1, 1);
        game.units = [shooter, target, reserve];
        game.hexGrid.setTerrain(5, 5, 'plains');
        game.hexGrid.setTerrain(5, 4, 'plains');
        game.scheduleAI = () => {};
        const check = state => {
            game.selectUnit(shooter);
            assert.equal(h.document.getElementById('unit-cover-fire').dataset.state, state);
            const detail = h.i18n.t(`game.coverFireDetails.${state}`);
            assert.equal(h.document.getElementById('unit-cover-fire-detail').textContent, detail);
            assert.ok(game.view.tooltip.contentForHex(shooter).includes(detail));
        };
        check('ready');
        const move = game.moveUnit(shooter, 5, 4);
        await h.advance(1000); await move;
        check('moved');
        assert.equal(game.undoLastMove(), true);
        check('ready');
        const attack = game.combatSystem.performAttack(shooter, target);
        await h.advance(1000); assert.equal(await attack, true);
        check('spent');
        game.endTurn(); game.endTurn();
        check('ready');
        game.combatSystem.defendSelectedUnit();
        check('defending');
        assert.equal(shooter.isDefending, true);
        assert.equal(game.isCoverFireReady(shooter), false);
        shooter.reduceMorale(100, 'test');
        check('routing');
        game.destroy();
    });

    test(`${language}: rychlostřelec kryje palbou i po prvním výstřelu`, async () => {
        const h = await createLocalizedHarness(language, { browserView: true }), game = h.newGame();
        const shooter = game.unitFactory.createUnit('LUCISTNICI', 5, 5);
        shooter.faction = 'hussites';
        const target = game.unitFactory.createUnit('TEZKY_RYTIR', 7, 5);
        const reserve = game.unitFactory.createUnit('CEPNICI', 1, 1);
        game.units = [shooter, target, reserve];
        for (let shot = 1; shot <= 2; shot++) {
            const attack = game.combatSystem.performAttack(shooter, target);
            await h.advance(1000); assert.equal(await attack, true);
            game.selectUnit(shooter);
            const state = shot === 1 ? 'ready' : 'spent';
            assert.equal(shooter.attackCount, shot);
            assert.equal(game.isCoverFireReady(shooter), shot === 1);
            assert.equal(h.document.getElementById('unit-cover-fire').dataset.state, state);
        }
        game.destroy();
    });
}

test('Plzeň viditelně označí celou cílovou zónu a průběžně počítá obsazení', async () => {
    const h = await createLocalizedHarness('cs', { browserView: true });
    const game = h.newGame('oblehani_plzne_1433');

    assert.equal(game.hexGrid.escapeZoneKind, 'objective');
    assert.equal(game.hexGrid.escapeZoneHexes.length, 20);
    assert.equal(game.hexGrid.escapeZoneLabel, 'CÍL: PLZEŇ');
    assert.match(h.document.getElementById('objective-hud-text').textContent, /Obsazeno 0\/3/);

    const unit = game.units.find(candidate => candidate.faction === 'hussites');
    unit.col = 18;
    unit.row = 4;
    game.view.render();
    assert.match(h.document.getElementById('objective-hud-text').textContent, /Obsazeno 1\/3/);
    game.destroy();

    const en = await createLocalizedHarness('en', { browserView: true });
    const scenario = en.getLocalizedScenario('oblehani_plzne_1433', en.Scenarios.oblehani_plzne_1433);
    const englishGame = new en.Game(
        new en.HexGrid(en.document.getElementById('game-canvas'), scenario.mapSize.width, scenario.mapSize.height, 40),
        { viewFactory: en.viewFactory }
    );
    englishGame.fogOfWar = false;
    englishGame.initGameWithScenario(structuredClone(scenario));
    assert.equal(englishGame.hexGrid.escapeZoneLabel, 'OBJECTIVE: PLZEŇ');
    assert.match(en.document.getElementById('objective-hud-text').textContent, /Occupied 0\/3/);
    englishGame.destroy();
});

test('klidná mapa neplánuje snímky; RAF běží jen do konce projektilu', () => {
    const h = createHarness({ browserView: true });
    const frames = new Map();
    let nextFrame = 1;
    h.context.requestAnimationFrame = callback => {
        const id = nextFrame++;
        frames.set(id, callback);
        return id;
    };
    h.context.cancelAnimationFrame = id => frames.delete(id);
    const game = h.newGame();
    assert.equal(frames.size, 0, 'bez animace není trvalá smyčka');

    let renders = 0;
    game.hexGrid.render = () => {
        renders++;
        game.hexGrid.animations = game.hexGrid.animations.filter(animation => ++animation.progress < animation.duration);
    };
    game.view.showAttackAnimation(1, 1, 2, 1);
    assert.equal(frames.size, 1);
    for (let i = 0; i < 20; i++) {
        const [id, callback] = frames.entries().next().value;
        frames.delete(id);
        callback();
    }
    assert.equal(renders, 20);
    assert.equal(frames.size, 0, 'po animaci se už neplánuje další snímek');

    game.view.showExplosionAnimation(2, 1);
    assert.equal(frames.size, 1);
    game.view.stopAnimationLoop();
    assert.equal(frames.size, 0, 'skrytá či zrušená bitva čekající snímek zahodí');
    game.destroy();
});

test('pohyb žetonu dojede před reakcí a nechá herní pozici i další rozkazy bezpečné', async () => {
    const h = createHarness({ browserView: true });
    const frames = new Map(); let nextFrame = 1;
    h.context.requestAnimationFrame = callback => {
        const id = nextFrame++; frames.set(id, callback); return id;
    };
    h.context.cancelAnimationFrame = id => frames.delete(id);
    const game = h.newGame();
    const mover = game.unitFactory.createUnit('CEPNICI', 5, 5);
    const enemy = game.unitFactory.createUnit('RUCNICARI', 7, 5); enemy.faction = 'crusaders';
    game.units = [mover, enemy];
    const visuals = [], minimapVisuals = [], reactions = [];
    game.hexGrid.render = (_units, _fog, positions) => {
        visuals.push(positions?.get(mover.id) || null);
    };
    game.view.minimap.render = (_units, positions) => {
        minimapVisuals.push(positions?.get(mover.id) || null);
    };
    game.triggerOverwatch = async () => { reactions.push('po vizuálním příjezdu'); };
    const from = game.hexGrid.hexToPixel(5, 5), to = game.hexGrid.hexToPixel(6, 5);
    const move = game.moveUnit(mover, 6, 5);
    assert.equal(mover.col, 6, 'pravidla používají cílový hex hned');
    assert.equal(game.actions.busy, true);
    assert.equal(game.endTurn(), false);
    assert.equal(game.saveGame(), false);
    assert.deepEqual(visuals.at(-1), from);
    assert.deepEqual(minimapVisuals.at(-1), from);
    assert.equal(frames.size, 1);
    await h.advance(110);
    const [frameId, frame] = frames.entries().next().value;
    frames.delete(frameId); frame();
    assert.ok(visuals.at(-1).x > from.x && visuals.at(-1).x < to.x);
    assert.deepEqual(minimapVisuals.at(-1), visuals.at(-1));
    assert.equal(reactions.length, 0);
    await h.advance(110); await move;
    assert.equal(reactions.length, 1);
    assert.equal(game.view.moveAnimation, null);
    assert.equal(frames.size, 0, 'po příjezdu nezůstane klidný RAF');
    assert.equal(visuals.at(-1), null, 'výsledný žeton čte přímo herní souřadnice');
    assert.equal(minimapVisuals.at(-1), null);
    assert.equal(game.actions.busy, false);
    game.destroy();
});

test('pohyb se pozastaví a zrušená bitva odstraní jeho snímek i čekání', async () => {
    const h = createHarness({ browserView: true });
    const frames = new Map(); let nextFrame = 1;
    h.context.requestAnimationFrame = callback => {
        const id = nextFrame++; frames.set(id, callback); return id;
    };
    h.context.cancelAnimationFrame = id => frames.delete(id);
    const game = h.newGame();
    const mover = game.unitFactory.createUnit('CEPNICI', 5, 5);
    game.units = [mover, game.unitFactory.createUnit('TEZKY_RYTIR', 10, 5)];
    const move = game.moveUnit(mover, 6, 5);
    await h.advance(100);
    const [id, frame] = frames.entries().next().value;
    frames.delete(id); frame();
    const progress = game.view.moveAnimation.elapsed;
    game.setPaused(true);
    assert.equal(frames.size, 0);
    await h.advance(1000);
    assert.equal(game.view.moveAnimation.elapsed, progress);
    assert.equal(game.actions.busy, true);
    game.setPaused(false);
    assert.equal(frames.size, 1);
    await h.advance(119);
    assert.equal(game.actions.busy, true);
    await h.advance(1); await move;
    assert.equal(game.actions.busy, false);
    assert.equal(frames.size, 0);

    const next = game.unitFactory.createUnit('CEPNICI', 7, 5);
    game.units.push(next);
    const interrupted = game.moveUnit(next, 8, 5);
    assert.equal(frames.size, 1);
    game.destroy(); await h.flush(); await interrupted;
    assert.equal(frames.size, 0);
    assert.equal(h.timers.size, 0);
});

test('omezený pohyb a zrychlený tah AI přeskočí animaci žetonu', async () => {
    const h = createHarness({ browserView: true });
    const game = h.newGame();
    const mover = game.unitFactory.createUnit('CEPNICI', 5, 5);
    const enemy = game.unitFactory.createUnit('TEZKY_RYTIR', 10, 5);
    game.units = [mover, enemy];
    h.context.window.matchMedia = () => ({ matches: true });
    assert.equal(await game.moveUnit(mover, 6, 5), true);
    assert.equal(game.view.moveAnimation, null);
    assert.equal(h.timers.size, 0);

    h.context.window.matchMedia = () => ({ matches: false });
    game.currentFaction = 'crusaders'; game.fastForwardAI = true;
    assert.equal(await game.moveUnit(enemy, 9, 5), true);
    assert.equal(game.view.moveAnimation, null);
    assert.equal(h.timers.size, 0);
    game.destroy();
});

test('pohyb neprozradí žeton nepřítele, který se přesouvá mimo viditelné hexy', async () => {
    const h = createHarness({ browserView: true }), game = h.newGame();
    const player = game.unitFactory.createUnit('CEPNICI', 0, 0);
    const enemy = game.unitFactory.createUnit('TEZKY_RYTIR', 5, 5);
    game.units = [player, enemy]; game.currentFaction = 'crusaders';
    game.fogOfWar = true;
    game.visibleHexes = new Set(['5,5']);
    assert.equal(await game.moveUnit(enemy, 6, 5), true);
    assert.equal(game.view.moveAnimation, null);
    assert.equal(h.timers.size, 0);
    game.destroy();
});

test('klik z Canvasu volá hexový příkaz a zaniklá bitva již vstup nedostane', () => {
    const h = createHarness({ browserView: true }), game = h.newGame();
    const pixel = game.hexGrid.hexToPixel(5, 5), received = [];
    game.handleHexClick = hex => received.push(hex);
    const click = new Event('click');
    Object.assign(click, { clientX: pixel.x, clientY: pixel.y });
    const canvas = h.document.getElementById('game-canvas');
    canvas.dispatchEvent(click);
    assert.equal(received.length, 1);
    assert.equal(received[0].col, 5); assert.equal(received[0].row, 5);
    game.destroy();
    canvas.dispatchEvent(click);
    assert.equal(received.length, 1);
    assert.equal(game.view.eventAbortController.signal.aborted, true);
    assert.equal(game.view.minimap.eventAbortController.signal.aborted, true);
});

test('log má jediného vlastníka a zobrazení nevkládá duplicitní záznamy', () => {
    const h = createHarness({ browserView: true }), game = h.newGame();
    game.clearLog(); game.addLog('Jedna událost', 'turn');
    assert.equal(game.log.length, 1);
    assert.equal(h.document.getElementById('game-log').children.length, 1);
    game.view.clearLog();
    assert.equal(game.log.length, 1, 'samotný pohled nemaže herní záznam');
    game.destroy();
});

test('po zrušení skutečného UI zmizí notifikace a poškození', async () => {
    const h = createHarness({ browserView: true }), game = h.newGame();
    game.showEventNotification('Událost', 'Text');
    game.view.showDamageNumber(5, 5, 10);
    assert.equal(h.document.body.children.length, 2);
    game.destroy(); await h.flush();
    assert.equal(h.document.body.children.length, 0);
    assert.equal(h.timers.size, 0);
});

test('chorál a návrat k fázi mají stejné texty po oddělení panelů', () => {
    const h = createHarness({ browserView: true }), game = h.newGame('zivohost_1419');
    const phase = game.currentPhase;
    assert.equal(h.document.getElementById('phase-name').textContent, phase.name);
    game.activateChoral();
    assert.match(h.document.getElementById('phase-name').textContent, /choralActive/);
    game.choralTurnsRemaining = 1; game.updateChoral();
    assert.equal(h.document.getElementById('phase-name').textContent, phase.name);
    assert.equal(h.document.getElementById('phase-description').textContent, phase.description);
    game.destroy();
});

for (const language of ['cs', 'en']) {
    test(`${language}: encyklopedie používá stejné znaky jako mapa a přeloženou velitelskou hodnost`, async () => {
        const h = await createLocalizedHarness(language);
        vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/ui/main.js'), 'utf8'), h.context);
        const { WoodcutRenderer, UnitTypes, populateHelpUnits } = vm.runInContext('({ WoodcutRenderer, UnitTypes, populateHelpUnits })', h.context);
        const before = JSON.stringify(UnitTypes);
        populateHelpUnits(null);
        const cards = h.document.getElementById('help-units-list').children.filter(el => el.className?.startsWith('help-unit-card'));
        assert.equal(cards.length, Object.keys(UnitTypes).length);
        for (const type of [
            'VOZOVA_HRADBA', 'CEPNICI', 'LEHKA_JIZDA', 'TEZKOODENCI', 'TEZKY_RYTIR',
            'SLECHTICKA_JIZDA_HUSITI', 'TARASNICE', 'HOUFNICE', 'HOUFNICE_PRASKY',
            'BOMBARDA', 'JAN_ZIZKA', 'ZIKMUND'
        ]) {
            const localized = vm.runInContext(`getLocalizedUnit('${type}', UnitTypes.${type})`, h.context);
            const card = cards.find(el => el.children[0].children[1].children[0].textContent === localized.name);
            assert.ok(card, type);
            assert.equal(card.children[0].children[0].innerHTML, WoodcutRenderer.icon({ ...localized, type }));
            if (WoodcutRenderer.isCommander(localized)) {
                assert.match(card.className, /commander-unit/);
                assert.equal(card.children[0].children[1].children[1].textContent, h.i18n.t('tooltip.commander'));
                assert.doesNotMatch(card.innerHTML, />commander</);
            }
        }
        assert.equal(JSON.stringify(UnitTypes), before);
        const game = h.newGame('sudomere_1420'), panels = new h.BattlePanels(game);
        panels.updateArmyOverview();
        for (const type of ['JIZDA_HUSITI', 'TEZKOODENCI', 'TEZKY_RYTIR']) {
            const unit = game.units.find(candidate => candidate.type === type);
            assert.ok(unit, type);
            const list = h.document.getElementById(unit.faction === 'hussites' ? 'hussite-units' : 'crusader-units');
            const row = list.children.find(el => el.innerHTML.includes(unit.name));
            assert.ok(row?.innerHTML.includes(WoodcutRenderer.icon(unit)), type);
        }
        const commander = game.units.find(u => u.isCommander() && u.faction === 'hussites');
        const row = h.document.getElementById('hussite-units').children.find(el => el.innerHTML.includes(commander.name));
        assert.ok(row.classList.contains('commander-unit'));
        assert.ok(row.innerHTML.includes(h.i18n.t('tooltip.commander')));
        // The same commander template can fight for either side (e.g. Lipany).
        // Presentation must use deployment faction, not overwrite the template.
        const allies = new h.Unit('DIVIS_BOREK', 0, 0, 91);
        const opponents = new h.Unit('DIVIS_BOREK', 1, 0, 92);
        opponents.faction = 'crusaders';
        h.document.getElementById('help-units-list').replaceChildren();
        populateHelpUnits({ units: [allies, opponents] });
        const deployed = h.document.getElementById('help-units-list').children.filter(el => el.className?.startsWith('help-unit-card'));
        assert.equal(deployed.length, 2);
        assert.match(deployed[0].children[0].children[0].className, /hussites/);
        assert.match(deployed[1].children[0].children[0].className, /crusaders/);
        assert.notEqual(deployed[0].children[0].children[0].innerHTML, deployed[1].children[0].children[0].innerHTML);
        assert.equal(JSON.stringify(UnitTypes), before);
        game.destroy();
    });
}

(async () => {
    let failures = 0;
    for (const { name, run } of tests) {
        let timeout;
        try {
            await Promise.race([run(), new Promise((_, reject) => {
                timeout = setTimeout(() => reject(new Error('Test did not settle')), 2000);
            })]);
            console.log(`✓ ${name}`);
        } catch (error) { failures++; console.error(`✗ ${name}\n${error.stack}`); }
        finally { clearTimeout(timeout); }
    }
    console.log(`\n${tests.length - failures}/${tests.length} presentation testů.`);
    if (failures) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
