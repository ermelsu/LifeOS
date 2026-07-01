import { describe, it, expect } from 'vitest';
import { houseLayout, roomAt } from './houseLayout.ts';
import { rectContains } from './types.ts';
import { buildGrid, FLOOR, WALL } from '@game/world/buildGrid.ts';

describe('houseLayout', () => {
  it('a Sala é a entrada/hub e contém o spawn', () => {
    const sala = houseLayout.rooms.find((r) => r.id === 'sala');
    expect(sala).toBeDefined();
    expect(rectContains(sala!.floor, houseLayout.spawn.x, houseLayout.spawn.y)).toBe(true);
  });

  it('toda porta liga dois cômodos existentes', () => {
    const ids = new Set(houseLayout.rooms.map((r) => r.id));
    for (const door of houseLayout.doors) {
      expect(ids.has(door.entre[0])).toBe(true);
      expect(ids.has(door.entre[1])).toBe(true);
    }
  });

  it('roomAt identifica o cômodo pelo tile', () => {
    expect(roomAt(houseLayout, houseLayout.spawn.x, houseLayout.spawn.y)?.id).toBe('sala');
    expect(roomAt(houseLayout, 0, 0)).toBeNull();
  });
});

describe('buildGrid', () => {
  const grid = buildGrid(houseLayout);

  it('o tile do spawn é chão e a borda é parede', () => {
    expect(grid[houseLayout.spawn.y]?.[houseLayout.spawn.x]).toBe(FLOOR);
    expect(grid[0]?.[0]).toBe(WALL);
  });

  it('cada porta abre um vão de chão na parede', () => {
    for (const door of houseLayout.doors) {
      expect(grid[door.tile.y]?.[door.tile.x]).toBe(FLOOR);
    }
  });
});
