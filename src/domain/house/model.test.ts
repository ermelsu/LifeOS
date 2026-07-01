import { describe, it, expect } from 'vitest';
import { addRoom, updateRoom, removeRoom, roomAtTile, spawnTile, createEmptyHouse } from './model.ts';
import { templateHouse } from './template.ts';

describe('HouseModel — operações', () => {
  it('adiciona um cômodo com id e nome padrão', () => {
    const h = addRoom(createEmptyHouse(), { x: 1, y: 1, w: 3, h: 2 });
    expect(h.rooms).toHaveLength(1);
    expect(h.rooms[0]?.id).toBeTruthy();
    expect(h.rooms[0]?.nome).toBe('Cômodo 1');
  });

  it('atualiza e remove cômodos de forma imutável', () => {
    const original = addRoom(createEmptyHouse(), { x: 0, y: 0, w: 2, h: 2 }, { nome: 'A' });
    const id = original.rooms[0]!.id;
    const renamed = updateRoom(original, id, { nome: 'B' });
    expect(original.rooms[0]?.nome).toBe('A'); // original intacto
    expect(renamed.rooms[0]?.nome).toBe('B');
    expect(removeRoom(renamed, id).rooms).toHaveLength(0);
  });

  it('roomAtTile respeita a ordem (último desenhado vence)', () => {
    let h = addRoom(createEmptyHouse(), { x: 0, y: 0, w: 5, h: 5 }, { nome: 'Base' });
    h = addRoom(h, { x: 1, y: 1, w: 2, h: 2 }, { nome: 'Sub' });
    expect(roomAtTile(h, 1, 1)?.nome).toBe('Sub');
    expect(roomAtTile(h, 4, 4)?.nome).toBe('Base');
    expect(roomAtTile(h, 9, 9)).toBeNull();
  });
});

describe('templateHouse', () => {
  const h = templateHouse();

  it('tem os cômodos reais e a Sala', () => {
    const nomes = h.rooms.map((r) => r.nome);
    expect(nomes).toContain('Sala');
    expect(nomes).toContain('Cozinha');
    expect(nomes).toContain('Cachorros — Grade');
  });

  it('o spawn cai dentro da Sala', () => {
    const sala = h.rooms.find((r) => r.nome === 'Sala')!;
    const s = spawnTile(h);
    expect(s.x).toBeGreaterThanOrEqual(sala.rect.x);
    expect(s.x).toBeLessThan(sala.rect.x + sala.rect.w);
    expect(s.y).toBeGreaterThanOrEqual(sala.rect.y);
    expect(s.y).toBeLessThan(sala.rect.y + sala.rect.h);
  });
});
