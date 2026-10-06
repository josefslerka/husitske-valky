// MoraleSystem - Správa morálky, útěku a routing jednotek
class MoraleSystem {
    constructor(game) {
        this.game = game;
        this.quickEscapeData = null;
        this.playerMoraleWarningShown = false; // Flag pro zamezení opakování hlášek
    }

    // „Bez milosti“ není obecný stav celé bitvy. Scénář může účinek
    // odložit na konkrétní událost a omezit na historickou past/oblast.
    // Starší scénáře bez těchto polí si zachovávají původní chování.
    isNoQuarterTarget(unit, mechanic) {
        if (!mechanic) return false;

        const playerFaction = this.game.currentScenario?.playerFaction || 'hussites';
        if (unit.faction === playerFaction) return false;

        if (Number.isFinite(mechanic.activeFromTurn) && this.game.turnNumber < mechanic.activeFromTurn) {
            return false;
        }
        if (mechanic.requiresEvent && !this.game.processedEvents.has(mechanic.requiresEvent)) {
            return false;
        }

        const area = mechanic.area;
        if (area && (unit.col < area.minCol || unit.col > area.maxCol ||
            unit.row < area.minRow || unit.row > area.maxRow)) {
            return false;
        }

        return true;
    }

    // Zpracování prchajících jednotek
    processRoutingUnits() {
        const routingUnits = this.game.units.filter(u =>
            u.faction === this.game.currentFaction &&
            u.health > 0 &&
            u.isRouting
        );

        // noQuarterGiven - prchající jsou zničeni jen tam a tehdy, kde to
        // scénář výslovně dovolí (u Vyšehradu až po události v úvozu).
        const noQuarter = this.game.currentScenario && this.game.currentScenario.specialMechanics &&
            this.game.currentScenario.specialMechanics.noQuarterGiven;

        for (const unit of routingUnits) {
            if (this.isNoQuarterTarget(unit, noQuarter)) {
                this.game.addLog(i18n.t('gameLog.routedCaught', {unit: unit.name}), 'combat');
                unit.health = 0;
                this.game.combatSystem.trackUnitDeath(unit, null);
                this.game.handleUnitDeath(unit, null);
                continue;
            }

            // Bonus k rally od blízkého velitele (podle jeho rallyBonus) a/nebo
            // zkušeného souseda (veteran/elite)
            const rallyBonus = this.isLeaderNearby(unit);

            // Pokus o rally
            const rallyResult = unit.attemptRally(rallyBonus);

            if (rallyResult.deserted) {
                // Jednotka dezertovala - odstraníme ji
                this.game.addLog(i18n.t('gameLog.unitDeserted', {unit: unit.name}), 'morale');
                unit.health = 0;
                unit.escaped = true;
                this.game.combatSystem.trackUnitDeath(unit, null);
            } else if (rallyResult.success) {
                this.game.addLog(i18n.t('gameLog.rallySuccess', {unit: unit.name}), 'morale');
            } else {
                // Jednotka dále prchá - posunout směrem od nepřítele
                this.moveRoutingUnit(unit);
                // Zničený či uprchlý oddíl už nemá dostat hlášku „stále prchá“.
                if (unit.health > 0) {
                    this.game.addLog(i18n.t('gameLog.rallyFailedAttempt', {
                        unit: unit.name,
                        attempt: unit.rallyAttempts
                    }), 'morale');
                }
            }
        }
    }

    // Rally bonus z blízkosti skutečného velitele (podle jeho auraRange a
    // rallyBonus, stejně jako getCommanderBonuses) + samostatný bonus za
    // sousedního veterána/elitu. Dřív se místo velitele kontrolovaly jednotky
    // se special 'veteran'/'elite' na 1 hexu - žádný velitel (special:
    // 'commander') tak rally nikdy neovlivnil, přestože UI jeho rallyBonus
    // hráči ukazovalo.
    isLeaderNearby(unit) {
        let bonus = 0;

        const auraInfo = this.game.isInCommanderAura(unit);
        if (auraInfo) {
            bonus += auraInfo.abilities.rallyBonus || 0;
        }

        const neighbors = this.game.hexGrid.getNeighbors(unit.col, unit.row);
        for (const neighbor of neighbors) {
            const nearbyUnit = this.game.getUnitAt(neighbor.col, neighbor.row);
            if (nearbyUnit &&
                nearbyUnit.faction === unit.faction &&
                nearbyUnit.health > 0 &&
                (nearbyUnit.special === 'veteran' || nearbyUnit.special === 'elite')) {
                bonus += 20;
                break;
            }
        }

        return bonus;
    }

