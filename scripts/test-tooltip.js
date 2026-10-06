#!/usr/bin/env node
const assert = require('node:assert/strict');
const { createHarness } = require('./helpers/game-harness');
const tests = [];
const test = (name, run) => tests.push({ name, run });
const rect = (left, top, width, height) => ({ left, top, width, height, right: left + width, bottom: top + height });

// Layout double: rozměry karty reagují na maxWidth/maxHeight jako v prohlížeči.
function fixture({ width = 800, height = 600, scroll = 0, toolbar = true } = {}) {
    const h = createHarness({ browserView: true });
    h.context.window = new EventTarget();
    const game = h.newGame();
    const map = h.document.getElementById('map-container');
    Object.assign(map, { clientWidth: width, clientHeight: height, clientLeft: 1, clientTop: 1,
        scrollLeft: scroll, scrollTop: scroll / 2 });
    map.getBoundingClientRect = () => rect(200, 90, width + 2, height + 2);
    const tools = h.document.getElementById('map-tools');
    tools.getBoundingClientRect = () => toolbar ? rect(201 + width - 290, 101, 280, 52) : rect(0, 0, 0, 0);
    const tooltip = game.view.tooltip, element = tooltip.tooltip;
    const panel = h.document.getElementById('info-panel');
    panel.getBoundingClientRect = () => rect(201 + width + 2, 91, 232, height);
    panel.contains = target => target === panel || target === element;
    element.contains = target => target === element;
    game.hexGrid.canvas.getBoundingClientRect = () => rect(201 - map.scrollLeft, 91 - map.scrollTop,
        game.hexGrid.canvas.width * game.view.mapInput.scale, game.hexGrid.canvas.height * game.view.mapInput.scale);
    const content = { width: 280, height: 256 };
    const limited = (value, limit) => Math.min(value, Number.parseFloat(limit) || Infinity);
    element.getBoundingClientRect = () => tooltip.isDocked() ? rect(215 + width, 143, 208, height - 64) : rect(
        201 + (Number.parseFloat(element.style.left) || 0) - map.scrollLeft,
        91 + (Number.parseFloat(element.style.top) || 0) - map.scrollTop,
        limited(content.width, element.style.maxWidth), limited(content.height, element.style.maxHeight));
    Object.defineProperties(element, {
        scrollHeight: { get: () => content.height - 2 },
        clientHeight: { get: () => element.getBoundingClientRect().height - 2 }
    });
    return { h, game, map, tools, tooltip, element, content, panel };
}

function setPreview(f, hexes, col = 5, row = 3) {
    const unit = f.game.unitFactory.createUnit('TEZKY_RYTIR', col, row);
    unit.faction = 'crusaders';
    f.game.units.push(unit);
    f.game.view.previewedEnemyUnit = unit;
    f.game.hexGrid.setEnemyMove(hexes);
    return unit;
}

const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

test('tooltip nechá všechny hexy dojezdu a nepřítele volné při zoomu i posunu', () => {
    for (const scale of [0.6, 1, 2]) for (const scroll of [0, 230]) {
        const f = fixture({ width: 1000, height: 700, scroll });
        f.game.view.mapInput.scale = scale;
        const unit = setPreview(f, [{ col: 4, row: 3 }, { col: 5, row: 4 }, { col: 6, row: 3 }]);
        const world = f.game.hexGrid.hexToPixel(unit.col, unit.row);
        const mouse = f.game.view.mapInput.worldToScreen(world.x, world.y);
        f.tooltip.positionTooltip(mouse.x, mouse.y);
        const box = f.element.getBoundingClientRect();
        assert.equal(f.tooltip.isDocked(), false);
        for (const protectedRect of f.tooltip.enemyPreviewRects()) assert.equal(overlaps(box, protectedRect), false);
        assert.ok(box.left >= 209 && box.right <= 1193);
        assert.ok(box.top >= 161 && box.bottom <= 783);
        f.game.destroy();
    }
});

test('karta může využít mezeru uvnitř nepravidelného dojezdu', () => {
    const f = fixture();
    const protectedRects = [rect(0, 0, 100, 300), rect(400, 0, 100, 300)];
    const position = f.tooltip.findClearPlacement({ left: 80, top: 40, width: 200, height: 180 },
        { left: 0, top: 0, right: 500, bottom: 300 }, protectedRects);
    assert.equal(position.left, 100);
    assert.equal(position.top, 40);
    f.game.destroy();
});

