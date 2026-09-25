// Dřevořez: pouze prezentace. Souřadnice, terén i dostupné akce vlastní HexGrid/Game.
// Stejné vektorové značky se používají na Canvasu i v HTML inspektoru.
class WoodcutRenderer {
    static palette = Object.freeze({
        paper: '#e8dcc2', light: '#f2e8d3', ink: '#28302b', rule: '#aaa48c',
        red: '#80352d', blue: '#3f5965', move: '#365846', danger: '#982e26',
        gold: '#8b652f', fog: '#a5a58f', tree: '#344534'
    });

    static terrainColors = Object.freeze({
        plains: '#efe4cc', forest: '#b4ba95', hills: '#c4ad82', water: '#91a69a',
        town: '#e1d2ad', road: '#dfc99b', road2: '#dfc99b', dam: '#c7b18a',
        mud: '#b6a17e', swamp: '#a9b18e', slope: '#ada58d', trenches: '#b9aa8d', church: '#e7d9b9'
    });

    // Paths are trusted, code-owned artwork, never scenario/localization input.
    static glyphs = Object.freeze({
        flail: 'M-6 13L3-11 7-12 10-9 9-5 M-9 10L-4 12 M-8 8L-3 10 M8-6L12-5 9 6 5 5Z',
        spear: 'M-7 15L6-14 M3-11L9-19 8-9Z M-11-1L-3-4 4 0 2 10-4 15-10 10Z',
        polearm: 'M-5 15L3-16 M3-16L-4-10-4-4 2-7 9-2 10-9 3-11',
        shield: 'M-11-13L11-13 10 6Q7 13 0 17Q-7 13-10 6Z M0-8V9 M-6 0H6',
        crossbow: 'M-1 14L2-13 M-13-1Q0-15 13-1L0 3Z M0 3V-17 M-3-12L0-17 3-12 M-5 9H5',
        bow: 'M-6-16Q18 0-6 16Z M-14 0H14 M9-4L14 0 9 4',
        gun: 'M-12 12L9-10 13-6-8 16Z M7-8L10-14 14-10 11-6 M-5 5L-9 0 M-3 4L1 8',
        cannon: 'M-14-3L12-12 15-4-11 5Z M-11 5L10 8 M-10 9A5 5 0 1 0 0 9A5 5 0 1 0-10 9 M7 8L14 14 M-5 9L-5 14',
        wagon: 'M-13-8H13V8H-13Z M-13-3H13 M-13 2H13 M-9-8V-14L0-17 9-14V-8 M-12 12A4 4 0 1 0-4 12A4 4 0 1 0-12 12 M4 12A4 4 0 1 0 12 12A4 4 0 1 0 4 12',
        fieldwork: 'M-16 15H16 M-12 14V-7L0-17 12-7V14 M-15-7H15 M-12-2H12 M-12 4H12 M-12 10H12 M-6-3V6 M6-3V6',
        horse: 'M-9 13L-3 1-8-4-2-12-1-18 3-13 9-10 14-3 10 1 5-1 6 7 11 13Z M-12 16H13 M5-8H7',
        captain: 'M-6 15V-16 M-5-15L12-12 7-6 12 0-5-3Z M-10 15H-1',
        pilgrim: 'M-7 16L2-16Q9-20 9-12 M-1-7Q12-12 12-3Q12 6 3 3Z M-10 11L-4 13',
        sword: 'M-11 13L9-14 14-17 13-11-7 16Z M-10 4L2 14'
    });
    static paths = new Map();

    static isCommander(unit) {
        return unit.unitClass === 'commander' || unit.special === 'commander';
    }

    // A tall standard, with a forked Hussite or pointed opposing tail.
    // Shared geometry keeps the map and the printed unit key consistent.
    static commanderOutline(enemy) {
        return [[-26, -30], [26, -30], [26, 24], [0, enemy ? 28 : 15], [-26, 24]];
    }

