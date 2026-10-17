// HTML panelů bitvy. Výpočty bojových pravidel poskytuje Game/Unit.
class BattlePanels {
    constructor(game) {
        this.game = game;
        // HTML panelu se sdílí mezi bitvami; nová hra nesmí ukazovat
        // připravenost střelce z předchozího bojiště.
        this.updateCoverFirePanel(null);
    }

    static syncCompactButtons() {
        const compact = document.getElementById('game-container').classList.contains('compact-battle');
        for (const [panelId, buttonId, toggleId] of [
            ['unit-panel', 'btn-unit-sheet', 'toggle-left'], ['info-panel', 'btn-army-sheet', 'toggle-right']
        ]) {
            const panel = document.getElementById(panelId), toggle = document.getElementById(toggleId);
            document.getElementById(buttonId).setAttribute('aria-expanded', String(panel.classList.contains('expanded')));
            toggle.setAttribute('aria-expanded', String(!panel.classList.contains('collapsed')));
            if (compact) toggle.textContent = '×';
        }
    }

    static closeCompactPanels() {
        for (const id of ['unit-panel', 'info-panel']) {
            const panel = document.getElementById(id);
            panel.classList.remove('expanded'); panel.classList.add('collapsed');
        }
        this.syncCompactButtons();
    }

    factionLabel(faction) {
        const id = this.game.currentScenario && this.game.currentScenario.id;
        if (id && typeof i18n !== 'undefined') {
            const key = `scenarios.${id}.factionNames.${faction}`;
            if (i18n.hasTranslation(key)) return i18n.t(key);
            // fallback na kanonickou hodnotu ze scénáře (pro jazyk bez locale záznamu)
            const fn = this.game.currentScenario.factionNames;
            if (fn && fn[faction]) return fn[faction];
        }
        return i18n.t(`factions.${faction}`);
    }

    updateUI() {
        // Aktuální hráč
        const playerSpan = document.getElementById('current-player');
        const finished = this.game.gameState === 'victory';
        if (finished) {
            playerSpan.textContent = i18n.t('gameover.finished');
            playerSpan.className = 'finished';
        } else {
            const factionName = this.factionLabel(this.game.currentFaction);
            playerSpan.textContent = `${i18n.t('game.turnLabel')} ${factionName}`;
            playerSpan.className = this.game.currentFaction === 'crusaders' ? 'crusaders' : '';
        }

        // Číslo kola - u misí s limitem ukaž i deadline (Kolo X/Y)
        const maxT = this.game.currentScenario?.id === 'zivohost_1419'
            ? this.game.currentScenario.victoryConditions.primary.turns
            : this.game.currentScenario?.maxTurns;
        const displayedTurn = finished
            ? (this.game.gameOverTurn ?? (maxT ? Math.min(this.game.turnNumber, maxT) : this.game.turnNumber))
            : this.game.turnNumber;
        document.getElementById('turn-number').textContent = maxT
            ? `${i18n.t('game.roundLabel')} ${displayedTurn}/${maxT}`
            : `${i18n.t('game.roundLabel')} ${displayedTurn}`;

        this.updateObjectiveProgress();
        this.game.view.syncAISpeedControls?.();

        // Přehled armád
        this.updateArmyOverview();

        // Aktualizace tlačítka chorálu
        this.updateChoralButton();

        // Aktualizace pulsujícího efektu tlačítka Ukončit tah
        this.updateEndTurnButton();
    }

    updateObjectiveProgress() {
        this.updateSurvivalObjective();
        this.updateSecondaryObjectives();
        const primary = this.game.currentScenario?.victoryConditions?.primary;
        const targets = document.getElementById('dual-objectives');
        const hint = document.getElementById('dual-objective-hint');
        targets?.replaceChildren();
        const progress = this.game.victoryConditionsSystem.getDualObjectiveProgress();
        hint?.classList.toggle('hidden', progress.length === 0);
        if (!primary?.description) return;
        let text = primary.description;
        if (primary.type === 'capture_position') {
            const playerFaction = this.game.currentScenario.playerFaction || 'hussites';
            const positions = primary.positions || [];
            const required = primary.count || positions.length;
            const captured = positions.filter(([col, row]) => {
                const unit = this.game.getUnitAt(col, row);
                return unit && unit.faction === playerFaction && unit.health > 0;
            }).length;
            text += ` · ${i18n.t('game.captureProgress', { captured, required })}`;
        }
        if (progress.length > 0) {
            const summaries = [];
            for (const objective of progress) {
                const name = objective.labelKey ? i18n.t(`mapLabels.${objective.labelKey}`) : objective.description;
                const held = objective.occupied ? Math.min(objective.heldTurns, objective.requiredTurns) : 0;
                summaries.push(i18n.t('game.dualObjectiveProgress', { name, held, required: objective.requiredTurns }));
                if (!targets) continue;
                const row = document.createElement('div');
                row.className = 'dual-objective';
                row.dataset.objective = objective.id;
                row.classList.toggle('objective-held', objective.occupied);
                const title = document.createElement('strong');
                title.textContent = name;
                const description = document.createElement('p');
                description.textContent = objective.description;
                const state = document.createElement('p');
                state.className = 'objective-progress';
                state.textContent = `${i18n.t('game.holdProgress', { held, required: objective.requiredTurns })} · ${i18n.t(objective.occupied ? 'game.objectiveOccupied' : 'game.objectiveUnoccupied')}`;
                const locate = document.createElement('button');
                locate.type = 'button';
                locate.className = 'objective-locate';
                locate.textContent = i18n.t('game.showObjectiveOnMap');
                locate.setAttribute('aria-label', `${name}: ${locate.textContent}`);
                locate.addEventListener('click', () => {
                    this.locateObjective(objective);
                });
                row.append(title, description, state, locate);
                targets.appendChild(row);
            }
            text += ` · ${summaries.join(' · ')}`;
            if (hint) hint.textContent = i18n.t('game.dualObjectiveHint');
        }
        for (const id of ['primary-objective', 'objective-hud-text']) {
            const element = document.getElementById(id);
            if (element && element.textContent !== text) element.textContent = text;
        }
    }

