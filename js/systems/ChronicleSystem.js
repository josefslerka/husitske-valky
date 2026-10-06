// WP2b: Kronika jako nespolehlivý vypravěč.
// Ukládá DATA o bitvách (ne text) do localStorage. Text se generuje AŽ při
// zobrazení, v aktuálním jazyce, a ZÁMĚRNĚ lže: ztráty vítěze podhodnocuje,
// ztráty poraženého nadsazuje, porážky svádí na zradu/počasí/přesilu.
// "Pramenná kritika" pak ukáže skutečná čísla. Josefova source-criticism metoda
// povýšená na mechaniku.

const ChronicleSystem = {
    STORAGE_KEY: 'hussiteChronicle',

    // localStorage není důvěryhodný vstup. Neplatný řádek nesmí shodit
    // celou Kroniku; čtení původní data nepřepisuje. Přijímáme i staré zápisy.
    normalizeEntry(entry) {
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
        const count = value => Number.isSafeInteger(value) && value >= 0;
        const ts = count(entry.ts) ? entry.ts : 0;
        if (entry.type === 'actSummary') {
            const actId = Number(entry.actId);
            return [1, 2, 3, 4].includes(actId) ? { type: 'actSummary', actId, ts } : null;
        }
        if (typeof entry.scenarioId !== 'string' || !ScenarioManager.getScenarioList().some(s => s.id === entry.scenarioId)
            || !['victory', 'defeat'].includes(entry.result)) return null;
        const normalized = { scenarioId: entry.scenarioId, result: entry.result, ts, blind: entry.blind === true };
        for (const key of ['playerLosses', 'playerTotal', 'enemyLosses', 'enemyTotal', 'fled', 'turns']) {
            if (entry[key] !== undefined && !count(entry[key])) return null;
            normalized[key] = entry[key] ?? 0;
        }
        if (normalized.playerLosses > normalized.playerTotal || normalized.enemyLosses + normalized.fled > normalized.enemyTotal) return null;
        if (count(entry.playerFled) && entry.playerFled <= normalized.playerLosses) normalized.playerFled = entry.playerFled;
        const narrative = entry.narrative;
        // Budoucí/neúplný formát nezahodí statistiky a nepředstírá známý osud.
        if (narrative?.version === 1
            && [null, 'allPilgrims', 'somePilgrims', 'noPilgrims', 'fieldArmyEliminated',
                'castleCaptured', 'gateBlocked', 'bothControlled'].includes(narrative.victoryVariant)
            && [null, 'alive', 'fallen', 'escaped'].includes(narrative.unitState)) {
            normalized.narrative = { version: 1, victoryVariant: narrative.victoryVariant, unitState: narrative.unitState };
        }
        return normalized;
    },

    _readStoredEntries() {
        const raw = GameStorage.getItem(this.STORAGE_KEY);
        if (raw === null) return [];
        const entries = JSON.parse(raw);
        if (!Array.isArray(entries)) throw new Error('Chronicle: neplatný formát archivu');
        return entries;
    },

    getEntries() {
        try {
            return this._readStoredEntries().map(entry => this.normalizeEntry(entry)).filter(Boolean);
        } catch (e) {
            return [];
        }
    },

    // Zápis jednoho záznamu (data-only). Bez scenarioId (rychlá bitva) se neukládá.
    record(entry) {
        const normalized = this.normalizeEntry(entry);
        if (!normalized || normalized.type === 'actSummary') return false;
        try {
            // Přidáváme k původním řádkům, nikoli k jejich zobrazovacím kopiím.
            // Neznámá pole/budoucí otisky tak nezmizí při zapsání další partie.
            // Nečitelný celý archiv odmítneme přepsat, stejně jako vadný save.
            const entries = this._readStoredEntries();
            entries.push(normalized);
            GameStorage.setItem(this.STORAGE_KEY, JSON.stringify(entries));
            return true;
        } catch (e) {
            console.warn('Chronicle: nelze uložit', e);
            return false;
        }
    },

    // Shrnutí aktu se zapisuje jednou, až když hráč vyhraje všechny jeho bitvy.
    recordActSummary(actId) {
        if (![1, 2, 3, 4].includes(Number(actId))) return;
        try {
            const entries = this._readStoredEntries();
            if (entries.some(entry => entry?.type === 'actSummary' && Number(entry.actId) === Number(actId))) return;
            entries.push({ type: 'actSummary', actId: Number(actId), ts: Date.now() });
            GameStorage.setItem(this.STORAGE_KEY, JSON.stringify(entries));
        } catch (e) {
            console.warn('Chronicle: nelze uložit shrnutí aktu', e);
        }
    },

    clear() {
        GameStorage.removeItem(this.STORAGE_KEY);
    },

    // Kampaňové pořadí, v jedné bitvě pořadí odehraných pokusů. Nemutuje vstup.
    sortEntries(entries) {
        const order = Campaign.acts.flatMap(act => [...act.battles.map(battle => battle.id), `act:${act.id}`]);
        const rank = entry => {
            const index = order.indexOf(entry.type === 'actSummary' ? `act:${entry.actId}` : entry.scenarioId);
            return index < 0 ? order.length : index;
        };
        return entries.slice().sort((a, b) => rank(a) - rank(b) || a.ts - b.ts);
    },

    getSummary(entries) {
        const battles = entries.filter(entry => entry.type !== 'actSummary');
        return i18n.t('chronicle.summary', {
            n: battles.length,
            wins: battles.filter(entry => entry.result === 'victory').length,
            defeats: battles.filter(entry => entry.result === 'defeat').length
        });
    },

    getPersonalEpilogue(entry) {
        if (!entry.narrative) return i18n.t('chronicle.legacyEntry');
        return ScenarioEventSystem.formatDebriefing(
            ScenarioManager.getScenario(entry.scenarioId), entry.result === 'victory', entry.narrative
        ) || i18n.t('chronicle.legacyEntry');
    },

    // Lokalizované jméno bitvy ze scénáře. Odřízne prefix "Bitva u "/"Battle of ",
    // ať rámec "svedena bitva {battle}" nezní jako "svedena bitva Bitva u...".
    _battleName(scenarioId) {
        const base = (typeof ScenarioManager !== 'undefined') ? ScenarioManager.getScenario(scenarioId) : null;
        if (!base) return scenarioId;
        const loc = (typeof getLocalizedScenario === 'function') ? getLocalizedScenario(scenarioId, base) : base;
        const name = loc.name || scenarioId;
        return name.replace(/^(Bitva u |Bitva |Battle of |Battle at )/i, '');
    },

    // První (lokalizovaná) trivia z battleLore jako "podpis" kronikáře
    _signature(scenarioId) {
        let lore = (typeof getBattleLore === 'function') ? getBattleLore(scenarioId) : null;
        if (lore && typeof getLocalizedBattleLore === 'function') lore = getLocalizedBattleLore(scenarioId, lore);
        if (lore && Array.isArray(lore.trivia) && lore.trivia.length) return lore.trivia[0];
        return '';
    },

    _enemyChronicle(scenarioId) {
        let lore = (typeof getBattleLore === 'function') ? getBattleLore(scenarioId) : null;
        if (lore && typeof getLocalizedBattleLore === 'function') lore = getLocalizedBattleLore(scenarioId, lore);
        return lore?.enemyChronicle || null;
    },

    _formatEnemyChronicle(chronicle, includeCounter = false) {
        if (!chronicle?.text) return '';
        let text = `${chronicle.text} — ${chronicle.source}`;
        if (includeCounter && chronicle.counterText) {
            text += `\n\n${chronicle.counterText} — ${chronicle.counterSource}`;
        }
        return text;
    },

    getEnemyChronicleText(scenarioId, includeCounter = false) {
        return this._formatEnemyChronicle(this._enemyChronicle(scenarioId), includeCounter);
    },

    generateActSummary(entry) {
        return {
            title: i18n.t('chronicle.actSummaryTitle', { act: entry.actId }),
            text: i18n.t(`chronicle.actSummaries.${entry.actId}`)
        };
    },

    // Vygeneruje STYLIZOVANÝ (lživý) dobový text v aktuálním jazyce.
    generateText(entry) {
        const year = (String(entry.scenarioId).match(/_(\d{4})$/) || [])[1] || '';
        const battle = this._battleName(entry.scenarioId);
        const enemyChronicle = this._enemyChronicle(entry.scenarioId);

        // Při porážce přebírá kanonický hlas vítězná protistrana.
        if (entry.result !== 'victory' && enemyChronicle) {
            return this._formatEnemyChronicle(enemyChronicle, Boolean(enemyChronicle.counterText));
        }

        let body;
        if (entry.result === 'victory') {
            // Vlastní ztráty PODHODNOŤ (třetina, min 1)
            const shown = Math.max(1, Math.floor((entry.playerLosses || 0) / 3));
            const ownLosses = i18n.t('chronicle.victoryOwnLosses', { n: shown });
            // Nepřátelské NADSAĎ
            const enemyLosses = (entry.enemyTotal > 0 && (entry.enemyLosses / entry.enemyTotal) > 0.5)
                ? i18n.t('chronicle.victoryEnemyMany')
                : i18n.t('chronicle.victoryEnemySome');
            body = i18n.t('chronicle.victoryBody', { enemyLosses, ownLosses });
        } else {
            // Porážka: NIKDY nepřiznat slabost - viníka deterministicky
            const idx = (String(entry.scenarioId).length + (entry.turns || 0)) % 3;
            const excuse = i18n.t('chronicle.defeatExcuse' + idx);
            body = i18n.t('chronicle.defeatBody', { excuse });
        }

        let text = i18n.t('chronicle.frame', { year, battle, body });
        const sign = this._signature(entry.scenarioId);
        if (sign) text += ' — ' + sign + '.';
        if (entry.blind) text += ' ' + i18n.t('chronicle.blindLine');
        // Sion vždy zachová oba navzájem soupeřící prameny, i když
        // hráč vytvořil kontrafaktuální vítězství obránců.
        if (enemyChronicle?.counterText) {
            text += `\n\n${this._formatEnemyChronicle(enemyChronicle, true)}`;
        }
        return text;
    },

    // Pravda pro "Pramennou kritiku"
    truthText(entry) {
        return i18n.t(entry.playerFled === undefined ? 'chronicle.truth' : 'chronicle.truthDetailed', {
            pLoss: entry.playerLosses || 0,
            pKilled: (entry.playerLosses || 0) - (entry.playerFled || 0),
            pFled: entry.playerFled || 0,
            pTotal: entry.playerTotal || 0,
            eLoss: entry.enemyLosses || 0,
            eTotal: entry.enemyTotal || 0,
            fled: entry.fled || 0
        });
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChronicleSystem;
}
