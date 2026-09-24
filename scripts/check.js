#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');

function files(directory) {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const fullPath = path.join(directory, entry.name);
        return entry.isDirectory() ? files(fullPath) : [fullPath];
    });
}
function run(args) {
    const result = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8' });
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status || 1);
}
const sources = [...files(path.join(root, 'js')), ...files(__dirname),
    path.join(root, 'bonus/vozova-hradba/game.js'), path.join(root, 'bonus/vozova-hradba/ui.js'),
    path.join(root, 'bonus/vozova-hradba/session.js'),
    path.join(root, 'validate_scenarios.js')];
for (const file of sources.filter(file => file.endsWith('.js'))) run(['--check', file]);
console.log('✓ Syntaxe JavaScriptu');
for (const script of [
    'scripts/test-core.js', 'scripts/test-battle.js', 'scripts/test-ai-assault.js', 'scripts/test-combat-strength.js', 'scripts/test-scenario-events.js',
    'scripts/test-save.js', 'scripts/test-presentation.js', 'scripts/test-tooltip.js', 'scripts/test-narrative.js', 'scripts/test-chronicle.js',
    'scripts/test-first-experience.js', 'scripts/test-music.js', 'scripts/test-touch.js', 'scripts/test-storage.js', 'scripts/test-entrypoint.js', 'scripts/test-woodcut.js', 'scripts/test-historical-context.js',
    'scripts/test-tower-defense.js', 'scripts/test-tower-defense-session.js',
    'scripts/validate-entrypoint.js', 'scripts/validate-styles.js', 'scripts/validate-locales.js', 'validate_scenarios.js'
]) run([script]);
