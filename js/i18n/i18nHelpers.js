// Helper funkce pro lokalizaci herních dat
// Propojuje data objekty (UnitTypes, Scenarios, atd.) s i18n překlady

/**
 * Získá lokalizovaná data jednotky
 * @param {string} unitTypeKey - Klíč typu jednotky (např. 'CEPNICI')
 * @param {object} baseUnit - Základní data jednotky z UnitTypes
 * @returns {object} Jednotka s přeloženými texty
 */
function getLocalizedUnit(unitTypeKey, baseUnit) {
    if (!baseUnit || typeof i18n === 'undefined') {
        return baseUnit;
    }

    // Zkopíruj základní data
    const localizedUnit = { ...baseUnit };

    // Přelož texty pokud existují v i18n
    const unitKey = `units.${unitTypeKey}`;

    if (i18n.hasTranslation(`${unitKey}.name`)) {
        localizedUnit.name = i18n.t(`${unitKey}.name`);
    }

    if (i18n.hasTranslation(`${unitKey}.description`)) {
        localizedUnit.description = i18n.t(`${unitKey}.description`);
    }

    // Přelož lore sekci
    if (baseUnit.lore && i18n.hasTranslation(`${unitKey}.lore.description`)) {
        localizedUnit.lore = {
            description: i18n.t(`${unitKey}.lore.description`),
            equipment: i18n.t(`${unitKey}.lore.equipment`),
            origin: i18n.t(`${unitKey}.lore.origin`),
            historicalNote: i18n.t(`${unitKey}.lore.historicalNote`)
        };
    }

    return localizedUnit;
}

/**
 * Získá lokalizovaná data scénáře
 * @param {string} scenarioId - ID scénáře (např. 'sudomere_1420')
 * @param {object} baseScenario - Základní data scénáře
 * @returns {object} Scénář s přeloženými texty
 */
