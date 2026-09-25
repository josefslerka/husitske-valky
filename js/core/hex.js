// Hexová mapa - systém pro vykreslování a správu hexagonální mapy

class HexGrid {
    constructor(canvas, cols, rows, hexSize) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.renderer = new WoodcutRenderer(this);
        this.cols = cols;
        this.rows = rows;
        this.hexSize = hexSize;

        // Pro kompatibilitu s kódem, který volá scenarioToMap
        this.marginCols = 0;
        this.marginRows = 0;

        // Flat-top hexy, liché sloupce posunuté o polovinu výšky.
        this.hexWidth = hexSize * 2;
        this.hexHeight = Math.sqrt(3) * hexSize;

        // Padding kolem mapy (aby okrajové hexy nebyly oříznuté)
        // Větší padding vlevo a nahoře pro volný prostor
        this.padding = this.hexSize * 1.5;
        this.paddingLeft = this.hexSize * 2;    // Větší padding vlevo
        this.paddingTop = this.hexSize * 1.5;   // Větší padding nahoře

        // Nastavení velikosti canvasu (s paddingem na všech stranách)
        this.canvas.width = this.cols * this.hexWidth * 0.75 + this.hexWidth * 0.25 + this.paddingLeft + this.padding;
        this.canvas.height = this.rows * this.hexHeight + this.hexHeight * 0.5 + this.paddingTop + this.padding;

        // Mapa hexů - ukládá terén a jednotky
        this.hexes = new Map();
        this.initializeHexes();

        // Stav výběru
        this.selectedHex = null;
        this.highlightedHexes = [];
        this.enemyMoveHexes = [];
        this.attackableHexes = [];
        this.escapeZoneHexes = [];
        this.escapeZoneLabel = '';
        this.escapeZoneKind = 'escape';
        this.mapLabels = [];

