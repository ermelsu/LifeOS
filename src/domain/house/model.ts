import { type LifeArea, type FloorType, type Tile, type TileRect, rectContains } from './types.ts';
import { FURNITURE_BY_KIND } from '@domain/furniture/catalog.ts';

/**
 * Modelo EDITÁVEL da casa — o que o construtor cria e o jogo lê. Faz parte do LifeState e é
 * persistido no IndexedDB. Substitui a antiga planta fixa: agora o Emerson constrói a própria
 * casa cômodo a cômodo (Regra Nº 1 — a casa espelha a realidade porque ele a monta igual à real).
 *
 * Conexão entre cômodos: não há portas explícitas neste modelo. Cômodos desenhados encostados
 * (compartilhando borda) ficam ligados por uma passagem aberta; paredes são geradas em volta do
 * conjunto de cômodos (ver `buildGrid`). "Construir a partir de uma parede" = desenhar um cômodo
 * novo encostado no existente.
 */

export interface BuiltRoom {
  id: string;
  nome: string;
  lifeArea: LifeArea;
  floorType: FloorType;
  rect: TileRect;
}

/** Móvel posicionado: referencia o catálogo por `kind`; (x,y) é o canto superior esquerdo. */
export interface FurnitureItem {
  id: string;
  kind: string;
  x: number;
  y: number;
}

/** Item de parede: porta (abre passagem) ou janela (decorativa, continua sólida). */
export type WallItemKind = 'door' | 'window';
export interface WallItem {
  id: string;
  kind: WallItemKind;
  x: number;
  y: number;
}

export interface HouseModel {
  id: string;
  nome: string;
  larguraTiles: number;
  alturaTiles: number;
  /**
   * Cada cômodo é um retângulo cujo ANEL EXTERNO é parede e o INTERIOR é piso. Cômodos que
   * compartilham uma coluna/linha de parede podem ser ligados por uma porta nela.
   */
  rooms: BuiltRoom[];
  furniture: FurnitureItem[];
  wallItems: WallItem[];
}

/** Menor dimensão de um cômodo (para sobrar ao menos 1 tile de interior). */
export const ROOM_MIN = 3;

/** Metadados para os seletores do construtor. */
export const LIFE_AREAS: { id: LifeArea; label: string }[] = [
  { id: 'conforto', label: 'Conforto / lazer' },
  { id: 'alimentacao', label: 'Alimentação' },
  { id: 'descanso', label: 'Descanso' },
  { id: 'higiene', label: 'Higiene' },
  { id: 'roupas', label: 'Roupas / lavanderia' },
  { id: 'trabalho', label: 'Trabalho / estudos' },
  { id: 'caes', label: 'Cachorros' },
  { id: 'circulacao', label: 'Circulação' },
];

export const FLOOR_TYPES: { id: FloorType; label: string }[] = [
  { id: 'wood', label: 'Madeira' },
  { id: 'parquet', label: 'Parquet' },
  { id: 'brick', label: 'Tijolo' },
  { id: 'carpet', label: 'Carpete' },
  { id: 'tile', label: 'Ladrilho' },
  { id: 'grass', label: 'Grama' },
  { id: 'deck', label: 'Deck' },
];

/** Cor representativa de cada piso (para a prévia no construtor). */
export const FLOOR_HEX: Record<FloorType, string> = {
  wood: '#8a5a34',
  parquet: '#b07a3f',
  brick: '#a15a3c',
  carpet: '#b56a73',
  tile: '#c4b184',
  grass: '#4f8a3f',
  deck: '#6f7f86',
};

/** Tamanho mínimo/padrão do grid da casa (em tiles) — espaço folgado para construir. */
export const MIN_HOUSE_W = 64;
export const MIN_HOUSE_H = 44;

export function createEmptyHouse(nome = 'Nova casa', larguraTiles = MIN_HOUSE_W, alturaTiles = MIN_HOUSE_H): HouseModel {
  return { id: crypto.randomUUID(), nome, larguraTiles, alturaTiles, rooms: [], furniture: [], wallItems: [] };
}

export interface NewRoomOptions {
  nome?: string;
  lifeArea?: LifeArea;
  floorType?: FloorType;
}

