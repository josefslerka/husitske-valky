// Herní logika - řízení tahů, soubojů a stavu hry

class Game {
    constructor(hexGrid, { viewFactory = game => new BattleView(game) } = {}) {
        this.hexGrid = hexGrid;
        this.unitFactory = new UnitFactory();
        this.combatSystem = new CombatSystem(this);
        this.fogOfWarSystem = new FogOfWarSystem(this);
        this.victoryConditionsSystem = new VictoryConditionsSystem(this);
        this.tutorialSystem = new TutorialSystem(this);
        this.moraleSystem = new MoraleSystem(this);
        this.scenarioEventSystem = new ScenarioEventSystem(this);

        this.units = [];
        this.currentFaction = 'hussites'; // Husité začínají
        this.turnNumber = 1;

        this.selectedUnit = null;
        this.gameState = 'playing'; // playing, victory
        this.actions = new BattleActionSystem(this);
        this.aiRunning = false;
        this.isPaused = false;

        this.log = [];

        // Scénář a fáze
        this.currentScenario = null;
        this.currentPhase = null;
        this.processedEvents = new Set(); // Sledování již zpracovaných eventů

        // Statistiky hry
        this.enemiesKilled = 0;
        this.unitsLost = 0;
        // WP2a: přesné ztráty per frakce (zabití vs. uprchlí) pro "Vy vs. kronika"
        this.lossesByFaction = { hussites: 0, crusaders: 0 };
        this.fledByFaction = { hussites: 0, crusaders: 0 };
        this.initialPlayerUnits = 0;
        this.initialEnemyUnits = 0;
        this.campaignRecorded = false;
        this.campaignReputation = 50;

        // Rozšířené statistiky
        this.gameDuration = Date.now(); // Čas začátku hry
        this.stats = {
            totalDamage: 0,      // Celkové způsobené poškození
            damageTaken: 0,      // Celkové obdržené poškození
            unitKills: {},       // Zabití podle jednotky { unitId: počet }
            unitDamage: {}       // Poškození podle jednotky { unitId: celkem }
        };

        // Undo systém - uložení posledního pohybu
        this.lastMove = null;  // { unit, fromCol, fromRow }

        // Chorál - jednorázová schopnost
        this.choralUsed = false;
        this.choralActive = false;
        this.choralTurnsRemaining = 0;

        // Skriptovaný postoj AI (WP0) - řízení chování nepřítele přes eventy
        this.aiStance = { mode: 'default', target: null, untilTurn: null, proximity: 3 };

        // Regenerace - sledování jednotek které již regenerovaly
        this.regeneratedUnits = new Set();

        // Mlha války - viditelnost
        this.fogOfWar = true; // Zapnuto defaultně
        this.visibleHexes = new Set(); // Hexy viditelné hráčem
        this.exploredHexes = new Set(); // Hexy které hráč někdy viděl

        // Morální zlom - útěk nepřátel
        this.moraleBroken = false;
        this.routingUnits = new Set(); // Jednotky na útěku

        // Okno protiútoku - kolísání armád
        // armyMorale: průměrná morálka živých jednotek frakce (0-100), přepočítává se
        // wavering: zda frakce právě kolísá (mezi prahem zlomu a vzpamatování)
        this.armyMorale = { hussites: 100, crusaders: 100 };
        this.wavering = { hussites: false, crusaders: false };

        // Přeskočení animace tahu AI (klik na indikátor "Křižáci přemýšlí")
        // - sticky pro celou bitvu: jakmile zapnuto, AI tahy běží zrychleně
        this.fastForwardAI = false;

        // Tutoriál
        this.isTutorial = false;
        this.tutorialStep = 0;
        this.tutorialSteps = [];
        this.tutorialBlockedActions = new Set();
        this.tutorialWaitingFor = null;

        // Prezentace je vyměnitelný adaptér; pravidla lze spustit bez DOM.
        this.viewFactory = viewFactory;
        this.view = viewFactory(this);
    }

    // Úklid instance - bez něj zůstávají listenery a animační smyčka
    // staré hry aktivní na sdíleném canvasu a tlačítkách
    destroy() {
        this.gameState = 'destroyed';
        this.actions.destroy();
        this.view.destroy();
    }

    canStartAction(unit = null) {
        return this.gameState === 'playing' && !this.isPaused && !this.actions.busy &&
            (!unit || (unit.health > 0 && unit.faction === this.currentFaction && this.units.includes(unit)));
    }

    setPaused(paused) {
        this.isPaused = paused;
        this.actions.setPaused(paused);
        this.view.onPauseChange(paused);
    }

    skipAIAnimations() {
        if (this.gameState !== 'playing' || this.currentFaction !== 'crusaders' || this.fastForwardAI) return false;
        this.fastForwardAI = true;
        return true;
    }

    async scheduleAI() {
        if (await this.actions.wait(500)) await this.runAI();
    }

    // Inicializace nové hry (výchozí bez scénáře)
    initGame() {
        this.units = [];
        this.currentFaction = 'hussites';
        this.turnNumber = 1;
        this.selectedUnit = null;
        this.gameState = 'playing';
        this.clearLog();
        this.currentScenario = null;
        this.currentPhase = null;
        this.processedEvents = new Set();
        this.campaignRecorded = false;
        this.campaignReputation = 50; // Rychlá bitva je vždy neutrální.

        // Reset speciálních schopností
        this.choralUsed = false;
        this.choralActive = false;
        this.choralTurnsRemaining = 0;
        this.aiStance = { mode: 'default', target: null, untilTurn: null, proximity: 3 };
        this.regeneratedUnits = new Set();
        this.escapedUnits = 0;

        // Reset mlhy války a morálky (fogOfWar se nastaví z main.js podle nastavení)
        // this.fogOfWar zůstává jak bylo nastaveno
        this.visibleHexes = new Set();
        this.exploredHexes = new Set();
        this.moraleBroken = false;
        this.routingUnits = new Set();
        this.armyMorale = { hussites: 100, crusaders: 100 };
        this.wavering = { hussites: false, crusaders: false };

        // Vytvoření armád
        const hussites = this.unitFactory.createHussiteArmy();
        const crusaders = this.unitFactory.createCrusaderArmy();
        this.units = [...hussites, ...crusaders];

        // Nastavení terénu
        this.setupTerrain();

        // Skrytí phase panelu
        this.view.showPhase(null);

        // Aktualizace UI
        this.updateUI();
        this.addLog(i18n.t('gameLog.gameStart'), 'turn');

        // Spuštění animační smyčky
        this.startAnimationLoop();

        this.render();
    }

    // Převod souřadnic ve victoryConditions na mapové souřadnice (s okrajem)
    convertVictoryConditionPositions(scenario) {
        if (!scenario.victoryConditions) return;

        // Kontrola, jestli už byl převod proveden (aby se nepřevádělo při restartu)
        if (scenario._positionsConverted) return;
        scenario._positionsConverted = true;

        const convertPositions = (positions) => {
            if (!Array.isArray(positions)) return positions;
            return positions.map(([col, row]) => {
                const mapped = this.hexGrid.scenarioToMap(col, row);
                return [mapped.col, mapped.row];
            });
        };

        // Primary conditions
        const primary = scenario.victoryConditions.primary;
        if (primary) {
            if (primary.positions) {
                primary.positions = convertPositions(primary.positions);
            }
            if (primary.escapeZone) {
                primary.escapeZone = convertPositions(primary.escapeZone);
            }
            // Dual objective
            if (primary.objectives) {
                for (const obj of primary.objectives) {
                    if (obj.positions) {
                        obj.positions = convertPositions(obj.positions);
                    }
                }
            }
        }

        // Secondary conditions
        if (scenario.victoryConditions.secondary) {
            for (const sec of scenario.victoryConditions.secondary) {
                if (sec.positions) {
                    sec.positions = convertPositions(sec.positions);
                }
            }
        }
    }

    // Inicializace hry se scénářem
    initGameWithScenario(scenario, { restoring = false } = {}) {
        this.units = [];
        this.currentFaction = 'hussites';
        this.turnNumber = 1;
        this.selectedUnit = null;
        this.gameState = 'playing';
        this.clearLog();
        this.currentScenario = scenario;
        this.processedEvents = new Set();
        this.currentPhase = null;  // Reset fáze při načtení scénáře

        // Reset statistik
        this.enemiesKilled = 0;
        this.unitsLost = 0;
        this.lossesByFaction = { hussites: 0, crusaders: 0 };  // WP2a
        this.fledByFaction = { hussites: 0, crusaders: 0 };
        this.chronicleRecorded = false;  // WP2b: zápis do kroniky jen jednou za bitvu
        this.campaignRecorded = false;
        this.campaignReputation = typeof CampaignProgressSystem !== 'undefined'
            ? CampaignProgressSystem.getReputation()
            : 50;

        // Reset rozšířených statistik
        this.gameDuration = Date.now();
        this.stats = {
            totalDamage: 0,
            damageTaken: 0,
            unitKills: {},
            unitDamage: {}
        };

        // Reset speciálních schopností
        this.choralUsed = false;
        this.choralActive = false;
        this.choralTurnsRemaining = 0;
        this.aiStance = { mode: 'default', target: null, untilTurn: null, proximity: 3 };
        this.regeneratedUnits = new Set();
        this.escapedUnits = 0;
        this.objectiveHeldTurns = {};  // Pro dual_objective sledování

        // Reset mlhy války a morálky (fogOfWar se nastaví z main.js podle nastavení)
        // this.fogOfWar zůstává jak bylo nastaveno před voláním této metody
        this.visibleHexes = new Set();
        this.exploredHexes = new Set();
        this.moraleBroken = false;
        this.routingUnits = new Set();
        this.armyMorale = { hussites: 100, crusaders: 100 };
        this.wavering = { hussites: false, crusaders: false };

        // Aplikace terénu ze scénáře
        ScenarioManager.applyScenarioTerrain(this.hexGrid, scenario);

        // Převod souřadnic ve victoryConditions na mapové souřadnice
        this.convertVictoryConditionPositions(scenario);

        this.view.configureScenario(scenario);

        // Vytvoření jednotek ze scénáře
        this.units = ScenarioManager.createScenarioUnits(scenario, this.unitFactory, this.hexGrid);

        // Aplikace speciální počáteční morálky (např. Tachov - demoralizovaní křižáci)
        if (scenario.specialMechanics && scenario.specialMechanics.startingMorale) {
            const reputationModifier = typeof CampaignProgressSystem !== 'undefined'
                ? CampaignProgressSystem.getStartingMoraleModifier(scenario.id, this.campaignReputation)
                : 0;
            for (const [faction, morale] of Object.entries(scenario.specialMechanics.startingMorale)) {
                for (const unit of this.units) {
                    if (unit.faction === faction) {
                        const adjustedMorale = faction === 'crusaders' ? morale + reputationModifier : morale;
                        unit.morale = Math.max(0, Math.min(unit.maxMorale, adjustedMorale));
                    }
                }
            }
            this.addLog(i18n.t('gameLog.enemyDemoralized'), 'morale');
            if (typeof CampaignProgressSystem !== 'undefined' && CampaignProgressSystem.affectsReputationBattle(scenario.id)) {
                this.addLog(i18n.t(CampaignProgressSystem.getNarrativeKey(this.campaignReputation)), 'morale');
            }
        }

        // Uložení počátečních počtů jednotek pro statistiky
        const playerFaction = scenario.playerFaction || 'hussites';
        this.initialPlayerUnits = this.units.filter(u => u.faction === playerFaction).length;
        this.initialEnemyUnits = this.units.filter(u => u.faction !== playerFaction).length;

        // Nastavení první fáze
        this.updatePhase();

        // Aktualizace UI
        this.updateUI();
        this.addLog(`--- ${scenario.name} ---`, 'turn');
        this.addLog(scenario.briefing.hussites, 'turn');
        this.addLog(i18n.t('gameLog.hussitesStart'), 'turn');

        // Spuštění animační smyčky
        this.startAnimationLoop();

        this.render();

        // Zkontrolovat eventy první fáze
        if (!restoring) this.checkPhaseEvents();

        // Inicializace tutoriálu
        if (!restoring && scenario.type === 'tutorial' && scenario.tutorialSteps) {
            this.tutorialSystem.initTutorial(scenario.tutorialSteps);
        }

        // Vycentruj pohled na taktické ohnisko bitvy
        if (!restoring) this.centerOnPlayerForces();
    }

