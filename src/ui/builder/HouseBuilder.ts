import { type LifeStore } from '@domain/state/LifeStore.ts';
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
  createEmptyHouse,
} from '@domain/house/model.ts';
import { templateHouse } from '@domain/house/template.ts';

const SVG_NS = 'http://www.w3.org/2000/svg';

interface DragState {
  mode: 'draw' | 'move';
  startTile: Tile;
  curTile: Tile;
  roomId?: string;
  offset?: Tile;
}

/**
 * HouseBuilder — o construtor de casa (modo Construir). Editor HTML/SVG que lê e escreve a
 * `HouseModel` no LifeStore (fonte da verdade); o SaveLoop persiste no IndexedDB. O modo Jogar
 * (Phaser) lê o mesmo modelo. Assim o Emerson constrói a casa cômodo a cômodo, igual à real.
 *
 * Interações: arrastar em área vazia cria um cômodo; clicar num cômodo o seleciona; arrastar um
 * cômodo o move; o painel edita nome / área / piso e exclui.
 */
export class HouseBuilder {
  private readonly store: LifeStore;
  private readonly el: HTMLDivElement;
  private readonly svg: SVGSVGElement;
  private readonly panel: HTMLDivElement;
  private readonly px = 16;

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

  private house(): HouseModel {
    return this.store.getState().house;
  }

  private setHouse(next: HouseModel): void {
    this.store.update((s) => ({ ...s, house: next }));
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
    const x = Math.floor((e.clientX - rect.left) / this.px);
    const y = Math.floor((e.clientY - rect.top) / this.px);
    return {
      x: Math.max(0, Math.min(house.larguraTiles - 1, x)),
      y: Math.max(0, Math.min(house.alturaTiles - 1, y)),
    };
  }

  private onPointerDown(e: PointerEvent): void {
    const tile = this.tileFromEvent(e);
    const hit = roomAtTile(this.house(), tile.x, tile.y);
    this.svg.setPointerCapture(e.pointerId);

    if (hit) {
      this.selectedId = hit.id;
      this.drag = { mode: 'move', startTile: tile, curTile: tile, roomId: hit.id, offset: { x: tile.x - hit.rect.x, y: tile.y - hit.rect.y } };
    } else {
      this.selectedId = null;
      this.drag = { mode: 'draw', startTile: tile, curTile: tile };
    }
    this.render();
  }

  private onPointerMove(e: PointerEvent): void {
    if (!this.drag) return;
    const tile = this.tileFromEvent(e);
    this.drag.curTile = tile;

    if (this.drag.mode === 'move' && this.drag.roomId && this.drag.offset) {
      const house = this.house();
      const room = house.rooms.find((r) => r.id === this.drag?.roomId);
      if (!room) return;
      const nx = Math.max(0, Math.min(house.larguraTiles - room.rect.w, tile.x - this.drag.offset.x));
      const ny = Math.max(0, Math.min(house.alturaTiles - room.rect.h, tile.y - this.drag.offset.y));
      if (nx !== room.rect.x || ny !== room.rect.y) {
        this.setHouse(updateRoom(house, room.id, { rect: { ...room.rect, x: nx, y: ny } }));
      }
    } else {
      this.render();
    }
  }

