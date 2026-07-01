import Phaser from 'phaser';
import { type GameClock, type DayPhase } from '@domain/clock/GameClock.ts';

/** Cor de fundo aproximada por fase do dia — a curva real de iluminação vem no Módulo 1. */
const PHASE_COLOR: Record<DayPhase, number> = {
  madrugada: 0x0b1026,
  amanhecer: 0x3a2f4d,
  dia: 0x1d2b3a,
  tarde: 0x243447,
  anoitecer: 0x2b2035,
  noite: 0x0d1220,
};

/**
 * BootScene — a fundação visual do Módulo 0.
 *
 * Ainda NÃO é o mundo caminhável (isso é o Módulo 1). Aqui só provamos que a camada de
 * apresentação (Phaser) lê do domínio (GameClock) e reage: o fundo acompanha a fase do dia
 * real. Mantém-se deliberadamente "em branco" conforme o critério do Módulo 0.
 */
export class BootScene extends Phaser.Scene {
  private readonly clock: GameClock;
  private phaseText!: Phaser.GameObjects.Text;
  private lastPhase: DayPhase | null = null;

  constructor(clock: GameClock) {
    super('boot');
    this.clock = clock;
  }

  create(): void {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height / 2 - 24, 'LifeOS', {
        fontFamily: 'monospace',
        fontSize: '48px',
        color: '#f4f1e8',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 24, 'Módulo 0 — Fundação', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#9aa0a6',
      })
      .setOrigin(0.5);

    this.phaseText = this.add
      .text(width / 2, height - 32, '', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#c9a86a',
      })
      .setOrigin(0.5);

    this.applyPhase();
  }

  override update(): void {
    // O relógio é real: reavaliamos a fase a cada frame, mas só repintamos quando muda.
    this.applyPhase();
  }

  private applyPhase(): void {
    const phase = this.clock.phaseOfDay();
    if (phase === this.lastPhase) return;
    this.lastPhase = phase;

    this.cameras.main.setBackgroundColor(PHASE_COLOR[phase]);
    const time = this.clock.now().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    this.phaseText.setText(`${time} · ${phase}`);
  }
}
