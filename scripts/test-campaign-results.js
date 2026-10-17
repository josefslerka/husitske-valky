#!/usr/bin/env node
const assert = require('node:assert/strict');
const { createLocalizedHarness } = require('./helpers/localized-harness');
const tests = [], test = (name, run) => tests.push({ name, run });
async function fixture(reputation = 100) {
    const h = await createLocalizedHarness(), system = h.CampaignProgressSystem;
    const progress = system._emptyProgress(); progress.reputation = reputation; system.save(progress);
    const result = (outcome = 'victory', id = 'lipany_1434') => system.recordBattle({
        scenarioId: id, result: outcome, turns: 6, maxTurns: 14, lossRatio: 1 / 17 });
    return { h, system, result };
}
test('vítězné Lipany nesrazí pověst a nespustí příznak porážkového zlomu', async () => {
    for (const reputation of [0, 30, 80, 95, 100]) {
        const f = await fixture(reputation), value = f.result();
        assert.equal(value.reputation, Math.min(100, reputation + 9));
        assert.equal(value.reputationDelta, value.reputation - reputation);
        assert.equal(f.system.load().lipanyBreakApplied, false);
    }
});
test('skutečná porážka Lipan zachová jednorázový zlom a ukáže skutečný rozdíl', async () => {
    const f = await fixture(), loss = f.result('defeat');
    assert.equal(loss.reputation, 35); assert.equal(loss.reputationDelta, -65);
    assert.equal(f.system.load().lipanyBreakApplied, true);
    const repeated = f.result('defeat'); assert.equal(repeated.reputation, 35); assert.equal(repeated.reputationDelta, 0);
});
test('opakovaná prohra nevezme dosažené vítězství; opakovaná výhra nefarmí pověst', async () => {
    const f = await fixture(80), first = f.result();
    assert.equal(first.reputation, 89);
    assert.equal(f.result('defeat').reputation, 89);
    assert.equal(f.system.load().lipanyBreakApplied, false);
    assert.equal(f.result().reputationDelta, 0);
    assert.equal(f.system.getBattleRecord('lipany_1434').result, 'victory');
});
test('výhra po skutečné porážce přidá zlepšení, ale nevrací smyšlenou historickou pověst', async () => {
    const f = await fixture(); f.result('defeat'); const improved = f.result();
    assert.equal(improved.reputation, 49); assert.equal(improved.reputationDelta, 14);
    assert.equal(f.result().reputationDelta, 0);
});
test('horní a dolní hranice pověsti se projeví i ve zobrazované změně ostatních bitev', async () => {
    for (const [before, outcome, after] of [[100, 'victory', 100], [95, 'victory', 100], [0, 'defeat', 0], [3, 'defeat', 0]]) {
        const f = await fixture(before), value = f.result(outcome, 'horice_1423');
        assert.equal(value.reputation, after); assert.equal(value.reputationDelta, after - before);
    }
});
test('starý postup a zápisy se zpětně nepřepisují; nový výsledek už zlom neopakuje', async () => {
    const f = await fixture(35), old = f.system.load();
    old.lipanyBreakApplied = true;
    old.battles.lipany_1434 = { result: 'victory', reputationContribution: 9, attempts: 1, bestTurns: 6, lowestLossRatio: 1 / 17 };
    f.system.save(old); const raw = f.h.storage.get(f.system.STORAGE_KEY);
    f.system.load(); assert.equal(f.h.storage.get(f.system.STORAGE_KEY), raw);
    const value = f.result(); assert.equal(value.reputation, 35); assert.equal(value.reputationDelta, 0);
});
for (const language of ['cs', 'en']) {
    test(`${language}: skutečný konec Lipan uloží výhru i správnou pověst právě jednou`, async () => {
        const f = await fixture(); await f.h.i18n.setLanguage(language);
        const game = f.h.newGame('lipany_1434'); game.turnNumber = 6;
        game.showVictory('hussites');
        const result = game.view.result;
        assert.equal(result.isVictory, true);
        assert.equal(result.stats.campaignProgress.reputation, 100);
        assert.equal(result.stats.campaignProgress.reputationDelta, 0);
        const before = JSON.stringify(f.system.load()); game.showVictory('hussites');
        assert.equal(JSON.stringify(f.system.load()), before);
        assert.equal(f.h.ChronicleSystem.getEntries()[0].result, 'victory'); game.destroy();
    });
}
(async () => {
    let failed = 0;
    for (const { name, run } of tests) {
        try { await run(); console.log(`✓ ${name}`); }
        catch (error) { failed++; console.error(`✗ ${name}\n${error.stack}`); }
    }
    console.log(`\n${tests.length - failed}/${tests.length} testů výsledků a pověsti.`);
    process.exitCode = failed ? 1 : 0;
})();
