// Tooltip čte stejná pravidla viditelnosti a souboje jako herní akce.
class BattleTooltip {
    constructor(game) {
        this.game = game;
        this.tooltip = document.getElementById('tooltip');
        this.mapContainer = document.getElementById('map-container');
        this.inspectionPanel = document.getElementById('info-panel');
        this.lastHoveredHex = null;
        this.lastTooltipContent = null;
    }

    setupEventListeners(signal) {
        const canvas = this.game.hexGrid.canvas;
        canvas.addEventListener('mousemove', event => this.handleMouseMove(event), { signal });
        canvas.addEventListener('mouseleave', event => {
            // Dlouhý tooltip lze přečíst kolečkem, aniž by při vstupu myši zmizel.
            const target = event.relatedTarget;
            if (!target || !(this.tooltip.contains(target) ||
                (this.isDocked() && this.inspectionPanel.contains(target)))) this.hideTooltip();
        }, { signal });
        this.tooltip.addEventListener('mouseleave', () => this.hideTooltip(), { signal });
        this.tooltip.addEventListener('wheel', event => event.stopPropagation(), { signal, passive: true });
        this.mapContainer.addEventListener('scroll', () => this.hideTooltip(), { signal });
        this.inspectionPanel.addEventListener('mouseleave', () => {
            if (this.isDocked()) this.hideTooltip();
        }, { signal });
        document.getElementById('toggle-right').addEventListener('click', () => this.hideTooltip(), { signal });
        document.addEventListener('keydown', event => {
            if (event.key !== 'Escape') return;
            if (this.isDocked() && !this.game.isPaused) {
                event.preventDefault();
                event.stopPropagation(); // První Esc zavře inspekci, až další otevře pauzu.
            }
            this.hideTooltip();
        }, { signal, capture: true });
        document.addEventListener('languageChanged', () => this.hideTooltip(), { signal });
        window.addEventListener?.('resize', () => this.hideTooltip(), { signal });
    }

    handleMouseMove(event) {
        if (this.game.view.mapInput?.pointers.size || this.game.view.orders?.isCompact()) return;
        const { x, y } = this.game.view.mapInput.screenToWorld(event.clientX, event.clientY);

        const hex = this.game.hexGrid.pixelToHex(x, y);
        const unit = hex && this.game.getUnitAt(hex.col, hex.row);

        // Při cestě k boční kartě ponecháme náhled nad prázdnými/skrytými
        // poli. Kliknutí, jiný viditelný oddíl nebo Esc inspekci ukončí.
        if (this.isDocked() && (!unit || !this.game.fogOfWarSystem.isEnemyVisible(unit))) return;

        if (!hex) {
            this.hideTooltip();
            return;
        }

        // Kontrola, zda jsme na stejném hexu
        if (this.lastHoveredHex &&
            this.lastHoveredHex.col === hex.col &&
            this.lastHoveredHex.row === hex.row) {
            // Tooltip již je zobrazen, není potřeba jej aktualizovat
            return;
        }

        // Dosah musí být spočítaný před hledáním volného místa pro kartu.
        this.game.view.showEnemyMoveRange(unit);
        this.lastHoveredHex = hex;
        this.showTooltip(hex, event.clientX, event.clientY);
    }

    showTooltip(hex, mouseX, mouseY) {
        const html = this.contentForHex(hex);
        if (!html) { this.hideTooltip(); return; }
        if (html !== this.lastTooltipContent) {
            this.tooltip.innerHTML = html;
            this.tooltip.scrollTop = 0;
            this.lastTooltipContent = html;
        }
        this.tooltip.classList.remove('hidden');
        this.positionTooltip(mouseX, mouseY);
    }

