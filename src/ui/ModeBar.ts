export type AppMode = 'build' | 'play';

export interface ModeBarHandlers {
  onBuild: () => void;
  onPlay: () => void;
  onHouses: () => void;
}

/**
 * Barra superior mostrada dentro de uma casa: alterna Construir/Jogar e volta para a lista de
 * casas. Overlay HTML discreto ("a casa é a interface").
 */
export class ModeBar {
  private readonly el: HTMLDivElement;
  private readonly buildBtn: HTMLButtonElement;
  private readonly playBtn: HTMLButtonElement;

  constructor(parent: HTMLElement, handlers: ModeBarHandlers) {
    this.el = document.createElement('div');
    this.el.className = 'mode-bar panel';

    this.buildBtn = this.makeButton('🔨 Construir', handlers.onBuild);
    this.playBtn = this.makeButton('🎮 Jogar', handlers.onPlay);
    const housesBtn = this.makeButton('🏠 Casas', handlers.onHouses);

    this.el.append(this.buildBtn, this.playBtn, housesBtn);
    parent.appendChild(this.el);
  }

  private makeButton(label: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.className = 'mode-btn';
    btn.addEventListener('click', onClick);
    return btn;
  }

  setVisible(visible: boolean): void {
    this.el.style.display = visible ? 'flex' : 'none';
  }

  setActive(mode: AppMode): void {
    this.buildBtn.classList.toggle('active', mode === 'build');
    this.playBtn.classList.toggle('active', mode === 'play');
  }
}
