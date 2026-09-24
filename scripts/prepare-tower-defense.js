#!/usr/bin/env node
// Publish only the bonus. Snapshot the two shared assets so the test site's
// main game can keep its own version without changing our weapons or artwork.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const source = path.join(root, 'bonus/vozova-hradba');
const output = process.argv[2] && path.resolve(process.argv[2]);
if (!output || output === source || !output.endsWith(path.join('bonus', 'vozova-hradba'))) {
    throw new Error('Pass a separate destination ending in bonus/vozova-hradba');
}
fs.mkdirSync(path.join(output, 'shared'), { recursive: true });
const files = ['index.html', 'style.css', 'game.js', 'session.js', 'ui.js',
    'README.md', 'DESIGN-RESEARCH.md', 'BALANCE.md', 'PLAYTEST.md'];
for (const file of files) {
    let content = fs.readFileSync(path.join(source, file), 'utf8');
    if (file === 'index.html') content = content
        .replace('../../js/data/unitTypes.js', 'shared/unitTypes.js')
        .replace('../../js/ui/WoodcutRenderer.js', 'shared/WoodcutRenderer.js');
    fs.writeFileSync(path.join(output, file), content);
}
for (const file of ['js/data/unitTypes.js', 'js/ui/WoodcutRenderer.js']) {
    const destination = 'shared/' + path.basename(file);
    fs.copyFileSync(path.join(root, file), path.join(output, destination)); files.push(destination);
}
const html = fs.readFileSync(path.join(output, 'index.html'), 'utf8');
for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    const target = path.resolve(output, match[1].split('?')[0]);
    if (!target.startsWith(output + path.sep) || !fs.statSync(target).isFile()) throw new Error('Asset escapes the bonus: ' + match[1]);
}
const manifest = { version: require('../bonus/vozova-hradba/game.js').VERSION,
    files: Object.fromEntries(files.map(file => [file,
        crypto.createHash('sha256').update(fs.readFileSync(path.join(output, file))).digest('hex')])) };
fs.writeFileSync(path.join(output, 'release.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`✓ Bonus ${manifest.version}: ${files.length} files, self-contained assets at ${output}`);
