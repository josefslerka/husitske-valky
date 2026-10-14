#!/usr/bin/env node
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createLocalizedHarness } = require('./helpers/localized-harness');
const { menuHarness } = require('./helpers/menu-harness');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const tests = [];
const test = (name, run) => tests.push({ name, run });
const click = element => element.dispatchEvent(new Event('click'));
const text = element => [element.textContent, element.innerHTML, ...element.children.map(text)].join(' ');
const state = game => JSON.stringify(game.units.map(unit => unit.serialize()));
const names = {
    cs: { RUCNICARI: 'Střelci z ručnic', TEZKY_RYTIR: 'Rytířská jízda' },
    en: { RUCNICARI: 'Handgunners', TEZKY_RYTIR: 'Knightly Cavalry' }
};

for (const language of ['cs', 'en']) {
    test(`${language}: nové názvy jsou stejné v detailu, tooltipu, přehledu i katalogu`, async () => {
        const h = await createLocalizedHarness(language, { browserView: true }), game = h.newGame();
        vm.runInContext(read('js/ui/main.js'), h.context);
        game.units = Object.keys(names[language]).map((type, index) => game.unitFactory.createUnit(type, 4 + index * 2, 4));
        const before = state(game);
        game.view.panels.updateArmyOverview();
        h.context.populateHelpUnits(null);
        for (const unit of game.units) {
            assert.equal(unit.name, names[language][unit.type]);
            game.view.panels.updateUnitPanel(unit);
            assert.ok(text(h.document.getElementById('unit-info')).includes(unit.name));
            assert.ok(game.view.tooltip.contentForHex(unit).includes(unit.name));
            assert.ok(text(h.document.getElementById(`${unit.faction === 'hussites' ? 'hussite' : 'crusader'}-units`)).includes(unit.name));
            const card = h.document.getElementById('help-units-list').children.find(el => el.dataset.unitType === unit.type);
            assert.ok(card && text(card).includes(unit.name));
        }
        assert.equal(state(game), before, 'popisky nesmějí změnit herní stav');
        game.destroy();
    });

    test(`${language}: starý save používá stejné typy, statistiky i nové názvy`, async () => {
        const h = await createLocalizedHarness(language), game = h.newGame('zivohost_1419');
        game.units = Object.keys(names[language]).map((type, index) => game.unitFactory.createUnit(type, 4 + index * 2, 4));
        game.units[0].hasMoved = true; game.units[0].health = 17;
        const before = state(game);
        assert.equal(game.saveGame(), true);
        const saved = JSON.parse(h.storage.get(h.SaveGameSystem.STORAGE_KEY));
        saved.units[0].name = 'Ručničáři'; saved.units[1].name = 'Heavy Knight';
        h.SaveGameSystem.write(saved);
        const restored = h.SaveGameSystem.load(h.document.getElementById('game-canvas'), game);
        assert.equal(state(restored), before);
        for (const unit of restored.units) assert.equal(unit.name, names[language][unit.type]);
        assert.equal(restored.units[0].type, 'RUCNICARI');
        assert.equal(restored.units[1].type, 'TEZKY_RYTIR');
        assert.equal(restored.units[0].attack, 35); assert.equal(restored.units[0].range, 2);
        assert.equal(restored.units[1].attack, 50); assert.equal(restored.units[1].defense, 30);
        restored.destroy();
    });

    test(`${language}: chorál ukazuje limit, zbývající kola a vyčerpání bez změny pravidel`, async () => {
        const h = await createLocalizedHarness(language, { browserView: true }), game = h.newGame();
        const button = h.document.getElementById('btn-choral');
        const check = (key, disabled, params = {}) => {
            const before = state(game);
            game.view.panels.updateChoralButton();
            assert.equal(button.children[0].textContent, `⚔️ ${h.i18n.t('game.choral')}`);
            assert.equal(button.children[1].textContent, h.i18n.t(key, params));
            assert.equal(button.disabled, disabled);
            assert.equal(button.title, h.i18n.t('help.mechanics.choral'));
            assert.ok(button.getAttribute('aria-label').includes(h.i18n.t(key, params)));
            assert.equal(state(game), before);
        };
        check('game.choralReady', false);
        game.currentFaction = 'crusaders'; check('game.choralReady', true);
        game.currentFaction = 'hussites'; game.choralActive = true; game.choralUsed = true;
        for (const turns of [2, 1]) {
            game.choralTurnsRemaining = turns; check('game.choralTurns', true, { turns });
        }
        game.choralActive = false; check('game.choralUsed', true);
        assert.equal(button.classList.contains('active'), false);
        game.destroy();
    });

    test(`${language}: volitelné cíle jsou vysvětlené před bitvou, během ní i ve výsledku`, async () => {
        const h = await menuHarness(language, h => { h.BattleView.prototype.render = () => {}; });
        const el = id => h.document.getElementById(id);
        click(el('btn-first-battle'));
        assert.equal(h.context.window.game ?? null, null, 'zadání nezahájí bitvu');
        assert.equal(el('mission-optional-hint').classList.contains('hidden'), false);
        const list = el('mission-objectives-list').children;
        assert.ok(list.length > 1);
        for (const goal of list.slice(1)) assert.ok(goal.textContent.startsWith(h.i18n.t('onboarding.optionalGoal')));
        click(el('btn-start-mission'));
        assert.equal(el('optional-objectives').classList.contains('hidden'), false);
        const game = h.context.window.game, before = state(game);
        const goals = game.currentScenario.victoryConditions.secondary.map((goal, index) => ({ ...goal, achieved: index === 0 }));
        h.context.window.showGameOver(true, 'Test', { turns: 5, secondaryObjectives: goals });
        const result = el('gameover-secondary-objectives');
        assert.equal(result.classList.contains('hidden'), false);
        assert.ok(result.innerHTML.includes(h.i18n.t('gameover.bonusObjectives')));
        assert.ok(result.innerHTML.includes(h.i18n.t('onboarding.optionalGoalsHint')));
        assert.ok(result.innerHTML.includes('✓')); assert.ok(result.innerHTML.includes('✗'));
        assert.equal(state(game), before);
        game.destroy();
    });

    test(`${language}: rychlá bitva neslibuje neexistující volitelné cíle`, async () => {
        const h = await menuHarness(language, h => { h.BattleView.prototype.render = () => {}; });
        click(h.document.getElementById('btn-quick-battle'));
        assert.equal(h.document.getElementById('optional-objectives').classList.contains('hidden'), true);
        h.context.window.showGameOver(false, 'Test', { turns: 1 });
        assert.equal(h.document.getElementById('gameover-secondary-objectives').classList.contains('hidden'), true);
        h.context.window.game.destroy();
    });

    test(`${language}: pravidla a úvod sdílejí vysvětlení chorálu a volitelných cílů`, async () => {
        const h = await createLocalizedHarness(language);
        vm.runInContext(read('js/i18n/encyclopediaRenderer.js'), h.context);
        vm.runInContext('renderRulesTab()', h.context);
        const rules = h.document.getElementById('tab-rules').innerHTML;
        for (const key of ['help.mechanics.choral', 'onboarding.optionalGoalsHint']) {
            assert.ok(rules.includes(h.i18n.t(key)));
            assert.ok(read('index.html').includes(`data-i18n="${key}"`));
        }
        assert.match(h.i18n.t('help.mechanics.choral'), language === 'cs' ? /ne přepínač hudby/ : /not a music switch/);
        assert.match(h.i18n.t('onboarding.optionalGoalsHint'), language === 'cs' ? /nepřidávají jednotky ani bojové bonusy/ : /do not grant units or combat bonuses/);
    });
}

