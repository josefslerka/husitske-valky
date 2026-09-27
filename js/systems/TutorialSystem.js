// TutorialSystem - Správa tutoriálu a průvodních dialogů
class TutorialSystem {
    constructor(game) {
        this.game = game;
    }

    // Inicializace tutoriálu
    initTutorial(steps) {
        this.game.isTutorial = true;
        this.game.tutorialStep = 0;
        this.game.tutorialSteps = steps;
        this.game.tutorialBlockedActions = new Set();
        this.game.tutorialWaitingFor = null;

        // Zobrazení prvního kroku (trigger: game_start)
        this.game.actions.wait(500).then(active => {
            if (active) this.triggerTutorialEvent('game_start');
        });
    }

    // Trigger tutoriálového eventu
    triggerTutorialEvent(eventType, data = {}) {
        if (!this.game.isTutorial || this.game.tutorialStep >= this.game.tutorialSteps.length) return;

        const currentStep = this.game.tutorialSteps[this.game.tutorialStep];

        // Kontrola speciálních podmínek pro waitFor
        if (this.game.tutorialWaitingFor) {
            let shouldProceed = false;

            switch (this.game.tutorialWaitingFor) {
                case 'unit_selected':
                    shouldProceed = eventType === 'unit_selected';
                    break;
                case 'unit_moved':
                    shouldProceed = eventType === 'unit_moved';
                    break;
                case 'turn_ended':
                    shouldProceed = eventType === 'turn_ended';
                    break;
                case 'attack_performed':
                    shouldProceed = eventType === 'attack_performed';
                    break;
                case 'defend_performed':
                case 'defend_used':
                    shouldProceed = eventType === 'defend_performed';
                    break;
                case 'unit_on_hills':
                    if (eventType === 'unit_moved' && data.unit) {
                        const terrain = this.game.hexGrid.getTerrain(data.col, data.row);
                        shouldProceed = terrain === 'hills';
                    }
                    break;
                case 'ranged_attack':
                    if (eventType === 'attack_performed' && data.attacker) {
                        shouldProceed = data.attacker.isRanged && data.attacker.isRanged();
                    }
                    break;
                case 'all_enemies_dead':
                    const enemies = this.game.getEnemyUnits('hussites');
                    shouldProceed = enemies.length === 0;
                    break;
                case 'continue':
                case 'click':
                    // Čekáme na kliknutí na tlačítko - zpracováno v closeTutorialDialog
                    return;
                default:
                    shouldProceed = eventType === this.game.tutorialWaitingFor;
            }

            if (shouldProceed) {
                this.closeTutorialDialog();
                // Po zavření dialogu se automaticky přejde na další krok
            }
            return;
        }

        // Kontrola triggeru aktuálního kroku
        if (currentStep.trigger === eventType) {
            this.showTutorialStep(currentStep);
        }
    }

    // Zobrazení tutoriálového kroku
    showTutorialStep(step) {
        // Nastavení blokovaných akcí
        this.game.tutorialBlockedActions = new Set(step.blockActions || []);

        // Spawn jednotek pokud jsou definovány
        if (step.spawnUnits) {
            for (const spawn of step.spawnUnits) {
                const unit = this.game.unitFactory.createUnit(spawn.type);
                if (unit) {
                    unit.col = spawn.col;
                    unit.row = spawn.row;
                    // Nastavení frakce pokud je specifikována
                    if (spawn.faction) {
                        unit.faction = spawn.faction;
                    }
                    this.game.units.push(unit);
                }
            }
            this.game.updateArmyOverview();
            this.game.render();
        }

        // Highlight hexů (pokud je definováno)
        if (this.game.hexGrid) {
            if (step.highlightHexes) {
                this.game.hexGrid.tutorialHighlights = step.highlightHexes.map(h => ({col: h[0], row: h[1]}));
            } else {
                this.game.hexGrid.tutorialHighlights = [];
            }
        }

        // Highlight jednotek
        if (step.highlightUnits) {
            // Zvýraznění jednotek dané frakce
            for (const unit of this.game.units) {
                unit.tutorialHighlight = step.highlightUnits.includes(unit.faction);
            }
        }

        this.game.render();

        // Zobrazení dialogu
        this.showTutorialDialog(step.title, step.text, step.waitFor);
    }

