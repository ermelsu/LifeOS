import { type LifeStore } from '@domain/state/LifeStore.ts';

/** Menu inicial. "Continuar" só aparece quando já existe um personagem salvo. */
export class MainMenu {
  private readonly el: HTMLDivElement;

  constructor(
    private readonly store: LifeStore,
    parent: HTMLElement,
    private readonly handlers: { onNew: () => void; onContinue: () => void },
  ) {
    this.el = document.createElement('div');
    this.el.className = 'screen menu-screen';
    parent.appendChild(this.el);
  }

  setVisible(visible: boolean): void {
    this.el.style.display = visible ? 'flex' : 'none';
    if (visible) this.render();
  }

  private render(): void {
    const hasSave = this.store.getState().character !== null;
    this.el.innerHTML = `
      <div class="menu-card">
        <h1 class="menu-title">LifeOS</h1>
        <p class="menu-sub">Sua vida, espelhada.</p>
        ${hasSave ? '<button id="m-continue" class="primary">Continuar</button>' : ''}
        <button id="m-new" class="${hasSave ? '' : 'primary'}">Novo jogo</button>
      </div>`;
    this.el.querySelector('#m-continue')?.addEventListener('click', () => this.handlers.onContinue());
    this.el.querySelector('#m-new')?.addEventListener('click', () => {
      if (!hasSave || confirm('Começar um novo jogo? O personagem atual será substituído.')) this.handlers.onNew();
    });
  }
}