    static glyphKind(unit) {
        const type = unit.type || '';
        if (this.isCommander(unit)) return 'captain';
        if (unit.unitClass === 'fortification') return 'fieldwork';
        if (type.includes('VOZOVA') || unit.unitClass === 'wagon') return 'wagon';
        if (type.includes('CEPNICI')) return 'flail';
        if (type === 'POUTNICI') return 'pilgrim';
        if (type.includes('PAVEZNICI')) return 'shield';
        if (type.includes('KOPINICI')) return 'spear';
        if (type.includes('SUDLICNICI') || type === 'HALAPARTNICI') return 'polearm';
        if (type === 'RUCNICARI') return 'gun';
        if (type === 'LUCISTNICI') return 'bow';
        if (unit.unitClass === 'artillery') return 'cannon';
        if (unit.unitClass === 'ranged' || type.includes('KUS')) return 'crossbow';
        if (/JIZDA|RYTIR|ZVED|TEZKOODENCI/.test(type)) return 'horse';
        return 'sword';
    }

    static icon(unit) {
        const d = this.glyphs[this.glyphKind(unit)];
        const commander = this.isCommander(unit);
        const frame = commander ? `<path d="M${this.commanderOutline(unit.faction !== 'hussites').map(p => p.join(',')).join('L')}Z" fill="none" stroke="currentColor" stroke-width="2"/>` : '';
        return `<svg class="woodcut-icon" viewBox="${commander ? '-30 -34 60 68' : '-23 -23 46 46'}" aria-hidden="true" focusable="false">${frame}<path d="${d}" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    }

    constructor(grid) { this.grid = grid; this.ctx = grid.ctx; }

    static terrainColor(terrain) { return this.terrainColors[terrain] || this.terrainColors.plains; }

    // Encyclopedia swatches use the actual map renderer on one isolated hex.
    // Fixed 2x backing resolution stays sharp even while the tab is hidden.
    static drawTerrainPreview(canvas, terrain) {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = 144;
        canvas.height = 128;
        const grid = {
            ctx, hexSize: 34,
            hexes: new Map([['0,0', { col: 0, row: 0, terrain }]]),
            hexToPixel: () => ({ x: 36, y: 32 }),
            getNeighbors: () => []
        };
        ctx.save();
        ctx.scale(2, 2);
        new WoodcutRenderer(grid).drawTerrain();
        ctx.restore();
    }

    static fogState(key, fog) {
        if (!fog?.fogOfWar) return 'visible';
        if (!fog.exploredHexes?.has(key)) return 'unknown';
        return fog.visibleHexes?.has(key) ? 'visible' : 'explored';
    }

    path(points, close = false) {
        const ctx = this.ctx;
        ctx.beginPath();
        points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
        if (close) ctx.closePath();
    }

    line(points) { this.path(points); this.ctx.stroke(); }

    hexPath(col, row, inset = 0) {
        const { x, y } = this.grid.hexToPixel(col, row), r = Math.max(1, this.grid.hexSize - inset);
        this.path(Array.from({ length: 6 }, (_, i) => {
            // Odd-column centers in HexGrid form flat-top hexagons (x step = 1.5r).
            const angle = Math.PI / 3 * i;
            return [x + r * Math.cos(angle), y + r * Math.sin(angle)];
        }), true);
    }

    hatch(x, y, width, height, step = 6) {
        for (let i = 0; i < width; i += step) this.line([[x + i, y], [x + i - 5, y + height]]);
    }

    tree(x, y, scale) {
        const ctx = this.ctx, p = WoodcutRenderer.palette;
        ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
        ctx.fillStyle = p.tree; ctx.strokeStyle = p.tree; ctx.lineWidth = 1.5;
        this.path([[0, -19], [-7, -8], [-4, -8], [-10, 0], [-6, 0], [-12, 8], [12, 8], [7, 0], [10, 0], [4, -8], [7, -8]], true);
        ctx.fill(); ctx.stroke();
        this.line([[0, 8], [0, 15]]);
        ctx.strokeStyle = p.paper; ctx.lineWidth = 1.1;
        this.line([[0, -14], [0, 8]]);
        for (let i = 0; i < 4; i++) this.line([[0, -4 + i * 4], [5 + i, -8 + i * 4]]);
        ctx.restore();
    }

    house(x, y, scale, church = false) {
        const ctx = this.ctx, p = WoodcutRenderer.palette;
        ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
        ctx.lineWidth = 1.6; ctx.strokeStyle = p.ink; ctx.fillStyle = p.light;
        this.path([[-11, 0], [-11, 15], [7, 18], [18, 12], [18, -2], [0, -6]], true); ctx.fill(); ctx.stroke();
        ctx.fillStyle = p.tree;
        this.path([[-14, 0], [-3, -13], [8, -15], [19, -2], [0, -6]], true); ctx.fill(); ctx.stroke();
        this.line([[7, 3], [7, 18]]);
        ctx.fillStyle = p.ink; ctx.fillRect(-5, 8, 4, 7); ctx.fillRect(11, 4, 3, 4);
        ctx.strokeStyle = p.light; ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) this.line([[-8 + i * 4, -3], [-3 + i * 3, -10]]);
        if (church) {
            ctx.strokeStyle = p.ink; ctx.lineWidth = 1.6; ctx.fillStyle = p.light;
            ctx.fillRect(13, -24, 10, 31); ctx.strokeRect(13, -24, 10, 31);
            ctx.fillStyle = p.tree;
            this.path([[11, -24], [18, -39], [25, -24]], true); ctx.fill(); ctx.stroke();
            this.line([[18, -39], [18, -45]]); this.line([[15, -42], [21, -42]]);
            ctx.fillRect(17, -18, 3, 6);
        }
        ctx.restore();
    }

    terrain(hex, fog) {
        const ctx = this.ctx, p = WoodcutRenderer.palette, { x, y } = this.grid.hexToPixel(hex.col, hex.row);
        ctx.save(); this.hexPath(hex.col, hex.row); ctx.clip();
        ctx.translate(x, y); ctx.scale(this.grid.hexSize / 40, this.grid.hexSize / 40);
        ctx.strokeStyle = p.tree; ctx.fillStyle = p.tree; ctx.lineWidth = 1.2; ctx.lineCap = 'round';
        // Stable variation from coordinates; drawing never consumes the game's random stream.
        const variation = (hex.col * 17 + hex.row * 31) % 7;
        switch (hex.terrain) {
            case 'forest':
                this.tree(-15 + variation, -9, .76); this.tree(11, -12 + variation, .9); this.tree(-3, 10 + variation / 2, 1); break;
            case 'town':
                this.house(-13, -9, .65); this.house(11, -2, .65); this.house(-7, 11, .62); break;
            case 'church':
                this.house(-8, 6, .88, true); break;
            case 'hills':
                ctx.strokeStyle = '#655b45'; ctx.lineWidth = 1.7;
                for (let i = 0; i < 3; i++) {
                    ctx.beginPath(); ctx.ellipse(-4 + i * 6, 7 + i * 5, 26 - i * 4, 20 - i * 4, -.15, Math.PI, Math.PI * 1.97); ctx.stroke();
                }
                this.hatch(-8, 1, 30, 13, 5);
                this.line([[-24, 20], [-11, 16], [2, 19], [15, 15], [27, 17]]); break;
            case 'slope':
                ctx.strokeStyle = '#4f5145'; ctx.lineWidth = 2;
                this.path([[-31, 15], [-10, -17], [0, -8], [11, -25], [32, 13]]); ctx.stroke();
                this.line([[-10, -17], [-6, 12]]); this.line([[11, -25], [18, 13]]);
                this.hatch(-4, -2, 25, 19, 5);
                this.line([[-22, 19], [-17, 6]]); this.line([[2, 15], [7, 2]]);
                this.line([[22, 16], [27, 4]]); break;
            case 'water':
                ctx.strokeStyle = '#496555';
                for (let i = -3; i <= 3; i++) {
                    ctx.beginPath(); ctx.moveTo(-37, i * 10 + variation);
                    ctx.bezierCurveTo(-12, i * 10 - 7 + variation, 4, i * 10 + 8 + variation, 37, i * 10 + variation); ctx.stroke();
                }
                break;
            case 'road': case 'road2': case 'dam': {
                const connections = this.grid.getNeighbors(hex.col, hex.row).filter(n =>
                    WoodcutRenderer.fogState(`${n.col},${n.row}`, fog) !== 'unknown' &&
                    ['road', 'road2', 'dam', 'town', 'church'].includes(this.grid.getTerrain(n.col, n.row)));
                const ends = connections.length ? connections.map(n => {
                    const point = this.grid.hexToPixel(n.col, n.row), scale = 40 / this.grid.hexSize;
                    return [(point.x - x) * scale, (point.y - y) * scale];
                }) : [[-40, 0], [40, 0]];
                for (const [color, width] of [[p.gold, hex.terrain === 'dam' ? 20 : 13], ['#ebdbb5', 9]]) {
                    ctx.strokeStyle = color; ctx.lineWidth = width;
                    for (const end of ends) this.line([[0, 0], end]);
                }
                ctx.lineWidth = 1; ctx.strokeStyle = p.gold; ctx.setLineDash([2, 5]);
                for (const end of ends) this.line([[0, 0], end]);
                ctx.setLineDash([]);
                if (hex.terrain === 'dam') { ctx.lineWidth = 2; this.hatch(-24, 10, 48, 7); }
                break;
            }
            case 'trenches':
                ctx.lineWidth = 6; this.line([[-27, 12], [-16, -2], [5, 4], [21, -8], [32, -4]]);
                ctx.strokeStyle = p.light; ctx.lineWidth = 1; this.line([[-27, 12], [-16, -2], [5, 4], [21, -8], [32, -4]]);
                ctx.strokeStyle = p.ink; this.hatch(-20, -11, 43, 7); break;
            case 'mud': case 'swamp':
                ctx.strokeStyle = '#71654c'; this.hatch(-22, -5, 46, 15, 8);
                for (const [xx, yy] of [[-12, -11], [13, 8]]) {
                    ctx.beginPath(); ctx.ellipse(xx, yy, 9, 3, -.2, 0, Math.PI * 2); ctx.stroke();
                    this.line([[xx, yy], [xx - 2, yy - 8], [xx, yy - 3], [xx + 3, yy - 9]]);
                }
                break;
            default:
                ctx.strokeStyle = 'rgba(69,76,51,.36)';
                this.line([[-17 + variation, 10], [-15 + variation, 14], [-12 + variation, 8]]);
                this.line([[13, -12 + variation], [16, -8 + variation], [19, -13 + variation]]);
                if (variation < 2) { ctx.strokeStyle = 'rgba(90,81,53,.16)'; this.hatch(-25, -8, 28, 22, 5); }
        }
        ctx.restore();
    }

    drawTerrain(fog) {
        const ctx = this.ctx, p = WoodcutRenderer.palette;
        for (const [key, hex] of this.grid.hexes) {
            const visibility = WoodcutRenderer.fogState(key, fog);
            this.hexPath(hex.col, hex.row);
            ctx.fillStyle = visibility === 'unknown' ? p.fog : WoodcutRenderer.terrainColor(hex.terrain); ctx.fill();
            if (visibility !== 'unknown') this.terrain(hex, fog);
            if (visibility !== 'visible') {
                ctx.save(); this.hexPath(hex.col, hex.row); ctx.clip();
                ctx.fillStyle = visibility === 'unknown' ? 'rgba(40,48,43,.12)' : 'rgba(40,48,43,.3)'; ctx.fill();
                if (visibility === 'unknown') {
                    const { x, y } = this.grid.hexToPixel(hex.col, hex.row), r = this.grid.hexSize;
                    ctx.strokeStyle = 'rgba(40,48,43,.13)'; ctx.lineWidth = 1;
                    this.hatch(x - r, y - r, r * 2 + 10, r * 2, 9);
                }
                ctx.restore();
            }
        }
        // Grid on top of all terrain so a neighboring tile cannot erase an edge.
        ctx.strokeStyle = 'rgba(58,64,47,.19)'; ctx.lineWidth = .8;
        for (const hex of this.grid.hexes.values()) { this.hexPath(hex.col, hex.row); ctx.stroke(); }
    }

    highlight(hex, kind) {
        const ctx = this.ctx, p = WoodcutRenderer.palette, { x, y } = this.grid.hexToPixel(hex.col, hex.row);
        ctx.save();
        const color = kind === 'attack' ? p.danger
            : kind === 'selected' ? p.ink
            : kind === 'objective' ? p.gold
            : kind === 'enemy-move' ? p.red
            : p.move;
        this.hexPath(hex.col, hex.row, 3);
        ctx.fillStyle = kind === 'attack' ? 'rgba(152,46,38,.15)'
            : kind === 'enemy-move' ? 'rgba(128,53,45,.12)'
            : kind === 'objective' ? 'rgba(183,137,55,.16)'
            : 'rgba(242,232,211,.22)'; ctx.fill();
        ctx.strokeStyle = p.light; ctx.lineWidth = 5; ctx.stroke();
        ctx.strokeStyle = color; ctx.lineWidth = 2;
        if (kind === 'move' || kind === 'enemy-move') ctx.setLineDash(kind === 'enemy-move' ? [2, 4] : [4, 5]);
        if (kind === 'objective') ctx.setLineDash([3, 4]);
        ctx.stroke(); ctx.setLineDash([]);
        if (kind === 'selected') { this.hexPath(hex.col, hex.row, 7); ctx.lineWidth = 1; ctx.stroke(); }
        if (kind === 'move') { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill(); }
        if (kind === 'attack') {
            const r = this.grid.hexSize * .83; // outside the token drawn above this layer
            for (const dx of [-r, r]) this.line([[x + dx - 3, y - 3], [x + dx + 3, y + 3]]);
            for (const dx of [-r, r]) this.line([[x + dx - 3, y + 3], [x + dx + 3, y - 3]]);
        }
        if (kind === 'escape') this.line([[x - 6, y + 4], [x + 6, y + 4], [x + 1, y - 1], [x + 6, y + 4], [x + 1, y + 9]]);
        ctx.restore();
    }

    tokenPath(enemy, radius, commander = false) {
        const ctx = this.ctx, r = Math.max(1, radius);
        if (commander) {
            this.path(WoodcutRenderer.commanderOutline(enemy).map(([x, y]) => [x * r / 24, y * r / 24]), true);
            return;
        }
        ctx.beginPath();
        if (!enemy) ctx.arc(0, 0, r, 0, Math.PI * 2);
        else {
            ctx.moveTo(-r, -r * .9); ctx.lineTo(r, -r * .9); ctx.lineTo(r * .9, r * .28);
            ctx.quadraticCurveTo(r * .6, r * .86, 0, r * 1.08);
            ctx.quadraticCurveTo(-r * .6, r * .86, -r * .9, r * .28); ctx.closePath();
        }
    }

    badge(text, x, y, color) {
        const ctx = this.ctx;
        ctx.fillStyle = color; ctx.fillRect(x - 7, y - 7, 14, 14);
        ctx.fillStyle = WoodcutRenderer.palette.light; ctx.font = 'bold 11px Arial, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y + .5);
    }

    unit(unit, position = null) {
        const ctx = this.ctx, p = WoodcutRenderer.palette, grid = this.grid;
        const { x, y } = position || grid.hexToPixel(unit.col, unit.row), r = grid.hexSize * .61;
        const enemy = unit.faction !== 'hussites', color = enemy ? p.blue : p.red;
        const commander = WoodcutRenderer.isCommander(unit);
        ctx.save(); ctx.translate(x, y); ctx.lineJoin = 'round';
        this.tokenPath(enemy, r, commander); ctx.fillStyle = p.light; ctx.fill(); ctx.lineWidth = commander ? 2.8 : 2.2; ctx.strokeStyle = p.ink; ctx.stroke();
        this.tokenPath(enemy, r - 3, commander); ctx.fillStyle = color; ctx.fill();
        ctx.save(); this.tokenPath(enemy, r - 3, commander); ctx.clip(); ctx.strokeStyle = 'rgba(242,232,211,.14)'; ctx.lineWidth = .8;
        for (let i = -r; i < r; i += 5) this.line([[-r, i], [r, i + 5]]);
        ctx.restore();
        const kind = WoodcutRenderer.glyphKind(unit);
        if (!WoodcutRenderer.paths.has(kind)) WoodcutRenderer.paths.set(kind, new Path2D(WoodcutRenderer.glyphs[kind]));
        ctx.save(); ctx.scale(r / 24, r / 24); ctx.strokeStyle = p.light; ctx.lineWidth = 2.1; ctx.lineCap = 'round';
        ctx.stroke(WoodcutRenderer.paths.get(kind)); ctx.restore();

        // States retain explicit marks, not only a change of color.
        if (unit.hasMoved && unit.hasAttacked) {
            this.tokenPath(enemy, r - 3, commander); ctx.fillStyle = 'rgba(40,48,43,.42)'; ctx.fill(); this.badge('✓', r - 2, -r + 2, p.ink);
        } else if (unit.hasMoved) this.badge('↻', r - 2, -r + 2, p.gold);
        else if (unit.hasAttacked) this.badge('×', r - 2, -r + 2, p.red);
        if (unit.isDefending) {
            this.tokenPath(enemy, r + 4, commander); ctx.lineWidth = 2; ctx.strokeStyle = p.move; ctx.setLineDash([5, 3]); ctx.stroke(); ctx.setLineDash([]);
        }
        if (unit.isRouting || unit.isTerrified) this.badge('!', -r + 2, -r + 2, p.danger);
        if (unit.special === 'rapidFire' && unit.attackCount === 1) this.badge('1', r, r - 3, p.ink);
        if (unit.chargeBonus) this.badge('➜', -r, r - 3, p.red);
        if (commander) {
            ctx.strokeStyle = p.light; ctx.lineWidth = 1; this.tokenPath(enemy, r - 5, true); ctx.stroke();
        }

        const hp = Math.max(0, Math.min(1, unit.health / unit.maxHealth || 0)), w = r * 1.65, by = r + 7;
        ctx.fillStyle = p.ink; ctx.fillRect(-w / 2 - 1, by - 1, w + 2, 6);
        ctx.fillStyle = '#8c8672'; ctx.fillRect(-w / 2, by, w, 4);
        ctx.fillStyle = hp <= .3 ? '#e99c7d' : p.light; ctx.fillRect(-w / 2, by, w * hp, 4);
        ctx.fillStyle = p.ink;
        for (let i = 1; i < 4; i++) ctx.fillRect(-w / 2 + w * i / 4, by, .8, 4);
        ctx.restore();
    }

    render(units, fog = null, tokenPositions = null) {
        const ctx = this.ctx, grid = this.grid, p = WoodcutRenderer.palette;
        ctx.save(); ctx.fillStyle = p.paper; ctx.fillRect(0, 0, grid.canvas.width, grid.canvas.height);
        this.drawTerrain(fog);
        for (const hex of grid.escapeZoneHexes) this.highlight(hex, grid.escapeZoneKind || 'escape');
        for (const hex of grid.enemyMoveHexes) this.highlight(hex, 'enemy-move');
        for (const hex of grid.highlightedHexes) this.highlight(hex, 'move');
        for (const hex of grid.attackableHexes) this.highlight(hex, 'attack');
        if (grid.selectedHex) this.highlight(grid.selectedHex, 'selected');
        grid.drawMapLabels(fog?.fogOfWar, fog?.exploredHexes);
        grid.drawWagonChains(units);
        for (const unit of units) if (unit.health > 0) this.unit(unit, tokenPositions?.get(unit.id));
        if (grid.escapeZoneHexes.length && grid.escapeZoneLabel) {
            const points = grid.escapeZoneHexes.map(h => grid.hexToPixel(h.col, h.row));
            const x = points.reduce((sum, point) => sum + point.x, 0) / points.length;
            const y = points.reduce((sum, point) => sum + point.y, 0) / points.length - grid.hexSize;
            ctx.font = `bold ${Math.round(grid.hexSize * .38)}px Georgia, serif`; ctx.textAlign = 'center';
            ctx.strokeStyle = p.light; ctx.lineWidth = 4; ctx.strokeText(grid.escapeZoneLabel, x, y);
            ctx.fillStyle = grid.escapeZoneKind === 'objective' ? p.gold : p.move;
            ctx.fillText(grid.escapeZoneLabel, x, y);
        }
        grid.renderAnimations(); ctx.restore();
    }
}