    // Zobrazení tutoriálového dialogu
    showTutorialDialog(title, text, waitFor) {
        const modal = document.getElementById('tutorial-modal');
        if (!modal) {
            console.error('Tutorial modal not found!');
            return;
        }

        document.getElementById('tutorial-title').textContent = title;
        document.getElementById('tutorial-text').textContent = text;

        // Nastavení čekání
        this.game.tutorialWaitingFor = waitFor;

        // Tlačítko - pokud čekáme na akci, skryjeme ho (kromě 'continue')
        const continueBtn = document.getElementById('tutorial-continue');
        if (waitFor && waitFor !== 'click' && waitFor !== 'continue') {
            continueBtn.style.display = 'none';
            // Povolit prokliknutí pozadí modalu, aby hráč mohl interagovat s hrou
            modal.style.pointerEvents = 'none';
        } else {
            continueBtn.style.display = 'block';
            continueBtn.textContent = i18n.t('tutorial.continue');
            // Modal pozadí nepotřebuje pointer-events
            modal.style.pointerEvents = 'none';
        }

        // Obsah modalu a tlačítko vždy klikatelné
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.pointerEvents = 'auto';
        }
        continueBtn.style.pointerEvents = 'auto';

        modal.classList.remove('hidden');
    }

    // Zavření tutoriálového dialogu a pokračování
    closeTutorialDialog() {
        const modal = document.getElementById('tutorial-modal');
        if (modal) {
            modal.classList.add('hidden');
            // Reset pointer events
            modal.style.pointerEvents = 'auto';
        }

        // Zkontrolovat, zda aktuální krok ukončuje tutoriál
        const currentStep = this.game.tutorialSteps[this.game.tutorialStep];
        if (currentStep && currentStep.endTutorial) {
            this.endTutorial();
            return;
        }

        // Posun na další krok
        this.game.tutorialStep++;

        // Reset blokovaných akcí a highlightů
        this.game.tutorialBlockedActions = new Set();
        if (this.game.hexGrid) {
            this.game.hexGrid.tutorialHighlights = [];
        }
        for (const unit of this.game.units) {
            unit.tutorialHighlight = false;
        }

        // Reset waitFor
        this.game.tutorialWaitingFor = null;

        // Kontrola dalšího kroku
        if (this.game.tutorialStep < this.game.tutorialSteps.length) {
            const nextStep = this.game.tutorialSteps[this.game.tutorialStep];
            // Pokud má další krok trigger 'immediate' nebo žádný trigger, zobrazíme ho hned
            if (!nextStep.trigger || nextStep.trigger === 'immediate') {
                this.game.actions.wait(300).then(active => { if (active) this.showTutorialStep(nextStep); });
            }
            // Jinak čekáme na příslušný trigger (např. turn_2_start)
        } else {
            // Konec tutoriálu
            this.endTutorial();
        }

        this.game.render();
    }

    // Kontrola, zda je akce blokována tutoriálem
    isTutorialActionBlocked(action) {
        if (!this.game.isTutorial) return false;
        return this.game.tutorialBlockedActions.has(action);
    }

    // Ukončení tutoriálu
    endTutorial() {
        this.game.isTutorial = false;
        this.game.tutorialStep = 0;
        this.game.tutorialSteps = [];
        this.game.tutorialBlockedActions = new Set();
        this.game.tutorialWaitingFor = null;
        if (this.game.hexGrid) {
            this.game.hexGrid.tutorialHighlights = [];
        }

        // Zobrazení gratulace
        this.game.showEventNotification(
            i18n.t('tutorial.completed'),
            i18n.t('tutorial.completedText'),
            () => ({ title: i18n.t('tutorial.completed'), text: i18n.t('tutorial.completedText') })
        );

        // Po 4 sekundách návrat do menu
        this.game.actions.wait(4000).then(active => {
            if (active && typeof window.returnToMainMenu === 'function') {
                window.returnToMainMenu();
            }
        });
    }
}
