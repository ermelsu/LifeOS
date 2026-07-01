import Phaser from 'phaser';

/**
 * Personagem do jogador. No Módulo 1 é um placeholder (retângulo) com corpo de física
 * Arcade que colide com paredes e portas fechadas. A arte (sprite pixel) entra depois.
 */
export class Player {
  readonly gameObject: Phaser.GameObjects.Rectangle;
  private readonly body: Phaser.Physics.Arcade.Body;
  private readonly speed = 200;

  constructor(scene: Phaser.Scene, x: number, y: number, size: number) {
    this.gameObject = scene.add.rectangle(x, y, size, size, 0xffd27f).setDepth(10);
    scene.physics.add.existing(this.gameObject);
    this.body = this.gameObject.body as Phaser.Physics.Arcade.Body;
    this.body.setCollideWorldBounds(true);
  }

  /** Define a velocidade a partir de uma direção (-1..1 em cada eixo). */
  move(dirX: number, dirY: number): void {
    const v = new Phaser.Math.Vector2(dirX, dirY);
    if (v.lengthSq() > 0) v.normalize().scale(this.speed);
    this.body.setVelocity(v.x, v.y);
  }

  get x(): number {
    return this.gameObject.x;
  }

  get y(): number {
    return this.gameObject.y;
  }
}