    // Pohyb prchající jednotky směrem od nejbližšího nepřítele
    moveRoutingUnit(unit) {
        // Kontrola canRetreat - jednotky které nemohou ustoupit jsou zničeny
        const unitType = UnitTypes[unit.type];
        if (unitType && unitType.tactics && unitType.tactics.canRetreat === false) {
            this.game.addLog(i18n.t('gameLog.unitTrapped', {unit: unit.name}), 'morale');
            unit.health = 0;
            this.game.combatSystem.trackUnitDeath(unit, null);
            this.game.handleUnitDeath(unit, null);
            return;
        }

        // Kontrola, zda je jednotka na okraji mapy - pokud ano, uteče z bojiště
        if (unit.col === 0 || unit.col === this.game.hexGrid.cols - 1 ||
            unit.row === 0 || unit.row === this.game.hexGrid.rows - 1) {
            this.game.addLog(i18n.t('gameLog.unitFledBattlefield', {unit: unit.name}), 'morale');
            unit.health = 0;
            unit.escaped = true; // Označíme že utekl, ne zemřel
            this.game.combatSystem.trackUnitDeath(unit, null);
            return;
        }

        // Najít nejbližšího nepřítele
        let closestEnemy = null;
        let closestDistance = Infinity;

        for (const enemy of this.game.units) {
            if (enemy.faction !== unit.faction && enemy.health > 0) {
                const dist = this.game.hexGrid.getDistance(unit.col, unit.row, enemy.col, enemy.row);
                if (dist < closestDistance) {
                    closestDistance = dist;
                    closestEnemy = enemy;
                }
            }
        }

        if (!closestEnemy) return;

        // Najít hex který je nejdále od nepřítele a kam můžeme jít
        const neighbors = this.game.hexGrid.getNeighbors(unit.col, unit.row);
        let bestHex = null;
        let bestDistance = closestDistance;

        for (const neighbor of neighbors) {
            // Kontrola, zda je pole platné a volné
            if (neighbor.col < 0 || neighbor.col >= this.game.hexGrid.cols ||
                neighbor.row < 0 || neighbor.row >= this.game.hexGrid.rows) continue;

            if (this.game.hexGrid.isImpassable(neighbor.col, neighbor.row)) continue;
            if (this.game.getUnitAt(neighbor.col, neighbor.row)) continue;

            const distFromEnemy = this.game.hexGrid.getDistance(neighbor.col, neighbor.row, closestEnemy.col, closestEnemy.row);
            if (distFromEnemy > bestDistance) {
                bestDistance = distFromEnemy;
                bestHex = neighbor;
            }
        }

        // Pokud jsme našli kam utéct, přesuneme jednotku
        if (bestHex) {
            unit.col = bestHex.col;
            unit.row = bestHex.row;
        }
    }

    // Pasivní regenerace morálky pro jednotky které neprchají
    regenerateMorale() {
        for (const unit of this.game.units) {
            if (unit.faction === this.game.currentFaction && unit.health > 0 && !unit.isRouting) {
                // Regenerace 3 morálky za tah pokud je jednotka v bezpečí
                // (žádný nepřítel do 2 polí)
                let inDanger = false;
                for (const enemy of this.game.units) {
                    if (enemy.faction !== unit.faction && enemy.health > 0) {
                        const dist = this.game.hexGrid.getDistance(unit.col, unit.row, enemy.col, enemy.row);
                        if (dist <= 2) {
                            inDanger = true;
                            break;
                        }
                    }
                }

                if (!inDanger) {
                    unit.increaseMorale(3, i18n.t('gameLog.safeRecovery'));
                }

                // Bonus morálky pokud je velitel poblíž
                if (this.isLeaderNearby(unit)) {
                    unit.increaseMorale(2, i18n.t('gameLog.leaderBonus'));
                }
            }
        }

        // noWater mechanika - hrad bez studny (Sion)
        if (this.game.currentScenario && this.game.currentScenario.specialMechanics &&
            this.game.currentScenario.specialMechanics.noWater) {
            // Každé druhé kolo klesá morálka obránců o 5
            if (this.game.currentFaction === (this.game.currentScenario.playerFaction || 'hussites') &&
                this.game.turnNumber % 2 === 0) {
                const playerFaction = this.game.currentScenario.playerFaction || 'hussites';
                for (const unit of this.game.units) {
                    if (unit.faction === playerFaction && unit.health > 0) {
                        unit.reduceMorale(5, i18n.t('gameLog.noWaterThirst'));
                    }
                }
                this.game.addLog(i18n.t('gameLog.noWaterThirst'), 'morale');
            }
        }
    }

