import { type Character, type AnimalPreference, PALETTES, createDefaultCharacter } from '@domain/character/model.ts';

/**
 * Tela de criação do personagem (estilo anexo1). Versão inicial: nome, coisa favorita,
 * preferência de animal e cores (pele/cabelo/camisa/calça) com prévia do avatar. Sprites reais
 * entram depois; hoje o avatar é um placeholder por cores (arte original).
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

  private cycle(part: keyof typeof PALETTES, dir: number): void {
    const palette = PALETTES[part] as readonly string[];
    const key = ({ pele: 'corPele', cabelo: 'corCabelo', camisa: 'corCamisa', calca: 'corCalca' } as const)[part];
    const cur = this.draft[key];
    const idx = Math.max(0, palette.indexOf(cur));
    const next = palette[(idx + dir + palette.length) % palette.length] ?? palette[0]!;
    const draft = { ...this.draft };
    draft[key] = next;
    this.draft = draft;
    this.render();
  }

  private render(): void {
    const c = this.draft;
    const partRow = (label: string, part: keyof typeof PALETTES, color: string): string => `
      <div class="char-part">
        <span>${label}</span>
        <button data-cycle="${part}" data-dir="-1">◀</button>
        <span class="swatch" style="background:${color}"></span>
        <button data-cycle="${part}" data-dir="1">▶</button>
      </div>`;

    this.el.innerHTML = `
      <div class="char-card">
        <h1>Criar personagem</h1>
        <div class="char-body">
          <div class="char-preview">${avatarSvg(c)}</div>
          <div class="char-fields">
            <label>Nome <input id="c-nome" type="text" maxlength="20" value="${esc(c.nome)}" placeholder="Seu nome" /></label>
            <label>Coisa favorita <input id="c-fav" type="text" maxlength="24" value="${esc(c.coisaFavorita)}" placeholder="Ex.: café" /></label>
            <div class="char-animal">
              <span>Prefere</span>
              <button data-animal="cachorro" class="${c.preferenciaAnimal === 'cachorro' ? 'active' : ''}">🐶 Cachorro</button>
              <button data-animal="gato" class="${c.preferenciaAnimal === 'gato' ? 'active' : ''}">🐱 Gato</button>
            </div>
            ${partRow('Pele', 'pele', c.corPele)}
            ${partRow('Cabelo', 'cabelo', c.corCabelo)}
            ${partRow('Camisa', 'camisa', c.corCamisa)}
            ${partRow('Calça', 'calca', c.corCalca)}
          </div>
        </div>
        <button id="c-ok" class="primary">OK — criar personagem</button>
      </div>`;

    this.bind();
  }

  private bind(): void {
    this.el.querySelector<HTMLInputElement>('#c-nome')?.addEventListener('input', (e) => {
      this.draft = { ...this.draft, nome: (e.target as HTMLInputElement).value };
    });
    this.el.querySelector<HTMLInputElement>('#c-fav')?.addEventListener('input', (e) => {
      this.draft = { ...this.draft, coisaFavorita: (e.target as HTMLInputElement).value };
    });
    this.el.querySelectorAll<HTMLButtonElement>('[data-animal]').forEach((b) =>
      b.addEventListener('click', () => {
        this.draft = { ...this.draft, preferenciaAnimal: b.dataset.animal as AnimalPreference };
        this.render();
      }),
    );
    this.el.querySelectorAll<HTMLButtonElement>('[data-cycle]').forEach((b) =>
      b.addEventListener('click', () => this.cycle(b.dataset.cycle as keyof typeof PALETTES, Number(b.dataset.dir))),
    );
    this.el.querySelector('#c-ok')?.addEventListener('click', () => {
      const nome = this.draft.nome.trim() || 'Personagem';
      this.onDone({ ...this.draft, nome });
    });
  }
}

function avatarSvg(c: Character): string {
  return `<svg viewBox="0 0 64 100" width="130" height="200" shape-rendering="crispEdges">
    <rect x="22" y="70" width="8" height="26" fill="${c.corCalca}"/>
    <rect x="34" y="70" width="8" height="26" fill="${c.corCalca}"/>
    <rect x="18" y="40" width="28" height="32" rx="3" fill="${c.corCamisa}"/>
    <rect x="12" y="42" width="7" height="22" rx="3" fill="${c.corPele}"/>
    <rect x="45" y="42" width="7" height="22" rx="3" fill="${c.corPele}"/>
    <circle cx="32" cy="26" r="15" fill="${c.corPele}"/>
    <path d="M17 26 a15 15 0 0 1 30 0 v-4 a15 12 0 0 0 -30 0 z" fill="${c.corCabelo}"/>
    <rect x="17" y="10" width="30" height="8" rx="4" fill="${c.corCabelo}"/>
    <circle cx="27" cy="26" r="2" fill="#222"/>
    <circle cx="37" cy="26" r="2" fill="#222"/>
  </svg>`;
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch] ?? ch);
}
