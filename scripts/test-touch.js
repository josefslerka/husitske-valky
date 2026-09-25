#!/usr/bin/env node
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createHarness } = require('./helpers/game-harness');
const { createLocalizedHarness } = require('./helpers/localized-harness');
const tests = [];
const test = (name, run) => tests.push({ name, run });
const snapshot = game => JSON.stringify({ units: game.units.map(u => u.serialize()), turn: game.turnNumber,
    faction: game.currentFaction, stats: game.stats, events: [...game.processedEvents], log: game.log });

function fixture() {
    const h = createHarness({ browserView: true }), game = h.newGame();
    const player = game.unitFactory.createUnit('CEPNICI', 5, 5);
    const enemy = game.unitFactory.createUnit('HALAPARTNICI', 6, 5);
    game.units = [player, enemy]; game.hexGrid.setTerrain(5, 4, 'plains');
    game.fogOfWar = false; game.render(); game.selectUnit(player);
    return { h, game, player, enemy, orders: game.view.orders, input: game.view.mapInput };
}
function pointer(canvas, type, x, y, { id = 1, kind = 'touch' } = {}) {
    const event = new Event(type, { cancelable: true });
    Object.assign(event, { clientX: x, clientY: y, pointerId: id, pointerType: kind, button: 0 });
    canvas.dispatchEvent(event);
}
function click(canvas, x, y) {
    const event = new Event('click'); Object.assign(event, { clientX: x, clientY: y }); canvas.dispatchEvent(event);
}

test('rozhraní už nenabízí potvrzení útoku ani konce tahu', () => {
    const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
    assert.doesNotMatch(html, /id="order-confirm"|id="confirm-end-turn"/);
    for (const language of ['cs', 'en']) {
        const locale = JSON.parse(fs.readFileSync(path.join(__dirname, `../js/i18n/locales/${language}.json`), 'utf8'));
        assert.equal(locale.game.confirmEndTurnPrompt, undefined);
        assert.equal(locale.settings.confirmEndTurn, undefined);
        assert.equal(locale.touch.confirmHint, undefined);
    }
});

test('útok se provede jedním klepnutím bez potvrzovací karty a rychlý druhý tap jej nezdvojí', async () => {
    const { h, game, orders, enemy } = fixture();
    const before = enemy.health;
    orders.tap(enemy);
    assert.equal(game.actions.busy, true);
    assert.ok(enemy.health < before);
    assert.equal(orders.inspectedHex, null);
    assert.equal(orders.panel.classList.contains('hidden'), true);
    const health = enemy.health;
    orders.tap(enemy);
    await h.advance(800);
    assert.equal(enemy.health, health);
    game.destroy();
});

test('pohyb se provede rovnou klepnutím a zachová standardní undo i autosave', async () => {
    const { h, game, orders, player } = fixture();
    orders.tap({ col: 5, row: 4 });
    assert.equal(orders.inspectedHex, null);
    assert.equal(orders.panel.classList.contains('hidden'), true);
    assert.equal(player.row, 4); assert.equal(game.actions.busy, true);
    assert.equal(h.storage.has(h.SaveGameSystem.AUTO_KEY), false);
    await h.advance(800);
    assert.equal(player.row, 4); assert.equal(game.canUndo(), true);
    const savedUnit = h.SaveGameSystem.read({ automatic: true }).data.units.find(u => u.id === player.id);
    assert.equal(savedUnit.row, 4);
    game.undoLastMove(); assert.equal(player.row, 5); game.destroy();
});

test('dotyk, pero i kompaktní myš přesunou oddíl jednou a kompatibilní click jej neodznačí', async () => {
    for (const kind of ['touch', 'pen', 'mouse']) {
        const { h, game, input, player, orders } = fixture();
        h.document.getElementById('game-container').classList.add('compact-battle');
        const p = game.hexGrid.hexToPixel(5, 4);
        pointer(input.canvas, 'pointerdown', p.x, p.y, { kind });
        pointer(input.canvas, 'pointerup', p.x, p.y, { kind });
        if (kind === 'mouse') click(input.canvas, p.x, p.y);
        assert.equal(player.row, 4); assert.equal(orders.inspectedHex, null);
        await h.advance(800);
        // Opožděný syntetický click po dotyku nesmí provést druhou akci.
        if (kind !== 'mouse') click(input.canvas, p.x, p.y);
        assert.equal(game.selectedUnit, player); assert.equal(player.row, 4);
        assert.equal(game.canUndo(), true); game.destroy();
    }
});