    // Kontrola podmínek pro morální zlom
    checkMoraleBreak() {
        // Kontrola pro obě frakce
        this.checkFactionMoraleBreak('crusaders');
        this.checkFactionMoraleBreak('hussites');
    }

    checkFactionMoraleBreak(faction) {
        // Pokud už je frakce zlomená, nekontroluj znovu
        if (faction === 'crusaders' && this.game.moraleBroken) return;

        // Pro hráče - pokud už byla zobrazena hláška, nekontroluj znovu
        const playerFaction = this.game.currentScenario?.playerFaction || 'hussites';
        if (faction === playerFaction && this.playerMoraleWarningShown) return;

        const factionUnits = this.game.units.filter(u => u.faction === faction && u.health > 0);
        const commanders = factionUnits.filter(u => u.isCommander && u.isCommander());
        const totalUnits = factionUnits.length;

        // Podmínky pro morální zlom:
        // 1. Velitel padl
        // 2. Ztráta více než 60% armády (nepřítel) / 75% (hráč)
        // 3. Více než polovina jednotek prchá (pouze nepřítel)

        const isPlayer = faction === playerFaction;
        let breakReason = null;
        let resolveReason = null;

        // Kontrola padlého velitele
        const deadCommanders = this.game.units.filter(u =>
            u.faction === faction &&
            u.health <= 0 &&
            u.isCommander && u.isCommander()
        );

        if (deadCommanders.length > 0 && commanders.length === 0) {
            const commander = deadCommanders[0];
            resolveReason = () => i18n.t('gameLog.breakReasonCommander', {
                commander: i18n.hasTranslation(`units.${commander.type}.name`)
                    ? i18n.t(`units.${commander.type}.name`) : commander.name
            });
            breakReason = resolveReason();
        }

        // Kontrola ztráty armády - hráč má vyšší práh (75%)
        const lossThreshold = isPlayer ? 0.75 : 0.6;
        const initialCount = faction === playerFaction ? this.game.initialPlayerUnits : this.game.initialEnemyUnits;
        if (initialCount > 0) {
            const lossPercent = 1 - (totalUnits / initialCount);
            if (lossPercent >= lossThreshold && !breakReason) {
                const percent = Math.round(lossPercent * 100);
                resolveReason = () => i18n.t('gameLog.breakReasonCasualties', { percent });
                breakReason = resolveReason();
            }
        }

        // Kontrola prchajících jednotek - pouze pro nepřítele
        // (hráčova frakce nemá kaskádový routing)
        if (!isPlayer) {
            const routingCount = factionUnits.filter(u => u.isRouting).length;
            if (totalUnits > 0 && routingCount / totalUnits >= 0.5 && !breakReason) {
                resolveReason = () => i18n.t('gameLog.breakReasonRouting', { count: routingCount, total: totalUnits });
                breakReason = resolveReason();
            }
        }

        if (breakReason) {
            this.triggerMoraleBreak(faction, breakReason, resolveReason);
        }
    }

    // Spuštění morálního zlomu
    triggerMoraleBreak(faction, reason, resolveReason = null) {
        const factionName = i18n.t(`factions.${faction}`);
        this.game.addLog(`⚠️ ${i18n.t('gameLog.moraleBreakTitle')} ${factionName}: ${reason}`, 'morale');

        if (faction === 'crusaders') {
            this.game.moraleBroken = true;
            this.game.addLog(i18n.t('gameLog.armyCollapsing'), 'morale');

            // Náhodný útěk - ne všechny jednotky najednou
            // Šance na útěk závisí na aktuální morálce jednotky
            for (const unit of this.game.units) {
                if (unit.faction === faction && unit.health > 0) {
                    // Snížení morálky všem
                    unit.reduceMorale(20, i18n.t('gameLog.moraleBreakTitle'));

                    // Šance na okamžitý útěk: nízká morálka = vyšší šance
                    // Morálka 100 = 10% šance, Morálka 50 = 35%, Morálka 0 = 60%
                    const routChance = 0.6 - (unit.morale / unit.maxMorale) * 0.5;

                    // Velitelé nikdy neprchou
                    if (unit.isCommander?.()) continue;

                    // Elitní jednotky mají menší šanci na útěk
                    const isElite = unit.special === 'charge' || unit.special === 'fearless';
                    const adjustedChance = isElite ? routChance * 0.3 : routChance;

                    if (Math.random() < adjustedChance) {
                        unit.isRouting = true;
                        this.game.routingUnits.add(unit.id || `${unit.col}-${unit.row}`);
                        this.game.addLog(i18n.t('gameLog.unitStartsFleeing', {unit: unit.name}), 'morale');
                    }
                }
            }

            // Zobrazení notifikace
            const resolve = () => ({
                title: i18n.t('gameLog.moraleBreakTitle'),
                text: `${resolveReason ? resolveReason() : reason}\n${i18n.t('gameLog.armyCollapsing')}`
            });
            const { title, text } = resolve();
            this.game.showEventNotification(title, text, resolve);
        } else {
            // Pro hráče - varování (jen jednou)
            this.playerMoraleWarningShown = true;
            const resolve = () => ({
                title: i18n.t('gameLog.moraleBreakTitle'),
                text: `${resolveReason ? resolveReason() : reason}\n${i18n.t('gameLog.playerMoraleWarning')}`
            });
            const { title, text } = resolve();
            this.game.showEventNotification(title, text, resolve);
        }
    }

