// Dotykové rozkazy jsou přímé. Karta slouží jen k bezpečnému prohlížení míst,
// na která nelze vydat pohyb, pochod ani útok.
class BattleOrders {
    constructor(view) {
        this.view = view;
        this.game = view.game;
        this.inspectedHex = null;
        this.panel = document.getElementById('battle-order');
        this.marker = document.getElementById('order-marker');
        const signal = view.eventAbortController.signal;
        document.getElementById('order-cancel').addEventListener('click', () => this.cancel(), { signal });
        document.getElementById('btn-next-unit').addEventListener('click', () => {
            if (this.isCompact()) BattlePanels.closeCompactPanels();
            this.cancel(); this.game.selectNextUnit();
        }, { signal });
        document.getElementById('btn-clear-selection').addEventListener('click', () => {
            if (this.isCompact()) BattlePanels.closeCompactPanels();
            this.cancel(); this.game.deselectUnit();
        }, { signal });
    }

    isCompact() { return document.getElementById('game-container').classList.contains('compact-battle'); }

    intent(hex) {
        const unit = this.game.selectedUnit;
        if (!unit || !this.game.canStartAction(unit) || this.game.currentFaction !== 'hussites') return null;
        const target = this.game.getUnitAt(hex.col, hex.row);
        if (target && target.faction !== unit.faction && this.game.fogOfWarSystem.isEnemyVisible(target) &&
            this.game.combatSystem.canAttack(unit, target)) return { kind: 'attack' };
        if (!target) {
            // Pochod je jeden existující rozkaz celé linii, ne běžný pohyb vozu.
            if (unit.isWagon() && unit.marching && unit.formationClosed && !unit.hasMoved) {
                const direction = this.game.hexGrid.directionTo(unit.col, unit.row, hex.col, hex.row);
                if (direction !== -1 && this.game.getWagonMarchTargets(unit).some(t => t.col === hex.col && t.row === hex.row)) return { kind: 'march' };
                return null;
            }
            if (this.game.canMoveTo(unit, hex.col, hex.row)) return { kind: 'move' };
        }
        return null;
    }

    tap(hex) {
        if (!hex || !this.game.canStartAction() || this.game.currentFaction !== 'hussites') return;
        if (this.isCompact()) BattlePanels.closeCompactPanels();
        this.cancel();
        const unit = this.game.getUnitAt(hex.col, hex.row);
        if (unit?.faction === 'hussites' && unit.canAct()) {
            this.game.handleHexClick(hex);
            return;
        }
        const intent = this.intent(hex);
        if (intent) {
            // Pohyb, pochod i útok používají stejná pravidla, animace a autosave
            // jako běžné kliknutí. canStartAction odfiltruje i rychlý druhý tap.
            // Gesta a kompatibilní click už filtruje BattleMapInput.
            this.game.handleHexClick(hex);
            return;
        }
        this.inspect(hex);
    }

    inspect(hex) {
        this.cancel();
        const html = this.view.tooltip.contentForHex(hex);
        if (!html) return;
        const unit = this.game.getUnitAt(hex.col, hex.row);
        const visibleEnemy = Boolean(unit && unit.faction !== 'hussites' &&
            this.game.fogOfWarSystem.isEnemyVisible(unit));
        this.inspectedHex = { ...hex };
        document.getElementById('order-title').textContent = i18n.t('touch.inspect');
        document.getElementById('order-hint').textContent = i18n.t(
            visibleEnemy ? 'touch.enemyMoveHint' : 'touch.inspectHint');
        document.getElementById('order-content').innerHTML = html;
        document.getElementById('order-details').open = true;
        this.panel.classList.remove('hidden');
        this.positionMarker();
        if (visibleEnemy) this.view.showEnemyMoveRange(unit);
    }

    refresh() {
        if (this.inspectedHex && (!this.game.canStartAction() || this.game.currentFaction !== 'hussites')) this.cancel();
        const selected = this.game.selectedUnit;
        if (!selected && this.isCompact() && document.getElementById('unit-panel').classList.contains('expanded')) {
            BattlePanels.closeCompactPanels();
        }
        const label = document.getElementById('compact-unit-name');
        label.textContent = selected ? selected.name : i18n.t('touch.noUnit');
        document.getElementById('btn-clear-selection').disabled = !selected || !this.game.canStartAction();
        document.getElementById('btn-next-unit').disabled = !this.game.canStartAction() || this.game.currentFaction !== 'hussites';
        document.getElementById('btn-unit-sheet').disabled = !selected;
    }

    positionMarker() {
        if (!this.inspectedHex) return;
        const pos = this.game.hexGrid.hexToPixel(this.inspectedHex.col, this.inspectedHex.row);
        const scale = this.view.mapInput?.scale || 1;
        this.marker.style.left = `${pos.x * scale}px`;
        this.marker.style.top = `${pos.y * scale}px`;
        this.marker.style.width = `${this.game.hexGrid.hexSize * 1.6 * scale}px`;
        this.marker.style.height = `${this.game.hexGrid.hexSize * 1.6 * scale}px`;
        this.marker.classList.remove('hidden');
    }

    cancel() {
        this.view.clearEnemyMoveRange();
        this.inspectedHex = null;
        this.panel.classList.add('hidden');
        this.marker.classList.add('hidden');
    }
}
