import { describe, it, expect } from 'vitest';
import { buildGrid, mergeWalls, FLOOR, WALL } from './buildGrid.ts';
import { templateHouse } from '@domain/house/template.ts';
import { spawnTile } from '@domain/house/model.ts';

describe('buildGrid', () => {
  const house = templateHouse();
  const grid = buildGrid(house);

  it('o tile do spawn é chão e o canto é parede', () => {
    const s = spawnTile(house);
    expect(grid[s.y]?.[s.x]).toBe(FLOOR);
    expect(grid[0]?.[0]).toBe(WALL);
  });

  it('cômodos encostados ficam conectados por chão contíguo (Sala↔Cozinha)', () => {
    // Sala termina em y=14 e Cozinha começa em y=15 na mesma coluna → chão nos dois lados.
    expect(grid[14]?.[33]).toBe(FLOOR);
    expect(grid[15]?.[33]).toBe(FLOOR);
  });

  it('mergeWalls cobre a linha inteira quando não há cômodos nela', () => {
    const rects = mergeWalls(buildGrid({ larguraTiles: 6, alturaTiles: 2, rooms: [] }));
    expect(rects).toContainEqual({ x: 0, y: 0, w: 6, h: 1 });
  });
});
