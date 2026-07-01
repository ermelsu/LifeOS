import { db, LIFE_STATE_KEY } from './db.ts';
import { type LifeState } from '@domain/state/LifeState.ts';

/**
 * Repositório do LifeState — isola o domínio dos detalhes do IndexedDB/Dexie.
 * O save loop (camada app) usa `save()`; a inicialização usa `load()`.
 */
export class LifeStateRepository {
  /** Carrega o estado salvo, ou `null` se for a primeira execução. */
  async load(): Promise<LifeState | null> {
    const record = await db.lifeState.get(LIFE_STATE_KEY);
    return record?.state ?? null;
  }

  /** Salva (upsert) o estado atual. */
  async save(state: LifeState): Promise<void> {
    await db.lifeState.put({ key: LIFE_STATE_KEY, state });
  }

  /** Apaga o estado salvo (útil para "recomeçar" e para testes). */
  async clear(): Promise<void> {
    await db.lifeState.delete(LIFE_STATE_KEY);
  }
}