test('během provádění přímého útoku nelze omylem vydat další pohyb', async () => {
    const { h, game, orders, player, enemy } = fixture();
    const row = player.row;
    orders.tap(enemy);
    orders.tap({ col: 5, row: 4 });
    assert.equal(player.row, row);
    await h.advance(800);
    assert.equal(player.row, row);
    assert.ok(enemy.health < enemy.maxHealth);
    game.destroy();
});

test('klepnutí na nedostupné pole nespotřebuje pohyb ani nezaloží autosave', () => {
    const { h, game, orders } = fixture();
    const before = snapshot(game);
    orders.tap({ col: 0, row: 0 });
    assert.equal(orders.inspectedHex.col, 0); assert.equal(orders.inspectedHex.row, 0);
    assert.match(h.document.getElementById('order-hint').textContent, /touch.inspectHint/);
    assert.equal(snapshot(game), before);
    assert.equal(h.storage.has(h.SaveGameSystem.AUTO_KEY), false); game.destroy();
});

test('karta neodhalí nepřítele skrytého mlhou a neprozkoumané místo nemá náhled', () => {
    const { game, enemy, orders } = fixture();
    game.fogOfWar = true; game.visibleHexes.clear(); game.exploredHexes.clear();
    orders.tap(enemy); assert.equal(orders.inspectedHex, null);
    game.exploredHexes.add(`${enemy.col},${enemy.row}`);
    orders.tap(enemy); assert.ok(orders.inspectedHex);
    assert.ok(!game.view.tooltip.contentForHex(enemy).includes(enemy.name));
    game.exploredHexes.add('0,0');
    orders.tap({ col: 0, row: 0 });
    assert.equal(orders.inspectedHex.col, 0, 'prázdné prozkoumané pole nesmí být nepřítelem');
    game.destroy();
});

test('dojezd viditelného nepřítele ukazuje jen viditelná pole a nemění stav hry', () => {
    const { game, enemy } = fixture();
    enemy.hasMoved = true;
    game.fogOfWar = true;
    game.visibleHexes.clear();
    for (const key of ['6,5', '7,5', '6,4']) game.visibleHexes.add(key);
    const before = snapshot(game);
    game.view.showEnemyMoveRange(enemy);
    assert.ok(game.hexGrid.enemyMoveHexes.length > 0);
    assert.ok(game.hexGrid.enemyMoveHexes.every(hex =>
        game.visibleHexes.has(`${hex.col},${hex.row}`)));
    assert.equal(snapshot(game), before);
    game.view.clearEnemyMoveRange();
    assert.equal(game.hexGrid.enemyMoveHexes.length, 0);
    game.visibleHexes.clear();
    game.view.showEnemyMoveRange(enemy);
    assert.equal(game.hexGrid.enemyMoveHexes.length, 0, 'skrytý nepřítel se nesmí prozradit');
    game.destroy();
});

test('dlouhé podržení nepřítele otevře jen průzkum dojezdu bez útoku', async () => {
    const { h, game, input, orders, enemy } = fixture();
    const p = game.hexGrid.hexToPixel(enemy.col, enemy.row);
    const before = snapshot(game);
    pointer(input.canvas, 'pointerdown', p.x, p.y);
    await h.advance(500);
    assert.equal(orders.inspectedHex.col, enemy.col);
    assert.ok(game.hexGrid.enemyMoveHexes.length > 0);
    pointer(input.canvas, 'pointerup', p.x, p.y);
    click(input.canvas, p.x, p.y);
    assert.equal(snapshot(game), before);
    assert.equal(h.storage.has(h.SaveGameSystem.AUTO_KEY), false);
    orders.cancel();
    assert.equal(game.hexGrid.enemyMoveHexes.length, 0);
    game.destroy();
});

