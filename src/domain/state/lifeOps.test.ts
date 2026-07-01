import { describe, it, expect } from 'vitest';
import { createInitialLifeState, normalizeLifeState, type LifeState } from './LifeState.ts';
import { getActiveHouse, addHouse, setActiveHouse, removeHouse, renameHouse, setCharacter } from './lifeOps.ts';
import { createEmptyHouse } from '@domain/house/model.ts';
import { createDefaultCharacter } from '@domain/character/model.ts';
import { templateHouse } from '@domain/house/template.ts';

describe('lifeOps', () => {
  it('addHouse anexa e torna a casa ativa', () => {
    const s0 = createInitialLifeState(new Date(2026, 0, 1));
    const s1 = addHouse(s0, createEmptyHouse('A'));
    const s2 = addHouse(s1, createEmptyHouse('B'));
    expect(s2.houses).toHaveLength(2);
    expect(getActiveHouse(s2)?.nome).toBe('B');
  });

  it('setActiveHouse e removeHouse ajustam a casa ativa', () => {
    let s = addHouse(createInitialLifeState(new Date(2026, 0, 1)), createEmptyHouse('A'));
    const a = s.activeHouseId!;
    s = addHouse(s, createEmptyHouse('B'));
    s = setActiveHouse(s, a);
    expect(getActiveHouse(s)?.nome).toBe('A');
    s = removeHouse(s, a);
    expect(s.houses).toHaveLength(1);
    expect(getActiveHouse(s)?.nome).toBe('B'); // ativa reatribuída
  });

  it('renameHouse e setCharacter atualizam o estado', () => {
    let s = addHouse(createInitialLifeState(new Date(2026, 0, 1)), createEmptyHouse('A'));
    const id = s.activeHouseId!;
    s = renameHouse(s, id, 'Casa Nova');
    expect(getActiveHouse(s)?.nome).toBe('Casa Nova');
    s = setCharacter(s, { ...createDefaultCharacter(), nome: 'Emerson' });
    expect(s.character?.nome).toBe('Emerson');
  });
});

describe('normalizeLifeState — migração', () => {
  it('migra um estado v2 (house única) para houses[] com casa ativa', () => {
    const legacy = {
      version: 2,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      character: null,
      houses: [],
      activeHouseId: null,
      house: templateHouse(),
    } as unknown as LifeState;

    const migrated = normalizeLifeState(legacy);
    expect(migrated.version).toBe(3);
    expect(migrated.houses).toHaveLength(1);
    expect(migrated.activeHouseId).toBe(migrated.houses[0]?.id);
  });
});
