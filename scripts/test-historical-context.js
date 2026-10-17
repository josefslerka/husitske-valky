#!/usr/bin/env node
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const vm = require('node:vm');
const { createHarness } = require('./helpers/game-harness');
const { createLocalizedHarness } = require('./helpers/localized-harness');
const tests = [];
const test = (name, run) => tests.push({ name, run });
const revisedMaps = ['kutna_hora_1421', 'nemecky_brod_1422', 'vysehrad_1420', 'sion_1437', 'vitkov_1420'];
const mean = (points, axis) => points.reduce((sum, p) => sum + p[axis], 0) / points.length;

for (const lang of ['cs', 'en']) {
    test(`${lang}: všech 18 scénářů má zdroje, čtyři rozlišené kategorie a označené parafráze`, async () => {
        const h = await createLocalizedHarness(lang);
        const { HistoricalSources: sources, HistoricalNotesView: view, getBattleLore } = vm.runInContext('({HistoricalSources, HistoricalNotesView, getBattleLore})', h.context);
        assert.equal(Object.keys(sources.scenarios).length, 18);
        for (const id of Object.keys(h.Scenarios)) {
            const notes = h.i18n.translations[lang].history.scenarios[id];
            assert.ok(notes.documented && notes.reconstruction && notes.uncertain, id);
            assert.equal(typeof notes.tradition, 'string');
            const html = view.render(id);
            assert.match(html, /<details class="historical-notes">/);
            assert.match(html, /rel="noopener noreferrer"/);
            assert.doesNotMatch(html, /history\.scenarios\.|undefined|<script/);
            for (const sourceId of sources.scenarios[id]) {
                const source = sources.catalog[sourceId];
                assert.ok(source.title && source.kind, sourceId);
                assert.equal(new URL(source.url).protocol, 'https:');
                assert.ok(html.includes(view.escape(source.url)));
            }
            const lore = getBattleLore(id);
            assert.equal(lore.date, h.ScenarioManager.getScenario(id).date, id);
            assert.ok(lore.quotes.length > 0);
            for (const quote of lore.quotes) {
                assert.equal(quote.kind, 'paraphrase');
                assert.match(quote.source, lang === 'cs' ? /Autorské shrnutí/ : /Authored summary/);
            }
            assert.doesNotMatch(JSON.stringify(lore), /battleLore\.[a-z_]+\./);
        }
    });

    test(`${lang}: opravené briefingy, cíle a události nevracejí staré historické omyly`, async () => {
        const h = await createLocalizedHarness(lang);
        const get = id => h.ScenarioManager.getScenario(id);
        const kutna = get('kutna_hora_1421');
        assert.match(kutna.briefing.hussites, /Kaňk/);
        assert.match(kutna.briefing.hussites, lang === 'cs' ? /severozápad/ : /northwest/);
        assert.equal(kutna.victoryConditions.primary.zoneLabel, '↖ Kolín');
        const texts = id => JSON.stringify(get(id), (key, value) => ['mapLabels','terrain','forces'].includes(key) ? undefined : value);
        assert.doesNotMatch(texts('kutna_hora_1421'), /jihozápad|southwest|5:00|pět ráno/);
        assert.doesNotMatch(texts('vysehrad_1420'), /15:00|8:00|Praha je plně|Prague fully/);
        assert.doesNotMatch(texts('horice_1423'), /bez vozové hradby|without wagon fort/);
        assert.doesNotMatch(texts('domazlice_1431'), /Zajměte Domažlice|Capture Domažlice|Samotný zvuk|Mere sound/);
        assert.doesNotMatch(texts('sion_1437'), /Staroměstském náměstí|Old Town Square|zlatém řetězu|golden chain/);
        assert.match(get('oblehani_plzne_1433').date, /1433.*1434/);
        assert.match(get('sion_1437').date, /^6/);
    });
}

test('poznámky escapují HTML a odmítnou aktivní či neplatné URL; neznámá bitva nic nevymýšlí', async () => {
    const h = await createLocalizedHarness();
    const { HistoricalSources: sources, HistoricalNotesView: view } = vm.runInContext('({HistoricalSources, HistoricalNotesView})', h.context);
    sources.catalog.vitkov.title = '<img src=x onerror=alert(1)>';
    h.i18n.translations.cs.history.scenarios.vitkov_1420.documented = '<script>alert(1)</script>';
    for (const url of ['javascript:alert(1)', 'data:text/html,evil', 'https://example.com/" onmouseover="evil', 'http://example.com']) {
        sources.catalog.vitkov.url = url;
        const html = view.render('vitkov_1420');
        assert.doesNotMatch(html, /<script|<img|href=/);
        assert.match(html, /&lt;script&gt;/);
        assert.match(html, /&lt;img/);
    }
    assert.equal(view.render('unknown'), '');
    assert.equal(view.render('__proto__'), '');
    assert.equal(view.render('constructor'), '');
});

