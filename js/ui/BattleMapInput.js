// Kamera a gesta pracují v souřadnicích Canvasu, nikdy nemění herní stav.
class BattleMapInput {
    constructor(view) {
        this.view = view;
        this.canvas = view.game.hexGrid.canvas;
        this.container = document.getElementById('map-container');
        this.surface = document.getElementById('map-surface');
        this.scale = 1;
        this.pointers = new Map();
        this.ignoreClick = false;
        this.gesture = false;
        this.longPressTimer = null;
        this.longPressed = false;
        this.applySize();
        const signal = view.eventAbortController.signal;
        this.canvas.addEventListener('pointerdown', e => this.down(e), { signal });
        this.canvas.addEventListener('pointermove', e => this.move(e), { signal });
        this.canvas.addEventListener('pointerup', e => this.up(e), { signal });
        this.canvas.addEventListener('pointercancel', () => this.cancel(), { signal });
        this.canvas.addEventListener('lostpointercapture', e => {
            if (this.pointers.has(e.pointerId)) this.cancel();
        }, { signal });
        this.canvas.addEventListener('contextmenu', e => {
            e.preventDefault(); this.view.orders.cancel(); this.view.game.deselectUnit();
        }, { signal });
        this.container.addEventListener('wheel', e => {
            // Ctrl/kolečko ponecháváme prohlížeči (přístupné zvětšení celé stránky).
            if (e.ctrlKey || e.metaKey || !e.deltaY) return;
            e.preventDefault();
            this.zoomTo(this.scale * (e.deltaY < 0 ? 1.12 : 1 / 1.12), e.clientX, e.clientY);
        }, { passive: false, signal });
        for (const [id, factor] of [['map-zoom-in', 1.25], ['map-zoom-out', 0.8]]) {
            document.getElementById(id).addEventListener('click', () => this.zoomTo(this.scale * factor), { signal });
        }
        document.getElementById('map-center').addEventListener('click', () => {
            if (view.game.selectedUnit) this.centerOnUnit(view.game.selectedUnit);
            else view.centerOnPlayerForces();
        }, { signal });
    }

    applySize() {
        const width = this.canvas.width * this.scale, height = this.canvas.height * this.scale;
        this.surface.style.width = `${width}px`;
        this.surface.style.height = `${height}px`;
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
        document.getElementById('map-zoom-value').textContent = `${Math.round(this.scale * 100)}%`;
        document.getElementById('map-zoom-in').disabled = this.scale >= 2;
        document.getElementById('map-zoom-out').disabled = this.scale <= 0.6;
    }

    screenToWorld(x, y) {
        const rect = this.canvas.getBoundingClientRect();
        return { x: (x - rect.left) / this.scale, y: (y - rect.top) / this.scale };
    }

    worldToScreen(x, y) {
        const rect = this.canvas.getBoundingClientRect();
        return { x: rect.left + x * this.scale, y: rect.top + y * this.scale };
    }

    zoomTo(scale, x, y) {
        const rect = this.container.getBoundingClientRect();
        x ??= rect.left + this.container.clientWidth / 2;
        y ??= rect.top + this.container.clientHeight / 2;
        const anchor = this.screenToWorld(x, y);
        this.scale = Math.min(2, Math.max(0.6, scale));
        this.applySize();
        const after = this.worldToScreen(anchor.x, anchor.y);
        this.scrollTo(this.container.scrollLeft + after.x - x, this.container.scrollTop + after.y - y);
        this.view.hideTooltip();
        this.view.orders.positionMarker();
    }

    scrollTo(left, top) {
        this.container.scrollLeft = Math.max(0, Math.min(left, this.canvas.width * this.scale + 16 - this.container.clientWidth));
        this.container.scrollTop = Math.max(0, Math.min(top, this.canvas.height * this.scale + 16 - this.container.clientHeight));
    }

    centerOnUnit(unit) {
        const pos = this.view.game.hexGrid.hexToPixel(unit.col, unit.row);
        this.centerOnWorld(pos.x, pos.y);
    }