function getLocalizedScenario(scenarioId, baseScenario) {
    if (!baseScenario || typeof i18n === 'undefined') {
        return baseScenario;
    }

    const localizedScenario = { ...baseScenario };
    const scenarioKey = `scenarios.${scenarioId}`;

    // Varianty mají stabilní jména; překlad nikdy nepřepisuje podmínky či typ jednotky.
    const localizeVariants = (variants, key) => Object.fromEntries(Object.entries(variants).map(([name, text]) => [
        name, i18n.hasTranslation(`${key}.${name}`) ? i18n.t(`${key}.${name}`) : text
    ]));
    const localizeUnitStatus = (status, key) => ({
        ...status,
        texts: localizeVariants(status.texts || {}, `${key}.texts`)
    });

    // Základní texty
    if (i18n.hasTranslation(`${scenarioKey}.name`)) {
        localizedScenario.name = i18n.t(`${scenarioKey}.name`);
    }

    if (i18n.hasTranslation(`${scenarioKey}.date`)) {
        localizedScenario.date = i18n.t(`${scenarioKey}.date`);
    }

    if (i18n.hasTranslation(`${scenarioKey}.description`)) {
        localizedScenario.description = i18n.t(`${scenarioKey}.description`);
    }

    // Briefings
    if (baseScenario.briefing && i18n.hasTranslation(`${scenarioKey}.briefing.hussites`)) {
        localizedScenario.briefing = {
            hussites: i18n.t(`${scenarioKey}.briefing.hussites`),
            crusaders: i18n.t(`${scenarioKey}.briefing.crusaders`)
        };
    }

    // WP5: per-scénář jména stran (volitelné, jen kde je scénář definuje)
    if (baseScenario.factionNames) {
        localizedScenario.factionNames = { ...baseScenario.factionNames };
        for (const side of ['hussites', 'crusaders']) {
            const key = `${scenarioKey}.factionNames.${side}`;
            if (i18n.hasTranslation(key)) {
                localizedScenario.factionNames[side] = i18n.t(key);
            }
        }
    }

    // Victory conditions
    if (baseScenario.victoryConditions) {
        localizedScenario.victoryConditions = { ...baseScenario.victoryConditions };

        if (i18n.hasTranslation(`${scenarioKey}.objectives.primary`)) {
            localizedScenario.victoryConditions.primary = {
                ...baseScenario.victoryConditions.primary,
                description: i18n.t(`${scenarioKey}.objectives.primary`)
            };
        }

        const zoneLabelKey = baseScenario.victoryConditions.primary?.zoneLabelKey;
        const localizedZoneLabelKey = zoneLabelKey ? `mapLabels.${zoneLabelKey}` : `${scenarioKey}.objectives.zoneLabel`;
        if (baseScenario.victoryConditions.primary?.zoneLabel && i18n.hasTranslation(localizedZoneLabelKey)) {
            localizedScenario.victoryConditions.primary = {
                ...localizedScenario.victoryConditions.primary,
                zoneLabel: i18n.t(localizedZoneLabelKey)
            };
        }

        // Named targets and secondary objectives
        if (baseScenario.victoryConditions.primary?.objectives) {
            localizedScenario.victoryConditions.primary = {
                ...localizedScenario.victoryConditions.primary,
                objectives: baseScenario.victoryConditions.primary.objectives.map(objective => {
                    const key = `${scenarioKey}.objectives.targets.${objective.id}`;
                    return { ...objective, description: i18n.hasTranslation(key) ? i18n.t(key) : objective.description };
                })
            };
        }
        if (baseScenario.victoryConditions.secondary) {
            localizedScenario.victoryConditions.secondary = baseScenario.victoryConditions.secondary.map((obj, index) => {
                const key = `${scenarioKey}.objectives.secondary.${index}`;
                if (i18n.hasTranslation(key)) {
                    return {
                        ...obj,
                        description: i18n.t(key)
                    };
                }
                return obj;
            });
        }
    }

    // Phases (with nested events)
    if (baseScenario.phases) {
        localizedScenario.phases = baseScenario.phases.map((phase, phaseIndex) => {
            const phaseKey = `${scenarioKey}.phases.${phaseIndex}`;
            const localizedPhase = { ...phase };

            if (i18n.hasTranslation(`${phaseKey}.name`)) {
                localizedPhase.name = i18n.t(`${phaseKey}.name`);
                localizedPhase.description = i18n.t(`${phaseKey}.description`);
            }

            // Translate events within phase
            if (phase.events) {
                localizedPhase.events = phase.events.map((event, eventIndex) => {
                    const eventKey = `${phaseKey}.events.${eventIndex}`;
                    const localizedEvent = { ...event };

                    if (event.message && i18n.hasTranslation(`${eventKey}.message`)) {
                        localizedEvent.message = i18n.t(`${eventKey}.message`);
                    }

                    if (event.text && i18n.hasTranslation(`${eventKey}.text`)) {
                        localizedEvent.text = i18n.t(`${eventKey}.text`);
                    }

                    if (event.title && i18n.hasTranslation(`${eventKey}.title`)) {
                        localizedEvent.title = i18n.t(`${eventKey}.title`);
                    }

                    if (event.unitStatus) {
                        localizedEvent.unitStatus = localizeUnitStatus(event.unitStatus, `${eventKey}.unitStatus`);
                    }
                    if (event.forceStatus) {
                        localizedEvent.forceStatus = localizeUnitStatus(event.forceStatus, `${eventKey}.forceStatus`);
                    }

                    return localizedEvent;
                });
            }

            return localizedPhase;
        });
    }

    // Názvy míst na mapě jsou indexově zarovnané stejně jako eventy.
    // Souřadnice a offsety zůstávají v bázi, locale mění pouze text.
    if (baseScenario.mapLabels) {
        localizedScenario.mapLabels = baseScenario.mapLabels.map((label, index) => {
            const key = label.i18nKey ? `mapLabels.${label.i18nKey}` : `${scenarioKey}.mapLabels.${index}`;
            return {
                ...label,
                text: i18n.hasTranslation(key) ? i18n.t(key) : label.text
            };
        });
    }

    // Historical significance
    if (i18n.hasTranslation(`${scenarioKey}.historicalSignificance`)) {
        localizedScenario.historicalSignificance = i18n.t(`${scenarioKey}.historicalSignificance`);
    }

    // Events (messages and dialogs)
    if (baseScenario.events) {
        localizedScenario.events = baseScenario.events.map((event, index) => {
            const eventKey = `${scenarioKey}.events.${index}`;
            const localizedEvent = { ...event };

            if (event.message && i18n.hasTranslation(`${eventKey}.message`)) {
                localizedEvent.message = i18n.t(`${eventKey}.message`);
            }

            if (event.text && i18n.hasTranslation(`${eventKey}.text`)) {
                localizedEvent.text = i18n.t(`${eventKey}.text`);
            }

            return localizedEvent;
        });
    }

    // Reinforcements message
    if (baseScenario.forces) {
        localizedScenario.forces = { ...baseScenario.forces };

        if (baseScenario.forces.hussites?.reinforcements?.message) {
            localizedScenario.forces.hussites = {
                ...baseScenario.forces.hussites,
                reinforcements: {
                    ...baseScenario.forces.hussites.reinforcements,
                    message: i18n.hasTranslation(`${scenarioKey}.reinforcements.hussites`)
                        ? i18n.t(`${scenarioKey}.reinforcements.hussites`)
                        : baseScenario.forces.hussites.reinforcements.message
                }
            };
        }

        if (baseScenario.forces.crusaders?.reinforcements?.message) {
            if (!localizedScenario.forces.crusaders) {
                localizedScenario.forces.crusaders = { ...baseScenario.forces.crusaders };
            }
            localizedScenario.forces.crusaders.reinforcements = {
                ...baseScenario.forces.crusaders.reinforcements,
                message: i18n.hasTranslation(`${scenarioKey}.reinforcements.crusaders`)
                    ? i18n.t(`${scenarioKey}.reinforcements.crusaders`)
                    : baseScenario.forces.crusaders.reinforcements.message
            };
        }
    }

    // Samostatné skupiny posil (Vyšehrad, Most) nejsou pod forces.*.
    if (baseScenario.reinforcements) {
        localizedScenario.reinforcements = Object.fromEntries(
            Object.entries(baseScenario.reinforcements).map(([group, reinforcements]) => {
                const key = `${scenarioKey}.reinforcementGroups.${group}`;
                return [group, {
                    ...reinforcements,
                    message: i18n.hasTranslation(key) ? i18n.t(key) : reinforcements.message
                }];
            })
        );
    }

    // Tutorial steps
    if (baseScenario.tutorialSteps) {
        localizedScenario.tutorialSteps = baseScenario.tutorialSteps.map((step, index) => {
            const stepKey = `${scenarioKey}.steps.${index}`;
            if (i18n.hasTranslation(`${stepKey}.title`)) {
                return {
                    ...step,
                    title: i18n.t(`${stepKey}.title`),
                    text: i18n.t(`${stepKey}.text`)
                };
            }
            return step;
        });
    }

    // Debriefing
    if (baseScenario.debriefing) {
        localizedScenario.debriefing = { ...baseScenario.debriefing };

        if (i18n.hasTranslation(`${scenarioKey}.debriefing.victory`)) {
            localizedScenario.debriefing.victory = i18n.t(`${scenarioKey}.debriefing.victory`);
        }

        if (i18n.hasTranslation(`${scenarioKey}.debriefing.defeat`)) {
            localizedScenario.debriefing.defeat = i18n.t(`${scenarioKey}.debriefing.defeat`);
        }
        if (baseScenario.debriefing.victoryVariants) {
            localizedScenario.debriefing.victoryVariants = localizeVariants(
                baseScenario.debriefing.victoryVariants, `${scenarioKey}.debriefing.victoryVariants`);
        }
        if (baseScenario.debriefing.unitStatus) {
            localizedScenario.debriefing.unitStatus = localizeUnitStatus(
                baseScenario.debriefing.unitStatus, `${scenarioKey}.debriefing.unitStatus`);
        }
    }

    return localizedScenario;
}