test('přepnutí CS → EN → CS obnoví názvy i stav chorálu, ale ne bojová data', async () => {
    const h = await createLocalizedHarness('cs', { browserView: true }), game = h.newGame();
    h.context.window.game = game;
    game.units = ['RUCNICARI', 'TEZKY_RYTIR'].map((type, index) => game.unitFactory.createUnit(type, 4 + index * 2, 4));
    game.units[0].hasAttacked = true; game.units[1].health = 18;
    game.choralActive = true; game.choralUsed = true; game.choralTurnsRemaining = 1;
    const before = state(game);
    for (const language of ['en', 'cs']) {
        await h.i18n.setLanguage(language);
        for (const unit of game.units) assert.equal(unit.name, names[language][unit.type]);
        const button = h.document.getElementById('btn-choral');
        assert.equal(button.children[1].textContent, h.i18n.t('game.choralTurns', { turns: 1 }));
        assert.equal(state(game), before);
        assert.equal(game.choralTurnsRemaining, 1);
    }
    game.destroy();
});

test('vypnutý zvuk nemění jednorázovou aktivaci ani účinky bojového chorálu', async () => {
    const h = await createLocalizedHarness('cs'), game = h.newGame();
    let silentAttempts = 0;
    h.context.Music = { playChoral() { silentAttempts++; return false; } };
    assert.equal(game.activateChoral(), true);
    assert.equal(game.choralUsed, true); assert.equal(game.choralActive, true);
    assert.equal(game.choralTurnsRemaining, 2); assert.equal(silentAttempts, 1);
    const after = state(game);
    assert.equal(game.activateChoral(), false);
    assert.equal(silentAttempts, 1); assert.equal(state(game), after);
    game.destroy();
});

