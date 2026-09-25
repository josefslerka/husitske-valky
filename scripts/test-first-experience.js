#!/usr/bin/env node
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createHarness } = require('./helpers/game-harness');
const { createLocalizedHarness } = require('./helpers/localized-harness');
const tests = [];
const test = (name, run) => tests.push({ name, run });
const plain = value => JSON.parse(JSON.stringify(value));
const quiet = h => { h.context.console = { ...console, warn() {}, error() {} }; };

test('sociální náhled má dvojjazyčná metadata a skutečný obrázek 1200 × 630', () => {
    const root = path.join(__dirname, '..');
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const imageUrl = 'https://hussitewars.com/imgs/social-preview.png';
    assert.match(html, /<link rel="canonical" href="https:\/\/hussitewars\.com\/">/);
    assert.match(html, /<meta property="og:title" content="[^"]*Husitské války[^"]*Hussite Wars">/);
    assert.match(html, new RegExp(`<meta property="og:image" content="${imageUrl}">`));
    assert.match(html, /<meta property="og:image:width" content="1200">/);
    assert.match(html, /<meta property="og:image:height" content="630">/);
    assert.match(html, /<meta name="twitter:card" content="summary_large_image">/);
    assert.match(html, new RegExp(`<meta name="twitter:image" content="${imageUrl}">`));
    assert.match(html, /<meta (?:property="og:image:alt"|name="twitter:image:alt") content="[^"]+">/);

    const png = fs.readFileSync(path.join(root, 'imgs/social-preview.png'));
    assert.equal(png.subarray(1, 4).toString('ascii'), 'PNG');
    assert.equal(png.readUInt32BE(16), 1200);
    assert.equal(png.readUInt32BE(20), 630);
});

for (const language of ['cs', 'en']) {
    test(`${language}: vysvětlení obrany rozliší krycí palbu a ruční volbu`, async () => {
        const h = await createLocalizedHarness(language, { browserView: true });
        assert.equal(h.i18n.t('game.defend'), language === 'cs' ? 'Bránit' : 'Defend');
        assert.match(h.i18n.t('game.defendHint'), language === 'cs' ? /nesčítají/ : /do not stack/);
        assert.match(h.i18n.t('game.defendExplanation'), language === 'cs' ? /místo toho kryje palbou bez bonusu obrany/ : /uses covering fire instead, with no defense bonus/);
        assert.match(h.i18n.t('game.defendExplanationRanged'), language === 'cs' ? /Krycí palba není obrana/ : /Covering fire is not defense/);
        const game = h.newGame();
        const shooter = game.unitFactory.createUnit('RUCNICARI', 5, 5);
        game.units.push(shooter);
        game.selectUnit(shooter);
        const explanation = h.document.getElementById('defend-explanation');
        assert.equal(explanation.getAttribute('data-i18n'), 'game.defendExplanationRanged');
        assert.equal(explanation.textContent, h.i18n.t('game.defendExplanationRanged'));
        assert.equal(h.i18n.hasTranslation('game.endTurnHint'), true);
        shooter.hasMoved = true;
        game.view.updateUnitPanel(shooter);
        assert.equal(explanation.getAttribute('data-i18n'), 'game.defendExplanation');
        assert.equal(explanation.textContent, h.i18n.t('game.defendExplanation'));
        game.destroy();
    });

    test(`${language}: pokyny jsou lokalizované pro výběr, pohyb, ústup i konec tahu`, async () => {
        const h = await createLocalizedHarness(language), game = h.newGame('zivohost_1419');
        const panels = new h.BattlePanels(game), unit = game.units.find(u => u.type === 'CEPNICI');
        const check = key => {
            assert.equal(panels.getGuidance()?.key, key);
            panels.updateGuidance();
            assert.equal(h.document.getElementById('turn-guidance').textContent,
                h.i18n.t(`onboarding.hints.${key}`, { unit: panels.getGuidance().unit }));
            assert.equal(h.i18n.hasTranslation(`onboarding.hints.${key}`), true);
        };
        check('select'); game.selectUnit(unit); check('move');
        unit.hasMoved = true; check('attack');
        unit.isRouting = true; check('routing'); unit.isRouting = false;
        unit.hasAttacked = true; check('spent');
        for (const u of game.getUnitsOfFaction('hussites')) { u.hasMoved = true; u.hasAttacked = true; }
        check('endTurn');
        game.actions.busy = true; check('busy'); game.actions.busy = false;
        game.currentFaction = 'crusaders'; check('enemyTurn');
        game.setPaused(true); check('paused');
        game.destroy(); assert.equal(panels.getGuidance(), null);
        panels.updateGuidance(); assert.equal(h.document.getElementById('turn-guidance').classList.contains('hidden'), true);
    });

    test(`${language}: sepnutý vůz a přesunuté dělo nedostanou nemožný rozkaz`, async () => {
        const h = await createLocalizedHarness(language), game = h.newGame('sudomere_1420');
        const panels = new h.BattlePanels(game), wagon = game.units.find(u => u.isWagon() && u.faction === 'hussites');
        wagon.formationClosed = true; game.selectUnit(wagon);
        assert.equal(panels.getGuidance().key, 'wagon');
        game.toggleWagonFormation(wagon);
        assert.notEqual(panels.getGuidance().key, 'wagon');
        const gun = game.unitFactory.createUnit('HOUFNICE', 0, 0);
        game.units.push(gun); game.selectedUnit = gun; gun.hasMoved = true;
        assert.equal(gun.canAttack(), false);
        assert.equal(panels.getGuidance().key, 'defend');
    });
}

test('situační pokyny nemění bitvu a nečtou skryté nepřátelské pozice', async () => {
    const h = await createLocalizedHarness(), game = h.newGame('zivohost_1419');
    const panels = new h.BattlePanels(game);
    const snapshot = () => JSON.stringify({ units: game.units.map(u => u.serialize()), turn: game.turnNumber,
        events: [...game.processedEvents], fog: [...game.visibleHexes], log: game.log });
    const before = snapshot();
    game.getEnemyUnits = () => { throw new Error('hint nesmí zkoumat protivníka'); };
    game.combatSystem.getValidAttackTargets = () => { throw new Error('hint nesmí odhalit cíl'); };
    for (let i = 0; i < 3; i++) { panels.getGuidance(); panels.updateGuidance(); }
    assert.equal(snapshot(), before);
});

