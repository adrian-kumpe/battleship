import { gameRadio } from '../main';
import { Coord } from '../shared/models';
import { GestureRecognitionService, Gestures } from './GestureRecognitionService';

export class GestureCanvas {
  constructor(
    private gestureRecognition: GestureRecognitionService,
    private gestureActions: Map<Gestures, () => void>,
  ) {}

  public drawGestureCanvas(scene: Phaser.Scene, coord: Coord, width: number, height: number) {
    const canvas = scene.add
      .rectangle(coord.x, coord.y, width, height)
      .setOrigin(0)
      .setStrokeStyle(4, 0xd2042d, 0.2)
      .setInteractive();
    const pencil = scene.add.image(coord.x + width - 30, coord.y + height - 30, 'pencil').setAlpha(0.2);
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
        graphics = scene.add.graphics();
      }
    });
    canvas.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (drawing && graphics && lastPosition) {
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
        drawing = false;
        canvas.setStrokeStyle(4, 0xd2042d, 0.2);
        pencil.setAlpha(0.2);
        graphics.destroy();
        const { gesture, d } = this.gestureRecognition.getGesture(gestureCoords);
        if (d > 1000) {
          gameRadio.sendMessage("Gesture couldn't be recognized with sufficient certainty");
        } else {
          gameRadio.sendMessage(`Gesture "${this.gestureRecognition.getGestureName(gesture)}" was recognized`);
          const action = this.gestureActions.get(gesture);
          if (action) {
            action();
          }
        }
      }
    };
    canvas.on('pointerup', stopDrawing);
    canvas.on('pointerout', stopDrawing);
  }
}
