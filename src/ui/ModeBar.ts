export type AppMode = 'build' | 'play';

/**
 * Barra superior para alternar entre os modos Construir (desenhar a casa) e Jogar (caminhar
 * pela casa construída). É um overlay HTML — a "casa é a interface", menus são discretos.
 */
export class ModeBar {
  private readonly buildBtn: HTMLButtonElement;
  private readonly playBtn: HTMLButtonElement;

  constructor(parent: HTMLElement, onMode: (mode: AppMode) => void) {
    const bar = document.createElement('div');
    bar.className = 'mode-bar panel';

    this.buildBtn = this.makeButton('🔨 Construir', () => onMode('build'));
    this.playBtn = this.makeButton('🎮 Jogar', () => onMode('play'));

    bar.append(this.buildBtn, this.playBtn);
    parent.appendChild(bar);
  }

  private makeButton(label: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.className = 'mode-btn';
    btn.addEventListener('click', onClick);
    return btn;
  }

  setActive(mode: AppMode): void {
    this.buildBtn.classList.toggle('active', mode === 'build');
    this.playBtn.classList.toggle('active', mode === 'play');
  }
}
