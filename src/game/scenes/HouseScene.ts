import Phaser from 'phaser';
import { type GameClock, type DayPhase } from '@domain/clock/GameClock.ts';
import { type LifeStore } from '@domain/state/LifeStore.ts';
import { getActiveHouse } from '@domain/state/lifeOps.ts';
import { type FloorType } from '@domain/house/types.ts';
import { type HouseModel, roomAtTile, spawnTile } from '@domain/house/model.ts';
import { buildGrid, mergeWalls, FLOOR } from '@game/world/buildGrid.ts';
import { createTileTextures, floorKey } from '@game/world/textures.ts';
import { Player } from '@game/entities/Player.ts';

/** Tom/opacidade do overlay de luz por fase do dia (iluminação em tempo real, seção 5). */
const PHASE_LIGHT: Record<DayPhase, { color: number; alpha: number }> = {
  madrugada: { color: 0x0a1430, alpha: 0.5 },
  amanhecer: { color: 0xff8a3c, alpha: 0.18 },
  dia: { color: 0x000000, alpha: 0.0 },
  tarde: { color: 0xffb15c, alpha: 0.1 },
  anoitecer: { color: 0x6a2b55, alpha: 0.28 },
  noite: { color: 0x0a1430, alpha: 0.46 },
};

/**
 * HouseScene — o mundo caminhável. Lê a casa CONSTRUÍDA pelo usuário (do LifeStore) e a
 * renderiza no clima da referência (`docs/referencias/estetica.md`). Ao entrar no modo Jogar,
 * a cena é reiniciada e relê o estado, então mudanças feitas no construtor aparecem na hora.
 */
export class HouseScene extends Phaser.Scene {
  private readonly clock: GameClock;
  private readonly store: LifeStore;

  private player: Player | null = null;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: { w: Phaser.Input.Keyboard.Key; a: Phaser.Input.Keyboard.Key; s: Phaser.Input.Keyboard.Key; d: Phaser.Input.Keyboard.Key };

  private wallRects: Phaser.GameObjects.Rectangle[] = [];
  private lightOverlay!: Phaser.GameObjects.Rectangle;
  private lastPhase: DayPhase | null = null;

  private hudText!: Phaser.GameObjects.Text;
  private roomText!: Phaser.GameObjects.Text;
  private house: HouseModel = { id: '', nome: '', larguraTiles: 48, alturaTiles: 34, rooms: [] };

  private readonly tile = 32;

  constructor(clock: GameClock, store: LifeStore) {
    super('house');
    this.clock = clock;
    this.store = store;
  }

  /** Piso do pack por tipo (frame no room_builder 16×16, 17 colunas). grass fica procedural. */
  private static readonly PACK_FLOOR: Partial<Record<FloorType, { key: string; frame: number }>> = {
    wood: { key: 'pk-wood', frame: 250 },
    parquet: { key: 'pk-parquet', frame: 250 },
    brick: { key: 'pk-brick', frame: 114 },
    carpet: { key: 'pk-carpet', frame: 148 },
    tile: { key: 'pk-tile', frame: 182 },
    deck: { key: 'pk-deck', frame: 216 },
  };
  private static readonly WALL_FRAME = 239;

  preload(): void {
    const base = import.meta.env.BASE_URL;
    const mi = `${base}assets/moderninteriors`;
    this.load.spritesheet('adam-idle', `${mi}/characters/adam_idle.png`, { frameWidth: 16, frameHeight: 32 });
    this.load.spritesheet('adam-walk', `${mi}/characters/adam_run.png`, { frameWidth: 16, frameHeight: 32 });
    this.load.spritesheet('rooms', `${mi}/tiles/room_builder.png`, { frameWidth: 16, frameHeight: 16 });
  }

