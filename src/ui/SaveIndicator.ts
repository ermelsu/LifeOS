import { type LifeStore } from '@domain/state/LifeStore.ts';

/**
 * SaveIndicator — um overlay HTML mínimo que reage ao domínio (seção 6): mostra
 * discretamente "salvo HH:MM:SS" sempre que o `updatedAt` do estado muda.
 *
 * Serve também como a primeira prova viva de que os painéis HTML leem do MESMO domínio
 * que o Phaser. Painéis ricos (inventário, finanças, tarefas) seguem este padrão.
 */
export class SaveIndicator {
  private readonly el: HTMLDivElement;
  private lastUpdatedAt: string | null = null;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly store: LifeStore, parent: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'save-indicator';
    parent.appendChild(this.el);
    this.store.subscribe((state) => this.render(state.updatedAt));
    this.render(this.store.getState().updatedAt);
  }

  private render(updatedAt: string): void {
    if (updatedAt === this.lastUpdatedAt) return;
    this.lastUpdatedAt = updatedAt;

    const time = new Date(updatedAt).toLocaleTimeString('pt-BR');
    this.el.textContent = `salvo ${time}`;
    this.el.classList.add('visible');

    if (this.hideTimer !== null) clearTimeout(this.hideTimer);
    this.hideTimer = setTimeout(() => this.el.classList.remove('visible'), 1500);
  }
}