/**
 * Získá lokalizovaná data battle lore
 * @param {string} battleId - ID bitvy (např. 'sudomere_1420')
 * @param {object} baseLore - Základní lore data
 * @returns {object} Lore s přeloženými texty
 */
function getLocalizedBattleLore(battleId, baseLore) {
    if (!baseLore || typeof i18n === 'undefined') {
        return baseLore;
    }

    const localizedLore = { ...baseLore };
    const loreKey = `battleLore.${battleId}`;

    // Základní texty
    const simpleFields = ['name', 'date', 'location', 'terrain', 'weather', 'outcome', 'aftermath', 'significance', 'reliability'];
    simpleFields.forEach(field => {
        if (i18n.hasTranslation(`${loreKey}.${field}`)) {
            localizedLore[field] = i18n.t(`${loreKey}.${field}`);
        }
    });

    // Strany konfliktu - velitelé jsou v locale JSON uloženi jako pole,
    // starší formát byl string oddělený čárkami; podpoř obojí
    const asCommanderList = (val) => Array.isArray(val) ? val : String(val).split(', ');

    for (const side of ['hussiteSide', 'enemySide']) {
        if (!baseLore[side]) continue;
        localizedLore[side] = { ...baseLore[side] };
        for (const field of ['commanders', 'strength', 'composition']) {
            const key = `${loreKey}.${side}.${field}`;
            if (!i18n.hasTranslation(key)) continue;
            const value = i18n.t(key);
            localizedLore[side][field] = field === 'commanders' ? asCommanderList(value) : value;
        }
    }

    // Casualties
    if (baseLore.casualties && i18n.hasTranslation(`${loreKey}.casualties.hussites`)) {
        localizedLore.casualties = {
            hussites: i18n.t(`${loreKey}.casualties.hussites`),
            enemy: i18n.t(`${loreKey}.casualties.enemy`)
        };
    }

    // Quotes
    if (baseLore.quotes) {
        localizedLore.quotes = baseLore.quotes.map((quote, index) => {
            const quoteKey = `${loreKey}.quotes.${index}`;
            if (i18n.hasTranslation(`${quoteKey}.text`)) {
                return {
                    ...quote,
                    text: i18n.t(`${quoteKey}.text`),
                    source: i18n.t(`${quoteKey}.source`)
                };
            }
            return quote;
        });
    }

    // Trivia
    if (baseLore.trivia) {
        localizedLore.trivia = baseLore.trivia.map((item, index) => {
            const triviaKey = `${loreKey}.trivia.${index}`;
            if (i18n.hasTranslation(triviaKey)) {
                return i18n.t(triviaKey);
            }
            return item;
        });
    }

    // P8: kontrafaktuální kronika protistrany. Pole counter* používá
    // Sion pro souběh kronikářské a archeologické verze.
    if (baseLore.enemyChronicle) {
        localizedLore.enemyChronicle = { ...baseLore.enemyChronicle };
        for (const field of ['text', 'source', 'counterText', 'counterSource']) {
            const key = `enemyChronicles.${battleId}.${field}`;
            if (i18n.hasTranslation(key)) {
                localizedLore.enemyChronicle[field] = i18n.t(key);
            }
        }
    }

    return localizedLore;
}

