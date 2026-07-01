import Phaser from 'phaser';
import { type GameClock, type DayPhase } from '@domain/clock/GameClock.ts';
import { type Door } from '@domain/house/types.ts';
import { houseLayout, roomAt } from '@domain/house/houseLayout.ts';
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

/** Cômodos internos que recebem uma luz quente (as áreas externas não). */
const GLOW_ROOMS = new Set(['sala', 'corredor', 'escritorio', 'quarto', 'cozinha']);

interface DoorEntry {
  door: Door;
  rect: Phaser.GameObjects.Rectangle;
  cx: number;
  cy: number;
  open: boolean;
}

interface ActivityEntry {
  labels: string[];
  cx: number;
  cy: number;
}

/**
 * HouseScene — o mundo caminhável, agora com visual no clima da referência
 * (`docs/referencias/estetica.md`): pisos ladrilhados por cômodo, paredes de madeira com
 * trilho alaranjado, portas e luzes quentes. Toda a fonte da verdade (planta) mora no
 * domínio; a cena só renderiza e reage. Arte ainda é placeholder original, trocável depois.
 */
export class HouseScene extends Phaser.Scene {
  private readonly clock: GameClock;

  private player!: Player;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: { w: Phaser.Input.Keyboard.Key; a: Phaser.Input.Keyboard.Key; s: Phaser.Input.Keyboard.Key; d: Phaser.Input.Keyboard.Key; e: Phaser.Input.Keyboard.Key; space: Phaser.Input.Keyboard.Key };

  private readonly doors: DoorEntry[] = [];
  private readonly activities: ActivityEntry[] = [];
  private wallRects: Phaser.GameObjects.Rectangle[] = [];

  private lightOverlay!: Phaser.GameObjects.Rectangle;
  private lastPhase: DayPhase | null = null;

  private hudText!: Phaser.GameObjects.Text;
  private roomText!: Phaser.GameObjects.Text;
  private promptText!: Phaser.GameObjects.Text;
  private toastText!: Phaser.GameObjects.Text;

  constructor(clock: GameClock) {
    super('house');
    this.clock = clock;
  }

  create(): void {
    createTileTextures(this);

    const layout = houseLayout;
    const ts = layout.tileSize;
    const worldW = layout.larguraTiles * ts;
    const worldH = layout.alturaTiles * ts;

    this.physics.world.setBounds(0, 0, worldW, worldH);
    this.cameras.main.setBounds(0, 0, worldW, worldH);
    this.cameras.main.setBackgroundColor('#060608');

    this.buildFloors();
    this.buildWalls();
    this.buildDoors();

    // --- Personagem + câmera ---
    const spawnX = (layout.spawn.x + 0.5) * ts;
    const spawnY = (layout.spawn.y + 0.5) * ts;
    this.player = new Player(this, spawnX, spawnY, ts * 0.7);
    this.physics.add.collider(this.player.gameObject, this.wallRects);
    this.physics.add.collider(this.player.gameObject, this.doors.map((d) => d.rect));
    this.cameras.main.startFollow(this.player.gameObject, true, 0.1, 0.1);

    this.buildGlows();

    // --- Iluminação global por hora do dia (cobre o mundo inteiro) ---
    this.lightOverlay = this.add.rectangle(0, 0, worldW, worldH, 0x000000, 0).setOrigin(0, 0).setDepth(900);

    this.buildHud();
    this.buildInput();
    this.applyPhase();
  }

