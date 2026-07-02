import { type LifeStore } from '@domain/state/LifeStore.ts';
import { getActiveHouse, replaceActiveHouse } from '@domain/state/lifeOps.ts';
import { type Tile, type TileRect, type LifeArea, type FloorType } from '@domain/house/types.ts';
import {
  type HouseModel,
  LIFE_AREAS,
  FLOOR_TYPES,
  FLOOR_HEX,
  addRoom,
  updateRoom,
  removeRoom,
  roomAtTile,
  addFurniture,
  moveFurniture,
  removeFurniture,
} from '@domain/house/model.ts';
import { FURNITURE, FURNITURE_BY_KIND, INTERIORS_W, INTERIORS_H, type FurnitureDef } from '@domain/furniture/catalog.ts';

const SVG_NS = 'http://www.w3.org/2000/svg';

type Handle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';
const HANDLE_CURSOR: Record<Handle, string> = {
  nw: 'nwse-resize', se: 'nwse-resize', ne: 'nesw-resize', sw: 'nesw-resize',
  n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize',
};

type EditMode = 'rooms' | 'furniture';

interface DragState {
  mode: 'draw' | 'move' | 'resize' | 'furniture';
  startTile: Tile;
  curTile: Tile;
  id?: string;
  offset?: Tile;
  handle?: Handle;
  orig?: TileRect;
}

const ZOOM_MIN = 12;
const ZOOM_MAX = 40;

/**
 * HouseBuilder — o construtor de casa. Editor HTML/SVG que lê e escreve a `HouseModel` no
 * LifeStore. Dois modos: **Cômodos** (desenhar/mover/redimensionar/pisos) e **Móveis** (colocar,
 * mover e excluir móveis do catálogo). O modo Jogar (Phaser) lê o mesmo modelo.
 */
export class HouseBuilder {
  private readonly store: LifeStore;
  private readonly el: HTMLDivElement;
  private readonly svg: SVGSVGElement;
  private readonly panel: HTMLDivElement;
  private readonly interiorsUrl = `${import.meta.env.BASE_URL}assets/moderninteriors/tiles/interiors.png`;
  private px = 22;

  private editMode: EditMode = 'rooms';
  private selectedId: string | null = null; // cômodo
  private selectedFurnitureId: string | null = null;
  private brush: string | null = null; // móvel escolhido para colocar
  private drag: DragState | null = null;

  constructor(store: LifeStore, parent: HTMLElement) {
    this.store = store;

    this.el = document.createElement('div');
    this.el.className = 'builder panel';

    const canvasWrap = document.createElement('div');
    canvasWrap.className = 'builder-canvas';
    this.svg = document.createElementNS(SVG_NS, 'svg') as SVGSVGElement;
    this.svg.classList.add('builder-svg');
    canvasWrap.appendChild(this.svg);

    this.panel = document.createElement('div');
    this.panel.className = 'builder-side';

    this.el.append(canvasWrap, this.panel);
    parent.appendChild(this.el);

    this.attachPointer();
    this.store.subscribe(() => this.render());
    this.render();
  }

  setVisible(visible: boolean): void {
    this.el.style.display = visible ? 'flex' : 'none';
  }

  private house(): HouseModel | null {
    return getActiveHouse(this.store.getState());
  }

  private setHouse(next: HouseModel): void {
    this.store.update((s) => replaceActiveHouse(s, next));
  }

