import { type HouseModel } from '@domain/house/model.ts';
import { type Character } from '@domain/character/model.ts';
import { templateHouse } from '@domain/house/template.ts';

/**
 * LifeState — a raiz do MODELO DE DOMÍNIO (a fonte da verdade sobre a vida do usuário).
 *
 * v3: o save tem UM personagem (`character`) e VÁRIAS casas (`houses`), com uma casa ativa
 * (`activeHouseId`) — conforme o fluxo do jogo (docs/fluxo-do-jogo.md).
 */

export const LIFE_STATE_VERSION = 3;

export interface LifeState {
  version: number;
  createdAt: string;
  updatedAt: string;
  /** Único personagem do save; null até ser criado na tela de personagem. */
  character: Character | null;
  /** Casas do personagem (pode haver mais de uma). */
  houses: HouseModel[];
  /** Casa atualmente aberta. */
  activeHouseId: string | null;
}

/** Estado inicial de um save novo (sem personagem e sem casas — o fluxo os cria). */
export function createInitialLifeState(now: Date = new Date()): LifeState {
  const iso = now.toISOString();
  return {
    version: LIFE_STATE_VERSION,
    createdAt: iso,
    updatedAt: iso,
    character: null,
    houses: [],
    activeHouseId: null,
  };
}

interface LegacyV2 {
  house?: HouseModel;
}

/**
 * Normaliza/migra um estado carregado do disco. Estados antigos:
 *  - v1: sem casa alguma;
 *  - v2: uma única `house` → vira `houses:[house]` com essa casa ativa.
 */
export function normalizeLifeState(state: LifeState): LifeState {
  const houses = Array.isArray(state.houses) ? state.houses : [];
  const legacyHouse = (state as LifeState & LegacyV2).house;
  if (houses.length === 0 && legacyHouse) {
    const migrated: HouseModel = legacyHouse.id ? legacyHouse : { ...templateHouse(), rooms: legacyHouse.rooms ?? [] };
    return {
      ...state,
      version: LIFE_STATE_VERSION,
      character: state.character ?? null,
      houses: [migrated],
      activeHouseId: migrated.id,
    };
  }
  const activeHouseId = houses.some((h) => h.id === state.activeHouseId)
    ? state.activeHouseId
    : (houses[0]?.id ?? null);
  return {
    ...state,
    version: LIFE_STATE_VERSION,
    character: state.character ?? null,
    houses,
    activeHouseId,
  };
}
