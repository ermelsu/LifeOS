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
} from '@domain/house/model.ts';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Alças de redimensionamento (cantos + meios das bordas) e o cursor de cada uma. */
type Handle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';
const HANDLE_CURSOR: Record<Handle, string> = {
  nw: 'nwse-resize', se: 'nwse-resize', ne: 'nesw-resize', sw: 'nesw-resize',
  n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize',
};

interface DragState {
  mode: 'draw' | 'move' | 'resize';
  startTile: Tile;
  curTile: Tile;
  roomId?: string;
  offset?: Tile;
  handle?: Handle;
  orig?: TileRect;
}

const ZOOM_MIN = 12;
const ZOOM_MAX = 40;

/**
 * HouseBuilder — o construtor de casa (modo Construir). Editor HTML/SVG que lê e escreve a
 * `HouseModel` no LifeStore (fonte da verdade); o SaveLoop persiste no IndexedDB. O modo Jogar
 * (Phaser) lê o mesmo modelo. Assim o Emerson constrói a casa cômodo a cômodo, igual à real.
 *
 * Interações: arrastar no vazio cria um cômodo; clicar seleciona; arrastar o cômodo o move;
 * arrastar as ALÇAS redimensiona; o painel edita nome / área / piso, faz zoom e exclui.
 */
export class HouseBuilder {
  private readonly store: LifeStore;
  private readonly el: HTMLDivElement;
  private readonly svg: SVGSVGElement;
  private readonly panel: HTMLDivElement;
  private px = 22;

  private selectedId: string | null = null;
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

  // --- Interação com ponteiro ---

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

    // 1) Alça de redimensionamento do cômodo selecionado?
    const handle = (e.target as Element).getAttribute('data-handle') as Handle | null;
    const selected = house.rooms.find((r) => r.id === this.selectedId);
    if (handle && selected) {
      this.drag = { mode: 'resize', startTile: tile, curTile: tile, roomId: selected.id, handle, orig: { ...selected.rect } };
      return;
    }

    // 2) Clique num cômodo → seleciona e prepara mover.
    const hit = roomAtTile(house, tile.x, tile.y);
    if (hit) {
      this.selectedId = hit.id;
      this.drag = { mode: 'move', startTile: tile, curTile: tile, roomId: hit.id, offset: { x: tile.x - hit.rect.x, y: tile.y - hit.rect.y } };
    } else {
      // 3) Vazio → desenha um cômodo novo.
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

    if (this.drag.mode === 'move' && this.drag.roomId && this.drag.offset) {
      const room = house.rooms.find((r) => r.id === this.drag?.roomId);
      if (!room) return;
      const nx = Math.max(0, Math.min(house.larguraTiles - room.rect.w, tile.x - this.drag.offset.x));
      const ny = Math.max(0, Math.min(house.alturaTiles - room.rect.h, tile.y - this.drag.offset.y));
      if (nx !== room.rect.x || ny !== room.rect.y) {
        this.setHouse(updateRoom(house, room.id, { rect: { ...room.rect, x: nx, y: ny } }));
      }
    } else if (this.drag.mode === 'resize' && this.drag.roomId && this.drag.handle && this.drag.orig) {
      this.setHouse(updateRoom(house, this.drag.roomId, { rect: this.resizedRect(house, this.drag.orig, this.drag.handle, tile) }));
    } else {
      this.render();
    }
  }