    locateObjective(objective) {
        const points = (objective.positions || []).map(([col, row]) => this.game.hexGrid.hexToPixel(col, row));
        if (!points.length) return;
        this.game.view.hideTooltip();
        this.game.view.mapInput.centerOnWorld(
            points.reduce((sum, point) => sum + point.x, 0) / points.length,
            points.reduce((sum, point) => sum + point.y, 0) / points.length
        );
        document.getElementById('objectives-panel').classList.add('hidden');
        document.getElementById('btn-objectives').focus();
    }

    updateSecondaryObjectives() {
        const list = document.getElementById('secondary-objectives');
        if (!list) return;
        const objectives = this.game.currentScenario?.victoryConditions?.secondary || [];
        const progress = this.game.victoryConditionsSystem.getSecondaryPositionProgress();
        const signature = JSON.stringify([i18n.currentLanguage, objectives,
            progress.map(objective => [objective.captured, objective.required])]);
        // Obnovit jen změněný stav: přesun po mapě nesmí ztrácet fokus tlačítka.
        if (list.dataset.progressSignature === signature) return;
        list.dataset.progressSignature = signature;
        list.replaceChildren();
        document.getElementById('optional-objectives')?.classList.toggle('hidden', objectives.length === 0);
        for (const [index, objective] of objectives.entries()) {
            const current = progress.find(item => item.id === objective.id);
            const row = document.createElement('div');
            row.className = 'objective secondary';
            row.dataset.objective = objective.id || `secondary-${index}`;
            const status = document.createElement('span');
            status.className = 'objective-status'; status.textContent = '◇';
            const description = document.createElement('span');
            description.className = 'objective-text'; description.textContent = objective.description;
            row.append(status);
            if (current) {
                row.classList.add('position-objective');
                row.classList.toggle('objective-held', current.achieved);
                const detail = document.createElement('div'); detail.className = 'position-objective-details';
                const count = document.createElement('p'); count.className = 'objective-progress';
                count.textContent = i18n.t('game.optionalPositionProgress', {
                    captured: current.captured, total: current.positions.length, required: current.required });
                const hint = document.createElement('p'); hint.className = 'optional-objectives-note';
                hint.textContent = i18n.t('game.optionalPositionHint');
                const locate = document.createElement('button'); locate.type = 'button';
                locate.className = 'objective-locate'; locate.textContent = i18n.t('game.showObjectiveOnMap');
                locate.setAttribute('aria-label', `${objective.description}: ${locate.textContent}`);
                locate.addEventListener('click', () => this.locateObjective(current));
                detail.append(description, count, hint, locate); row.append(detail);
            } else row.append(description);
            list.appendChild(row);
        }
    }

    updateSurvivalObjective() {
        const progress = this.game.currentScenario?.id === 'zivohost_1419'
            ? this.game.victoryConditionsSystem.getSurvivalProgress() : null;
        const visible = !!progress?.total;
        for (const id of ['survival-hud', 'survival-objective']) {
            const element = document.getElementById(id);
            if (!element) continue;
            element.classList.toggle('hidden', !visible);
            element.classList.toggle('survival-at-risk', visible && progress.alive < progress.minimum);
        }
        if (!visible) {
            document.getElementById('survival-hud').textContent = '';
            return;
        }
        const values = { ...progress,
            reinforcementTurn: this.game.currentScenario.forces.hussites.reinforcements.turn };
        for (const [id, key] of [['survival-hud', 'counts'], ['survival-counts', 'counts'],
            ['survival-turns', 'turns'], ['survival-rules', 'rules']]) {
            const element = document.getElementById(id);
            const text = i18n.t('game.survival.' + key, values);
            if (element.textContent !== text) element.textContent = text;
        }
    }