test('přímý útok respektuje mlhu války a skrytý cíl nezasáhne', () => {
    const { game, orders, enemy } = fixture();
    game.fogOfWar = true; game.visibleHexes.clear();
    const health = enemy.health; orders.tap(enemy);
    assert.equal(enemy.health, health); game.destroy();
});

test('platný pohyb do neprozkoumaného místa funguje bez odhalení jeho terénu', async () => {
    const { h, game, orders, player } = fixture();
    game.fogOfWar = true; game.visibleHexes.clear(); game.exploredHexes.clear();
    const target = { col: 5, row: 4 };
    assert.equal(game.canMoveTo(player, target.col, target.row), true);
    game.view.tooltip.contentForHex = () => { throw new Error('Přesun nesmí před akcí zobrazit skrytý terén'); };
    orders.tap(target);
    assert.equal(orders.inspectedHex, null);
    assert.equal(orders.panel.classList.contains('hidden'), true);
    await h.advance(800); assert.equal(player.row, 4); game.destroy();
});

test('vyčerpaný vlastní oddíl lze prohlédnout bez rozkazu', () => {
    const { game, orders, player } = fixture();
    player.hasMoved = true; player.hasAttacked = true;
    const before = snapshot(game); orders.tap(player);
    assert.ok(orders.inspectedHex);
    assert.equal(snapshot(game), before); game.destroy();
});

test('každý nový výběr zahodí dosah předchozího oddílu', () => {
    const { game, player } = fixture();
    assert.ok(game.hexGrid.highlightedHexes.length > 0);
    assert.ok(game.hexGrid.attackableHexes.length > 0);

    player.hasMoved = true;
    game.view.showSelection(player);
    assert.equal(game.hexGrid.highlightedHexes.length, 0);
    assert.ok(game.hexGrid.attackableHexes.length > 0);

    player.hasMoved = false; player.hasAttacked = true;
    game.view.showSelection(player);
    assert.ok(game.hexGrid.highlightedHexes.length > 0);
    assert.equal(game.hexGrid.attackableHexes.length, 0);
    game.destroy();
});

test('pochod hradby se provede bez potvrzení a používá platné cíle celé linie', async () => {
    const { h, game, orders } = fixture();
    const wagon = game.unitFactory.createUnit('VOZOVA_HRADBA', 3, 3);
    wagon.formationClosed = true; wagon.marching = true; game.units.push(wagon);
    game.selectUnit(wagon);
    const target = game.getWagonMarchTargets(wagon).find(t => !game.getUnitAt(t.col, t.row));
    assert.ok(target); orders.tap(target);
    assert.equal(orders.inspectedHex, null); assert.equal(orders.panel.classList.contains('hidden'), true);
    await h.advance(1000);
    assert.equal(wagon.col, target.col); assert.equal(wagon.row, target.row); game.destroy();
});

test('dotykové klepnutí vybere jednotku jen jednou, kompatibilní click se ignoruje', () => {
    const { game, player, input } = fixture(); game.deselectUnit();
    const p = game.hexGrid.hexToPixel(player.col, player.row);
    pointer(input.canvas, 'pointerdown', p.x, p.y); pointer(input.canvas, 'pointerup', p.x, p.y);
    click(input.canvas, p.x, p.y);
    assert.equal(game.selectedUnit, player); game.destroy();
});

test('tažení myší nebo prstem nikdy nevydá herní rozkaz', () => {
    for (const kind of ['mouse', 'touch', 'pen']) {
        const { game, input } = fixture(); const before = snapshot(game);
        const p = game.hexGrid.hexToPixel(5, 4);
        pointer(input.canvas, 'pointerdown', p.x - 40, p.y, { kind });
        pointer(input.canvas, 'pointermove', p.x, p.y, { kind });
        pointer(input.canvas, 'pointerup', p.x, p.y, { kind }); click(input.canvas, p.x, p.y);
        assert.equal(snapshot(game), before); game.destroy();
    }
});

