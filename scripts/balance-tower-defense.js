#!/usr/bin/env node
// Deterministic comparisons, not an optimal player or a win-rate estimate.
const path = require('node:path');
const args = process.argv.slice(2);
const engineAt = args.indexOf('--engine');
const D = require(engineAt < 0 ? '../bonus/vozova-hradba/game.js' : path.resolve(args[engineAt + 1]));
const gun = (col, row) => ['rucnicari', col, row];
const flail = (col, row) => ['cepnici', col, row];
const cannon = (col, row) => ['houfnice', col, row];
const wagon = (col, row) => ['vuz', col, row];
const anchor = [cannon(3, 3), gun(4, 4), cannon(3, 6), gun(2, 7), flail(3, 4)];

function run(label, wave, units, { budget = 480, perks = [], gates = [] } = {}) {
    const game = new D.Game(); game.gold = budget;
    for (const [type, col, row] of units) {
        if (!game.place(col, row, type)) throw new Error(`Invalid ${label}: ${type} at ${col},${row}`);
    }
    for (const id of gates) if (!game.toggleBarricade(id)) throw new Error('Unaffordable barricade');
    for (const id of perks) {
        game.pendingChoices.push(D.CHOICES.find(choice => choice.options.includes(id)));
        if (!game.chooseTactic(id)) throw new Error('Invalid perk');
    }
    const spent = budget - game.gold;
    // Isolate this wave, with no reinvestment, early bonus, upgrades or chorale.
    game.wave = wave - 1;
    for (let previous = 1; previous < wave; previous++) game.clearedWaves.add(previous);
    game.startWave();
    let ticks = 0;
    while (game.state === 'running' && !game.pendingChoice && ticks++ < 3000) game.tick(0.04);
    if (ticks >= 3000) throw new Error('Simulation did not finish');
    return { label, wave, budget, spent, perks: perks.join('+'), gates: gates.join('+'),
        camp: game.camp, kills: game.kills, leaks: game.leaks,
        seconds: Math.round(game.time * 10) / 10,
        supportDamage: Math.round(game.metrics?.supportDamage || 0),
        slowedSeconds: Math.round(game.metrics?.slowedTime || 0) };
}

function audit() {
    const opening = [
        ['Houfnice a ručničáři', [cannon(3, 3), gun(4, 4)]],
        ['Dva střelci a cepníci', [gun(3, 3), gun(4, 4), flail(3, 4)]],
        ['Čtyři oddíly cepníků', [flail(2, 1), flail(3, 3), flail(4, 4), flail(3, 4)]],
        ['Vůz a cepníci', [wagon(2, 3), flail(3, 3)]]
    ].map(([label, units]) => run(label, 1, units, { budget: 160 }));
    const additions = [
        ['+ dva střelci', [...anchor, gun(4, 1), gun(6, 6)]],
        ['+ tři cepníci', [...anchor, flail(2, 1), flail(0, 5), flail(4, 6)]],
        ['+ vůz', [...anchor, wagon(2, 3)]]
    ];
    const reinforcements = [3, 5, 7, 8].flatMap(wave => additions.map(([label, units]) => run(label, wave, units)));
    const councils = [];
    for (const a of D.CHOICES[0].options) for (const b of D.CHOICES[1].options) for (const c of D.CHOICES[2].options) {
        for (const wave of [7, 8]) councils.push(run('Porady', wave, [...anchor, wagon(2, 3)], { perks: [a, b, c] }));
    }
    const routes = [5, 8].flatMap(wave => [
        run('Bez záseků, rezerva 50', wave, [...anchor, wagon(2, 3)], { budget: 530 }),
        run('Dva záseky za 50', wave, [...anchor, wagon(2, 3)], { budget: 530, gates: ['east', 'west'] }),
        run('Další cepníci za 40', wave, [...anchor, wagon(2, 3), flail(5, 9)], { budget: 530 })
    ]);
    return { version: D.VERSION || '8', step: 0.04, opening, reinforcements, councils, routes };
}

if (require.main === module) {
    const result = audit();
    if (args.includes('--json')) console.log(JSON.stringify(result, null, 2));
    else for (const section of ['opening', 'reinforcements', 'councils', 'routes']) console.table(result[section]);
}
module.exports = { audit };
