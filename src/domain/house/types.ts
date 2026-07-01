/**
 * Tipos da planta da casa — MODELO DE DOMÍNIO (seção 6). Dados puros em coordenadas de TILE,
 * sem dependência de Phaser. A conversão para pixels acontece na apresentação.
 */

/** Áreas da vida representadas pelos cômodos (seção 8). */
export type LifeArea =
  | 'conforto'
  | 'alimentacao'
  | 'descanso'
  | 'higiene'
  | 'roupas'
  | 'trabalho'
  | 'caes'
  | 'circulacao';

/** Tipo de piso (define a textura ladrilhada — inspirado na referência estética). */
export type FloorType = 'wood' | 'brick' | 'carpet' | 'tile' | 'grass' | 'parquet' | 'deck';

export interface Tile {
  x: number;
  y: number;
}

/** Retângulo em coordenadas de tile (canto superior esquerdo + tamanho). */
export interface TileRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Marcador de atividades pendentes dentro de um cômodo (placeholder até o Módulo 3). */
export interface RoomActivity {
  tile: Tile;
  labels: string[];
}

/** Sub-região visual dentro de um cômodo (ex.: o Banheiro suíte dentro do Quarto). */
export interface RoomSubarea {
  nome: string;
  rect: TileRect;
  floorType: FloorType;
}

export interface Room {
  id: string;
  nome: string;
  lifeArea: LifeArea;
  /** Área de piso caminhável (interior do cômodo), em tiles. */
  floor: TileRect;
  floorType: FloorType;
  subareas?: RoomSubarea[];
  activity?: RoomActivity;
}

export type DoorOrientation = 'h' | 'v';

/** Porta: um vão de 1 tile na parede entre dois cômodos, que o personagem abre. */
export interface Door {
  id: string;
  entre: [string, string];
  tile: Tile;
  orientacao: DoorOrientation;
}

export interface HouseLayout {
  larguraTiles: number;
  alturaTiles: number;
  tileSize: number;
  /** Onde o personagem nasce (a Sala é a entrada da casa). */
  spawn: Tile;
  rooms: Room[];
  doors: Door[];
}

/** True se o tile (x,y) está dentro do retângulo. */
export function rectContains(rect: TileRect, x: number, y: number): boolean {
  return x >= rect.x && x < rect.x + rect.w && y >= rect.y && y < rect.y + rect.h;
}
