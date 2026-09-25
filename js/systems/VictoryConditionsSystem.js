// VictoryConditionsSystem - Správa vítězných a porážkových podmínek
class VictoryConditionsSystem {
    constructor(game) {
        this.game = game;
    }

    // Zaloguje důvod výsledku A uloží ho pro game-over obrazovku.
    // Každé místo, které rozhoduje o konci hry, musí jít tudy - jinak
    // hráč v modalu neuvidí, PROČ vyhrál/prohrál (jen narativní text)
    outcome(text) {
        this.game.gameOverReason = text;
        this.game.addLog(text, 'turn');
        return text;
    }

    // Scénářová alternativa: původní úkol přestane být nutný, pokud z
    // nepřátelské polní armády zůstanou pouze velitelé. Volitelný typ
    // hráčova velitele dovoluje scénáři vyžadovat jeho skutečné přežití.
    fieldArmyAlternativeAchieved(primary, playerFaction, enemyFaction) {
        const alternative = primary?.alternative;
        if (alternative?.type !== 'eliminate_field_army') return false;
        const enemySurvivors = this.game.units.filter(unit =>
            unit.faction === enemyFaction && unit.health > 0 && !unit.escaped
        );
        if (enemySurvivors.length === 0 || !enemySurvivors.every(unit => unit.isCommander?.())) return false;
        if (!alternative.survivingCommander) return true;
        return this.game.units.some(unit =>
            unit.faction === playerFaction && unit.type === alternative.survivingCommander &&
            unit.health > 0 && !unit.escaped
        );
    }

    // Hlavní kontrola vítězství
    checkVictory() {
        if (this.game.gameState !== 'playing') return;
        // Tutoriál má vlastní systém ukončení
        if (this.game.isTutorial) {
            const crusadersAlive = this.game.units.filter(u => u.faction === 'crusaders' && u.health > 0);
            if (crusadersAlive.length === 0) {
                this.game.tutorialSystem.triggerTutorialEvent('all_enemies_dead');
            }
            return;
        }

        const hussitesAlive = this.game.units.filter(u => u.faction === 'hussites' && u.health > 0);
        const crusadersAlive = this.game.units.filter(u => u.faction === 'crusaders' && u.health > 0);

        // Standardní kontrola - všechny jednotky jedné strany mrtvé
        if (hussitesAlive.length === 0) {
            this.outcome(i18n.t('gameover.reasonAllUnitsLost'));
            this.evaluateSecondaryConditions('crusaders');
            this.game.showVictory('crusaders');
            return;
        } else if (crusadersAlive.length === 0) {
            this.outcome(i18n.t('gameover.reasonEnemyDestroyed'));
            this.evaluateSecondaryConditions('hussites');
            this.game.showVictory('hussites');
            return;
        }

        // Kontrola defeatConditions ze scénáře
        if (this.game.currentScenario && this.game.currentScenario.defeatConditions) {
            const defeat = this.game.currentScenario.defeatConditions;
            const playerFaction = this.game.currentScenario.playerFaction || 'hussites';
            const enemyFaction = playerFaction === 'hussites' ? 'crusaders' : 'hussites';

            // Smrt velitele = okamžitá porážka
            if (defeat.primary && defeat.primary.type === 'commander_death') {
                const playerCommanders = this.game.units.filter(u =>
                    u.faction === playerFaction && u.unitClass === 'commander' && u.health > 0
                );
                if (playerCommanders.length === 0) {
                    this.outcome(i18n.t('gameLog.commanderFallen'));
                    this.game.showVictory(enemyFaction);
                    return;
                }
            }

            // Ztráta klíčových pozic = porážka
            if (defeat.alternative && defeat.alternative.type === 'lose_positions') {
                const positions = defeat.alternative.positions || [];
                const lostAll = positions.every(pos => {
                    const unit = this.game.getUnitAt(pos[0], pos[1]);
                    return unit && unit.faction === enemyFaction;
                });
                if (lostAll) {
                    this.outcome(i18n.t('gameLog.keyPositionsLost'));
                    this.game.showVictory(enemyFaction);
                    return;
                }
            }

            // Ztráta příliš mnoha jednotek
            if (defeat.primary && defeat.primary.type === 'lose_percent') {
                const playerAlive = this.game.units.filter(u => u.faction === playerFaction && u.health > 0);
                const lostPercent = ((this.game.initialPlayerUnits - playerAlive.length) / this.game.initialPlayerUnits) * 100;
                if (lostPercent >= defeat.primary.percent) {
                    this.outcome(i18n.t('gameLog.tooManyCasualties', { percent: Math.round(lostPercent) }));
                    this.game.showVictory(enemyFaction);
                    return;
                }
            }
        }
    }