        // Animace
        this.animations = [];
    }

    initializeHexes() {
        for (let col = 0; col < this.cols; col++) {
            for (let row = 0; row < this.rows; row++) {
                const key = `${col},${row}`;

                this.hexes.set(key, {
                    col: col,
                    row: row,
                    terrain: 'plains',
                    unit: null,
                    isMargin: false
                });
            }
        }
    }

    // Kontrola, jestli hex je v okrajové (nehratelné) zóně - už se nepoužívá
    isMarginHex(col, row) {
        return false;
    }

    hexToPixel(col, row) {
        // Flat-top: offset na lichých sloupcích
        // Použít větší padding vlevo a nahoře
        const x = this.paddingLeft + col * this.hexWidth * 0.75;
        const y = this.paddingTop + row * this.hexHeight + (col % 2 === 1 ? this.hexHeight / 2 : 0);
        return { x, y };
    }

    pixelToHex(px, py) {
        let closestHex = null;
        let closestDist = Infinity;

        for (let col = 0; col < this.cols; col++) {
            for (let row = 0; row < this.rows; row++) {
                const { x, y } = this.hexToPixel(col, row);
                const dist = Math.sqrt((px - x) ** 2 + (py - y) ** 2);
                if (dist < closestDist && dist < this.hexSize) {
                    closestDist = dist;
                    closestHex = { col, row };
                }
            }
        }

        return closestHex;
    }

    // Převod souřadnic ze scénáře na skutečné souřadnice mapy (s okrajem)
    scenarioToMap(col, row) {
        return {
            col: col + this.marginCols,
            row: row + this.marginRows
        };
    }

    // Převod skutečných souřadnic mapy na souřadnice scénáře
    mapToScenario(col, row) {
        return {
            col: col - this.marginCols,
            row: row - this.marginRows
        };
    }

    getNeighbors(col, row) {
        const neighbors = [];
        const isOddCol = col % 2 === 1;

        // Flat-top: offset na lichých sloupcích
        const directions = isOddCol ? [
            [0, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]
        ] : [
            [0, -1], [1, -1], [1, 0], [0, 1], [-1, 0], [-1, -1]
        ];

        for (const [dc, dr] of directions) {
            const nc = col + dc;
            const nr = row + dr;
            if (nc >= 0 && nc < this.cols && nr >= 0 && nr < this.rows) {
                neighbors.push({ col: nc, row: nr });
            }
        }

        return neighbors;
    }

    inBounds(col, row) {
        return col >= 0 && col < this.cols && row >= 0 && row < this.rows;
    }

    // P4: soused v daném směru (index 0-5), BEZ ořezu na okraje - vrací i pozici
    // mimo mapu (volající si ošetří inBounds). Směrový index je konzistentní přes
    // paritu sloupce, takže posun všech vozů o stejný index = tuhý (rigidní) posun
    // celé skupiny stejným směrem (potřeba pro skupinový pochod vozové hradby).
    getNeighborInDirection(col, row, dir) {
        const isOddCol = col % 2 === 1;
        const directions = isOddCol ? [
            [0, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]
        ] : [
            [0, -1], [1, -1], [1, 0], [0, 1], [-1, 0], [-1, -1]
        ];
        const [dc, dr] = directions[dir];
        return { col: col + dc, row: row + dr };
    }

    // P4: index směru (0-5), pokud je (c2,r2) bezprostřední soused (c1,r1) v tom
    // směru; jinak -1. Slouží k odvození směru pochodu z kliknutého hexu.
    directionTo(c1, r1, c2, r2) {
        for (let d = 0; d < 6; d++) {
            const n = this.getNeighborInDirection(c1, r1, d);
            if (n.col === c2 && n.row === r2) return d;
        }
        return -1;
    }

    getDistance(col1, row1, col2, row2) {
        const cube1 = this.offsetToCube(col1, row1);
        const cube2 = this.offsetToCube(col2, row2);

        return Math.max(
            Math.abs(cube1.x - cube2.x),
            Math.abs(cube1.y - cube2.y),
            Math.abs(cube1.z - cube2.z)
        );
    }

    offsetToCube(col, row) {
        const x = col;
        const z = row - (col - (col & 1)) / 2;
        const y = -x - z;
        return { x, y, z };
    }

    getHexesInRange(col, row, range) {
        const result = [];

        for (let c = 0; c < this.cols; c++) {
            for (let r = 0; r < this.rows; r++) {
                if (c === col && r === row) continue;
                if (this.getDistance(col, row, c, r) <= range) {
                    result.push({ col: c, row: r });
                }
            }
        }

        return result;
    }

    // Kreslení je oddělené od geometrie a herního stavu.
    getTerrainColor(terrain) { return WoodcutRenderer.terrainColor(terrain); }

    render(units, fogOptions = null, tokenPositions = null) {
        this.renderer.render(units, fogOptions, tokenPositions);
    }

    // Vykreslí názvy míst (mapLabels) na střed jejich hexů - kurzívou se světlým halo,
    // ať jsou čitelné na libovolném terénu. Respektuje fog of war: popisek se ukáže,
    // jakmile je prozkoumaný aspoň jeden z jeho hexů.
    drawMapLabels(fogOfWar, exploredHexes) {
        if (!this.mapLabels || this.mapLabels.length === 0) return;
        this.ctx.save();
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.font = `italic ${Math.max(12, Math.round(this.hexSize * 0.4))}px Georgia, serif`;
        this.ctx.lineWidth = 3;
        this.ctx.lineJoin = 'round';
        this.ctx.strokeStyle = 'rgba(255, 248, 230, 0.85)';
        this.ctx.fillStyle = 'rgba(60, 40, 20, 0.85)';
        const occupied = [];
        for (const label of this.mapLabels) {
            if (!label.hexes || label.hexes.length === 0) continue;
            if (fogOfWar && exploredHexes) {
                const anyExplored = label.hexes.some(([c, r]) => exploredHexes.has(`${c},${r}`));
                if (!anyExplored) continue;
            }
            let sx = 0, sy = 0;
            for (const [c, r] of label.hexes) {
                const p = this.hexToPixel(c, r);
                sx += p.x;
                sy += p.y;
            }
            const offset = Array.isArray(label.offset) ? label.offset : [0, 0];
            const cx = sx / label.hexes.length + offset[0] * this.hexSize;
            const baseY = sy / label.hexes.length + offset[1] * this.hexSize;
            const metrics = this.ctx.measureText(label.text);
            const width = metrics.width + 8;
            const height = Math.max(16, Math.round(this.hexSize * 0.55));
            let cy = baseY;

            // Datový offset řeší zamýšlené umístění; tento fallback
            // zabrání překrytí i po responzivním přepočtu mapy.
            for (let attempt = 0; attempt < 4; attempt++) {
                const box = {
                    left: cx - width / 2,
                    right: cx + width / 2,
                    top: cy - height / 2,
                    bottom: cy + height / 2
                };
                const overlaps = occupied.some(other =>
                    box.left < other.right && box.right > other.left &&
                    box.top < other.bottom && box.bottom > other.top
                );
                if (!overlaps) {
                    occupied.push(box);
                    break;
                }
                cy = baseY + (attempt % 2 === 0 ? 1 : -1) * Math.ceil((attempt + 1) / 2) * height;
            }

            this.ctx.strokeText(label.text, cx, cy);
            this.ctx.fillText(label.text, cx, cy);
        }
        this.ctx.restore();
    }

    // WP1: řetězy spojující sousední SEPNUTÉ vozy stejné frakce ("kolo na kolo").
    // Dedup přes u.id < nb.id, ať se každý pár nakreslí jen jednou.
    drawWagonChains(units) {
        const at = new Map();
        for (const u of units) {
            if (u.health > 0) at.set(`${u.col},${u.row}`, u);
        }
        this.ctx.save();
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        for (const u of units) {
            if (u.health <= 0 || !u.isWagon() || !u.formationClosed) continue;
            const a = this.hexToPixel(u.col, u.row);
            for (const n of this.getNeighbors(u.col, u.row)) {
                const nb = at.get(`${n.col},${n.row}`);
                if (nb && nb.isWagon() && nb.formationClosed && nb.faction === u.faction && u.id < nb.id) {
                    const b = this.hexToPixel(nb.col, nb.row);
                    // P4: pochodová linie (poloviční kryt) se kreslí čárkovaně a světleji,
                    // pevná zaklíněná hradba plnou tmavě zlatou čárou.
                    const marching = u.marching || nb.marching;
                    if (marching) {
                        this.ctx.strokeStyle = 'rgba(150, 128, 70, 0.55)';
                        this.ctx.setLineDash([5, 5]);
                    } else {
                        this.ctx.strokeStyle = 'rgba(90, 74, 31, 0.75)';
                        this.ctx.setLineDash([]);
                    }
                    this.ctx.beginPath();
                    this.ctx.moveTo(a.x, a.y);
                    this.ctx.lineTo(b.x, b.y);
                    this.ctx.stroke();
                }
            }
        }
        this.ctx.setLineDash([]);
        this.ctx.restore();
    }


    // Animace útoku
    addAttackAnimation(fromCol, fromRow, toCol, toRow) {
        const from = this.hexToPixel(fromCol, fromRow);
        const to = this.hexToPixel(toCol, toRow);

        this.animations.push({
            type: 'attack',
            fromX: from.x,
            fromY: from.y,
            toX: to.x,
            toY: to.y,
            progress: 0,
            duration: 20
        });
    }

    // Animace exploze
    addExplosionAnimation(col, row) {
        const { x, y } = this.hexToPixel(col, row);

        this.animations.push({
            type: 'explosion',
            x: x,
            y: y,
            progress: 0,
            duration: 30
        });
    }

    renderAnimations() {
        for (let i = this.animations.length - 1; i >= 0; i--) {
            const anim = this.animations[i];
            anim.progress++;

            switch (anim.type) {
                case 'attack':
                    this.renderAttackAnimation(anim);
                    break;
                case 'explosion':
                    this.renderExplosionAnimation(anim);
                    break;
            }

            if (anim.progress >= anim.duration) {
                this.animations.splice(i, 1);
            }
        }
    }

    renderAttackAnimation(anim) {
        const t = anim.progress / anim.duration;
        const x = anim.fromX + (anim.toX - anim.fromX) * t;
        const y = anim.fromY + (anim.toY - anim.fromY) * t;

        // Projektil
        this.ctx.fillStyle = '#f2e8d3';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 5, 0, Math.PI * 2);
        this.ctx.fill();

        // Záblesk
        this.ctx.fillStyle = `rgba(128, 53, 45, ${1 - t})`;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 10 * (1 - t), 0, Math.PI * 2);
        this.ctx.fill();
    }

    renderExplosionAnimation(anim) {
        const t = anim.progress / anim.duration;
        const size = 30 * t;
        const alpha = 1 - t;

        // Vnější kruh
        this.ctx.strokeStyle = `rgba(128, 53, 45, ${alpha})`;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(anim.x, anim.y, size, 0, Math.PI * 2);
        this.ctx.stroke();

        // Vnitřní záře
        this.ctx.fillStyle = `rgba(242, 232, 211, ${alpha * 0.5})`;
        this.ctx.beginPath();
        this.ctx.arc(anim.x, anim.y, size * 0.6, 0, Math.PI * 2);
        this.ctx.fill();
    }

    setTerrain(col, row, terrain) {
        const key = `${col},${row}`;
        if (this.hexes.has(key)) {
            this.hexes.get(key).terrain = terrain;
        }
    }

    getTerrain(col, row) {
        const key = `${col},${row}`;
        return this.hexes.has(key) ? this.hexes.get(key).terrain : null;
    }

    // Kontrola, jestli je hex neprůchodný (voda nebo mimo mapu)
    isImpassable(col, row) {
        const terrain = this.getTerrain(col, row);
        return terrain === 'water' || terrain === null;
    }

    getHex(col, row) {
        const key = `${col},${row}`;
        return this.hexes.get(key) || null;
    }

    setSelected(col, row) {
        this.selectedHex = col !== null ? { col, row } : null;
    }

    setHighlighted(hexes) {
        this.highlightedHexes = hexes || [];
    }

    setAttackable(hexes) {
        this.attackableHexes = hexes || [];
    }

    setEnemyMove(hexes) {
        this.enemyMoveHexes = hexes || [];
    }

    setEscapeZone(hexes, label = '', kind = 'escape') {
        this.escapeZoneHexes = hexes || [];
        this.escapeZoneLabel = label || '';
        this.escapeZoneKind = kind || 'escape';
    }

    clearHighlights() {
        this.highlightedHexes = [];
        this.attackableHexes = [];
    }
}