  private clampZoom(px: number): number {
    return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, px));
  }

  // --- Ponteiro ---

  private attachPointer(): void {
    this.svg.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    this.svg.addEventListener('pointermove', (e) => this.onPointerMove(e));
    this.svg.addEventListener('pointerup', (e) => this.onPointerUp(e));
  }

  private tileFromEvent(e: PointerEvent): Tile {
    const rect = this.svg.getBoundingClientRect();
    const house = this.house();
    if (!house) return { x: 0, y: 0 };
    const x = Math.floor((e.clientX - rect.left) / this.px);
    const y = Math.floor((e.clientY - rect.top) / this.px);
    return {
      x: Math.max(0, Math.min(house.larguraTiles - 1, x)),
      y: Math.max(0, Math.min(house.alturaTiles - 1, y)),
    };
  }

  private onPointerDown(e: PointerEvent): void {
    const house = this.house();
    if (!house) return;
    const tile = this.tileFromEvent(e);
    this.svg.setPointerCapture(e.pointerId);

    if (this.editMode === 'furniture') {
      const fid = (e.target as Element).getAttribute('data-furniture');
      if (fid) {
        const f = house.furniture.find((x) => x.id === fid);
        this.selectedFurnitureId = fid;
        if (f) this.drag = { mode: 'furniture', startTile: tile, curTile: tile, id: fid, offset: { x: tile.x - f.x, y: tile.y - f.y } };
      } else if (this.brush) {
        this.setHouse(addFurniture(house, this.brush, tile.x, tile.y));
        this.selectedFurnitureId = this.house()?.furniture.at(-1)?.id ?? null;
      } else {
        this.selectedFurnitureId = null;
      }
      this.render();
      return;
    }

    // --- modo Cômodos ---
    const handle = (e.target as Element).getAttribute('data-handle') as Handle | null;
    const selected = house.rooms.find((r) => r.id === this.selectedId);
    if (handle && selected) {
      this.drag = { mode: 'resize', startTile: tile, curTile: tile, id: selected.id, handle, orig: { ...selected.rect } };
      return;
    }
    const hit = roomAtTile(house, tile.x, tile.y);
    if (hit) {
      this.selectedId = hit.id;
      this.drag = { mode: 'move', startTile: tile, curTile: tile, id: hit.id, offset: { x: tile.x - hit.rect.x, y: tile.y - hit.rect.y } };
    } else {
      this.selectedId = null;
      this.drag = { mode: 'draw', startTile: tile, curTile: tile };
    }
    this.render();
  }

  private onPointerMove(e: PointerEvent): void {
    if (!this.drag) return;
    const house = this.house();
    if (!house) return;
    const tile = this.tileFromEvent(e);
    this.drag.curTile = tile;

    if (this.drag.mode === 'furniture' && this.drag.id && this.drag.offset) {
      const f = house.furniture.find((x) => x.id === this.drag?.id);
      const def = f ? FURNITURE_BY_KIND[f.kind] : undefined;
      if (!f || !def) return;
      const nx = Math.max(0, Math.min(house.larguraTiles - def.w, tile.x - this.drag.offset.x));
      const ny = Math.max(0, Math.min(house.alturaTiles - def.h, tile.y - this.drag.offset.y));
      if (nx !== f.x || ny !== f.y) this.setHouse(moveFurniture(house, f.id, nx, ny));
    } else if (this.drag.mode === 'move' && this.drag.id && this.drag.offset) {
      const room = house.rooms.find((r) => r.id === this.drag?.id);
      if (!room) return;
      const nx = Math.max(0, Math.min(house.larguraTiles - room.rect.w, tile.x - this.drag.offset.x));
      const ny = Math.max(0, Math.min(house.alturaTiles - room.rect.h, tile.y - this.drag.offset.y));
      if (nx !== room.rect.x || ny !== room.rect.y) this.setHouse(updateRoom(house, room.id, { rect: { ...room.rect, x: nx, y: ny } }));
    } else if (this.drag.mode === 'resize' && this.drag.id && this.drag.handle && this.drag.orig) {
      this.setHouse(updateRoom(house, this.drag.id, { rect: this.resizedRect(house, this.drag.orig, this.drag.handle, tile) }));
    } else if (this.drag.mode === 'draw') {
      this.render();
    }
  }

  private resizedRect(house: HouseModel, orig: TileRect, handle: Handle, t: Tile): TileRect {
    let { x, y, w, h } = orig;
    if (handle.includes('e')) w = Math.max(1, Math.min(house.larguraTiles - x, t.x - x + 1));
    if (handle.includes('s')) h = Math.max(1, Math.min(house.alturaTiles - y, t.y - y + 1));
    if (handle.includes('w')) { const right = orig.x + orig.w; x = Math.max(0, Math.min(right - 1, t.x)); w = right - x; }
    if (handle.includes('n')) { const bottom = orig.y + orig.h; y = Math.max(0, Math.min(bottom - 1, t.y)); h = bottom - y; }
    return { x, y, w, h };
  }

  private onPointerUp(e: PointerEvent): void {
    if (!this.drag) return;
    this.svg.releasePointerCapture(e.pointerId);
    if (this.drag.mode === 'draw') {
      const before = this.house();
      const rect = this.rectFromTiles(this.drag.startTile, this.drag.curTile);
      if (before && rect.w >= 1 && rect.h >= 1) {
        this.setHouse(addRoom(before, rect));
        this.selectedId = this.house()?.rooms.at(-1)?.id ?? null;
      }
    }
    this.drag = null;
    this.render();
  }

  private rectFromTiles(a: Tile, b: Tile): TileRect {
    return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(a.x - b.x) + 1, h: Math.abs(a.y - b.y) + 1 };
  }

  // --- Render ---

  private furnitureSvg(xpx: number, ypx: number, wpx: number, hpx: number, def: FurnitureDef): string {
    return (
      `<svg x="${xpx}" y="${ypx}" width="${wpx}" height="${hpx}" ` +
      `viewBox="${def.col * 16} ${def.row * 16} ${def.w * 16} ${def.h * 16}" style="pointer-events:none">` +
      `<image href="${this.interiorsUrl}" width="${INTERIORS_W}" height="${INTERIORS_H}" preserveAspectRatio="none" style="image-rendering:pixelated"/>` +
      `</svg>`
    );
  }

  private render(): void {
    const house = this.house();
    if (!house) {
      this.svg.innerHTML = '';
      this.panel.innerHTML = '<h2>🔨 Construir casa</h2><p class="dim">Nenhuma casa ativa.</p>';
      return;
    }
    const px = this.px;
    const w = house.larguraTiles * px;
    const h = house.alturaTiles * px;
    this.svg.setAttribute('width', String(w));
    this.svg.setAttribute('height', String(h));
    this.svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

    const parts: string[] = [];

    // Cômodos (piso + nome).
    for (const room of house.rooms) {
      const r = room.rect;
      const selected = this.editMode === 'rooms' && room.id === this.selectedId;
      parts.push(
        `<rect x="${r.x * px}" y="${r.y * px}" width="${r.w * px}" height="${r.h * px}" ` +
          `fill="${FLOOR_HEX[room.floorType]}" fill-opacity="0.9" ` +
          `stroke="${selected ? '#ffd27f' : '#00000066'}" stroke-width="${selected ? 2.5 : 1}" />`,
        `<text x="${(r.x + r.w / 2) * px}" y="${(r.y + r.h / 2) * px}" fill="#fff4e0" font-size="12" ` +
          `font-family="monospace" text-anchor="middle" dominant-baseline="middle" style="pointer-events:none">${escapeHtml(room.nome)}</text>`,
      );
      if (selected) parts.push(this.handlesSvg(r));
    }

    // Móveis (imagem recortada + área de clique no modo Móveis).
    for (const f of house.furniture) {
      const def = FURNITURE_BY_KIND[f.kind];
      if (!def) continue;
      parts.push(this.furnitureSvg(f.x * px, f.y * px, def.w * px, def.h * px, def));
      if (this.editMode === 'furniture') {
        const sel = f.id === this.selectedFurnitureId;
        parts.push(
          `<rect data-furniture="${f.id}" x="${f.x * px}" y="${f.y * px}" width="${def.w * px}" height="${def.h * px}" ` +
            `fill="#00000001" stroke="${sel ? '#7fd0ff' : 'none'}" stroke-width="2" style="cursor:move" />`,
        );
      }
    }

    if (this.drag?.mode === 'draw') {
      const r = this.rectFromTiles(this.drag.startTile, this.drag.curTile);
      parts.push(
        `<rect x="${r.x * px}" y="${r.y * px}" width="${r.w * px}" height="${r.h * px}" ` +
          `fill="#ffffff22" stroke="#ffd27f" stroke-width="1.5" stroke-dasharray="4 3" style="pointer-events:none" />`,
      );
    }

    this.svg.innerHTML = parts.join('');
    this.renderPanel();
  }

  private handlesSvg(r: TileRect): string {
    const px = this.px;
    const hs = 9;
    const pts: [Handle, number, number][] = [
      ['nw', r.x, r.y], ['n', r.x + r.w / 2, r.y], ['ne', r.x + r.w, r.y],
      ['e', r.x + r.w, r.y + r.h / 2], ['se', r.x + r.w, r.y + r.h],
      ['s', r.x + r.w / 2, r.y + r.h], ['sw', r.x, r.y + r.h], ['w', r.x, r.y + r.h / 2],
    ];
    return pts
      .map(([hName, cx, cy]) =>
        `<rect data-handle="${hName}" x="${cx * px - hs / 2}" y="${cy * px - hs / 2}" width="${hs}" height="${hs}" ` +
        `fill="#ffd27f" stroke="#5a3a1a" stroke-width="1" style="cursor:${HANDLE_CURSOR[hName]}" />`,
      )
      .join('');
  }

  private renderPanel(): void {
    const house = this.house();
    if (!house) return;

    const tabs = `
      <div class="mode-tabs">
        <button data-mode="rooms" class="${this.editMode === 'rooms' ? 'active' : ''}">Cômodos</button>
        <button data-mode="furniture" class="${this.editMode === 'furniture' ? 'active' : ''}">Móveis</button>
      </div>
      <div class="field"><label>Zoom</label>
        <div class="zoom-row"><button id="b-zoomout">－</button><span class="dim">${this.px}px</span><button id="b-zoomin">＋</button></div>
      </div><hr />`;

    this.panel.innerHTML =
      `<h2>🔨 Construir casa</h2>${tabs}` +
      (this.editMode === 'rooms' ? this.roomsPanel(house) : this.furniturePanel(house)) +
      `<hr /><div class="dim">🏠 ${escapeHtml(house.nome)} · ${house.rooms.length} cômodo(s) · ${house.furniture.length} móvel(is) · grid ${house.larguraTiles}×${house.alturaTiles}</div>`;

    this.bindPanel(house);
  }

  private roomsPanel(house: HouseModel): string {
    const selected = house.rooms.find((r) => r.id === this.selectedId) ?? null;
    const areaOptions = LIFE_AREAS.map((a) => `<option value="${a.id}"${selected?.lifeArea === a.id ? ' selected' : ''}>${a.label}</option>`).join('');
    const floorOptions = FLOOR_TYPES.map((f) => `<option value="${f.id}"${selected?.floorType === f.id ? ' selected' : ''}>${f.label}</option>`).join('');
    return `
      <p class="hint">Arraste no vazio para criar. Clique para selecionar; arraste para mover; puxe as <b>alças</b> para redimensionar.</p>
      ${
        selected
          ? `<div class="field"><label>Nome</label><input id="b-nome" type="text" value="${escapeHtml(selected.nome)}" /></div>
             <div class="field"><label>Área da vida</label><select id="b-area">${areaOptions}</select></div>
             <div class="field"><label>Piso</label><select id="b-floor">${floorOptions}</select></div>
             <div class="field"><span class="dim">${selected.rect.w}×${selected.rect.h} tiles</span></div>
             <button id="b-del" class="danger">Excluir cômodo</button>`
          : `<p class="dim">Nenhum cômodo selecionado.</p>`
      }
      <button id="b-limpar" class="danger">Limpar cômodos</button>`;
  }

  private furniturePanel(house: HouseModel): string {
    const palette = FURNITURE.map((def) => {
      const s = 12;
      const active = this.brush === def.kind ? ' active' : '';
      const preview =
        `<svg width="${def.w * s}" height="${def.h * s}" viewBox="${def.col * 16} ${def.row * 16} ${def.w * 16} ${def.h * 16}">` +
        `<image href="${this.interiorsUrl}" width="${INTERIORS_W}" height="${INTERIORS_H}" preserveAspectRatio="none" style="image-rendering:pixelated"/></svg>`;
      return `<button class="furn-btn${active}" data-brush="${def.kind}" title="${def.label}">${preview}<span>${def.label}</span></button>`;
    }).join('');

    const sel = house.furniture.find((f) => f.id === this.selectedFurnitureId);
    const selDef = sel ? FURNITURE_BY_KIND[sel.kind] : undefined;
    return `
      <p class="hint">Escolha um móvel e clique no cômodo para colocar. Clique num móvel para selecionar; arraste para mover.</p>
      <div class="furn-palette">${palette}</div>
      ${sel && selDef ? `<hr /><div class="dim">Selecionado: ${escapeHtml(selDef.label)}</div><button id="f-del" class="danger">Excluir móvel</button>` : ''}`;
  }

  private bindPanel(house: HouseModel): void {
    const withHouse = (fn: (h: HouseModel) => HouseModel): void => {
      const h = this.house();
      if (h) this.setHouse(fn(h));
    };

    this.panel.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((b) =>
      b.addEventListener('click', () => {
        this.editMode = b.dataset.mode as EditMode;
        this.render();
      }),
    );
    this.panel.querySelector('#b-zoomin')?.addEventListener('click', () => { this.px = this.clampZoom(this.px + 4); this.render(); });
    this.panel.querySelector('#b-zoomout')?.addEventListener('click', () => { this.px = this.clampZoom(this.px - 4); this.render(); });

    // Cômodos
    const selId = this.selectedId;
    const nome = this.panel.querySelector<HTMLInputElement>('#b-nome');
    nome?.addEventListener('input', () => { if (selId) withHouse((h) => updateRoom(h, selId, { nome: nome.value })); });
    const area = this.panel.querySelector<HTMLSelectElement>('#b-area');
    area?.addEventListener('change', () => { if (selId) withHouse((h) => updateRoom(h, selId, { lifeArea: area.value as LifeArea })); });
    const floor = this.panel.querySelector<HTMLSelectElement>('#b-floor');
    floor?.addEventListener('change', () => { if (selId) withHouse((h) => updateRoom(h, selId, { floorType: floor.value as FloorType })); });
    this.panel.querySelector('#b-del')?.addEventListener('click', () => {
      if (!selId) return;
      withHouse((h) => removeRoom(h, selId));
      this.selectedId = null;
      this.render();
    });
    this.panel.querySelector('#b-limpar')?.addEventListener('click', () => {
      if (confirm(`Apagar todos os cômodos de "${house.nome}"?`)) { this.selectedId = null; withHouse((h) => ({ ...h, rooms: [] })); }
    });

    // Móveis
    this.panel.querySelectorAll<HTMLButtonElement>('[data-brush]').forEach((b) =>
      b.addEventListener('click', () => {
        this.brush = this.brush === b.dataset.brush ? null : (b.dataset.brush ?? null);
        this.render();
      }),
    );
    this.panel.querySelector('#f-del')?.addEventListener('click', () => {
      const id = this.selectedFurnitureId;
      if (!id) return;
      withHouse((h) => removeFurniture(h, id));
      this.selectedFurnitureId = null;
      this.render();
    });
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);
}