    // Vycentrování pohledu na počáteční situaci: rámuj střet armád jako
    // taktickou scénu, ne surový roh mapy ani čistě vlastní okraj.
    centerOnPlayerForces() {
        return this.view.centerOnPlayerForces();
    }

    // Kompatibilní vstupy; implementaci scénářových událostí vlastní systém.
    updatePhase() { return this.scenarioEventSystem.updatePhase(); }
    checkPhaseEvents() { return this.scenarioEventSystem.checkPhaseEvents(); }
    processEvent(event) { return this.scenarioEventSystem.processEvent(event); }
    checkReinforcements() { return this.scenarioEventSystem.checkReinforcements(); }
    spawnReinforcements(reinf, faction) { return this.scenarioEventSystem.spawnReinforcements(reinf, faction); }

    clearEventNotifications() {
        return this.view.clearEventNotifications();
    }

    // Zařazení notifikace eventu. Jednotlivé zprávy se zobrazují sekvenčně,
    // aby se při více událostech v jednom kole nepřekrývaly.
    showEventNotification(title, text) {
        return this.view.showEventNotification(title, text);
    }

    // ==========================================
    // OKNO PROTIÚTOKU - kolísání armád
    // ==========================================

    // Průměrná morálka živých jednotek frakce (0-100).
    // Prchající jednotky mají morálku nízkou, takže táhnou průměr dolů samy.
    getArmyMorale(faction) {
        const living = this.units.filter(u => u.faction === faction && u.health > 0);
        if (living.length === 0) return 0;
        let sum = 0;
        for (const u of living) {
            const max = u.maxMorale || 100;
            sum += Math.max(0, Math.min(100, (u.morale / max) * 100));
        }
        return Math.round(sum / living.length);
    }

    // Aktualizace stavu kolísání obou armád s hysterezí.
    // Pod WAVER_ENTER armáda začne kolísat → otevře se okno protiútoku.
    // Nad WAVER_EXIT se vzpamatuje → okno se zavře.
    // Volá se po každém útoku (combat) a po zpracování morálky na konci tahu.
    // Hystereze brání blikání stavu kolem prahu.
    updateWaveringState() {
        if (this.gameState !== 'playing' || this.isTutorial) return;

        const WAVER_ENTER = 40;
        const WAVER_EXIT = 55;
        const playerFaction = this.currentScenario?.playerFaction || 'hussites';

        for (const faction of ['hussites', 'crusaders']) {
            this.armyMorale[faction] = this.getArmyMorale(faction);

            const living = this.units.filter(u => u.faction === faction && u.health > 0);
            // Bez živých jednotek nemá kolísání smysl (hra stejně končí)
            if (living.length === 0) { this.wavering[faction] = false; continue; }

            const morale = this.armyMorale[faction];
            const wasWavering = this.wavering[faction];

            if (!wasWavering && morale < WAVER_ENTER) {
                this.wavering[faction] = true;
                this.onWaveringStart(faction, faction === playerFaction);
            } else if (wasWavering && morale > WAVER_EXIT) {
                this.wavering[faction] = false;
                this.onWaveringEnd(faction);
            }
        }
    }

    // Armáda začíná kolísat - okno protiútoku se otevírá
    onWaveringStart(faction, isPlayer) {
        const factionName = i18n.t(`factions.${faction}`);
        if (isPlayer) {
            const msg = i18n.t('gameLog.armyWaveringPlayer', { faction: factionName });
            this.addLog('⚠️ ' + msg, 'morale');
            this.showEventNotification('⚠️ ' + i18n.t('game.wavering'), msg);
            if (typeof Sound !== 'undefined' && Sound.playDefeat) Sound.playDefeat();
        } else {
            const msg = i18n.t('gameLog.armyWavering', { faction: factionName });
            this.addLog('⚔️ ' + msg, 'morale');
            this.showEventNotification('⚔️ ' + i18n.t('game.wavering'), msg);
            if (typeof Sound !== 'undefined' && Sound.playWagonFort) Sound.playWagonFort();
        }
    }

    // Armáda se vzpamatovala - okno protiútoku se zavřelo
    onWaveringEnd(faction) {
        const factionName = i18n.t(`factions.${faction}`);
        this.addLog(i18n.t('gameLog.armyRecovered', { faction: factionName }), 'morale');
    }

    startAnimationLoop() {
        return this.view.startAnimationLoop();
    }

    stopAnimationLoop() {
        return this.view.stopAnimationLoop();
    }

    setupTerrain() {
        // Lesy na levé straně (husitská strana)
        this.hexGrid.setTerrain(4, 2, 'forest');
        this.hexGrid.setTerrain(4, 3, 'forest');
        this.hexGrid.setTerrain(5, 2, 'forest');
        this.hexGrid.setTerrain(3, 8, 'forest');
        this.hexGrid.setTerrain(4, 8, 'forest');

        // Lesy uprostřed
        this.hexGrid.setTerrain(7, 1, 'forest');
        this.hexGrid.setTerrain(8, 1, 'forest');
        this.hexGrid.setTerrain(7, 8, 'forest');
        this.hexGrid.setTerrain(8, 8, 'forest');
        this.hexGrid.setTerrain(8, 9, 'forest');

        // Lesy na pravé straně
        this.hexGrid.setTerrain(11, 2, 'forest');
        this.hexGrid.setTerrain(10, 7, 'forest');
        this.hexGrid.setTerrain(11, 7, 'forest');

        // Kopce uprostřed - strategická pozice
        this.hexGrid.setTerrain(7, 4, 'hills');
        this.hexGrid.setTerrain(8, 4, 'hills');
        this.hexGrid.setTerrain(7, 5, 'hills');
        this.hexGrid.setTerrain(8, 5, 'hills');
        this.hexGrid.setTerrain(9, 5, 'hills');

        // Kopce na bocích
        this.hexGrid.setTerrain(5, 6, 'hills');
        this.hexGrid.setTerrain(6, 7, 'hills');
        this.hexGrid.setTerrain(10, 3, 'hills');
        this.hexGrid.setTerrain(11, 4, 'hills');

        // Města
        this.hexGrid.setTerrain(1, 4, 'town');  // Husitské město (zázemí)
        this.hexGrid.setTerrain(8, 3, 'town');  // Neutrální město uprostřed
        this.hexGrid.setTerrain(14, 4, 'town'); // Křižácké město (zázemí)

        // Řeka teče středem mapy
        this.hexGrid.setTerrain(6, 0, 'water');
        this.hexGrid.setTerrain(6, 1, 'water');
        this.hexGrid.setTerrain(5, 1, 'water');
        this.hexGrid.setTerrain(9, 6, 'water');
        this.hexGrid.setTerrain(9, 7, 'water');
        this.hexGrid.setTerrain(10, 8, 'water');
        this.hexGrid.setTerrain(10, 9, 'water');
    }

    handleHexClick(hex) {
        if (!hex || !this.hexGrid.inBounds(hex.col, hex.row)) return;

        const clickedUnit = this.getUnitAt(hex.col, hex.row);

        // Po konci bitvy se stejný vstup mění v čistě prezentační prohlídku.
        // Stav jednotek ani pravidla se už nemohou změnit, ale hráč si může
        // rozkliknout poslední pozice a pochopit, proč bitva skončila.
        if (this.gameState === 'victory') {
            if (!clickedUnit || !this.inspectUnit(clickedUnit)) this.deselectUnit();
            return;
        }

        if (!this.canStartAction()) return;
        if (this.currentFaction !== 'hussites') return; // Blokace během tahu AI

        // Pokud máme vybranou jednotku
        if (this.selectedUnit) {
            // Klik na nepřátelskou jednotku v dosahu - útok
            if (clickedUnit && clickedUnit.faction !== this.currentFaction) {
                if (this.combatSystem.canAttack(this.selectedUnit, clickedUnit)) {
                    this.combatSystem.performAttack(this.selectedUnit, clickedUnit);
                    return;
                } else {
                    Sound.playInvalid();
                }
            }

            // P4: skupinový pochod - klik na sousední hex se sepnutou POCHODOVOU
            // hradbou posune celou linii tím směrem (místo pohybu jediného vozu).
            if (!clickedUnit && this.selectedUnit.isWagon() && this.selectedUnit.marching &&
                this.selectedUnit.formationClosed && !this.selectedUnit.hasMoved) {
                const dir = this.hexGrid.directionTo(this.selectedUnit.col, this.selectedUnit.row, hex.col, hex.row);
                if (dir !== -1) {
                    this.marchWagonLine(this.selectedUnit, dir);
                    return;
                }
            }

            // Klik na prázdný hex v dosahu pohybu
            if (!clickedUnit && this.canMoveTo(this.selectedUnit, hex.col, hex.row)) {
                this.moveUnit(this.selectedUnit, hex.col, hex.row);
                return;
            }

            // Klik na stejnou jednotku - zrušení výběru
            if (clickedUnit === this.selectedUnit) {
                this.deselectUnit();
                return;
            }
        }

        // Klik na vlastní jednotku - výběr
        if (clickedUnit && clickedUnit.faction === this.currentFaction && clickedUnit.canAct()) {
            this.selectUnit(clickedUnit);
        } else {
            this.deselectUnit();
        }
    }

    selectUnit(unit) {
        if (!this.canStartAction(unit)) return;
        this.selectedUnit = unit;
        this.view.showSelection(unit);

        // Tutoriál - trigger výběru jednotky
        if (this.isTutorial) {
            this.tutorialSystem.triggerTutorialEvent('unit_selected', { unit });
        }

        // Zvuk výběru
        Sound.playSelect();

        this.updateUnitPanel(unit);
        this.render();
    }

    inspectUnit(unit) {
        if (this.gameState !== 'victory' || !unit || unit.health <= 0 || !this.units.includes(unit)) return false;
        if (unit.faction !== 'hussites' && !this.fogOfWarSystem.isEnemyVisible(unit)) return false;

        this.selectedUnit = unit;
        this.view.showSelection(unit, { moves: false, attacks: false });
        this.updateUnitPanel(unit);
        this.render();
        return true;
    }

    deselectUnit() {
        this.selectedUnit = null;
        this.view.clearSelection();
        this.updateUnitPanel(null);
        this.render();
    }

    // Výběr další jednotky která může jednat (klávesa Tab)
    selectNextUnit() {
        if (!this.canStartAction() || this.currentFaction !== 'hussites') return;
        // Získej všechny jednotky hráče které můžou jednat
        const actableUnits = this.units.filter(u =>
            u.faction === this.currentFaction &&
            u.health > 0 &&
            u.canAct()
        );

        if (actableUnits.length === 0) {
            // Žádná jednotka nemůže jednat
            this.deselectUnit();
            return;
        }

        // Najdi index aktuálně vybrané jednotky
        let currentIndex = -1;
        if (this.selectedUnit) {
            currentIndex = actableUnits.findIndex(u => u === this.selectedUnit);
        }

        // Vyber další jednotku (cyklicky)
        const nextIndex = (currentIndex + 1) % actableUnits.length;
        const nextUnit = actableUnits[nextIndex];

        this.selectUnit(nextUnit);

        // Vycentruj pohled na vybranou jednotku
        this.centerOnUnit(nextUnit);
    }