    contentForHex(hex) {
        // Mlha války: neprozkoumaný hex neprozrazuje vůbec nic
        if (this.game.fogOfWar && !this.game.fogOfWarSystem.isHexExplored(hex.col, hex.row)) {
            return '';
        }

        let unit = this.game.getUnitAt(hex.col, hex.row);
        // Nepřítel skrytý v mlze se v tooltipu chová, jako by tam nebyl
        if (unit && !this.game.fogOfWarSystem.isEnemyVisible(unit)) {
            unit = null;
        }
        const terrain = this.game.hexGrid.getTerrain(hex.col, hex.row);

        let html = '';

        if (unit) {
            const factionName = i18n.t(`factions.${unit.faction}`);
            // Získej viditelnost jednotky
            const visionRange = this.game.fogOfWarSystem.getUnitSightRange(unit);

            html = `
                <div class="tooltip-title">${unit.name}</div>
                <div class="tooltip-faction">${factionName}</div>
                <div class="tooltip-stats">
                    <div class="tooltip-stat"><span class="label">HP:</span> ${unit.health}/${unit.maxHealth}</div>
                    <div class="tooltip-stat"><span class="label">${i18n.t('help.unitStats.attack')}:</span> ${unit.attack}</div>
                    <div class="tooltip-stat"><span class="label">${i18n.t('help.unitStats.defense')}:</span> ${unit.defense}</div>
                    <div class="tooltip-stat"><span class="label">${i18n.t('help.unitStats.range')}:</span> ${unit.range}</div>
                    <div class="tooltip-stat"><span class="label">${i18n.t('help.unitStats.movement')}:</span> ${unit.movement}</div>
                    <div class="tooltip-stat"><span class="label">👁 ${i18n.t('tooltip.visibility')}:</span> ${visionRange}</div>
                </div>
                <div class="tooltip-info tooltip-strength">${i18n.t('tooltip.attackStrength', { value: Math.round(unit.getAttackStrength() * 100) })}</div>
            `;

            if (unit.faction !== 'hussites' && unit.movement > 0 &&
                !(unit.isWagon() && unit.formationClosed)) {
                html += `<div class="tooltip-info">${i18n.t('tooltip.enemyMovePreview')}</div>`;
            }

            // Speciální schopnost (přeskočíme commander - ten má vlastní sekci)
            if (unit.special && unit.special !== 'commander') {
                const specialKey = `special.${unit.special}`;
                const specialName = i18n.hasTranslation(specialKey) ? i18n.t(specialKey) : unit.special;
                html += `<div class="tooltip-special">${specialName}</div>`;
            }

            // Velitel - speciální zobrazení
            if (unit.special === 'commander' || unit.unitClass === 'commander') {
                html += `<div class="tooltip-special" style="color: #ffd700;">👑 ${i18n.t('tooltip.commander')}</div>`;
            } else {
                // Aura velitele - jednotka v dosahu spřáteleného velitele dostává bonus
                const aura = this.game.getCommanderBonuses(unit);
                if (aura && (aura.attack || aura.defense || aura.morale)) {
                    const parts = [];
                    if (aura.attack) parts.push(i18n.t('tooltip.attackBonus', { value: aura.attack }));
                    if (aura.defense) parts.push(i18n.t('tooltip.defenseBonus', { value: aura.defense }));
                    if (aura.morale) parts.push(i18n.t('tooltip.moraleBonus', { value: aura.morale }));
                    html += `<div class="tooltip-bonus">👑 ${i18n.t('tooltip.inAura')}: ${aura.commander} (${parts.join(', ')})</div>`;
                }
            }

            const coverFire = this.game.gameState === 'playing' ? this.game.getCoverFireStatus(unit) : null;
            if (unit.isDefending && !coverFire) {
                html += `<div class="tooltip-bonus">${i18n.t('tooltip.defensiveStance')}</div>`;
            }

            // Vlastní střelec i viditelný protivník dostanou stejný stav a
            // konkrétní důvod nedostupnosti jako karta rozkazů.
            if (coverFire) {
                const title = ['ready', 'defending'].includes(coverFire) ? coverFire : 'unavailable';
                html += `<div class="${coverFire === 'ready' ? 'tooltip-bonus' : 'tooltip-info'}"><strong>${i18n.t(`game.coverFireTitles.${title}`)}</strong><br>${i18n.t(`game.coverFireDetails.${coverFire}`)}</div>`;
            }

            if (unit.isTerrified) {
                html += `<div class="tooltip-debuff">${i18n.t('tooltip.terrified')}</div>`;
            }

            // Morálka
            html += `<div class="tooltip-morale" style="margin-top: 5px; padding-top: 5px; border-top: 1px solid #444;">
                <span class="label">${i18n.t('game.moraleLabel')}:</span>
                <span style="color: ${unit.getMoraleColor()}">${unit.getMoraleStatus()} (${Math.round(unit.morale)}%)</span>
            </div>`;

            if (unit.isRouting) {
                html += `<div class="tooltip-debuff" style="color: #ff4444; font-weight: bold;">🏃 ${i18n.t('tooltip.routing')}</div>`;
                html += `<div class="tooltip-info">${this.game.view.panels.routingExplanation(unit)}</div>`;
            }

            // Informace o zbývajících útocích pro rapidFire
            if (unit.special === 'rapidFire' && unit.attackCount > 0 && unit.attackCount < 2) {
                html += `<div class="tooltip-info">${i18n.t('tooltip.attacksRemaining', { count: 2 - unit.attackCount })}</div>`;
            }

            // Náhled šancí při útoku - pokud je vybraná jednotka a toto je nepřítel
            if (this.game.selectedUnit && this.game.selectedUnit.faction !== unit.faction) {
                const p = this.game.combatSystem.calculateDamagePreview(this.game.selectedUnit, unit);
                if (p) {
                    const dmg = p.min === p.max ? `${p.min}` : `${p.min} - ${p.max}`;
                    let killLine = '';
                    if (p.killsCertain) {
                        killLine = `<div class="damage-range" style="color: #ff6b6b; font-weight: bold;">💀 ${i18n.t('tooltip.killsTarget')}</div>`;
                    } else if (p.killsPossible) {
                        killLine = `<div class="damage-range" style="color: #ffb86b;">${i18n.t('tooltip.mayKill')}</div>`;
                    }
                    let counterLine = '';
                    if (p.counter) {
                        const c = p.counter.min === p.counter.max ? `${p.counter.min}` : `${p.counter.min} - ${p.counter.max}`;
                        const counterKill = p.counter.killsAttackerCertain
                            ? ` <span style="color: #ff6b6b; font-weight: bold;">${i18n.t('tooltip.attackerFalls')}</span>`
                            : (p.counter.killsAttackerPossible ? ` <span style="color: #ffb86b;">${i18n.t('tooltip.deathRisk')}</span>` : '');
                        counterLine = `<div class="damage-range" style="color: #ff9999;">↩️ ${i18n.t('tooltip.counterattack', { damage: c })}${counterKill}</div>`;
                    }
                    html += `
                        <div class="tooltip-damage-preview">
                            <div class="damage-title">⚔️ ${i18n.t('tooltip.damageEstimate')}</div>
                            <div class="damage-value">${dmg} HP</div>
                            ${killLine}
                            ${counterLine}
                        </div>
                    `;
                }
            }
        }

        // Přidat info o terénu
        const hasFrozenRiver = this.game.currentScenario?.specialMechanics?.frozenRiver;

        const terrainNames = {
            plains: i18n.t('terrain.plains'),
            forest: i18n.t('terrain.forest'),
            hills: i18n.t('terrain.hills'),
            water: hasFrozenRiver ? i18n.t('tooltip.frozenRiver') : i18n.t('terrain.water'),
            town: i18n.t('terrain.town'),
            road: i18n.t('terrain.road'),
            road2: i18n.t('terrain.road'),
            dam: i18n.t('terrain.dam'),
            mud: i18n.t('terrain.mud'),
            swamp: i18n.hasTranslation('terrain.swamp') ? i18n.t('terrain.swamp') : i18n.t('terrain.mud'),
            slope: i18n.t('terrain.slope'),
            trenches: i18n.t('terrain.trenches'),
            church: i18n.t('terrain.church')
        };

        const terrainBonuses = {
            plains: '',
            forest: i18n.t('tooltip.defenseModifier', { value: '+20' }),
            hills: i18n.t('tooltip.defenseModifier', { value: '+30' }),
            water: hasFrozenRiver ? i18n.t('tooltip.thinIce') : i18n.t('tooltip.impassable'),
            town: i18n.t('tooltip.defenseModifier', { value: '+40' }),
            road: i18n.t('tooltip.fastMovement'),
            road2: i18n.t('tooltip.fastMovement'),
            dam: i18n.t('tooltip.defenseModifier', { value: '+20' }),
            mud: i18n.t('tooltip.slows'),
            swamp: `${i18n.t('tooltip.slows')}, ${i18n.t('tooltip.defenseModifier', { value: '+10' })}`,
            slope: i18n.t('tooltip.defenseModifier', { value: '+10' }),
            trenches: i18n.t('tooltip.defenseModifier', { value: '+30' }),
            church: i18n.t('tooltip.defenseModifier', { value: '+20' })
        };

        // Najdi map label pro tento hex
        const mapLabel = (this.game.hexGrid.mapLabels || []).find(l =>
            l.hexes && l.hexes.some(([c, r]) => c === hex.col && r === hex.row)
        );
        const locationName = mapLabel ? mapLabel.text : null;

        // Terénní modifikátory KONKRÉTNÍ jednotky (skutečná čísla, co počítá souboj),
        // ne generická. U střelců z kopce se tím ukáže i útočný bonus z výšiny.
        let terrainLines;
        if (unit) {
            const tDef = Math.round(unit.getTerrainDefenseBonus(terrain) * 100);
            const tAtk = Math.round(unit.getTerrainAttackBonus(terrain) * 100);
            const line = (val, key, extra = '') => !val ? '' :
                `<div class="tooltip-bonus"${val < 0 ? ' style="color: #b02323"' : ''}>${i18n.t(key, { value: val > 0 ? `+${val}` : val })}${extra}</div>`;
            const highGround = (terrain === 'hills' || terrain === 'slope') && tAtk > 0 && unit.isRanged();
            const moveNote = { road: i18n.t('tooltip.fastMovement'), road2: i18n.t('tooltip.fastMovement'),
                mud: i18n.t('tooltip.slows'), swamp: i18n.t('tooltip.slows'), slope: i18n.t('tooltip.slows'),
                water: hasFrozenRiver ? i18n.t('tooltip.thinIce') : i18n.t('tooltip.impassable') }[terrain];
            terrainLines = line(tDef, 'tooltip.defenseModifier')
                + line(tAtk, 'tooltip.attackModifier', highGround ? i18n.t('tooltip.highGroundSuffix') : '')
                + (moveNote ? `<div class="tooltip-bonus" style="color: #6b5c38">${moveNote}</div>` : '');
        } else {
            terrainLines = terrainBonuses[terrain] ? `<div class="tooltip-bonus">${terrainBonuses[terrain]}</div>` : '';
        }

        html += `
            <div class="tooltip-terrain">
                <strong>${locationName || terrainNames[terrain] || terrain}</strong>
                ${terrainLines}
            </div>
        `;

        // Cena vstupu pro vlastní vybraný oddíl, nikoli odhad celé trasy.
        // Nezkoumáme dostupnost cíle ani skryté překážky v mlze války.
        const mover = this.game.selectedUnit;
        const faction = this.game.currentScenario?.playerFaction || 'hussites';
        if (mover?.faction === faction && mover.movement > 0 && mover.unitClass !== 'fortification'
            && !(mover.isWagon() && mover.formationClosed)) {
            const cost = terrain === 'water' && !hasFrozenRiver ? i18n.t('tooltip.impassable')
                : this.game.getTerrainMoveCost(terrain, mover);
            html += `<div class="tooltip-info tooltip-movement">${i18n.t('help.movement.entryCost', { unit: mover.name, cost })}</div>`;
        }

        const objective = this.game.victoryConditionsSystem.getDualObjectiveProgress().find(item =>
            (item.positions || []).some(([col, row]) => col === hex.col && row === hex.row));
        if (objective) {
            const held = objective.occupied ? Math.min(objective.heldTurns, objective.requiredTurns) : 0;
            html += `<div class="tooltip-info tooltip-objective"><strong>${objective.description}</strong><br>${i18n.t('game.holdProgress', { held, required: objective.requiredTurns })}</div>`;
        }

        return html;
    }