    // Kontrola útěku dalších jednotek při morálním zlomu (voláno každý tah)
    checkRoutSpread() {
        if (!this.game.moraleBroken) return;

        for (const unit of this.game.units) {
            if (unit.faction === 'crusaders' && unit.health > 0 && !unit.isRouting) {
                // Šance na útěk roste s každým kolem a nízkou morálkou
                const baseChance = 0.15; // 15% základní šance každé kolo
                const moraleModifier = (1 - unit.morale / unit.maxMorale) * 0.25;

                // Blízkost prchajících jednotek VLASTNÍ frakce zvyšuje šanci.
                // Bez filtru frakce paniku křižáků živili i prchající husité -
                // útěk protivníka jednotku děsit nemá
                const nearbyRouting = this.game.units.filter(u =>
                    u.isRouting && u.health > 0 &&
                    u.faction === unit.faction &&
                    this.game.hexGrid.getDistance(unit.col, unit.row, u.col, u.row) <= 2
                ).length;
                const proximityBonus = nearbyRouting * 0.1;

                const totalChance = baseChance + moraleModifier + proximityBonus;

                // Velitelé nikdy neprchou
                if (unit.isCommander?.()) continue;

                // Elitní jednotky odolávají déle
                const isElite = unit.special === 'fearless';
                const finalChance = isElite ? totalChance * 0.3 : totalChance;

                if (Math.random() < finalChance) {
                    unit.isRouting = true;
                    this.game.routingUnits.add(unit.id || `${unit.col}-${unit.row}`);
                    this.game.addLog(i18n.t('gameLog.unitStartsFleeing', {unit: unit.name}), 'morale');
                }
            }
        }
    }

    // Kontrola zda jednotka utekla z mapy (při morálním zlomu)
    checkUnitFled(unit) {
        // Jednotka uprchne pokud je na okraji mapy a prchá
        if (!unit.isRouting) return false;

        const isAtEdge = unit.col <= 0 || unit.col >= this.game.hexGrid.cols - 1 ||
                         unit.row <= 0 || unit.row >= this.game.hexGrid.rows - 1;

        if (isAtEdge && this.game.moraleBroken) {
            this.game.addLog(i18n.t('gameLog.unitFledBattlefield', {unit: unit.name}), 'morale');
            unit.health = 0;
            return true;
        }
        return false;
    }

    // ==========================================
    // ZVĚD - RYCHLÝ ÚNIK
    // ==========================================

    // Kontrola zda může jednotka použít Rychlý únik
    canQuickEscape(unit, attacker) {
        // Pouze pro Zvědy (husitské i křižácké)
        if (unit.type !== 'ZVED' && unit.type !== 'ZVED_KRIZACI') return false;
        // Pouze pro hráčovy jednotky (nabídka se zobrazuje jen hráči)
        if (unit.faction !== 'hussites') return false;
        // Jednotka musí mít méně než 100% HP (byla zasažena)
        if (unit.health >= unit.maxHealth) return false;
        // Musí být naživu
        if (unit.health <= 0) return false;

        return true;
    }

    // Nabídnout Rychlý únik hráči
    offerQuickEscape(scout, attacker) {
        // Získej dostupné únikové hexy (vzdálenost 1-2 od zvěda, směrem od útočníka)
        const escapeHexes = this.getQuickEscapeHexes(scout, attacker);

        if (escapeHexes.length === 0) {
            this.game.addLog(i18n.t('gameLog.unitTrapped', {unit: scout.name}), 'combat');
            return;
        }

        // Zobraz dialog pro výběr
        this.showQuickEscapeDialog(scout, escapeHexes, attacker);
    }

