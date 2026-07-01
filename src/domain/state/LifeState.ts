import { type HouseModel } from '@domain/house/model.ts';
import { templateHouse } from '@domain/house/template.ts';

/**
 * LifeState — a raiz do MODELO DE DOMÍNIO (a fonte da verdade sobre a vida do usuário).
 *
 * O estado da vida vive num domínio independente do Phaser, testável isolado e persistido no
 * IndexedDB. Phaser e os painéis HTML apenas LEEM daqui e reagem.
 *
 * A partir da v2, o estado carrega a PLANTA DA CASA (`house`) que o Emerson constrói no
 * construtor — ela deixou de ser fixa no código.
 */

/** Versão do formato do estado — permite migrações da persistência. */
export const LIFE_STATE_VERSION = 2;

export interface LifeState {
  version: number;
  createdAt: string;
  updatedAt: string;
  /** A casa construída pelo usuário (Módulo: construtor de casa). */
  house: HouseModel;
}

/** Cria um estado inicial já com a casa de exemplo (o usuário pode editar ou limpar). */
export function createInitialLifeState(now: Date = new Date()): LifeState {
  const iso = now.toISOString();
  return {
    version: LIFE_STATE_VERSION,
    createdAt: iso,
    updatedAt: iso,
    house: templateHouse(),
  };
}

/**
 * Normaliza um estado carregado do disco: preenche campos ausentes de versões antigas
 * (migração leve). Estados v1 não tinham `house` — recebem a casa de exemplo.
 */
export function normalizeLifeState(state: LifeState): LifeState {
  const house = state.house && Array.isArray(state.house.rooms) ? state.house : templateHouse();
  return { ...state, version: LIFE_STATE_VERSION, house };
}
