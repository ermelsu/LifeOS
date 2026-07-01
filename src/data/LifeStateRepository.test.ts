import { describe, it, expect, beforeEach } from 'vitest';
import { LifeStateRepository } from './LifeStateRepository.ts';
import { createInitialLifeState } from '@domain/state/LifeState.ts';

describe('LifeStateRepository (IndexedDB via fake-indexeddb)', () => {
  const repo = new LifeStateRepository();

  beforeEach(async () => {
    await repo.clear();
  });

  it('devolve null na primeira execução', async () => {
    expect(await repo.load()).toBeNull();
  });

  it('salva e recarrega o mesmo estado (round-trip)', async () => {
    const state = createInitialLifeState(new Date(2026, 0, 1));
    await repo.save(state);

    const loaded = await repo.load();
    expect(loaded).toEqual(state);
  });

  it('faz upsert: o segundo save substitui o primeiro', async () => {
    await repo.save(createInitialLifeState(new Date(2026, 0, 1)));
    const updated = { ...createInitialLifeState(new Date(2026, 0, 1)), updatedAt: '2026-07-01T12:00:00.000Z' };
    await repo.save(updated);

    expect((await repo.load())?.updatedAt).toBe('2026-07-01T12:00:00.000Z');
  });
});