  create(): void {
    createTileTextures(this);
    this.ensureAnims();
    this.bakePackTiles();
    this.house = getActiveHouse(this.store.getState()) ?? { id: '', nome: '', larguraTiles: 48, alturaTiles: 34, rooms: [] };

    const ts = this.tile;
    const worldW = this.house.larguraTiles * ts;
    const worldH = this.house.alturaTiles * ts;

    this.cameras.main.setBackgroundColor('#060608');
    this.buildHud();

    if (this.house.rooms.length === 0) {
      this.add
        .text(this.scale.width / 2, this.scale.height / 2, 'Sua casa está vazia.\nAbra o modo 🔨 Construir e desenhe seus cômodos.', {
          fontFamily: 'monospace', fontSize: '18px', color: '#f4f1e8', align: 'center',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(2000);
      return;
    }

    this.physics.world.setBounds(0, 0, worldW, worldH);
    this.cameras.main.setBounds(0, 0, worldW, worldH);

    this.buildFloors();
    this.buildWalls();

    const spawn = spawnTile(this.house);
    this.player = new Player(this, (spawn.x + 0.5) * ts, (spawn.y + 0.5) * ts);
    this.physics.add.collider(this.player.collider, this.wallRects);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);

    this.buildGlows();

    this.lightOverlay = this.add.rectangle(0, 0, worldW, worldH, 0x000000, 0).setOrigin(0, 0).setDepth(900);

    this.buildInput();
    this.applyPhase();
  }

  /**
   * Cria as animações do personagem (globais ao jogo; criadas uma vez). Layout decodificado
   * das folhas 16×32 do Modern Interiors: 6 frames por direção, na ordem
   * esquerda(0–5) · cima(6–11) · direita(12–17) · baixo(18–23).
   */
  private ensureAnims(): void {
    const dirs: [string, number][] = [['left', 0], ['up', 6], ['right', 12], ['down', 18]];
    for (const [dir, start] of dirs) {
      if (!this.anims.exists(`walk-${dir}`)) {
        this.anims.create({
          key: `walk-${dir}`,
          frames: this.anims.generateFrameNumbers('adam-walk', { start, end: start + 5 }),
          frameRate: 10,
          repeat: -1,
        });
      }
      if (!this.anims.exists(`idle-${dir}`)) {
        this.anims.create({
          key: `idle-${dir}`,
          frames: this.anims.generateFrameNumbers('adam-idle', { start, end: start + 5 }),
          frameRate: 5,
          repeat: -1,
        });
      }
    }
  }

  /** Extrai um tile 16×16 do room_builder numa textura própria (evita bleed do TileSprite). */
  private makeTile(key: string, srcKey: string, frameIndex: number): void {
    if (this.textures.exists(key)) return;
    const size = 16;
    const cols = 17;
    const canvas = this.textures.createCanvas(key, size, size);
    if (!canvas) return;
    const src = this.textures.get(srcKey).getSourceImage() as CanvasImageSource;
    const sx = (frameIndex % cols) * size;
    const sy = Math.floor(frameIndex / cols) * size;
    canvas.context.drawImage(src, sx, sy, size, size, 0, 0, size, size);
    canvas.refresh();
  }

  private bakePackTiles(): void {
    for (const v of Object.values(HouseScene.PACK_FLOOR)) if (v) this.makeTile(v.key, 'rooms', v.frame);
    this.makeTile('pk-wall', 'rooms', HouseScene.WALL_FRAME);
  }

  private buildFloors(): void {
    const ts = this.tile;
    for (const room of this.house.rooms) {
      const r = room.rect;
      const pack = HouseScene.PACK_FLOOR[room.floorType];
      const floor = pack
        ? this.add.tileSprite((r.x + r.w / 2) * ts, (r.y + r.h / 2) * ts, r.w * ts, r.h * ts, pack.key)
        : this.add.tileSprite((r.x + r.w / 2) * ts, (r.y + r.h / 2) * ts, r.w * ts, r.h * ts, floorKey(room.floorType));
      // Tiles do pack são 16px; escala 2× para casar com o mundo (32px) e com o personagem.
      if (pack) {
        floor.tileScaleX = 2;
        floor.tileScaleY = 2;
      }
      floor.setDepth(0);
      this.add
        .text((r.x + r.w / 2) * ts, r.y * ts + 12, room.nome, {
          fontFamily: 'monospace', fontSize: '13px', color: '#fff4e0', stroke: '#000000', strokeThickness: 3,
        })
        .setOrigin(0.5, 0)
        .setDepth(4)
        .setAlpha(0.85);
    }
  }

  private buildWalls(): void {
    const ts = this.tile;
    const grid = buildGrid(this.house);

    // Paredes VISÍVEIS: só os tiles de parede que encostam em algum piso — contorna cada
    // cômodo/corredor e deixa aberto onde dois cômodos se encostam.
    const isFloor = (x: number, y: number): boolean => (grid[y]?.[x] ?? 0) === FLOOR;
    for (let y = 0; y < grid.length; y++) {
      const row = grid[y];
      if (!row) continue;
      for (let x = 0; x < row.length; x++) {
        if ((row[x] ?? 0) === FLOOR) continue;
        if (isFloor(x - 1, y) || isFloor(x + 1, y) || isFloor(x, y - 1) || isFloor(x, y + 1)) {
          this.add.image((x + 0.5) * ts, (y + 0.5) * ts, 'pk-wall').setDisplaySize(ts, ts).setDepth(3);
        }
      }
    }

    const rects: Phaser.GameObjects.Rectangle[] = [];
    for (const w of mergeWalls(grid)) {
      const r = this.add.rectangle((w.x + w.w / 2) * ts, (w.y + 0.5) * ts, w.w * ts, ts).setVisible(false);
      this.physics.add.existing(r, true);
      rects.push(r);
    }
    this.wallRects = rects;
  }

  private buildGlows(): void {
    const ts = this.tile;
    for (const room of this.house.rooms) {
      if (room.lifeArea === 'caes') continue; // áreas externas não recebem luz interna
      const r = room.rect;
      const glow = this.add
        .image((r.x + r.w / 2) * ts, (r.y + r.h / 2) * ts, 'glow')
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(950)
        .setScale(Math.max(r.w, r.h) / 5)
        .setAlpha(0.2);
      this.tweens.add({ targets: glow, alpha: 0.3, yoyo: true, repeat: -1, duration: 2200, ease: 'Sine.inOut' });
    }
  }

  private buildHud(): void {
    const style = { fontFamily: 'monospace', fontSize: '14px', color: '#f4f1e8' } as const;
    this.hudText = this.add.text(10, 8, '', style).setScrollFactor(0).setDepth(2000);
    this.roomText = this.add.text(10, 28, '', { ...style, color: '#c9a86a' }).setScrollFactor(0).setDepth(2000);
    this.add
      .text(10, this.scale.height - 22, 'Mover: WASD / setas', { ...style, fontSize: '12px', color: '#9aa0a6' })
      .setScrollFactor(0)
      .setDepth(2000);
  }

  private buildInput(): void {
    const kb = this.input.keyboard;
    if (!kb) throw new Error('Teclado indisponível.');
    this.cursors = kb.createCursorKeys();
    this.keys = {
      w: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
  }

  override update(): void {
    if (this.player) {
      let dx = 0;
      let dy = 0;
      if (this.cursors.left.isDown || this.keys.a.isDown) dx -= 1;
      if (this.cursors.right.isDown || this.keys.d.isDown) dx += 1;
      if (this.cursors.up.isDown || this.keys.w.isDown) dy -= 1;
      if (this.cursors.down.isDown || this.keys.s.isDown) dy += 1;
      this.player.move(dx, dy);

      const ts = this.tile;
      const room = roomAtTile(this.house, Math.floor(this.player.x / ts), Math.floor(this.player.y / ts));
      this.roomText.setText(room ? `📍 ${room.nome}` : '📍 —');
    }
    this.applyPhase();
  }

  private applyPhase(): void {
    const phase = this.clock.phaseOfDay();
    if (phase === this.lastPhase) return;
    this.lastPhase = phase;

    if (this.lightOverlay) {
      const light = PHASE_LIGHT[phase];
      this.lightOverlay.setFillStyle(light.color, light.alpha);
    }
    const time = this.clock.now().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    this.hudText.setText(`🕐 ${time} · ${phase}`);
  }
}