test('pinch mění přiblížení, nikoli herní stav, ani při zdvižení prstů postupně', () => {
    const { game, input } = fixture();
    const before = snapshot(game);
    pointer(input.canvas, 'pointerdown', 200, 200);
    pointer(input.canvas, 'pointerdown', 300, 200, { id: 2 });
    pointer(input.canvas, 'pointermove', 350, 200, { id: 2 });
    assert.ok(input.scale > 1);
    pointer(input.canvas, 'pointerup', 350, 200, { id: 2 });
    pointer(input.canvas, 'pointermove', 220, 220);
    pointer(input.canvas, 'pointerup', 220, 220); click(input.canvas, 220, 220);
    assert.equal(input.pointers.size, 0); assert.equal(snapshot(game), before); game.destroy();
});

for (const type of ['pointercancel', 'lostpointercapture']) {
    test(`${type} vyčistí gesto a nepustí opožděný click`, () => {
        const { game, input } = fixture(); const p = game.hexGrid.hexToPixel(5, 4);
        const before = snapshot(game);
        pointer(input.canvas, 'pointerdown', p.x, p.y);
        pointer(input.canvas, type, p.x, p.y);
        pointer(input.canvas, 'pointerup', p.x, p.y); click(input.canvas, p.x, p.y);
        assert.equal(input.pointers.size, 0); assert.equal(snapshot(game), before); game.destroy();
    });
}

test('kamera má omezený zoom a sdílený zpětný převod souřadnic', () => {
    const { game, input } = fixture();
    input.zoomTo(99); assert.equal(input.scale, 2);
    const pixel = game.hexGrid.hexToPixel(4, 4);
    const screen = input.worldToScreen(pixel.x, pixel.y);
    const result = input.screenToWorld(screen.x, screen.y);
    assert.equal(result.x, pixel.x); assert.equal(result.y, pixel.y);
    game.handleHexClick = hex => { assert.equal(hex.col, 4); assert.equal(hex.row, 4); };
    game.view.handleMapTap({ clientX: screen.x, clientY: screen.y });
    input.zoomTo(0.01); assert.equal(input.scale, 0.6); game.destroy();
});

test('zoom drží bod pod prsty, pokud jej neomezí okraj mapy', () => {
    const { game, input } = fixture();
    input.container.clientWidth = 320; input.container.clientHeight = 300;
    input.container.scrollLeft = 200; input.container.scrollTop = 150;
    input.canvas.getBoundingClientRect = () => ({ left: 8 - input.container.scrollLeft, top: 8 - input.container.scrollTop });
    const anchor = input.screenToWorld(160, 150);
    input.zoomTo(1.5, 160, 150);
    const result = input.worldToScreen(anchor.x, anchor.y);
    assert.equal(result.x, 160); assert.equal(result.y, 150); game.destroy();
});

test('myš na velkém i kompaktním okně útočí přímo', () => {
    for (const compact of [false, true]) {
        const { h, game, enemy, input } = fixture();
        h.document.getElementById('game-container').classList.toggle('compact-battle', compact);
        const p = game.hexGrid.hexToPixel(enemy.col, enemy.row);
        click(input.canvas, p.x, p.y);
        assert.ok(enemy.health < enemy.maxHealth);
        assert.equal(game.actions.busy, true);
        game.destroy();
    }
});

test('zrušená bitva odstraní i gesta a tlačítka kamery', () => {
    const { h, game, input } = fixture(); game.destroy();
    pointer(input.canvas, 'pointerdown', 100, 100);
    h.document.getElementById('map-zoom-in').dispatchEvent(new Event('click'));
    assert.equal(input.pointers.size, 0); assert.equal(input.scale, 1);
});

