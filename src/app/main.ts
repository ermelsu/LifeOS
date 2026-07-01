import { GameClock } from '@domain/clock/GameClock.ts';
import { LifeStore } from '@domain/state/LifeStore.ts';
import { createInitialLifeState } from '@domain/state/LifeState.ts';
import { LifeStateRepository } from '@data/LifeStateRepository.ts';
import { createGame } from '@game/createGame.ts';
import { SaveIndicator } from '@ui/SaveIndicator.ts';
import { SaveLoop } from './SaveLoop.ts';

/**
 * Ponto de composição do LifeOS (camada `app`, seção 6).
 *
 * Responsável por instanciar cada camada e conectá-las na ordem certa:
 *   domínio (relógio + store) → dados (carrega estado salvo) → apresentação (Phaser + UI)
 *   → save loop (salvamento automático).
 *
 * É o único lugar que conhece todas as camadas ao mesmo tempo.
 */
async function bootstrap(): Promise<void> {
  const gameRoot = document.getElementById('game-root');
  const uiRoot = document.getElementById('ui-root');
  if (!gameRoot || !uiRoot) throw new Error('Elementos raiz (#game-root / #ui-root) não encontrados.');

  // --- Domínio: a fonte da verdade ---
  const clock = new GameClock();
  const store = new LifeStore(createInitialLifeState(clock.now()));

  // --- Dados: carrega o estado salvo, se houver (local-first) ---
  const repo = new LifeStateRepository();
  try {
    const saved = await repo.load();
    if (saved) store.replace(saved);
  } catch (err) {
    // Primeira execução, modo privado sem IndexedDB, etc.: seguimos com estado inicial.
    console.warn('[LifeOS] Não foi possível carregar o estado salvo; iniciando do zero.', err);
  }

  // --- Apresentação: Phaser (mundo) + overlays HTML (dados) leem do MESMO domínio ---
  createGame(gameRoot, clock);
  new SaveIndicator(store, uiRoot);

  // --- Save loop: salvamento automático desde o Módulo 0 ---
  const saveLoop = new SaveLoop(store, repo);
  saveLoop.start();

  // Marca o estado como "tocado" na inicialização para gravar o registro inicial
  // no IndexedDB (prova de que a persistência funciona ponta a ponta).
  store.update((s) => ({ ...s, updatedAt: clock.now().toISOString() }));
}

bootstrap().catch((err) => {
  console.error('[LifeOS] Falha ao iniciar:', err);
});