// Třída pro minimapu
class Minimap {
    constructor(canvas, hexGrid) {
        this.eventAbortController = new AbortController();
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.hexGrid = hexGrid;

        // Velikost minimapy
        this.scale = 0.12;  // Měřítko vůči hlavní mapě

        const mapWidth = hexGrid.cols * hexGrid.hexWidth * 0.75 + hexGrid.hexWidth * 0.25;
        const mapHeight = hexGrid.rows * hexGrid.hexHeight + hexGrid.hexHeight * 0.5;

        this.canvas.width = Math.max(160, mapWidth * this.scale + 10);
        this.canvas.height = Math.max(100, mapHeight * this.scale + 10);

        // Offset pro přepočet pozic (kompenzace paddingu)
        this.offsetX = hexGrid.paddingLeft;
        this.offsetY = hexGrid.paddingTop;

        // Padding
        this.padding = 5;

        // Drag & drop
        this.setupDragAndDrop();
    }

    setupDragAndDrop() {
        let isDragging = false;
        let startX, startY;
        let startLeft, startTop;

        // Najdi #game-main jako kontejner pro positioning
        const getContainer = () => document.getElementById('game-main');

        const onMouseDown = (e) => {
            // Ignoruj kliknutí pravým tlačítkem
            if (e.button !== 0) return;

            isDragging = true;
            this.canvas.classList.add('dragging');

            startX = e.clientX;
            startY = e.clientY;

            // Získej aktuální pozici relativně ke kontejneru
            const rect = this.canvas.getBoundingClientRect();
            const container = getContainer();
            const containerRect = container.getBoundingClientRect();

            // Převeď na left/top místo right/bottom
            startLeft = rect.left - containerRect.left;
            startTop = rect.top - containerRect.top;

            // Přepni na absolutní pozicování pomocí left/top
            this.canvas.style.right = 'auto';
            this.canvas.style.bottom = 'auto';
            this.canvas.style.left = startLeft + 'px';
            this.canvas.style.top = startTop + 'px';

            e.preventDefault();
            e.stopPropagation();
        };

        const onMouseMove = (e) => {
            if (!isDragging) return;

            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            const container = getContainer();
            const containerRect = container.getBoundingClientRect();

            // Omez pohyb v rámci kontejneru
            let newLeft = startLeft + dx;
            let newTop = startTop + dy;

            newLeft = Math.max(0, Math.min(newLeft, containerRect.width - this.canvas.width));
            newTop = Math.max(0, Math.min(newTop, containerRect.height - this.canvas.height));

            this.canvas.style.left = newLeft + 'px';
            this.canvas.style.top = newTop + 'px';

            e.preventDefault();
        };

        const onMouseUp = () => {
            if (!isDragging) return;
            isDragging = false;
            this.canvas.classList.remove('dragging');
        };

        const signal = this.eventAbortController.signal;
        this.canvas.addEventListener('mousedown', onMouseDown, { signal });
        document.addEventListener('mousemove', onMouseMove, { signal });
        document.addEventListener('mouseup', onMouseUp, { signal });
    }

