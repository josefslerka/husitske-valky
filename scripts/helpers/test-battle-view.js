// Explicitní headless adaptér. Žádné přepisování Game.prototype ani skryté DOM.
class TestBattleView {
    constructor(game) {
        this.game = game;
        this.notifications = [];
        this.effects = [];
        this.destroyed = false;
    }
    destroy() { this.destroyed = true; }
    render() {}
    updateUI() {}
    updateEndTurnButton() {}
    updateArmyOverview() {}
    renderMoraleBar() {}
    updateUnitPanel() {}
    updateChoralButton() {}
    showAIThinking() {}
    startAnimationLoop() {}
    stopAnimationLoop() {}
    centerOnPlayerForces() {}
    centerOnUnit() {}
    clearLog() {}
    addLog() {}
    showGameOver(isVictory, message, stats) { this.result = { isVictory, message, stats }; }
    factionLabel(faction) { return faction; }
    configureScenario() {}
    showPhase() {}
    showPhaseBanner() {}
    updatePhaseDescription() {}
    showSelection() {}
    clearSelection() {}
    showMoveRange() {}
    clearEventNotifications() { this.notifications = []; }
    showEventNotification(title, text, resolveLocalizedText = null) {
        this.notifications.push({ title, text, resolveLocalizedText });
    }
    refreshEventNotifications() {
        for (const item of this.notifications) {
            if (typeof item.resolveLocalizedText !== 'function') continue;
            const localized = item.resolveLocalizedText();
            if (typeof localized?.title === 'string') item.title = localized.title;
            if (typeof localized?.text === 'string') item.text = localized.text;
        }
    }
    showAttackAnimation() {}
    showExplosionAnimation() {}
    animateMove() { return Promise.resolve(true); }
    onPauseChange() {}
    showDamageNumber(col, row, damage, isHeal) {
        const effect = { col, row, damage, isHeal };
        this.effects.push(effect);
        this.game.actions.wait(1200).then(() => {
            this.effects = this.effects.filter(item => item !== effect);
        });
    }
}

module.exports = { TestBattleView };