test('částečný překlad velitelů zachová sílu a složení bez chybějících klíčů', async () => {
    const h = await createLocalizedHarness();
    const { getBattleLore } = vm.runInContext('({getBattleLore})', h.context);
    const lore = getBattleLore('sion_1437');
    assert.equal(lore.enemySide.strength, 'Zemská hotovost a uherské oddíly');
    assert.ok(lore.enemySide.composition);
});

test('Sudoměř zachová terén, síly a načasování; navíc výslovně dovolí zničení polní armády', () => {
    const h = createHarness(), scenario = h.Scenarios.sudomere_1420;
    assert.equal(scenario.victoryConditions.primary.alternative?.type, 'eliminate_field_army');
    const stripText = value => Array.isArray(value) ? value.map(stripText) : value && typeof value === 'object'
        ? Object.fromEntries(Object.entries(value).filter(([key]) => !['name','date','description','message','text','title','commander','unitStatus','forceStatus'].includes(key)).map(([key,v]) => [key,stripText(v)])) : value;
    const keys = ['mapSize','terrain','forces','victoryConditions','phases','specialMechanics','defeatConditions','turnLimit'];
    const data = stripText(Object.fromEntries(keys.filter(key => scenario[key] !== undefined).map(key => [key,scenario[key]])));
    // Snapshot po výslovné alternativě výsledku; nevyžaduje dostupný Git při spuštění testů.
    assert.equal(crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex'), '3b75a2e47ad48cf09c175093868646ed74549e1e6d372231d523edf575b70b7a');
});

test('Vítkov má dvě pevné posádky, ne pohyblivé či rozpojitelné vozy', () => {
    const h = createHarness(), game = h.newGame('vitkov_1420');
    const forts = game.units.filter(unit => unit.unitClass === 'fortification');
    assert.equal(forts.length, 2);
    assert.equal(game.units.some(unit => unit.isWagon()), false);
    const renderer = vm.runInContext('WoodcutRenderer', h.context);
    for (const fort of forts) {
        assert.equal(renderer.glyphKind(fort), 'fieldwork');
        assert.equal(fort.isWagon(), false);
        assert.equal(fort.canMove(), false);
        assert.equal(fort.isRanged(), true);
        assert.equal(game.getValidMoves(fort).length, 0);
        fort.hasAttacked = true;
        assert.equal(fort.canAct(), false);
        const restored = h.Unit.deserialize(fort.serialize());
        assert.equal(restored.canMove(), false);
        assert.equal(restored.type, 'POLNI_OPEVNENI');
    }
});

test('Kutná Hora vede od města přes Kaňk na severozápad ke Kolínu', () => {
    const h = createHarness(), s = h.Scenarios.kutna_hora_1421;
    const zone = s.victoryConditions.primary.escapeZone, town = s.terrain.town, kank = s.mapLabels[1].hexes;
    assert.ok(mean(zone, 0) < mean(kank, 0) && mean(kank, 0) < mean(town, 0));
    assert.ok(mean(zone, 1) < mean(kank, 1) && mean(kank, 1) < mean(town, 1));
});

test('Brod je před Sázavou na trase od Habrů; cílové pozice patří do města', () => {
    const h = createHarness(), game = h.newGame('nemecky_brod_1422'), s = game.currentScenario;
    assert.ok(s.terrain.town.every(([,row]) => row < 12));
    for(const [col,row] of s.victoryConditions.primary.positions) assert.equal(game.hexGrid.getTerrain(col,row), 'town');
    assert.equal(game.hexGrid.getTerrain(8,12), 'road');
    assert.equal(s.specialMechanics.frozenRiver.effect, 'heavy_units_drown');
    assert.ok(s.mapLabels.some(label => label.i18nKey === 'towardJihlava'));
});

test('Vyšehrad leží u Vltavy, Botič severně a podolský bok západně od Pankráce', () => {
    const h = createHarness(), s = h.Scenarios.vysehrad_1420;
    assert.ok(mean(s.terrain.town,0) < s.victoryConditions.primary.positions[0][0]);
    assert.ok(s.terrain.slope.every(([col]) => col < 15));
    assert.ok(s.terrain.water.some(([col,row]) => col === 3 && row === 6));
    assert.ok(s.terrain.water.some(([col,row]) => col === 15 && row === 2));
    const sideAttack = s.phases.flatMap(p => p.events || []).find(e => e.id === 'nobility_dismount_effect');
    assert.ok(sideAttack.condition.area.maxCol < 18);
});

test('Sion má jádro, předhradí, tři obranné pásy a dvě palebná postavení bez automatické žízně', () => {
    const h = createHarness(), game = h.newGame('sion_1437'), s = game.currentScenario;
    assert.equal(s.specialMechanics.noWater, undefined);
    for(const col of [11,12,13]) assert.equal(game.hexGrid.getTerrain(col,5), 'trenches');
    for(const [col,row] of s.defeatConditions.alternative.positions) assert.ok(['town','road'].includes(game.hexGrid.getTerrain(col,row)));
    assert.equal(s.mapLabels.filter(label => label.i18nKey === 'siegePositions').length, 2);
    assert.equal(game.hexGrid.getTerrain(6,12), 'water');
});

test('Malešov zachoval podmíněnou paniku, nikoli tvrzení o zásahu kamennými vozy', () => {
    const h = createHarness(), e = h.Scenarios.malesov_1424.phases[2].events[3];
    assert.equal(e.type, 'panic'); assert.equal(e.level, 3); assert.equal(e.faction, 'crusaders');
    assert.equal(e.trigger, 'turn_5'); assert.equal(e.triggerBefore, 'turn_10');
    assert.equal(e.condition.minCount, 4);
    assert.deepEqual(JSON.parse(JSON.stringify(e.condition.area)), {minCol:4,maxCol:14,minRow:5,maxRow:9});
    assert.doesNotMatch(e.title + e.text, /kamen/i);
});

for (const id of revisedMaps) {
    test(`${id}: všechny oddíly jsou na souši a cíle zůstávají dosažitelné`, () => {
        const h = createHarness(), game = h.newGame(id), s = game.currentScenario;
        for (const u of game.units) assert.notEqual(game.hexGrid.getTerrain(u.col,u.row), 'water', u.type);
        const seeds = game.units.filter(u => u.faction === 'hussites' && u.canMove());
        const visited = new Set(), queue = seeds.map(u => ({col:u.col,row:u.row}));
        while(queue.length) {
            const p = queue.shift(), key = `${p.col},${p.row}`;
            if(visited.has(key)) continue;
            const hex = game.hexGrid.getHex(p.col,p.row);
            if(!hex || (hex.terrain === 'water' && !s.specialMechanics?.frozenRiver)) continue;
            visited.add(key); queue.push(...game.hexGrid.getNeighbors(p.col,p.row));
        }
        const objective = s.victoryConditions.primary;
        for (const [col,row] of objective.escapeZone || objective.positions || []) assert.ok(visited.has(`${col},${row}`), `${id}: nedosažitelný cíl ${col},${row}`);
        if(s.forces.crusaders.reinforcements) for(const u of s.forces.crusaders.reinforcements.units) assert.notEqual(game.hexGrid.getTerrain(u.col,u.row), 'water');
    });

    test(`${id}: nový save obnoví mapu, stará revize nic nepřepíše ani nezruší`, () => {
        const h = createHarness(), game = h.newGame(id);
        assert.equal(game.saveGame(), true);
        const data = h.SaveGameSystem.read().data;
        assert.equal(data.mapRevision, 2);
        const restored = h.SaveGameSystem.load(h.document.getElementById('game-canvas'), game);
        assert.equal(restored.currentScenario.mapRevision, 2);
        assert.equal(restored.hexGrid.cols, h.Scenarios[id].mapSize.width);
        for(const revision of [undefined, 1, 3]) {
            const old = {...data};
            if(revision===undefined) delete old.mapRevision; else old.mapRevision=revision;
            const raw=JSON.stringify(old); h.storage.set(h.SaveGameSystem.STORAGE_KEY,raw);
            let destroyed=false; restored.destroy=()=>{destroyed=true;};
            assert.throws(()=>h.SaveGameSystem.load(h.document.getElementById('game-canvas'),restored), /scenarioUpdated/);
            assert.equal(destroyed,false);
            assert.equal(h.storage.get(h.SaveGameSystem.STORAGE_KEY),raw);
        }
    });
}

test('starší save Sudoměře bez revize mapy zůstává podporovaný', () => {
    const h = createHarness(), game = h.newGame('sudomere_1420');
    assert.equal(game.saveGame(), true);
    const data = h.SaveGameSystem.read().data;
    delete data.mapRevision;
    for (const version of [1,2,3,4]) assert.doesNotThrow(() => h.SaveGameSystem.prepare({...data,version}));
    assert.throws(() => h.SaveGameSystem.prepare({...data,mapRevision:'1'}), /saveIncompatible/);
});

(async () => {
    let failures = 0;
    for (const {name,run} of tests) {
        try { await run(); console.log(`✓ ${name}`); }
        catch(error) { failures++; console.error(`✗ ${name}\n${error.stack}`); }
    }
    console.log(`\n${tests.length-failures}/${tests.length} historical context testů.`);
    if(failures)process.exitCode=1;
})();
