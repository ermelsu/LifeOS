import { type LifeState } from './LifeState.ts';
import { type HouseModel } from '@domain/house/model.ts';
import { type Character } from '@domain/character/model.ts';

/** Operações puras sobre o LifeState (personagem + coleção de casas). */

export function getActiveHouse(state: LifeState): HouseModel | null {
  return state.houses.find((h) => h.id === state.activeHouseId) ?? null;
}

export function setCharacter(state: LifeState, character: Character): LifeState {
  return { ...state, character };
}

/** Adiciona uma casa e a torna ativa. */
export function addHouse(state: LifeState, house: HouseModel): LifeState {
  return { ...state, houses: [...state.houses, house], activeHouseId: house.id };
}

export function setActiveHouse(state: LifeState, id: string): LifeState {
  return state.houses.some((h) => h.id === id) ? { ...state, activeHouseId: id } : state;
}

/** Substitui a casa ativa por uma nova versão (usado pelo construtor). */
export function replaceActiveHouse(state: LifeState, house: HouseModel): LifeState {
  return { ...state, houses: state.houses.map((h) => (h.id === house.id ? house : h)) };
}

export function renameHouse(state: LifeState, id: string, nome: string): LifeState {
  return { ...state, houses: state.houses.map((h) => (h.id === id ? { ...h, nome } : h)) };
}

export function removeHouse(state: LifeState, id: string): LifeState {
  const houses = state.houses.filter((h) => h.id !== id);
  const activeHouseId = state.activeHouseId === id ? (houses[0]?.id ?? null) : state.activeHouseId;
  return { ...state, houses, activeHouseId };
}
