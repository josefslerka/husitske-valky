#!/usr/bin/env node
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createLocalizedHarness } = require('./helpers/localized-harness');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const tests = [];
const test = (name, run) => tests.push({ name, run });
const fields = ['description', 'equipment', 'origin', 'historicalNote'];
const card = (h, type) => h.document.getElementById('help-units-list').children.find(el => el.dataset.unitType === type);

for (const language of ['cs', 'en']) {
    test(`${language}: 33 revidovaných medailonků má úplné texty, základní čeština odpovídá datům`, async () => {
        const h = await createLocalizedHarness(language);
        const units = vm.runInContext('UnitTypes', h.context);
        const revised = Object.entries(h.i18n.translations.cs.units).filter(([type, unit]) => unit.lore && type !== 'POLNI_OPEVNENI');
        assert.equal(revised.length, 33);
        for (const [type, unit] of revised) {
            assert.deepEqual(JSON.parse(JSON.stringify(units[type].lore)), unit.lore, type);
            if (unit.description) {
                assert.equal(units[type].description, unit.description, `${type}: krátký český popis`);
                assert.equal(h.i18n.hasTranslation(`units.${type}.description`), true);
            }
            for (const field of fields) {
                const key = `units.${type}.lore.${field}`;
                assert.equal(h.i18n.hasTranslation(key), true, key);
                assert.ok(h.i18n.t(key).length > 10);
                assert.doesNotMatch(h.i18n.t(key), /\u00ad|dobová kronika|said one chronicler|attributed to Jan Žižka/);
            }
        }
    });

    test(`${language}: encyklopedie nevytváří falešné citace a zdroje váže na správné karty`, async () => {
        const h = await createLocalizedHarness(language);
        vm.runInContext(read('js/ui/main.js'), h.context);
        const before = vm.runInContext('JSON.stringify(UnitTypes)', h.context);
        h.context.populateHelpUnits(null);
        const { HistoricalSources: sources, HistoricalNotesView: view } = vm.runInContext('({HistoricalSources, HistoricalNotesView})', h.context);
        for (const element of h.document.getElementById('help-units-list').children) {
            if (!element.dataset.unitType) continue;
            const details = element.children[2].innerHTML;
            assert.doesNotMatch(details, /<blockquote|class="lore-quote"|undefined|units\.[A-Z_]+\.lore\./);
            if (sources.units[element.dataset.unitType]) {
                assert.ok(details.includes(h.i18n.t('help.unitReading')));
                for (const id of sources.units[element.dataset.unitType]) assert.ok(details.includes(view.escape(sources.catalog[id].url)));
            }
        }
        assert.match(card(h, 'CEPNICI').children[2].innerHTML, /class="lore-note"/);
        assert.equal(vm.runInContext('JSON.stringify(UnitTypes)', h.context), before);
    });

    test(`${language}: opravené rozpory rozlišují hru, nejistotu a doložené vztahy`, async () => {
        const h = await createLocalizedHarness(language), t = (type, field) => h.i18n.t(`units.${type}.lore.${field}`);
        assert.doesNotMatch(t('RUCNICARI', 'equipment'), /pistol/i);
        assert.doesNotMatch(t('HALAPARTNICI', 'origin'), /landsknecht/i);
        assert.match(t('HALAPARTNICI', 'historicalNote'), language === 'cs' ? /možnou rekonstrukci/ : /possible reconstruction/);
        assert.match(t('RUCNICARI', 'historicalNote'), language === 'cs' ? /nepotvrzuje/ : /does not.*establish/);
        assert.match(t('VIKTORIN_BOCEK', 'description'), language === 'cs' ? /otec/ : /father/);
        assert.match(t('HYNEK_PODEBRADY', 'historicalNote'), language === 'cs' ? /nikoli tento Hynek/ : /not this Hynek/);
        assert.match(t('DIVIS_BOREK', 'description'), language === 'cs' ? /proti sobě/ : /fought each other/);
        assert.doesNotMatch(t('JAN_ZIZKA', 'description'), /Azincourt|Agincourt|mor při|of plague/);
        const brief = type => h.i18n.t(`units.${type}.description`);
        assert.doesNotMatch(brief('HYNEK_PODEBRADY'), /Otec|Father/);
        assert.match(brief('VIKTORIN_BOCEK'), language === 'cs' ? /otec/ : /father/);
        assert.doesNotMatch(brief('BRENEK_SVIHOVSKY'), /4[ ,]?000|Nový Knín|Nového Knína/);
        assert.doesNotMatch(brief('JAN_ZIZKA'), /Nikdy neprohrál|Never lost/);
    });
}