/**
 * Aktualizuje všechna zobrazená data po změně jazyka
 */
function updateGameDataLocalization() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const activeGame = window.game;
    if (activeGame) {
        // Jednotky si při vytvoření ukládají lokalizované texty. Při změně
        // jazyka je proto obnovíme z neměnné šablony, bojové statistiky zůstanou.
        if (Array.isArray(activeGame.units) && typeof UnitTypes !== 'undefined') {
            activeGame.units.forEach(unit => {
                const template = UnitTypes[unit.type];
                if (!template) return;
                const localized = getLocalizedUnit(unit.type, template);
                unit.name = localized.name;
                unit.description = localized.description;
            });
        }

        // Probíhající scénář obsahuje převedené souřadnice a dynamický stav,
        // takže aktualizujeme pouze jeho textovou vrstvu.
        const scenarioId = activeGame.currentScenario?.id;
        if (scenarioId && typeof ScenarioManager !== 'undefined') {
            const baseScenario = ScenarioManager.getScenario(scenarioId);
            const localized = getLocalizedScenario(scenarioId, baseScenario);
            const scenario = activeGame.currentScenario;

            for (const field of ['name', 'date', 'description', 'briefing', 'debriefing', 'historicalSignificance', 'factionNames']) {
                if (localized[field] !== undefined) scenario[field] = localized[field];
            }

            if (localized.victoryConditions && scenario.victoryConditions) {
                const localizedPrimary = localized.victoryConditions.primary;
                const currentPrimary = scenario.victoryConditions.primary;
                if (localizedPrimary && currentPrimary) {
                    currentPrimary.description = localizedPrimary.description;
                    currentPrimary.zoneLabel = localizedPrimary.zoneLabel || '';
                    if (activeGame.hexGrid) activeGame.hexGrid.escapeZoneLabel = currentPrimary.zoneLabel;
                    (currentPrimary.objectives || []).forEach(objective => {
                        const translated = localizedPrimary.objectives?.find(item => item.id === objective.id);
                        if (translated) objective.description = translated.description;
                    });
                }
                (scenario.victoryConditions.secondary || []).forEach((objective, index) => {
                    const translated = localized.victoryConditions.secondary?.[index];
                    if (translated) objective.description = translated.description;
                });
            }

            scenario.phases = localized.phases || scenario.phases;
            if (activeGame.currentPhase) {
                activeGame.currentPhase = scenario.phases.find(phase => phase.id === activeGame.currentPhase.id)
                    || ScenarioManager.getCurrentPhase(scenario, activeGame.turnNumber);
                const phaseName = document.getElementById('phase-name');
                const phaseDescription = document.getElementById('phase-description');
                if (phaseName) {
                    phaseName.textContent = activeGame.choralActive
                        ? `⚔️ ${i18n.t('game.choralActive')}`
                        : (activeGame.currentPhase?.name || '');
                }
                if (phaseDescription) {
                    phaseDescription.textContent = activeGame.choralActive
                        ? i18n.t('game.choralEffect', { turns: activeGame.choralTurnsRemaining })
                        : (activeGame.currentPhase?.description || '');
                }
            }

            scenario.mapLabels = localized.mapLabels || scenario.mapLabels;
            if (activeGame.hexGrid && Array.isArray(activeGame.hexGrid.mapLabels)) {
                activeGame.hexGrid.mapLabels.forEach((label, index) => {
                    if (localized.mapLabels?.[index]) label.text = localized.mapLabels[index].text;
                });
            }

            // Posily ještě mohou dorazit v dalších kolech. Měníme jen jejich
            // popisky, nikoli souřadnice a stav již zpracovaných událostí.
            for (const side of ['hussites', 'crusaders']) {
                const current = scenario.forces?.[side]?.reinforcements;
                const translated = localized.forces?.[side]?.reinforcements;
                if (current && translated) current.message = translated.message;
            }
            for (const [group, current] of Object.entries(scenario.reinforcements || {})) {
                const translated = localized.reinforcements?.[group];
                if (translated) current.message = translated.message;
            }

            const battleName = document.getElementById('battle-name');
            const battleDate = document.getElementById('battle-date');
            if (battleName) battleName.textContent = scenario.name;
            if (battleDate) battleDate.textContent = scenario.date;
        }

        if (typeof activeGame.view?.refreshEventNotifications === 'function') {
            activeGame.view.refreshEventNotifications();
        }

        if (typeof activeGame.updateUI === 'function') activeGame.updateUI();
        if (typeof activeGame.updateUnitPanel === 'function') activeGame.updateUnitPanel(activeGame.selectedUnit || null);
        if (typeof activeGame.render === 'function') activeGame.render();

        const aiIndicator = document.getElementById('ai-thinking');
        if (aiIndicator && !aiIndicator.classList.contains('hidden')) {
            activeGame.showAIThinking(true); // re-set textu indikátoru v novém jazyce
        }
    }

    // Pokud je otevřený help modal s jednotkami, aktualizuj ho
    const helpModal = document.getElementById('help-modal');
    if (helpModal && !helpModal.classList.contains('hidden')) {
        if (typeof populateHelpUnits === 'function') {
            populateHelpUnits(helpModal.dataset.unitScope === 'battle' ? activeGame : null);
        }
        // Aktualizuj také encyklopedii
        if (typeof updateEncyclopediaContent === 'function') {
            updateEncyclopediaContent();
        }
    }

    const aboutModal = document.getElementById('about-modal');
    if (aboutModal && !aboutModal.classList.contains('hidden') && typeof renderAboutModal === 'function') {
        renderAboutModal();
    }

    // Výběr mise používá uzávěr v main.js; ten se obnoví přes událost
    // languageChanged vyslanou po dokončení tohoto kroku.
}
