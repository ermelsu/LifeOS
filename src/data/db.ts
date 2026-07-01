import Dexie, { type Table } from 'dexie';
import { type LifeState } from '@domain/state/LifeState.ts';

/**
 * Persistência local-first (seção 6, decisão travada nº 8): IndexedDB via Dexie.
 * Funciona offline, sem backend, e permite publicar como site estático no GitHub Pages.
 *
 * No Módulo 0 guardamos o LifeState inteiro num único registro (singleton) na store
 * `lifeState`. Conforme os módulos crescerem, entidades com muitos registros
 * (InventoryItem, Task, FinanceEntry, DogCareLog...) ganham suas próprias tabelas
 * indexadas — por isso já usamos o Dexie desde agora.
 */

/** Chave fixa do registro singleton do estado. */
export const LIFE_STATE_KEY = 'singleton';

interface LifeStateRecord {
  key: string;
  state: LifeState;
}

export class LifeOSDatabase extends Dexie {
  lifeState!: Table<LifeStateRecord, string>;

  constructor() {
    super('lifeos');
    this.version(1).stores({
      // Só a chave é indexada; o estado é um blob por enquanto.
      lifeState: 'key',
    });
  }
}

export const db = new LifeOSDatabase();
