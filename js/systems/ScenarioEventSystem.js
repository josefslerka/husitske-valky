// Fáze scénáře, jednorázové události a příchod posil.
// Stav zůstává v Game (currentScenario/currentPhase/processedEvents), takže save
// i lokalizace používají jediný zdroj pravdy. Systém nevlastní DOM ani časovače.
class ScenarioEventSystem {
    constructor(game) { this.game = game; }

    // Narativ je odvozené čtení stavu. Útěk (health = 0, escaped = true)
    // není smrt; chybějící jednotka ve starém savu není důkaz jejího osudu.
    getUnitState(status) {
        if (!status) return null;
        const matches = this.game.units.filter(unit => unit.type === status.type && unit.faction === status.faction);
        if (matches.length !== 1) return null;
        const unit = matches[0];
        return unit.escaped ? 'escaped' : unit.health > 0 ? 'alive' : 'fallen';
    }

    getUnitStatusText(status) {
        return status?.texts?.[this.getUnitState(status)] || '';
    }

    // Hláška může čekat ve frontě, zatímco hráč přepne jazyk. Uchováme její
    // identitu a jednou vybranou narativní variantu, ne hotový překlad.
    showScenarioEventNotification(event, fallbackTitleKey, { unitStatus = false, titleKey = null, suffixKey = null } = {}) {
        const scenarioId = this.game.currentScenario?.id;
        const unitState = unitStatus ? this.getUnitState(event.unitStatus) : null;
        const resolve = () => {
            let currentEvent = event;
            let currentPhase = null;
            if (event.id && this.game.currentScenario?.id === scenarioId) {
                for (const phase of this.game.currentScenario.phases || []) {
                    const index = (phase.events || []).findIndex((candidate, position) =>
                        (candidate.id || `phase${phase.id}_evt${position}`) === event.id);
                    if (index >= 0) {
                        currentEvent = phase.events[index];
                        currentPhase = phase;
                        break;
                    }
                }
            }
            const title = titleKey ? i18n.t(titleKey)
                : (currentEvent.title || currentPhase?.name || event.title || i18n.t(fallbackTitleKey));
            const variant = unitState ? currentEvent.unitStatus?.texts?.[unitState] : null;
            const body = variant || currentEvent.text || currentEvent.message || event.text || event.message || '';
            return { title, text: body + (suffixKey ? `\n\n${i18n.t(suffixKey)}` : '') };
        };
        const { title, text } = resolve();
        this.game.showEventNotification(title, text, resolve);
    }

    // Malý datový otisk závěru pro Kroniku. Žádný lokalizovaný text ani
    // reference na živé jednotky: pozdější partie ani jazyk osud nepřepíšou.
    captureNarrativeOutcome(isVictory) {
        const scenario = this.game.currentScenario;
        const debriefing = scenario?.debriefing;
        const outcome = { version: 1, victoryVariant: null, unitState: this.getUnitState(debriefing?.unitStatus) };
        if (!debriefing) return outcome;
        if (isVictory && scenario.id === 'zivohost_1419' && debriefing.victoryVariants) {
            const initial = scenario.forces.hussites.units.filter(unit => unit.type === 'POUTNICI').length;
            const remaining = this.game.units.filter(unit => unit.type === 'POUTNICI' && unit.faction === 'hussites' &&
                !unit.isReinforcement && unit.health > 0 && !unit.escaped).length;
            // Skupina s jediným zbývajícím HP není totéž co přežití každého člověka.
            if (initial > 0) {
                outcome.victoryVariant = remaining >= initial ? 'allPilgrims' : remaining > 0 ? 'somePilgrims' : 'noPilgrims';
            }
        }
        if (isVictory && scenario.id === 'sudomere_1420' && debriefing.victoryVariants) {
            const primary = scenario.victoryConditions?.primary;
            const playerFaction = scenario.playerFaction || 'hussites';
            const enemyFaction = playerFaction === 'hussites' ? 'crusaders' : 'hussites';
            const survivors = this.game.units.filter(unit =>
                unit.faction === playerFaction && unit.health > 0 && !unit.escaped
            ).length;
            const survivorPercent = this.game.initialPlayerUnits > 0
                ? (survivors / this.game.initialPlayerUnits) * 100 : 0;
            const enemySurvivors = this.game.units
                .filter(unit => unit.faction === enemyFaction && unit.health > 0 && !unit.escaped);
            const enemyFieldArmyEliminated = enemySurvivors.length > 0 &&
                enemySurvivors.every(unit => unit.isCommander?.());
            if (primary?.alternative?.type === 'eliminate_field_army' &&
                survivorPercent < (primary.minUnitsPercent || 0) && enemyFieldArmyEliminated) {
                outcome.victoryVariant = 'fieldArmyEliminated';
            }
        }
        if (isVictory && scenario.id === 'kutna_hora_1421' && debriefing.victoryVariants) {
            const primary = scenario.victoryConditions?.primary;
            const playerFaction = scenario.playerFaction || 'hussites';
            const enemyFaction = playerFaction === 'hussites' ? 'crusaders' : 'hussites';
            const historicalVictory = (this.game.escapedUnits || 0) >= (primary?.unitsRequired || 5);
            if (!historicalVictory &&
                this.game.victoryConditionsSystem?.fieldArmyAlternativeAchieved(primary, playerFaction, enemyFaction)) {
                outcome.victoryVariant = 'fieldArmyEliminated';
            }
        }
        return outcome;
    }