    // Vycentrování pohledu na jednotku
    centerOnUnit(unit) {
        return this.view.centerOnUnit(unit);
    }

    getUnitAt(col, row) {
        return this.units.find(u => u.col === col && u.row === row && u.health > 0);
    }

    // Získání validních pohybů pomocí BFS (jednotky nemohou procházet skrz sebe)
    // Cena vstupu na hex podle terénu (v pohybových bodech).
    // Jízda platí v těžkém terénu přirážku - lekce ze Sudoměře: rytíř
    // v bahně udělá hex za kolo, zatímco cepník projde
    getTerrainMoveCost(terrain, unit) {
        const baseCosts = {
            forest: 2,
            hills: 2,
            slope: 2,
            mud: 2,
            swamp: 3
        };
        let cost = baseCosts[terrain] || 1;
        if (unit.isCavalry && unit.isCavalry() &&
            (terrain === 'mud' || terrain === 'swamp' || terrain === 'forest')) {
            cost += 1;
        }
        return cost;
    }

    getValidMoves(unit, { visibleEnemyPreview = false } = {}) {
        // Obrana proti budoucím voláním, co zapomenou zkontrolovat canMove()
        // (řešilo se per-call-site u AI/hráče, ale sepnutý vůz nemá pohybovat
        // ani při pozdějším přidaném volání, které na to zapomene)
        if (visibleEnemyPreview) {
            // Náhled ukazuje příští možný tah, ne stav hasMoved v právě hraném kole.
            // Uzavřenou pochodovou hradbu zde raději neodhadujeme jako jeden vůz.
            if (unit.unitClass === 'fortification' || unit.movement <= 0 ||
                (unit.isWagon() && unit.formationClosed)) return [];
        } else if (!unit.canMove()) return [];

        // P4: pochodová hradba se hýbe jako SKUPINA - platné cíle jsou směry, kam
        // se posune celá linie (ne kam dojde jeden vůz). Vrať skupinové cíle.
        if (unit.isWagon() && unit.marching && unit.formationClosed) {
            return this.getWagonMarchTargets(unit);
        }

        const range = unit.movement;

        // Dijkstra s terénními cenami (dřív uniformní BFS - bahno, les
        // i bažina stály 1 a tooltip "Zpomaluje" byl planý slib)
        const startKey = `${unit.col},${unit.row}`;
        const best = new Map([[startKey, 0]]);   // klíč -> nejnižší cena dosažení
        const endable = new Set();               // hexy, kde smí pohyb skončit
        const queue = [{ col: unit.col, row: unit.row, cost: 0 }];

        while (queue.length > 0) {
            // Výběr uzlu s nejnižší cenou (mapy jsou malé, sort stačí)
            queue.sort((a, b) => a.cost - b.cost);
            const current = queue.shift();
            const currentKey = `${current.col},${current.row}`;
            if (current.cost > best.get(currentKey)) continue; // zastaralý záznam

            if (current.cost >= range) continue;

            const neighbors = this.hexGrid.getNeighbors(current.col, current.row);

            for (const neighbor of neighbors) {
                // Kontrola, zda je pole platné
                if (neighbor.col < 0 || neighbor.col >= this.hexGrid.cols ||
                    neighbor.row < 0 || neighbor.row >= this.hexGrid.rows) continue;

                // Předpověď nesmí procházet neviděným terénem ani naznačit,
                // že na neviděném poli stojí jiný oddíl. Je tedy konzervativní.
                if (visibleEnemyPreview && !this.fogOfWarSystem.isHexVisible(neighbor.col, neighbor.row)) continue;

                const terrain = this.hexGrid.getTerrain(neighbor.col, neighbor.row);

                // Voda - normálně neprůchodná, ale zamrzlá řeka (frozenRiver) je průchodná
                if (terrain === 'water') {
                    if (this.currentScenario && this.currentScenario.specialMechanics &&
                        this.currentScenario.specialMechanics.frozenRiver) {
                        // Zamrzlá řeka - průchodná, ale nebezpečná (řeší se v moveUnit)
                    } else {
                        continue;
                    }
                }

                // Bridge bottleneck - jen 1 jednotka za tah přes most
                if (this.currentScenario && this.currentScenario.specialMechanics &&
                    this.currentScenario.specialMechanics.bridgeBottleneck) {
                    const bridgePos = this.currentScenario.specialMechanics.bridgeBottleneck.position;
                    if (bridgePos && neighbor.col === bridgePos[0] && neighbor.row === bridgePos[1]) {
                        if (this.bridgeUsedThisTurn && !visibleEnemyPreview) continue;
                    }
                }

                const stepCost = this.getTerrainMoveCost(terrain, unit);

                // Garance jednoho kroku: na hex sousedící s výchozí pozicí
                // se jednotka dostane vždy, i když na něj "nemá" body
                // (jinak by pomalá jednotka před bažinou zamrzla na místě)
                const newCost = current.cost === 0
                    ? Math.min(stepCost, range)
                    : current.cost + stepCost;
                if (newCost > range) continue;

                const key = `${neighbor.col},${neighbor.row}`;
                if (newCost >= (best.get(key) ?? Infinity)) continue;
                best.set(key, newCost);

                // Kontrola, zda je pole obsazené
                const actualUnit = this.getUnitAt(neighbor.col, neighbor.row);
                const unitAtHex = visibleEnemyPreview && actualUnit &&
                    !this.fogOfWarSystem.isEnemyVisible(actualUnit) ? null : actualUnit;

                if (unitAtHex) {
                    // Přes spojence lze projít (ale ne skončit), přes nepřátele vůbec
                    if (unitAtHex.faction === unit.faction) {
                        queue.push({ col: neighbor.col, row: neighbor.row, cost: newCost });
                    }
                    continue;
                }

                // Prázdné pole - lze tam skončit
                endable.add(key);

                // ZOC (Zone of Control) - v nepřátelské zóně pohyb KONČÍ
                if (!this.isHexInEnemyZOC(neighbor.col, neighbor.row, unit.faction)) {
                    queue.push({ col: neighbor.col, row: neighbor.row, cost: newCost });
                }
            }
        }

        return [...endable].map(key => {
            const [col, row] = key.split(',').map(Number);
            return { col, row };
        });
    }

    // Kontrola, zda je hex v zóně kontroly nepřátelské jednotky
    isHexInEnemyZOC(col, row, friendlyFaction) {
        const neighbors = this.hexGrid.getNeighbors(col, row);

        for (const neighbor of neighbors) {
            const unitAtHex = this.getUnitAt(neighbor.col, neighbor.row);
            if (unitAtHex && unitAtHex.faction !== friendlyFaction && unitAtHex.health > 0) {
                // Zkontrolujeme, zda má jednotka ZOC
                const unitType = UnitTypes[unitAtHex.type];
                if (unitType && unitType.tactics && unitType.tactics.zoc === true) {
                    return true;
                }
            }
        }

        return false;
    }

    canMoveTo(unit, col, row) {
        if (!unit.canMove()) return false;

        const moves = this.getValidMoves(unit);
        return moves.some(m => m.col === col && m.row === row);
    }

    moveUnit(unit, col, row, followUpAttack = null) {
        if (!unit || !this.canStartAction(unit) || !this.canMoveTo(unit, col, row)) return Promise.resolve(false);
        return this.actions.run(async () => {
            const moved = await this.resolveMove(unit, col, row);
            if (moved && followUpAttack && this.gameState === 'playing') {
                if (!await this.actions.wait(100)) return false;
                await this.combatSystem.resolveAttack(unit, followUpAttack);
            }
            return moved;
        });
    }

    async resolveMove(unit, col, row) {
        const oldCol = unit.col;
        const oldRow = unit.row;

        // Uložení pozice pro možnost undo (pouze pokud jednotka ještě neútočila)
        if (!unit.hasAttacked) {
            this.lastMove = {
                unit: unit,
                fromCol: oldCol,
                fromRow: oldRow
            };
        }

        // Zvuk pohybu podle typu jednotky
        if (unit.type === 'JIZDA_HUSITI' || unit.type === 'TEZKA_JIZDA') {
            Sound.playHorse();
        } else if (unit.type === 'VOZOVA_HRADBA') {
            Sound.playWagonFort();
        } else {
            Sound.playMove();
        }

        unit.moveTo(col, row);

        this.addLog(i18n.t('gameLog.moved', {unit: unit.name, oldCol, oldRow, col, row}), 'move');

        // Pravidla pracují s cílovým hexem hned; vykreslený žeton do něj
        // plynule dojede před kontrolou terénu, úniku a reakční palby.
        // Rozpracovaná akce dál blokuje další rozkaz i automatický checkpoint.
        if (!await this.view.animateMove(unit, oldCol, oldRow, col, row)) return false;

        // Označení mostu jako použitého (bridge bottleneck)
        if (this.currentScenario && this.currentScenario.specialMechanics &&
            this.currentScenario.specialMechanics.bridgeBottleneck) {
            const bridgePos = this.currentScenario.specialMechanics.bridgeBottleneck.position;
            if (bridgePos && col === bridgePos[0] && row === bridgePos[1]) {
                this.bridgeUsedThisTurn = true;
            }
        }

        // Kontrola zamrzlé řeky - těžké jednotky riskují propadnutí
        if (this.checkFrozenRiver(unit)) {
            return false; // Jednotka se propadla
        }

        // Kontrola escape zóny
        if (this.checkEscapeZone(unit)) {
            return false; // Jednotka unikla, nepokračujeme
        }

        // Overwatch: nepřátelští střelci, kteří drželi pozici i palbu,
        // reagují na pohyb v dostřelu
        this.fogOfWarSystem.updateVisibility();
        await this.triggerOverwatch(unit);
        if (this.actions.destroyed) return false;
        if (unit.health <= 0) {
            // Jednotku srazila reakční palba - nepokračujeme
            this.deselectUnit();
            this.updateUnitPanel(null);
            this.render();
            this.victoryConditionsSystem.checkVictory();
            return false;
        }

        // Pokud může ještě útočit, zobrazíme cíle
        if (unit.canAttack()) {
            this.view.showSelection(unit, { moves: false });
        } else {
            this.deselectUnit();
        }

        // Tutoriál - trigger pohybu jednotky
        if (this.isTutorial) {
            this.tutorialSystem.triggerTutorialEvent('unit_moved', { unit, col, row });
        }

        this.updateUnitPanel(unit);
        this.render();
        this.victoryConditionsSystem.checkVictory();
        return true;
    }

    // Overwatch (krycí palba): oddíly s dosahem 2+, které se nehýbaly
    // a ještě mohou útočit, automaticky pálí na nepřítele v dostřelu.
    // Výjimkou jsou rychlostřelci se zbývajícím druhým výstřelem.
    // Ruční obrana výstřel spotřebuje, automatický konec tahu nikoli.
    // Síla vozové hradby: přiblížit se k ní něco stojí už cestou.
    isCoverFireReady(unit) {
        return !!unit && unit.health > 0 && !unit.escaped && unit.range >= 2 &&
            !unit.hasMoved && unit.canAttack();
    }