    // Získej dostupné hexy pro únik (směrem od útočníka)
    getQuickEscapeHexes(scout, attacker) {
        const escapeHexes = [];
        const maxDistance = 2;

        // Směr od útočníka
        const dirCol = scout.col - attacker.col;
        const dirRow = scout.row - attacker.row;

        // Prohledej hexy v dosahu 1-2
        for (let q = -maxDistance; q <= maxDistance; q++) {
            for (let r = -maxDistance; r <= maxDistance; r++) {
                const col = scout.col + q;
                const row = scout.row + r;

                // Základní kontroly
                if (col < 0 || col >= this.game.hexGrid.cols || row < 0 || row >= this.game.hexGrid.rows) continue;
                if (col === scout.col && row === scout.row) continue; // Nemůže zůstat na místě

                const distance = this.game.hexGrid.getDistance(scout.col, scout.row, col, row);
                if (distance < 1 || distance > maxDistance) continue;

                // Kontrola zda hex je průchozí a prázdný
                if (this.game.hexGrid.isImpassable(col, row)) continue;

                const unitAtHex = this.game.getUnitAt(col, row);
                if (unitAtHex) continue;

                // Preferuj hexy směrem od útočníka
                const newDirCol = col - attacker.col;
                const newDirRow = row - attacker.row;
                const isAwayFromAttacker = (newDirCol * dirCol + newDirRow * dirRow) > 0;

                escapeHexes.push({
                    col,
                    row,
                    distance,
                    preferred: isAwayFromAttacker
                });
            }
        }

        // Seřaď preferované hexy první
        escapeHexes.sort((a, b) => {
            if (a.preferred !== b.preferred) return b.preferred ? 1 : -1;
            return a.distance - b.distance;
        });

        return escapeHexes.slice(0, 6); // Max 6 možností
    }

    // Zobraz dialog pro Rychlý únik
    showQuickEscapeDialog(scout, escapeHexes, attacker) {
        // Ulož reference pro callback
        this.quickEscapeData = { scout, escapeHexes, attacker };

        // Vytvoř nebo aktualizuj dialog
        let dialog = document.getElementById('quick-escape-dialog');
        if (!dialog) {
            dialog = document.createElement('div');
            dialog.id = 'quick-escape-dialog';
            dialog.className = 'modal';
            dialog.innerHTML = `
                <div class="modal-content quick-escape-content">
                    <h3>🏇 ${i18n.t('gameLog.quickEscapeTitle')}</h3>
                    <p id="quick-escape-message"></p>
                    <div class="quick-escape-buttons">
                        <button id="btn-escape-yes" class="btn-primary">${i18n.t('gameLog.quickEscapeBtn')}</button>
                        <button id="btn-escape-no" class="btn-secondary">${i18n.t('gameLog.quickEscapeStay')}</button>
                    </div>
                </div>
            `;
            document.body.appendChild(dialog);

            // Event listenery
            document.getElementById('btn-escape-yes').addEventListener('click', () => {
                this.executeQuickEscape();
            });
            document.getElementById('btn-escape-no').addEventListener('click', () => {
                this.cancelQuickEscape();
            });
        }

        // Aktualizuj zprávu
        document.getElementById('quick-escape-message').textContent =
            i18n.t('gameLog.quickEscapeTitle') + ' - ' + scout.name;

        // Zobraz možné únikové hexy na mapě
        this.game.hexGrid.setHighlighted(escapeHexes.map(h => ({ col: h.col, row: h.row })));

        // Zobraz dialog
        dialog.classList.remove('hidden');
    }

    // Proveď Rychlý únik
    executeQuickEscape() {
        const data = this.quickEscapeData;
        if (!data) return;

        const { scout, escapeHexes, attacker } = data;

        // Vyber nejlepší únikový hex (první preferovaný)
        const targetHex = escapeHexes[0];
        if (!targetHex) {
            this.cancelQuickEscape();
            return;
        }

        // Přesuň zvěda
        scout.col = targetHex.col;
        scout.row = targetHex.row;

        this.game.addLog(i18n.t('gameLog.rallyFailed', {unit: scout.name}), 'move');
        Sound.playMove();

        // Skryj dialog a vyčisti
        this.cancelQuickEscape();
        this.game.render();
    }

    // Zruš Rychlý únik
    cancelQuickEscape() {
        const dialog = document.getElementById('quick-escape-dialog');
        if (dialog) {
            dialog.classList.add('hidden');
        }
        this.game.hexGrid.setHighlighted([]);
        this.quickEscapeData = null;
    }
}
