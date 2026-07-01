import { GameClock } from '@domain/clock/GameClock.ts';
import { LifeStore } from '@domain/state/LifeStore.ts';
import { createInitialLifeState, normalizeLifeState } from '@domain/state/LifeState.ts';
import { setCharacter, addHouse } from '@domain/state/lifeOps.ts';
import { createEmptyHouse } from '@domain/house/model.ts';
import { LifeStateRepository } from '@data/LifeStateRepository.ts';
import { createGame } from '@game/createGame.ts';
import { SaveIndicator } from '@ui/SaveIndicator.ts';
import { ModeBar } from '@ui/ModeBar.ts';
import { HouseBuilder } from '@ui/builder/HouseBuilder.ts';
import { MainMenu } from '@ui/screens/MainMenu.ts';
import { CharacterCreator } from '@ui/screens/CharacterCreator.ts';
import { HousesScreen } from '@ui/screens/HousesScreen.ts';
import { SaveLoop } from './SaveLoop.ts';

type Screen = 'menu' | 'character' | 'houses' | 'build' | 'play';

/**
 * Composição do LifeOS (camada `app`). Além de conectar domínio → dados → apresentação →
 * save loop, controla o FLUXO do jogo (docs/fluxo-do-jogo.md):
 *   menu → personagem → casas → construir/jogar.
 */
async function bootstrap(): Promise<void> {
  const gameRoot = document.getElementById('game-root');
  const uiRoot = document.getElementById('ui-root');
  if (!gameRoot || !uiRoot) throw new Error('Elementos raiz (#game-root / #ui-root) não encontrados.');

  const clock = new GameClock();
  const store = new LifeStore(createInitialLifeState(clock.now()));

  const repo = new LifeStateRepository();
  try {
    const saved = await repo.load();
    if (saved) store.replace(normalizeLifeState(saved));
  } catch (err) {
    console.warn('[LifeOS] Não foi possível carregar o estado salvo; iniciando do zero.', err);
  }

  // Apresentação — Phaser (mundo) + telas HTML leem o MESMO domínio.
  const game = createGame(gameRoot, clock, store);
  new SaveIndicator(store, uiRoot);
  const builder = new HouseBuilder(store, uiRoot);

  const menu = new MainMenu(store, uiRoot, {
    onNew: () => show('character'),
    onContinue: () => show(store.getState().houses.length > 0 ? 'play' : 'houses'),
  });
  const character = new CharacterCreator(uiRoot, (c) => {
    store.update((s) => setCharacter(s, c));
    if (store.getState().houses.length === 0) {
      store.update((s) => addHouse(s, createEmptyHouse('Minha casa')));
      show('build');
    } else {
      show('houses');
    }
  });
  const houses = new HousesScreen(store, uiRoot, {
    onBuild: () => show('build'),
    onPlay: () => show('play'),
    onMenu: () => show('menu'),
  });
  const modeBar = new ModeBar(uiRoot, {
    onBuild: () => show('build'),
    onPlay: () => show('play'),
    onHouses: () => show('houses'),
  });

  function show(screen: Screen): void {
    menu.setVisible(screen === 'menu');
    character.setVisible(screen === 'character', null);
    houses.setVisible(screen === 'houses');
    builder.setVisible(screen === 'build');
    modeBar.setVisible(screen === 'build' || screen === 'play');
    if (screen === 'build' || screen === 'play') modeBar.setActive(screen === 'build' ? 'build' : 'play');

    const kb = game.input.keyboard;
    if (kb) kb.enabled = screen === 'play';
    if (screen === 'play') game.scene.getScene('house')?.scene.restart();
  }

  const saveLoop = new SaveLoop(store, repo);
  saveLoop.start();
  store.update((s) => ({ ...s, updatedAt: clock.now().toISOString() }));

  show('menu');
}

bootstrap().catch((err) => {
  console.error('[LifeOS] Falha ao iniciar:', err);
});
