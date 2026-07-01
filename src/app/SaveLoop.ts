import { type LifeStore } from '@domain/state/LifeStore.ts';
import { type LifeStateRepository } from '@data/LifeStateRepository.ts';

export interface SaveLoopOptions {
  /** Intervalo máximo entre salvamentos, em ms (rede de segurança periódica). */
  intervalMs?: number;
  /** Atraso do debounce após uma mudança, em ms. */
  debounceMs?: number;
}

/**
 * SaveLoop — "Salvar cedo, salvar sempre" (seção 12).
 *
 * Persiste o LifeState no IndexedDB automaticamente:
 *  - com debounce logo após qualquer mudança do estado;
 *  - periodicamente, como rede de segurança;
 *  - ao sair da página / quando a aba fica oculta (para não perder a última mudança).
 *
 * A cada save, carimba `updatedAt` no estado via o próprio LifeStore, mantendo o domínio
 * como fonte da verdade.
 */
export class SaveLoop {
  private readonly store: LifeStore;
  private readonly repo: LifeStateRepository;
  private readonly intervalMs: number;
  private readonly debounceMs: number;

  private intervalId: ReturnType<typeof setInterval> | null = null;
  private debounceId: ReturnType<typeof setTimeout> | null = null;
  private unsubscribe: (() => void) | null = null;
  private dirty = false;
  private saving = false;

  private readonly flushBound = () => {
    void this.flush();
  };

  constructor(store: LifeStore, repo: LifeStateRepository, options: SaveLoopOptions = {}) {
    this.store = store;
    this.repo = repo;
    this.intervalMs = options.intervalMs ?? 30_000;
    this.debounceMs = options.debounceMs ?? 1_000;
  }

  /** Começa a ouvir mudanças e a salvar automaticamente. */
  start(): void {
    this.unsubscribe = this.store.subscribe(() => {
      this.dirty = true;
      this.scheduleDebounced();
    });

    this.intervalId = setInterval(() => {
      if (this.dirty) void this.flush();
    }, this.intervalMs);

    if (typeof window !== 'undefined') {
      window.addEventListener('pagehide', this.flushBound);
      window.addEventListener('beforeunload', this.flushBound);
      document.addEventListener('visibilitychange', this.onVisibilityChange);
    }
  }

  /** Para o loop e faz um último salvamento se houver mudança pendente. */
  async stop(): Promise<void> {
    this.unsubscribe?.();
    this.unsubscribe = null;
    if (this.intervalId !== null) clearInterval(this.intervalId);
    if (this.debounceId !== null) clearTimeout(this.debounceId);
    this.intervalId = null;
    this.debounceId = null;

    if (typeof window !== 'undefined') {
      window.removeEventListener('pagehide', this.flushBound);
      window.removeEventListener('beforeunload', this.flushBound);
      document.removeEventListener('visibilitychange', this.onVisibilityChange);
    }

    await this.flush();
  }

  /** Salva agora, se houver algo pendente. */
  async flush(): Promise<void> {
    if (!this.dirty || this.saving) return;
    this.saving = true;
    this.dirty = false;
    try {
      const stamped = { ...this.store.getState(), updatedAt: new Date().toISOString() };
      await this.repo.save(stamped);
    } catch (err) {
      // Falhou: remarca como sujo para tentar de novo no próximo ciclo.
      this.dirty = true;
      console.error('[LifeOS] Falha ao salvar o estado:', err);
    } finally {
      this.saving = false;
    }
  }

  private scheduleDebounced(): void {
    if (this.debounceId !== null) clearTimeout(this.debounceId);
    this.debounceId = setTimeout(() => {
      this.debounceId = null;
      void this.flush();
    }, this.debounceMs);
  }

  private readonly onVisibilityChange = (): void => {
    if (document.visibilityState === 'hidden') void this.flush();
  };
}