    async triggerOverwatch(movedUnit) {
        if (!movedUnit || movedUnit.health <= 0) return;

        const watcherFaction = movedUnit.faction === 'hussites' ? 'crusaders' : 'hussites';
        const watchers = this.units.filter(u =>
            u.faction === watcherFaction && this.isCoverFireReady(u)
        );

        for (const watcher of watchers) {
            if (movedUnit.health <= 0 || this.gameState !== 'playing' || this.actions.destroyed) break;

            const dist = this.hexGrid.getDistance(watcher.col, watcher.row, movedUnit.col, movedUnit.row);
            if (dist < 1 || dist > watcher.range) continue;

            // Mlha války: na neviditelný cíl se nestřílí
            if (watcher.faction === 'hussites' &&
                !this.fogOfWarSystem.isEnemyVisible(movedUnit)) continue;

            this.addLog(i18n.t('gameLog.overwatchFire', { unit: watcher.name, target: movedUnit.name }), 'combat');
            await this.combatSystem.resolveAttack(watcher, movedUnit, { reaction: true });
        }
    }

    // Kontrola, zda jednotka vstoupila do escape zóny
    checkEscapeZone(unit) {
        if (!this.currentScenario) return false;
        const conditions = this.currentScenario.victoryConditions;
        if (!conditions || !conditions.primary || conditions.primary.type !== 'escape') return false;

        const escapeZone = conditions.primary.escapeZone || [];
        const playerFaction = this.currentScenario.playerFaction || 'hussites';

        // Jen hráčské jednotky mohou uniknout
        if (unit.faction !== playerFaction) return false;

        // Je jednotka v escape zóně?
        const inZone = escapeZone.some(([col, row]) => unit.col === col && unit.row === row);
        if (!inZone) return false;

        // Jednotka unikla!
        this.escapedUnits = (this.escapedUnits || 0) + 1;
        const required = conditions.primary.unitsRequired || 5;
        this.addLog(i18n.t('gameLog.escaped', {unit: unit.name, escaped: this.escapedUnits, required}), 'turn');

        // Odstranit jednotku z mapy
        this.units = this.units.filter(u => u !== unit);
        this.deselectUnit();
        this.render();

        // Kontrola vítězství
        if (this.escapedUnits >= required) {
            this.addLog(i18n.t('gameLog.escapeSuccess'), 'turn');
            this.showVictory(playerFaction);
        }

        return true;
    }

    // Kontrola zamrzlé řeky - těžké jednotky mohou propadnout ledem
    checkFrozenRiver(unit) {
        if (!this.currentScenario || !this.currentScenario.specialMechanics) return false;
        if (!this.currentScenario.specialMechanics.frozenRiver) return false;

        const terrain = this.hexGrid.getTerrain(unit.col, unit.row);
        if (terrain !== 'water') return false;

        // Těžké jednotky (jízda, vozy) mají šanci propadnout
        const isHeavy = unit.isCavalry() || unit.isWagon() || unit.type === 'TEZKY_RYTIR' || unit.type === 'TEZKOODENCI';
        const drownChance = isHeavy ? 0.4 : 0.1; // 40% pro těžké, 10% pro lehké

        if (Math.random() < drownChance) {
            this.addLog(i18n.t('gameLog.iceBroke', {unit: unit.name}), 'combat');
            this.showEventNotification(
                i18n.t('messages.iceBreakTitle'),
                i18n.t('messages.iceBreakText', { unit: unit.name })
            );
            unit.health = 0;
            this.units = this.units.filter(u => u !== unit);
            this.trackUnitDeath(unit, null);
            this.handleUnitDeath(unit, null);
            this.deselectUnit();
            this.render();
            this.victoryConditionsSystem.checkVictory();
            return true;
        } else {
            this.addLog(i18n.t('gameLog.iceCrossed', {unit: unit.name}), 'move');
            return false;
        }
    }


    // Vrácení posledního pohybu (undo)
    undoLastMove() {
        if (!this.canStartAction() || this.currentFaction !== 'hussites') return false;
        if (!this.lastMove) return false;

        const { unit, fromCol, fromRow } = this.lastMove;

        // Kontrola, že jednotka ještě neprovedla útok
        if (unit.hasAttacked || unit.health <= 0 || !this.units.includes(unit)) {
            this.lastMove = null;
            return false;
        }

        // Vrácení jednotky na původní pozici
        unit.col = fromCol;
        unit.row = fromRow;
        unit.hasMoved = false;

        this.addLog(i18n.t('gameLog.unitReturned', {unit: unit.name, col: fromCol, row: fromRow}), 'move');

        // Vymazání undo
        this.lastMove = null;

        // Znovu vybrat jednotku
        this.selectUnit(unit);

        Sound.playSelect();
        this.render();

        return true;
    }

    // Kontrola, zda je možné provést undo
    canUndo() {
        if (!this.lastMove) return false;
        const { unit } = this.lastMove;
        // Undo je možné pouze pokud jednotka neprovedla útok
        return !unit.hasAttacked && unit.health > 0;
    }



    // Při konci tahu necháme stojící oddíly s dostřelem 2+ připravené ke
    // krycí palbě. Nemají bonus obrany; ten střelec získá jen vědomou volbou
    // Bránit, která současně spotřebuje zbývající výstřel. Ostatním
    // nevyužitým oddílům obranu zapneme bez mikromanagementu.
    autoDefendUnusedUnits(faction = this.currentFaction) {
        const units = this.units.filter(unit =>
            unit.faction === faction &&
            unit.health > 0 &&
            !unit.isRouting &&
            unit.canAct()
        );
        const coverFire = units.filter(unit => this.isCoverFireReady(unit));
        const defenders = units.filter(unit => !this.isCoverFireReady(unit));
        for (const unit of defenders) unit.defend();
        if (defenders.length > 0) {
            this.addLog(i18n.t('gameLog.autoDefend', { count: defenders.length }), 'move');
        }
        if (coverFire.length > 0) {
            this.addLog(i18n.t('gameLog.autoCoverFire', { count: coverFire.length }), 'move');
        }
        return units.length;
    }

    endTurn() {
        // Pokud hra již skončila, neděláme nic
        if (!this.canStartAction()) return false;

        this.autoDefendUnusedUnits();
        this.deselectUnit();

        // Reset undo při přepnutí tahu
        this.lastMove = null;

        Sound.playEndTurn();

        // Tutoriál - trigger konce tahu
        if (this.isTutorial) {
            this.tutorialSystem.triggerTutorialEvent('turn_ended');
        }

        // Přepnutí strany
        if (this.currentFaction === 'hussites') {
            this.currentFaction = 'crusaders';
            this.addLog(i18n.t('gameLog.turnCrusaders'), 'turn');
            Sound.playAITurn();
        } else {
            this.currentFaction = 'hussites';
            this.turnNumber++;
            this.addLog(i18n.t('gameLog.turnNumber', {turn: this.turnNumber}), 'turn');
            this.addLog(i18n.t('gameLog.turnHussites'), 'turn');
            Sound.playPlayerTurn();

            // Tutoriál - trigger začátku kola
            if (this.isTutorial) {
                this.tutorialSystem.triggerTutorialEvent(`turn_${this.turnNumber}_start`);
            }

            // Aktualizace fáze a kontrola eventů na začátku nového kola
            this.updatePhase();
            this.checkPhaseEvents();

            // Kontrola posil
            this.checkReinforcements();

            // Po příchodu posil - okamžitá kontrola podmínky přežití
            if (this.currentScenario && this.currentScenario.victoryConditions) {
                const primaryType = this.currentScenario.victoryConditions.primary?.type;
                if (primaryType === 'survive' || primaryType === 'survive_turns' || primaryType === 'breakthrough') {
                    this.victoryConditionsSystem.checkScenarioVictoryConditions();
                    if (this.gameState !== 'playing') {
                        this.updateUI();
                        this.render();
                        return;
                    }
                }
            }

            // Kontrola limitu tahů ve scénáři
            if (this.currentScenario && this.currentScenario.maxTurns) {
                if (this.turnNumber > this.currentScenario.maxTurns) {
                    // Čas vypršel - zkontrolovat vítězné podmínky
                    this.victoryConditionsSystem.checkScenarioVictoryConditions();
                    return;
                }
            }
        }

        // Reset jednotek aktuální frakce
        for (const unit of this.units) {
            if (unit.faction === this.currentFaction && unit.health > 0) {
                unit.resetTurn();
            }
        }

        // Reset bridge bottleneck pro novou frakci
        this.bridgeUsedThisTurn = false;

        // Aplikace velitelských aur (bonusy/postihy na začátku tahu)
        this.applyCommanderAuras();

        // Reset průlomu vozové hradby
        this.resetBreachedWagons();

        // Aplikace efektů obklíčení
        this.applySurroundedEffects();

        // Zpracování morálky - vypnuto v tutoriálu
        if (!this.isTutorial) {
            // Zpracování prchajících jednotek na konci tahu
            this.moraleSystem.processRoutingUnits();
            this.victoryConditionsSystem.checkVictory();
            if (this.gameState !== 'playing') return;

            // Kontrola šíření paniky při morálním zlomu
            this.moraleSystem.checkRoutSpread();

            // Pasivní regenerace morálky pro jednotky které neprchají
            this.moraleSystem.regenerateMorale();

            // Okno protiútoku - po zpracování morálky přehodnotit kolísání
            // (zachytí jak nový zlom z kaskády útěků, tak vzpamatování z regenerace)
            this.updateWaveringState();
        }

        // Pasivní regenerace zdraví (u vozů/města)
        this.regenerateHealth();

        // Aktualizace chorálu
        this.updateChoral();

        // Kontrola dual_objective pozic (na konci husitského tahu)
        if (this.currentFaction === 'crusaders') {
            this.victoryConditionsSystem.checkDualObjectiveProgress();
        }

        // Kontrola primary victory conditions (pro typy s časovým limitem)
        if (this.currentFaction === 'crusaders' && this.currentScenario && this.currentScenario.victoryConditions) {
            const primaryType = this.currentScenario.victoryConditions.primary?.type;
            // survive, hold_position, survive_turns mají vnitřní stráž na kola
            if (primaryType === 'survive' || primaryType === 'hold_position' || primaryType === 'survive_turns' || primaryType === 'breakthrough') {
                this.victoryConditionsSystem.checkScenarioVictoryConditions();
                if (this.gameState !== 'playing') return;
            }
            // Průběžná kontrola pro destroy/capture typy (pouze vítězství, ne porážka)
            this.victoryConditionsSystem.checkMidGameVictory();
            if (this.gameState !== 'playing') return;
        }

        this.updateUI();
        this.render();

        // Pokud jsou na tahu křižáci, spustíme AI
        if (this.currentFaction === 'crusaders') {
            this.scheduleAI();
        }
    }

    // Kontrola postupu v dual_objective cílech