test('velký dojezd a dlouhá karta přejdou do panelu bez změny výběru či rozkazů', () => {
    for (const height of [320, 640]) for (const collapsed of [false, true]) {
        const f = fixture({ width: 440, height, scroll: 140 });
        f.content.height = 900; // Dlouhé lokalizované schopnosti, aura a odhad souboje.
        f.panel.classList.toggle('collapsed', collapsed);
        const selected = f.game.units.find(u => u.faction === 'hussites');
        f.game.selectedUnit = selected;
        f.game.view.showSelection(selected);
        const highlights = JSON.stringify(f.game.hexGrid.highlightedHexes);
        const attacks = JSON.stringify(f.game.hexGrid.attackableHexes);
        const unit = setPreview(f, [...f.game.hexGrid.hexes.values()]);
        const state = JSON.stringify(f.game.units.map(u => u.serialize()));
        const world = f.game.hexGrid.hexToPixel(unit.col, unit.row);
        const mouse = f.game.view.mapInput.worldToScreen(world.x, world.y);
        f.tooltip.showTooltip({ col: unit.col, row: unit.row }, mouse.x, mouse.y);
        assert.equal(f.tooltip.isDocked(), true);
        assert.equal(f.element.parentNode, f.panel);
        assert.equal(f.panel.classList.contains('enemy-inspection'), true);
        assert.equal(f.panel.classList.contains('collapsed'), collapsed);
        assert.equal(f.element.classList.contains('tooltip-scrollable'), true);
        assert.equal(f.game.selectedUnit, selected);
        assert.equal(JSON.stringify(f.game.hexGrid.highlightedHexes), highlights);
        assert.equal(JSON.stringify(f.game.hexGrid.attackableHexes), attacks);
        assert.equal(JSON.stringify(f.game.units.map(u => u.serialize())), state);
        f.tooltip.hideTooltip();
        assert.equal(f.element.parentNode, f.map);
        assert.equal(f.panel.classList.contains('enemy-inspection'), false);
        assert.equal(f.panel.classList.contains('collapsed'), collapsed);
        assert.equal(f.game.hexGrid.enemyMoveHexes.length, 0);
        f.game.destroy();
    }
});

test('hover nejprve připraví dojezd, až potom umístí kartu', () => {
    const f = fixture({ width: 440, height: 400 });
    const unit = f.game.units.find(u => u.faction === 'crusaders');
    f.game.hexGrid.pixelToHex = () => ({ col: unit.col, row: unit.row });
    const show = f.tooltip.showTooltip.bind(f.tooltip);
    let checked = false;
    f.tooltip.showTooltip = (...args) => {
        assert.equal(f.game.view.previewedEnemyUnit, unit);
        assert.ok(f.game.hexGrid.enemyMoveHexes.length > 0);
        checked = true;
        show(...args);
    };
    f.tooltip.handleMouseMove({ clientX: 500, clientY: 350 });
    assert.equal(checked, true);
    f.game.destroy();
});

test('boční inspekce vydrží přechod přes prázdný hex ke kartě, pak se bezpečně zavře', () => {
    const f = fixture({ width: 440, height: 400 });
    setPreview(f, [...f.game.hexGrid.hexes.values()]);
    f.tooltip.positionTooltip(500, 350);
    f.game.hexGrid.pixelToHex = () => ({ col: 0, row: 0 });
    f.game.getUnitAt = () => null;
    f.tooltip.handleMouseMove({ clientX: 250, clientY: 200 });
    assert.equal(f.tooltip.isDocked(), true);
    const enter = new Event('mouseleave');
    Object.assign(enter, { relatedTarget: f.panel });
    f.game.hexGrid.canvas.dispatchEvent(enter);
    assert.equal(f.tooltip.isDocked(), true);
    f.panel.dispatchEvent(new Event('mouseleave'));
    assert.equal(f.tooltip.isDocked(), false);
    assert.equal(f.element.classList.contains('hidden'), true);
    f.game.destroy();
});

