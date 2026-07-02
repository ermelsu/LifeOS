/**
 * Personagem do jogador — parte do MODELO DE DOMÍNIO (persistido no LifeState). Existe apenas
 * UM personagem por save. Sem customização de cores: o jogador escolhe um dos personagens
 * prontos do pack Modern Interiors (LimeZu).
 */

/** Personagens disponíveis no pack (versão free). */
export const CHARACTERS = ['adam', 'alex', 'amelia', 'bob'] as const;
export type CharacterSprite = (typeof CHARACTERS)[number];

export const CHARACTER_LABEL: Record<CharacterSprite, string> = {
  adam: 'Adam',
  alex: 'Alex',
  amelia: 'Amelia',
  bob: 'Bob',
};

export interface Character {
  nome: string;
  sprite: CharacterSprite;
}

export function createDefaultCharacter(): Character {
  return { nome: '', sprite: 'adam' };
}
