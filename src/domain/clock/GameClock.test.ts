import { describe, it, expect } from 'vitest';
import { GameClock } from './GameClock.ts';

const at = (h: number, m = 0) => new GameClock(() => new Date(2026, 0, 1, h, m));

describe('GameClock', () => {
  it('deriva a fase do dia a partir da hora real', () => {
    expect(at(3).phaseOfDay()).toBe('madrugada');
    expect(at(6).phaseOfDay()).toBe('amanhecer');
    expect(at(10).phaseOfDay()).toBe('dia');
    expect(at(15).phaseOfDay()).toBe('tarde');
    expect(at(18).phaseOfDay()).toBe('anoitecer');
    expect(at(22).phaseOfDay()).toBe('noite');
  });

  it('conta os minutos desde a meia-noite', () => {
    expect(at(0, 0).minutesSinceMidnight()).toBe(0);
    expect(at(1, 30).minutesSinceMidnight()).toBe(90);
    expect(at(23, 59).minutesSinceMidnight()).toBe(1439);
  });
});
