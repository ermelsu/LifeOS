/**
 * Personagem do jogador — parte do MODELO DE DOMÍNIO (persistido no LifeState). Existe apenas
 * UM personagem por save (decisão de fluxo do Emerson). A aparência é, por enquanto, um
 * placeholder por cores; sprites reais entram depois (arte original).
 */

export type AnimalPreference = 'gato' | 'cachorro';

export interface Character {
  nome: string;
  coisaFavorita: string;
  preferenciaAnimal: AnimalPreference;
  corPele: string;
  corCabelo: string;
  corCamisa: string;
  corCalca: string;
}

/** Paletas cicláveis na criação do personagem (setas ◀ ▶), como no anexo1. */
export const PALETTES = {
  pele: ['#f2c9a0', '#e8b58a', '#c68642', '#8d5524', '#5c3a21'],
  cabelo: ['#2b1b0e', '#5a3a1a', '#8a5a2b', '#c98a3a', '#d94f4f', '#3a5cff', '#9a9a9a'],
  camisa: ['#3a6ea5', '#c0453a', '#3aa05a', '#c9a83a', '#7a3aa0', '#e0e0e0'],
  calca: ['#33405c', '#5a3a2b', '#2b2b2b', '#3a5c3a', '#6b3f6b'],
} as const;

export function createDefaultCharacter(): Character {
  return {
    nome: '',
    coisaFavorita: '',
    preferenciaAnimal: 'cachorro',
    corPele: PALETTES.pele[0],
    corCabelo: PALETTES.cabelo[0],
    corCamisa: PALETTES.camisa[0],
    corCalca: PALETTES.calca[0],
  };
}