    updateEndTurnButton() {
        this.updateGuidance();
        const saveStatus = document.getElementById('autosave-status');
        saveStatus.classList.toggle('hidden', !this.game.autosaveFailed);
        saveStatus.textContent = this.game.autosaveFailed ? i18n.t('touch.autosaveError') : '';
        const endTurnBtn = document.getElementById('btn-end-turn');
        if (!endTurnBtn) return;
        endTurnBtn.disabled = this.game.currentFaction !== 'hussites' || !this.game.canStartAction();
        for (const id of ['btn-save', 'btn-pause-save']) {
            const button = document.getElementById(id);
            if (button) button.disabled = this.game.gameState !== 'playing' || this.game.actions.busy || this.game.currentFaction !== 'hussites';
        }

        // Pouze pro hráčskou frakci (husité)
        if (this.game.currentFaction === 'hussites' && this.game.allPlayerUnitsActed()) {
            endTurnBtn.classList.add('pulse');
        } else {
            endTurnBtn.classList.remove('pulse');
        }
    }

    // Pouze čtení: pokyn vysvětluje dostupný vstup, neprozrazuje nepřátele
    // za mlhou a nevolí za hráče taktiku. Akční systém obnoví text i po animaci.
    getGuidance() {
        const game = this.game;
        if (game.gameState === 'victory') return { key: 'review' };
        if (game.gameState !== 'playing') return null;
        if (game.isPaused) return { key: 'paused' };
        if (game.currentFaction !== 'hussites') return { key: 'enemyTurn' };
        if (game.actions.busy) return { key: 'busy' };
        if (game.allPlayerUnitsActed()) return { key: 'endTurn' };
        const unit = game.selectedUnit;
        if (!unit || unit.faction !== 'hussites') return { key: 'select' };
        if (unit.isRouting) return { key: 'routing', unit: unit.name };
        if (!unit.canAct()) return { key: 'spent', unit: unit.name };
        if (unit.isWagon() && unit.formationClosed && !unit.marching && !unit.hasMoved) return { key: 'wagon', unit: unit.name };
        if (!unit.canMove() && !unit.canAttack()) return { key: 'defend', unit: unit.name };
        return { key: unit.canMove() ? 'move' : 'attack', unit: unit.name };
    }

    updateGuidance() {
        const element = document.getElementById('turn-guidance');
        if (!element) return;
        const guidance = this.getGuidance();
        element.classList.toggle('hidden', !guidance);
        const compact = document.getElementById('game-container').classList.contains('compact-battle');
        let key = guidance ? `onboarding.hints.${guidance.key}` : '';
        if (compact && guidance?.key === 'select') key = 'touch.selectHint';
        if (compact && ['move', 'attack'].includes(guidance?.key)) key = 'touch.chooseTarget';
        const text = key ? i18n.t(key, { unit: guidance.unit }) : '';
        if (element.textContent !== text) element.textContent = text;
    }

    updateArmyOverview() {
        const hussiteSection = document.getElementById('hussite-section');
        const crusaderSection = document.getElementById('crusader-section');
        const hussiteList = document.getElementById('hussite-units');
        const crusaderList = document.getElementById('crusader-units');

        hussiteList.innerHTML = '';
        crusaderList.innerHTML = '';

        // Počítadla jednotek
        let hussiteAlive = 0, hussiteTotal = 0;
        let crusaderAlive = 0, crusaderTotal = 0;

        for (const unit of this.game.units) {
            const li = document.createElement('li');
            li.className = 'unit-list-item';
            const commander = WoodcutRenderer.isCommander(unit);
            if (commander) li.classList.add('commander-unit');
            const role = commander ? `<small class="unit-role">${i18n.t('tooltip.commander')}</small>` : '';

            // Získání symbolu jednotky
            const symbol = WoodcutRenderer.icon(unit);

            // Výpočet procenta zdraví pro barvu
            const healthPercent = (unit.health / unit.maxHealth) * 100;
            let healthClass = 'health-high';
            if (healthPercent <= 30) {
                healthClass = 'health-critical';
            } else if (healthPercent <= 60) {
                healthClass = 'health-medium';
            }

            if (unit.health <= 0) {
                li.classList.add('destroyed');
                li.innerHTML = `
                    <span class="unit-icon destroyed">✝</span>
                    <span class="unit-name">${unit.name}${role}</span>
                `;
            } else {
                li.innerHTML = `
                    <span class="unit-icon${commander ? ' commander-mark' : ''}">${symbol}</span>
                    <span class="unit-name">${unit.name}${role}</span>
                    <span class="unit-health ${healthClass}">${unit.health}</span>
                `;

                if (unit.faction === this.game.currentFaction && !unit.canAct()) {
                    li.classList.add('exhausted');
                }
            }

            // Označení aktivní (vybrané) jednotky
            if (this.game.selectedUnit === unit) {
                li.classList.add('active');
            }

            // Kliknutí na jednotku v přehledu - vybere jednotku
            if (unit.health > 0) {
                li.addEventListener('click', () => {
                    if (this.game.gameState === 'victory') {
                        this.game.inspectUnit(unit);
                    // Během bitvy jsou rozkazy dostupné pouze vlastním jednotkám.
                    } else if (unit.faction === 'hussites' && this.game.currentFaction === 'hussites') {
                        this.game.selectUnit(unit);
                        this.game.render();
                    }
                });
            }

            if (unit.faction === 'hussites') {
                hussiteList.appendChild(li);
                hussiteTotal++;
                if (unit.health > 0) hussiteAlive++;
            } else {
                crusaderList.appendChild(li);
                crusaderTotal++;
                if (unit.health > 0) crusaderAlive++;
            }
        }

        // Aktualizace počítadel v hlavičkách
        const hussiteCount = hussiteSection?.querySelector('.faction-count');
        const crusaderCount = crusaderSection?.querySelector('.faction-count');
        if (hussiteCount) hussiteCount.textContent = `${hussiteAlive}/${hussiteTotal}`;
        if (crusaderCount) crusaderCount.textContent = `${crusaderAlive}/${crusaderTotal}`;

        // WP5: per-scénář jména stran v hlavičkách (data-i18n odstraněn v HTML, řídíme ručně)
        const hussiteName = hussiteSection?.querySelector('.faction-name');
        const crusaderName = crusaderSection?.querySelector('.faction-name');
        if (hussiteName) hussiteName.textContent = this.factionLabel('hussites');
        if (crusaderName) crusaderName.textContent = this.factionLabel('crusaders');

        // Lišty morálky armád (okno protiútoku)
        this.renderMoraleBar('hussite', 'hussites', hussiteAlive);
        this.renderMoraleBar('crusader', 'crusaders', crusaderAlive);
    }

