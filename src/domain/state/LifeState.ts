/**
 * LifeState — a raiz do MODELO DE DOMÍNIO (a fonte da verdade sobre a vida do usuário).
 *
 * Princípio de arquitetura mais importante (seção 6): o estado da vida vive num domínio
 * independente do Phaser, testável isoladamente e persistido no IndexedDB. Phaser e os
 * painéis HTML apenas LEEM daqui e reagem.
 *
 * No Módulo 0 este estado é intencionalmente mínimo — só o suficiente para provar o loop
 * de salvamento automático. Cada módulo seguinte adiciona suas entidades (Room, GameObject,
 * Task, InventoryItem, Dog, ...) descritas na seção 7, sempre respeitando a Regra Nº 1:
 * tudo aqui corresponde a algo real da vida do usuário.
 */

/** Versão do formato do estado — permite migrações futuras da persistência. */
export const LIFE_STATE_VERSION = 1;

export interface LifeState {
  /** Versão do schema deste estado. */
  version: number;
  /** Quando o estado foi criado (ISO-8601). */
  createdAt: string;
  /** Última vez que o estado foi salvo (ISO-8601). Atualizado pelo save loop. */
  updatedAt: string;
}

/** Cria um estado inicial vazio — o ponto de partida de um LifeOS recém-instalado. */
export function createInitialLifeState(now: Date = new Date()): LifeState {
  const iso = now.toISOString();
  return {
    version: LIFE_STATE_VERSION,
    createdAt: iso,
    updatedAt: iso,
  };
}
