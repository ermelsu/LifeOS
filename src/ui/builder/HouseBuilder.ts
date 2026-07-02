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
  addWallItem,
  removeWallItem,
  wallItemAtTile,
  isWallTile,
  type WallItemKind,
  ROOM_MIN,
} from '@domain/house/model.ts';
import { FURNITURE, FURNITURE_BY_KIND, INTERIORS_W, INTERIORS_H, type FurnitureDef } from '@domain/furniture/catalog.ts';

const SVG_NS = 'http://www.w3.org/2000/svg';
const WALL_COLOR = '#6b5138';

type Handle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';
const HANDLE_CURSOR: Record<Handle, string> = {
  nw: 'nwse-resize', se: 'nwse-resize', ne: 'nesw-resize', sw: 'nesw-resize',
  n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize',
};

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
 * HouseBuilder — o construtor de casa, numa lista única dividida em seções (Cômodos, Móveis,
 * Portas/Janelas). Um "pincel" (`brush`) controla o que um clique faz:
 *   - null → selecionar/mover/redimensionar cômodos (arrastar no vazio cria um);
 *   - `f:<kind>` → colocar um móvel;
 *   - `w:door` / `w:window` → colocar porta/janela numa parede.
 * Lê e escreve a HouseModel no LifeStore; o modo Jogar (Phaser) lê o mesmo modelo.
 */
export class HouseBuilder {
  private readonly store: LifeStore;
  private readonly el: HTMLDivElement;
  private readonly svg: SVGSVGElement;
  private readonly panel: HTMLDivElement;
  private readonly interiorsUrl = `${import.meta.env.BASE_URL}assets/moderninteriors/tiles/interiors.png`;
  private px = 22;

  private brush: string | null = null;
  private selectedId: string | null = null;
  private selectedFurnitureId: string | null = null;
  private selectedWallItemId: string | null = null;
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

  /** Decodifica o pincel: null (selecionar) · furniture · wall. */
  private brushKind(): { t: 'f' | 'w'; k: string } | null {
    if (!this.brush) return null;
    const i = this.brush.indexOf(':');
    return { t: this.brush.slice(0, i) as 'f' | 'w', k: this.brush.slice(i + 1) };
  }

  private clearSelection(): void {
    this.selectedId = null;
    this.selectedFurnitureId = null;
    this.selectedWallItemId = null;
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
    const bk = this.brushKind();

    // --- Pincel de colocar ---
    if (bk?.t === 'f') {
      this.setHouse(addFurniture(house, bk.k, tile.x, tile.y));
      this.selectedFurnitureId = this.house()?.furniture.at(-1)?.id ?? null;
      this.render();
      return;
    }
    if (bk?.t === 'w') {
      if (isWallTile(house, tile.x, tile.y)) {
        this.setHouse(addWallItem(house, bk.k as WallItemKind, tile.x, tile.y));
        this.selectedWallItemId = wallItemAtTile(this.house() ?? house, tile.x, tile.y)?.id ?? null;
      }
      this.render();
      return;
    }

    // --- Modo selecionar (brush null) ---
    const handle = (e.target as Element).getAttribute('data-handle') as Handle | null;
    const room = house.rooms.find((r) => r.id === this.selectedId);
    if (handle && room) {
      this.drag = { mode: 'resize', startTile: tile, curTile: tile, id: room.id, handle, orig: { ...room.rect } };
      return;
    }
    const fid = (e.target as Element).getAttribute('data-furniture');
    if (fid) {
      const f = house.furniture.find((x) => x.id === fid);
      this.clearSelection();
      this.selectedFurnitureId = fid;
      if (f) this.drag = { mode: 'furniture', startTile: tile, curTile: tile, id: fid, offset: { x: tile.x - f.x, y: tile.y - f.y } };
      this.render();
      return;
    }
    const wid = (e.target as Element).getAttribute('data-wallitem');
    if (wid) {
      this.clearSelection();
      this.selectedWallItemId = wid;
      this.render();
      return;
    }
    const hit = roomAtTile(house, tile.x, tile.y);
    if (hit) {
      this.clearSelection();
      this.selectedId = hit.id;
      this.drag = { mode: 'move', startTile: tile, curTile: tile, id: hit.id, offset: { x: tile.x - hit.rect.x, y: tile.y - hit.rect.y } };
    } else {
      this.clearSelection();
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
      this.setHouse(updateRoom(house, this.drag.id, { rect: this.clampRoom(house, this.resizedRect(house, this.drag.orig, this.drag.handle, tile)) }));
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
      const dragged = this.drag.startTile.x !== this.drag.curTile.x || this.drag.startTile.y !== this.drag.curTile.y;
      if (before && dragged) {
        this.setHouse(addRoom(before, this.clampRoom(before, this.rectFromTiles(this.drag.startTile, this.drag.curTile))));
        this.selectedId = this.house()?.rooms.at(-1)?.id ?? null;
      }
    }
    this.drag = null;
    this.render();
  }

