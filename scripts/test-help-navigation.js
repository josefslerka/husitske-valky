#!/usr/bin/env node
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createLocalizedHarness } = require('./helpers/localized-harness');
const { menuHarness } = require('./helpers/menu-harness');
const DefenseSession = require('../bonus/vozova-hradba/session');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const tests = [];
const test = (name, run) => tests.push({ name, run });
const click = element => { element.focus(); element.dispatchEvent(new Event('click')); };
const cards = h => h.document.getElementById('help-units-list').children.filter(card => card.dataset.unitType);
const cardFor = (h, type) => cards(h).find(card => card.dataset.unitType === type);
const stats = card => [...card.children[1].innerHTML.matchAll(/class="stat-value">(\d+)</g)].map(match => Number(match[1]));
const details = card => card.children[2].innerHTML;

async function helpHarness(language = 'cs') {
    return menuHarness(language, h => {
        h.BattleView.prototype.render = () => {};
        h.document.getElementById('help-title').setAttribute('data-i18n', 'menu.encyclopedia');
        const tabIds = ['history', 'units', 'commanders', 'tactics', 'terrain', 'rules', 'controls', 'about'];
        h.tabs = tabIds.map(id => {
            const tab = h.document.createElement('button');
            tab.scrollIntoView = options => { h.lastTabScroll = { id, ...options }; };
            tab.setAttribute('data-tab', id); return tab;
        });
        h.contents = tabIds.map(id => {
            const content = h.document.getElementById('tab-' + id);
            content.id = 'tab-' + id; return content;
        });
        h.document.querySelectorAll = selector => {
            if (selector === '.help-tab') return h.tabs;
            if (selector === '.help-tab-content') return h.contents;
            if (selector === '[data-i18n]') return [h.document.getElementById('help-title')];
            return [];
        };
        for (const id of ['about-modal', 'help-modal', 'chronicle-modal', 'gameover-modal', 'pause-modal']) {
            h.document.getElementById(id).classList.add('hidden');
        }
        h.context.initEncyclopediaContent = () => {};
    });
}
const activeTab = h => h.tabs.filter(tab => tab.classList.contains('active')).map(tab => tab.getAttribute('data-tab'));