    // Vyhodnocení sekundárních podmínek
    evaluateSecondaryConditions(winner) {
        if (!this.game.currentScenario || !this.game.currentScenario.victoryConditions) return;
        const conditions = this.game.currentScenario.victoryConditions;
        if (!conditions.secondary) return;

        const playerFaction = this.game.currentScenario.playerFaction || 'hussites';
        const enemyFaction = playerFaction === 'hussites' ? 'crusaders' : 'hussites';
        const isVictory = (winner === playerFaction);

        if (!isVictory) {
            this.game.secondaryResults = [];
            return;
        }

        let secondaryResults = [];
        for (const sec of conditions.secondary) {
            let achieved = false;
            switch (sec.type) {
                case 'kill_commander':
                    const enemyCommanders = this.game.units.filter(u =>
                        u.faction === enemyFaction &&
                        u.unitClass === 'commander' &&
                        (!sec.target || u.type === sec.target)
                    );
                    achieved = enemyCommanders.length > 0 && enemyCommanders.every(c => c.health <= 0);
                    break;
                case 'no_losses':
                    achieved = this.game.unitsLost === 0;
                    break;
                case 'max_losses':
                    achieved = this.game.unitsLost <= (sec.maxLosses || 0);
                    break;
                case 'fast_victory':
                    achieved = this.game.turnNumber <= (sec.maxTurns || 5);
                    break;
                case 'hold_position':
                    // Kontrola zda hráč drží určité pozice
                    const holdPositions = sec.positions || [];
                    const heldCount = holdPositions.filter(pos => {
                        const unit = this.game.getUnitAt(pos[0], pos[1]);
                        return unit && unit.faction === playerFaction && unit.health > 0;
                    });
                    achieved = heldCount.length >= Math.ceil(holdPositions.length / 2);
                    break;
                case 'capture_position':
                    // Kontrola zda hráč obsadil určité pozice
                    const capturePos = sec.positions || [];
                    const capturedCount = capturePos.filter(pos => {
                        const unit = this.game.getUnitAt(pos[0], pos[1]);
                        return unit && unit.faction === playerFaction && unit.health > 0;
                    });
                    achieved = capturedCount.length >= (sec.count || capturePos.length);
                    break;
                case 'destroy_percent':
                    // Kontrola zda hráč zničil X% nepřátel
                    const destroyedPercentSec = (this.game.enemiesKilled / this.game.initialEnemyUnits) * 100;
                    achieved = destroyedPercentSec >= (sec.percent || 50);
                    break;
                case 'capture_wagons':
                    // Kontrola zda hráč zajal nepřátelské vozy
                    const capturedWagons = this.game.units.filter(u =>
                        u.faction === enemyFaction &&
                        u.health <= 0 &&
                        u.unitClass === 'wagon'
                    );
                    achieved = capturedWagons.length >= (sec.count || 1);
                    break;
                case 'survive_commander':
                    // Kontrola zda velitel přežil
                    const playerCommanders = this.game.units.filter(u =>
                        u.faction === playerFaction &&
                        u.unitClass === 'commander' &&
                        u.health > 0
                    );
                    achieved = playerCommanders.length > 0;
                    break;
                case 'eliminate_commander':
                case 'kill_commander_alt':
                    // Kontrola zda nepřátelský velitel byl zabit/zajat
                    const enemyCommandersSec = this.game.units.filter(u =>
                        u.faction === enemyFaction &&
                        u.unitClass === 'commander'
                    );
                    achieved = enemyCommandersSec.every(c => c.health <= 0);
                    break;
                case 'protect_wagons':
                    // Kontrola zda hráč uchránil své vozy
                    const playerWagons = this.game.units.filter(u =>
                        u.faction === playerFaction &&
                        u.unitClass === 'wagon' &&
                        u.health > 0
                    );
                    achieved = playerWagons.length >= (sec.minWagons || 1);
                    break;
                case 'save_wagons':
                    // Alias pro protect_wagons
                    const savedWagons = this.game.units.filter(u =>
                        u.faction === playerFaction &&
                        u.unitClass === 'wagon' &&
                        u.health > 0
                    );
                    achieved = savedWagons.length >= (sec.count || 1);
                    break;
                case 'protect_artillery':
                    // Kontrola zda hráč uchránil své děla
                    const playerArtillery = this.game.units.filter(u =>
                        u.faction === playerFaction &&
                        u.unitClass === 'artillery' &&
                        u.health > 0
                    );
                    achieved = playerArtillery.length >= (sec.minCount || 1);
                    break;
                case 'both_objectives':
                    // Special case - vyžaduje splnění všech ostatních sekundárních cílů
                    // Toto je spíš flavor text, vždy achieved = true
                    achieved = true;
                    break;
            }
            secondaryResults.push({ ...sec, achieved });
            if (achieved) {
                this.game.addLog(i18n.t('gameLog.objectiveComplete', { description: sec.description }), 'turn');
            }
        }
        this.game.secondaryResults = secondaryResults;
    }

