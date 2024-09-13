import { Coord } from '../shared/models';

export abstract class GestureInput {
  /**  */
  protected abstract evaluateGestures(gestureCoords: Coord[]): void;

  constructor(protected scene: Phaser.Scene) {}

  /**
   *
   */
  drawGestureCanvas(coord: Coord, width: number, height: number) {
    const canvas = this.scene.add
      .rectangle(coord.x, coord.y, width, height)
      .setOrigin(0)
      .setStrokeStyle(4, 0xd2042d, 0.2)
      .setInteractive();
    // todo der stroke style sollte immer alpha 1 haben, damit die ecken nicht überdeckt sind
    const pencil = this.scene.add.image(coord.x + width - 30, coord.y + height - 30, 'pencil').setAlpha(0.2);
    let drawing = false;
    let gestureCoords: Coord[];
    let graphics: Phaser.GameObjects.Graphics | undefined;
    let lastPosition: Phaser.Math.Vector2 | undefined;

    canvas.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) {
        drawing = true;
        gestureCoords = [];
        canvas.setStrokeStyle(4, 0xd2042d, 1);
        pencil.setAlpha(1);
        lastPosition = pointer.position.clone();
        graphics = this.scene.add.graphics();
      }
    });
    canvas.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (drawing && graphics && lastPosition) {
        this.scene.children.bringToTop(canvas);
        graphics
          .lineStyle(6, 0xd2042d, 1)
          .beginPath()
          .moveTo(lastPosition.x, lastPosition.y)
          .lineTo(pointer.position.x, pointer.position.y)
          .strokePath()
          .closePath();
        lastPosition = pointer.position.clone();
        gestureCoords.push({ x: Math.round(lastPosition.x), y: Math.round(lastPosition.y) });
      }
    });
    const stopDrawing = () => {
      if (drawing && graphics) {
        this.scene.children.sendToBack(canvas);
        drawing = false;
        canvas.setStrokeStyle(4, 0xd2042d, 0.2);
        pencil.setAlpha(0.2);
        graphics.destroy();
        this.evaluateGestures(gestureCoords);
      }
    };
    canvas.on('pointerup', stopDrawing);
    canvas.on('pointerout', stopDrawing);
  }
}
