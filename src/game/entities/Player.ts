import Phaser from 'phaser';

export type Facing = 'down' | 'up' | 'left' | 'right';

/**
 * Personagem do jogador — sprite pixel art do pack Modern Interiors (LimeZu), animado nas 4
 * direções, com SOMBRA nos pés (ancora no chão) e o NOME por cima.
 *
 * A física fica num RETÂNGULO invisível (o colisor, ~pés) e o sprite/sombra/nome o seguem.
 */
export class Player {
  readonly collider: Phaser.GameObjects.Rectangle;
  readonly sprite: Phaser.GameObjects.Sprite;
  private readonly shadow: Phaser.GameObjects.Ellipse;
  private readonly nameText: Phaser.GameObjects.Text;

  private readonly body: Phaser.Physics.Arcade.Body;
  private readonly char: string;
  private readonly speed = 130;
  private facing: Facing = 'down';

  constructor(scene: Phaser.Scene, x: number, y: number, char: string, nome: string) {
    this.char = char;
    this.collider = scene.add.rectangle(x, y, 14, 12).setVisible(false);
    scene.physics.add.existing(this.collider);
    this.body = this.collider.body as Phaser.Physics.Arcade.Body;
    this.body.setCollideWorldBounds(true);

    this.shadow = scene.add.ellipse(x, y, 26, 10, 0x000000, 0.28).setDepth(9);
    this.sprite = scene.add.sprite(x, y, `${char}-idle`, 18).setScale(2).setDepth(10);
    this.sprite.play(`idle-${char}-down`);
    this.nameText = scene.add
      .text(x, y, nome, { fontFamily: 'monospace', fontSize: '12px', color: '#fff4e0', stroke: '#000000', strokeThickness: 3 })
      .setOrigin(0.5, 1)
      .setDepth(11);

    this.syncFollowers();
  }

  move(dirX: number, dirY: number): void {
    const v = new Phaser.Math.Vector2(dirX, dirY);
    const moving = v.lengthSq() > 0;
    if (moving) v.normalize().scale(this.speed);
    this.body.setVelocity(v.x, v.y);

    if (dirX < 0) this.facing = 'left';
    else if (dirX > 0) this.facing = 'right';
    else if (dirY < 0) this.facing = 'up';
    else if (dirY > 0) this.facing = 'down';

    const key = `${moving ? 'walk' : 'idle'}-${this.char}-${this.facing}`;
    if (this.sprite.anims.currentAnim?.key !== key) this.sprite.play(key, true);

    this.syncFollowers();
  }

  /** Sombra nos pés, sprite acima do colisor, nome sobre a cabeça. */
  private syncFollowers(): void {
    const { x, y } = this.collider;
    this.shadow.setPosition(x, y + 12);
    this.sprite.setPosition(x, y - 16);
    this.nameText.setPosition(x, y - 42);
  }

  get x(): number {
    return this.collider.x;
  }

  get y(): number {
    return this.collider.y;
  }
}
