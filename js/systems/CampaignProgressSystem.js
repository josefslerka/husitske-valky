// Trvalý postup kampaně a pověst husitských vojsk.
// Ukládá pouze data; veškerý zobrazovaný text zůstává v locale JSON.

const CampaignProgressSystem = {
    STORAGE_KEY: 'hussiteCampaignProgress',
    VERSION: 1,
    DEFAULT_REPUTATION: 50,
    REPUTATION_SCENARIOS: new Set(['tachov_1427', 'domazlice_1431']),
    CRUSADE_BATTLES: new Set([
        'vitkov_1420', 'vysehrad_1420', 'zatec_1421', 'kutna_hora_1421',
        'nemecky_brod_1422', 'usti_1426', 'tachov_1427', 'domazlice_1431'
    ]),

    _emptyProgress() {
        return {
            version: this.VERSION,
            reputation: this.DEFAULT_REPUTATION,
            battles: {},
            completedActs: [],
            lipanyBreakApplied: false
        };
    },

    _storage() {
        return GameStorage;
    },

    _acts() {
        if (typeof Campaign !== 'undefined' && Array.isArray(Campaign.acts)) return Campaign.acts;
        if (globalThis.Campaign && Array.isArray(globalThis.Campaign.acts)) return globalThis.Campaign.acts;
        return [];
    },

    load() {
        const storage = this._storage();
        if (!storage) return this._emptyProgress();
        try {
            const raw = JSON.parse(storage.getItem(this.STORAGE_KEY));
            if (!raw || raw.version !== this.VERSION) return this._emptyProgress();
            const storedReputation = Number(raw.reputation);
            return {
                ...this._emptyProgress(),
                ...raw,
                reputation: Number.isFinite(storedReputation)
                    ? Math.max(0, Math.min(100, storedReputation))
                    : this.DEFAULT_REPUTATION,
                battles: raw.battles && typeof raw.battles === 'object' ? raw.battles : {},
                completedActs: Array.isArray(raw.completedActs) ? raw.completedActs : []
            };
        } catch (error) {
            console.warn('CampaignProgress: poškozený save, používám nový postup.', error);
            return this._emptyProgress();
        }
    },

    save(progress) {
        const storage = this._storage();
        if (!storage) return false;
        try {
            storage.setItem(this.STORAGE_KEY, JSON.stringify(progress));
            return true;
        } catch (error) {
            console.warn('CampaignProgress: postup nelze uložit.', error);
            return false;
        }
    },

    reset() {
        const storage = this._storage();
        if (storage) storage.removeItem(this.STORAGE_KEY);
    },

    getReputation() {
        return this.load().reputation;
    },

    getReputationTier(reputation = this.getReputation()) {
        if (reputation >= 70) return 'high';
        if (reputation < 35) return 'low';
        return 'medium';
    },

    getBattleRecord(scenarioId) {
        return this.load().battles[scenarioId] || null;
    },

    getActForBattle(scenarioId) {
        return this._acts().find(act => act.battles.some(battle => battle.id === scenarioId)) || null;
    },

    countVictories(actId, progress = this.load()) {
        const act = this._acts().find(candidate => candidate.id === Number(actId));
        if (!act) return 0;
        return act.battles.filter(battle => progress.battles[battle.id]?.result === 'victory').length;
    },

    isActCompleted(actId, progress = this.load()) {
        const act = this._acts().find(candidate => candidate.id === Number(actId));
        return Boolean(act?.battles.length && this._isActComplete(act, progress));
    },

    isActUnlocked(actId, progress = this.load()) {
        const act = this._acts().find(candidate => candidate.id === Number(actId));
        if (!act) return false;
        if (!act.unlockCondition) return true;
        return this.countVictories(act.unlockCondition.act, progress) >= act.unlockCondition.battlesRequired;
    },

    isBattleUnlocked(scenarioId, progress = this.load()) {
        const act = this.getActForBattle(scenarioId);
        if (!act) return false;
        const battle = act.battles.find(candidate => candidate.id === scenarioId);
        return Boolean(battle?.available && !battle?.locked && this.isActUnlocked(act.id, progress));
    },

    getHighestUnlockedAct(progress = this.load()) {
        return this._acts().reduce((highest, act) => this.isActUnlocked(act.id, progress) ? Math.max(highest, act.id) : highest, 1);
    },

    getNextBattle(scenarioId, progress = this.load()) {
        const order = this._acts().flatMap(act => act.battles.map(battle => battle.id));
        const index = order.indexOf(scenarioId);
        if (index < 0) return null;
        for (let i = index + 1; i < order.length; i++) {
            if (this.isBattleUnlocked(order[i], progress)) return order[i];
        }
        return null;
    },

    _resultContribution(result) {
        if (result.result !== 'victory') return -5;
        let contribution = 6;
        if (this.CRUSADE_BATTLES.has(result.scenarioId)) contribution += 2;
        if (Number.isFinite(result.lossRatio) && result.lossRatio <= 0.2) contribution += 2;
        if (result.maxTurns && result.turns <= Math.ceil(result.maxTurns * 0.7)) contribution += 1;
        return contribution;
    },

    _isActComplete(act, progress) {
        return act.battles.every(battle => progress.battles[battle.id]?.result === 'victory');
    },

    recordBattle(result) {
        if (!result?.scenarioId || !this.getActForBattle(result.scenarioId)) return null;

        const progress = this.load();
        const reputationBefore = progress.reputation;
        const previous = progress.battles[result.scenarioId] || null;
        const contribution = this._resultContribution(result);
        const previousContribution = Number.isFinite(previous?.reputationContribution)
            ? previous.reputationContribution
            : null;

        // Počítá se pouze nejlepší dosažený výsledek dané bitvy.
        // Opakovaným hraním tedy nelze pověst neomezeně farmit.
        if (previousContribution === null || contribution > previousContribution) {
            const contributionDelta = contribution - (previousContribution || 0);
            progress.reputation = Math.max(0, Math.min(100, progress.reputation + contributionDelta));
        }

        const victoryImprovesResult = result.result === 'victory' && previous?.result !== 'victory';
        progress.battles[result.scenarioId] = {
            result: victoryImprovesResult ? 'victory' : (previous?.result || result.result),
            attempts: (previous?.attempts || 0) + 1,
            bestTurns: result.result === 'victory'
                ? Math.min(previous?.bestTurns || Infinity, result.turns || Infinity)
                : (previous?.bestTurns || null),
            lowestLossRatio: result.result === 'victory'
                ? Math.min(previous?.lowestLossRatio ?? 1, result.lossRatio ?? 1)
                : (previous?.lowestLossRatio ?? null),
            reputationContribution: Math.max(previousContribution ?? -Infinity, contribution),
            lastResult: result.result,
            lastPlayed: Date.now()
        };

        // Propad patří skutečné porážce v partii, nikoli vítězné odbočce od historie.
        // Pozdější prohra nesmí znehodnotit už získané vítězství kampaně.
        if (result.scenarioId === 'lipany_1434' && result.result !== 'victory' &&
            previous?.result !== 'victory' && !progress.lipanyBreakApplied) {
            progress.reputation = Math.max(0, Math.min(35, progress.reputation - 15));
            progress.lipanyBreakApplied = true;
        }

        let actCompleted = null;
        for (const act of this._acts()) {
            if (!progress.completedActs.includes(act.id) && this._isActComplete(act, progress)) {
                progress.completedActs.push(act.id);
                actCompleted = act.id;
            }
        }

        progress.completedActs.sort((a, b) => a - b);
        this.save(progress);
        return {
            reputation: progress.reputation,
            reputationDelta: progress.reputation - reputationBefore,
            tier: this.getReputationTier(progress.reputation),
            actCompleted,
            newlyUnlockedAct: this.getHighestUnlockedAct(progress)
        };
    },

    affectsReputationBattle(scenarioId) {
        return this.REPUTATION_SCENARIOS.has(scenarioId);
    },

    getStartingMoraleModifier(scenarioId, reputation = this.getReputation()) {
        if (!this.affectsReputationBattle(scenarioId)) return 0;
        return Math.max(-15, Math.min(10, Math.round((50 - reputation) / 3)));
    },

    adjustPanicLevel(baseLevel, scenarioId, reputation = this.getReputation()) {
        if (!this.affectsReputationBattle(scenarioId)) return baseLevel;
        const modifier = reputation >= 75 ? 1 : (reputation < 35 ? -1 : 0);
        return Math.max(1, Math.min(3, baseLevel + modifier));
    },

    getRoutFraction(scenarioId, reputation = this.getReputation()) {
        if (!this.affectsReputationBattle(scenarioId)) return 1;
        if (reputation >= 75) return 1;
        if (reputation >= 50) return 0.75;
        if (reputation >= 30) return 0.55;
        return 0.4;
    },

    getChoralMoraleDamage(scenarioId, baseDamage = 8, reputation = this.getReputation()) {
        if (!this.affectsReputationBattle(scenarioId)) return baseDamage;
        return Math.max(4, Math.min(14, baseDamage + Math.round((reputation - 50) / 10)));
    },

    getNarrativeKey(reputation = this.getReputation()) {
        return `campaign.reputation.${this.getReputationTier(reputation)}Impact`;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CampaignProgressSystem;
}
