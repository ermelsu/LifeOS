import { type LifeStore } from '@domain/state/LifeStore.ts';
import { addHouse, removeHouse, renameHouse, setActiveHouse } from '@domain/state/lifeOps.ts';
import { createEmptyHouse } from '@domain/house/model.ts';
import { templateHouse } from '@domain/house/template.ts';

/**
 * Tela de casas: lista as casas do personagem e permite criar, escolher, renomear e excluir.
 * "1 personagem, N casas" (fluxo do Emerson). Daqui se entra no Construtor ou no Jogo.
 */
export class HousesScreen {
  private readonly el: HTMLDivElement;

  constructor(
    private readonly store: LifeStore,
    parent: HTMLElement,
    private readonly handlers: { onBuild: () => void; onPlay: () => void; onMenu: () => void },
  ) {
    this.el = document.createElement('div');
    this.el.className = 'screen houses-screen';
    parent.appendChild(this.el);
    this.store.subscribe(() => {
      if (this.el.style.display !== 'none') this.render();
    });
  }

  setVisible(visible: boolean): void {
    this.el.style.display = visible ? 'flex' : 'none';
    if (visible) this.render();
  }

  private render(): void {
    const houses = this.store.getState().houses;
    const list = houses.length
      ? houses
          .map(
            (h) => `
        <li class="house-row ${h.id === this.store.getState().activeHouseId ? 'active' : ''}">
          <span class="house-name">🏠 ${esc(h.nome)} <span class="dim">(${h.rooms.length} cômodos)</span></span>
          <span class="house-actions">
            <button data-build="${h.id}">Construir</button>
            <button data-play="${h.id}" class="primary">Jogar</button>
            <button data-rename="${h.id}">✎</button>
            <button data-del="${h.id}" class="danger">🗑</button>
          </span>
        </li>`,
          )
          .join('')
      : '<li class="dim">Nenhuma casa ainda. Crie a sua primeira:</li>';

    this.el.innerHTML = `
      <div class="houses-card">
        <div class="houses-head">
          <h1>Suas casas</h1>
          <button id="h-menu">← Menu</button>
        </div>
        <ul class="houses-list">${list}</ul>
        <div class="houses-new">
          <button id="h-new">➕ Casa vazia</button>
          <button id="h-example">🏠 Casa de exemplo</button>
        </div>
      </div>`;

    this.bind();
  }

  private bind(): void {
    const each = (attr: string, fn: (id: string) => void): void => {
      this.el.querySelectorAll<HTMLButtonElement>(`[data-${attr}]`).forEach((b) =>
        b.addEventListener('click', () => fn(b.dataset[attr]!)),
      );
    };

    each('build', (id) => {
      this.store.update((s) => setActiveHouse(s, id));
      this.handlers.onBuild();
    });
    each('play', (id) => {
      this.store.update((s) => setActiveHouse(s, id));
      this.handlers.onPlay();
    });
    each('rename', (id) => {
      const h = this.store.getState().houses.find((x) => x.id === id);
      const nome = prompt('Nome da casa:', h?.nome ?? '');
      if (nome && nome.trim()) this.store.update((s) => renameHouse(s, id, nome.trim()));
    });
    each('del', (id) => {
      const h = this.store.getState().houses.find((x) => x.id === id);
      if (confirm(`Excluir "${h?.nome}"?`)) this.store.update((s) => removeHouse(s, id));
    });

    this.el.querySelector('#h-menu')?.addEventListener('click', () => this.handlers.onMenu());

    this.el.querySelector('#h-new')?.addEventListener('click', () => {
      const nome = prompt('Nome da nova casa:', 'Minha casa');
      if (!nome || !nome.trim()) return;
      this.store.update((s) => addHouse(s, createEmptyHouse(nome.trim())));
      this.handlers.onBuild();
    });
    this.el.querySelector('#h-example')?.addEventListener('click', () => {
      this.store.update((s) => addHouse(s, templateHouse()));
      this.handlers.onBuild();
    });
  }
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);
}