test('skutečný prezentační adaptér obnovuje pokyn po výběru, pohybu, pauze a save/load', async () => {
    const h = createHarness({ browserView: true }), game = h.newGame('zivohost_1419');
    const text = () => h.document.getElementById('turn-guidance').textContent;
    assert.match(text(), /onboarding.hints.select/);
    const unit = game.units.find(u => u.type === 'CEPNICI'); game.selectUnit(unit);
    assert.match(text(), /onboarding.hints.move/);
    const target = game.getValidMoves(unit)[0];
    const moving = game.moveUnit(unit, target.col, target.row);
    assert.match(text(), /onboarding.hints.busy/);
    await h.advance(600); await moving;
    assert.doesNotMatch(text(), /onboarding.hints.busy/);
    game.setPaused(true); assert.match(text(), /onboarding.hints.paused/);
    game.setPaused(false); assert.doesNotMatch(text(), /onboarding.hints.paused/);
    assert.equal(game.saveGame(), true);
    const restored = h.SaveGameSystem.load(h.document.getElementById('game-canvas'), game);
    assert.match(text(), /onboarding.hints.select/);
    restored.destroy();
});

test('neplatný jazyk nikdy nevyvolá požadavek mimo podporované locale', async () => {
    const h = await createLocalizedHarness(); let fetched = false;
    h.context.fetch = () => { fetched = true; throw new Error('unexpected fetch'); };
    for (const lang of ['../secret', 'de', '__proto__', '', null]) {
        assert.equal(await h.i18n.loadLanguage(lang), false);
        assert.equal(await h.i18n.setLanguage(lang), false);
    }
    assert.equal(fetched, false); assert.equal(h.i18n.getCurrentLanguage(), 'cs');
});

for (const [label, response] of [
    ['404', { ok: false, status: 404, statusText: 'Not found' }],
    ['prázdný JSON', { ok: true, json: async () => ({}) }],
    ['HTML místo JSON', { ok: true, json: async () => { throw new SyntaxError('Unexpected <'); } }]
]) {
    test(`start s chybou překladů (${label}) selže čitelně a jde zopakovat`, async () => {
        const h = await createLocalizedHarness(), locale = h.i18n.translations.cs; quiet(h);
        h.context.navigator = { language: 'cs-CZ' };
        h.i18n.loadedLanguages.clear(); h.i18n.translations = {};
        h.context.fetch = async () => response;
        await assert.rejects(() => h.i18n.init(), /Translations unavailable/);
        assert.equal(h.i18n.loadedLanguages.has('cs'), false);
        assert.equal(h.i18n.translations.cs, undefined, 'nevytvářet prázdný překladač s klíči místo textů');
        h.context.fetch = async () => ({ ok: true, json: async () => locale });
        await h.i18n.init();
        assert.equal(h.i18n.t('menu.newGame'), 'Vybrat bitvu');
    });
}

test('nedostupná angličtina zachová funkční český start', async () => {
    const h = await createLocalizedHarness(); quiet(h);
    h.context.navigator = { language: 'en-GB' };
    h.storage.set('gameLanguage', 'en');
    h.i18n.loadedLanguages.delete('en'); delete h.i18n.translations.en;
    h.context.fetch = async () => { throw new Error('offline'); };
    await h.i18n.init();
    assert.equal(h.i18n.getCurrentLanguage(), 'cs');
    assert.equal(h.i18n.t('onboarding.firstBattle'), 'První bitva: Živohošť');
});

test('blokované úložiště jazyka nebrání načtení ani přepnutí hry', async () => {
    const h = await createLocalizedHarness(); quiet(h);
    h.context.navigator = { language: 'en-US' };
    h.context.localStorage.getItem = h.context.localStorage.setItem = () => { throw new Error('SecurityError'); };
    await h.i18n.init(); assert.equal(h.i18n.getCurrentLanguage(), 'en');
    assert.equal(await h.i18n.setLanguage('cs'), true); assert.equal(h.i18n.getCurrentLanguage(), 'cs');
});

for (const [label, browser, saved, expected] of [
    ['český prohlížeč', { language: 'cs-CZ' }, null, 'cs'],
    ['anglický prohlížeč', { language: 'en-GB' }, null, 'en'],
    ['angličtina jako druhá preference', { languages: ['de-DE', 'en-US', 'cs-CZ'], language: 'de-DE' }, null, 'en'],
    ['čeština jako první preference', { languages: ['cs-CZ', 'en-US'], language: 'cs-CZ' }, null, 'cs'],
    ['nepodporované jazyky', { languages: ['de-DE', 'fr-FR'], language: 'de-DE' }, null, 'cs'],
    ['chybějící jazyky', {}, null, 'cs'],
    ['prázdné preference', { languages: [], language: 'en-US' }, null, 'en'],
    ['uložená čeština před anglickým prohlížečem', { language: 'en-US' }, 'cs', 'cs'],
    ['uložená angličtina před českým prohlížečem', { language: 'cs-CZ' }, 'en', 'en'],
    ['neplatná uložená volba', { language: 'en-GB' }, 'de', 'en']
]) {
    test(`jazyk při startu: ${label}`, async () => {
        const h = await createLocalizedHarness();
        h.storage.delete('gameLanguage');
        if (saved !== null) h.storage.set('gameLanguage', saved);
        h.context.navigator = browser;
        await h.i18n.init();
        assert.equal(h.i18n.getCurrentLanguage(), expected);
        assert.equal(h.document.documentElement.lang, expected);
    });
}

test('ruční volba jazyka se uchová i při dalším startu s jiným jazykem prohlížeče', async () => {
    const h = await createLocalizedHarness();
    for (const language of ['en', 'cs']) {
        await h.i18n.setLanguage(language);
        h.context.navigator = { language: language === 'cs' ? 'en-GB' : 'cs-CZ' };
        await h.i18n.init();
        assert.equal(h.i18n.getCurrentLanguage(), language);
        assert.equal(h.storage.get('gameLanguage'), language);
    }
});

test('poškozené nastavení neblokuje start a nikdy se automaticky nepřepisuje', async () => {
    const h = await createLocalizedHarness(); quiet(h);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/ui/main.js'), 'utf8'), h.context);
    const read = () => plain(vm.runInContext('readGamePreferences()', h.context));
    for (const raw of ['{', '[]', 'false', 'null', '42', '"text"']) {
        h.storage.set('husitskeValky_settings', raw);
        assert.deepEqual(read(), {}); assert.equal(h.storage.get('husitskeValky_settings'), raw);
    }
    h.storage.set('husitskeValky_settings', JSON.stringify({ soundEnabled: false, soundVolume: 40, aiSpeed: 'fast',
        difficultyLevel: 'advanced', showDamage: true, confirmEndTurn: false, extra: 'ignored' }));
    assert.deepEqual(read(), { soundEnabled: false, showDamage: true,
        soundVolume: 40, aiSpeed: 'fast', difficultyLevel: 'advanced' });
    h.storage.set('husitskeValky_settings', '{"soundEnabled":"false","soundVolume":-1,"aiSpeed":"warp","difficultyLevel":"expert","__proto__":{"polluted":true}}');
    assert.deepEqual(read(), {});
    h.context.localStorage.getItem = () => { throw new Error('SecurityError'); };
    assert.deepEqual(read(), {});
});