    centerOnWorld(x, y) {
        this.scrollTo(x * this.scale - this.container.clientWidth / 2 + 8,
            y * this.scale - this.container.clientHeight / 2 + 8);
    }

    down(e) {
        if (e.button !== 0 && e.button !== undefined) return;
        if (this.pointers.size === 0) {
            this.gesture = false;
            this.ignoreClick = false;
            this.longPressed = false;
        }
        this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY, type: e.pointerType });
        this.canvas.setPointerCapture?.(e.pointerId);
        if (e.pointerType !== 'mouse') e.preventDefault();
        if (this.pointers.size > 1) {
            this.gesture = true;
            this.clearLongPress();
            this.view.orders.cancel();
        }
        this.view.hideTooltip();
        if (e.pointerType !== 'mouse' && this.pointers.size === 1) {
            this.longPressTimer = setTimeout(() => {
                const p = this.pointers.get(e.pointerId);
                if (!p || this.gesture) return;
                const pos = this.screenToWorld(p.x, p.y);
                const hex = this.view.game.hexGrid.pixelToHex(pos.x, pos.y);
                const unit = hex && this.view.game.getUnitAt(hex.col, hex.row);
                if (!unit || unit.faction === 'hussites' ||
                    !this.view.game.fogOfWarSystem.isEnemyVisible(unit)) return;
                this.longPressed = true;
                this.ignoreClick = true;
                this.view.orders.inspect(hex);
            }, 500);
        }
    }

    clearLongPress() {
        if (this.longPressTimer !== null) clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
    }

    pair() {
        const [a, b] = [...this.pointers.values()];
        return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, distance: Math.hypot(a.x - b.x, a.y - b.y) };
    }

    move(e) {
        const p = this.pointers.get(e.pointerId);
        if (!p) return;
        e.preventDefault();
        const before = this.pointers.size === 2 ? this.pair() : null;
        const dx = e.clientX - p.x, dy = e.clientY - p.y;
        p.x = e.clientX; p.y = e.clientY;
        if (Math.hypot(p.x - p.startX, p.y - p.startY) > 8) {
            this.gesture = true;
            this.clearLongPress();
        }
        if (!this.gesture) return;
        this.ignoreClick = true;
        this.canvas.classList.add('panning');
        if (before) {
            const after = this.pair();
            this.scrollTo(this.container.scrollLeft - (after.x - before.x), this.container.scrollTop - (after.y - before.y));
            if (before.distance > 1) this.zoomTo(this.scale * after.distance / before.distance, after.x, after.y);
        } else if (this.pointers.size === 1) {
            this.scrollTo(this.container.scrollLeft - dx, this.container.scrollTop - dy);
        }
        this.view.hideTooltip();
    }

    up(e) {
        this.clearLongPress();
        const p = this.pointers.get(e.pointerId);
        if (!p) return;
        // I bez pointermove nesmí velký posun mezi down/up vydat rozkaz.
        if (Math.hypot(e.clientX - p.startX, e.clientY - p.startY) > 8) this.gesture = true;
        this.pointers.delete(e.pointerId);
        if (p.type !== 'mouse') {
            e.preventDefault();
            this.ignoreClick = true; // případný kompatibilní click nesmí rozkaz zopakovat
            if (!this.gesture && !this.longPressed && this.pointers.size === 0) this.view.handleMapTap(e, true);
        } else if (this.gesture) this.ignoreClick = true;
        this.canvas.releasePointerCapture?.(e.pointerId);
        if (!this.pointers.size) this.canvas.classList.remove('panning');
    }

    cancel() {
        this.clearLongPress();
        const ids = [...this.pointers.keys()];
        this.pointers.clear();
        this.ignoreClick = true;
        this.gesture = true;
        this.canvas.classList.remove('panning');
        for (const id of ids) {
            if (this.canvas.hasPointerCapture?.(id)) this.canvas.releasePointerCapture(id);
        }
    }
}