test('Esc, jazyk, resize, posun, konec tahu a zrušení náhledu nezanechají starý detail v panelu', () => {
    for (const action of ['escape', 'pausedEscape', 'language', 'resize', 'scroll', 'turn', 'clear', 'toggle', 'destroy']) {
        const f = fixture({ width: 440, height: 400 });
        setPreview(f, [...f.game.hexGrid.hexes.values()]);
        f.tooltip.positionTooltip(500, 350);
        assert.equal(f.tooltip.isDocked(), true);
        if (action === 'escape' || action === 'pausedEscape') {
            if (action === 'pausedEscape') f.game.isPaused = true;
            const event = new Event('keydown', { cancelable: true }); Object.assign(event, { key: 'Escape' });
            f.h.document.dispatchEvent(event);
            assert.equal(event.defaultPrevented, action === 'escape');
        } else if (action === 'language') f.h.document.dispatchEvent(new Event('languageChanged'));
        else if (action === 'resize') f.h.context.window.dispatchEvent(new Event('resize'));
        else if (action === 'scroll') f.map.dispatchEvent(new Event('scroll'));
        else if (action === 'turn') { f.game.currentFaction = 'crusaders'; f.game.view.updateUI(); }
        else if (action === 'clear') f.game.view.clearEnemyMoveRange();
        else if (action === 'toggle') f.h.document.getElementById('toggle-right').dispatchEvent(new Event('click'));
        else f.game.destroy();
        assert.equal(f.tooltip.isDocked(), false, action);
        assert.equal(f.panel.classList.contains('enemy-inspection'), false, action);
        assert.equal(f.element.classList.contains('hidden'), true, action);
        assert.equal(f.game.hexGrid.enemyMoveHexes.length, 0, action);
        if (action !== 'destroy') f.game.destroy();
    }
});

test('skrytý nepřítel neposkytne geometrické podklady ani boční detail', () => {
    const f = fixture();
    setPreview(f, [...f.game.hexGrid.hexes.values()]);
    f.game.fogOfWarSystem.isEnemyVisible = () => false;
    assert.equal(f.tooltip.enemyPreviewRects().length, 0);
    f.tooltip.positionTooltip(500, 350);
    assert.equal(f.tooltip.isDocked(), false);
    f.game.destroy();
});

test('tooltip se vejde u všech okrajů i po posunu mapy a pod ovládáním kamery', () => {
    for (const width of [440, 800]) for (const height of [400, 600]) for (const scroll of [0, 530]) {
        const f = fixture({ width, height, scroll });
        for (const x of [210, 201 + width / 2, 201 + width - 5]) {
            for (const y of [100, 91 + height / 2, 91 + height - 5]) {
                f.tooltip.positionTooltip(x, y);
                const box = f.element.getBoundingClientRect();
                assert.ok(box.left >= 209 && box.right <= 201 + width - 8, JSON.stringify(box));
                assert.ok(box.top >= 161 && box.bottom <= 91 + height - 8, JSON.stringify(box));
                assert.equal(box.width, 280);
            }
        }
        f.game.destroy();
    }
});

test('skryté ovládání nerezervuje místo nad kartou', () => {
    const f = fixture({ toolbar: false, height: 500 });
    f.tooltip.positionTooltip(800, 400);
    assert.equal(f.element.getBoundingClientRect().top, 124);
    f.game.destroy();
});

test('úzká mapa a dlouhý obsah dostanou čitelnou kartu s vlastním posuvem', () => {
    const f = fixture({ width: 250, height: 360 });
    f.content.height = 900;
    f.tooltip.positionTooltip(430, 300);
    const box = f.element.getBoundingClientRect();
    assert.equal(box.width, 234);
    assert.equal(box.top, 161);
    assert.equal(box.bottom, 443);
    assert.equal(f.element.classList.contains('tooltip-scrollable'), true);
    f.content.height = 150;
    f.tooltip.positionTooltip(430, 300);
    assert.equal(f.element.classList.contains('tooltip-scrollable'), false);
    f.game.destroy();
});