  private rectFromTiles(a: Tile, b: Tile): TileRect {
    return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(a.x - b.x) + 1, h: Math.abs(a.y - b.y) + 1 };
  }

  private clampRoom(house: HouseModel, r: TileRect): TileRect {
    const w = Math.min(house.larguraTiles, Math.max(ROOM_MIN, r.w));
    const h = Math.min(house.alturaTiles, Math.max(ROOM_MIN, r.h));
    const x = Math.max(0, Math.min(house.larguraTiles - w, r.x));
    const y = Math.max(0, Math.min(house.alturaTiles - h, r.y));
    return { x, y, w, h };
  }

  // --- Render do mapa ---

  private furnitureSvg(xpx: number, ypx: number, wpx: number, hpx: number, def: FurnitureDef): string {
    return (
      `<svg x="${xpx}" y="${ypx}" width="${wpx}" height="${hpx}" viewBox="${def.col * 16} ${def.row * 16} ${def.w * 16} ${def.h * 16}" style="pointer-events:none">` +
      `<image href="${this.interiorsUrl}" width="${INTERIORS_W}" height="${INTERIORS_H}" preserveAspectRatio="none" style="image-rendering:pixelated"/></svg>`
    );
  }

  private render(): void {
    const house = this.house();
    if (!house) {
      this.svg.innerHTML = '';
      this.panel.innerHTML = '<h2>🔨 Construir casa</h2><p class="dim">Nenhuma casa ativa.</p>';
      return;
    }
    const selecting = this.brush === null;
    const px = this.px;
    const w = house.larguraTiles * px;
    const h = house.alturaTiles * px;
    this.svg.setAttribute('width', String(w));
    this.svg.setAttribute('height', String(h));
    this.svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

    const parts: string[] = [];
    for (const room of house.rooms) {
      const r = room.rect;
      const sel = selecting && room.id === this.selectedId;
      parts.push(
        `<rect x="${r.x * px}" y="${r.y * px}" width="${r.w * px}" height="${r.h * px}" fill="${WALL_COLOR}" stroke="${sel ? '#ffd27f' : '#00000066'}" stroke-width="${sel ? 2.5 : 1}" />`,
        `<rect x="${(r.x + 1) * px}" y="${(r.y + 1) * px}" width="${(r.w - 2) * px}" height="${(r.h - 2) * px}" fill="${FLOOR_HEX[room.floorType]}" fill-opacity="0.95" style="pointer-events:none" />`,
        `<text x="${(r.x + r.w / 2) * px}" y="${(r.y + r.h / 2) * px}" fill="#fff4e0" font-size="12" font-family="monospace" text-anchor="middle" dominant-baseline="middle" style="pointer-events:none">${escapeHtml(room.nome)}</text>`,
      );
      if (sel) parts.push(this.handlesSvg(r));
    }

    for (const f of house.furniture) {
      const def = FURNITURE_BY_KIND[f.kind];
      if (!def) continue;
      parts.push(this.furnitureSvg(f.x * px, f.y * px, def.w * px, def.h * px, def));
      if (selecting) {
        const sel = f.id === this.selectedFurnitureId;
        parts.push(`<rect data-furniture="${f.id}" x="${f.x * px}" y="${f.y * px}" width="${def.w * px}" height="${def.h * px}" fill="#00000001" stroke="${sel ? '#7fd0ff' : 'none'}" stroke-width="2" style="cursor:move" />`);
      }
    }

    for (const wi of house.wallItems) {
      const cor = wi.kind === 'door' ? '#8a5a2e' : '#9fd6ea';
      parts.push(`<rect x="${wi.x * px + 2}" y="${wi.y * px + 2}" width="${px - 4}" height="${px - 4}" rx="2" fill="${cor}" stroke="#000000aa" stroke-width="1" style="pointer-events:none" />`);
      if (selecting) {
        const sel = wi.id === this.selectedWallItemId;
        parts.push(`<rect data-wallitem="${wi.id}" x="${wi.x * px}" y="${wi.y * px}" width="${px}" height="${px}" fill="#00000001" stroke="${sel ? '#7fd0ff' : 'none'}" stroke-width="2" style="cursor:pointer" />`);
      }
    }

    if (this.drag?.mode === 'draw') {
      const r = this.rectFromTiles(this.drag.startTile, this.drag.curTile);
      parts.push(`<rect x="${r.x * px}" y="${r.y * px}" width="${r.w * px}" height="${r.h * px}" fill="#ffffff22" stroke="#ffd27f" stroke-width="1.5" stroke-dasharray="4 3" style="pointer-events:none" />`);
    }

    this.svg.innerHTML = parts.join('');
    this.renderPanel(house);
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
      .map(([n, cx, cy]) => `<rect data-handle="${n}" x="${cx * px - hs / 2}" y="${cy * px - hs / 2}" width="${hs}" height="${hs}" fill="#ffd27f" stroke="#5a3a1a" stroke-width="1" style="cursor:${HANDLE_CURSOR[n]}" />`)
      .join('');
  }

  // --- Painel (lista única em seções) ---

  private renderPanel(house: HouseModel): void {
    this.panel.innerHTML =
      `<h2>🔨 Construir casa</h2>` +
      `<div class="field"><label>Zoom</label><div class="zoom-row"><button id="b-zoomout">－</button><span class="dim">${this.px}px</span><button id="b-zoomin">＋</button></div></div>` +
      this.selectionBlock(house) +
      `<hr /><h3 class="sec">Cômodos</h3>` +
      `<button class="tool${this.brush === null ? ' active' : ''}" data-brush="">✋ Selecionar / mover</button>` +
      `<p class="hint">Com "Selecionar" ativo, arraste no vazio para <b>criar</b> um cômodo; clique para selecionar; puxe as alças para redimensionar.</p>` +
      `<hr /><h3 class="sec">Móveis</h3><div class="furn-palette">${this.furniturePalette()}</div>` +
      `<hr /><h3 class="sec">Portas / Janelas</h3><div class="furn-palette">${this.wallPalette()}</div>` +
      `<hr /><div class="dim">🏠 ${escapeHtml(house.nome)} · ${house.rooms.length} cômodo(s) · ${house.furniture.length} móvel(is) · ${house.wallItems.length} porta(s)/janela(s) · grid ${house.larguraTiles}×${house.alturaTiles}</div>`;
    this.bindPanel();
  }

  /** Bloco de propriedades do que está selecionado (cômodo, móvel ou porta/janela). */
  private selectionBlock(house: HouseModel): string {
    if (this.brush !== null) return '';
    const room = house.rooms.find((r) => r.id === this.selectedId);
    if (room) {
      const areaOptions = LIFE_AREAS.map((a) => `<option value="${a.id}"${room.lifeArea === a.id ? ' selected' : ''}>${a.label}</option>`).join('');
      const floorOptions = FLOOR_TYPES.map((f) => `<option value="${f.id}"${room.floorType === f.id ? ' selected' : ''}>${f.label}</option>`).join('');
      return `<hr /><h3 class="sec">Cômodo selecionado</h3>
        <div class="field"><label>Nome</label><input id="b-nome" type="text" value="${escapeHtml(room.nome)}" /></div>
        <div class="field"><label>Área da vida</label><select id="b-area">${areaOptions}</select></div>
        <div class="field"><label>Piso</label><select id="b-floor">${floorOptions}</select></div>
        <div class="field"><span class="dim">${room.rect.w}×${room.rect.h} tiles</span></div>
        <button id="b-del" class="danger">Excluir cômodo</button>`;
    }
    const f = house.furniture.find((x) => x.id === this.selectedFurnitureId);
    if (f) {
      const def = FURNITURE_BY_KIND[f.kind];
      return `<hr /><div class="dim">Móvel: ${escapeHtml(def?.label ?? f.kind)}</div><button id="f-del" class="danger">Excluir móvel</button>`;
    }
    const wi = house.wallItems.find((x) => x.id === this.selectedWallItemId);
    if (wi) return `<hr /><div class="dim">${wi.kind === 'door' ? 'Porta' : 'Janela'} selecionada</div><button id="w-del" class="danger">Excluir</button>`;
    return '';
  }

  private furniturePalette(): string {
    const s = 12;
    return FURNITURE.map((def) => {
      const active = this.brush === `f:${def.kind}` ? ' active' : '';
      const preview = `<svg width="${def.w * s}" height="${def.h * s}" viewBox="${def.col * 16} ${def.row * 16} ${def.w * 16} ${def.h * 16}"><image href="${this.interiorsUrl}" width="${INTERIORS_W}" height="${INTERIORS_H}" preserveAspectRatio="none" style="image-rendering:pixelated"/></svg>`;
      return `<button class="furn-btn${active}" data-brush="f:${def.kind}" title="${def.label}">${preview}<span>${def.label}</span></button>`;
    }).join('');
  }

  private wallPalette(): string {
    const btn = (kind: WallItemKind, label: string, cor: string): string =>
      `<button class="furn-btn${this.brush === `w:${kind}` ? ' active' : ''}" data-brush="w:${kind}"><span style="display:inline-block;width:30px;height:20px;border-radius:3px;background:${cor}"></span><span>${label}</span></button>`;
    return btn('door', 'Porta', '#8a5a2e') + btn('window', 'Janela', '#9fd6ea');
  }

  private bindPanel(): void {
    const withHouse = (fn: (h: HouseModel) => HouseModel): void => {
      const h = this.house();
      if (h) this.setHouse(fn(h));
    };

    this.panel.querySelector('#b-zoomin')?.addEventListener('click', () => { this.px = this.clampZoom(this.px + 4); this.render(); });
    this.panel.querySelector('#b-zoomout')?.addEventListener('click', () => { this.px = this.clampZoom(this.px - 4); this.render(); });

    // Pincéis (Selecionar / móveis / portas-janelas)
    this.panel.querySelectorAll<HTMLButtonElement>('[data-brush]').forEach((b) =>
      b.addEventListener('click', () => {
        const v = b.dataset.brush ?? '';
        this.brush = v === '' ? null : this.brush === v ? null : v;
        this.render();
      }),
    );

    // Cômodo selecionado
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

    // Excluir móvel / porta-janela selecionados
    this.panel.querySelector('#f-del')?.addEventListener('click', () => {
      const id = this.selectedFurnitureId;
      if (!id) return;
      withHouse((h) => removeFurniture(h, id));
      this.selectedFurnitureId = null;
      this.render();
    });
    this.panel.querySelector('#w-del')?.addEventListener('click', () => {
      const id = this.selectedWallItemId;
      if (!id) return;
      withHouse((h) => removeWallItem(h, id));
      this.selectedWallItemId = null;
      this.render();
    });
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);
}