test('nové čtení má platné odkazy, ale neoznačuje změněné herní hodnoty za historický soupis', async () => {
    const h = await createLocalizedHarness();
    const { HistoricalSources: sources, HistoricalNotesView: view, UnitTypes: units } = vm.runInContext('({HistoricalSources, HistoricalNotesView, UnitTypes})', h.context);
    assert.equal(sources.reviewed, '2026-09-11', 'datum scénářového auditu se nemění');
    assert.equal(sources.unitProfilesReviewed, '2026-10-14');
    assert.equal(Object.keys(sources.units).length, 18);
    for (const [type, ids] of Object.entries(sources.units)) {
        assert.ok(units[type]?.lore, type);
        for (const id of ids) {
            assert.ok(sources.catalog[id]?.title, id);
            assert.equal(new URL(sources.catalog[id].url).protocol, 'https:');
        }
        assert.ok(view.renderUnit(type).includes('rel="noopener noreferrer"'));
    }
    for (const type of ['unknown', '__proto__', 'constructor']) assert.equal(view.renderUnit(type), '');
});

test('popisy, poznámky a bibliografie escapují HTML a odmítají aktivní URL', async () => {
    const h = await createLocalizedHarness();
    vm.runInContext(read('js/ui/main.js'), h.context);
    const { HistoricalSources: sources, HistoricalNotesView: view } = vm.runInContext('({HistoricalSources, HistoricalNotesView})', h.context);
    for (const field of fields) h.i18n.translations.cs.units.CEPNICI.lore[field] = '<img src=x onerror=alert(1)> "test"';
    sources.catalog.warFlail.title = '<script>alert(1)</script>';
    for (const url of ['javascript:alert(1)', 'data:text/html,evil', 'http://example.com', 'https://example.com/" onmouseover="evil']) {
        sources.catalog.warFlail.url = url;
        h.context.populateHelpUnits(null);
        const html = card(h, 'CEPNICI').children[2].innerHTML;
        assert.doesNotMatch(html, /<img|<script|href=/);
        assert.match(html, /&lt;img/); assert.match(html, /&lt;script/);
        assert.ok(html.includes(view.escape(h.i18n.translations.cs.units.CEPNICI.lore.historicalNote)));
    }
});

test('přepnutí jazyka i načtení savu zachovají nové popisy, jednotky a otevřený katalog', async () => {
    const h = await createLocalizedHarness(), game = h.newGame('vitkov_1420');
    vm.runInContext(read('js/ui/main.js'), h.context);
    h.context.window.game = game;
    const modal = h.document.getElementById('help-modal');
    modal.dataset.unitScope = 'all'; modal.classList.remove('hidden');
    h.context.populateHelpUnits(null);
    const count = h.document.getElementById('help-units-list').children.length;
    const before = JSON.stringify(game.units.map(unit => unit.serialize()));
    assert.equal(game.saveGame(), true);
    const restored = h.SaveGameSystem.load(h.document.getElementById('game-canvas'), game);
    h.context.window.game = restored;
    for (const lang of ['en', 'cs']) {
        await h.i18n.setLanguage(lang);
        assert.equal(h.document.getElementById('help-units-list').children.length, count);
        const expected = vm.runInContext('HistoricalNotesView', h.context).escape(h.i18n.t('units.RUCNICARI.lore.description'));
        assert.ok(card(h, 'RUCNICARI').children[2].innerHTML.includes(expected));
        assert.equal(JSON.stringify(restored.units.map(unit => unit.serialize())), before);
    }
    restored.destroy();
});

test('redakční změny nemění žádné bojové, cenové ani taktické vlastnosti 59 typů', async () => {
    const h = await createLocalizedHarness();
    const data = JSON.parse(vm.runInContext('JSON.stringify(UnitTypes)', h.context));
    assert.equal(Object.keys(data).length, 59);
    for (const unit of Object.values(data)) { delete unit.name; delete unit.description; delete unit.lore; }
    assert.equal(crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex'),
        'c0d3807198a2169241e7e09ec9fd5d4320ea8e244c23aa56dceca79fc38b2b1c');
});

(async () => {
    let failed = 0;
    for (const { name, run } of tests) {
        try { await run(); console.log(`✓ ${name}`); }
        catch (error) { failed++; console.error(`✗ ${name}\n${error.stack}`); }
    }
    console.log(`\n${tests.length - failed}/${tests.length} redakčních a pramenných testů jednotek.`);
    process.exitCode = failed ? 1 : 0;
})();
