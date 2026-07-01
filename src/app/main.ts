import { GameClock } from '@domain/clock/GameClock.ts';
import { LifeStore } from '@domain/state/LifeStore.ts';
import { createInitialLifeState, normalizeLifeState } from '@domain/state/LifeState.ts';
import { LifeStateRepository } from '@data/LifeStateRepository.ts';
import { createGame } from '@game/createGame.ts';
import { SaveIndicator } from '@ui/SaveIndicator.ts';
import { ModeBar, type AppMode } from '@ui/ModeBar.ts';
import { HouseBuilder } from '@ui/builder/HouseBuilder.ts';
import { SaveLoop } from './SaveLoop.ts';

/**
 * Ponto de composição do LifeOS (camada `app`, seção 6). Instancia cada camada e as conecta:
 *   domínio (relógio + store) → dados (carrega/migra estado) → apresentação (Phaser + construtor)
 *   → save loop. Também controla os modos Construir/Jogar.
 */
async function bootstrap(): Promise<void> {
  const gameRoot = document.getElementById('game-root');
  const uiRoot = document.getElementById('ui-root');
  if (!gameRoot || !uiRoot) throw new Error('Elementos raiz (#game-root / #ui-root) não encontrados.');

  // --- Domínio ---
  const clock = new GameClock();
  const store = new LifeStore(createInitialLifeState(clock.now()));

  // --- Dados: carrega e migra o estado salvo (local-first) ---
  const repo = new LifeStateRepository();
  try {
    const saved = await repo.load();
    if (saved) store.replace(normalizeLifeState(saved));
  } catch (err) {
    console.warn('[LifeOS] Não foi possível carregar o estado salvo; iniciando do zero.', err);
  }

  // --- Apresentação: Phaser (mundo) + construtor (HTML) leem o MESMO domínio ---
  const game = createGame(gameRoot, clock, store);
  new SaveIndicator(store, uiRoot);
  const builder = new HouseBuilder(store, uiRoot);
  const modeBar = new ModeBar(uiRoot, (mode) => setMode(mode));

  // --- Modos ---
  function setMode(mode: AppMode): void {
    builder.setVisible(mode === 'build');
    modeBar.setActive(mode);
    const kb = game.input.keyboard;
    if (kb) kb.enabled = mode === 'play'; // no modo Construir o teclado é para digitar
    if (mode === 'play') {
      // Relê a casa construída ao entrar no jogo.
      game.scene.getScene('house')?.scene.restart();
    }
  }

  // --- Save loop ---
  const saveLoop = new SaveLoop(store, repo);
  saveLoop.start();

  // Grava o estado inicial no IndexedDB (prova a persistência ponta a ponta).
  store.update((s) => ({ ...s, updatedAt: clock.now().toISOString() }));

  setMode('build');
}

bootstrap().catch((err) => {
  console.error('[LifeOS] Falha ao iniciar:', err);
});