    static formatDebriefing(scenario, isVictory, outcome) {
        const debriefing = scenario?.debriefing;
        if (!debriefing) return '';
        let text = debriefing[isVictory ? 'victory' : 'defeat'] || '';
        if (isVictory && outcome?.victoryVariant) {
            text = debriefing.victoryVariants?.[outcome.victoryVariant] || text;
        }
        const statusText = ['alive', 'fallen', 'escaped'].includes(outcome?.unitState)
            ? debriefing.unitStatus?.texts?.[outcome.unitState] : '';
        return statusText ? `${text}\n\n${statusText}` : text;
    }

    getDebriefing(isVictory) {
        return ScenarioEventSystem.formatDebriefing(this.game.currentScenario, isVictory, this.captureNarrativeOutcome(isVictory));
    }

    // Aktualizace aktuální fáze
    updatePhase() {
        if (!this.game.currentScenario) {
            this.game.view.showPhase(null);
            return;
        }

        const newPhase = ScenarioManager.getCurrentPhase(this.game.currentScenario, this.game.turnNumber);

        if (newPhase && (!this.game.currentPhase || newPhase.id !== this.game.currentPhase.id)) {
            this.game.currentPhase = newPhase;

            this.game.view.showPhase(newPhase);

            // Log změny fáze
            this.game.addLog(`--- ${newPhase.name} ---`, 'turn');
        }
    }

    // Kontrola a zpracování eventů fáze
    checkPhaseEvents() {
        if (!this.game.currentScenario) return;

        const events = ScenarioManager.checkPhaseEvents(this.game.currentScenario, this.game.turnNumber, this.game);

        for (const event of events) {
            // Použít event id pro dedup (podmíněné eventy nemají fixní kolo)
            const eventKey = event.id || `${event.turn}-${event.type}`;
            if (this.game.processedEvents.has(eventKey)) continue;

            this.game.processedEvents.add(eventKey);
            this.processEvent(event);
        }

        // Kontrola posil
        this.checkReinforcements();
    }

