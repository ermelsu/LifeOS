import { describe, it, expect } from 'vitest';
import { buildGrid, mergeWalls, FLOOR, WALL } from './buildGrid.ts';
import { templateHouse } from '@domain/house/template.ts';
import { addRoom, addWallItem, createEmptyHouse } from '@domain/house/model.ts';

describe('buildGrid — cômodos com parede + porta', () => {
  it('interior é chão e a borda do cômodo é parede', () => {
    // Cômodo 6×6 em (0,0): interior (1..4), borda (0 e 5).
    const h = addRoom(createEmptyHouse('T'), { x: 0, y: 0, w: 6, h: 6 }, {});
    const grid = buildGrid(h);
    expect(grid[3]?.[3]).toBe(FLOOR); // interior
    expect(grid[0]?.[0]).toBe(WALL); // canto
    expect(grid[0]?.[3]).toBe(WALL); // borda superior
  });

  it('uma porta abre o tile de parede (vira chão passável)', () => {
    let h = addRoom(createEmptyHouse('T'), { x: 0, y: 0, w: 6, h: 6 }, {});
    h = addWallItem(h, 'door', 3, 0); // porta na parede de cima
    const grid = buildGrid(h);
    expect(grid[0]?.[3]).toBe(FLOOR);
  });

  it('janela NÃO abre a parede (continua sólida)', () => {
    let h = addRoom(createEmptyHouse('T'), { x: 0, y: 0, w: 6, h: 6 }, {});
    h = addWallItem(h, 'window', 3, 0);
    const grid = buildGrid(h);
    expect(grid[0]?.[3]).toBe(WALL);
  });

  it('template: interior da Sala é chão e há paredes ao redor', () => {
    const grid = buildGrid(templateHouse());
    expect(grid[10]?.[30]).toBe(FLOOR); // centro da Sala (interior)
    expect(grid[4]?.[22]).toBe(WALL); // canto da Sala
    expect(grid[5]?.[22]).toBe(FLOOR); // porta Corredor↔Sala
  });

  it('mergeWalls cobre a linha inteira quando não há cômodos nela', () => {
    const rects = mergeWalls(buildGrid({ id: 't', nome: 'T', larguraTiles: 6, alturaTiles: 2, rooms: [], furniture: [], wallItems: [] }));
    expect(rects).toContainEqual({ x: 0, y: 0, w: 6, h: 1 });
  });
});