test('automatický checkpoint je oddělený od ručního a načte se stejným validátorem', async () => {
    const { h, game, player } = fixture(); assert.equal(game.saveGame(), true);
    const manual = h.storage.get(h.SaveGameSystem.STORAGE_KEY);
    const move = game.moveUnit(player, 5, 4); await h.advance(800); await move;
    assert.equal(h.storage.get(h.SaveGameSystem.STORAGE_KEY), manual);
    assert.ok(h.storage.get(h.SaveGameSystem.AUTO_KEY));
    const restored = h.SaveGameSystem.load(h.document.getElementById('game-canvas'), game, { automatic: true });
    assert.equal(restored.units.find(u => u.id === player.id).row, 4); restored.destroy();
});

test('rozpracovaná nebo přerušená akce nepřepíše poslední automatický checkpoint', async () => {
    const { h, game, player } = fixture(); game.saveGame({ automatic: true });
    const before = h.storage.get(h.SaveGameSystem.AUTO_KEY);
    const move = game.moveUnit(player, 5, 4);
    assert.equal(game.saveGame({ automatic: true }), false);
    assert.equal(h.storage.get(h.SaveGameSystem.AUTO_KEY), before);
    game.destroy(); await h.flush(); await move;
    assert.equal(h.storage.get(h.SaveGameSystem.AUTO_KEY), before);
});

test('chyba uvnitř akce nesmí uložit částečný stav', async () => {
    const { h, game, player } = fixture(); game.saveGame({ automatic: true });
    const before = h.storage.get(h.SaveGameSystem.AUTO_KEY);
    await assert.rejects(game.actions.run(() => { player.health--; throw new Error('interrupted'); }));
    assert.equal(h.storage.get(h.SaveGameSystem.AUTO_KEY), before); game.destroy();
});

test('plné úložiště nepoškodí starý checkpoint ani nezaplaví log', () => {
    const { h, game } = fixture(); game.saveGame({ automatic: true });
    const before = h.storage.get(h.SaveGameSystem.AUTO_KEY), logs = game.log.length;
    h.context.console = { ...console, error() {} };
    h.context.localStorage.setItem = () => { throw new Error('QuotaExceededError'); };
    assert.equal(game.saveGame({ automatic: true }), false);
    assert.equal(game.saveGame({ automatic: true }), false);
    assert.equal(h.storage.get(h.SaveGameSystem.AUTO_KEY), before);
    assert.equal(game.log.length, logs + 1); game.destroy();
});

test('chyba autosave je viditelná i bez deníku a po úspěšném zápisu zmizí', () => {
    const { h, game } = fixture();
    const write = h.context.localStorage.setItem;
    h.context.console = { ...console, error() {} };
    h.context.localStorage.setItem = () => { throw new Error('SecurityError'); };
    game.saveGame({ automatic: true });
    const status = h.document.getElementById('autosave-status');
    assert.equal(status.classList.contains('hidden'), false);
    assert.match(status.textContent, /touch.autosaveError/);
    h.context.localStorage.setItem = write; game.saveGame({ automatic: true });
    assert.equal(status.classList.contains('hidden'), true); game.destroy();
});

test('přímý útok zavře kompaktní panel, aby zůstal vidět jeho průběh', () => {
    const { h, game, orders, enemy } = fixture();
    h.document.getElementById('game-container').classList.add('compact-battle');
    const panel = h.document.getElementById('unit-panel'); panel.classList.add('expanded');
    orders.tap(enemy);
    assert.equal(panel.classList.contains('expanded'), false);
    assert.ok(enemy.health < enemy.maxHealth);
    assert.equal(orders.panel.classList.contains('hidden'), true);
    game.destroy();
});

test('konec tahu je přímý i v kompaktním režimu a ignoruje starou uloženou volbu potvrzení', () => {
    const { h, game } = fixture();
    h.document.getElementById('game-container').classList.add('compact-battle');
    h.context.window.gameSettings = { confirmEndTurn: true };
    h.context.showConfirmDialog = () => { throw new Error('Konec tahu nesmí otevírat potvrzení'); };
    let ended = 0;
    game.endTurn = () => { ended++; };
    h.document.getElementById('btn-end-turn').dispatchEvent(new Event('click'));
    assert.equal(ended, 1);
    game.destroy();
});