    destroy() {
        this.eventAbortController.abort();
        this.canvas.classList.remove('dragging');
    }

    // Vykreslení minimapy
    render(units, tokenPositions = null) {
        const ctx = this.ctx;
        const scale = this.scale;
        const padding = this.padding;

        // Pozadí
        ctx.fillStyle = WoodcutRenderer.palette.paper;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Vykreslení hexů
        for (const [key, hex] of this.hexGrid.hexes) {
            const { x, y } = this.hexGrid.hexToPixel(hex.col, hex.row);
            // Odečíst offset paddingu pro minimapu
            const mx = (x - this.offsetX) * scale + padding;
            const my = (y - this.offsetY) * scale + padding;
            const size = this.hexGrid.hexSize * scale;

            // Barva terénu
            ctx.fillStyle = this.hexGrid.getTerrainColor(hex.terrain);
            ctx.beginPath();
            ctx.arc(mx, my, size * 0.8, 0, Math.PI * 2);
            ctx.fill();
        }

        // Vykreslení jednotek
        for (const unit of units) {
            const { x, y } = tokenPositions?.get(unit.id) ||
                this.hexGrid.hexToPixel(unit.col, unit.row);
            // Odečíst offset paddingu
            const mx = (x - this.offsetX) * scale + padding;
            const my = (y - this.offsetY) * scale + padding;

            // Barva frakce
            ctx.fillStyle = unit.faction === 'hussites' ? WoodcutRenderer.palette.red : WoodcutRenderer.palette.blue;
            ctx.beginPath();
            if (unit.faction === 'hussites') ctx.arc(mx, my, 4, 0, Math.PI * 2);
            else { ctx.moveTo(mx - 4, my - 4); ctx.lineTo(mx + 4, my - 4); ctx.lineTo(mx + 3, my + 2); ctx.lineTo(mx, my + 5); ctx.lineTo(mx - 3, my + 2); ctx.closePath(); }
            ctx.fill();

            // Okraj
            ctx.strokeStyle = WoodcutRenderer.palette.light;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Okraj minimapy
        ctx.strokeStyle = WoodcutRenderer.palette.ink;
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, this.canvas.width - 2, this.canvas.height - 2);
    }
}