test('přechod do dlouhé karty ji nezavře, odchod z ní ano', () => {
    const f = fixture();
    const child = f.h.document.createElement('span');
    f.element.contains = target => target === f.element || target === child;
    for (const relatedTarget of [f.element, child]) {
        f.element.classList.remove('hidden');
        const event = new Event('mouseleave');
        Object.assign(event, { relatedTarget });
        f.game.hexGrid.canvas.dispatchEvent(event);
        assert.equal(f.element.classList.contains('hidden'), false);
    }
    f.element.dispatchEvent(new Event('mouseleave'));
    assert.equal(f.element.classList.contains('hidden'), true);
    f.element.classList.remove('hidden');
    f.game.hexGrid.canvas.dispatchEvent(new Event('mouseleave'));
    assert.equal(f.element.classList.contains('hidden'), true);
    f.game.destroy();
});

test('kolečko v kartě nezvětšuje mapu, nativní posun zůstává povolený', () => {
    const f = fixture();
    const wheel = new Event('wheel', { cancelable: true });
    let stopped = false;
    wheel.stopPropagation = () => { stopped = true; };
    f.element.dispatchEvent(wheel);
    assert.equal(stopped, true);
    assert.equal(wheel.defaultPrevented, false);
    f.game.destroy();
});

test('posun mapy uklidí starý tooltip včetně zapamatovaného hexu', () => {
    const f = fixture();
    f.element.classList.remove('hidden');
    f.tooltip.lastHoveredHex = { col: 1, row: 2 };
    f.map.dispatchEvent(new Event('scroll'));
    assert.equal(f.element.classList.contains('hidden'), true);
    assert.equal(f.tooltip.lastHoveredHex, null);
    f.game.destroy();
});

test('nový obsah začíná nahoře, dotykový náhled si ponechá plné informace', () => {
    const f = fixture();
    const unit = f.game.units[0], hex = { col: unit.col, row: unit.row };
    f.element.scrollTop = 80;
    f.tooltip.showTooltip(hex, 600, 300);
    assert.equal(f.element.scrollTop, 0);
    assert.equal(f.element.innerHTML, f.tooltip.contentForHex(hex));
    assert.match(f.element.innerHTML, /tooltip-stats/);
    assert.match(f.element.innerHTML, /tooltip-morale/);
    assert.match(f.element.innerHTML, /tooltip-terrain/);
    f.game.destroy();
});

test('viditelný střelec ukazuje skutečnou připravenost reakční palby', () => {
    const f = fixture();
    const shooter = f.game.unitFactory.createUnit('KUSNICI', 6, 6);
    shooter.faction = 'crusaders';
    f.game.units.push(shooter);
    assert.equal(f.game.isCoverFireReady(shooter), true);
    assert.match(f.tooltip.contentForHex({ col: 6, row: 6 }), /game\.coverFireDetails\.ready/);
    f.game.view.updateUnitPanel(shooter);
    assert.equal(f.h.document.getElementById('unit-cover-fire').dataset.state, 'ready');

    shooter.defend();
    assert.equal(f.game.isCoverFireReady(shooter), false);
    assert.match(f.tooltip.contentForHex({ col: 6, row: 6 }), /game\.coverFireDetails\.defending/);
    f.game.view.updateUnitPanel(shooter);
    assert.equal(f.h.document.getElementById('unit-cover-fire').dataset.state, 'defending');
    f.game.destroy();
});

test('zničená bitva odpojí i události tooltipu', () => {
    const f = fixture();
    f.game.destroy();
    f.element.classList.remove('hidden');
    f.map.dispatchEvent(new Event('scroll'));
    f.element.dispatchEvent(new Event('mouseleave'));
    f.game.hexGrid.canvas.dispatchEvent(new Event('mouseleave'));
    assert.equal(f.element.classList.contains('hidden'), false);
    let stopped = false;
    const wheel = new Event('wheel');
    wheel.stopPropagation = () => { stopped = true; };
    f.element.dispatchEvent(wheel);
    assert.equal(stopped, false);
});

let failures = 0;
for (const { name, run } of tests) {
    try { run(); console.log(`✓ ${name}`); }
    catch (error) { failures++; console.error(`✗ ${name}\n${error.stack}`); }
}
console.log(`\n${tests.length - failures}/${tests.length} tooltip testů.`);
if (failures) process.exitCode = 1;