/** Adiciona um cômodo (imutável); gera id e nome padrão se não informados. */
export function addRoom(house: HouseModel, rect: TileRect, opts: NewRoomOptions = {}): HouseModel {
  const room: BuiltRoom = {
    id: crypto.randomUUID(),
    nome: opts.nome ?? `Cômodo ${house.rooms.length + 1}`,
    lifeArea: opts.lifeArea ?? 'conforto',
    floorType: opts.floorType ?? 'wood',
    rect,
  };
  return { ...house, rooms: [...house.rooms, room] };
}

export type RoomPatch = Partial<Pick<BuiltRoom, 'nome' | 'lifeArea' | 'floorType' | 'rect'>>;

export function updateRoom(house: HouseModel, id: string, patch: RoomPatch): HouseModel {
  return { ...house, rooms: house.rooms.map((r) => (r.id === id ? { ...r, ...patch } : r)) };
}

export function removeRoom(house: HouseModel, id: string): HouseModel {
  return { ...house, rooms: house.rooms.filter((r) => r.id !== id) };
}

/** Cômodo que contém o tile (o último desenhado vence, para sub-cômodos sobrepostos). */
export function roomAtTile(house: HouseModel, x: number, y: number): BuiltRoom | null {
  for (let i = house.rooms.length - 1; i >= 0; i--) {
    const room = house.rooms[i];
    if (room && rectContains(room.rect, x, y)) return room;
  }
  return null;
}

/** Centro (em tiles) de um retângulo. */
export function rectCenter(rect: TileRect): Tile {
  return { x: rect.x + Math.floor(rect.w / 2), y: rect.y + Math.floor(rect.h / 2) };
}

// --- Móveis ---

export function addFurniture(house: HouseModel, kind: string, x: number, y: number): HouseModel {
  const item: FurnitureItem = { id: crypto.randomUUID(), kind, x, y };
  return { ...house, furniture: [...house.furniture, item] };
}

export function moveFurniture(house: HouseModel, id: string, x: number, y: number): HouseModel {
  return { ...house, furniture: house.furniture.map((f) => (f.id === id ? { ...f, x, y } : f)) };
}

export function removeFurniture(house: HouseModel, id: string): HouseModel {
  return { ...house, furniture: house.furniture.filter((f) => f.id !== id) };
}

/** Móvel cujo footprint cobre o tile (o de cima, desenhado por último, vence). */
export function furnitureAtTile(house: HouseModel, x: number, y: number): FurnitureItem | null {
  for (let i = house.furniture.length - 1; i >= 0; i--) {
    const f = house.furniture[i];
    if (!f) continue;
    const def = FURNITURE_BY_KIND[f.kind];
    if (def && x >= f.x && x < f.x + def.w && y >= f.y && y < f.y + def.h) return f;
  }
  return null;
}

// --- Portas e janelas ---

export function addWallItem(house: HouseModel, kind: WallItemKind, x: number, y: number): HouseModel {
  // Um tile só pode ter um item; substitui se já houver.
  const rest = house.wallItems.filter((w) => !(w.x === x && w.y === y));
  return { ...house, wallItems: [...rest, { id: crypto.randomUUID(), kind, x, y }] };
}

export function removeWallItem(house: HouseModel, id: string): HouseModel {
  return { ...house, wallItems: house.wallItems.filter((w) => w.id !== id) };
}

export function wallItemAtTile(house: HouseModel, x: number, y: number): WallItem | null {
  return house.wallItems.find((w) => w.x === x && w.y === y) ?? null;
}

/** True se (x,y) é uma parede: está no anel externo de algum cômodo e não no interior de nenhum. */
export function isWallTile(house: HouseModel, x: number, y: number): boolean {
  let onBorder = false;
  for (const room of house.rooms) {
    const r = room.rect;
    const inside = x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
    if (!inside) continue;
    const interior = x > r.x && x < r.x + r.w - 1 && y > r.y && y < r.y + r.h - 1;
    if (interior) return false; // interior vence
    onBorder = true;
  }
  return onBorder;
}

/** Onde o personagem nasce: centro da Sala, senão do primeiro cômodo, senão do mapa. */
export function spawnTile(house: HouseModel): Tile {
  const sala = house.rooms.find((r) => r.nome.trim().toLowerCase() === 'sala');
  const room = sala ?? house.rooms[0];
  if (room) return rectCenter(room.rect);
  return { x: Math.floor(house.larguraTiles / 2), y: Math.floor(house.alturaTiles / 2) };
}
