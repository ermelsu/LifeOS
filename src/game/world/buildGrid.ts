import { type TileRect } from '@domain/house/types.ts';
import { type HouseModel } from '@domain/house/model.ts';

export const WALL = 0;
export const FLOOR = 1;

/**
 * Converte a casa construída numa grade de colisão: tudo começa como PAREDE e o piso de cada
 * cômodo vira CHÃO. Como não há portas, cômodos encostados ficam conectados (chão contíguo);
 * paredes visíveis são os tiles de parede que encostam em chão (ver HouseScene).
 */
export function buildGrid(house: HouseModel): number[][] {
  const grid: number[][] = Array.from({ length: house.alturaTiles }, () =>
    new Array<number>(house.larguraTiles).fill(WALL),
  );

  for (const room of house.rooms) {
    const r = room.rect;
    for (let y = r.y; y < r.y + r.h; y++) {
      const row = grid[y];
      if (!row) continue;
      for (let x = r.x; x < r.x + r.w; x++) {
        if (x >= 0 && x < house.larguraTiles) row[x] = FLOOR;
      }
    }
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
