#!/usr/bin/env node
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { createHarness } = require('./helpers/game-harness');
const tests = [];
const test = (name, run) => tests.push({ name, run });

// Strict Canvas recorder: catch unbalanced save/restore, invalid geometry and
// accidental random/state changes without substituting the actual renderer.
function drawingHarness(size = 40, cols = 5, rows = 4) {
    const h = createHarness(), calls = [], state = {}, stack = [];
    const methods = ['beginPath', 'closePath', 'fill', 'stroke', 'clip', 'moveTo', 'lineTo',
        'bezierCurveTo', 'quadraticCurveTo', 'arc', 'ellipse', 'fillRect', 'strokeRect',
        'translate', 'scale', 'rotate', 'setLineDash', 'strokeText', 'fillText'];
    const ctx = {};
    for (const method of methods) ctx[method] = (...args) => {
        for (const arg of args) if (typeof arg === 'number') assert.ok(Number.isFinite(arg), method);
        if (method === 'arc') assert.ok(args[2] >= 0, 'negative circle');
        if (method === 'ellipse') assert.ok(args[2] >= 0 && args[3] >= 0, 'negative ellipse');
        calls.push([method, ...args.map(arg => arg?.path || arg)]);
    };
    ctx.save = () => { stack.push({ ...state }); calls.push(['save']); };
    ctx.restore = () => { assert.ok(stack.length, 'restore without save'); Object.assign(state, stack.pop()); calls.push(['restore']); };
    ctx.measureText = text => ({ width: text.length * 8 });
    for (const prop of ['fillStyle', 'strokeStyle', 'lineWidth', 'lineCap', 'lineJoin', 'font', 'textAlign', 'textBaseline']) {
        Object.defineProperty(ctx, prop, {
            get: () => state[prop], set: value => { state[prop] = value; calls.push([prop, value]); }
        });
    }
    h.context.Path2D = class { constructor(path) { this.path = path; } };
    const grid = new h.HexGrid({ getContext: () => ctx }, cols, rows, size);
    const { WoodcutRenderer, UnitTypes } = vm.runInContext('({ WoodcutRenderer, UnitTypes })', h.context);
    // Initialization may use random; no subsequent rendering is allowed to.
    vm.runInContext('Math.random = () => { throw new Error("Random consumed by rendering"); }', h.context);
    return { ...h, WoodcutRenderer, UnitTypes, grid, ctx, calls, stack };
}

test('všech 13 terénů se kreslí stabilně v různých měřítkách bez náhody', () => {
    for (const size of [16, 24, 40, 64]) {
        const h = drawingHarness(size);
        const terrain = Object.keys(h.WoodcutRenderer.terrainColors);
        [...h.grid.hexes.values()].forEach((hex, i) => { hex.terrain = terrain[i % terrain.length]; });
        const before = JSON.stringify([...h.grid.hexes]);
        h.grid.render([]); const first = JSON.stringify(h.calls); h.calls.length = 0;
        h.grid.render([]);
        assert.equal(JSON.stringify(h.calls), first);
        assert.equal(JSON.stringify([...h.grid.hexes]), before);
        assert.equal(h.stack.length, 0);
    }
});

test('náhledy všech terénů přesně odpovídají kreslení izolovaného hexu na mapě', () => {
    const h = drawingHarness(34, 1, 1);
    h.grid.paddingLeft = 36; h.grid.paddingTop = 32;
    const canvas = { getContext: () => h.ctx };
    for (const terrain of Object.keys(h.WoodcutRenderer.terrainColors)) {
        h.grid.setTerrain(0, 0, terrain);
        const before = JSON.stringify([...h.grid.hexes]);
        h.calls.length = 0;
        h.WoodcutRenderer.drawTerrainPreview(canvas, terrain);
        const preview = JSON.stringify(h.calls);
        assert.equal(canvas.width, 144); assert.equal(canvas.height, 128);
        assert.equal(JSON.stringify([...h.grid.hexes]), before, 'náhled nesmí měnit herní mapu');
        assert.equal(h.stack.length, 0);
        h.calls.length = 0;
        h.ctx.save(); h.ctx.scale(2, 2);
        h.grid.renderer.drawTerrain();
        h.ctx.restore();
        assert.equal(JSON.stringify(h.calls), preview, terrain);
        h.calls.length = 0;
        h.WoodcutRenderer.drawTerrainPreview(canvas, terrain);
        assert.equal(JSON.stringify(h.calls), preview, 'opakované kreslení nesmí posouvat či zvětšovat motiv');
        assert.equal(h.stack.length, 0);
    }
});

