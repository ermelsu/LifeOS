import Phaser from 'phaser';

export type Facing = 'down' | 'up' | 'left' | 'right';

/**
 * Personagem do jogador — sprite pixel art do pack Modern Interiors (LimeZu), com animação de
 * andar/parado nas 4 direções.
 *
 * A física fica num RETÂNGULO invisível (o colisor, ~pés do personagem) e o sprite apenas o
 * segue. Isso desacopla a colisão da escala do sprite (evita desalinhamento do corpo Arcade).
 */
export class Player {
  /** Corpo físico invisível (colisão com paredes). */
  readonly collider: Phaser.GameObjects.Rectangle;
  /** Sprite visível e animado. */
  readonly sprite: Phaser.GameObjects.Sprite;

  private readonly body: Phaser.Physics.Arcade.Body;
  private readonly speed = 130;
  private facing: Facing = 'down';

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.collider = scene.add.rectangle(x, y, 14, 12).setVisible(false);
    scene.physics.add.existing(this.collider);
    this.body = this.collider.body as Phaser.Physics.Arcade.Body;
    this.body.setCollideWorldBounds(true);

    this.sprite = scene.add.sprite(x, y, 'adam-idle', 18).setScale(2).setDepth(10);
    this.sprite.play('idle-down');
    this.syncSprite();
  }

  /** Aplica movimento (direção -1..1 por eixo) e escolhe a animação. Chamado a cada frame. */
  move(dirX: number, dirY: number): void {
    const v = new Phaser.Math.Vector2(dirX, dirY);
    const moving = v.lengthSq() > 0;
    if (moving) v.normalize().scale(this.speed);
    this.body.setVelocity(v.x, v.y);

    if (dirX < 0) this.facing = 'left';
    else if (dirX > 0) this.facing = 'right';
    else if (dirY < 0) this.facing = 'up';
    else if (dirY > 0) this.facing = 'down';

    const key = `${moving ? 'walk' : 'idle'}-${this.facing}`;
    if (this.sprite.anims.currentAnim?.key !== key) this.sprite.play(key, true);

    this.syncSprite();
  }

  /** Mantém o sprite alinhado ao colisor (pés do personagem ~ centro do colisor). */
  private syncSprite(): void {
    this.sprite.setPosition(this.collider.x, this.collider.y - 16);
  }

  get x(): number {
    return this.collider.x;
  }

  get y(): number {
    return this.collider.y;
  }
}