    // Zpracování jednotlivého eventu
    processEvent(event) {
        switch (event.type) {
            case 'message':
                this.showScenarioEventNotification(event, 'messages.messageTitle', { unitStatus: true });
                break;

            case 'reinforcement':
                // Posily jsou zpracovány v checkReinforcements
                break;

            case 'terrain_change':
                if (event.changes) {
                    for (const change of event.changes) {
                        this.game.hexGrid.setTerrain(change.col, change.row, change.terrain);
                    }
                    this.game.render();
                }
                break;

            case 'morale':
                // Efekt na morálku - upravíme útok jednotek
                const moraleModifier = event.modifier || (event.amount ? -event.amount : 0);
                if (event.faction && moraleModifier) {
                    for (const unit of this.game.units) {
                        if (unit.faction === event.faction && unit.health > 0) {
                            unit.attack = Math.max(1, unit.attack + moraleModifier);
                            // Snížení morálky jednotek
                            if (unit.morale !== undefined) {
                                unit.morale = Math.max(0, unit.morale + moraleModifier * 5);
                            }
                        }
                    }
                }
                if (event.text) {
                    this.showScenarioEventNotification(event, 'messages.moraleTitle');
                }
                break;

            case 'activate_choral':
                // Automatická aktivace chorálu (např. Domažlice)
                if (!this.game.choralUsed) {
                    this.game.choralUsed = true;
                    this.game.choralActive = true;
                    this.game.choralTurnsRemaining = event.duration || 3;

                    this.game.addLog(i18n.t('gameLog.choralActivated'), 'turn');

                    this.game.view.showPhaseBanner(i18n.t('gameLog.choralName'), event.text || i18n.t('gameLog.choralEffect'));

                    this.game.updateChoralButton();

                    // WP4: psychologický šok na nepřítele (stejně jako u ručního chorálu)
                    this.game.applyChoralShock();

                    // Přehrát zvuk chorálu
                    if (typeof Music !== 'undefined' && Music.playChoral) {
                        Music.playChoral();
                    }
                }
                break;

            case 'panic':
                // Panika - snížení morálky a možný útěk jednotek
                if (event.faction) {
                    const affectedUnits = this.game.units.filter(u => u.faction === event.faction && u.health > 0);
                    const basePanicLevel = event.level || 1; // 1 = mírná, 2 = střední, 3 = těžká
                    const panicLevel = typeof CampaignProgressSystem !== 'undefined'
                        ? CampaignProgressSystem.adjustPanicLevel(
                            basePanicLevel,
                            this.game.currentScenario?.id,
                            this.game.campaignReputation
                        )
                        : basePanicLevel;

                    for (const unit of affectedUnits) {
                        // Snížení útoku kvůli panice
                        const attackPenalty = panicLevel * 5;
                        unit.attack = Math.max(1, unit.attack - attackPenalty);

                        // Těžká panika může způsobit okamžitý útěk některých jednotek
                        if (panicLevel >= 3 && Math.random() < 0.3) {
                            this.game.routingUnits.add(unit.id || `${unit.col}-${unit.row}`);
                            unit.isRouting = true;
                            this.game.addLog(i18n.t('gameLog.panicFlee', {unit: unit.name}), 'morale');
                        }
                    }

                    if (event.text) {
                        const reputationKey = typeof CampaignProgressSystem !== 'undefined'
                            && CampaignProgressSystem.affectsReputationBattle(this.game.currentScenario?.id)
                            && basePanicLevel >= 2
                            ? CampaignProgressSystem.getNarrativeKey(this.game.campaignReputation)
                            : null;
                        this.showScenarioEventNotification(event, 'messages.panicTitle', { suffixKey: reputationKey });
                    }
                    this.game.addLog(i18n.t('gameLog.enemyPanic', {penalty: panicLevel * 5}), 'morale');
                }
                break;

            case 'ai_stance':
                // Skriptovaný postoj AI (WP0): lure/retreat/hold/defensive/aggressive/default.
                // Souřadnice targetu jsou ve scénářových souřadnicích - převedeme na mapové
                // stejně jako umisťování jednotek (scenarioToMap; dnes identita, ale robustně).
                {
                    let mappedTarget = null;
                    if (event.target && typeof event.target.col === 'number') {
                        mappedTarget = this.game.hexGrid.scenarioToMap(event.target.col, event.target.row);
                    }
                    this.game.aiStance = {
                        mode: event.mode || 'default',
                        target: mappedTarget,
                        untilTurn: (typeof event.untilTurn === 'number') ? event.untilTurn : null,
                        proximity: (typeof event.proximity === 'number') ? event.proximity : 3
                    };
                    if (event.text) {
                        this.showScenarioEventNotification(event, 'messages.orderTitle');
                    }
                }
                break;

            case 'rout':
                // Hromadný útěk. U Tachova a Domažlic určí podíl prchajících
                // pověst vybudovaná v předchozích bitvách; jinde zůstává 100 %.
                if (event.faction) {
                    const routingFaction = this.game.units
                        .filter(u => u.faction === event.faction && u.health > 0)
                        .sort((a, b) => (a.morale - b.morale) || (a.health - b.health));
                    const routFraction = typeof CampaignProgressSystem !== 'undefined'
                        ? CampaignProgressSystem.getRoutFraction(
                            this.game.currentScenario?.id,
                            this.game.campaignReputation
                        )
                        : 1;
                    const routingCount = Math.max(1, Math.ceil(routingFaction.length * routFraction));
                    for (const unit of routingFaction.slice(0, routingCount)) {
                        this.game.routingUnits.add(unit.id || `${unit.col}-${unit.row}`);
                        unit.isRouting = true;
                    }
                    this.game.moraleBroken = routFraction >= 0.75;
                    if (event.text) {
                        this.showScenarioEventNotification(event, 'messages.massRoutTitle');
                    }
                    this.game.addLog(i18n.t('gameLog.armyRouting'), 'morale');
                }
                break;

            case 'trench_bonus':
                // Bonus obrany pro jednotky v zákopech
                {
                    const trenchUnits = this.game.units.filter(u =>
                        u.faction === 'hussites' && u.health > 0 &&
                        this.game.hexGrid.getTerrain(u.col, u.row) === 'trenches'
                    );
                    for (const unit of trenchUnits) {
                        unit.defense = (unit.defense || 0) + 3;
                    }
                    if (event.text) {
                        this.showScenarioEventNotification(event, 'messages.trenchesTitle');
                    }
                    this.game.addLog(i18n.t('gameLog.trenchBonus'), 'turn');
                }
                break;

            case 'dismount':
                // Jízdní jednotky na svahu ztrácí charge bonus a pohyb
                {
                    const faction = event.faction || 'crusaders';
                    const dismountedUnits = this.game.units.filter(u =>
                        u.faction === faction && u.health > 0 &&
                        u.isCavalry && u.isCavalry() &&
                        this.game.hexGrid.getTerrain(u.col, u.row) === 'slope'
                    );
                    for (const unit of dismountedUnits) {
                        unit.special = null; // Ztráta charge bonusu
                        unit.movement = Math.max(1, unit.movement - 1);
                        unit.dismounted = true;
                    }
                    if (event.text) {
                        this.showScenarioEventNotification(event, 'messages.dismountTitle');
                    }
                    if (dismountedUnits.length > 0) {
                        this.game.addLog(i18n.t('gameLog.dismountedUnits', { count: dismountedUnits.length }), 'combat');
                    }
                }
                break;

            case 'tutorial':
                // Pozůstatek tutoriálových TIPů ve scénářích - jen zobrazit text
                if (event.text) {
                    this.showScenarioEventNotification(event, 'messages.tipTitle', { titleKey: 'messages.tipTitle' });
                }
                break;

            case 'morale_boost':
            case 'morale_drop':
                // Plošná změna morálky frakce. Boost má v datech "modifier"
                // v bodech morálky (15, 20), drop má "amount" v malých
                // jednotkách (2, 3) - škálujeme ×5 jako stávající event 'morale'
                {
                    const faction = event.faction || 'crusaders';
                    const change = event.type === 'morale_boost'
                        ? (event.modifier || (event.amount || 2) * 5)
                        : -((event.amount || 2) * 5);
                    for (const unit of this.game.units) {
                        if (unit.faction === faction && unit.health > 0 && unit.morale !== undefined) {
                            unit.morale = Math.max(0, Math.min(100, unit.morale + change));
                        }
                    }
                    if (event.text) {
                        this.showScenarioEventNotification(event, 'messages.moraleTitle');
                    }
                }
                break;

            case 'cavalry_charge_blocked':
                // Jízda ztrácí bonus nárazu (vozová hradba, svah, sudlice)
                {
                    const faction = event.faction || 'crusaders';
                    let blocked = 0;
                    for (const unit of this.game.units) {
                        if (unit.faction === faction && unit.health > 0 &&
                            unit.isCavalry && unit.isCavalry() && unit.special === 'charge') {
                            unit.special = null;
                            blocked++;
                        }
                    }
                    if (event.text) {
                        this.showScenarioEventNotification(event, 'messages.cavalryStoppedTitle');
                    }
                    if (blocked > 0) {
                        this.game.addLog(i18n.t('gameLog.chargeBlocked', { count: blocked }), 'combat');
                    }
                }
                break;

            case 'wagon_bonus':
                // Bonus obrany jednotkám sousedícím s vlastním vozem
                {
                    const faction = event.faction || 'hussites';
                    let boosted = 0;
                    for (const unit of this.game.units) {
                        if (unit.faction !== faction || unit.health <= 0) continue;
                        if (unit.isWagon && unit.isWagon()) continue;
                        const nearWagon = this.game.hexGrid.getNeighbors(unit.col, unit.row).some(n => {
                            const u = this.game.getUnitAt(n.col, n.row);
                            return u && u.faction === faction && u.health > 0 && u.isWagon && u.isWagon();
                        });
                        if (nearWagon) {
                            unit.defense += 3;
                            boosted++;
                        }
                    }
                    if (event.text) {
                        this.showScenarioEventNotification(event, 'messages.wagonFortTitle');
                    }
                    if (boosted > 0) {
                        this.game.addLog(i18n.t('gameLog.wagonBonusApplied', { count: boosted }), 'turn');
                    }
                }
                break;

            case 'terrain_penalty':
                // Jízda frakce ztrácí pohyb (bažina, rozbahněné údolí)
                {
                    const faction = event.faction || 'crusaders';
                    for (const unit of this.game.units) {
                        if (unit.faction === faction && unit.health > 0 &&
                            unit.isCavalry && unit.isCavalry()) {
                            unit.movement = Math.max(1, unit.movement - 1);
                        }
                    }
                    if (event.text) {
                        this.showScenarioEventNotification(event, 'messages.terrainTitle');
                    }
                }
                break;

            case 'charge_bonus':
                // Procentní bonus k útoku frakce (např. útok z kopce)
                {
                    const faction = event.faction || 'hussites';
                    const percent = event.amount || 10;
                    for (const unit of this.game.units) {
                        if (unit.faction === faction && unit.health > 0) {
                            unit.attack = Math.round(unit.attack * (1 + percent / 100));
                        }
                    }
                    if (event.text) {
                        this.showScenarioEventNotification(event, 'messages.attackTitle');
                    }
                }
                break;

            case 'massacre':
                // Routující jednotky v oblasti dostanou těžké ztráty
                {
                    const area = event.area;
                    const massacreTargets = this.game.units.filter(u =>
                        u.faction === (event.faction || 'crusaders') &&
                        u.health > 0 &&
                        u.isRouting &&
                        (!area || (u.col >= area.minCol && u.col <= area.maxCol &&
                                   u.row >= area.minRow && u.row <= area.maxRow))
                    );
                    for (const unit of massacreTargets) {
                        const damage = Math.floor(unit.health * 0.5);
                        unit.health -= damage;
                        if (unit.health <= 0) {
                            unit.health = 0;
                            // Statistiky podle frakce hráče + jednotné efekty smrti
                            this.game.combatSystem.trackUnitDeath(unit, null);
                            this.game.handleUnitDeath(unit);
                        }
                    }
                    if (event.text) {
                        this.showScenarioEventNotification(event, 'messages.massacreTitle');
                    }
                    if (massacreTargets.length > 0) {
                        this.game.addLog(i18n.t('gameLog.massacreResult', { count: massacreTargets.length }), 'combat');
                    }
                    this.game.render();
                }
                break;

            default:
                // Neznámý typ eventu - zobraz aspoň vyprávění, ať se text
                // tiše neztratí, a upozorni do konzole
                if (event.text || event.message) {
                    this.showScenarioEventNotification(event, 'messages.eventTitle');
                }
                console.warn(`Neimplementovaný typ eventu: ${event.type}`);
                break;
        }
    }