    renderMoraleBar(prefix, faction, aliveCount) {
        const bar = document.getElementById(`${prefix}-morale`);
        const fill = document.getElementById(`${prefix}-morale-fill`);
        const text = document.getElementById(`${prefix}-morale-text`);
        if (!bar || !fill || !text) return;

        // Bez živých jednotek lišta zmizí
        if (aliveCount === 0) {
            bar.style.display = 'none';
            return;
        }
        bar.style.display = '';

        const morale = this.game.getArmyMorale(faction);

        fill.style.width = `${morale}%`;
        fill.classList.remove('morale-medium', 'morale-low');
        if (morale < 40) {
            fill.classList.add('morale-low');
        } else if (morale < 60) {
            fill.classList.add('morale-medium');
        }

        const isWavering = this.game.wavering && this.game.wavering[faction];
        bar.classList.toggle('wavering', !!isWavering);

        const label = i18n.t('game.moraleLabel');
        text.textContent = isWavering
            ? `${i18n.t('game.wavering')} ${morale}%`
            : `${label} ${morale}%`;
        bar.title = `${label}: ${morale}%`;
    }

    updateCoverFirePanel(unit) {
        const panel = document.getElementById('unit-cover-fire');
        const state = this.game.gameState === 'playing' ? this.game.getCoverFireStatus(unit) : null;
        panel.classList.toggle('hidden', !state);
        panel.classList.toggle('cover-fire-ready', state === 'ready');
        panel.classList.toggle('cover-fire-defending', state === 'defending');
        panel.dataset.state = state || '';
        if (!state) return;

        const titleKey = `game.coverFireTitles.${['ready', 'defending'].includes(state) ? state : 'unavailable'}`;
        const detailKey = `game.coverFireDetails.${state}`;
        for (const [id, key] of [['unit-cover-fire-title', titleKey], ['unit-cover-fire-detail', detailKey]]) {
            const element = document.getElementById(id);
            element.setAttribute('data-i18n', key);
            element.textContent = i18n.t(key);
        }
    }

    updateWagonOrderHelp(unit) {
        const help = document.getElementById('wagon-order-help');
        const explanation = document.getElementById('formation-explanation');
        const isWagon = !!unit?.isWagon();
        help?.classList.toggle('hidden', !isWagon);
        explanation?.classList.toggle('hidden', !isWagon);
        if (!isWagon) return;

        const key = 'game.wagonOrders.';
        const singleKey = key + (unit.formationClosed ? 'openHint' : 'closeHint');
        const marchKey = key + (unit.marching ? 'stopHint' : 'marchHint');
        const targetState = !unit.formationClosed;
        const line = this.game.connectedWagonLine(unit);
        const eligible = unit.hasMoved ? 0 : line.filter(w => !w.hasMoved && w.formationClosed !== targetState).length;
        const lineHint = i18n.t(key + 'lineHint', { count: line.length, eligible,
            state: i18n.t(key + (targetState ? 'closedState' : 'openState')) });

        for (const [id, hintKey] of [['btn-formation', singleKey], ['btn-formation-march', marchKey]]) {
            const button = document.getElementById(id);
            if (!button) continue;
            button.setAttribute('data-i18n-title', hintKey);
            button.title = i18n.t(hintKey);
        }
        // Počet se přepočítává i při změně jazyka; samotný rozkaz zde nevydáváme.
        const lineButton = document.getElementById('btn-formation-line');
        if (lineButton) lineButton.title = lineHint;
        const texts = {
            'formation-explanation': i18n.t(key + (unit.formationClosed ? (unit.marching ? 'marching' : 'closed') : 'open')),
            'wagon-single-help': i18n.t(singleKey),
            'wagon-line-help': lineHint,
            'wagon-march-help': i18n.t(key + 'marchHint') + ' ' + i18n.t(key + 'stopHint')
        };
        for (const [id, text] of Object.entries(texts)) {
            const element = document.getElementById(id);
            if (element) element.textContent = text;
        }
    }

