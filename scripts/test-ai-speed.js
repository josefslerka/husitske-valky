#!/usr/bin/env node
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createLocalizedHarness } = require('./helpers/localized-harness');
const tests = [], test = (name, run) => tests.push({ name, run });
const state = game => JSON.stringify({ units: game.units.map(u => u.serialize()), turn: game.turnNumber,
    faction: game.currentFaction, events: [...game.processedEvents], stats: game.stats, choral: game.choralUsed });
async function fixture(language = 'cs') {
    const h = await createLocalizedHarness(language, { browserView: true }), game = h.newGame('nekmir_1419');
    const indicator = h.document.getElementById('ai-thinking');
    const text = h.document.createElement('span'), speed = h.document.createElement('span');
    indicator.querySelector = selector => ({ '.ai-thinking-text': text, '.ai-thinking-speed': speed })[selector] || null;
    return { h, game, indicator, speed, menu: h.document.getElementById('btn-ai-speed') };
}
for (const language of ['cs', 'en']) {
    test(`${language}: indikátor AI přepíná oběma směry a ukazuje aktuální režim i další volbu`, async () => {
        const f = await fixture(language), { game, h, indicator, speed } = f;
        game.currentFaction = 'crusaders'; game.showAIThinking(true); const before = state(game);
        for (const fast of [true, false, true, false]) {
            indicator.dispatchEvent(new Event('click'));
            assert.equal(game.fastForwardAI, fast); assert.equal(indicator.getAttribute('aria-pressed'), String(fast));
            assert.equal(indicator.classList.contains('skipping'), fast);
            assert.ok(speed.textContent.includes(h.i18n.t(fast ? 'game.aiSpeedSlowDown' : 'game.aiSpeedSpeedUp')));
            assert.ok(f.menu.textContent.includes(h.i18n.t(fast ? 'game.aiSpeedFast' : 'game.aiSpeedNormal')));
            assert.equal(state(game), before);
        }
        game.destroy();
    });
}
test('rychlost lze vrátit mezi tahy přes menu; autosave zaznamená obě volby', async () => {
    const f = await fixture(), before = state(f.game);
    for (const fast of [true, false]) {
        f.menu.dispatchEvent(new Event('click')); assert.equal(f.game.fastForwardAI, fast);
        assert.equal(f.h.SaveGameSystem.read({ automatic: true }).data.fastForwardAI, fast);
        assert.equal(state(f.game), before);
    }
    f.game.destroy();
});
test('přepnutí při rozpracované akci nezruší čekání ani nezdvojí provedení', async () => {
    const f = await fixture(); f.game.currentFaction = 'crusaders'; let completed = 0;
    const action = f.game.actions.run(async () => { if (await f.game.actions.wait(500)) completed++; return true; });
    const pending = f.game.actions.waits.size, before = state(f.game);
    f.indicator.dispatchEvent(new Event('click')); f.indicator.dispatchEvent(new Event('click'));
    assert.equal(f.game.actions.waits.size, pending); assert.equal(f.game.actions.busy, true);
    assert.equal(state(f.game), before); await f.h.advance(500);
    assert.equal(await action, true); assert.equal(completed, 1); f.game.destroy();
});
test('změna jazyka obnoví menu i aktivní indikátor, nikoli režim či rozkazy', async () => {
    const f = await fixture(); f.h.context.window.game = f.game;
    f.game.currentFaction = 'crusaders'; f.game.toggleAISpeed(); f.game.showAIThinking(true);
    const before = state(f.game);
    for (const language of ['en', 'cs']) {
        await f.h.i18n.setLanguage(language);
        assert.equal(f.game.fastForwardAI, true); assert.equal(f.indicator.getAttribute('aria-pressed'), 'true');
        assert.ok(f.speed.textContent.includes(f.h.i18n.t('game.aiSpeedFast')));
        assert.ok(f.menu.textContent.includes(f.h.i18n.t('game.aiSpeedFast')));
        assert.equal(state(f.game), before);
    }
    f.game.destroy();
});
test('save/load zachová rychlý i normální režim a synchronizuje ovládání', async () => {
    for (const fast of [true, false]) {
        const f = await fixture(); f.game.fastForwardAI = fast; assert.equal(f.game.saveGame(), true);
        const restored = f.h.SaveGameSystem.load(f.h.document.getElementById('game-canvas'), f.game);
        assert.equal(restored.fastForwardAI, fast);
        assert.equal(f.menu.getAttribute('aria-pressed'), String(fast));
        assert.equal(f.indicator.getAttribute('aria-pressed'), String(fast)); restored.destroy();
    }
});
test('nová bitva začíná normálně; pauza a skončená hra přepnutí odmítnou', async () => {
    const f = await fixture(); f.game.setPaused(true);
    assert.equal(f.game.toggleAISpeed(), false); assert.equal(f.game.fastForwardAI, false);
    f.game.setPaused(false); f.game.toggleAISpeed();
    f.game.initGameWithScenario(structuredClone(f.h.Scenarios.nekmir_1419));
    assert.equal(f.game.fastForwardAI, false);
    f.game.toggleAISpeed(); f.game.initGame(); assert.equal(f.game.fastForwardAI, false);
    f.game.destroy(); assert.equal(f.game.toggleAISpeed(), false);
});
test('normální režim obnoví původní tempo a zrychlení nemění rozhodnutí AI', async () => {
    const f = await fixture(), enemy = f.game.units.find(u => u.faction === 'crusaders');
    const before = state(f.game), decision = JSON.stringify(f.h.AI.decideAction(f.game, enemy));
    const delay = f.h.AI.getActionDelay(f.game, { type: 'move' }, 20);
    f.game.toggleAISpeed(); assert.equal(f.h.AI.getActionDelay(f.game, { type: 'move' }, 20), 40);
    assert.equal(JSON.stringify(f.h.AI.decideAction(f.game, enemy)), decision);
    f.game.toggleAISpeed(); assert.equal(f.h.AI.getActionDelay(f.game, { type: 'move' }, 20), delay);
    assert.equal(state(f.game), before); f.game.destroy();
});
test('obě ovládání jsou nativní tlačítka a CSS dovolí zalomení indikátoru', () => {
    const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
    for (const id of ['ai-thinking', 'btn-ai-speed']) assert.match(html, new RegExp(`<button[^>]*id="${id}"[^>]*type="button"[^>]*aria-pressed="false"`));
    assert.doesNotMatch(html, /data-i18n="game.skipAiTurn"/);
    const css = fs.readFileSync(path.join(__dirname, '../styles/feedback.css'), 'utf8');
    assert.match(css, /max-width: calc\(100vw - 24px\)/); assert.match(css, /flex-wrap: wrap/);
});
(async () => {
    let failed = 0;
    for (const { name, run } of tests) {
        try { await run(); console.log(`✓ ${name}`); }
        catch (error) { failed++; console.error(`✗ ${name}\n${error.stack}`); }
    }
    console.log(`\n${tests.length - failed}/${tests.length} testů vratné rychlosti AI.`);
    process.exitCode = failed ? 1 : 0;
})();
