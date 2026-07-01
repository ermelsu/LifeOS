import { type LifeState, createInitialLifeState } from './LifeState.ts';

/** Assinante notificado a cada mudança do estado. */
export type LifeStoreListener = (state: LifeState) => void;

/** Função que produz o próximo estado a partir do atual (atualização imutável). */
export type LifeStateUpdater = (current: LifeState) => LifeState;

/**
 * LifeStore — o ponto único de acesso ao LifeState no domínio.
 *
 * Toda ação do usuário (concluir tarefa, registrar compra) passa por aqui via `update()`.
 * A apresentação (Phaser + painéis HTML) e o save loop se inscrevem via `subscribe()` e
 * apenas reagem — nunca guardam estado de vida por conta própria (seção 6/12).
 */
export class LifeStore {
  private state: LifeState;
  private readonly listeners = new Set<LifeStoreListener>();

  constructor(initial: LifeState = createInitialLifeState()) {
    this.state = initial;
  }

  /** Estado atual (somente leitura por convenção — nunca mutar o objeto retornado). */
  getState(): Readonly<LifeState> {
    return this.state;
  }

  /** Aplica uma atualização imutável e notifica os assinantes. */
  update(updater: LifeStateUpdater): void {
    const next = updater(this.state);
    if (next === this.state) return;
    this.state = next;
    this.emit();
  }

  /** Substitui o estado inteiro (usado ao carregar do IndexedDB na inicialização). */
  replace(next: LifeState): void {
    this.state = next;
    this.emit();
  }

  /** Inscreve um listener; retorna a função para cancelar a inscrição. */
  subscribe(listener: LifeStoreListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    for (const listener of this.listeners) listener(this.state);
  }
}