    showVictory(winner) {
        if (this.gameState !== 'playing') return;
        this.gameState = 'victory';
        this.actions.destroy();
        this.showAIThinking(false);
        if (!this.selectedUnit || !this.inspectUnit(this.selectedUnit)) this.deselectUnit();
        this.updateUI();

        const isVictory = (winner === 'hussites');
        let message = this.scenarioEventSystem.getDebriefing(isVictory);

        if (this.currentScenario?.id && typeof ChronicleSystem !== 'undefined'
            && typeof ChronicleSystem.getEnemyChronicleText === 'function') {
            if (!isVictory) {
                const enemyChronicle = ChronicleSystem.getEnemyChronicleText(this.currentScenario.id, true);
                // U reaktivního závěru odlišit skutečný stav od záměrně
                // nespolehlivého hlasu vítěze (např. živý Prokop vs. jeho kronika).
                if (this.currentScenario.debriefing?.unitStatus && message && enemyChronicle) {
                    message += `\n\n${i18n.t('chronicle.enemyVoiceLabel')}\n${enemyChronicle}`;
                } else {
                    message = enemyChronicle || message;
                }
            } else if (this.currentScenario.id === 'sion_1437') {
                const competingAccounts = ChronicleSystem.getEnemyChronicleText(this.currentScenario.id, true);
                if (competingAccounts) {
                    message = `${message}\n\n${i18n.t('chronicle.competingAccounts')}\n${competingAccounts}`;
                }
            }
        }

        // Fallback na generické zprávy
        if (!message) {
            message = i18n.t(isVictory ? 'gameLog.victoryDestroyArmy' : 'gameLog.defeatDestroyOrRout');
        }

        if (isVictory) {
            Sound.playVictory();
        } else {
            Sound.playDefeat();
        }

        // Statistiky hry
        // turnNumber se zvyšuje na ZAČÁTKU kola - když vyhodnocení proběhne
        // po dokončení posledního kola, čítač už ukazuje kolo, které se
        // nikdy nehrálo (u 12kolové mise "13"). Stropujeme na maxTurns.
        // Časové mise (survive/hold/survive_turns) se vyhodnocují až na začátku
        // kola po deadline (turnNumber už tiknul), a deadline může být dřív než
        // maxTurns - strop na maxTurns proto nestačí. VictoryConditionsSystem
        // proto u nich nastaví gameOverTurn na skutečný počet odehraných kol;
        // má přednost a drží stat KOLA v souladu s textem ("do kola 5").
        const maxTurns = this.currentScenario && this.currentScenario.maxTurns;
        const completedTurns = (this.gameOverTurn != null)
            ? this.gameOverTurn
            : (maxTurns ? Math.min(this.turnNumber, maxTurns) : this.turnNumber);
        const stats = {
            turns: completedTurns,
            enemiesKilled: this.enemiesKilled || 0,
            unitsLost: this.unitsLost || 0,
            secondaryObjectives: this.secondaryResults || [],
            // Konkrétní důvod výsledku (nastavuje VictoryConditionsSystem.outcome)
            reason: this.gameOverReason || null,
            // WP2a: data pro "Vy vs. kronika"
            scenarioId: this.currentScenario && this.currentScenario.id,
            lossesByFaction: this.lossesByFaction,
            fledByFaction: this.fledByFaction,
            aliveByFaction: this.units.reduce((acc, u) => {
                if (u.health > 0) acc[u.faction] = (acc[u.faction] || 0) + 1;
                return acc;
            }, { hussites: 0, crusaders: 0 })
        };
        this.gameOverReason = null;
        this.gameOverTurn = null;

        // Trvalý postup kampaně a pověst. Zapisuje se jednou; opakované
        // otevření modalu ani dvojí victory check reputaci nezmění.
        if (typeof CampaignProgressSystem !== 'undefined' && !this.campaignRecorded
            && this.currentScenario?.id) {
            this.campaignRecorded = true;
            const alive = stats.aliveByFaction;
            const playerLosses = (this.lossesByFaction.hussites || 0) + (this.fledByFaction.hussites || 0);
            const playerTotal = (alive.hussites || 0) + playerLosses;
            stats.campaignProgress = CampaignProgressSystem.recordBattle({
                scenarioId: this.currentScenario.id,
                result: isVictory ? 'victory' : 'defeat',
                turns: completedTurns,
                maxTurns: maxTurns || null,
                lossRatio: playerTotal > 0 ? playerLosses / playerTotal : 1
            });

            if (stats.campaignProgress?.actCompleted && typeof ChronicleSystem !== 'undefined'
                && typeof ChronicleSystem.recordActSummary === 'function') {
                ChronicleSystem.recordActSummary(stats.campaignProgress.actCompleted);
            }
        }

        // WP2b: zápis do Kroniky (jednou za bitvu, jen scénáře - ne rychlá bitva)
        if (typeof ChronicleSystem !== 'undefined' && !this.chronicleRecorded
            && this.currentScenario && this.currentScenario.id) {
            const alive = stats.aliveByFaction;
            const pLost = (this.lossesByFaction.hussites || 0) + (this.fledByFaction.hussites || 0);
            const eKilled = this.lossesByFaction.crusaders || 0;
            const eFled = this.fledByFaction.crusaders || 0;
            this.chronicleRecorded = ChronicleSystem.record({
                scenarioId: this.currentScenario.id,
                result: isVictory ? 'victory' : 'defeat',
                playerLosses: pLost,
                playerFled: this.fledByFaction.hussites || 0,
                playerTotal: (alive.hussites || 0) + pLost,
                enemyLosses: eKilled,
                enemyTotal: (alive.crusaders || 0) + eKilled + eFled,
                fled: eFled,
                turns: completedTurns,
                blind: this.blindMode || false,
                narrative: this.scenarioEventSystem.captureNarrativeOutcome(isVictory),
                ts: Date.now()
            });
        }

        SaveGameSystem.finishAutomatic(this.lastAutosaveRaw);
        this.view.showGameOver(isVictory, message, stats);
    }

    async runAI() {
        if (this.gameState !== 'playing') return;
        if (this.currentFaction !== 'crusaders') return;
        if (this.aiRunning || this.actions.busy || this.isPaused) return;
        this.aiRunning = true;

        // Zobrazení AI thinking indikátoru
        this.showAIThinking(true);

        // AI je implementována v ai.js
        try {
            if (typeof AI !== 'undefined') await AI.takeTurn(this);
            else this.endTurn();
        } finally {
            this.aiRunning = false;
            if (this.gameState !== 'destroyed') this.showAIThinking(false);
        }
    }

    // Zobrazení/skrytí AI thinking indikátoru
    showAIThinking(show) {
        return this.view.showAIThinking(show);
    }

    // WP5: zobrazované jméno strany pro aktuální scénář.
    // Živý lookup přes i18n (scenarios.<id>.factionNames.<faction>) - přežije přepnutí
    // jazyka; fallback na generické factions.<faction> (Husité/Křižáci).
    factionLabel(faction) {
        return this.view.factionLabel(faction);
    }

    // Aktualizace UI
    updateUI() {
        return this.view.updateUI();
    }

    // Kontrola zda všechny jednotky hráče již jednaly
    allPlayerUnitsActed() {
        const playerUnits = this.units.filter(u =>
            u.faction === this.currentFaction && u.health > 0
        );

        // Pokud nejsou žádné živé jednotky, vrátíme true
        if (playerUnits.length === 0) return true;

        // Zkontrolujeme, zda všechny jednotky již nemůžou jednat
        return playerUnits.every(u => !u.canAct());
    }

    // Aktualizace tlačítka Ukončit tah - pulsuje když všechny jednotky jednaly
    updateEndTurnButton() {
        return this.view.updateEndTurnButton();
    }

    updateArmyOverview() {
        return this.view.updateArmyOverview();
    }

    // Vykreslení lišty morálky jedné armády
    renderMoraleBar(prefix, faction, aliveCount) {
        return this.view.renderMoraleBar(prefix, faction, aliveCount);
    }

    updateUnitPanel(unit) {
        return this.view.updateUnitPanel(unit);
    }

    clearLog() {
        this.log = [];
        this.view.clearLog();
    }

    addLog(message, type = '') {
        this.log.push({ message, type });
        this.view.addLog(message, type);
    }

    // Odvozená viditelnost patří pravidlům, samotné vykreslení je pouze čtení.
    render() {
        this.fogOfWarSystem.updateVisibility();
        this.view.render();
    }

    // Pomocné metody pro AI
    getUnitsOfFaction(faction) {
        return this.units.filter(u => u.faction === faction && u.health > 0);
    }

    getEnemyUnits(faction) {
        return this.units.filter(u => u.faction !== faction && u.health > 0);
    }

    // Uložení hry do localStorage
    saveGame({ automatic = false } = {}) {
        // Save nesmí zachytit půl nájezdu ani půl tahu AI.
        if (this.gameState !== 'playing' || this.actions.busy || this.currentFaction !== 'hussites') {
            if (!automatic) this.addLog(i18n.t('gameLog.saveUnavailable'), 'turn');
            return false;
        }
        try {
            const saveData = {
                version: SaveGameSystem.VERSION,
                scenarioId: this.currentScenario ? this.currentScenario.id : null,
                mapRevision: this.currentScenario?.mapRevision ?? 1,
                turnNumber: this.turnNumber,
                currentFaction: this.currentFaction,
                gameState: this.gameState,
                units: this.units.map(u => u.serialize()),
                terrain: [...this.hexGrid.hexes.values()].map(hex => [hex.col, hex.row, hex.terrain]),
                fastForwardAI: this.fastForwardAI,
                campaignRecorded: this.campaignRecorded,
                chronicleRecorded: Boolean(this.chronicleRecorded),
                nextUnitId: this.unitFactory.nextId,
                // Průběh scénáře - bez něj by se po načtení znovu spouštěly
                // eventy a podmínky vítězství by počítaly se špatnými čísly
                processedEvents: [...this.processedEvents],
                objectiveHeldTurns: this.objectiveHeldTurns || {},
                enemiesKilled: this.enemiesKilled,
                unitsLost: this.unitsLost,
                lossesByFaction: this.lossesByFaction,  // WP2a
                fledByFaction: this.fledByFaction,
                escapedUnits: this.escapedUnits || 0,
                stats: this.stats,
                initialPlayerUnits: this.initialPlayerUnits,
                initialEnemyUnits: this.initialEnemyUnits,
                elapsedGameTime: Math.max(0, Date.now() - this.gameDuration),
                bridgeUsedThisTurn: Boolean(this.bridgeUsedThisTurn),
                campaignReputation: this.campaignReputation,
                aiStance: {
                    mode: this.aiStance?.mode || 'default',
                    target: this.aiStance?.target ? { ...this.aiStance.target } : null,
                    untilTurn: this.aiStance?.untilTurn ?? null,
                    proximity: this.aiStance?.proximity ?? 3
                },
                // Chorál a morální zlom
                choralUsed: this.choralUsed,
                choralActive: this.choralActive,
                choralTurnsRemaining: this.choralTurnsRemaining,
                moraleBroken: this.moraleBroken,
                wavering: this.wavering,
                // Mlha války
                fogOfWar: this.fogOfWar,
                exploredHexes: [...this.exploredHexes],
                savedAt: new Date().toISOString()
            };
            const raw = SaveGameSystem.write(saveData, { automatic });
            if (automatic) {
                const wasFailed = this.autosaveFailed;
                this.autosaveFailed = false; this.lastAutosaveRaw = raw;
                if (wasFailed) this.updateEndTurnButton();
            }
            else {
                this.addLog(i18n.t('gameLog.gameSaved'), 'turn');
                Sound.playSelect();
            }
            return true;
        } catch (e) {
            if (!automatic || !this.autosaveFailed) {
                console.error('Chyba při ukládání:', e);
                this.addLog(i18n.t(automatic ? 'touch.autosaveError' : 'gameLog.saveError'), 'combat');
            }
            if (automatic && !this.autosaveFailed) {
                this.autosaveFailed = true;
                this.updateEndTurnButton();
            }
            return false;
        }
    }

