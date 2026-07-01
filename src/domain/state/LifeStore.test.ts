import { describe, it, expect, vi } from 'vitest';
import { LifeStore } from './LifeStore.ts';
import { createInitialLifeState } from './LifeState.ts';

describe('LifeStore', () => {
  it('notifica os assinantes quando o estado muda', () => {
    const store = new LifeStore(createInitialLifeState(new Date(2026, 0, 1)));
    const listener = vi.fn();
    store.subscribe(listener);

    store.update((s) => ({ ...s, updatedAt: '2026-07-01T00:00:00.000Z' }));

    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getState().updatedAt).toBe('2026-07-01T00:00:00.000Z');
  });

  it('não notifica quando o updater devolve o mesmo estado', () => {
    const store = new LifeStore(createInitialLifeState(new Date(2026, 0, 1)));
    const listener = vi.fn();
    store.subscribe(listener);

    store.update((s) => s);

    expect(listener).not.toHaveBeenCalled();
  });

  it('para de notificar após cancelar a inscrição', () => {
    const store = new LifeStore(createInitialLifeState(new Date(2026, 0, 1)));
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    unsubscribe();
    store.update((s) => ({ ...s, updatedAt: '2026-07-01T00:00:00.000Z' }));

    expect(listener).not.toHaveBeenCalled();
  });
});
