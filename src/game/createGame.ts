import Phaser from 'phaser';
import { type GameClock } from '@domain/clock/GameClock.ts';
import { type LifeStore } from '@domain/state/LifeStore.ts';
import { HouseScene } from './scenes/HouseScene.ts';

/**
 * Cria a instância do Phaser e a monta dentro de `parent`. Recebe o GameClock e o LifeStore do
 * domínio por injeção — a apresentação lê do domínio, nunca o contrário (seção 6).
 */
export function createGame(parent: HTMLElement, clock: GameClock, store: LifeStore): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 960,
    height: 540,
    pixelArt: true, // 2D pixel art, sem suavização (seção 5).
    backgroundColor: '#0d1220',
    physics: {
      default: 'arcade',
      arcade: { debug: false },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [new HouseScene(clock, store)],
  });
}