    // Pouze interní obnovení již ověřených dat na NOVÉ instanci.
    // Všechny uživatelské vstupy musí jít přes SaveGameSystem.load.
    restoreSavedState({ data: saveData, units }) {
        // Obnovení stavu
        this.turnNumber = saveData.turnNumber;
        this.currentFaction = saveData.currentFaction;
        this.gameState = saveData.gameState;
        this.unitFactory.nextId = Math.max(saveData.nextUnitId || 1, ...units.map(unit => unit.id + 1));

        // Obnovení jednotek
        this.units = units;

        // Scénářový terén připravil SaveGameSystem; v4 obnoví i změny za hry.
        if (!this.currentScenario) {
            this.setupTerrain();
        }
        for (const [col, row, terrain] of saveData.terrain || []) this.hexGrid.setTerrain(col, row, terrain);

        // Průběh scénáře
        this.processedEvents = new Set(saveData.processedEvents || []);
        this.objectiveHeldTurns = saveData.objectiveHeldTurns || {};
        this.enemiesKilled = saveData.enemiesKilled || 0;
        this.unitsLost = saveData.unitsLost || 0;
        this.lossesByFaction = saveData.lossesByFaction || { hussites: 0, crusaders: 0 };  // WP2a
        this.fledByFaction = saveData.fledByFaction || { hussites: 0, crusaders: 0 };
        this.escapedUnits = saveData.escapedUnits || 0;
        if (saveData.stats) {
            this.stats = saveData.stats;
        }
        if (saveData.initialPlayerUnits !== undefined) {
            this.initialPlayerUnits = saveData.initialPlayerUnits;
        }
        if (saveData.initialEnemyUnits !== undefined) {
            this.initialEnemyUnits = saveData.initialEnemyUnits;
        }
        if (typeof saveData.elapsedGameTime === 'number') {
            this.gameDuration = Date.now() - Math.max(0, saveData.elapsedGameTime);
        }
        this.bridgeUsedThisTurn = Boolean(saveData.bridgeUsedThisTurn);
        if (typeof saveData.campaignReputation === 'number') {
            this.campaignReputation = Math.max(0, Math.min(100, saveData.campaignReputation));
        }
        this.campaignRecorded = Boolean(saveData.campaignRecorded);
        this.chronicleRecorded = Boolean(saveData.chronicleRecorded);
        this.fastForwardAI = Boolean(saveData.fastForwardAI);
        if (saveData.aiStance && typeof saveData.aiStance === 'object') {
            this.aiStance = {
                mode: saveData.aiStance.mode || 'default',
                target: saveData.aiStance.target ? { ...saveData.aiStance.target } : null,
                untilTurn: saveData.aiStance.untilTurn ?? null,
                proximity: saveData.aiStance.proximity ?? 3
            };
        }

        // Chorál a morální zlom
        this.choralUsed = saveData.choralUsed || false;
        this.choralActive = saveData.choralActive || false;
        this.choralTurnsRemaining = saveData.choralTurnsRemaining || 0;
        this.moraleBroken = saveData.moraleBroken || false;
        this.wavering = saveData.wavering || { hussites: false, crusaders: false };

        // Mlha války
        if (saveData.fogOfWar !== undefined) {
            this.fogOfWar = saveData.fogOfWar;
        }
        this.exploredHexes = new Set(saveData.exploredHexes || []);
        this.visibleHexes = new Set();

        // Routující jednotky - stav je per-unit (isRouting), Set jen sleduje
        this.routingUnits = new Set(
            this.units.filter(u => u.isRouting).map(u => u.id)
        );

        // Fáze scénáře podle načteného kola
        if (this.currentScenario) {
            this.updatePhase();
        }

        // Reset výběru
        this.selectedUnit = null;
        this.view.clearSelection();

        // Aktualizace UI
        this.updateUI();
        this.updateUnitPanel(null);
        this.render();

        this.addLog(i18n.t('gameLog.gameLoaded', {turn: this.turnNumber, faction: this.currentFaction === 'hussites' ? i18n.t('factions.hussites') : i18n.t('factions.crusaders')}), 'turn');
        Sound.playSelect();

        // Pokud je na tahu AI, spustíme ji
        if (this.currentFaction === 'crusaders' && this.gameState === 'playing') {
            this.scheduleAI();
        }

    }

    // Kontrola, zda existuje uložená hra
    hasSavedGame() {
        return GameStorage.getItem(SaveGameSystem.STORAGE_KEY) !== null;
    }

    // Smazání uložené hry
    deleteSave() {
        GameStorage.removeItem(SaveGameSystem.STORAGE_KEY);
    }

    // ==========================================
    // SYSTÉM MORÁLKY
    // ==========================================

    // Jednotné zpracování smrti jednotky. Každý kill-path (přímý zásah,
    // protiútok, plošný útok, eventy) musí projít tudy - jinak smrt
    // velitele nespustí kolaps morálky a zničený vůz neotevře průlom.
    handleUnitDeath(victim, killer = null) {
        // Dedup (stejný důvod jako trackUnitDeath): jinak by dvojí volání
        // dvakrát srazilo morálku armády, dvakrát řešilo smrt velitele/vozu
        // a dvakrát odměnilo zabijáka.
        if (victim._deathHandled) return;
        victim._deathHandled = true;

        if (victim.isCommander && victim.isCommander()) {
            this.onCommanderDeath(victim);
        }
        if (victim.isWagon && victim.isWagon()) {
            this.onWagonDestroyed(victim);
        }
        this.applyMoraleLossOnDeath(victim);

        // Vítězství v souboji zvyšuje morálku přeživšího vítěze
        if (killer && killer.health > 0) {
            killer.increaseMorale(10, i18n.t('gameLog.combatVictory'));
        }
    }

    // Aplikace ztráty morálky při smrti jednotky na blízké spojence
    applyMoraleLossOnDeath(deadUnit) {
        // Vypnuto v tutoriálu
        if (this.isTutorial) return;

        const neighbors = this.hexGrid.getNeighbors(deadUnit.col, deadUnit.row);

        for (const neighbor of neighbors) {
            const nearbyUnit = this.getUnitAt(neighbor.col, neighbor.row);
            if (nearbyUnit && nearbyUnit.faction === deadUnit.faction && nearbyUnit.health > 0) {
                // Blízké jednotky ztrácí 15 morálky při smrti spojence
                const result = nearbyUnit.reduceMorale(15, 'Smrt spojence');
                if (result.startedRouting) {
                    this.addLog(i18n.t('gameLog.fleeingNearDeath', {unit: nearbyUnit.name, deadUnit: deadUnit.name}), 'morale');
                }
            }
        }

        // Všechny jednotky stejné frakce ztrácí trochu morálky (5)
        for (const unit of this.units) {
            if (unit.faction === deadUnit.faction && unit.health > 0 && unit.id !== deadUnit.id) {
                const result = unit.reduceMorale(5, 'Ztráta spojence');
                if (result.startedRouting) {
                    this.addLog(i18n.t('gameLog.fleeingCasualties', {unit: unit.name}), 'morale');
                }
            }
        }

        // Kontrola morálního zlomu po smrti jednotky
        this.moraleSystem.checkMoraleBreak();
    }


    // ==========================================
    // SYSTÉM VELITELŮ
    // ==========================================

    // Získání všech velitelů dané frakce
    getCommanders(faction) {
        return this.units.filter(u => u.faction === faction && u.health > 0 && u.isCommander());
    }

    // Získání nejbližšího velitele pro jednotku
    getNearestCommander(unit) {
        const commanders = this.getCommanders(unit.faction);
        let nearest = null;
        let nearestDistance = Infinity;

        for (const commander of commanders) {
            const dist = this.hexGrid.getDistance(unit.col, unit.row, commander.col, commander.row);
            if (dist < nearestDistance) {
                nearestDistance = dist;
                nearest = commander;
            }
        }

        return nearest ? { commander: nearest, distance: nearestDistance } : null;
    }

    // Kontrola, zda je jednotka v dosahu velitelské aury
    isInCommanderAura(unit) {
        const commanders = this.getCommanders(unit.faction);

        for (const commander of commanders) {
            const abilities = commander.getCommanderAbilities();
            if (!abilities) continue;

            const distance = this.hexGrid.getDistance(unit.col, unit.row, commander.col, commander.row);
            if (distance <= abilities.auraRange && distance > 0) {
                return { commander, abilities, distance };
            }
        }

        return null;
    }


    // Získání bonusů z velitelské aury pro jednotku
    getCommanderBonuses(unit) {
        const auraInfo = this.isInCommanderAura(unit);
        if (!auraInfo) return null;

        const { commander, abilities } = auraInfo;
        const bonuses = {
            commander: commander.name,
            attack: abilities.attackBonus || 0,
            defense: abilities.defenseBonus || 0,
            morale: abilities.moraleBonus || 0,
            rally: abilities.rallyBonus || 0
        };

        // Speciální bonusy podle typu jednotky
        if (unit.isWagon() && abilities.wagonBonus) {
            bonuses.defense += abilities.wagonBonus;
        }
        if (unit.isCavalry() && abilities.cavalryBonus) {
            bonuses.attack += abilities.cavalryBonus;
        }

        return bonuses;
    }

    // Aplikace efektu strachu od nepřátelského velitele
    getEnemyCommanderFearPenalty(unit) {
        const enemyFaction = unit.faction === 'hussites' ? 'crusaders' : 'hussites';
        const enemyCommanders = this.getCommanders(enemyFaction);

        let totalPenalty = 0;

        for (const commander of enemyCommanders) {
            const abilities = commander.getCommanderAbilities();
            if (!abilities || !abilities.fearRange) continue;

            const distance = this.hexGrid.getDistance(unit.col, unit.row, commander.col, commander.row);
            if (distance <= abilities.fearRange) {
                totalPenalty += abilities.fearPenalty || 0;
            }
        }

        return totalPenalty;
    }

    // Aplikace velitelských bonusů na začátku tahu
    applyCommanderAuras() {
        for (const unit of this.units) {
            if (unit.health <= 0 || unit.isCommander()) continue;
            // Jen frakce, jejíž tah právě začíná - endTurn běží 2x za kolo
            // a bez filtru by aury tikaly dvojnásobnou rychlostí
            if (unit.faction !== this.currentFaction) continue;

            // Bonusy od spojeneckého velitele
            const bonuses = this.getCommanderBonuses(unit);
            if (bonuses) {
                // Bonus k morálce (pokud není na maximu)
                if (unit.morale < unit.maxMorale) {
                    const moraleGain = Math.min(bonuses.morale / 5, unit.maxMorale - unit.morale);
                    if (moraleGain > 0) {
                        unit.increaseMorale(moraleGain, `Vedení: ${bonuses.commander}`);
                    }
                }
            }

            // Postih od nepřátelského velitele
            const fearPenalty = this.getEnemyCommanderFearPenalty(unit);
            if (fearPenalty > 0 && unit.morale > 30) {
                unit.reduceMorale(fearPenalty / 2, 'Strach z nepřátelského velitele');
            }
        }
    }

    // Efekt smrti velitele
    onCommanderDeath(commander) {
        this.addLog(i18n.t('gameLog.commanderFallen', {commander: commander.name}), 'commander');

        // Masivní ztráta morálky pro celou armádu
        for (const unit of this.units) {
            if (unit.faction === commander.faction && unit.health > 0) {
                const moraleLoss = 25; // Velká ztráta
                const result = unit.reduceMorale(moraleLoss, `Smrt velitele ${commander.name}`);
                if (result.startedRouting) {
                    this.addLog(i18n.t('gameLog.fleeingCommander', {unit: unit.name}), 'morale');
                }
            }
        }

        // Bonus morálky pro nepřítele
        const enemyFaction = commander.faction === 'hussites' ? 'crusaders' : 'hussites';
        for (const unit of this.units) {
            if (unit.faction === enemyFaction && unit.health > 0) {
                unit.increaseMorale(10, `Zabili jsme ${commander.name}!`);
            }
        }
    }

    // ==========================================
    // SYSTÉM OBKLÍČENÍ
    // ==========================================

