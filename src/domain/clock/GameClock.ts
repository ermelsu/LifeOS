/**
 * GameClock — o relógio do mundo, sincronizado ao relógio real (seção 3: "Tempo real"
 * e decisão de design "A casa amanhece, anoitece e usa luz artificial conforme a hora
 * de verdade").
 *
 * Pertence ao domínio: não depende de Phaser nem do DOM. A camada de apresentação
 * apenas lê `now()` / `phaseOfDay()` para renderizar a iluminação.
 */

export type DayPhase = 'madrugada' | 'amanhecer' | 'dia' | 'tarde' | 'anoitecer' | 'noite';

/** Permite injetar o relógio (útil para testes determinísticos). */
export type NowProvider = () => Date;

export class GameClock {
  private readonly nowProvider: NowProvider;

  constructor(nowProvider: NowProvider = () => new Date()) {
    this.nowProvider = nowProvider;
  }

  /** Instante real atual. */
  now(): Date {
    return this.nowProvider();
  }

  /** Minutos desde a meia-noite (0–1439). Base para a iluminação. */
  minutesSinceMidnight(date: Date = this.now()): number {
    return date.getHours() * 60 + date.getMinutes();
  }

  /**
   * Fase do dia derivada da hora real. As faixas são um ponto de partida razoável;
   * o Módulo 1 refina a curva de iluminação a partir daqui.
   */
  phaseOfDay(date: Date = this.now()): DayPhase {
    const h = date.getHours();
    if (h < 5) return 'madrugada';
    if (h < 7) return 'amanhecer';
    if (h < 12) return 'dia';
    if (h < 17) return 'tarde';
    if (h < 19) return 'anoitecer';
    return 'noite';
  }
}
