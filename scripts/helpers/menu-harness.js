const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createLocalizedHarness } = require('./localized-harness');

// Skutečná inicializace main.js, bez Canvasu, zvuku a prohlížečových časovačů.
async function menuHarness(language = 'cs', prepare = () => {}, options = {}) {
    const h = await createLocalizedHarness(language, options);
    h.context.CustomEvent = class extends Event {
        constructor(type, options) { super(type); this.detail = options?.detail; }
    };
    h.context.getComputedStyle = () => ({ visibility: 'visible' });
    h.context.window = Object.assign(new EventTarget(), { innerWidth: 1280 });
    h.context.Music = {
        isPlaying: false, setVolume() {}, setEnabled() {},
        stop() { this.isPlaying = false; },
        toggle() { this.isPlaying = !this.isPlaying; return this.isPlaying; }
    };
    await prepare(h);
    let initialize;
    const listen = h.document.addEventListener.bind(h.document);
    h.document.addEventListener = (type, handler, options) => {
        if (type === 'DOMContentLoaded') initialize = handler;
        else listen(type, handler, options);
    };
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../../js/ui/main.js'), 'utf8'), h.context);
    await initialize();
    return h;
}

module.exports = { menuHarness };