test('všechny texty prvního zážitku mají neprázdný překlad a shodné parametry CS/EN', async () => {
    const h = await createLocalizedHarness();
    const flatten = (obj, prefix = '') => Object.entries(obj).flatMap(([key, value]) => typeof value === 'string'
        ? [[prefix + key, value]] : flatten(value, `${prefix}${key}.`));
    const cs = Object.fromEntries(flatten(h.i18n.translations.cs.onboarding));
    const en = Object.fromEntries(flatten(h.i18n.translations.en.onboarding));
    assert.deepEqual(Object.keys(cs).sort(), Object.keys(en).sort());
    for (const key of Object.keys(cs)) {
        assert.ok(cs[key].trim() && en[key].trim());
        assert.deepEqual(cs[key].match(/\{\w+\}/g), en[key].match(/\{\w+\}/g), key);
    }
});

test('výsledkové hodnocení zahrne posily i uprchlé a nevydává dílčí úspěch za úplné zničení', async () => {
    const h = await createLocalizedHarness();
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/ui/main.js'), 'utf8'), h.context);
    const stats = { lossesByFaction: { hussites: 2, crusaders: 9 }, fledByFaction: { hussites: 1, crusaders: 3 },
        aliveByFaction: { hussites: 8, crusaders: 5 } };
    const before = JSON.stringify(stats);
    const initialArmy = { initialPlayerUnits: 8, initialEnemyUnits: 9 };
    const counts = plain(h.context.getBattleResultCounts(stats, initialArmy));
    assert.deepEqual(counts, { player: { lost: 3, total: 11 }, enemy: { lost: 12, total: 17 } });
    assert.ok(counts.enemy.lost / counts.enemy.total < 1);
    assert.equal(JSON.stringify(stats), before);
    assert.deepEqual(plain(h.context.getBattleResultCounts(undefined, undefined)),
        { player: { lost: 0, total: 0 }, enemy: { lost: 0, total: 0 } });
    assert.deepEqual(plain(h.context.getBattleResultCounts({ enemiesKilled: 2, unitsLost: 1 }, {
        units: [{ faction: 'hussites', health: 50 }, { faction: 'crusaders', health: 10 }, { faction: 'crusaders', health: 0 }]
    })), { player: { lost: 1, total: 2 }, enemy: { lost: 2, total: 3 } });
});

test('výsledek lze skrýt, znovu otevřít a režim prohlížení se při odchodu uklidí', async () => {
    const root = path.join(__dirname, '..');
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    assert.match(html, /id="btn-review-battlefield"[\s\S]{0,160}data-i18n="gameover\.reviewBattlefield"/);
    assert.match(html, /id="btn-show-results"[^>]*data-i18n="gameover\.showResults"[^>]*aria-hidden="true"/);

    const h = await menuHarness(), el = id => h.document.getElementById(id);
    h.context.window.showGameOver(false, 'Test', {
        turns: 3,
        lossesByFaction: { hussites: 2, crusaders: 1 },
        fledByFaction: { hussites: 0, crusaders: 0 },
        aliveByFaction: { hussites: 3, crusaders: 4 }
    });
    assert.equal(el('gameover-modal').classList.contains('hidden'), false);
    assert.equal(el('gameover-modal').getAttribute('aria-hidden'), 'false');
    assert.equal(el('game-container').classList.contains('post-battle-review'), true);
    assert.equal(el('btn-show-results').classList.contains('hidden'), false);

    el('btn-review-battlefield').dispatchEvent(new Event('click'));
    assert.equal(el('gameover-modal').classList.contains('hidden'), true);
    assert.equal(el('gameover-modal').getAttribute('aria-hidden'), 'true');
    assert.equal(h.document.activeElement, el('btn-show-results'));

    el('btn-show-results').dispatchEvent(new Event('click'));
    assert.equal(el('gameover-modal').classList.contains('hidden'), false);
    assert.equal(h.document.activeElement, el('gameover-title'));

    // Testovací DOM neparsuje výchozí třídy z HTML; skutečné překryvy jsou při hře skryté.
    for (const id of ['about-modal', 'help-modal', 'chronicle-modal']) el(id).classList.add('hidden');
    const escape = new Event('keydown', { cancelable: true });
    Object.defineProperty(escape, 'key', { value: 'Escape' });
    h.document.dispatchEvent(escape);
    assert.equal(el('gameover-modal').classList.contains('hidden'), true);
    assert.equal(h.document.activeElement, el('btn-show-results'));
    const reopen = new Event('keydown', { cancelable: true });
    Object.defineProperty(reopen, 'key', { value: 'Escape' });
    h.document.dispatchEvent(reopen);
    assert.equal(el('gameover-modal').classList.contains('hidden'), false);

    el('btn-gameover-menu').dispatchEvent(new Event('click'));
    assert.equal(el('game-container').classList.contains('post-battle-review'), false);
    assert.equal(el('btn-show-results').classList.contains('hidden'), true);
    assert.equal(el('gameover-modal').getAttribute('aria-hidden'), 'true');
});

for (const language of ['cs', 'en']) {
    test(`${language}: restart bitvy je dostupný v herním menu i v pauze`, async () => {
        const h = await menuHarness(language);
        const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
        assert.match(html, /id="btn-retry-battle"[^>]*data-i18n-title="pause\.retry"[\s\S]{0,160}data-i18n="pause\.retry"/);
        assert.match(html, /id="btn-pause-retry"[\s\S]{0,160}data-i18n="pause\.retry"/);
        assert.ok(h.i18n.t('pause.retry').length > 3);
        assert.ok(h.i18n.t('pause.confirmRetry').length > 30);
    });
}