test('nečitelný automatický save nezruší současnou hru ani ruční save', () => {
    const { h, game } = fixture(); game.saveGame();
    const before = h.storage.get(h.SaveGameSystem.STORAGE_KEY);
    h.storage.set(h.SaveGameSystem.AUTO_KEY, '{');
    assert.throws(() => h.SaveGameSystem.load(h.document.getElementById('game-canvas'), game, { automatic: true }));
    assert.equal(game.gameState, 'playing'); assert.equal(h.storage.get(h.SaveGameSystem.STORAGE_KEY), before);
    game.destroy();
});

test('dokončená bitva uklidí jen svůj checkpoint, ne ruční nebo novější z jiné karty', () => {
    const { h, game } = fixture(); game.saveGame(); game.saveGame({ automatic: true });
    const manual = h.storage.get(h.SaveGameSystem.STORAGE_KEY), owned = game.lastAutosaveRaw;
    h.storage.set(h.SaveGameSystem.AUTO_KEY, 'newer');
    h.SaveGameSystem.finishAutomatic(owned);
    assert.equal(h.storage.get(h.SaveGameSystem.AUTO_KEY), 'newer');
    h.storage.set(h.SaveGameSystem.AUTO_KEY, owned);
    h.SaveGameSystem.finishAutomatic(owned);
    assert.equal(h.storage.has(h.SaveGameSystem.AUTO_KEY), false);
    assert.equal(h.storage.get(h.SaveGameSystem.STORAGE_KEY), manual); game.destroy();
});

test('přepnutí aplikace pozastaví rozpracovanou akci a návrat ji bezpečně dokončí', async () => {
    const { h, game, player, enemy, input } = fixture(); game.saveGame({ automatic: true });
    const before = h.storage.get(h.SaveGameSystem.AUTO_KEY);
    const move = game.combatSystem.performAttack(player, enemy);
    pointer(input.canvas, 'pointerdown', 100, 100);
    h.document.hidden = true; h.document.dispatchEvent(new Event('visibilitychange'));
    assert.equal(game.isPaused, true); assert.equal(input.pointers.size, 0);
    await h.advance(1000); assert.equal(game.actions.busy, true);
    assert.equal(h.storage.get(h.SaveGameSystem.AUTO_KEY), before);
    h.document.hidden = false; h.document.dispatchEvent(new Event('visibilitychange'));
    await h.advance(1000); await move;
    assert.equal(game.isPaused, false); assert.equal(game.actions.busy, false);
    assert.notEqual(h.storage.get(h.SaveGameSystem.AUTO_KEY), before); game.destroy();
});

test('návrat z jiné aplikace sám neodpauzuje ruční pauzu', () => {
    const { h, game } = fixture(); game.setPaused(true);
    h.document.hidden = true; h.document.dispatchEvent(new Event('visibilitychange'));
    h.document.hidden = false; h.document.dispatchEvent(new Event('visibilitychange'));
    assert.equal(game.isPaused, true); game.destroy();
});

test('dotykové texty mají úplné CS/EN překlady se shodnými parametry', async () => {
    const h = await createLocalizedHarness();
    const cs = h.i18n.translations.cs.touch, en = h.i18n.translations.en.touch;
    assert.deepEqual(Object.keys(cs).sort(), Object.keys(en).sort());
    for (const key of Object.keys(cs)) {
        assert.ok(cs[key].trim() && en[key].trim());
        assert.deepEqual(cs[key].match(/\{\w+\}/g), en[key].match(/\{\w+\}/g), key);
    }
});

