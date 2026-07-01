/**
 * Tipos base da planta — MODELO DE DOMÍNIO (seção 6). Dados puros em coordenadas de TILE, sem
 * dependência de Phaser. As entidades editáveis (BuiltRoom, HouseModel) ficam em `model.ts`.
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

/** True se o tile (x,y) está dentro do retângulo. */
export function rectContains(rect: TileRect, x: number, y: number): boolean {
  return x >= rect.x && x < rect.x + rect.w && y >= rect.y && y < rect.y + rect.h;
}
