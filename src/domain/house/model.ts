import { type LifeArea, type FloorType, type Tile, type TileRect, rectContains } from './types.ts';

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

export interface HouseModel {
  id: string;
  nome: string;
  larguraTiles: number;
  alturaTiles: number;
  rooms: BuiltRoom[];
}

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

export function createEmptyHouse(nome = 'Nova casa', larguraTiles = 48, alturaTiles = 34): HouseModel {
  return { id: crypto.randomUUID(), nome, larguraTiles, alturaTiles, rooms: [] };
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

/** Onde o personagem nasce: centro da Sala, senão do primeiro cômodo, senão do mapa. */
export function spawnTile(house: HouseModel): Tile {
  const sala = house.rooms.find((r) => r.nome.trim().toLowerCase() === 'sala');
  const room = sala ?? house.rooms[0];
  if (room) return rectCenter(room.rect);
  return { x: Math.floor(house.larguraTiles / 2), y: Math.floor(house.alturaTiles / 2) };
}