test('spodní odstup měří viewport, má obecný webview fallback a v běžném browseru nezůstává', () => {
    const h = createHarness();
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/ui/main.js'), 'utf8'), h.context);
    const clearance = values => vm.runInContext(`calculateBrowserBottomClearance(${JSON.stringify(values)})`, h.context);
    assert.equal(clearance({ compact: true, innerHeight: 800, viewportHeight: 734, viewportOffsetTop: 0 }), 66);
    assert.equal(clearance({ compact: true, innerHeight: 800, viewportHeight: 800, embedded: true }), 68);
    assert.equal(clearance({ compact: true, innerHeight: 800, viewportHeight: 800, embedded: false }), 0);
    assert.equal(clearance({ compact: false, innerHeight: 800, viewportHeight: 734, embedded: true }), 0);
    assert.equal(clearance({ compact: true, standalone: true, innerHeight: 800, viewportHeight: 734, embedded: true }), 0);

    const rootStyles = new Map();
    h.document.documentElement = { style: { setProperty: (key, value) => rootStyles.set(key, value) } };
    h.context.window.innerHeight = 800;
    h.context.window.visualViewport = { height: 734, offsetTop: 0 };
    const container = h.document.getElementById('game-container');
    const measured = vm.runInContext('syncBrowserBottomClearance(document.getElementById("game-container"), true)', h.context);
    assert.equal(measured, 66);
    assert.equal(container.style['--browser-bottom-clearance'], '66px');
    assert.equal(rootStyles.get('--browser-bottom-clearance'), '66px', 'pevná notifikace také dostane bezpečný odstup');
});

test('panel cílů začíná pod kamerou a kompaktní výška počítá se spodním odstupem', () => {
    const css = fs.readFileSync(path.join(__dirname, '../styles/touch-and-layout.css'), 'utf8');
    const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
    assert.match(css, /#objectives-panel\s*\{[^}]*top:\s*76px/s);
    assert.match(css, /#objectives-panel\s*\{[^}]*right:\s*254px/s);
    assert.match(css, /max-height:\s*calc\(100dvh - 160px - var\(--browser-bottom-clearance\)\)/);
    assert.match(css, /max\(env\(safe-area-inset-bottom\), var\(--browser-bottom-clearance\)\)/);
    assert.match(css, /\.compact-interface \.event-notification\s*\{[^}]*max-height:\s*calc\(100dvh - 24px - var\(--browser-bottom-clearance, 0px\)\)/s);
    const mapStart = html.indexOf('<div id="map-container">');
    const infoStart = html.indexOf('<aside id="info-panel">', mapStart);
    const objectivesStart = html.indexOf('id="objectives-panel"', mapStart);
    assert.ok(mapStart >= 0 && infoStart > mapStart && objectivesStart > infoStart,
        'panel musí být pevný sourozenec scrollované mapy');
});

test('potvrzení destruktivní akce přesune fokus na zrušení a nepřidá druhý souběžný dialog', async () => {
    const h = createHarness();
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/ui/main.js'), 'utf8'), h.context);
    const element = id => h.document.getElementById(id);
    element('confirm-modal').classList.add('hidden'); element('btn-end-turn').focus();
    const first = h.context.showConfirmDialog('Leave battle?');
    assert.equal(h.document.activeElement, element('confirm-cancel'));
    assert.equal(await h.context.showConfirmDialog('Second prompt'), false);
    element('confirm-ok').dispatchEvent(new Event('click'));
    assert.equal(await first, true); assert.equal(h.document.activeElement, element('btn-end-turn'));
});

test('Tab zůstává v potvrzení destruktivní akce a Escape dialog bezpečně zruší', async () => {
    const h = createHarness();
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/ui/main.js'), 'utf8'), h.context);
    const element = id => h.document.getElementById(id);
    element('confirm-modal').classList.add('hidden');
    const result = h.context.showConfirmDialog('Leave battle?');
    const key = name => { const event = new Event('keydown', { cancelable: true }); Object.assign(event, { key: name }); h.document.dispatchEvent(event); };
    key('Tab'); assert.equal(h.document.activeElement, element('confirm-ok'));
    key('Tab'); assert.equal(h.document.activeElement, element('confirm-cancel'));
    key('Escape'); assert.equal(await result, false); assert.ok(element('confirm-modal').classList.contains('hidden'));
});

(async () => {
    let failures = 0;
    for (const { name, run } of tests) {
        try { await run(); console.log(`✓ ${name}`); }
        catch (error) { failures++; console.error(`✗ ${name}\n${error.stack}`); }
    }
    console.log(`\n${tests.length - failures}/${tests.length} touch testů.`);
    if (failures) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
