// Shared escaped bibliography for briefing, result, chronicle and unit profiles.
const HistoricalNotesView = {
    escape(value) {
        return String(value ?? '').replace(/[&<>"']/g, char => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[char]);
    },

    bibliography(ids) {
        if (!Array.isArray(ids)) return '';
        return [...new Set(ids)].map(id => {
            const source = Object.hasOwn(HistoricalSources.catalog, id) ? HistoricalSources.catalog[id] : null;
            if (!source) return '';
            const title = this.escape(source.title);
            const link = /^https:\/\/[^\s<>"']+$/.test(source.url)
                ? `<a href="${this.escape(source.url)}" target="_blank" rel="noopener noreferrer">${title}</a>` : title;
            return `<li>${link}<span class="historical-source-kind">${this.escape(i18n.t(`history.sourceKinds.${source.kind}`))}</span></li>`;
        }).join('');
    },

    renderUnit(type) {
        const bibliography = this.bibliography(HistoricalSources.units?.[type]);
        if (!bibliography) return '';
        return `<div class="unit-reading"><h5>${this.escape(i18n.t('help.unitReading'))}</h5>
            <ul class="historical-bibliography">${bibliography}</ul></div>`;
    },

    render(scenarioId, { expanded = false } = {}) {
        const ids = HistoricalSources.scenarios[scenarioId];
        if (!Array.isArray(ids)) return '';
        const e = value => this.escape(value);
        const t = key => e(i18n.t(`history.${key}`));
        const notes = ['documented', 'reconstruction', 'tradition', 'uncertain'].map(kind => {
            const key = `history.scenarios.${scenarioId}.${kind}`;
            if (!i18n.hasTranslation(key) || !i18n.t(key)) return '';
            return `<section class="historical-note"><h4>${t(kind)}</h4><p>${e(i18n.t(key))}</p></section>`;
        }).join('');
        const bibliography = this.bibliography(ids);
        return `<details class="historical-notes"${expanded ? ' open' : ''}>
            <summary>${t('title')}</summary><p class="historical-notice">${t('scope')}</p>
            ${notes}<h4>${t('reading')}</h4><ul class="historical-bibliography">${bibliography}</ul>
            <p class="historical-notice">${t('quotationNotice')}</p>
        </details>`;
    },

    mount(element, scenarioId) {
        if (element) element.innerHTML = this.render(scenarioId);
    }
};
