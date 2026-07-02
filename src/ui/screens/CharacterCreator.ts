import { type Character, type CharacterSprite, CHARACTERS, CHARACTER_LABEL, createDefaultCharacter } from '@domain/character/model.ts';

const CHARS_URL = `${import.meta.env.BASE_URL}assets/moderninteriors/characters`;

/**
 * Tela de personagem — sem customização: o jogador escolhe um dos personagens prontos do pack
 * Modern Interiors e dá um nome. A prévia mostra cada personagem virado para a frente.
 */
export class CharacterCreator {
  private readonly el: HTMLDivElement;
  private draft: Character = createDefaultCharacter();

  constructor(parent: HTMLElement, private readonly onDone: (c: Character) => void) {
    this.el = document.createElement('div');
    this.el.className = 'screen char-screen';
    parent.appendChild(this.el);
  }

  setVisible(visible: boolean, base?: Character | null): void {
    this.el.style.display = visible ? 'flex' : 'none';
    if (visible) {
      this.draft = base ? { ...base } : createDefaultCharacter();
      this.render();
    }
  }

  private render(): void {
    const cards = CHARACTERS.map((c) => {
      const active = this.draft.sprite === c ? ' active' : '';
      // Frame 18 (virado para baixo) da folha de idle (24 frames de 16×32).
      const preview =
        `<svg width="72" height="144" viewBox="288 0 16 32">` +
        `<image href="${CHARS_URL}/${c}_idle.png" width="384" height="32" preserveAspectRatio="none" style="image-rendering:pixelated"/></svg>`;
      return `<button class="char-card-btn${active}" data-char="${c}">${preview}<span>${CHARACTER_LABEL[c]}</span></button>`;
    }).join('');

    this.el.innerHTML = `
      <div class="char-card">
        <h1>Escolha seu personagem</h1>
        <div class="char-grid">${cards}</div>
        <label class="char-name">Nome <input id="c-nome" type="text" maxlength="20" value="${esc(this.draft.nome)}" placeholder="Seu nome" /></label>
        <button id="c-ok" class="primary">OK — jogar como ${CHARACTER_LABEL[this.draft.sprite]}</button>
      </div>`;

    this.bind();
  }

  private bind(): void {
    this.el.querySelectorAll<HTMLButtonElement>('[data-char]').forEach((b) =>
      b.addEventListener('click', () => {
        this.draft = { ...this.draft, sprite: b.dataset.char as CharacterSprite };
        this.render();
      }),
    );
    this.el.querySelector<HTMLInputElement>('#c-nome')?.addEventListener('input', (e) => {
      this.draft = { ...this.draft, nome: (e.target as HTMLInputElement).value };
    });
    this.el.querySelector('#c-ok')?.addEventListener('click', () => {
      const nome = this.draft.nome.trim() || CHARACTER_LABEL[this.draft.sprite];
      this.onDone({ ...this.draft, nome });
    });
  }
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch] ?? ch);
}