for (const language of ['cs', 'en']) {
    test(`${language}: Jak hrát začíná na pravidlech, Encyklopedie na historii; obě vracejí fokus`, async () => {
        const h = await helpHarness(language), el = id => h.document.getElementById(id);
        for (const [entry, tab, titleKey] of [['btn-how-to-play', 'rules', 'menu.howToPlayTitle'],
            ['btn-encyclopedia', 'history', 'menu.encyclopedia'], ['btn-how-to-play', 'rules', 'menu.howToPlayTitle']]) {
            el('help-content').scrollTop = 480; click(el(entry));
            assert.equal(el('help-modal').classList.contains('hidden'), false);
            assert.deepEqual(activeTab(h), [tab]);
            assert.deepEqual(h.lastTabScroll, { id: tab, block: 'nearest', inline: 'nearest' });
            assert.equal(h.contents.filter(c => c.classList.contains('active'))[0].id, 'tab-' + tab);
            assert.equal(el('help-title').textContent, h.i18n.t(titleKey));
            assert.equal(el('help-content').scrollTop, 0);
            assert.equal(h.document.activeElement, el('help-close'));
            assert.equal(el('help-modal').dataset.unitScope, 'all');
            click(h.tabs.find(t => t.getAttribute('data-tab') === 'controls'));
            assert.deepEqual(activeTab(h), ['controls']);
            assert.equal(h.tabs.find(t => t.getAttribute('data-tab') === 'controls').getAttribute('aria-pressed'), 'true');
            click(el('help-close'));
            assert.equal(el('help-modal').classList.contains('hidden'), true);
            assert.equal(h.document.activeElement, el(entry));
        }
    });

    test(`${language}: nápověda z bitvy i pauzy otevře pravidla a vrátí fokus do bitevního menu`, async () => {
        const h = await helpHarness(language), el = id => h.document.getElementById(id);
        click(el('btn-quick-battle'));
        const game = h.context.window.game;
        assert.ok(game);
        const before = JSON.stringify(game.units.map(unit => unit.serialize()));
        for (const entry of ['btn-help', 'btn-pause-help']) {
            click(el(entry)); assert.deepEqual(activeTab(h), ['rules']);
            assert.equal(el('help-modal').dataset.unitScope, 'battle');
            click(el('help-close')); assert.equal(h.document.activeElement, el('btn-menu'));
        }
        assert.equal(JSON.stringify(game.units.map(unit => unit.serialize())), before);
        game.destroy();
    });

    test(`${language}: sudličníci mají dosah 1 a stejné podmíněné pravidlo ve třech pohledech`, async () => {
        const h = await createLocalizedHarness(language, { browserView: true }), game = h.newGame();
        vm.runInContext(read('js/ui/main.js'), h.context);
        const unit = game.unitFactory.createUnit('SUDLICNICI', 4, 4);
        game.units = [unit]; game.selectUnit(unit); h.context.populateHelpUnits(null);
        const panel = h.document.getElementById('unit-info').innerHTML;
        const tooltip = game.view.tooltip.contentForHex({ col: unit.col, row: unit.row });
        const card = cardFor(h, 'SUDLICNICI'), rule = h.i18n.t('special.reach');
        for (const html of [panel, tooltip, details(card)]) assert.ok(html.includes(rule));
        assert.match(panel, /<span class="value">1<\/span>/);
        assert.match(tooltip, /(?:Dosah|Range):<\/span> 1<\/div>/);
        assert.equal(stats(card)[3], unit.range); assert.equal(unit.range, 1);
        assert.doesNotMatch(panel + tooltip + details(card), /1-2/);
        game.destroy();
    });

    test(`${language}: čísla a herní popisy pražských variant vycházejí z jejich vlastních dat`, async () => {
        const h = await createLocalizedHarness(language);
        vm.runInContext(read('js/ui/main.js'), h.context);
        const unitTypes = vm.runInContext('UnitTypes', h.context), before = JSON.stringify(unitTypes);
        h.context.populateHelpUnits(null);
        for (const type of Object.keys(unitTypes)) {
            const data = unitTypes[type];
            assert.deepEqual(stats(cardFor(h, type)), [data.maxHealth, data.attack, data.defense, data.range, data.movement], type);
        }
        for (const type of ['VOZOVA_HRADBA_PRASKY', 'CEPNICI_PRASKY', 'KUSINICI_PRASKY', 'HOUFNICE_PRASKY', 'JIZDA_PRASKY']) {
            assert.ok(h.i18n.hasTranslation(`units.${type}.description`));
            assert.ok(details(cardFor(h, type)).includes(h.i18n.t(`units.${type}.description`)));
        }
        const wagon = details(cardFor(h, 'VOZOVA_HRADBA_PRASKY'));
        assert.ok(wagon.includes(h.i18n.t('special.wagon'))); assert.doesNotMatch(wagon, />wagon</);
        assert.equal(wagon.includes(h.i18n.t('special.wagenburg')), false);
        const gun = details(cardFor(h, 'HOUFNICE_PRASKY'));
        assert.ok(gun.includes(h.i18n.t('special.siege')));
        assert.ok(gun.includes(h.i18n.t('game.artilleryOrders.normal')));
        assert.equal(gun.includes(h.i18n.t('special.areaAttack')), false);
        for (const [type, special] of [['JIZDA_PRASKY', 'pursuit'], ['JIZDA_PRASKY', 'charge'], ['KUSINICI_PRASKY', 'rapidFire']]) {
            assert.equal(details(cardFor(h, type)).includes(h.i18n.t('special.' + special)), false);
        }
        assert.equal(JSON.stringify(unitTypes), before, 'prezentace nemění šablony');
    });

    test(`${language}: encyklopedie a detail dělostřelectva sdílí pořadí pohybu a palby`, async () => {
        const h = await createLocalizedHarness(language, { browserView: true }), game = h.newGame();
        vm.runInContext(read('js/ui/main.js'), h.context); h.context.populateHelpUnits(null);
        for (const [type, kind] of [['HOUFNICE', 'normal'], ['HOUFNICE_PRASKY', 'normal'], ['TARASNICE', 'mobile'], ['BOMBARDA', 'fixed']]) {
            const unit = game.unitFactory.createUnit(type, 4, 4);
            game.units = [unit]; game.updateUnitPanel(unit);
            const explanation = h.i18n.t('game.artilleryOrders.' + kind);
            assert.ok(h.document.getElementById('unit-info').innerHTML.includes(explanation), type);
            assert.ok(details(cardFor(h, type)).includes(explanation), type);
        }
        game.destroy();
    });
}