    // Kontrola, zda je jednotka obklíčena (nepřátelé na protilehlých stranách)
    // Vrací: { surrounded: bool, level: 0-3, directions: [[dir1, dir2], ...] }
    checkSurrounded(unit) {
        const enemyFaction = unit.faction === 'hussites' ? 'crusaders' : 'hussites';

        // Zjistíme, na kterých směrech jsou nepřátelé (0-5).
        // POZOR: nelze použít hexGrid.getNeighbors() - ten hexy mimo mapu
        // vyfiltruje a pole zkomprimuje, takže index != směr a protilehlé
        // páry by na okraji mapy párovaly náhodné dvojice. Směrové tabulky
        // odpovídají getNeighbors v hex.js (odd-q offset).
        const isOddCol = unit.col % 2 === 1;
        const directions = isOddCol ? [
            [0, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]
        ] : [
            [0, -1], [1, -1], [1, 0], [0, 1], [-1, 0], [-1, -1]
        ];

        const enemyDirections = [];
        for (let i = 0; i < 6; i++) {
            const nc = unit.col + directions[i][0];
            const nr = unit.row + directions[i][1];
            // Směr mimo mapu nemůže obsahovat nepřítele
            if (nc < 0 || nc >= this.hexGrid.cols || nr < 0 || nr >= this.hexGrid.rows) continue;
            const enemyAtPos = this.units.find(u =>
                u.col === nc &&
                u.row === nr &&
                u.faction === enemyFaction &&
                u.health > 0
            );
            if (enemyAtPos) {
                enemyDirections.push(i);
            }
        }

        // Protilehlé páry směrů v hex gridu: (0,3), (1,4), (2,5)
        const oppositePairs = [[0, 3], [1, 4], [2, 5]];
        const surroundedPairs = [];

        for (const [dir1, dir2] of oppositePairs) {
            if (enemyDirections.includes(dir1) && enemyDirections.includes(dir2)) {
                surroundedPairs.push([dir1, dir2]);
            }
        }

        return {
            surrounded: surroundedPairs.length > 0,
            level: surroundedPairs.length, // 1 = částečně, 2 = silně, 3 = zcela obklíčen
            directions: surroundedPairs,
            enemyCount: enemyDirections.length
        };
    }


    // Aplikace efektů obklíčení na začátku tahu
    applySurroundedEffects() {
        for (const unit of this.units) {
            if (unit.health <= 0) continue;
            // Jen frakce na tahu - jinak ztráta morálky z obklíčení tiká
            // 2x za kolo (endTurn běží při přepnutí na obě strany)
            if (unit.faction !== this.currentFaction) continue;

            const surroundInfo = this.checkSurrounded(unit);
            if (surroundInfo.surrounded) {
                unit.isSurrounded = true;
                unit.surroundedLevel = surroundInfo.level;

                // Ztráta morálky za obklíčení
                const moraleLoss = surroundInfo.level * 5;
                const result = unit.reduceMorale(moraleLoss, 'Obklíčení');

                if (result.startedRouting) {
                    this.addLog(i18n.t('gameLog.fleeingSurrounded', {unit: unit.name}), 'morale');
                }
            } else {
                unit.isSurrounded = false;
                unit.surroundedLevel = 0;
            }
        }
    }

    // WP2a: přesné počítání ztrát per frakce (zabití vs. uprchlí). Volá se z OBOU
    // death-path (Game.trackUnitDeath i CombatSystem.trackUnitDeath), ať sedí i led
    // u Německého Brodu (utonulí se z this.units odebírají).
    recordLoss(deadUnit) {
        if (!this.lossesByFaction) this.lossesByFaction = { hussites: 0, crusaders: 0 };
        if (!this.fledByFaction) this.fledByFaction = { hussites: 0, crusaders: 0 };
        const bucket = deadUnit.escaped ? this.fledByFaction : this.lossesByFaction;
        bucket[deadUnit.faction] = (bucket[deadUnit.faction] || 0) + 1;
    }

    // Sledování smrti jednotek pro statistiky
    trackUnitDeath(deadUnit, killer) {
        // Dedup: dva útoky na týž cíl v jednom 300ms okně (damage se aplikuje
        // se zpožděním) jinak započítají smrt dvakrát - nafoukne enemiesKilled
        // (a tím destroy_percent vítězství), ztráty i čísla v kronice.
        if (deadUnit._deathCounted) return;
        deadUnit._deathCounted = true;

        const playerFaction = this.currentScenario?.playerFaction || 'hussites';
        this.recordLoss(deadUnit);

        if (deadUnit.faction === playerFaction) {
            // Hráč ztratil jednotku
            this.unitsLost++;
        } else {
            // Hráč zabil nepřítele
            this.enemiesKilled++;

            // Sledování zabití pro MVP
            if (killer && killer.faction === playerFaction) {
                if (!this.stats.unitKills[killer.id]) {
                    this.stats.unitKills[killer.id] = 0;
                }
                this.stats.unitKills[killer.id]++;
            }
        }
    }

    // Sledování poškození pro statistiky
    trackDamage(attacker, defender, damage) {
        const playerFaction = this.currentScenario?.playerFaction || 'hussites';

        if (attacker.faction === playerFaction) {
            // Hráč způsobil poškození
            this.stats.totalDamage += damage;

            // Sledování poškození pro MVP
            if (!this.stats.unitDamage[attacker.id]) {
                this.stats.unitDamage[attacker.id] = 0;
            }
            this.stats.unitDamage[attacker.id] += damage;
        } else {
            // Hráč obdržel poškození
            this.stats.damageTaken += damage;
        }
    }

    // isUnitNearWagonOrTown - helper pro regeneraci
    // =============================================
    // PASIVNÍ REGENERACE ZDRAVÍ
    // =============================================

    // Kontrola, zda je jednotka u vozové hradby nebo v městě (pro regeneraci)
    isUnitNearWagonOrTown(unit) {
        // Kontrola terénu - město (getTerrain vrací string, ne objekt)
        const terrain = this.hexGrid.getTerrain(unit.col, unit.row);
        if (terrain === 'town') {
            return { type: 'town', name: i18n.t('terrain.town') };
        }

        // Kontrola sousedních polí pro vozy
        const neighbors = this.hexGrid.getNeighbors(unit.col, unit.row);
        for (const neighbor of neighbors) {
            const adjacentUnit = this.getUnitAt(neighbor.col, neighbor.row);
            if (adjacentUnit &&
                adjacentUnit.faction === unit.faction &&
                adjacentUnit.health > 0 &&
                adjacentUnit.isWagon && adjacentUnit.isWagon()) {
                return { type: 'wagon', name: i18n.t('messages.wagonFortTitle') };
            }
        }

        return null;
    }

    // Pasivní regenerace zdraví na konci tahu
    regenerateHealth() {
        // Regenerace pouze na začátku husitského tahu (po křižáckém tahu)
        if (this.currentFaction !== 'hussites') return;

        // Set se čistí každé kolo - bez toho by se každá jednotka vyléčila
        // jen jednou za celou hru místo jednou za kolo
        this.regeneratedUnits.clear();

        const HEAL_AMOUNT = 10;
        const MAX_HEAL_PERCENT = 0.5; // Max 50% maxHealth

        for (const unit of this.units) {
            // Přeskočit mrtvé, vozy a jednotky které již regenerovaly
            if (unit.health <= 0) continue;
            if (unit.isWagon && unit.isWagon()) continue;
            if (this.regeneratedUnits.has(unit.id || `${unit.col}-${unit.row}`)) continue;

            // Kontrola, zda je jednotka u vozu nebo v městě
            const healSource = this.isUnitNearWagonOrTown(unit);
            if (!healSource) continue;

            // Max heal = 50% maxHealth
            const maxHealableHealth = Math.floor(unit.maxHealth * MAX_HEAL_PERCENT);
            if (unit.health >= maxHealableHealth) continue;

            // Vypočítat kolik můžeme vyléčit
            const healAmount = Math.min(HEAL_AMOUNT, maxHealableHealth - unit.health);
            if (healAmount <= 0) continue;

            // Vyléčit a označit jako regenerovanou
            unit.health += healAmount;
            this.regeneratedUnits.add(unit.id || `${unit.col}-${unit.row}`);

            this.addLog(i18n.t('gameLog.unitHealing', {unit: unit.name, amount: healAmount, source: healSource.name}), 'move');
        }
    }

    // =============================================
    // CHORÁL "KTOŽ JSÚ BOŽÍ BOJOVNÍCI"
    // =============================================

    // Aktivace chorálu - jednorázová schopnost
    activateChoral() {
        if (!this.canStartAction()) return false;
        if (this.choralUsed) {
            this.addLog(i18n.t('gameLog.choralAlreadyUsed'), 'turn');
            return false;
        }

        if (this.currentFaction !== 'hussites') {
            this.addLog(i18n.t('gameLog.choralWrongFaction'), 'turn');
            return false;
        }

        this.choralUsed = true;
        this.choralActive = true;
        this.choralTurnsRemaining = 2;

        this.addLog(i18n.t('gameLog.choralActivated'), 'turn');

        this.view.showPhaseBanner(`⚔️ ${i18n.t('game.choralActive')}`, i18n.t('game.choralEffect', { turns: 2 }));

        // WP4: psychologický šok chorálu na nepřítele + přehrání hymnu
        this.applyChoralShock();
        if (typeof Music !== 'undefined' && Music.playChoral) {
            Music.playChoral();
        }

        // Aktualizace tlačítka
        this.updateChoralButton();

        this.render();
        return true;
    }

    // WP4: chorál jako psychologická zbraň. U Domažlic ho slyšeli na kilometry a
    // křižáci se dali na útěk od pouhého zvuku. Nepřítel -8 morálka (+ 30% test
    // okamžitého útěku při morálce <25), husité +5. Volá se při každé aktivaci chorálu.
    applyChoralShock() {
        let routed = 0;
        const moraleDamage = typeof CampaignProgressSystem !== 'undefined'
            ? CampaignProgressSystem.getChoralMoraleDamage(
                this.currentScenario?.id,
                8,
                this.campaignReputation
            )
            : 8;
        for (const unit of this.units) {
            if (unit.health <= 0) continue;
            if (unit.faction === 'hussites') {
                unit.morale = Math.min(unit.maxMorale, unit.morale + 5);
            } else {
                unit.morale = Math.max(0, unit.morale - moraleDamage);
                // Po zásahu nízká morálka -> okamžitý útěk (zrcadlí panic level 3)
                if (unit.morale < 25 && Math.random() < 0.3) {
                    this.routingUnits.add(unit.id || `${unit.col}-${unit.row}`);
                    unit.isRouting = true;
                    routed++;
                    this.addLog(i18n.t('gameLog.panicFlee', {unit: unit.name}), 'morale');
                }
            }
        }
        this.addLog(i18n.t('gameLog.choralShockEnemy'), 'morale');
        this.updateWaveringState();   // morálka armád se změnila -> okno protiútoku
        this.updateArmyOverview();
        return routed;
    }

    // Aktualizace stavu tlačítka chorálu
    updateChoralButton() {
        return this.view.updateChoralButton();
    }

    // Aktualizace stavu chorálu na konci tahu
    updateChoral() {
        if (!this.choralActive) return;

        // Snížit pouze na začátku husitského tahu
        if (this.currentFaction !== 'hussites') return;

        this.choralTurnsRemaining--;

        if (this.choralTurnsRemaining <= 0) {
            this.choralActive = false;
            this.addLog(i18n.t('gameLog.choralExpired'), 'turn');

            this.view.showPhaseBanner(this.currentPhase?.name || null, this.currentPhase?.description || '');
        } else {
            this.addLog(i18n.t('gameLog.choralRemaining', {turns: this.choralTurnsRemaining}), 'turn');
            this.view.updatePhaseDescription(i18n.t('game.choralEffect', { turns: this.choralTurnsRemaining }));
        }

        // Aktualizovat tlačítko
        this.updateChoralButton();
    }

    // Získání bonusu/postihu z chorálu

    // =============================================
    // VOZOVÁ HRADBA - FORMACE
    // =============================================

