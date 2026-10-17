// Jednoduchá AI pro křižáky

const AI = {
    defaultDoctrine: {
        charge: 'reckless',
        pursueRouted: true,
        flankSeeking: true,
        fearThreshold: 22,
        feignedRetreat: false,
        holdWagonFort: false,
        advance: 'tactical',
        avoidFireUnlessOrdered: true
    },

    // Frakční default doplňuje scénářový profil. Scénář tak popisuje
    // historické chování, aniž duplikuje celou sadu voleb.
    getDoctrine: function(game) {
        return {
            ...this.defaultDoctrine,
            ...(game.currentScenario?.aiDoctrine || {})
        };
    },

    // Testovací harness může dodat seedovaný generátor přes game.random.
    random: function(game) {
        return typeof game.random === 'function' ? game.random() : Math.random();
    },

    // Velitel má držet kontakt s vlastním vojskem, ne jedním tahem přeskočit
    // půl bojiště. Šablona si ponechává svůj pohyb; pouze AI vybírá pozice
    // vzdálené nejvýše tři hexy.
    getValidTacticalMoves: function(game, unit) {
        const moves = game.getValidMoves(unit);
        if (!unit?.isCommander || !unit.isCommander()) return moves;
        return moves.filter(move =>
            game.hexGrid.getDistance(unit.col, unit.row, move.col, move.row) <= 3
        );
    },

    // Mapování herních terénů na klíče v tactics.terrain
    terrainMapping: {
        forest: 'forest',
        hills: 'hill',
        water: 'water',
        plains: 'road',
        town: 'village',
        church: 'village',
        dam: 'road',
        road: 'road',
        road2: 'road',
        mud: 'water',
        swamp: 'water',
        slope: 'hill',
        trenches: 'village'
    },

    // Získá terrain bonus pro konkrétní jednotku na daném terénu
    getUnitTerrainBonus: function(unit, terrain) {
        const unitType = UnitTypes[unit.type];
        if (unitType && unitType.tactics && unitType.tactics.terrain) {
            const terrainKey = this.terrainMapping[terrain];
            if (terrainKey && unitType.tactics.terrain[terrainKey] !== undefined) {
                const modifier = unitType.tactics.terrain[terrainKey];
                // null = neprůchodný terén (velká penalizace)
                if (modifier === null) {
                    return -50; // Velký malus pro neprůchodný terén
                }
                // Převod z celého čísla (např. 10, -20) na skóre
                return modifier;
            }
        }
        // Fallback na generické bonusy
        const defaultBonuses = {
            plains: 0,
            forest: 15,
            hills: 20,
            town: 25,
            water: -20,
            dam: 10,
            mud: -10,
            swamp: -10,
            slope: 10,
            trenches: 25,
            church: 20
        };
        return defaultBonuses[terrain] || 0;
    },

    // Hlavní funkce - provede celý tah
    takeTurn: async function(game) {
        const units = game.getUnitsOfFaction('crusaders');
        const enemies = game.getEnemyUnits('crusaders');

        if (units.length === 0 || enemies.length === 0) {
            if (game.showAIThinking) game.showAIThinking(false);
            game.endTurn();
            return;
        }

        // WP0: aktualizace skriptovaného postoje (expirace, spuštění léčky)
        this.updateAiStance(game);

        // Zpracování jednotek postupně s prodlevou pro vizuální efekt
        await this.processUnits(game, units, 0);
    },

    // WP0: kontrola stavu skriptovaného postoje na začátku tahu AI.
    // - untilTurn: po vypršení lure -> aggressive (spustí léčku), ostatní -> default
    // - lure: pokud se hráč přiblíží na <= proximity hexů k targetu, léčka se spustí hned
    updateAiStance: function(game) {
        const stance = game.aiStance;
        if (!stance || stance.mode === 'default' || stance.mode === 'aggressive') return;

        const springTrap = () => {
            stance.mode = 'aggressive';
            stance.target = null;
            game.addLog(i18n.t('gameLog.aiTrapSprung'), 'combat');
        };

        // Vypršení časového limitu postoje
        if (typeof stance.untilTurn === 'number' && game.turnNumber > stance.untilTurn) {
            if (stance.mode === 'lure') { springTrap(); return; }
            stance.mode = 'default';
            return;
        }

        // Léčka: hráč (nepřítel AI) se přiblížil k cílovému bodu ústupu
        if (stance.mode === 'lure' && stance.target) {
            const players = game.getEnemyUnits('crusaders');
            for (const p of players) {
                if (p.health <= 0) continue;
                if (game.hexGrid.getDistance(p.col, p.row, stance.target.col, stance.target.row) <= stance.proximity) {
                    springTrap();
                    return;
                }
            }
        }
    },

    processUnits: async function(game, units, index = 0) {
        for (let i = index; i < units.length; i++) {
            if (!await game.actions.wait(0) || game.gameState !== 'playing' || game.currentFaction !== 'crusaders') return;
            const unit = units[i];
            if (!unit.canAct() || unit.health <= 0) continue;

            const action = this.decideAction(game, unit);
            const started = Date.now();
            if (action) await this.executeAction(game, unit, action);
            if (game.gameState !== 'playing') return;

            // Nastavení rychlosti řídí jen prezentaci. Další akce vždy čeká
            // na celý souboj, protiútok i reakční palbu při nájezdu.
            const remaining = Math.max(0, this.getActionDelay(game, action, units.length) - (Date.now() - started));
            if (!await game.actions.wait(remaining)) return;
        }
        if (await game.actions.wait(game.fastForwardAI ? 50 : 300) &&
            game.gameState === 'playing' && game.currentFaction === 'crusaders') {
            game.endTurn();
        }
    },

    getActionDelay: function(game, action, unitCount) {
        const configuredSpeed = typeof window !== 'undefined' && window.gameSettings
            ? window.gameSettings.aiSpeed
            : 'normal';
        const speedFactor = { fast: 0.4, normal: 1, slow: 1.8 }[configuredSpeed] || 1;
        // Historické přesily (Hořice, Tachov, Domažlice) mají víc žetonů.
        // Zachovej čitelnost animace, ale nenech délku tahu růst lineárně
        // nad zhruba dvě desítky jednotek.
        const largeArmyFactor = Math.min(1, 24 / Math.max(1, unitCount));
        const isAttack = action && action.type === 'attack';
        let delay = (isAttack ? 700 : 500) * speedFactor * largeArmyFactor;
        delay = Math.max(isAttack ? 320 : 120, delay);

        // Zrychlený režim má minimální prodlevy; hráč jej může opět vypnout.
        // Dokončení akce hlídá await; tyto hodnoty určují jen minimální tempo.
        if (game.fastForwardAI) return isAttack ? 320 : 40;
        return delay;
    },

    decideAction: function(game, unit) {
        const enemies = game.getEnemyUnits('crusaders');
        const isCommander = unit.isCommander && unit.isCommander();
        const doctrine = this.getDoctrine(game);
        const aggressiveCommander = isCommander &&
            doctrine.aggressiveCommanders?.includes(unit.type);

        // WP0: skriptovaný postoj přebírá rozhodování (kromě default/aggressive,
        // které používají standardní chování níže). Vrací akci definitivně.
        const stance = game.aiStance;
        if (stance && stance.mode !== 'default' && stance.mode !== 'aggressive') {
            return this.decideStanceAction(game, unit, enemies, stance);
        }

        // Zlomená jednotka se nejdřív snaží dostat z dosahu. Vyšší práh
        // ve scénáři modeluje armádu, kterou poráží už pověst protivníka.
        if (!unit.isRouting && !isCommander && !aggressiveCommander &&
            Number.isFinite(unit.morale) && unit.morale <= doctrine.fearThreshold) {
            if (unit.canMove()) {
                const safeMove = this.findSafeMove(game, unit, enemies);
                if (safeMove) return { type: 'move', col: safeMove.col, row: safeMove.row };
            }
            return unit.canAct() ? { type: 'defend' } : null;
        }

        // Pursuit mechanic - AI ustupuje směrem k cílovému bodu
        if (game.currentScenario && game.currentScenario.specialMechanics &&
            game.currentScenario.specialMechanics.pursuit && unit.canMove()) {
            const retreatTarget = this.findRetreatMove(game, unit);
            if (retreatTarget) {
                // 60% šance na ústup místo boje
                if (this.random(game) < 0.6) {
                    return { type: 'move', col: retreatTarget.col, row: retreatTarget.row };
                }
            }
        }

        // === OCHRANA VELITELE ===
        // Řídká formace sama o sobě není důvod k okamžitému ústupu.
        // Velitel couvá až před jednotkou, která ho nyní může zasáhnout.
        if (isCommander && !aggressiveCommander) {
            // Spočítej okolní spojence
            const neighbors = game.hexGrid.getNeighbors(unit.col, unit.row);
            let adjacentAllies = 0;
            let nearbyEnemies = 0;

            for (const neighbor of neighbors) {
                const nearUnit = game.getUnitAt(neighbor.col, neighbor.row);
                if (nearUnit && nearUnit.health > 0) {
                    if (nearUnit.faction === unit.faction) {
                        adjacentAllies++;
                    } else if (!nearUnit.isRouting) {
                        nearbyEnemies++;
                    }
                }
            }

            const immediateThreat = enemies.some(enemy =>
                enemy.health > 0 && !enemy.isRouting &&
                game.hexGrid.getDistance(unit.col, unit.row, enemy.col, enemy.row) <=
                    Math.max(1, enemy.range || 1) + (enemy.special === 'reach' ? 1 : 0)
            );
            // Nedostatek doprovodu zesiluje skutečnou hrozbu, ne hypotetickou
            // hrozbu od vzdálené armády na druhém konci mapy.
            if (unit.canMove() && immediateThreat && (adjacentAllies < 2 || nearbyEnemies > 0)) {
                const safeMove = this.findSafeMove(game, unit, enemies);
                if (safeMove) {
                    return { type: 'move', col: safeMove.col, row: safeMove.row };
                }
            }

            // Velitel útočí jen na dálku nebo když je to bezpečné
            if (unit.canAttack() && unit.range > 1) {
                const attackTarget = this.findBestAttackTarget(game, unit, enemies);
                if (attackTarget) {
                    return { type: 'attack', target: attackTarget };
                }
            }

            // Velitel se přesouvá za linií jen když ztratil doprovod.
            // Se dvěma sousedními spojenci už stojí na podpůrném místě;
            // v prvních tazích nemá důvod běžet dál od bitvy.
            if (unit.canMove() && adjacentAllies < 2) {
                const supportMove = this.findCommanderSupportPosition(game, unit, enemies);
                if (supportMove) {
                    return { type: 'move', col: supportMove.col, row: supportMove.row };
                }
            }

            // Obranný postoj pokud nic jiného
            if (unit.canAct()) {
                return { type: 'defend' };
            }
            return null;
        }

        // Posádka pověřená držením vozové pevnosti neroztrhne vlastní
        // linii kvůli o trochu lepšímu hexu. Střílet a bojovat z místa smí.
        if (doctrine.holdWagonFort && unit.isWagon && unit.isWagon() && unit.formationClosed) {
            if (unit.canAttack()) {
                const attackTarget = this.findBestAttackTarget(game, unit, enemies);
                if (attackTarget) return { type: 'attack', target: attackTarget };
            }
            return unit.canAct() ? { type: 'defend' } : null;
        }

        // Speciální taktika pro jednotky s charge - nejprve pohyb, pak útok
        if (doctrine.charge !== 'none' && unit.special === 'charge' && unit.canMove() && unit.canAttack()) {
            const chargeTarget = this.findChargeOpportunity(game, unit, enemies);
            if (chargeTarget) {
                return { type: 'move', col: chargeTarget.moveCol, row: chargeTarget.moveRow,
                         followUpAttack: chargeTarget.target };
            }
        }

        // 1. Pokus o útok, pokud je v dosahu nepřítel
        if (unit.canAttack()) {
            const attackTarget = this.findBestAttackTarget(game, unit, enemies);
            if (attackTarget) {
                return { type: 'attack', target: attackTarget };
            }
        }

        // 2. Pohyb směrem k nejbližšímu nepříteli
        if (unit.canMove()) {
            const moveTarget = this.findBestMove(game, unit, enemies);
            if (moveTarget) {
                return { type: 'move', col: moveTarget.col, row: moveTarget.row };
            }
        }

        // 3. Pokud nemůžeme nic dělat, zaujmeme obranný postoj
        if (unit.canAct()) {
            return { type: 'defend' };
        }

        return null;
    },

    // WP0: rozhodování jednotky pod skriptovaným postojem.
    // Vrací akci definitivně (move/attack/defend) nebo null - NEspadne do agresivní AI.
    decideStanceAction: function(game, unit, enemies, stance) {
        const mode = stance.mode;

        // Ve všech pasivních postojích: útok jen na cíl v dosahu z AKTUÁLNÍ pozice
        // (findBestAttackTarget kontroluje distance <= range, bez pohybu = žádné pronásledování).
        const attackInRange = () => {
            if (!unit.canAttack()) return null;
            const t = this.findBestAttackTarget(game, unit, enemies);
            return t ? { type: 'attack', target: t } : null;
        };

        if (mode === 'lure' || mode === 'retreat') {
            const atk = attackInRange();
            if (atk) return atk;
            if (unit.canMove()) {
                let mv = null;
                if (stance.target) {
                    mv = this.findMoveTowardPoint(game, unit, stance.target.col, stance.target.row);
                } else {
                    mv = this.findSafeMove(game, unit, enemies); // bez cíle: ustup od nepřítele
                }
                if (mv) return { type: 'move', col: mv.col, row: mv.row };
            }
            return unit.canAct() ? { type: 'defend' } : null;
        }

        if (mode === 'hold') {
            const atk = attackInRange();
            if (atk) return atk;
            return unit.canAct() ? { type: 'defend' } : null; // drží pozici, nehýbe se
        }

        if (mode === 'defensive') {
            const atk = attackInRange();
            if (atk) return atk;
            // Pohyb max 1 hex jen pokud tím jednotka získá cíl v dosahu útoku
            if (unit.canMove()) {
                for (const move of this.getValidTacticalMoves(game, unit)) {
                    if (game.hexGrid.getDistance(unit.col, unit.row, move.col, move.row) > 1) continue;
                    for (const enemy of enemies) {
                        if (enemy.health <= 0) continue;
                        if (game.hexGrid.getDistance(move.col, move.row, enemy.col, enemy.row) <= unit.range) {
                            return { type: 'move', col: move.col, row: move.row };
                        }
                    }
                }
            }
            return unit.canAct() ? { type: 'defend' } : null;
        }

        // Neznámý mód - bezpečný fallback, ať AI nezamrzne
        return unit.canAct() ? { type: 'defend' } : null;
    },

    // WP0: platný tah, který nejvíc přiblíží jednotku k bodu (targetCol,targetRow).
    // null, pokud je jednotka už <= 1 hex od cíle nebo žádný tah vzdálenost nezkracuje.
    findMoveTowardPoint: function(game, unit, targetCol, targetRow) {
        const validMoves = this.getValidTacticalMoves(game, unit);
        if (validMoves.length === 0) return null;

        const currentDist = game.hexGrid.getDistance(unit.col, unit.row, targetCol, targetRow);
        if (currentDist <= 1) return null; // už jsme u cíle

        let bestMove = null;
        let bestDist = currentDist;
        for (const move of validMoves) {
            const dist = game.hexGrid.getDistance(move.col, move.row, targetCol, targetRow);
            if (dist < bestDist) {
                bestDist = dist;
                bestMove = move;
            }
        }
        return bestMove; // null pokud žádný tah nezkracuje vzdálenost
    },

    // Hledání příležitosti pro charge útok (pohyb + útok)
    findChargeOpportunity: function(game, unit, enemies) {
        const validMoves = this.getValidTacticalMoves(game, unit);
        const doctrine = this.getDoctrine(game);
        const strength = unit.getAttackStrength();
        let bestOpportunity = null;
        let bestScore = -Infinity;

        for (const move of validMoves) {
            // Zkontrolujeme terrain bonus pro tuto pozici
            const terrain = game.hexGrid.getTerrain(move.col, move.row);
            const terrainBonus = this.getUnitTerrainBonus(unit, terrain);

            // Přeskočíme pozice s velkým terrain malusem (např. les pro jízdu)
            if (terrainBonus < -30) continue;

            // Po přesunu - kteří nepřátelé jsou v dosahu?
            for (const enemy of enemies) {
                const dist = game.hexGrid.getDistance(move.col, move.row, enemy.col, enemy.row);
                if (dist <= unit.range) {
                    // Spočítáme skóre - bonus za charge
                    let score = 100 - enemy.health;
                    score += unit.attack * strength * 0.5; // Charge bonus poškození

                    // Přidáme terrain bonus/malus
                    score += terrainBonus * 0.5;

                    // Preferujeme cíle, které můžeme zabít
                    const estimatedDamage = unit.attack * 1.5 * strength - enemy.defense * 0.5;
                    if (enemy.health <= estimatedDamage) {
                        score += 80;
                    }

                    // Bonus proti střelcům a dělům
                    if (enemy.isRanged()) {
                        score += 30;
                    }

                    if (doctrine.pursueRouted && enemy.isRouting) {
                        score += 150;
                    }

                    // Opatrná jízda nenaběhne do soustředěné palby jen proto,
                    // že technicky může provést charge. Reckless profil malus ignoruje.
                    if (doctrine.charge === 'cautious' && doctrine.avoidFireUnlessOrdered) {
                        score -= this.getRangedThreat(game, move, enemies) * 35;
                    }

                    if (score > bestScore) {
                        bestScore = score;
                        bestOpportunity = {
                            moveCol: move.col,
                            moveRow: move.row,
                            target: enemy
                        };
                    }
                }
            }
        }

        if (doctrine.charge === 'cautious' && bestScore < 90) return null;
        return bestOpportunity;
    },

    findBestAttackTarget: function(game, unit, enemies) {
        const doctrine = this.getDoctrine(game);
        const strength = unit.getAttackStrength();
        let bestTarget = null;
        let bestScore = -Infinity;

        for (const enemy of enemies) {
            const distance = game.hexGrid.getDistance(unit.col, unit.row, enemy.col, enemy.row);

            // Kontrola dosahu včetně reach schopnosti
            let inRange = distance <= unit.range;
            if (unit.special === 'reach' && distance === 2 && unit.range === 1) {
                // canReachThrough žije na CombatSystem - volání na game by
                // spadlo (TypeError) a zamrzlo AI tah, jakmile by AI dostala
                // jednotku s reach
                inRange = game.combatSystem.canReachThrough(unit, enemy);
            }

            if (inRange) {
                // Skóre cíle - preferujeme slabší jednotky a ty, které můžeme zabít
                let score = 100 - enemy.health;

                // Výpočet odhadovaného poškození včetně speciálních schopností
                let estimatedDamage = unit.attack;

                // AntiCavalry bonus
                if (unit.special === 'antiCavalry' && enemy.isCavalry()) {
                    estimatedDamage *= 1.5;
                    score += 30; // Preferujeme cíle kde využijeme schopnost
                }

                // ArmorPiercing bonus
                if (unit.special === 'armorPiercing' && (enemy.isHeavyCavalry() || enemy.isWagon())) {
                    estimatedDamage *= 1.3;
                    score += 25;
                }

                // Pursuit bonus
                if (unit.special === 'pursuit' && enemy.health < enemy.maxHealth * 0.5) {
                    estimatedDamage *= 1.3;
                    score += 20;
                }

                // Siege bonus proti vozům
                if (unit.special === 'siege' && enemy.isWagon()) {
                    estimatedDamage *= 2.0;
                    score += 40;
                }

                // Dismount - preferujeme jízdu
                if (unit.special === 'dismount' && enemy.isCavalry()) {
                    score += 15;
                }

                estimatedDamage = Math.max(5, estimatedDamage * strength - enemy.defense * 0.5);

                // Bonus za možnost zabití
                if (enemy.health <= estimatedDamage) {
                    score += 50;
                }

                // Bonus za střelce a děla (jsou nebezpeční)
                if (enemy.isRanged()) {
                    score += 20;
                }

                // Dorazit rozprášené je explicitní součást historické doktríny,
                // ne náhodný vedlejší efekt nízkého HP.
                if (doctrine.pursueRouted && enemy.isRouting) {
                    score += 150;
                }

                // Malus za útok na vozy ve vozové hradbě
                if (enemy.isWagon()) {
                    const neighbors = game.hexGrid.getNeighbors(enemy.col, enemy.row);
                    let adjacentWagons = 0;
                    for (const n of neighbors) {
                        const u = game.getUnitAt(n.col, n.row);
                        if (u && u.isWagon() && u.faction === enemy.faction) {
                            adjacentWagons++;
                        }
                    }
                    if (adjacentWagons > 0) {
                        score -= adjacentWagons * 10; // Méně atraktivní cíl
                    }
                    if (doctrine.flankSeeking) {
                        // Střed souvislé hradby je horší cíl než její otevřený konec.
                        score += adjacentWagons <= 1 ? 30 : -45;
                    }
                }

                if (score > bestScore) {
                    bestScore = score;
                    bestTarget = enemy;
                }
            }
        }

        return bestTarget;
    },

    countLinkedWagons: function(game, unit) {
        if (!unit?.isWagon || !unit.isWagon()) return 0;
        return game.hexGrid.getNeighbors(unit.col, unit.row).reduce((count, neighbor) => {
            const other = game.getUnitAt(neighbor.col, neighbor.row);
            return count + (other && other !== unit && other.health > 0 &&
                other.faction === unit.faction && other.isWagon && other.isWagon() &&
                other.formationClosed !== false ? 1 : 0);
        }, 0);
    },

    chooseAdvanceTarget: function(game, unit, enemies, doctrine) {
        const living = enemies.filter(enemy => enemy.health > 0);
        if (living.length === 0) return null;

        const byDistance = (a, b) =>
            game.hexGrid.getDistance(unit.col, unit.row, a.col, a.row) -
            game.hexGrid.getDistance(unit.col, unit.row, b.col, b.row);
        living.sort(byDistance);
        const closest = living[0];
        const closestDistance = game.hexGrid.getDistance(unit.col, unit.row, closest.col, closest.row);

        if (doctrine.pursueRouted) {
            const routed = living.filter(enemy => enemy.isRouting).sort(byDistance);
            if (routed.length > 0) {
                const routedDistance = game.hexGrid.getDistance(unit.col, unit.row, routed[0].col, routed[0].row);
                if (routedDistance <= closestDistance + 4) return routed[0];
            }
        }

        // Pokud nejbližší cíl patří do souvislé vozové linie, postupuj
        // raději k jejímu konci. Průchod k boku se pořád hledá přes validMoves.
        if (doctrine.flankSeeking && closest.isWagon && closest.isWagon()) {
            const wagonEnds = living.filter(enemy =>
                enemy.isWagon && enemy.isWagon() && enemy.formationClosed !== false &&
                this.countLinkedWagons(game, enemy) <= 1
            ).sort(byDistance);
            if (wagonEnds.length > 0) return wagonEnds[0];
        }

        return closest;
    },

    getRangedThreat: function(game, position, enemies) {
        return enemies.reduce((threat, enemy) => {
            if (enemy.health <= 0 || !enemy.isRanged || !enemy.isRanged()) return threat;
            const distance = game.hexGrid.getDistance(position.col, position.row, enemy.col, enemy.row);
            return threat + (distance <= enemy.range ? 1 : 0);
        }, 0);
    },

    // Cena zbývající cesty k VOLNÉMU hexu pro boj zblízka. Hledáme zpětně
    // od všech dosažitelných cílů, ne vzdušnou vzdálenost k jedinému nepříteli.
    // Spojence lze při plánování obejít/projít, nepřátele ani vodu ne.
    // Jde o odhad přes více tahů: skutečný krok níže vždy vybírá getValidMoves,
    // takže rozpočet pohybu, obsazení, ZOC i využitý most dál hlídá engine.
    getAssaultDistances: function(game, unit, enemies) {
        const distances = new Map();
        if (unit.movement <= 0) return distances;
        const traversable = new Map();
        const frozenRiver = game.currentScenario?.specialMechanics?.frozenRiver;
        for (const [key, hex] of game.hexGrid.hexes) {
            if (hex.terrain === 'water' && !frozenRiver) continue;
            const occupant = game.getUnitAt(hex.col, hex.row);
            if (occupant && occupant.faction !== unit.faction) continue;
            traversable.set(key, { ...hex, occupant });
        }

        const queue = [];
        for (const enemy of enemies) {
            if (enemy.health <= 0) continue;
            for (const hex of game.hexGrid.getNeighbors(enemy.col, enemy.row)) {
                const key = `${hex.col},${hex.row}`;
                const goal = traversable.get(key);
                // Na spojenci nelze skončit; hledej další volný bok protivníka.
                if (!goal || (goal.occupant && goal.occupant !== unit) || distances.has(key)) continue;
                distances.set(key, 0);
                queue.push({ ...hex, cost: 0 });
            }
        }

        while (queue.length) {
            queue.sort((a, b) => a.cost - b.cost);
            const current = queue.shift();
            const currentKey = `${current.col},${current.row}`;
            if (current.cost !== distances.get(currentKey)) continue;
            // Zpětná hrana platí vstup DO current, nikoli do předchůdce.
            // Stejně jako engine počítáme i s garantovaným jedním krokem.
            const stepCost = Math.min(unit.movement,
                game.getTerrainMoveCost(traversable.get(currentKey).terrain, unit));
            for (const previous of game.hexGrid.getNeighbors(current.col, current.row)) {
                const key = `${previous.col},${previous.row}`;
                if (!traversable.has(key)) continue;
                const cost = current.cost + stepCost;
                if (cost >= (distances.get(key) ?? Infinity)) continue;
                distances.set(key, cost);
                queue.push({ ...previous, cost });
            }
        }
        return distances;
    },

    findAssaultMove: function(game, unit, enemies, validMoves) {
        const distances = this.getAssaultDistances(game, unit, enemies);
        const currentDistance = distances.get(`${unit.col},${unit.row}`) ?? Infinity;
        let bestMove = null, bestDistance = Infinity, bestSafety = -Infinity;
        for (const move of validMoves) {
            const distance = distances.get(`${move.col},${move.row}`) ?? Infinity;
            // Žádná cesta / žádný pokrok: čekej, nepřešlapuj po rovině sem a tam.
            if (distance >= currentDistance) continue;
            const safety = this.getUnitTerrainBonus(unit, game.hexGrid.getTerrain(move.col, move.row))
                - this.getRangedThreat(game, move, enemies) * 35;
            // Rozkaz k útoku dává postupu prioritu. Terén a palba rozhodují
            // až mezi stejně dlouhými cestami, nemohou útok trvale zablokovat.
            if (distance < bestDistance || (distance === bestDistance && safety > bestSafety)) {
                bestMove = move;
                bestDistance = distance;
                bestSafety = safety;
            }
        }
        return bestMove;
    },

    findBestMove: function(game, unit, enemies) {
        const validMoves = this.getValidTacticalMoves(game, unit);
        const doctrine = this.getDoctrine(game);

        if (validMoves.length === 0) {
            return null;
        }

        // Jen výslovně určené útočné scénáře a boj zblízka. Střelci si drží
        // odstup; velitelé, ústup a skriptované postoje mají vlastní rozhodování.
        if (doctrine.advance === 'assault' && unit.range === 1 && !unit.isRouting) {
            return this.findAssaultMove(game, unit, enemies, validMoves);
        }

        let bestMove = null;
        let bestScore = -Infinity;

        const closestEnemy = this.chooseAdvanceTarget(game, unit, enemies, doctrine);

        if (!closestEnemy) {
            return validMoves[0];
        }

        for (const move of validMoves) {
            let score = 0;

            // Vzdálenost k nejbližšímu nepříteli
            const distToEnemy = game.hexGrid.getDistance(move.col, move.row, closestEnemy.col, closestEnemy.row);

            // Chceme se přiblížit, ale zůstat v útočném dosahu
            if (distToEnemy <= unit.range) {
                // Jsme v dosahu - super!
                score += 100;
                // Preferujeme vzdálenější pozici v rámci dosahu (bezpečnější)
                score += distToEnemy * 5;
            } else {
                // Chceme se přiblížit
                score += (10 - distToEnemy) * 10;
            }

            // Bonus za terén - používáme unit-specific modifikátory
            const terrain = game.hexGrid.getTerrain(move.col, move.row);
            score += this.getUnitTerrainBonus(unit, terrain);

            // Nevstupuj do nového palebného vějíře bez bezprostředního
            // taktického zisku. Skriptované aggressive stance tento malus ruší.
            if (doctrine.avoidFireUnlessOrdered && game.aiStance?.mode !== 'aggressive' && distToEnemy > unit.range) {
                const currentThreat = this.getRangedThreat(game, unit, enemies);
                const newThreat = this.getRangedThreat(game, move, enemies);
                score -= Math.max(0, newThreat - currentThreat) * 35;
            }

            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        return bestMove;
    },

    // Pursuit - najdi nejlepší ústupový hex směrem k mostu/řece
    findRetreatMove: function(game, unit) {
        const validMoves = this.getValidTacticalMoves(game, unit);
        if (validMoves.length === 0) return null;

        // Cíl ústupu - výslovný únikový bod scénáře, most,
        // nebo teprve jako nouzový fallback spodek mapy.
        let targetCol, targetRow;
        const escapeTarget = game.currentScenario.specialMechanics.escapeTarget;
        if (escapeTarget && Number.isFinite(escapeTarget.col) && Number.isFinite(escapeTarget.row)) {
            targetCol = escapeTarget.col;
            targetRow = escapeTarget.row;
        } else if (game.currentScenario.specialMechanics.bridgeBottleneck) {
            const pos = game.currentScenario.specialMechanics.bridgeBottleneck.position;
            targetCol = pos[0];
            targetRow = pos[1];
        } else {
            // Defaultní ústup na spodek mapy
            targetCol = Math.floor(game.hexGrid.cols / 2);
            targetRow = game.hexGrid.rows - 1;
        }

        let bestMove = null;
        let bestDist = Infinity;

        for (const move of validMoves) {
            const dist = game.hexGrid.getDistance(move.col, move.row, targetCol, targetRow);
            if (dist < bestDist) {
                bestDist = dist;
                bestMove = move;
            }
        }

        // Jen ústup pokud jsme dál od cíle než 2 hexy
        const currentDist = game.hexGrid.getDistance(unit.col, unit.row, targetCol, targetRow);
        if (currentDist <= 2) return null; // Už jsme u cíle

        return bestMove;
    },

    // Najde bezpečnou pozici pro velitele (pryč od nepřátel, blízko spojenců)
    findSafeMove: function(game, unit, enemies) {
        const validMoves = this.getValidTacticalMoves(game, unit);
        if (validMoves.length === 0) return null;

        const allies = game.getUnitsOfFaction(unit.faction).filter(u => u !== unit && u.health > 0);
        let bestMove = null;
        let bestScore = -Infinity;

        for (const move of validMoves) {
            let score = 0;

            // Vzdálenost od nepřátel - čím dále, tím lépe
            for (const enemy of enemies) {
                const dist = game.hexGrid.getDistance(move.col, move.row, enemy.col, enemy.row);
                score += dist * 10;
            }

            // Blízkost spojenců - chceme být blízko, ale ne přímo vedle
            const neighbors = game.hexGrid.getNeighbors(move.col, move.row);
            let adjacentAllies = 0;
            for (const neighbor of neighbors) {
                const nearUnit = game.getUnitAt(neighbor.col, neighbor.row);
                if (nearUnit && nearUnit.faction === unit.faction && nearUnit.health > 0) {
                    adjacentAllies++;
                }
            }
            score += adjacentAllies * 30; // Bonus za okolní spojence

            // Bonus za terén
            const terrain = game.hexGrid.getTerrain(move.col, move.row);
            score += this.getUnitTerrainBonus(unit, terrain);

            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        return bestMove;
    },

    // Najde pozici kde velitel může podporovat své jednotky (blízko, ale za nimi)
    findCommanderSupportPosition: function(game, unit, enemies) {
        const validMoves = this.getValidTacticalMoves(game, unit);
        if (validMoves.length === 0) return null;
        if (enemies.length === 0) return null;

        const allies = game.getUnitsOfFaction(unit.faction).filter(u => u !== unit && u.health > 0);
        if (allies.length === 0) return null;

        // Najdi průměrnou pozici spojenců
        let avgCol = 0, avgRow = 0;
        for (const ally of allies) {
            avgCol += ally.col;
            avgRow += ally.row;
        }
        avgCol = Math.round(avgCol / allies.length);
        avgRow = Math.round(avgRow / allies.length);

        // Najdi průměrnou pozici nepřátel
        let enemyAvgCol = 0, enemyAvgRow = 0;
        for (const enemy of enemies) {
            enemyAvgCol += enemy.col;
            enemyAvgRow += enemy.row;
        }
        enemyAvgCol = Math.round(enemyAvgCol / enemies.length);
        enemyAvgRow = Math.round(enemyAvgRow / enemies.length);

        const scorePosition = position => {
            let score = 0;

            // Chceme být blízko spojenců (v dosahu aury)
            const distToAllies = game.hexGrid.getDistance(position.col, position.row, avgCol, avgRow);
            if (distToAllies <= 4) {
                score += (5 - distToAllies) * 20;
            }

            // Ale dál od nepřátel než spojenci (za linií)
            const distToEnemies = game.hexGrid.getDistance(position.col, position.row, enemyAvgCol, enemyAvgRow);
            const alliesToEnemies = game.hexGrid.getDistance(avgCol, avgRow, enemyAvgCol, enemyAvgRow);
            if (distToEnemies > alliesToEnemies) {
                score += 50; // Bonus za pozici za linií
            }

            // Počet spojenců v okolí
            const neighbors = game.hexGrid.getNeighbors(position.col, position.row);
            let adjacentAllies = 0;
            for (const neighbor of neighbors) {
                const nearUnit = game.getUnitAt(neighbor.col, neighbor.row);
                if (nearUnit && nearUnit.faction === unit.faction && nearUnit.health > 0) {
                    adjacentAllies++;
                }
            }
            score += adjacentAllies * 25;

            // Terrain bonus
            const terrain = game.hexGrid.getTerrain(position.col, position.row);
            score += this.getUnitTerrainBonus(unit, terrain);
            return score;
        };

        // Neprocházej mapu bez účelu, když už velitel stojí na dobré
        // podpůrné pozici. Drobné rozdíly skóre nestojí za novou akci.
        let bestMove = null;
        let bestScore = scorePosition(unit) + 10;
        for (const move of validMoves) {
            const score = scorePosition(move);

            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        return bestMove;
    },

    executeAction: async function(game, unit, action) {
        switch (action.type) {
            case 'attack':
                game.addLog(i18n.t('gameLog.aiAttacking', { unitName: unit.name, targetName: action.target.name }), 'combat');
                await game.combatSystem.performAttack(unit, action.target);
                break;

            case 'move':
                if (action.followUpAttack) {
                    // Charge útok - pohyb a pak útok
                    game.addLog(i18n.t('gameLog.aiCharging', { unitName: unit.name }), 'combat');
                    await game.moveUnit(unit, action.col, action.row, action.followUpAttack);
                } else {
                    game.addLog(i18n.t('gameLog.aiMoving', { unitName: unit.name }), 'move');
                    await game.moveUnit(unit, action.col, action.row);
                }
                break;

            case 'defend':
                if (!game.canStartAction(unit)) return;
                Sound.playDefend();
                unit.defend();
                game.addLog(i18n.t('gameLog.aiDefending', { unitName: unit.name }), 'move');
                game.render();
                break;
        }
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AI;
}