test('útok sudličníků na 2 hexy opravdu vyžaduje živého spojence na společném sousedním poli', async () => {
    const h = await createLocalizedHarness(), game = h.newGame();
    const unit = game.unitFactory.createUnit('SUDLICNICI', 4, 4);
    const middle = game.hexGrid.getNeighborInDirection(4, 4, 0);
    const end = game.hexGrid.getNeighborInDirection(middle.col, middle.row, 0);
    const ally = game.unitFactory.createUnit('CEPNICI', middle.col, middle.row);
    const enemy = game.unitFactory.createUnit('TEZKY_RYTIR', end.col, end.row);
    game.units = [unit, ally, enemy];
    assert.equal(game.hexGrid.getDistance(unit.col, unit.row, enemy.col, enemy.row), 2);
    assert.equal(game.combatSystem.canAttack(unit, enemy), true);
    ally.health = 0; assert.equal(game.combatSystem.canAttack(unit, enemy), false);
    ally.health = ally.maxHealth; ally.faction = enemy.faction;
    assert.equal(game.combatSystem.canAttack(unit, enemy), false);
    game.units = [unit, enemy]; Object.assign(enemy, middle);
    assert.equal(game.combatSystem.canAttack(unit, enemy), true); game.destroy();
});

test('živá změna CS/EN zachová kartu, fokus, celý katalog a rozpracované akce', async () => {
    const h = await helpHarness(), el = id => h.document.getElementById(id), game = h.newGame();
    h.context.window.game = game;
    const unit = game.unitFactory.createUnit('SUDLICNICI', 4, 4); unit.hasMoved = true;
    game.units = [unit]; game.selectedUnit = unit;
    click(el('btn-how-to-play')); click(h.tabs.find(tab => tab.getAttribute('data-tab') === 'units'));
    const count = cards(h).length, focus = h.document.activeElement;
    await h.i18n.setLanguage('en');
    assert.equal(el('help-title').textContent, h.i18n.t('menu.howToPlayTitle'));
    assert.deepEqual(activeTab(h), ['units']); assert.equal(h.document.activeElement, focus);
    assert.equal(cards(h).length, count); assert.ok(cardFor(h, 'HOUFNICE_PRASKY'));
    assert.ok(details(cardFor(h, 'SUDLICNICI')).includes(h.i18n.t('special.reach')));
    assert.equal(unit.description, h.i18n.t('units.SUDLICNICI.description')); assert.equal(unit.hasMoved, true);
    el('help-modal').dataset.unitScope = 'battle'; await h.i18n.setLanguage('cs');
    assert.deepEqual(cards(h).map(card => card.dataset.unitType), ['SUDLICNICI']);
    assert.ok(details(cardFor(h, 'SUDLICNICI')).includes(h.i18n.t('special.reach'))); game.destroy();
});

test('Escape zavře nápovědu a vrátí fokus bez vydání rozkazu', async () => {
    const h = await helpHarness(), button = h.document.getElementById('btn-how-to-play'); click(button);
    const event = new Event('keydown', { cancelable: true }); Object.defineProperty(event, 'key', { value: 'Escape' });
    h.document.dispatchEvent(event);
    assert.equal(h.document.getElementById('help-modal').classList.contains('hidden'), true);
    assert.equal(h.document.activeElement, button); assert.equal(event.defaultPrevented, true);
});

test('pravidla používají stejné popisky dosahu, krytu a plošné palby jako jednotky', async () => {
    const h = await createLocalizedHarness();
    vm.runInContext(read('js/i18n/encyclopediaRenderer.js'), h.context);
    for (const language of ['cs', 'en']) {
        await h.i18n.setLanguage(language); h.context.renderRulesTab();
        const rules = h.document.getElementById('tab-rules').innerHTML;
        for (const special of ['reach', 'wagenburg', 'areaAttack']) assert.ok(rules.includes(h.i18n.t('special.' + special)));
        assert.doesNotMatch(rules, /\+3 (?:obrana|defense)|Hits all enemies in range|Zasáhne všechny nepřátele v dosahu/);
    }
});