    // Kontrola vítězných podmínek scénáře (po uplynutí času)
    checkScenarioVictoryConditions() {
        if (this.game.gameState !== 'playing') return;
        if (!this.game.currentScenario) {
            console.warn('[VICTORY] checkScenarioVictoryConditions: No current scenario!');
            return;
        }

        if (!this.game.currentScenario.victoryConditions) {
            console.warn(`[VICTORY] checkScenarioVictoryConditions: Scenario "${this.game.currentScenario.name}" has no victory conditions!`);
            return;
        }

        const conditions = this.game.currentScenario.victoryConditions;
        const playerFaction = this.game.currentScenario.playerFaction || 'hussites';
        const enemyFaction = playerFaction === 'hussites' ? 'crusaders' : 'hussites';

        const playerUnits = this.game.units.filter(u => u.faction === playerFaction && u.health > 0);
        const enemyUnits = this.game.units.filter(u => u.faction === enemyFaction && u.health > 0);

        const primary = conditions.primary;
        let victoryAchieved = false;

        switch (primary.type) {
            case 'survive':
                const minPercent = primary.minUnitsPercent || 0;
                // Posily se nepočítají - mise měří, kolik z PŮVODNÍ obrany přežilo.
                // Bez tohoto by příchod posil nafoukl procento nad 100 % ("160% jednotek").
                const originalSurvivors = playerUnits.filter(u => !u.isReinforcement).length;
                const currentPercent = Math.min(100, (originalSurvivors / this.game.initialPlayerUnits) * 100);
                const requiredTurnsSurvive = primary.turns || this.game.currentScenario.maxTurns;

                // Kontrola proběhne až po DOKONČENÍ požadovaného počtu kol.
                // turnNumber se zvyšuje při přepnutí na husity - vyhodnocení
                // při turnNumber == required by nepřítele připravilo o jeho
                // poslední tah ("přežij 12 kol" by znamenalo 11 tahů nepřítele)
                if (this.game.turnNumber <= requiredTurnsSurvive) {
                    // Ještě neuplynul požadovaný čas - pokračujeme ve hře
                    // (porážka před vypršením času jen pokud zemřou všechny jednotky - to řeší checkVictory)
                    return;
                }

                // Uplynul požadovaný čas - vyhodnotíme podle procenta jednotek
                // Některé obranné scénáře dovolují draze zaplacené vítězství,
                // pokud na bojišti zůstal už jen nepřátelský velitel bez armády.
                // Je to výslovně datová alternativa, globální význam velitelů
                // ani ostatní scénáře tím neměníme.
                const fieldArmyEliminated = this.fieldArmyAlternativeAchieved(primary, playerFaction, enemyFaction);
                const requiredEnemyDefeated = !primary.requiredEnemyType ||
                    !enemyUnits.some(unit => unit.type === primary.requiredEnemyType);
                victoryAchieved = (currentPercent >= minPercent || fieldArmyEliminated) && requiredEnemyDefeated;
                // Odehrálo se requiredTurnsSurvive kol (turnNumber už je o 1 dál)
                this.game.gameOverTurn = requiredTurnsSurvive;

                if (fieldArmyEliminated && currentPercent < minPercent) {
                    this.outcome(i18n.t('gameLog.victoryFieldArmyEliminated', {
                        turn: requiredTurnsSurvive,
                        percent: Math.round(currentPercent)
                    }));
                } else if (victoryAchieved) {
                    this.outcome(i18n.t('gameLog.victorySurvival', { turn: requiredTurnsSurvive, percent: Math.round(currentPercent) }));
                } else if (!requiredEnemyDefeated && currentPercent >= minPercent) {
                    this.outcome(i18n.t('gameLog.defeatSurvivalTarget', {
                        target: i18n.t(`units.${primary.requiredEnemyType}.name`)
                    }));
                } else {
                    this.outcome(i18n.t('gameLog.defeatSurvival', { percent: Math.round(currentPercent), required: minPercent }));
                }
                break;

            case 'destroy_percent':
                const destroyPercent = primary.percent || 50;
                const destroyedPercent = (this.game.enemiesKilled / this.game.initialEnemyUnits) * 100;
                victoryAchieved = destroyedPercent >= destroyPercent;

                if (victoryAchieved) {
                    this.outcome(i18n.t('gameLog.victoryDestruction', { percent: Math.round(destroyedPercent) }));
                } else {
                    this.outcome(i18n.t('gameLog.defeatDestruction', { percent: Math.round(destroyedPercent), required: destroyPercent }));
                }
                break;

            case 'hold_position':
                const requiredPositions = primary.positions || [];

                // Kontrola, zda nepřítel obsadil nějakou klíčovou pozici
                const enemyOccupiedPositions = requiredPositions.filter(pos => {
                    const unit = this.game.getUnitAt(pos[0], pos[1]);
                    return unit && unit.faction === enemyFaction && unit.health > 0;
                });

                const requiredTurnsHold = primary.turns || this.game.currentScenario.maxTurns;

                // Kontrola musí proběhnout až po DOKONČENÍ požadovaného počtu
                // kol (viz komentář u 'survive'); porážka při ztrátě pozice
                // platí průběžně
                if (this.game.turnNumber <= requiredTurnsHold) {
                    // Porážka pokud nepřítel obsadil JAKOUKOLI klíčovou pozici
                    if (enemyOccupiedPositions.length > 0) {
                        this.outcome(i18n.t('gameLog.keyPositionsLost'));
                        this.game.showVictory(enemyFaction);
                        return;
                    }
                    // Jinak pokračuje hra (i když je pozice prázdná)
                    return;
                }

                // Uplynul požadovaný čas - vyhodnotíme podle obsazených pozic nepřítelem
                // Vítězství pokud nepřítel neobsadil pozice
                victoryAchieved = enemyOccupiedPositions.length === 0;
                this.game.gameOverTurn = requiredTurnsHold;

                if (victoryAchieved) {
                    this.outcome(i18n.t('gameLog.victoryHoldPosition', { turn: requiredTurnsHold }));
                } else {
                    this.outcome(i18n.t('gameLog.keyPositionsLost'));
                }
                break;

            case 'escape': {
                const required = primary.unitsRequired || 5;
                const escaped = this.game.escapedUnits || 0;
                const historicalVictory = escaped >= required;
                const deadline = this.game.currentScenario.maxTurns;
                // Únik může zvítězit ihned, scénářová alternativa se však
                // posuzuje teprve po dohrání posledního kola.
                if (!historicalVictory && deadline && this.game.turnNumber <= deadline) return;
                const fieldArmyEliminated = !historicalVictory &&
                    this.fieldArmyAlternativeAchieved(primary, playerFaction, enemyFaction);
                victoryAchieved = historicalVictory || fieldArmyEliminated;
                if (deadline && this.game.turnNumber > deadline) this.game.gameOverTurn = deadline;

                if (fieldArmyEliminated) {
                    this.outcome(i18n.t('gameLog.victoryAlternativeFieldArmy'));
                } else if (historicalVictory) {
                    this.outcome(i18n.t('gameLog.victoryEscape', { escaped: escaped }));
                } else {
                    this.outcome(i18n.t('gameLog.defeatEscape', { escaped: escaped, required: required }));
                }
                break;
            }

            case 'survive_turns':
                const requiredTurns = primary.turns || this.game.currentScenario.maxTurns;
                // Průběžná kontrola není porážka: nepřítel musí odehrát i poslední kolo.
                if (this.game.turnNumber <= requiredTurns) return;
                // > místo >=: kolo musí být dokončené (viz komentář u 'survive')
                victoryAchieved = this.game.turnNumber > requiredTurns;
                this.game.gameOverTurn = requiredTurns;

                if (victoryAchieved) {
                    this.outcome(i18n.t('gameLog.victorySurviveTurns', { turns: requiredTurns }));
                } else {
                    this.outcome(i18n.t('gameLog.defeatSurviveTurns', { turns: requiredTurns }));
                }
                break;

            case 'capture_position':
                const capturePositions = primary.positions || [];
                const captureCount = primary.count || capturePositions.length;
                const capturedPositions = capturePositions.filter(pos => {
                    const unit = this.game.getUnitAt(pos[0], pos[1]);
                    return unit && unit.faction === playerFaction && unit.health > 0;
                });
                victoryAchieved = capturedPositions.length >= captureCount;

                if (victoryAchieved) {
                    this.outcome(i18n.t('gameLog.victoryCapturePosition', { count: capturedPositions.length }));
                } else {
                    this.outcome(i18n.t('gameLog.defeatCapturePosition', { count: capturedPositions.length, required: captureCount }));
                }
                break;

            case 'breakthrough': {
                // P5: dopředný průlom - obsaď >=count pozic hluboko v území nepřítele
                // do kola `deadline`, jinak se nepřítel přeskupí a bitva je ztracena.
                // Nutí opustit hradbu a postupovat (páruje s P4 mobilní hradbou).
                const btPositions = primary.positions || [];
                const btNeed = primary.count || 1;
                const btDeadline = primary.deadline || this.game.currentScenario.maxTurns;
                const btHeld = btPositions.filter(pos => {
                    const u = this.game.getUnitAt(pos[0], pos[1]);
                    return u && u.faction === playerFaction && u.health > 0;
                }).length;

                if (btHeld >= btNeed) {
                    victoryAchieved = true;
                    this.game.gameOverTurn = this.game.turnNumber;
                    this.outcome(i18n.t('gameLog.victoryBreakthrough', { count: btHeld }));
                    break; // -> vyhodnocení vítězství níže (showVictory hráče)
                }
                if (this.game.turnNumber > btDeadline) {
                    this.game.gameOverTurn = btDeadline;
                    this.outcome(i18n.t('gameLog.defeatBreakthrough', { deadline: btDeadline }));
                    this.game.showVictory(enemyFaction);
                    return;
                }
                return; // ještě je čas, hra pokračuje
            }

            case 'dual_objective':
                const objectives = primary.objectives || [];
                let anyObjectiveAchieved = false;
                let achievedObjectives = [];

                for (const obj of objectives) {
                    let objAchieved = false;
                    if (obj.type === 'capture_position') {
                        const held = this.game.objectiveHeldTurns && this.game.objectiveHeldTurns[obj.id];
                        objAchieved = held >= (obj.holdTurns || 1);
                    } else if (obj.type === 'hold_position') {
                        const positions = obj.positions || [];
                        const allHeld = positions.every(([col, row]) => {
                            const unit = this.game.getUnitAt(col, row);
                            return unit && unit.faction === playerFaction && unit.health > 0;
                        });
                        objAchieved = allHeld;
                    }
                    if (objAchieved) {
                        anyObjectiveAchieved = true;
                        achievedObjectives.push(obj.description);
                    }
                }

                victoryAchieved = anyObjectiveAchieved;
                if (victoryAchieved) {
                    this.outcome(i18n.t('gameLog.victoryDualObjective', { objectives: achievedObjectives.join(', ') }));
                } else {
                    this.outcome(i18n.t('gameLog.defeatDualObjective'));
                }
                break;

            case 'destroy_or_rout':
                // Vítězství pokud nepřítel je zničen NEBO prchá (morální zlom)
                const enemyRouting = enemyUnits.filter(u => u.isRouting).length;
                const enemyDestroyed = (this.game.enemiesKilled / this.game.initialEnemyUnits) * 100;
                victoryAchieved = (enemyDestroyed >= (primary.percent || 50)) ||
                    (this.game.moraleBroken && enemyRouting > enemyUnits.length / 2);

                if (victoryAchieved) {
                    if (this.game.moraleBroken) {
                        this.outcome(i18n.t('gameLog.armyRouting'));
                    } else {
                        this.outcome(i18n.t('gameLog.victoryDestroyArmy'));
                    }
                } else {
                    this.outcome(i18n.t('gameLog.defeatDestroyOrRout'));
                }
                break;

            case 'dual_objective_battle':
                // Alias pro dual_objective (stejná logika)
                const battleObjectives = primary.objectives || [];
                let anyBattleObjectiveAchieved = false;
                let achievedBattleObjectives = [];

                for (const obj of battleObjectives) {
                    let objAchieved = false;
                    if (obj.type === 'capture_position') {
                        const heldBattle = this.game.objectiveHeldTurns && this.game.objectiveHeldTurns[obj.id];
                        objAchieved = heldBattle >= (obj.holdTurns || 1);
                    } else if (obj.type === 'hold_position') {
                        const positions = obj.positions || [];
                        const allHeldBattle = positions.every(([col, row]) => {
                            const unit = this.game.getUnitAt(col, row);
                            return unit && unit.faction === playerFaction && unit.health > 0;
                        });
                        objAchieved = allHeldBattle;
                    }
                    if (objAchieved) {
                        anyBattleObjectiveAchieved = true;
                        achievedBattleObjectives.push(obj.description);
                    }
                }

                victoryAchieved = anyBattleObjectiveAchieved;
                if (victoryAchieved) {
                    this.outcome(i18n.t('gameLog.victoryDualObjective', { objectives: achievedBattleObjectives.join(', ') }));
                } else {
                    this.outcome(i18n.t('gameLog.defeatDualObjective'));
                }
                break;

            case 'tutorial_complete':
                // Tutoriál má vlastní systém - toto je jen fallback
                victoryAchieved = true;
                this.game.addLog(i18n.t('tutorial.completed'), 'turn');
                break;

            default:
                victoryAchieved = false;
        }

        // Vyhodnocení výsledku
        if (victoryAchieved) {
            this.evaluateSecondaryConditions(playerFaction);
            this.game.showVictory(playerFaction);
        } else {
            this.game.showVictory(enemyFaction);
        }
    }