    // Kontrola posil
    checkReinforcements() {
        if (!this.game.currentScenario) return;
        const scenario = this.game.currentScenario;
        // Oba formáty sdílejí umístění i deduplikaci; zachovat pořadí skupin a stará ID.
        for (const faction of ['hussites', 'crusaders']) {
            const reinf = scenario.forces[faction].reinforcements;
            if (reinf) this.tryReinforcementGroup(reinf, faction, `reinf-${faction}-${reinf.turn}`,
                () => this.game.currentScenario?.forces?.[faction]?.reinforcements?.message || reinf.message);
        }
        for (const [key, reinf] of Object.entries(scenario.reinforcements || {})) {
            this.tryReinforcementGroup(reinf, reinf.faction || 'crusaders', `reinf-scenario-${key}-${reinf.turn}`,
                () => this.game.currentScenario?.reinforcements?.[key]?.message || reinf.message);
        }
    }

    tryReinforcementGroup(reinf, faction, key, resolveMessage = () => reinf.message) {
        const processed = this.game.processedEvents;
        const pendingKey = `${key}:pending`;
        if (processed.has(key)) return;
        // Nestačí turn <= current: staré savy bez evidence nesmí přehrát minulé posily.
        if (reinf.turn !== this.game.turnNumber && !(reinf.turn < this.game.turnNumber && processed.has(pendingKey))) return;
        const requests = reinf.units.map(unitDef => {
            const mapped = this.game.hexGrid.scenarioToMap(unitDef.col, unitDef.row);
            return { type: unitDef.type, position: [mapped.col, mapped.row], count: 1 };
        });
        const plan = this.planReinforcements(requests);
        if (!plan) {
            if (!processed.has(pendingKey)) this.game.addLog(i18n.t('gameLog.reinforcementsWaiting'), 'turn');
            processed.add(pendingKey); // Je součástí savu v4; nevyžaduje nový formát.
            return;
        }
        processed.delete(pendingKey);
        processed.add(key);
        if (reinf.message) {
            const titleKey = faction === 'hussites' ? 'messages.reinforcementsTitle' : 'messages.enemyReinforcementsTitle';
            const resolve = () => ({ title: i18n.t(titleKey), text: resolveMessage() });
            const { title, text } = resolve();
            this.game.showEventNotification(title, text, resolve);
        }
        this.createReinforcements(plan, faction);
    }