test('návrat z minihry je nativní relativní odkaz v CS/EN, ne history.back', () => {
    const html = read('bonus/vozova-hradba/index.html'), ui = read('bonus/vozova-hradba/ui.js');
    const href = html.match(/<a id="main-game-link"[^>]*href="([^"]+)"/)[1];
    for (const base of ['https://hussitewars.com/', 'https://example.com/husitske-valky-test/']) {
        for (const suffix of ['bonus/vozova-hradba/', 'bonus/vozova-hradba/index.html']) {
            assert.equal(new URL(href, base + suffix).href, base + 'index.html');
        }
    }
    assert.ok(fs.existsSync(path.resolve(root, 'bonus/vozova-hradba', href)));
    assert.doesNotMatch(html, /id="main-game-link"[^>]*(?:tabindex="-1"|target="_blank"|onclick=)/);
    assert.doesNotMatch(ui, /history\.back\(|main-game-link.*addEventListener/);
    const copy = vm.runInNewContext(ui.slice(ui.indexOf('const COPY ='), ui.indexOf('const storage =')) + '\nCOPY;');
    assert.equal(copy.cs.mainGame, 'Zpět do Husitských válek'); assert.equal(copy.en.mainGame, 'Back to Hussite Wars');
    assert.match(ui, /getElementById\('main-game-label'\)\.textContent = t\('mainGame'\)/);
    assert.match(read('bonus/vozova-hradba/style.css'), /\.main-game-link\s*\{[^}]*min-height: 44px;[^}]*overflow-wrap: anywhere;/);
});

test('záznamy minihry a návrat podadresářem neovlivní vítězství ani odměnu hlavní kampaně', async () => {
    for (const prefix of ['/', '/husitske-valky-test/']) {
        const h = await createLocalizedHarness('cs', { pathname: prefix });
        for (const scenarioId of ['zivohost_1419', 'nekmir_1419', 'sudomere_1420', 'vitkov_1420', 'vysehrad_1420']) {
            h.CampaignProgressSystem.recordBattle({ scenarioId, result: 'victory', turns: 8 });
        }
        assert.equal(h.CampaignProgressSystem.isActCompleted(1), true);
        const before = Array.from(h.storage.entries());
        const storage = { getItem: key => h.storage.get(key), setItem: (key, value) => h.storage.set(key, value) };
        const route = prefix + 'bonus/vozova-hradba/index.html', profile = DefenseSession.read(storage, route);
        profile.language = 'en'; DefenseSession.record(profile, { outcome: 'won', cleared: 8, camp: 20, kills: 80 });
        DefenseSession.save(storage, route, profile);
        for (const [key, value] of before) assert.equal(h.storage.get(key), value);
        const returned = await createLocalizedHarness('cs', { pathname: prefix + 'index.html', storage: h.storage });
        assert.equal(returned.CampaignProgressSystem.isActCompleted(1), true);
    }
});

test('vstupy mají lokalizované názvy, srozumitelné zavření a zalamovatelný mobilní text', () => {
    const html = read('index.html'), css = read('styles/field-theme.css');
    assert.match(html, /id="btn-how-to-play"[\s\S]{0,350}data-i18n="menu.howToPlayNote"/);
    assert.match(html, /id="help-close"[^>]*data-i18n-aria-label="chronicle.close"/);
    assert.match(html, /data-i18n="help.unitStatsNote"/);
    assert.match(css, /\.menu-how-to-copy\s*\{[^}]*min-width: 0;[^}]*overflow-wrap: anywhere;/);
});

(async () => {
    let failures = 0;
    for (const { name, run } of tests) {
        try { await run(); console.log(`✓ ${name}`); }
        catch (error) { failures++; console.error(`✗ ${name}\n${error.stack}`); }
    }
    console.log(`\n${tests.length - failures}/${tests.length} testů nápovědy, jednotek a návratu.`);
    if (failures) process.exitCode = 1;
})();