test('restart zahodí rozehranou bitvu až po potvrzení a zrušení zachová pauzu', async () => {
    const h = await menuHarness('cs', h => { h.BattleView.prototype.render = () => {}; });
    const el = id => h.document.getElementById(id);
    el('btn-first-battle').dispatchEvent(new Event('click'));
    el('btn-start-mission').dispatchEvent(new Event('click'));
    const original = h.context.window.game;
    original.turnNumber = 7;
    original.units[0].health = 1;
    original.setPaused(true);
    el('pause-modal').classList.remove('hidden');
    el('confirm-modal').classList.add('hidden');

    el('btn-pause-retry').dispatchEvent(new Event('click'));
    assert.equal(el('confirm-modal').classList.contains('hidden'), false);
    assert.equal(el('confirm-message').textContent, h.i18n.t('pause.confirmRetry'));
    assert.equal(original.isPaused, true);
    el('confirm-cancel').dispatchEvent(new Event('click'));
    await Promise.resolve();
    assert.equal(h.context.window.game, original);
    assert.equal(original.turnNumber, 7);
    assert.equal(original.units[0].health, 1);
    assert.equal(original.isPaused, true);
    assert.equal(el('pause-modal').classList.contains('hidden'), false);

    el('btn-pause-retry').dispatchEvent(new Event('click'));
    el('confirm-ok').dispatchEvent(new Event('click'));
    await Promise.resolve();
    const restarted = h.context.window.game;
    assert.notEqual(restarted, original);
    assert.equal(restarted.currentScenario.id, 'zivohost_1419');
    assert.equal(restarted.turnNumber, 1);
    assert.equal(restarted.isPaused, false);
    assert.equal(el('pause-modal').classList.contains('hidden'), true);
    restarted.destroy();
});

test('restart rychlé bitvy nevytvoří omylem dříve vybraný scénář', async () => {
    const h = await menuHarness('cs', h => { h.BattleView.prototype.render = () => {}; });
    const el = id => h.document.getElementById(id);
    el('btn-first-battle').dispatchEvent(new Event('click'));
    el('mission-close').dispatchEvent(new Event('click'));
    el('btn-quick-battle').dispatchEvent(new Event('click'));
    const original = h.context.window.game;
    original.turnNumber = 5;
    el('confirm-modal').classList.add('hidden');

    el('btn-retry-battle').dispatchEvent(new Event('click'));
    assert.equal(original.isPaused, true, 'bitva se během potvrzení nesmí hýbat');
    el('confirm-ok').dispatchEvent(new Event('click'));
    await Promise.resolve();
    const restarted = h.context.window.game;
    assert.notEqual(restarted, original);
    assert.equal(restarted.currentScenario, null);
    assert.equal(restarted.turnNumber, 1);
    assert.equal(restarted.isPaused, false);
    restarted.destroy();
});

test('dohraná časová mise ukazuje skutečný počet kol a nehlásí další tah', async () => {
    const h = await createLocalizedHarness('cs', { browserView: true });
    const game = h.newGame('vitkov_1420');
    game.turnNumber = 9;
    game.gameOverTurn = 8;
    game.gameState = 'victory';
    game.updateUI();
    assert.equal(h.document.getElementById('current-player').textContent, 'Dohráno');
    assert.equal(h.document.getElementById('current-player').className, 'finished');
    assert.equal(h.document.getElementById('turn-number').textContent, 'Kolo: 8/8');
    game.destroy();
});

async function menuHarness(language = 'cs', prepare = () => {}) {
    const h = await createLocalizedHarness(language);
    h.context.CustomEvent = class extends Event {
        constructor(type, options) { super(type); this.detail = options?.detail; }
    };
    h.context.window = Object.assign(new EventTarget(), { innerWidth: 1280 });
    h.context.Music = {
        isPlaying: false, setVolume() {}, setEnabled() {},
        stop() { this.isPlaying = false; },
        toggle() { this.isPlaying = !this.isPlaying; return this.isPlaying; }
    };
    await prepare(h);
    let initialize;
    const listen = h.document.addEventListener.bind(h.document);
    h.document.addEventListener = (type, handler, options) => {
        if (type === 'DOMContentLoaded') initialize = handler;
        else listen(type, handler, options);
    };
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/ui/main.js'), 'utf8'), h.context);
    await initialize();
    return h;
}

test('titulní menu zachovává všechny akce, pořadí pokračování a dekorativní ilustraci', () => {
    const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
    const menu = html.slice(html.indexOf('<div id="main-menu"'), html.indexOf('<div id="game-container"'));
    for (const id of ['btn-resume-auto', 'btn-first-battle', 'btn-new-campaign', 'btn-quick-battle',
        'btn-continue', 'btn-chronicle', 'btn-encyclopedia', 'btn-settings', 'btn-about', 'btn-menu-music', 'btn-language-toggle']) {
        assert.equal([...menu.matchAll(new RegExp(`id="${id}"`, 'g'))].length, 1, id);
    }
    assert.ok(menu.indexOf('id="btn-resume-auto"') < menu.indexOf('id="btn-first-battle"'));
    assert.match(menu, /<h1 id="menu-title"/);
    assert.match(menu, /<nav[^>]*aria-labelledby="menu-play-title"/);
    assert.match(menu, /<img[^>]*menu-woodcut\.svg[^>]*alt=""[^>]*aria-hidden="true"/);
});

test('přepínač jazyka ukazuje cíl a vede na changelog v obou směrech', async () => {
    const h = await menuHarness();
    const button = h.document.getElementById('btn-language-toggle');
    const target = h.document.getElementById('language-target');
    const changelog = h.document.getElementById('menu-changelog');
    for (const [language, next, label] of [
        ['cs', 'EN', 'Přepnout do angličtiny'],
        ['en', 'CS', 'Switch to Czech'],
        ['cs', 'EN', 'Přepnout do angličtiny']
    ]) {
        assert.equal(h.i18n.getCurrentLanguage(), language);
        assert.equal(target.textContent, next);
        assert.equal(button.getAttribute('aria-label'), label);
        assert.equal(button.getAttribute('title'), label);
        assert.equal(changelog.getAttribute('href'),
            `https://github.com/josefslerka/husitske-valky/blob/main/${language === 'en' ? 'CHANGELOG.en.md' : 'CHANGELOG.md'}`);
        button.dispatchEvent(new Event('click'));
        await new Promise(setImmediate);
    }
});

test('anglický prohlížeč dostane odkaz na anglický changelog už při načtení menu', async () => {
    const h = await menuHarness('en');
    assert.equal(h.document.getElementById('menu-changelog').getAttribute('href'),
        'https://github.com/josefslerka/husitske-valky/blob/main/CHANGELOG.en.md');
});