    // Nejprve rezervovat místa celé skupině, bez změny jednotek či čítače ID.
    planReinforcements(requests) {
        const grid = this.game.hexGrid;
        const occupied = new Set(this.game.units.filter(unit => unit.health > 0).map(unit => `${unit.col},${unit.row}`));
        const plan = [];
        for (const reinf of requests) {
            const count = reinf.count ?? 1;
            if (!Object.prototype.hasOwnProperty.call(UnitTypes, reinf.type) ||
                !Array.isArray(reinf.position) || reinf.position.length !== 2 ||
                !reinf.position.every(Number.isInteger) || !grid.inBounds(...reinf.position) ||
                !Number.isSafeInteger(count) || count < 1) {
                console.error('Neplatná definice posil:', reinf);
                return null;
            }
            for (let i = 0; i < count; i++) {
                const position = this.findReinforcementPosition(reinf.position, occupied);
                if (!position) return null;
                occupied.add(`${position.col},${position.row}`);
                plan.push({ type: reinf.type, ...position });
            }
        }
        return plan;
    }

    findReinforcementPosition([col, row], occupied) {
        const grid = this.game.hexGrid;
        const queue = [{ col, row }], visited = new Set([`${col},${row}`]);
        // BFS zachová pořadí sousedů a skončí i při zcela zaplněné mapě.
        // Hledáme nejbližší místo příchodu, nikoli cestu pohybu z výchozího hexu.
        for (let index = 0; index < queue.length; index++) {
            const position = queue[index];
            if (!occupied.has(`${position.col},${position.row}`) && !grid.isImpassable(position.col, position.row)) return position;
            for (const neighbor of grid.getNeighbors(position.col, position.row)) {
                const key = `${neighbor.col},${neighbor.row}`;
                if (visited.has(key)) continue;
                visited.add(key);
                queue.push(neighbor);
            }
        }
        return null;
    }

    createReinforcements(plan, faction) {
        for (const { type, col, row } of plan) {
            const unit = this.game.unitFactory.createUnit(type, col, row);
            unit.faction = faction;
            unit.isReinforcement = true; // posily se nepočítají do přežití původní obrany
            this.game.units.push(unit);
            this.game.addLog(i18n.t('gameLog.reinforcements', {unit: unit.name}), 'turn');
        }
        this.game.updateArmyOverview();
        this.game.render();
        return plan.length;
    }

    // Přímé volání vrací počet vytvořených jednotek, nebo 0; samo nezakládá čekající skupinu.
    spawnReinforcements(reinf, faction) {
        if (!['hussites', 'crusaders'].includes(faction)) return 0;
        const plan = this.planReinforcements([reinf]);
        return plan ? this.createReinforcements(plan, faction) : 0;
    }
}
