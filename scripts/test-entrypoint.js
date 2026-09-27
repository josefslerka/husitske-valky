#!/usr/bin/env node
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { validateEntrypoint, exactFileExists } = require('./validate-entrypoint');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('index.html');
const tests = [];
const test = (name, run) => tests.push({ name, run });
const scriptTag = file => html.match(new RegExp(`<script src="${file.replaceAll('.', '\\.')}\\?v=[\\d.]+"></script>`))[0];

test('skutečný HTML vstup zahrnuje všechny skripty, hudbu, značku i překlady', () => {
    assert.deepEqual(validateEntrypoint(), { scripts: 35, assets: 41, languages: 2 });
});

test('chybějící skript nepřekryje ani jeho kopie v komentáři', () => {
    const tag = scriptTag('js/systems/ScenarioEventSystem.js');
    assert.throws(() => validateEntrypoint({ html: html.replace(tag, `<!-- ${tag} -->`) }), /Chybějící, duplicitní nebo přeházený skript/);
});

test('záměna pořadí závislostí skončí chybou', () => {
    const unit = scriptTag('js/entities/Unit.js'), factory = scriptTag('js/entities/UnitFactory.js');
    const swapped = html.replace(unit, 'SWAP_MARKER').replace(factory, unit).replace('SWAP_MARKER', factory);
    assert.throws(() => validateEntrypoint({ html: swapped }), /přeházený skript/);
});

test('duplicitní skript skončí chybou', () => {
    const tag = scriptTag('js/core/game.js');
    assert.throws(() => validateEntrypoint({ html: html.replace(tag, tag + tag) }), /duplicitní/);
});

test('neznámý JS soubor se nesmí zapomenout zapojit do vstupu', () => {
    const listed = [...html.matchAll(/<script src="([^"?]+)\?[^\"]*"/g)].map(match => match[1]);
    assert.throws(() => validateEntrypoint({ scripts: [...listed, 'js/unreferenced.js'] }), /Runtime JS soubor/);
});

test('async, defer, module a nomodule nesmí obejít načtení klasických skriptů', () => {
    const tag = scriptTag('js/core/game.js');
    for (const attribute of ['async', 'defer', 'type="module"', 'nomodule']) {
        assert.throws(() => validateEntrypoint({ html: html.replace(tag, tag.replace('<script ', `<script ${attribute} `)) }), /synchronní a klasický/);
    }
});

test('povolený Cloudflare beacon je oddělený od pořadí herních skriptů', () => {
    assert.equal(validateEntrypoint().scripts, 35);
    assert.throws(
        () => validateEntrypoint({ html: html.replace('https://static.cloudflareinsights.com/beacon.min.js', 'https://example.com/tracker.js') }),
        /Nepovolený externí skript/
    );
});

test('relativní URL mohou mít cache verzi, fragment a nezávislé vnější odkazy', () => {
    const changed = html.replace('imgs/menu-woodcut.svg', './imgs/menu-woodcut.svg?v=999#art') +
        '<a href="https://example.com/missing">externí</a><a href="mailto:test@example.com">mail</a>' +
        '<a href="#menu">kotva</a><img src="data:image/png;base64,AAAA">';
    assert.equal(validateEntrypoint({ html: changed }).assets, 41);
});

test('odkaz na odměnu vede na skutečný soubor minihry', () => {
    assert.throws(() => validateEntrypoint({ html: html.replace('bonus/vozova-hradba/index.html', 'bonus/vozova-hradba/missing.html') }),
        /chybí soubor/);
});

test('velikost písmen se kontroluje i na case-insensitive disku', () => {
    for (const file of ['Imgs/menu-woodcut.svg', 'imgs/menu-woodcut.SVG']) {
        assert.throws(() => validateEntrypoint({ html: html.replace('imgs/menu-woodcut.svg', file) }), /velikost písmen/);
    }
});

test('absolutní cesty a únik z projektu jsou odmítnuty', () => {
    for (const file of ['/imgs/menu-woodcut.svg', '../menu-woodcut.svg', '%2e%2e/menu-woodcut.svg', 'imgs\\menu-woodcut.svg', '%00.svg']) {
        assert.throws(() => validateEntrypoint({ html: html.replace('imgs/menu-woodcut.svg', file) }), /relativní uvnitř projektu/);
    }
});

for (const file of ['style.css', 'imgs/menu-woodcut.svg', 'audio/ktoz-jsu-bozi-bojovnici-u-ohne.mp3', 'js/i18n/locales/cs.json', 'js/i18n/locales/en.json']) {
    test(`chybějící asset ${file} zastaví kontrolu`, () => {
        assert.throws(() => validateEntrypoint({ exists: value => value !== file && exactFileExists(value) }), /chybí soubor/);
    });
}

test('kontrola dynamických assetů čte cestu ze zdroje hudby i překladů', () => {
    for (const [file, from, to] of [
        ['js/ui/music.js', "new Audio('audio/", "new Audio('missing-audio/"],
        ['js/i18n/i18n.js', 'js/i18n/locales/', 'missing-locales/']
    ]) {
        assert.throws(() => validateEntrypoint({ read: value => value === file ? read(value).replace(from, to) : read(value) }), /chybí soubor/);
    }
});

test('nový jazyk ve výběru potřebuje skutečný soubor překladu', () => {
    const changed = html.replace('<select id="language-select">', '<select id="language-select"><option value="de">Deutsch</option>');
    assert.throws(() => validateEntrypoint({ html: changed }), /locales\/de.json/);
});

let failures = 0;
for (const { name, run } of tests) {
    try { run(); console.log(`✓ ${name}`); }
    catch (error) { failures++; console.error(`✗ ${name}\n${error.stack}`); }
}
console.log(`\n${tests.length - failures}/${tests.length} entrypoint testů.`);
if (failures) process.exitCode = 1;