    updateMovementHelp(unit) {
        const help = document.getElementById('movement-help');
        const faction = this.game.currentScenario?.playerFaction || 'hussites';
        const visible = !!unit && unit.faction === faction;
        help.classList.toggle('hidden', !visible);
        if (!visible) return;
        const fixed = unit.movement <= 0 || unit.unitClass === 'fortification';
        const linked = unit.isWagon() && unit.formationClosed;
        const state = fixed ? 'fixed' : unit.hasMoved ? 'spent'
            : linked ? (unit.marching ? 'group' : 'linked') : 'ready';
        document.getElementById('movement-state').textContent = i18n.t('help.movement.' + state);
        document.getElementById('movement-standard').classList.toggle('hidden', fixed || linked);
        document.getElementById('movement-budget').textContent = i18n.t('help.movement.budget', {
            unit: unit.name, points: unit.movement });
        const costs = document.getElementById('movement-costs');
        costs.replaceChildren();
        if (fixed || linked) return;
        for (const terrain of ['plains', 'road', 'hills', 'slope', 'forest', 'mud', 'swamp', 'water']) {
            const row = document.createElement('div');
            row.dataset.terrain = terrain;
            const name = document.createElement('dt');
            name.textContent = i18n.t('terrain.' + terrain);
            const cost = document.createElement('dd');
            cost.textContent = terrain === 'water' && !this.game.currentScenario?.specialMechanics?.frozenRiver
                ? i18n.t('tooltip.impassable') : String(this.game.getTerrainMoveCost(terrain, unit));
            row.append(name, cost);
            costs.appendChild(row);
        }
    }

    routingExplanation(unit) {
        const key = 'game.routingDetails.';
        const noQuarter = this.game.currentScenario?.specialMechanics?.noQuarterGiven;
        if (this.game.moraleSystem.isNoQuarterTarget(unit, noQuarter)) return i18n.t(key + 'noQuarter');
        const attempts = Math.max(0, 2 - (unit.rallyAttempts || 0));
        const progress = attempts > 0 ? i18n.t(key + 'attempts', { count: attempts }) : i18n.t(key + 'desertionDue');
        if (!attempts) return progress;
        const canRetreat = UnitTypes[unit.type]?.tactics?.canRetreat !== false;
        return [i18n.t(key + 'start'), progress, i18n.t(key + (canRetreat ? 'retreat' : 'noRetreat'))].join(' ');
    }

    // Detail a encyklopedie čtou stejné pořadí akcí ze skutečného typu,
    // ne z podobného jména varianty.
    static artilleryOrderExplanation(unit) {
        if (unit?.unitClass !== 'artillery') return '';
        const kind = unit.movement <= 0 ? 'fixed' : (unit.special === 'mobile' ? 'mobile' : 'normal');
        return i18n.t('game.artilleryOrders.' + kind);
    }

    unitRuleHtml(unit) {
        let html = '';
        if (unit.unitClass === 'artillery') {
            html += `<div class="unit-mechanics-hint"><strong>${i18n.t('game.artilleryOrders.title')}</strong><p>${BattlePanels.artilleryOrderExplanation(unit)}</p></div>`;
        }
        if (unit.isRouting) {
            html += `<div class="unit-mechanics-hint unit-routing-hint"><strong>🏃 ${i18n.t('tooltip.routing')}</strong><p>${this.routingExplanation(unit)}</p></div>`;
        }
        return html;
    }