test('náhled bez Canvasu nespadne a neznámý typ používá výchozí pláň', () => {
    const h = drawingHarness();
    h.WoodcutRenderer.drawTerrainPreview({ getContext: () => null }, 'forest');
    assert.equal(h.calls.length, 0);
    const canvas = { getContext: () => h.ctx };
    h.WoodcutRenderer.drawTerrainPreview(canvas, 'plains');
    const plain = JSON.stringify(h.calls);
    h.calls.length = 0;
    h.WoodcutRenderer.drawTerrainPreview(canvas, 'unknown');
    assert.equal(JSON.stringify(h.calls), plain);
});

test('všechny jednotky mají sdílený vektorový znak v mapě a v panelu', () => {
    const h = drawingHarness();
    for (const [i, type] of Object.keys(h.UnitTypes).entries()) {
        const unit = new h.Unit(type, i % 5, Math.floor(i / 5) % 4, i);
        const before = JSON.stringify(unit.serialize());
        const glyph = h.WoodcutRenderer.glyphKind(unit), icon = h.WoodcutRenderer.icon(unit);
        assert.ok(h.WoodcutRenderer.glyphs[glyph]);
        assert.ok(icon.includes(`d="${h.WoodcutRenderer.glyphs[glyph]}"`));
        assert.match(icon, /aria-hidden="true"/);
        assert.doesNotMatch(icon, /<script|onload|href|<text/);
        h.grid.render([unit]);
        assert.equal(JSON.stringify(unit.serialize()), before);
        assert.equal(h.stack.length, 0);
    }
});

test('pražské vozy, cepníci, kuše a děla neztrácejí vlastní značku', () => {
    const h = drawingHarness();
    for (const [type, kind] of Object.entries({ VOZOVA_HRADBA_PRASKY: 'wagon', CEPNICI_PRASKY: 'flail', KUSINICI_PRASKY: 'crossbow', HOUFNICE_PRASKY: 'cannon', JIZDA_PRASKY: 'horse' })) {
        assert.equal(h.WoodcutRenderer.glyphKind(new h.Unit(type, 0, 0, 1)), kind);
    }
});

test('velitelé obou stran mají jinou siluetu než pěchota, i bez barvy a po vyčerpání', () => {
    for (const size of [16, 24, 40, 64]) {
        const h = drawingHarness(size), silhouettes = [];
        for (const faction of ['hussites', 'crusaders']) {
            for (const commander of [false, true]) {
                h.calls.length = 0;
                h.grid.renderer.tokenPath(faction !== 'hussites', size * .61, commander);
                silhouettes.push(JSON.stringify(h.calls));
            }
            const unit = new h.Unit('JAN_ZIZKA', 1, 1, 1);
            unit.faction = faction;
            unit.hasMoved = unit.hasAttacked = unit.isDefending = true;
            unit.isTerrified = true;
            const before = JSON.stringify(unit.serialize());
            h.calls.length = 0; h.grid.renderer.unit(unit);
            assert.ok(h.calls.some(call => call[0] === 'fillText' && call[1] === '✓'));
            assert.ok(h.calls.some(call => call[0] === 'fillText' && call[1] === '!'));
            assert.equal(h.calls.at(-2)[0], 'fillRect', 'HP zůstává nad stavy');
            assert.equal(JSON.stringify(unit.serialize()), before);
            assert.equal(h.stack.length, 0);
        }
        assert.equal(new Set(silhouettes).size, 4);
    }
});

test('HTML korouhev sdílí obrys s mapou a velitele rozpozná podle třídy i schopnosti', () => {
    const h = drawingHarness();
    for (const faction of ['hussites', 'crusaders']) {
        const byClass = { faction, unitClass: 'commander' }, bySpecial = { faction, special: 'commander' };
        assert.equal(h.WoodcutRenderer.icon(byClass), h.WoodcutRenderer.icon(bySpecial));
        const points = h.WoodcutRenderer.commanderOutline(faction !== 'hussites');
        assert.ok(h.WoodcutRenderer.icon(byClass).includes(`M${points.map(p => p.join(',')).join('L')}Z`));
        assert.equal(h.WoodcutRenderer.isCommander({ unitClass: 'infantry' }), false);
    }
});

test('neprozkoumaný hex neprozradí barvu, motiv ani popisek skutečného terénu', () => {
    const h = drawingHarness(40, 1, 1), fog = { fogOfWar: true, exploredHexes: new Set(), visibleHexes: new Set() };
    h.grid.mapLabels = [{ text: 'TAJNÉ MÍSTO', hexes: [[0, 0]] }];
    const recordings = [];
    for (const terrain of Object.keys(h.WoodcutRenderer.terrainColors)) {
        h.grid.setTerrain(0, 0, terrain); h.calls.length = 0; h.grid.render([], fog);
        recordings.push(JSON.stringify(h.calls));
    }
    assert.equal(new Set(recordings).size, 1);
    assert.ok(!recordings[0].includes('TAJNÉ MÍSTO'));
});

