#!/usr/bin/env node
const assert = require('node:assert/strict');
const { createHarness } = require('./helpers/game-harness');
const tests = [];
const test = (name, run) => tests.push({ name, run });
const rect = (left, top, width, height) => ({ left, top, width, height, right: left + width, bottom: top + height });

// Layout double: rozměry karty reagují na maxWidth/maxHeight jako v prohlížeči.
function fixture({ width = 800, height = 600, scroll = 0, toolbar = true } = {}) {
    const h = createHarness({ browserView: true }), game = h.newGame();
    const map = h.document.getElementById('map-container');
    Object.assign(map, { clientWidth: width, clientHeight: height, clientLeft: 1, clientTop: 1,
        scrollLeft: scroll, scrollTop: scroll / 2 });
    map.getBoundingClientRect = () => rect(200, 90, width + 2, height + 2);
    const tools = h.document.getElementById('map-tools');
    tools.getBoundingClientRect = () => toolbar ? rect(201 + width - 290, 101, 280, 52) : rect(0, 0, 0, 0);
    const tooltip = game.view.tooltip, element = tooltip.tooltip;
    const content = { width: 280, height: 256 };
    const limited = (value, limit) => Math.min(value, Number.parseFloat(limit) || Infinity);
    element.getBoundingClientRect = () => rect(
        201 + (Number.parseFloat(element.style.left) || 0) - map.scrollLeft,
        91 + (Number.parseFloat(element.style.top) || 0) - map.scrollTop,
        limited(content.width, element.style.maxWidth), limited(content.height, element.style.maxHeight));
    Object.defineProperties(element, {
        scrollHeight: { get: () => content.height - 2 },
        clientHeight: { get: () => element.getBoundingClientRect().height - 2 }
    });
    return { h, game, map, tools, tooltip, element, content };
}

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
