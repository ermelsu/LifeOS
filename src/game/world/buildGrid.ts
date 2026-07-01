import { type HouseLayout, type TileRect } from '@domain/house/types.ts';

export const WALL = 0;
export const FLOOR = 1;

/**
 * Converte a planta (cômodos + portas) numa grade de colisão: tudo começa como PAREDE,
 * o piso de cada cômodo vira CHÃO, e o tile de cada porta é aberto para CHÃO (a barreira
 * da porta fechada é um corpo físico separado, controlado pela cena).
 */
export function buildGrid(layout: HouseLayout): number[][] {
  const grid: number[][] = Array.from({ length: layout.alturaTiles }, () =>
    new Array<number>(layout.larguraTiles).fill(WALL),
  );

  const carve = (rect: TileRect): void => {
    for (let y = rect.y; y < rect.y + rect.h; y++) {
      const row = grid[y];
      if (!row) continue;
      for (let x = rect.x; x < rect.x + rect.w; x++) {
        if (x >= 0 && x < layout.larguraTiles) row[x] = FLOOR;
      }
    }
  };

  for (const room of layout.rooms) carve(room.floor);
  for (const door of layout.doors) {
    const row = grid[door.tile.y];
    if (row && door.tile.x >= 0 && door.tile.x < layout.larguraTiles) row[door.tile.x] = FLOOR;
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