  private buildFloors(): void {
    const ts = houseLayout.tileSize;
    for (const room of houseLayout.rooms) {
      const f = room.floor;
      this.add
        .tileSprite((f.x + f.w / 2) * ts, (f.y + f.h / 2) * ts, f.w * ts, f.h * ts, floorKey(room.floorType))
        .setDepth(0);

      for (const sub of room.subareas ?? []) {
        const r = sub.rect;
        this.add
          .tileSprite((r.x + r.w / 2) * ts, (r.y + r.h / 2) * ts, r.w * ts, r.h * ts, floorKey(sub.floorType))
          .setDepth(1);
        this.label((r.x + r.w / 2) * ts, (r.y + r.h / 2) * ts, sub.nome, 10, '#eef3f6', 1).setAlpha(0.75);
      }

      this.label((f.x + f.w / 2) * ts, f.y * ts + 14, room.nome, 13, '#fff4e0', 4);

      if (room.activity) {
        const ax = (room.activity.tile.x + 0.5) * ts;
        const ay = (room.activity.tile.y + 0.5) * ts;
        const marker = this.add.star(ax, ay, 5, ts * 0.16, ts * 0.34, 0xffe066).setDepth(6);
        this.tweens.add({ targets: marker, scale: 1.2, yoyo: true, repeat: -1, duration: 750, ease: 'Sine.inOut' });
        this.activities.push({ labels: room.activity.labels, cx: ax, cy: ay });
      }
    }
  }

  private buildWalls(): void {
    const ts = houseLayout.tileSize;
    const grid = buildGrid(houseLayout);

    // Paredes VISÍVEIS: só os tiles de parede que encostam em algum piso — isso desenha o
    // contorno de cada cômodo/corredor, deixando os vãos das portas abertos.
    const isFloor = (x: number, y: number): boolean => (grid[y]?.[x] ?? 0) === FLOOR;
    for (let y = 0; y < grid.length; y++) {
      const row = grid[y];
      if (!row) continue;
      for (let x = 0; x < row.length; x++) {
        if ((row[x] ?? 0) === FLOOR) continue;
        if (isFloor(x - 1, y) || isFloor(x + 1, y) || isFloor(x, y - 1) || isFloor(x, y + 1)) {
          this.add.image((x + 0.5) * ts, (y + 0.5) * ts, 'wall').setDepth(3);
        }
      }
    }

    // Colisão: paredes juntadas em retângulos invisíveis (todos os tiles de parede).
    const rects: Phaser.GameObjects.Rectangle[] = [];
    for (const w of mergeWalls(grid)) {
      const r = this.add.rectangle((w.x + w.w / 2) * ts, (w.y + 0.5) * ts, w.w * ts, ts).setVisible(false);
      this.physics.add.existing(r, true);
      rects.push(r);
    }
    this.wallRects = rects;
  }

  private buildDoors(): void {
    const ts = houseLayout.tileSize;
    for (const door of houseLayout.doors) {
      const cx = (door.tile.x + 0.5) * ts;
      const cy = (door.tile.y + 0.5) * ts;
      // Piso no vão da porta, para o buraco não mostrar o vazio.
      this.add.tileSprite(cx, cy, ts, ts, floorKey('wood')).setDepth(0);

      const w = door.orientacao === 'v' ? ts * 0.42 : ts;
      const h = door.orientacao === 'v' ? ts : ts * 0.42;
      const rect = this.add.rectangle(cx, cy, w, h, 0x7a4a24).setStrokeStyle(2, 0xc07a2e).setDepth(5);
      this.physics.add.existing(rect, true);
      this.doors.push({ door, rect, cx, cy, open: false });
    }
  }

  private buildGlows(): void {
    const ts = houseLayout.tileSize;
    for (const room of houseLayout.rooms) {
      if (!GLOW_ROOMS.has(room.id)) continue;
      const f = room.floor;
      const glow = this.add
        .image((f.x + f.w / 2) * ts, (f.y + f.h / 2) * ts, 'glow')
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(950)
        .setScale(Math.max(f.w, f.h) / 5)
        .setAlpha(0.2);
      this.tweens.add({ targets: glow, alpha: 0.3, yoyo: true, repeat: -1, duration: 2200, ease: 'Sine.inOut' });
    }
  }

  private label(x: number, y: number, text: string, size: number, color: string, depth: number): Phaser.GameObjects.Text {
    return this.add
      .text(x, y, text, { fontFamily: 'monospace', fontSize: `${size}px`, color, stroke: '#000000', strokeThickness: 3 })
      .setOrigin(0.5, 0)
      .setDepth(depth);
  }