test('prozkoumaný a viditelný terén jsou odlišné; objevování nic nemění v datech', () => {
    const h = drawingHarness(40, 1, 1), exploredHexes = new Set(['0,0']), visibleHexes = new Set();
    const fog = { fogOfWar: true, exploredHexes, visibleHexes };
    assert.equal(h.WoodcutRenderer.fogState('0,0', fog), 'explored');
    h.grid.render([], fog); const explored = JSON.stringify(h.calls); h.calls.length = 0;
    visibleHexes.add('0,0'); h.grid.render([], fog);
    assert.notEqual(JSON.stringify(h.calls), explored);
    assert.equal(exploredHexes.size, 1); assert.equal(visibleHexes.size, 1);
});

test('výběr, vlastní i nepřátelský dojezd, útok a únik mají různé značky i bez barvy', () => {
    const h = drawingHarness(), recordings = [];
    for (const kind of ['selected', 'move', 'enemy-move', 'attack', 'escape']) {
        h.calls.length = 0; h.grid.renderer.highlight({ col: 1, row: 1 }, kind);
        recordings.push(JSON.stringify(h.calls.filter(call => !['fillStyle', 'strokeStyle'].includes(call[0]))));
        assert.equal(h.stack.length, 0);
    }
    assert.equal(new Set(recordings).size, 5);
});

test('strany se liší tvarem a zdravotní lišta zůstává viditelná po vyčerpání', () => {
    const h = drawingHarness(), unit = new h.Unit('CEPNICI', 1, 1, 1);
    const shapes = [];
    for (const faction of ['hussites', 'crusaders']) {
        unit.faction = faction; h.calls.length = 0; h.grid.renderer.unit(unit);
        shapes.push(JSON.stringify(h.calls.filter(call => !['fillStyle', 'strokeStyle'].includes(call[0]))));
    }
    assert.notEqual(shapes[0], shapes[1]);
    unit.hasMoved = unit.hasAttacked = true; unit.isTerrified = unit.isDefending = true;
    unit.chargeBonus = true; unit.special = 'rapidFire'; unit.attackCount = 1;
    h.calls.length = 0; h.grid.renderer.unit(unit);
    for (const label of ['✓', '!', '1', '➜']) assert.ok(h.calls.some(call => call[0] === 'fillText' && call[1] === label));
    assert.equal(h.calls.at(-2)[0], 'fillRect'); // health segments drawn last, above state shading
    assert.equal(h.stack.length, 0);
});

test('hrany kreslených hexů odpovídají existujícím sousedům, nezdvojují mřížku', () => {
    const h = drawingHarness(), center = h.grid.hexToPixel(2, 1), radius = h.grid.hexSize;
    h.grid.renderer.hexPath(2, 1);
    const points = h.calls.filter(call => ['moveTo', 'lineTo'].includes(call[0])).map(call => call.slice(1));
    for (const neighbor of h.grid.getNeighbors(2, 1)) {
        const other = h.grid.hexToPixel(neighbor.col, neighbor.row);
        const midpoint = { x: (center.x + other.x) / 2, y: (center.y + other.y) / 2 };
        assert.ok(points.some((point, i) => {
            const next = points[(i + 1) % 6];
            return Math.hypot((point[0] + next[0]) / 2 - midpoint.x, (point[1] + next[1]) / 2 - midpoint.y) < radius * .001;
        }));
    }
});

test('skutečných 18 scénářů a jejich uložené jednotky lze vykreslit bez změny pravidel', () => {
    const h = drawingHarness();
    for (const scenario of Object.values(h.Scenarios)) {
        vm.runInContext('Math.random = () => 0.5', h.context);
        const game = h.newGame(scenario.id);
        vm.runInContext('Math.random = () => { throw new Error("Random consumed by rendering"); }', h.context);
        game.hexGrid.ctx = h.ctx; game.hexGrid.renderer.ctx = h.ctx;
        const before = JSON.stringify(game.units.map(unit => unit.serialize()));
        game.hexGrid.render(game.units);
        assert.equal(JSON.stringify(game.units.map(unit => unit.serialize())), before);
        assert.equal(h.stack.length, 0);
        h.calls.length = 0; game.destroy();
    }
});

test('cesta v odkrytém hexu neprozradí sousední cestu za mlhou', () => {
    const h = drawingHarness(40, 2, 1);
    const fog = { fogOfWar: true, exploredHexes: new Set(['0,0']), visibleHexes: new Set(['0,0']) };
    h.grid.setTerrain(0, 0, 'road');
    h.grid.render([], fog); const before = JSON.stringify(h.calls); h.calls.length = 0;
    h.grid.setTerrain(1, 0, 'road'); h.grid.render([], fog);
    assert.equal(JSON.stringify(h.calls), before);
});

let failures = 0;
for (const { name, run } of tests) {
    try { run(); console.log(`✓ ${name}`); }
    catch (error) { failures++; console.error(`✗ ${name}\n${error.stack}`); }
}
console.log(`\n${tests.length - failures}/${tests.length} testů dřevořezu.`);
if (failures) process.exit(1);