test('neúspěšné načtení angličtiny nezmění jazyk, cíl tlačítka ani uloženou volbu', async () => {
    const h = await menuHarness(); quiet(h);
    h.i18n.loadedLanguages.delete('en'); delete h.i18n.translations.en;
    h.context.fetch = async () => { throw new Error('offline'); };
    h.document.getElementById('btn-language-toggle').dispatchEvent(new Event('click'));
    await new Promise(setImmediate);
    assert.equal(h.i18n.getCurrentLanguage(), 'cs');
    assert.equal(h.document.getElementById('language-target').textContent, 'EN');
    assert.equal(h.document.getElementById('btn-language-toggle').getAttribute('aria-label'), 'Přepnout do angličtiny');
    assert.equal(h.document.getElementById('menu-changelog').getAttribute('href'),
        'https://github.com/josefslerka/husitske-valky/blob/main/CHANGELOG.md');
    assert.equal(h.storage.get('gameLanguage'), 'cs');
});

test('obě obrazovky O hře vznikají z jediné lokalizované šablony a mají aktuální odkazy', async () => {
    const h = await createLocalizedHarness();
    const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
    const version = h.i18n.t('menu.version');
    const copies = [...html.matchAll(/data-i18n="menu.version">([^<]+)</g)].map(match => match[1]);
    assert.deepEqual(copies, [version], 'statický fallback zůstává pouze v titulním menu');
    assert.equal(h.i18n.translations.en.menu.version, version);
    assert.ok(fs.readFileSync(path.join(__dirname, '../README.md'), 'utf8').includes(`**Verze:** ${version.split(' · ')[0]}`));
    assert.doesNotMatch(html, /Alpha 0\.[12]\b/);
    assert.match(html, /<div id="tab-about" class="help-tab-content"><\/div>/);
    assert.match(html, /<div id="about-content"><\/div>/);
    assert.doesNotMatch(html, /Beta Testing|Po publikování na GitHub|mailto:/);
    const menu = html.slice(html.indexOf('<div id="main-menu"'), html.indexOf('<div id="game-container"'));
    assert.match(menu, /<a id="menu-changelog" href="https:\/\/github\.com\/josefslerka\/husitske-valky\/blob\/main\/CHANGELOG\.md" target="_blank" rel="noopener noreferrer" class="changelog-link" data-i18n="menu\.changelog">Změny<\/a>/);
    assert.match(menu, /<a href="https:\/\/buymeacoffee.com\/josefslerka" target="_blank" rel="noopener noreferrer" class="coffee-button">\s*<span aria-hidden="true">☕<\/span>\s*<span data-i18n="menu.support">Buy Me a Coffee<\/span>\s*<\/a>/);
    assert.doesNotMatch(menu, /class="support-link"/);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/i18n/encyclopediaRenderer.js'), 'utf8'), h.context);
    for (const language of ['cs', 'en']) {
        await h.i18n.setLanguage(language);
        h.context.renderAboutTab();
        h.context.renderAboutModal();
        const tab = h.document.getElementById('tab-about').innerHTML;
        const modal = h.document.getElementById('about-content').innerHTML;
        assert.equal(tab, modal);
        assert.ok(tab.includes(`data-i18n="menu.version">${version}</p>`));
        assert.ok(tab.includes(language === 'cs' ? 'Autorství a prameny' : 'Authorship and sources'));
        assert.match(tab, /https:\/\/github\.com\/josefslerka\/husitske-valky\/issues/);
        assert.match(tab, /https:\/\/github\.com\/josefslerka\/husitske-valky\/blob\/main\/LICENSE/);
        assert.match(tab, /target="_blank" rel="noopener noreferrer"/);
        assert.doesNotMatch(tab, /TBD|After publishing|Po publikování|mailto:|Copyright|©\s*2026/);
        assert.equal(h.i18n.t('menu.support'), 'Buy Me a Coffee');
        assert.equal(h.i18n.t('menu.changelog'), language === 'cs' ? 'Změny' : 'Changelog');
    }
});

test('číslo a datum vydání souhlasí v menu, dokumentaci a obou changelozích', () => {
    const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    const cs = JSON.parse(read('js/i18n/locales/cs.json'));
    const en = JSON.parse(read('js/i18n/locales/en.json'));
    const version = cs.menu.version;
    const match = /^(Alpha \d+(?:\.\d+){1,2}) · (\d{2})\.(\d{2})\.(\d{4})$/.exec(version);
    assert.ok(match, 'verze v menu musí obsahovat číslo i datum');
    const [, number, day, month, year] = match;
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    const format = locale => new Intl.DateTimeFormat(locale, {
        day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'
    }).format(date);
    assert.equal(en.menu.version, version);
    assert.ok(read('index.html').includes(`data-i18n="menu.version">${version}</span>`));
    assert.ok(read('README.md').includes(`**Verze:** ${number} (${format('cs-CZ')})`));
    assert.ok(read('README.en.md').includes(`**Version:** ${number} (${format('en-GB')})`));
    assert.ok(read('TODO.md').includes(`**Aktuální verze:** ${number} (${Number(day)}. ${Number(month)}. ${year})`));
    const changelogCs = read('CHANGELOG.md');
    const changelogEn = read('CHANGELOG.en.md');
    assert.ok(changelogCs.includes(`## ${number} (${format('cs-CZ')})`));
    assert.ok(changelogEn.includes(`## ${number} (${format('en-GB')})`));
    assert.match(changelogCs, /\[Vozová hradba\]\(https:\/\/hussitewars\.com\/bonus\/vozova-hradba\/\)/);
    assert.match(changelogEn, /\[Wagon Fort\]\(https:\/\/hussitewars\.com\/bonus\/vozova-hradba\/\)/);
});