    // Průběžná kontrola vítězství - pouze pro splnění podmínky (ne porážka)
    // Používá se pro destroy_percent, destroy_or_rout a capture_position,
    // které jinak čekají na vypršení maxTurns
    checkMidGameVictory() {
        if (this.game.gameState !== 'playing') return;
        if (!this.game.currentScenario?.victoryConditions?.primary) return;

        const primary = this.game.currentScenario.victoryConditions.primary;
        const playerFaction = this.game.currentScenario.playerFaction || 'hussites';
        const enemyFaction = playerFaction === 'hussites' ? 'crusaders' : 'hussites';

        let victoryAchieved = false;

        switch (primary.type) {
            case 'destroy_percent': {
                const percent = primary.percent || 50;
                const destroyed = (this.game.enemiesKilled / this.game.initialEnemyUnits) * 100;
                victoryAchieved = destroyed >= percent;
                if (victoryAchieved) {
                    this.outcome(i18n.t('gameLog.victoryDestruction', { percent: Math.round(destroyed) }));
                }
                break;
            }
            case 'destroy_or_rout': {
                const enemyUnits = this.game.units.filter(u => u.faction === enemyFaction && u.health > 0);
                const enemyRouting = enemyUnits.filter(u => u.isRouting).length;
                const destroyed = (this.game.enemiesKilled / this.game.initialEnemyUnits) * 100;
                victoryAchieved = (destroyed >= (primary.percent || 50)) ||
                    (this.game.moraleBroken && enemyRouting > enemyUnits.length / 2);
                if (victoryAchieved) {
                    this.outcome(this.game.moraleBroken ?
                        i18n.t('gameLog.armyRouting') :
                        i18n.t('gameLog.victoryDestroyArmy'));
                }
                break;
            }
            case 'capture_position': {
                const positions = primary.positions || [];
                const count = primary.count || positions.length;
                const captured = positions.filter(pos => {
                    const unit = this.game.getUnitAt(pos[0], pos[1]);
                    return unit && unit.faction === playerFaction && unit.health > 0;
                });
                victoryAchieved = captured.length >= count;
                if (victoryAchieved) {
                    this.outcome(i18n.t('gameLog.victoryCapturePosition', { count: captured.length }));
                }
                break;
            }
        }

        if (victoryAchieved) {
            this.evaluateSecondaryConditions(playerFaction);
            this.game.showVictory(playerFaction);
        }
    }

