import { type TileRect } from '@domain/house/types.ts';
import { type HouseModel } from '@domain/house/model.ts';

export const WALL = 0;
export const FLOOR = 1;

/**
 * Converte a casa numa grade de colisão. Cada cômodo tem o anel externo como PAREDE e o
 * INTERIOR (inset de 1 tile) como CHÃO. Portas abrem o tile da parede para CHÃO, conectando
 * cômodos que compartilham uma parede. Janelas permanecem parede (sólidas).
 */
export function buildGrid(house: HouseModel): number[][] {
  const grid: number[][] = Array.from({ length: house.alturaTiles }, () =>
    new Array<number>(house.larguraTiles).fill(WALL),
  );

  const carveFloor = (x: number, y: number): void => {
    const row = grid[y];
    if (row && x >= 0 && x < house.larguraTiles) row[x] = FLOOR;
  };

  for (const room of house.rooms) {
    const r = room.rect;
    for (let y = r.y + 1; y < r.y + r.h - 1; y++) {
      for (let x = r.x + 1; x < r.x + r.w - 1; x++) carveFloor(x, y);
    }
  }
  for (const item of house.wallItems) {
    if (item.kind === 'door') carveFloor(item.x, item.y);
  }

  return grid;
}

/**
 * Junta paredes contíguas de cada linha em poucos retângulos horizontais — reduz muito o
 * número de corpos físicos estáticos comparado a criar um por tile.
 */
export function mergeWalls(grid: number[][]): TileRect[] {
  const rects: TileRect[] = [];
  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    if (!row) continue;
    let x = 0;
    while (x < row.length) {
      if ((row[x] ?? WALL) === WALL) {
        const start = x;
        while (x < row.length && (row[x] ?? WALL) === WALL) x++;
        rects.push({ x: start, y, w: x - start, h: 1 });
      } else {
        x++;
      }
    }
  }
  return rects;
}