    // Kontrola, zda je jednotka v linii vozové hradby (3+ vozy vedle sebe)
    isInWagonLine(unit) {
        if (!unit.isWagon || !unit.isWagon()) return null;
        // WP1: jen SEPNUTÝ vůz drží linii; rozpojený z ní vypadává
        if (!unit.formationClosed) return null;

        const neighbors = this.hexGrid.getNeighbors(unit.col, unit.row);
        let adjacentWagons = 0;
        const wagonNeighbors = [];

        for (const neighbor of neighbors) {
            const adjacentUnit = this.getUnitAt(neighbor.col, neighbor.row);
            if (adjacentUnit &&
                adjacentUnit.faction === unit.faction &&
                adjacentUnit.health > 0 &&
                adjacentUnit.isWagon && adjacentUnit.isWagon() &&
                adjacentUnit.formationClosed) {  // WP1: jen sepnutí sousedé tvoří řetěz
                adjacentWagons++;
                wagonNeighbors.push(adjacentUnit);
            }
        }

        // Pro linii potřebujeme alespoň 2 sousední vozy (celkem 3+ v linii)
        if (adjacentWagons >= 2) {
            return {
                inLine: true,
                wagonCount: adjacentWagons + 1,
                // P4: pochodová linie drží jen POLOVIČNÍ formační kryt (hradba za pohybu)
                defenseBonus: unit.marching ? 5 : 10
            };
        }

        return null;
    }

    // WP1: přepnutí stavu jednoho vozu (sepnout/rozevřít). Utratí pohyb, střílet smí dál.
    toggleWagonFormation(unit) {
        if (!this.canStartAction(unit)) return false;
        if (!unit || !unit.isWagon() || unit.faction !== this.currentFaction) return false;
        if (unit.hasMoved) return false; // vůz už v tomto tahu jednal
        unit.formationClosed = !unit.formationClosed;
        unit.hasMoved = true;
        this.addLog(i18n.t(unit.formationClosed ? 'gameLog.wagonClosed' : 'gameLog.wagonOpened', { unit: unit.name }), 'turn');
        this.updateUnitPanel(unit);
        this.render();
        return true;
    }

    // WP1: přepne celou souvisle propojenou řadu vozů (BFS přes hex-sousednost).
    // Cílový stav udá výchozí vůz; už jednavší vozy se přeskočí, ale souvislost drží.
    toggleWagonFormationLine(startUnit) {
        if (!this.canStartAction(startUnit)) return false;
        if (!startUnit || !startUnit.isWagon() || startUnit.faction !== this.currentFaction) return false;
        if (startUnit.hasMoved) return false; // vůz už v tomto tahu jednal (souměrné s toggleWagonFormation)
        const targetState = !startUnit.formationClosed;
        const visited = new Set([startUnit.id]);
        const queue = [startUnit];
        let toggled = 0;
        while (queue.length) {
            const w = queue.shift();
            if (!w.hasMoved && w.formationClosed !== targetState) {
                w.formationClosed = targetState;
                w.hasMoved = true;
                toggled++;
            }
            for (const n of this.hexGrid.getNeighbors(w.col, w.row)) {
                const u = this.getUnitAt(n.col, n.row);
                if (u && u.health > 0 && u.faction === startUnit.faction && u.isWagon() && !visited.has(u.id)) {
                    visited.add(u.id);
                    queue.push(u);
                }
            }
        }
        if (toggled > 0) {
            this.addLog(i18n.t(targetState ? 'gameLog.wagonLineClosed' : 'gameLog.wagonLineOpened', { count: toggled }), 'turn');
        }
        this.updateUnitPanel(startUnit);
        this.render();
        return toggled > 0;
    }

    // P4: souvislá řada spřátelených vozů (BFS přes hex-sousednost).
    // closedOnly=true zahrne jen SEPNUTÉ vozy (pro pochodovou linii a hradbu).
    connectedWagonLine(startUnit, closedOnly = false) {
        const line = [];
        const visited = new Set([startUnit.id]);
        const queue = [startUnit];
        while (queue.length) {
            const w = queue.shift();
            if (!closedOnly || w.formationClosed) line.push(w);
            for (const n of this.hexGrid.getNeighbors(w.col, w.row)) {
                const u = this.getUnitAt(n.col, n.row);
                if (u && u.health > 0 && u.faction === startUnit.faction &&
                    u.isWagon() && !visited.has(u.id) &&
                    (!closedOnly || u.formationClosed)) {
                    visited.add(u.id);
                    queue.push(u);
                }
            }
        }
        return line;
    }

    // P4: přepne celou souvislou řadu SEPNUTÝCH vozů mezi pevnou hradbou a
    // pochodovým šikem. Zdarma (neutratí tah) - je to změna postoje; cenu platí
    // až samotný pochod. Rozpojený vůz nelze rozpochodovat - nejdřív sepni hradbu.
    toggleWagonMarch(startUnit) {
        if (!this.canStartAction(startUnit)) return false;
        if (!startUnit || !startUnit.isWagon() || startUnit.faction !== this.currentFaction) return false;
        if (!startUnit.formationClosed) {
            this.addLog(i18n.t('gameLog.wagonMustCloseFirst'), 'turn');
            Sound.playInvalid();
            return false;
        }
        const targetMarching = !startUnit.marching;
        const line = this.connectedWagonLine(startUnit, true);
        let changed = 0;
        for (const w of line) {
            if (w.marching !== targetMarching) {
                w.marching = targetMarching;
                changed++;
            }
        }
        if (changed > 0) {
            this.addLog(i18n.t(targetMarching ? 'gameLog.wagonMarchOn' : 'gameLog.wagonMarchOff', { count: changed }), 'turn');
        }
        this.updateUnitPanel(startUnit);
        // pochodová hradba smí jet - přepočítej zvýraznění pohybu
        if (this.selectedUnit === startUnit) {
            this.view.showMoveRange(startUnit);
        }
        this.render();
        return changed > 0;
    }

    _marchBlocked() {
        this.addLog(i18n.t('gameLog.wagonMarchBlocked'), 'turn');
        Sound.playInvalid();
        return false;
    }

    // P4: hexy, kam může pochodová linie (obsahující unit) šlápnout - jeden hex
    // v každém ze 6 směrů, ale JEN pokud tam projdou VŠECHNY vozy linie (tuhý posun).
    getWagonMarchTargets(unit) {
        const line = this.connectedWagonLine(unit, true).filter(w => w.marching);
        if (line.length === 0 || line.some(w => w.hasMoved)) return [];
        const lineIds = new Set(line.map(w => w.id));
        const frozen = this.currentScenario?.specialMechanics?.frozenRiver;
        const result = [];
        for (let dir = 0; dir < 6; dir++) {
            let ok = true;
            for (const w of line) {
                const t = this.hexGrid.getNeighborInDirection(w.col, w.row, dir);
                if (!this.hexGrid.inBounds(t.col, t.row)) { ok = false; break; }
                if (this.hexGrid.getTerrain(t.col, t.row) === 'water' && !frozen) { ok = false; break; }
                const occ = this.getUnitAt(t.col, t.row);
                if (occ && !lineIds.has(occ.id)) { ok = false; break; }
            }
            if (ok) {
                const t = this.hexGrid.getNeighborInDirection(unit.col, unit.row, dir);
                result.push({ col: t.col, row: t.row });
            }
        }
        return result;
    }

    // P4: skupinový pochod - posune celou souvislou pochodovou linii o 1 hex ve
    // směru dir (index 0-5) jako TUHÝ celek. Buď se pohnou všechny vozy, nebo
    // žádný (když je kterýkoli cíl mimo mapu / voda / obsazený cizí jednotkou).
    marchWagonLine(startUnit, dir) {
        if (!this.canStartAction(startUnit)) return false;
        if (!startUnit || !startUnit.isWagon() || !startUnit.marching) return false;
        if (startUnit.faction !== this.currentFaction) return false;

        const line = this.connectedWagonLine(startUnit, true).filter(w => w.marching);
        if (line.some(w => w.hasMoved)) {
            this.addLog(i18n.t('gameLog.wagonAlreadyMoved'), 'turn');
            Sound.playInvalid();
            return false;
        }

        const lineIds = new Set(line.map(w => w.id));
        const frozen = this.currentScenario?.specialMechanics?.frozenRiver;
        const targets = [];
        for (const w of line) {
            const t = this.hexGrid.getNeighborInDirection(w.col, w.row, dir);
            if (!this.hexGrid.inBounds(t.col, t.row)) return this._marchBlocked();
            if (this.hexGrid.getTerrain(t.col, t.row) === 'water' && !frozen) return this._marchBlocked();
            const occ = this.getUnitAt(t.col, t.row);
            if (occ && !lineIds.has(occ.id)) return this._marchBlocked();
            targets.push({ w, col: t.col, row: t.row });
        }

        // Skupinový pochod je nevratný; undo neřešíme. Overwatch a zamrzlá řeka se
        // u skupinového pochodu záměrně neaplikují - cenou pochodu je poloviční kryt.
        this.lastMove = null;
        Sound.playWagonFort();
        for (const { w, col, row } of targets) {
            w.col = col;
            w.row = row;
            w.hasMoved = true;
        }
        this.addLog(i18n.t('gameLog.wagonMarched', { count: line.length }), 'move');

        if (this.fogOfWar) this.fogOfWarSystem.updateVisibility();
        // escape zóny - pochodová hradba může odvézt jednotky do bezpečí
        for (const { w } of targets) {
            if (w.health > 0) this.checkEscapeZone(w);
        }

        // ponech výběr, přepočítej zvýraznění (linie už tento tah jela -> prázdné)
        if (this.selectedUnit && lineIds.has(this.selectedUnit.id)) {
            this.view.showSelection(this.selectedUnit, { moves: false, attacks: false });
            this.updateUnitPanel(this.selectedUnit);
        }
        this.render();
        this.victoryConditionsSystem.checkVictory();
        return true;
    }

    // Kontrola, zda je střelec za vozovou hradbou (střílna)
    isShooterBehindWagon(shooter) {
        // Pouze pro střelecké jednotky
        if (!shooter.range || shooter.range <= 1) return null;
        if (shooter.faction !== 'hussites') return null;

        // Kontrola, zda je vedle vozu (za hradbou)
        const neighbors = this.hexGrid.getNeighbors(shooter.col, shooter.row);

        for (const neighbor of neighbors) {
            const adjacentUnit = this.getUnitAt(neighbor.col, neighbor.row);
            if (adjacentUnit &&
                adjacentUnit.faction === shooter.faction &&
                adjacentUnit.health > 0 &&
                adjacentUnit.isWagon && adjacentUnit.isWagon()) {
                return {
                    behindWagon: true,
                    attackBonus: 5, // +5 k útoku ze střílny
                    defenseBonus: 10 // Také lepší krytí
                };
            }
        }

        return null;
    }

    // Efekt průlomu - když je vůz zničen, okolní vozy dočasně ztratí bonus
    onWagonDestroyed(wagon) {
        const neighbors = this.hexGrid.getNeighbors(wagon.col, wagon.row);

        for (const neighbor of neighbors) {
            const adjacentUnit = this.getUnitAt(neighbor.col, neighbor.row);
            if (adjacentUnit &&
                adjacentUnit.faction === wagon.faction &&
                adjacentUnit.health > 0 &&
                adjacentUnit.isWagon && adjacentUnit.isWagon()) {
                // Označit vůz jako "průlom" - ztráta formačního bonusu na 1 kolo
                adjacentUnit.breachedTurns = 1;
                this.addLog(i18n.t('gameLog.wagonBreakthrough', {unit: adjacentUnit.name}), 'combat');
            }
        }
    }


    // Reset průlomu na začátku tahu
    resetBreachedWagons() {
        for (const unit of this.units) {
            if (unit.breachedTurns && unit.breachedTurns > 0) {
                unit.breachedTurns--;
            }
        }
    }
}
