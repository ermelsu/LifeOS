/**
 * Tipos da planta da casa — parte do MODELO DE DOMÍNIO (seção 6). São dados puros, em
 * coordenadas de tile, sem qualquer dependência de Phaser. A camada `game/` lê daqui para
 * montar o mundo; os painéis HTML também poderão ler.
 *
 * Coordenadas: tudo em TILES (não pixels). A conversão para pixels acontece na apresentação
 * usando `HouseLayout.tileSize`.
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

/**
 * Marcador de atividades pendentes dentro de um cômodo. No Módulo 1 são apenas rótulos
 * placeholder; no Módulo 3 passam a ser `Task`s reais vinculadas a objetos (Regra Nº 1).
 */
export interface RoomActivity {
  tile: Tile;
  labels: string[];
}

/** Sub-região visual dentro de um cômodo (ex.: o Banheiro suíte dentro do Quarto). */
export interface RoomSubarea {
  nome: string;
  rect: TileRect;
  color: number;
}

export interface Room {
  id: string;
  nome: string;
  lifeArea: LifeArea;
  /** Área de piso caminhável (interior do cômodo), em tiles. */
  floor: TileRect;
  /** Cor placeholder do piso (substituída por tiles de arte depois). */
  color: number;
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