    // Kontrola progressu dual objective
    checkDualObjectiveProgress() {
        if (this.game.gameState !== 'playing') return;
        if (!this.game.currentScenario || !this.game.currentScenario.victoryConditions) return;
        const conditions = this.game.currentScenario.victoryConditions;
        if (!conditions.primary || conditions.primary.type !== 'dual_objective') return;

        const playerFaction = this.game.currentScenario.playerFaction || 'hussites';
        const objectives = conditions.primary.objectives || [];

        if (!this.game.objectiveHeldTurns) {
            this.game.objectiveHeldTurns = {};
        }

        for (const obj of objectives) {
            if (obj.type === 'capture_position') {
                const positions = obj.positions || [];
                const allHeld = positions.every(([col, row]) => {
                    const unit = this.game.getUnitAt(col, row);
                    return unit && unit.faction === playerFaction && unit.health > 0;
                });

                if (allHeld) {
                    this.game.objectiveHeldTurns[obj.id] = (this.game.objectiveHeldTurns[obj.id] || 0) + 1;

                    if (this.game.objectiveHeldTurns[obj.id] >= obj.holdTurns) {
                        this.outcome(i18n.t('gameLog.victoryObjectiveHeld', { description: obj.description }));
                        this.evaluateSecondaryConditions(playerFaction);
                        this.game.showVictory(playerFaction);
                        return;
                    }
                } else {
                    this.game.objectiveHeldTurns[obj.id] = 0;
                }
            }
        }
    }
}
