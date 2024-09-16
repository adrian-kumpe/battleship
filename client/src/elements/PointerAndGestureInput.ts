import { Coord } from '../shared/models';

/**
 * generic methods to handle pointer and gesture inputs
 * @abstract
 */
export abstract class PointerAndGestureInput {
  protected drawing = false;
  protected gestureCoords: Coord[];
  protected graphics?: Phaser.GameObjects.Graphics;
  protected lastPosition?: Phaser.Math.Vector2;
  protected canvas: Phaser.GameObjects.Rectangle;
  protected pencil: Phaser.GameObjects.Image;

  private drawGestureCanvas(coord: Coord, width: number, height: number) {
    const canvas = this.scene.add
      .rectangle(coord.x, coord.y, width, height)
      .setOrigin(0)
      .setStrokeStyle(4, 0xd2042d, 0.2)
      .setInteractive();
    // todo der stroke style sollte immer alpha 1 haben, damit die ecken nicht überdeckt sind
    const pencil = this.scene.add.image(coord.x + width - 30, coord.y + height - 30, 'pencil').setAlpha(0.2);
    canvas
      .on('pointerdown', (pointer: Phaser.Input.Pointer) => this.pointerdown(pointer))
      .on('pointermove', (pointer: Phaser.Input.Pointer) => this.pointermove(pointer))
      .on('pointerup', (pointer: Phaser.Input.Pointer) => this.pointerup(pointer))
      .on('pointerout', (pointer: Phaser.Input.Pointer) => this.pointerup(pointer));
    this.canvas = canvas;
    this.pencil = pencil;
  }

  /**
   * implement actions to handle gestures
   * @abstract
   */
  protected abstract evaluateGestures(gestureCoords: Coord[]): void;

  protected pointerdown(pointer: Phaser.Input.Pointer) {
    if (pointer.rightButtonDown()) {
      this.drawing = true;
      this.gestureCoords = [];
      this.canvas.setStrokeStyle(4, 0xd2042d, 1);
      this.pencil.setAlpha(1);
      this.lastPosition = pointer.position.clone();
      this.graphics = this.scene.add.graphics();
    }
  }

  protected pointermove(pointer: Phaser.Input.Pointer) {
    if (this.drawing && this.graphics && this.lastPosition) {
      this.graphics
        .lineStyle(6, 0xd2042d, 1)
        .beginPath()
        .moveTo(this.lastPosition.x, this.lastPosition.y)
        .lineTo(pointer.position.x, pointer.position.y)
        .strokePath()
        .closePath();
      this.lastPosition = pointer.position.clone();
      this.gestureCoords.push({ x: Math.round(this.lastPosition.x), y: Math.round(this.lastPosition.y) });
    }
  }

  protected pointerup(pointer: Phaser.Input.Pointer) {
    if (this.drawing && this.graphics && !pointer.rightButtonDown()) {
      this.drawing = false;
      this.canvas.setStrokeStyle(4, 0xd2042d, 0.2);
      this.pencil.setAlpha(0.2);
      this.graphics.destroy();
      this.evaluateGestures(this.gestureCoords);
    }
  }

  constructor(
    protected scene: Phaser.Scene,
    coord: Coord,
    width: number,
    height: number,
  ) {
    this.drawGestureCanvas(coord, width, height);
  }
}