  private buildHud(): void {
    const style = { fontFamily: 'monospace', fontSize: '14px', color: '#f4f1e8' } as const;
    this.hudText = this.add.text(10, 8, '', style).setScrollFactor(0).setDepth(2000);
    this.roomText = this.add.text(10, 28, '', { ...style, color: '#c9a86a' }).setScrollFactor(0).setDepth(2000);
    this.add
      .text(10, this.scale.height - 22, 'Mover: WASD / setas   ·   Interagir: E / Espaço', { ...style, fontSize: '12px', color: '#9aa0a6' })
      .setScrollFactor(0)
      .setDepth(2000);
    this.promptText = this.add
      .text(this.scale.width / 2, this.scale.height - 48, '', { ...style, color: '#ffe066' })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(2000);
    this.toastText = this.add
      .text(this.scale.width / 2, 60, '', { ...style, backgroundColor: '#000000cc', padding: { x: 10, y: 6 }, align: 'center' })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(2000)
      .setAlpha(0);
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
      e: kb.addKey(Phaser.Input.Keyboard.KeyCodes.E),
      space: kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
    };
  }

  override update(): void {
    this.handleMovement();
    this.handleInteraction();
    this.updateHud();
    this.applyPhase();
  }

  private handleMovement(): void {
    let dx = 0;
    let dy = 0;
    if (this.cursors.left.isDown || this.keys.a.isDown) dx -= 1;
    if (this.cursors.right.isDown || this.keys.d.isDown) dx += 1;
    if (this.cursors.up.isDown || this.keys.w.isDown) dy -= 1;
    if (this.cursors.down.isDown || this.keys.s.isDown) dy += 1;
    this.player.move(dx, dy);
  }

  private handleInteraction(): void {
    const range = houseLayout.tileSize * 1.6;
    const px = this.player.x;
    const py = this.player.y;

    let nearestDoor: DoorEntry | null = null;
    let nearestActivity: ActivityEntry | null = null;
    let best = range;

    for (const d of this.doors) {
      if (d.open) continue;
      const dist = Phaser.Math.Distance.Between(px, py, d.cx, d.cy);
      if (dist < best) {
        best = dist;
        nearestDoor = d;
        nearestActivity = null;
      }
    }
    for (const a of this.activities) {
      const dist = Phaser.Math.Distance.Between(px, py, a.cx, a.cy);
      if (dist < best) {
        best = dist;
        nearestActivity = a;
        nearestDoor = null;
      }
    }

    if (nearestDoor) this.promptText.setText('[E] abrir porta');
    else if (nearestActivity) this.promptText.setText('[E] ver atividades');
    else this.promptText.setText('');

    const interact =
      Phaser.Input.Keyboard.JustDown(this.keys.e) || Phaser.Input.Keyboard.JustDown(this.keys.space);
    if (!interact) return;

    if (nearestDoor) this.openDoor(nearestDoor);
    else if (nearestActivity) this.showToast('Atividades pendentes:\n• ' + nearestActivity.labels.join('\n• '));
  }

  private openDoor(entry: DoorEntry): void {
    entry.open = true;
    (entry.rect.body as Phaser.Physics.Arcade.StaticBody).enable = false;
    this.tweens.add({ targets: entry.rect, alpha: 0.12, duration: 200 });
  }

  private showToast(text: string): void {
    this.toastText.setText(text).setAlpha(1);
    this.time.delayedCall(2600, () => this.toastText.setAlpha(0));
  }

  private updateHud(): void {
    const ts = houseLayout.tileSize;
    const room = roomAt(houseLayout, Math.floor(this.player.x / ts), Math.floor(this.player.y / ts));
    this.roomText.setText(room ? `📍 ${room.nome}` : '📍 —');
  }

  private applyPhase(): void {
    const phase = this.clock.phaseOfDay();
    if (phase === this.lastPhase) return;
    this.lastPhase = phase;

    const light = PHASE_LIGHT[phase];
    this.lightOverlay.setFillStyle(light.color, light.alpha);

    const time = this.clock.now().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    this.hudText.setText(`🕐 ${time} · ${phase}`);
  }
}