    positionTooltip(mouseX, mouseY) {
        this.restoreToMap();
        const mapContainer = this.mapContainer;
        const containerRect = mapContainer.getBoundingClientRect();
        const inset = 8;
        const offset = 20;
        // Souřadnice viditelného vnitřku mapy (bez rámečku a scrollbarů).
        const originX = containerRect.left + (mapContainer.clientLeft || 0);
        const originY = containerRect.top + (mapContainer.clientTop || 0);
        const leftEdge = originX + inset;
        const rightEdge = originX + mapContainer.clientWidth - inset;
        let topEdge = originY + inset;
        const bottomEdge = originY + mapContainer.clientHeight - inset;

        // Horní pruh necháváme ovládání kamery; tooltip nesmí skončit pod ním.
        const tools = document.getElementById('map-tools')?.getBoundingClientRect();
        if (tools?.width > 0 && tools.height > 0 && tools.right > leftEdge && tools.left < rightEdge &&
            tools.bottom > topEdge && tools.top < bottomEdge) {
            topEdge = Math.min(bottomEdge, tools.bottom + inset);
        }

        this.tooltip.style.maxWidth = `${Math.max(0, rightEdge - leftEdge)}px`;
        this.tooltip.style.maxHeight = `${Math.max(0, bottomEdge - topEdge)}px`;

        // Šířka je stabilní i u pravého okraje. Měříme až po omezení velikosti.
        const tooltipRect = this.tooltip.getBoundingClientRect();
        const preferredLeft = mouseX + tooltipRect.width + offset <= rightEdge
            ? mouseX + offset : mouseX - tooltipRect.width - offset;
        const preferredTop = mouseY + tooltipRect.height + offset <= bottomEdge
            ? mouseY + offset : mouseY - tooltipRect.height - offset;
        let left = Math.max(leftEdge, Math.min(preferredLeft, rightEdge - tooltipRect.width));
        let top = Math.max(topEdge, Math.min(preferredTop, bottomEdge - tooltipRect.height));

        const protectedRects = this.enemyPreviewRects();
        if (protectedRects.length) {
            const bounds = { left: leftEdge, right: rightEdge, top: topEdge, bottom: bottomEdge };
            const placement = this.findClearPlacement({ left, top, width: tooltipRect.width, height: tooltipRect.height },
                bounds, protectedRects);
            if (!placement) {
                this.dockTooltip();
                return;
            }
            ({ left, top } = placement);
        }

        this.tooltip.style.left = `${left - originX + mapContainer.scrollLeft}px`;
        this.tooltip.style.top = `${top - originY + mapContainer.scrollTop}px`;
        this.tooltip.classList.toggle('tooltip-scrollable', this.tooltip.scrollHeight > this.tooltip.clientHeight);
    }