test('terén v obou jazycích propojí každý dekorativní náhled se správným mapovým motivem', async () => {
    const h = await createLocalizedHarness();
    const terrain = ['plains', 'forest', 'hills', 'water', 'town', 'road', 'dam', 'mud', 'slope'];
    const previews = html => [...html.matchAll(/<canvas class="terrain-icon" data-terrain="([a-z]+)" width="144" height="128" aria-hidden="true"><\/canvas>/g)].map(match => match[1]);
    const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
    assert.deepEqual(previews(html), terrain, 'statické HTML nesmí vrátit staré barevné bloky');
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/i18n/encyclopediaRenderer.js'), 'utf8'), h.context);
    const renderer = vm.runInContext('WoodcutRenderer', h.context), calls = [];
    renderer.drawTerrainPreview = (canvas, type) => {
        assert.equal(canvas.dataset.terrain, type);
        calls.push(type);
    };
    const container = h.document.getElementById('tab-terrain');
    container.querySelectorAll = selector => {
        assert.equal(selector, 'canvas[data-terrain]');
        return previews(container.innerHTML).map(type => ({ dataset: { terrain: type } }));
    };
    for (const language of ['cs', 'en', 'cs']) {
        await h.i18n.setLanguage(language);
        calls.length = 0;
        h.context.renderTerrainTab();
        assert.deepEqual(previews(container.innerHTML), terrain);
        assert.deepEqual(calls, terrain);
        assert.ok(container.innerHTML.includes(language === 'cs' ? 'Typy terénu' : 'Terrain Types'));
        assert.doesNotMatch(container.innerHTML, /<div class="terrain-icon/);
    }
});

test('encyklopedie z menu, z bitvy i z pauzy inicializuje stejné aktuální náhledy', async () => {
    let rendered = 0;
    const h = await menuHarness('cs', h => {
        h.context.initEncyclopediaContent = () => { rendered++; };
    });
    for (const [index, id] of ['btn-encyclopedia', 'btn-help', 'btn-pause-help'].entries()) {
        h.document.getElementById('help-content').scrollTop = 640;
        h.document.getElementById(id).dispatchEvent(new Event('click'));
        assert.equal(rendered, index + 1, id);
        assert.equal(h.document.getElementById('help-modal').classList.contains('hidden'), false);
        assert.equal(h.document.getElementById('help-content').scrollTop, 0, id);
    }
});

test('samostatné O hře obnoví obsah, začne nahoře a vrátí fokus na původní tlačítko', async () => {
    let rendered = 0;
    const h = await menuHarness('cs', h => {
        h.context.renderAboutModal = () => { rendered++; };
    });
    const button = h.document.getElementById('btn-about');
    const close = h.document.getElementById('about-close');
    const scroller = h.document.getElementById('about-content-scroll');
    button.focus();
    scroller.scrollTop = 520;
    button.dispatchEvent(new Event('click'));
    assert.equal(rendered, 1);
    assert.equal(scroller.scrollTop, 0);
    assert.equal(h.document.activeElement, close);
    close.dispatchEvent(new Event('click'));
    assert.equal(h.document.getElementById('about-modal').classList.contains('hidden'), true);
    assert.equal(h.document.activeElement, button);
});

test('nový hráč nedostane neexistující pokračování ani ruční save', async () => {
    const h = await menuHarness(), el = id => h.document.getElementById(id);
    assert.equal(el('btn-resume-auto').classList.contains('hidden'), true);
    assert.equal(el('main-menu').classList.contains('has-autosave'), false);
    assert.equal(el('btn-continue').disabled, true);
    assert.equal(el('btn-continue').classList.contains('hidden'), true);
    assert.equal(el('btn-first-battle').classList.contains('hidden'), false);
    assert.equal(el('btn-new-campaign').classList.contains('menu-featured'), false);
    assert.equal(h.storage.has(h.SaveGameSystem.AUTO_KEY), false);
});

test('briefing má pojmenovaný dialog a akce mimo posouvaný text', () => {
    const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
    const modal = html.slice(html.indexOf('<div id="mission-modal"'), html.indexOf('<div id="help-modal"'));
    assert.match(modal, /id="mission-modal"[^>]*role="dialog"[^>]*aria-modal="true"[^>]*aria-labelledby="mission-modal-title"/);
    assert.match(modal, /<h2 id="mission-modal-title"/);
    assert.match(modal, /id="mission-close"[^>]*data-i18n-aria-label="chronicle.close"/);
    assert.match(modal, /id="mission-detail-body" class="mission-info"/);
    assert.match(modal, /id="mission-sources"><\/div>\s*<\/div>\s*<\/div>\s*<div class="mission-actions">/);
    for (const id of ['mission-detail-body', 'mission-controls', 'mission-sources', 'btn-back-to-list', 'btn-start-mission']) {
        assert.equal([...modal.matchAll(new RegExp(`id="${id}"`, 'g'))].length, 1, id);
    }
});

for (const language of ['cs', 'en']) {
    test(`${language}: otevření briefingu resetuje jeho vlastní posuvník a nemění uložený postup`, async () => {
        const h = await menuHarness(language), el = id => h.document.getElementById(id);
        const before = JSON.stringify([...h.storage]);
        el('mission-detail-body').scrollTop = 480;
        el('btn-first-battle').dispatchEvent(new Event('click'));
        assert.equal(el('mission-detail-body').scrollTop, 0);
        assert.equal(el('mission-controls').open, true);
        assert.equal(el('mission-details').classList.contains('hidden'), false);
        assert.equal(el('mission-list').classList.contains('hidden'), true);
        assert.match(el('mission-title').textContent, /Živoho|Zivoho/);
        el('btn-back-to-list').dispatchEvent(new Event('click'));
        assert.equal(el('mission-list').classList.contains('hidden'), false);
        assert.equal(el('mission-details').classList.contains('hidden'), true);
        el('mission-detail-body').scrollTop = 900;
        el('btn-first-battle').dispatchEvent(new Event('click'));
        assert.equal(el('mission-detail-body').scrollTop, 0);
        assert.equal(JSON.stringify([...h.storage]), before);
    });
}

for (const language of ['cs', 'en']) {
    test(`${language}: Další mise ukáže své rozkazy a historii před startem bitvy`, async () => {
        const h = await menuHarness(language, h => { h.BattleView.prototype.render = () => {}; });
        const el = id => h.document.getElementById(id);
        el('btn-first-battle').dispatchEvent(new Event('click'));
        h.context.window.showGameOver(true, 'Vítězství', { turns: 4 });
        assert.equal(el('btn-next-mission').classList.contains('hidden'), false);

        el('mission-detail-body').scrollTop = 500;
        el('btn-next-mission').dispatchEvent(new Event('click'));
        assert.equal(el('gameover-modal').classList.contains('hidden'), true);
        assert.equal(el('mission-modal').classList.contains('hidden'), false);
        assert.equal(el('mission-details').classList.contains('hidden'), false);
        assert.equal(el('mission-list').classList.contains('hidden'), true);
        assert.equal(el('mission-detail-body').scrollTop, 0);
        assert.match(el('mission-title').textContent, /Nekm[íi]ř|Nekmir/);
        assert.ok(el('mission-briefing').textContent.length > 20);
        assert.equal(el('mission-history').classList.contains('hidden'), false);
        assert.equal(h.document.activeElement, el('mission-title'));
        assert.equal(h.context.window.game ?? null, null, 'bitva nezačne kliknutím na Další misi');

        el('btn-start-mission').dispatchEvent(new Event('click'));
        assert.equal(el('mission-modal').classList.contains('hidden'), true);
        assert.equal(h.context.window.game?.currentScenario.id, 'nekmir_1419');
        h.context.window.game?.destroy();
    });
}

test('CS/EN návod nerozšiřuje protiútok na všechny oddíly ani na střelce po zásahu', async () => {
    const h = await createLocalizedHarness();
    for (const language of ['cs', 'en']) {
        const attackStep = h.i18n.translations[language].scenarios.tutorial.steps.find(step =>
            step.title === (language === 'cs' ? 'Útok!' : 'Attack!'));
        assert.ok(attackStep);
        assert.match(attackStep.text, /28\+/);
        assert.match(attackStep.text, language === 'cs' ? /pohyb nepřítele/ : /enemy movement/);
        assert.doesNotMatch(attackStep.text, language === 'cs' ? /obě strany utrpí/ : /both sides take damage/);
    }
});

for (const language of ['cs', 'en']) {
    test(`${language}: pokračování má prioritu jen s platným rozehraným checkpointem`, async () => {
        const h = await menuHarness(language, h => {
            const game = h.newGame('zivohost_1419');
            game.turnNumber = 3;
            assert.equal(game.saveGame({ automatic: true }), true);
            assert.equal(game.saveGame(), true);
            game.destroy();
        });
        const el = id => h.document.getElementById(id);
        const raw = h.storage.get(h.SaveGameSystem.AUTO_KEY);
        assert.equal(el('main-menu').classList.contains('has-autosave'), true);
        assert.equal(el('btn-resume-auto').classList.contains('hidden'), false);
        assert.match(el('autosave-summary').textContent, /Živoho|Zivoho/);
        assert.match(el('autosave-summary').textContent, /3/);
        assert.equal(el('btn-continue').disabled, false);
        assert.equal(el('btn-continue').classList.contains('hidden'), false);
        assert.equal(el('btn-first-battle').classList.contains('hidden'), true);
        assert.equal(el('btn-new-campaign').classList.contains('menu-featured'), false);
        assert.equal(h.storage.get(h.SaveGameSystem.AUTO_KEY), raw);
        for (const invalid of ['{', JSON.stringify({ ...JSON.parse(raw), gameState: 'victory' })]) {
            h.storage.set(h.SaveGameSystem.AUTO_KEY, invalid);
            h.document.dispatchEvent(new Event('languageChanged'));
            assert.equal(el('main-menu').classList.contains('has-autosave'), false);
            assert.equal(el('btn-resume-auto').classList.contains('hidden'), true);
            assert.equal(el('btn-continue').disabled, false, 'ruční save zůstává nezávislý');
            assert.equal(h.storage.get(h.SaveGameSystem.AUTO_KEY), invalid, 'menu nesmí přepisovat checkpoint');
        }
        for (const key of ['titleFirst', 'titleSecond', 'edition', 'colophon', 'playTitle', 'libraryTitle']) {
            assert.ok(h.i18n.hasTranslation(`menu.${key}`), key);
            assert.ok(h.i18n.t(`menu.${key}`).trim());
        }
    });
}

for (const language of ['cs', 'en']) {
    test(`${language}: doporučení menu podle automatického, ručního a dokončeného savu`, async () => {
        for (const kind of ['automatic', 'manual', 'finished']) {
            let before;
            const h = await menuHarness(language, h => {
                const game = h.newGame('vitkov_1420');
                game.turnNumber = 5;
                assert.equal(game.saveGame({ automatic: kind === 'automatic' }), true);
                // A valid legacy completed snapshot must not count as a resumable autosave.
                if (kind === 'finished') {
                    const snapshot = JSON.parse(h.storage.get(h.SaveGameSystem.STORAGE_KEY));
                    snapshot.gameState = 'victory';
                    h.SaveGameSystem.write(snapshot, { automatic: true });
                    h.storage.delete(h.SaveGameSystem.STORAGE_KEY);
                }
                game.destroy();
                before = JSON.stringify([...h.storage]);
            });
            const el = id => h.document.getElementById(id);
            assert.equal(el('btn-first-battle').classList.contains('hidden'), true, kind);
            assert.equal(el('btn-resume-auto').classList.contains('hidden'), kind !== 'automatic', kind);
            assert.equal(el('btn-continue').classList.contains('hidden'), kind !== 'manual', kind);
            assert.equal(el('btn-new-campaign').classList.contains('menu-featured'), kind !== 'automatic', kind);
            assert.equal(el('btn-new-campaign').classList.contains('primary'), kind !== 'automatic', kind);
            assert.equal(JSON.stringify([...h.storage]), before, 'menu pouze čte existující data');
        }
    });

    test(`${language}: dohraná bitva zůstává zkušeností i bez checkpointu`, async () => {
        for (const kind of ['victory', 'defeat', 'chronicle']) {
            let before;
            const h = await menuHarness(language, h => {
                if (kind === 'chronicle') {
                    h.ChronicleSystem.record({ scenarioId: 'zivohost_1419', result: 'defeat', turns: 3 });
                } else {
                    h.CampaignProgressSystem.recordBattle({ scenarioId: 'zivohost_1419', result: kind, turns: 3 });
                }
                before = JSON.stringify([...h.storage]);
            });
            const el = id => h.document.getElementById(id);
            assert.equal(el('btn-first-battle').classList.contains('hidden'), true, kind);
            assert.equal(el('btn-continue').classList.contains('hidden'), true);
            assert.equal(el('btn-resume-auto').classList.contains('hidden'), true);
            assert.equal(el('btn-new-campaign').classList.contains('menu-featured'), true);
            assert.equal(JSON.stringify([...h.storage]), before);
        }
    });
}

test('nastavení ani poškozená historie nováčkovi neschovají první bitvu a data se nemažou', async () => {
    const h = await menuHarness('cs', h => {
        quiet(h);
        h.storage.set('husitskeValky_settings', '{"soundEnabled":false}');
        h.storage.set(h.SaveGameSystem.STORAGE_KEY, '{');
        h.storage.set(h.SaveGameSystem.AUTO_KEY, '[]');
        h.storage.set(h.CampaignProgressSystem.STORAGE_KEY, '{"version":1,"battles":{"unknown":{"result":"victory"},"vitkov_1420":{}}}');
        h.storage.set(h.ChronicleSystem.STORAGE_KEY, '[{"result":"victory"}]');
    });
    const before = JSON.stringify([...h.storage]);
    assert.equal(h.document.getElementById('btn-first-battle').classList.contains('hidden'), false);
    assert.equal(h.document.getElementById('btn-resume-auto').classList.contains('hidden'), true);
    assert.equal(h.document.getElementById('btn-continue').classList.contains('hidden'), false, 'existující vadný ruční soubor má dál dostupné vysvětlení při načtení');
    h.document.dispatchEvent(new Event('languageChanged'));
    assert.equal(JSON.stringify([...h.storage]), before);
});

test('obnovení menu přepíná doporučení i ruční řádek oběma směry a snese blokované úložiště', async () => {
    const h = await menuHarness(), el = id => h.document.getElementById(id);
    const game = h.newGame('vitkov_1420');
    game.saveGame(); game.destroy();
    h.document.dispatchEvent(new Event('languageChanged'));
    assert.equal(el('btn-continue').classList.contains('hidden'), false);
    assert.equal(el('btn-first-battle').classList.contains('hidden'), true);
    assert.equal(el('btn-new-campaign').classList.contains('menu-featured'), true);
    h.storage.delete(h.SaveGameSystem.STORAGE_KEY);
    h.document.dispatchEvent(new Event('languageChanged'));
    assert.equal(el('btn-continue').classList.contains('hidden'), true);
    assert.equal(el('btn-continue').disabled, true);
    assert.equal(el('btn-first-battle').classList.contains('hidden'), false);
    assert.equal(el('btn-new-campaign').classList.contains('menu-featured'), false);
    assert.equal(el('btn-new-campaign').classList.contains('primary'), false);
    quiet(h);
    h.context.localStorage.getItem = () => { throw new Error('SecurityError'); };
    h.document.dispatchEvent(new Event('languageChanged'));
    assert.equal(el('btn-first-battle').classList.contains('hidden'), false);
});

test('hudba v menu má lokalizovaný text a pravdivý přístupný stav i po změně jazyka', async () => {
    const h = await menuHarness(), button = h.document.getElementById('btn-menu-music');
    assert.equal(button.getAttribute('aria-pressed'), 'false');
    button.dispatchEvent(new Event('click'));
    assert.equal(button.getAttribute('aria-pressed'), 'true');
    assert.equal(button.classList.contains('playing'), true);
    await h.i18n.setLanguage('en');
    assert.equal(button.textContent, h.i18n.t('menu.musicPlaying'));
    assert.equal(h.document.getElementById('language-target').textContent, 'CS');
    button.dispatchEvent(new Event('click'));
    assert.equal(button.getAttribute('aria-pressed'), 'false');
    assert.equal(button.classList.contains('playing'), false);
    assert.equal(button.textContent, h.i18n.t('menu.music'));
});

test('asynchronní zastavení nebo chyba hudby aktualizuje skutečné tlačítko menu', async () => {
    const h = await menuHarness(), button = h.document.getElementById('btn-menu-music');
    button.dispatchEvent(new Event('click'));
    h.context.Music.isPlaying = false;
    h.context.window.dispatchEvent(new Event('musicstatechange'));
    assert.equal(button.getAttribute('aria-pressed'), 'false');
    assert.equal(button.classList.contains('playing'), false);
    assert.equal(button.textContent, h.i18n.t('menu.music'));
});

for (const language of ['cs', 'en']) {
    test(`${language}: vypnutý zvuk v nastavení vysvětluje neaktivní hudbu v menu`, async () => {
        const h = await menuHarness(language, async h => {
            h.storage.set('husitskeValky_settings', JSON.stringify({ soundEnabled: false, soundVolume: 23 }));
        });
        const button = h.document.getElementById('btn-menu-music');
        assert.equal(button.disabled, true);
        assert.equal(button.textContent, h.i18n.t('menu.musicMuted'));
        assert.equal(button.getAttribute('aria-pressed'), 'false');
        h.context.window.gameSettings.soundEnabled = true;
        h.context.window.dispatchEvent(new Event('musicstatechange'));
        assert.equal(button.disabled, false);
        assert.equal(button.textContent, h.i18n.t('menu.music'));
    });
}

test('ovládání panelů po startu i resize drží rozbalený a sbalený stav odděleně', async () => {
    const h = await createLocalizedHarness();
    const browserWindow = new EventTarget(); browserWindow.innerWidth = 753;
    h.context.window = browserWindow;
    h.context.Music = { setVolume() {}, setEnabled() {}, stop() {} };
    let initialize;
    const listen = h.document.addEventListener.bind(h.document);
    h.document.addEventListener = (type, handler, options) => {
        if (type === 'DOMContentLoaded') initialize = handler;
        else listen(type, handler, options);
    };
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/ui/main.js'), 'utf8'), h.context);
    await initialize();
    const pairs = [['unit-panel', 'toggle-left'], ['info-panel', 'toggle-right']];
    for (const width of [390, 753, 1100]) {
        browserWindow.innerWidth = width; browserWindow.dispatchEvent(new Event('resize'));
        for (const [id, toggle] of pairs) {
            const panel = h.document.getElementById(id), button = h.document.getElementById(toggle);
            assert.equal(panel.classList.contains('collapsed'), true);
            button.dispatchEvent(new Event('click'));
            assert.equal(panel.classList.contains('expanded'), true);
            assert.equal(panel.classList.contains('collapsed'), false);
            browserWindow.dispatchEvent(new Event('resize'));
            assert.equal(panel.classList.contains('expanded'), true);
            assert.equal(panel.classList.contains('collapsed'), false);
            button.dispatchEvent(new Event('click'));
            assert.equal(panel.classList.contains('expanded'), false);
            assert.equal(panel.classList.contains('collapsed'), true);
        }
    }
    browserWindow.innerWidth = 1280; browserWindow.dispatchEvent(new Event('resize'));
    for (const [id, toggle] of pairs) {
        const panel = h.document.getElementById(id), button = h.document.getElementById(toggle);
        assert.equal(panel.classList.contains('expanded'), false);
        assert.equal(panel.classList.contains('collapsed'), false);
        button.dispatchEvent(new Event('click'));
        assert.equal(panel.classList.contains('collapsed'), true);
        button.dispatchEvent(new Event('click'));
        assert.equal(panel.classList.contains('collapsed'), false);
    }
});

(async () => {
    let failures = 0;
    for (const { name, run } of tests) {
        try { await run(); console.log(`✓ ${name}`); }
        catch (error) { failures++; console.error(`✗ ${name}\n${error.stack}`); }
    }
    console.log(`\n${tests.length - failures}/${tests.length} first-experience testů.`);
    if (failures) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