  /** Novo retângulo ao arrastar uma alça: a borda oposta fica fixa (vinda de `orig`). */
  private resizedRect(house: HouseModel, orig: TileRect, handle: Handle, t: Tile): TileRect {
    let { x, y, w, h } = orig;
    if (handle.includes('e')) w = Math.max(1, Math.min(house.larguraTiles - x, t.x - x + 1));
    if (handle.includes('s')) h = Math.max(1, Math.min(house.alturaTiles - y, t.y - y + 1));
    if (handle.includes('w')) {
      const right = orig.x + orig.w;
      x = Math.max(0, Math.min(right - 1, t.x));
      w = right - x;
    }
    if (handle.includes('n')) {
      const bottom = orig.y + orig.h;
      y = Math.max(0, Math.min(bottom - 1, t.y));
      h = bottom - y;
    }
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
        const created = this.house()?.rooms.at(-1);
        this.selectedId = created ? created.id : null;
      }
    }
    this.drag = null;
    this.render();
  }

  private rectFromTiles(a: Tile, b: Tile): TileRect {
    const x = Math.min(a.x, b.x);
    const y = Math.min(a.y, b.y);
    return { x, y, w: Math.abs(a.x - b.x) + 1, h: Math.abs(a.y - b.y) + 1 };
  }

  // --- Renderização ---

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
    this.svg.style.setProperty('--px', `${px}px`);

    const parts: string[] = [];
    for (const room of house.rooms) {
      const r = room.rect;
      const selected = room.id === this.selectedId;
      parts.push(
        `<rect x="${r.x * px}" y="${r.y * px}" width="${r.w * px}" height="${r.h * px}" ` +
          `fill="${FLOOR_HEX[room.floorType]}" fill-opacity="0.9" ` +
          `stroke="${selected ? '#ffd27f' : '#00000066'}" stroke-width="${selected ? 2.5 : 1}" />`,
        `<text x="${(r.x + r.w / 2) * px}" y="${(r.y + r.h / 2) * px}" fill="#fff4e0" ` +
          `font-size="12" font-family="monospace" text-anchor="middle" dominant-baseline="middle" ` +
          `style="pointer-events:none">${escapeHtml(room.nome)}</text>`,
      );
      if (selected) parts.push(this.handlesSvg(r));
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
    const hs = 9; // tamanho da alça em px
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
    const selected = house.rooms.find((r) => r.id === this.selectedId) ?? null;

    const areaOptions = LIFE_AREAS.map(
      (a) => `<option value="${a.id}"${selected?.lifeArea === a.id ? ' selected' : ''}>${a.label}</option>`,
    ).join('');
    const floorOptions = FLOOR_TYPES.map(
      (f) => `<option value="${f.id}"${selected?.floorType === f.id ? ' selected' : ''}>${f.label}</option>`,
    ).join('');

    this.panel.innerHTML = `
      <h2>🔨 Construir casa</h2>
      <p class="hint">Arraste no vazio para criar. Clique para selecionar; arraste para mover; puxe as
        <b>alças</b> para redimensionar.</p>
      <div class="field"><label>Zoom</label>
        <div class="zoom-row"><button id="b-zoomout">－</button><span class="dim">${this.px}px</span><button id="b-zoomin">＋</button></div>
      </div>
      <hr />
      ${
        selected
          ? `
        <div class="field"><label>Nome</label><input id="b-nome" type="text" value="${escapeHtml(selected.nome)}" /></div>
        <div class="field"><label>Área da vida</label><select id="b-area">${areaOptions}</select></div>
        <div class="field"><label>Piso</label><select id="b-floor">${floorOptions}</select></div>
        <div class="field"><span class="dim">${selected.rect.w}×${selected.rect.h} tiles</span></div>
        <button id="b-del" class="danger">Excluir cômodo</button>
      `
          : `<p class="dim">Nenhum cômodo selecionado.</p>`
      }
      <hr />
      <div class="dim">🏠 ${escapeHtml(house.nome)} · ${house.rooms.length} cômodo(s) · grid ${house.larguraTiles}×${house.alturaTiles}</div>
      <button id="b-limpar" class="danger">Limpar cômodos</button>
    `;

    this.bindPanel(house, selected?.id ?? null);
  }

  private bindPanel(house: HouseModel, selectedId: string | null): void {
    const withHouse = (fn: (h: HouseModel) => HouseModel): void => {
      const h = this.house();
      if (h) this.setHouse(fn(h));
    };

    this.panel.querySelector('#b-zoomin')?.addEventListener('click', () => {
      this.px = this.clampZoom(this.px + 4);
      this.render();
    });
    this.panel.querySelector('#b-zoomout')?.addEventListener('click', () => {
      this.px = this.clampZoom(this.px - 4);
      this.render();
    });

    const nome = this.panel.querySelector<HTMLInputElement>('#b-nome');
    nome?.addEventListener('input', () => {
      if (selectedId) withHouse((h) => updateRoom(h, selectedId, { nome: nome.value }));
    });

    const area = this.panel.querySelector<HTMLSelectElement>('#b-area');
    area?.addEventListener('change', () => {
      if (selectedId) withHouse((h) => updateRoom(h, selectedId, { lifeArea: area.value as LifeArea }));
    });

    const floor = this.panel.querySelector<HTMLSelectElement>('#b-floor');
    floor?.addEventListener('change', () => {
      if (selectedId) withHouse((h) => updateRoom(h, selectedId, { floorType: floor.value as FloorType }));
    });

    this.panel.querySelector('#b-del')?.addEventListener('click', () => {
      if (!selectedId) return;
      withHouse((h) => removeRoom(h, selectedId));
      this.selectedId = null;
      this.render();
    });

    this.panel.querySelector('#b-limpar')?.addEventListener('click', () => {
      if (confirm(`Apagar todos os cômodos de "${house.nome}"?`)) {
        this.selectedId = null;
        withHouse((h) => ({ ...h, rooms: [] }));
      }
    });
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);
}