    enemyPreviewRects() {
        const view = this.game.view, unit = view.previewedEnemyUnit;
        if (!unit || !this.game.fogOfWarSystem.isEnemyVisible(unit)) return [];
        const grid = this.game.hexGrid, scale = view.mapInput.scale;
        // Čteme pouze již viditelný náhled, nikoli skryté jednotky či terén.
        return [...grid.enemyMoveHexes, unit].map(hex => {
            const world = grid.hexToPixel(hex.col, hex.row);
            const center = view.mapInput.worldToScreen(world.x, world.y);
            const rx = grid.hexSize * scale + 4, ry = grid.hexHeight / 2 * scale + 4;
            return { left: center.x - rx, right: center.x + rx, top: center.y - ry, bottom: center.y + ry };
        });
    }

    findClearPlacement(preferred, bounds, protectedRects) {
        const { width, height } = preferred;
        const lefts = [preferred.left, bounds.left, bounds.right - width];
        const tops = [preferred.top, bounds.top, bounds.bottom - height];
        // Hrany hexů dávají kandidáty i v mezerách nepravidelného dojezdu.
        for (const rect of protectedRects) {
            lefts.push(rect.left - width, rect.right);
            tops.push(rect.top - height, rect.bottom);
        }
        let best = null, bestDistance = Infinity;
        const uniqueLefts = new Set(lefts), uniqueTops = new Set(tops);
        for (const left of uniqueLefts) for (const top of uniqueTops) {
            const right = left + width, bottom = top + height;
            if (left < bounds.left || right > bounds.right || top < bounds.top || bottom > bounds.bottom) continue;
            if (protectedRects.some(rect => left < rect.right && right > rect.left &&
                top < rect.bottom && bottom > rect.top)) continue;
            const distance = (left - preferred.left) ** 2 + (top - preferred.top) ** 2;
            if (distance < bestDistance) { best = { left, top }; bestDistance = distance; }
        }
        return best;
    }

    isDocked() { return this.tooltip.classList.contains('tooltip-docked'); }

    dockTooltip() {
        this.inspectionPanel.classList.add('enemy-inspection');
        this.inspectionPanel.appendChild(this.tooltip);
        this.tooltip.classList.add('tooltip-docked');
        for (const property of ['left', 'top', 'maxWidth', 'maxHeight']) this.tooltip.style[property] = '';
        this.tooltip.classList.toggle('tooltip-scrollable', this.tooltip.scrollHeight > this.tooltip.clientHeight);
    }

    restoreToMap() {
        if (!this.isDocked()) return;
        this.inspectionPanel.classList.remove('enemy-inspection');
        this.mapContainer.appendChild(this.tooltip);
        this.tooltip.classList.remove('tooltip-docked');
    }

    hideTooltip() {
        this.game.view?.clearEnemyMoveRange();
        this.dismissCard();
    }

    dismissCard() {
        this.restoreToMap();
        this.tooltip.classList.add('hidden');
        this.tooltip.classList.remove('tooltip-scrollable');
        this.lastHoveredHex = null;
        this.lastTooltipContent = null; // Vyčistit cache
    }
}