  private onPointerUp(e: PointerEvent): void {
    if (!this.drag) return;
    this.svg.releasePointerCapture(e.pointerId);

    if (this.drag.mode === 'draw') {
      const rect = this.rectFromTiles(this.drag.startTile, this.drag.curTile);
      if (rect.w >= 1 && rect.h >= 1) {
        const before = this.house();
        this.setHouse(addRoom(before, rect));
        const created = this.store.getState().house.rooms.at(-1);
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
    const w = house.larguraTiles * this.px;
    const h = house.alturaTiles * this.px;
    this.svg.setAttribute('width', String(w));
    this.svg.setAttribute('height', String(h));
    this.svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    this.svg.style.setProperty('--px', `${this.px}px`);

    const parts: string[] = [];
    for (const room of house.rooms) {
      const r = room.rect;
      const selected = room.id === this.selectedId;
      parts.push(
        `<rect x="${r.x * this.px}" y="${r.y * this.px}" width="${r.w * this.px}" height="${r.h * this.px}" ` +
          `fill="${FLOOR_HEX[room.floorType]}" fill-opacity="0.85" ` +
          `stroke="${selected ? '#ffd27f' : '#00000066'}" stroke-width="${selected ? 2.5 : 1}" />`,
        `<text x="${(r.x + r.w / 2) * this.px}" y="${(r.y + r.h / 2) * this.px}" fill="#fff4e0" ` +
          `font-size="11" font-family="monospace" text-anchor="middle" dominant-baseline="middle" ` +
          `style="pointer-events:none">${escapeHtml(room.nome)}</text>`,
      );
    }

    if (this.drag?.mode === 'draw') {
      const r = this.rectFromTiles(this.drag.startTile, this.drag.curTile);
      parts.push(
        `<rect x="${r.x * this.px}" y="${r.y * this.px}" width="${r.w * this.px}" height="${r.h * this.px}" ` +
          `fill="#ffffff22" stroke="#ffd27f" stroke-width="1.5" stroke-dasharray="4 3" style="pointer-events:none" />`,
      );
    }

    this.svg.innerHTML = parts.join('');
    this.renderPanel();
  }

  private renderPanel(): void {
    const house = this.house();
    const selected = house.rooms.find((r) => r.id === this.selectedId) ?? null;

    const areaOptions = LIFE_AREAS.map(
      (a) => `<option value="${a.id}"${selected?.lifeArea === a.id ? ' selected' : ''}>${a.label}</option>`,
    ).join('');
    const floorOptions = FLOOR_TYPES.map(
      (f) => `<option value="${f.id}"${selected?.floorType === f.id ? ' selected' : ''}>${f.label}</option>`,
    ).join('');

    this.panel.innerHTML = `
      <h2>🔨 Construir casa</h2>
      <p class="hint">Arraste no vazio para criar um cômodo. Clique para selecionar; arraste para mover.</p>
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
      <div class="dim">${house.rooms.length} cômodo(s)</div>
      <button id="b-exemplo">Restaurar exemplo</button>
      <button id="b-limpar" class="danger">Limpar tudo</button>
    `;

    this.bindPanel(selected?.id ?? null);
  }

  private bindPanel(selectedId: string | null): void {
    const nome = this.panel.querySelector<HTMLInputElement>('#b-nome');
    nome?.addEventListener('input', () => {
      if (selectedId) this.setHouse(updateRoom(this.house(), selectedId, { nome: nome.value }));
    });

    const area = this.panel.querySelector<HTMLSelectElement>('#b-area');
    area?.addEventListener('change', () => {
      if (selectedId) this.setHouse(updateRoom(this.house(), selectedId, { lifeArea: area.value as LifeArea }));
    });

    const floor = this.panel.querySelector<HTMLSelectElement>('#b-floor');
    floor?.addEventListener('change', () => {
      if (selectedId) this.setHouse(updateRoom(this.house(), selectedId, { floorType: floor.value as FloorType }));
    });

    this.panel.querySelector('#b-del')?.addEventListener('click', () => {
      if (!selectedId) return;
      this.setHouse(removeRoom(this.house(), selectedId));
      this.selectedId = null;
      this.render();
    });

    this.panel.querySelector('#b-exemplo')?.addEventListener('click', () => {
      if (confirm('Substituir a casa atual pela de exemplo?')) {
        this.selectedId = null;
        this.setHouse(templateHouse());
      }
    });

    this.panel.querySelector('#b-limpar')?.addEventListener('click', () => {
      if (confirm('Apagar todos os cômodos?')) {
        this.selectedId = null;
        const h = this.house();
        this.setHouse(createEmptyHouse(h.larguraTiles, h.alturaTiles));
      }
    });
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);
}