test('volitelné cíle nepřidávají pověst, posily ani nové podmínky vítězství', async () => {
    const h = await createLocalizedHarness('cs'), game = h.newGame('zivohost_1419');
    const result = { scenarioId: 'zivohost_1419', result: 'victory', lossRatio: 0, turns: 5, maxTurns: 10 };
    assert.equal(h.CampaignProgressSystem._resultContribution(result), h.CampaignProgressSystem._resultContribution({ ...result, secondaryObjectives: [{ achieved: true }] }));
    const before = state(game), primary = JSON.stringify(game.currentScenario.victoryConditions.primary);
    game.victoryConditionsSystem.evaluateSecondaryConditions('hussites');
    assert.equal(state(game), before); assert.equal(JSON.stringify(game.currentScenario.victoryConditions.primary), primary);
    assert.equal(game.gameState, 'playing');
    game.destroy();
});

test('závěry Živohoště jsou krátké a stále označují fikci, ne citaci pramene', async () => {
    for (const language of ['cs', 'en']) {
        const h = await createLocalizedHarness(language), game = h.newGame('zivohost_1419');
        for (const ending of Object.values(game.currentScenario.debriefing.victoryVariants)) {
            assert.match(ending, language === 'cs' ? /fikce, ne citace pramene/ : /fiction, not a source quotation/);
            assert.ok(ending.length < 280);
            assert.doesNotMatch(ending, /vítězná zpráva|waiting in vain|všichni.*padli|everyone.*died/);
        }
        game.destroy();
    }
});

test('Vozová hradba používá stejný český název střelců bez změny typů', () => {
    const source = read('bonus/vozova-hradba/ui.js');
    assert.match(source, /rucnicari: \{ name: 'Střelci z ručnic'/);
    assert.doesNotMatch(source, /[Rr]učničář/);
    assert.match(source, /rucnicari: \{ type: 'RUCNICARI', unitClass: 'ranged' \}/);
});

(async () => {
    let failed = 0;
    for (const { name, run } of tests) {
        try { await run(); console.log(`✓ ${name}`); }
        catch (error) { failed++; console.error(`✗ ${name}\n${error.stack}`); }
    }
    console.log(`\n${tests.length - failed}/${tests.length} testů textové srozumitelnosti.`);
    process.exitCode = failed ? 1 : 0;
})();