    updateUnitPanel(unit) {
        this.updateGuidance();
        this.updateCoverFirePanel(unit);
        this.updateWagonOrderHelp(unit);
        this.updateMovementHelp(unit);
        const infoDiv = document.getElementById('unit-info');
        const actionsDiv = document.getElementById('unit-actions');
        const attackBtn = document.getElementById('btn-attack');
        const unitPanel = document.getElementById('unit-panel');

        // Nový oddíl začíná nahoře u rozkazů. Pouhá aktualizace stejného
        // oddílu nebo přepnutí jazyka ale nesmí čtenáři posunout detail.
        const displayedUnitId = unit?.id ?? null;
        if (this.displayedUnitId !== displayedUnitId) {
            if (unitPanel) unitPanel.scrollTop = 0;
            infoDiv.scrollTop = 0;
            const wagonHelp = document.getElementById('wagon-order-help');
            if (wagonHelp) wagonHelp.open = false;
            document.getElementById('movement-help').open = false;
            this.displayedUnitId = displayedUnitId;
        }

        if (!unit) {
            if (unitPanel) {
                unitPanel.classList.add('empty-unit-panel');
            }
            infoDiv.innerHTML = `<p class="no-selection">${i18n.t('tooltip.selectUnit')}</p>`;
            actionsDiv.classList.add('hidden');
            return;
        }
        if (unitPanel) {
            unitPanel.classList.remove('empty-unit-panel');
        }

        // Speciální schopnost HTML
        let specialHtml = '';
        if (unit.special && unit.special !== 'commander') {
            const specialKey = `special.${unit.special}`;
            const specialName = i18n.hasTranslation(specialKey) ? i18n.t(specialKey) : unit.special;
            specialHtml = `
                <div class="unit-special" style="margin: 10px 0; padding: 8px; background: rgba(212, 175, 55, 0.15); border: 1px solid #5c4a1f; border-radius: 4px;">
                    <span style="color: #d4af37; font-weight: bold;">⚡ ${specialName}</span>
                </div>
            `;
        }

        // Velitelské schopnosti HTML
        let commanderHtml = '';
        if (unit.isCommander && unit.isCommander()) {
            const abilities = unit.getCommanderAbilities();
            let abilitiesText = [];
            if (abilities.moraleBonus) abilitiesText.push(i18n.t('tooltip.moraleBonus', { value: abilities.moraleBonus }));
            if (abilities.attackBonus) abilitiesText.push(i18n.t('tooltip.attackBonus', { value: abilities.attackBonus }));
            if (abilities.defenseBonus) abilitiesText.push(i18n.t('tooltip.defenseBonus', { value: abilities.defenseBonus }));
            if (abilities.wagonBonus) abilitiesText.push(i18n.t('tooltip.wagonsBonus', { value: abilities.wagonBonus }));
            if (abilities.cavalryBonus) abilitiesText.push(i18n.t('tooltip.cavalryBonus', { value: abilities.cavalryBonus }));

            commanderHtml = `
                <div class="commander-info">
                    <div class="commander-heading">
                        <span class="commander-insignia" aria-hidden="true">${WoodcutRenderer.icon(unit)}</span>
                        <strong>${i18n.t('tooltip.commander')}</strong>
                    </div>
                    <div style="color: #d4af37; font-size: 0.85rem; margin-bottom: 5px;">
                        ${i18n.t('tooltip.auraRange', { value: abilities.auraRange })}
                    </div>
                    <div style="color: #aaa; font-size: 0.8rem;">
                        ${i18n.t('tooltip.bonuses', { values: abilitiesText.join(', ') })}
                    </div>
                    ${abilities.fearRange ? `<div style="color: #ff6b6b; font-size: 0.8rem; margin-top: 3px;">${i18n.t('tooltip.fear', { penalty: abilities.fearPenalty, range: abilities.fearRange })}</div>` : ''}
                    ${abilities.rallyBonus ? `<div style="color: #2f7d31; font-size: 0.8rem; margin-top: 3px;">${i18n.t('tooltip.rallyBonus', { value: abilities.rallyBonus })}</div>` : ''}
                </div>
            `;
        }

        // Velitelský bonus pokud je jednotka v auře
        let auraEffectHtml = '';
        if (!unit.isCommander || !unit.isCommander()) {
            const bonuses = this.game.getCommanderBonuses(unit);
            const fearPenalty = this.game.getEnemyCommanderFearPenalty(unit);

            if (bonuses && (bonuses.morale > 0 || bonuses.attack > 0 || bonuses.defense > 0)) {
                const nearestInfo = this.game.getNearestCommander(unit);
                auraEffectHtml = `
                    <div class="aura-effect aura-bonus">
                        <div class="aura-header">
                            <span class="aura-icon">👑</span>
                            <span class="aura-title">${i18n.t('tooltip.inAura')}${nearestInfo ? ` (${nearestInfo.commander.name})` : ''}</span>
                        </div>
                        <div class="aura-values">
                            ${bonuses.attack > 0 ? `<span class="aura-value positive">${i18n.t('tooltip.attackBonus', { value: bonuses.attack })}</span>` : ''}
                            ${bonuses.defense > 0 ? `<span class="aura-value positive">${i18n.t('tooltip.defenseBonus', { value: bonuses.defense })}</span>` : ''}
                            ${bonuses.morale > 0 ? `<span class="aura-value positive">${i18n.t('tooltip.moraleBonus', { value: bonuses.morale })}</span>` : ''}
                        </div>
                    </div>
                `;
            }

            if (fearPenalty > 0) {
                auraEffectHtml += `
                    <div class="aura-effect aura-fear">
                        <div class="aura-header">
                            <span class="aura-icon">⚠️</span>
                            <span class="aura-title">${i18n.t('tooltip.enemyCommander')}</span>
                        </div>
                        <div class="aura-values">
                            <span class="aura-value negative">-${i18n.t('tooltip.moraleBonus', { value: fearPenalty }).replace(/^\+/, '')}</span>
                        </div>
                    </div>
                `;
            }
        }

        // Status efekty
        let statusHtml = '';
        if (unit.isTerrified) {
            statusHtml += `<span style="color: #ff8844; font-size: 0.85rem;">😨 ${i18n.t('tooltip.terrified')}</span><br>`;
        }
        if (unit.isDefending && (this.game.gameState !== 'playing' || !this.game.getCoverFireStatus(unit))) {
            statusHtml += `<span style="color: #4488ff; font-size: 0.85rem;">🛡️ ${i18n.t('tooltip.defensiveStance')}</span><br>`;
        }
        // WP1/P4: stav vozové hradby - pevná zeď (nehýbe se) vs pochod (poloviční kryt)
        if (unit.isWagon() && unit.formationClosed) {
            if (unit.marching) {
                statusHtml += `<span style="color: #d0b060; font-size: 0.85rem;">➡ ${i18n.t('game.wagonMarchHint')}</span><br>`;
            } else {
                statusHtml += `<span style="color: #c9a227; font-size: 0.85rem;">⛓ ${i18n.t('game.wagonChainedHint')}</span><br>`;
            }
        }
        if (unit.isRouting) {
            statusHtml += `<span style="color: #ff4444; font-size: 0.85rem;">🏃 ${i18n.t('tooltip.routing')}</span><br>`;
        }

        // Obklíčení - dynamická kontrola
        const surroundInfo = this.game.checkSurrounded(unit);
        if (surroundInfo.surrounded) {
            const levelText = i18n.t(`tooltip.surrounded${surroundInfo.level}`);
            const penalty = surroundInfo.level * 10;
            statusHtml += `<span style="color: #ff6666; font-size: 0.85rem;">⚔️ ${i18n.t('tooltip.surroundedEffect', {
                state: levelText,
                defense: penalty,
                morale: surroundInfo.level * 5
            })}</span><br>`;
        }

        infoDiv.innerHTML = `
            <h3>${unit.name}</h3>
            <p style="font-size: 0.8rem; color: #999; margin-bottom: 8px; font-style: italic;">${unit.description}</p>
            ${this.unitRuleHtml(unit)}
            ${commanderHtml}
            ${specialHtml}

            ${auraEffectHtml}

            <div class="unit-stats-grid">
                <div class="unit-stat">
                    <span><span class="stat-icon">⚔</span><span class="label">${i18n.t('help.unitStats.attack')}</span></span>
                    <span class="value">${unit.attack}</span>
                </div>
                <div class="unit-stat">
                    <span><span class="stat-icon">🛡</span><span class="label">${i18n.t('help.unitStats.defense')}</span></span>
                    <span class="value">${unit.defense}</span>
                </div>
                <div class="unit-stat">
                    <span><span class="stat-icon">📏</span><span class="label">${i18n.t('help.unitStats.range')}</span></span>
                    <span class="value">${unit.range}</span>
                </div>
                <div class="unit-stat">
                    <span><span class="stat-icon">👣</span><span class="label">${i18n.t('help.unitStats.movement')}</span></span>
                    <span class="value">${unit.movement}</span>
                </div>
            </div>

            <div class="health-bar" style="margin-top: 8px; position: relative;">
                <div class="health-bar-fill" style="width: ${(unit.health / unit.maxHealth) * 100}%"></div>
                <span class="health-bar-text">${unit.health}/${unit.maxHealth}</span>
            </div>
            <p class="unit-attack-strength">${i18n.t('tooltip.attackStrength', { value: Math.round(unit.getAttackStrength() * 100) })}</p>

            <div class="morale-section" style="padding-top: 8px; border-top: 1px solid rgba(201, 162, 39, 0.3);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <span style="font-size: 0.75rem; color: #888; text-transform: uppercase;">${i18n.t('game.moraleLabel')}</span>
                    <span style="color: ${unit.getMoraleColor()}; font-weight: bold;">${unit.getMoraleStatus()}</span>
                </div>
                <div class="morale-bar" style="width: 100%; height: 6px; background: rgba(0,0,0,0.4); border-radius: 3px; overflow: hidden;">
                    <div style="width: ${(unit.morale / unit.maxMorale) * 100}%; height: 100%; background: ${unit.getMoraleColor()}; transition: width 0.3s;"></div>
                </div>
            </div>
            ${statusHtml ? `<div class="status-effects" style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(201, 162, 39, 0.3);">${statusHtml}</div>` : ''}
        `;

        if (this.game.gameState === 'playing' && unit.faction === this.game.currentFaction) {
            actionsDiv.classList.remove('hidden');
            attackBtn.disabled = !unit.canAttack();

            const takingCover = unit.isRanged() && unit.range >= 2;
            const defendBtn = document.getElementById('btn-defend');
            const defendKey = takingCover ? 'game.takeCover' : 'game.defend';
            const defendHintKey = takingCover ? 'game.takeCoverHint' : 'game.defendHint';
            defendBtn.setAttribute('data-i18n', defendKey);
            defendBtn.setAttribute('data-i18n-title', defendHintKey);
            defendBtn.textContent = i18n.t(defendKey);
            defendBtn.title = i18n.t(defendHintKey);

            const defendExplanation = document.getElementById('defend-explanation');
            if (defendExplanation) {
                const key = takingCover
                    ? 'game.defendExplanationRanged'
                    : 'game.defendExplanation';
                defendExplanation.setAttribute('data-i18n', key);
                defendExplanation.textContent = i18n.t(key);
            }

            // WP1: tlačítka hradby - jen pro hráčův vůz, který ještě nejednal
            const formationBtn = document.getElementById('btn-formation');
            const formationLineBtn = document.getElementById('btn-formation-line');
            const formationMarchBtn = document.getElementById('btn-formation-march');
            if (formationBtn && formationLineBtn) {
                if (unit.isWagon() && !unit.hasMoved) {
                    formationBtn.textContent = i18n.t(unit.formationClosed ? 'game.openFort' : 'game.closeFort');
                    formationLineBtn.textContent = i18n.t('game.toggleFortLine');
                    formationBtn.classList.remove('hidden');
                    formationLineBtn.classList.remove('hidden');
                } else {
                    formationBtn.classList.add('hidden');
                    formationLineBtn.classList.add('hidden');
                }
            }
            // P4: pochod hradby - dostupný pro sepnutý vůz (přepnutí zdarma; ukážeme
            // i po pohybu, aby šlo zastavit a získat příště plný kryt)
            if (formationMarchBtn) {
                if (unit.isWagon() && unit.formationClosed) {
                    formationMarchBtn.textContent = i18n.t(unit.marching ? 'game.stopMarch' : 'game.startMarch');
                    formationMarchBtn.classList.remove('hidden');
                } else {
                    formationMarchBtn.classList.add('hidden');
                }
            }

            // Tlačítko undo - zobrazit pouze pokud je možné vrátit pohyb
            const undoBtn = document.getElementById('btn-undo');
            if (this.game.canUndo() && this.game.lastMove && this.game.lastMove.unit === unit) {
                undoBtn.classList.remove('hidden');
            } else {
                undoBtn.classList.add('hidden');
            }
        } else {
            actionsDiv.classList.add('hidden');
        }
    }

    updateChoralButton() {
        const choralBtn = document.getElementById('btn-choral');
        if (!choralBtn) return;

        let status;
        if (this.game.choralActive) {
            // Chorál je aktivní - zobrazit zbývající kola
            choralBtn.disabled = true;
            choralBtn.classList.add('active');
            status = i18n.t('game.choralTurns', { turns: this.game.choralTurnsRemaining });
        } else if (this.game.choralUsed) {
            // Chorál byl použit a už vypršel
            choralBtn.disabled = true;
            choralBtn.classList.remove('active');
            status = i18n.t('game.choralUsed');
        } else {
            choralBtn.disabled = this.game.currentFaction !== 'hussites';
            choralBtn.classList.remove('active');
            status = i18n.t('game.choralReady');
        }

        const label = document.createElement('span');
        label.textContent = `⚔️ ${i18n.t('game.choral')}`;
        const use = document.createElement('span');
        use.className = 'choral-use';
        use.textContent = status;
        choralBtn.replaceChildren(label, use);
        choralBtn.title = i18n.t('help.mechanics.choral');
        choralBtn.setAttribute('aria-label', `${i18n.t('game.choral')} · ${status}`);
    }

    showPhase(newPhase) {
        if (!newPhase) {
            document.getElementById('phase-panel').classList.add('hidden');
            return;
        }
        // Zobrazení phase panelu
        const phasePanel = document.getElementById('phase-panel');
        const phaseIcon = document.getElementById('phase-icon');
        document.getElementById('phase-name').textContent = newPhase.name;
        document.getElementById('phase-description').textContent = newPhase.description || '';

        // Nastavení ikony podle typu fáze
        const phaseIcons = {
            'surprise': '⚡',
            'attack': '⚔',
            'defense': '🛡',
            'retreat': '🏃',
            'reinforcement': '📯',
            'ambush': '🎯',
            'siege': '🏰',
            'default': '⚔'
        };
        const phaseName = newPhase.name.toLowerCase();
        let icon = phaseIcons.default;
        if (phaseName.includes('překvap') || phaseName.includes('surprise')) icon = phaseIcons.surprise;
        else if (phaseName.includes('útok') || phaseName.includes('attack')) icon = phaseIcons.attack;
        else if (phaseName.includes('obran') || phaseName.includes('defense')) icon = phaseIcons.defense;
        else if (phaseName.includes('ústup') || phaseName.includes('retreat')) icon = phaseIcons.retreat;
        else if (phaseName.includes('posil') || phaseName.includes('reinforcement')) icon = phaseIcons.reinforcement;
        else if (phaseName.includes('léčk') || phaseName.includes('ambush')) icon = phaseIcons.ambush;
        else if (phaseName.includes('oblé') || phaseName.includes('siege')) icon = phaseIcons.siege;

        if (phaseIcon) phaseIcon.textContent = icon;
        phasePanel.classList.remove('hidden');
    }

    showPhaseBanner(name, description) {
        const panel = document.getElementById('phase-panel');
        if (!name) { panel.classList.add('hidden'); return; }
        document.getElementById('phase-name').textContent = name;
        document.getElementById('phase-description').textContent = description;
        panel.classList.remove('hidden');
    }

    updatePhaseDescription(description) {
        const element = document.getElementById('phase-description');
        if (element) element.textContent = description;
    }
}
