import { GestureRecognition, Gestures } from '../../elements/Gestures';
import { Grid } from '../../elements/Grid';
import { cellSize, gameRadio, gridSize } from '../../main';
import { DraggablePointerAndGestureInput } from '../../modalities/PointerAndGestureInput';
import { Coord } from '../../shared/models';
import { Game } from './Game';
import { IInputLogicExtension, InputLogic } from './InputLogic';

/**
 * methods to interact w/ point-and-click/dragging in Game
 * @implements IInputLogicExtension
 */
export class PointerAndGestureInputLogic extends DraggablePointerAndGestureInput<Game> implements IInputLogicExtension {
  private crosshairSnapToCell() {
    const coord = this.opposingGrid.getCoordToGridCell(
      this.inputLogic.crosshairRef.x + 35,
      this.inputLogic.crosshairRef.y + 35,
    );
    this.inputLogic.selectCoord(coord);
    this.inputLogic.confirmAttack();
  }

  /** @override */
  protected evaluateGestures(gestureCoords: Coord[]) {
    const { gesture, d } = this.gestureRecognition.getGesture(gestureCoords);
    if (d > 1000) {
      gameRadio.sendMessage("Gesture couldn't be recognized with sufficient certainty");
    } else {
      gameRadio.sendMessage(`Gesture "${this.gestureRecognition.getGestureName(gesture)}" was recognized`);
      (
        new Map<Gestures, () => void>([
          [
            Gestures.CIRCLE,
            () => {
              console.log('CIRCLE');
              this.inputLogic.reload();
            },
          ],
        ]).get(gesture) || (() => {})
      )();
    }
  }

  /** @override */
  protected dragstart(pointer: Phaser.Input.Pointer) {
    super.dragstart(pointer);
    this.inputLogic.exclusiveInputInUse = true;
  }

  /** @override */
  protected dragend() {
    super.dragend();
    this.inputLogic.exclusiveInputInUse = false;
  }

  /** @override */
  protected pointerdown(pointer: Phaser.Input.Pointer) {
    const coord = this.opposingGrid.getCoordToGridCell(pointer.x, pointer.y);
    if (pointer.leftButtonDown()) {
      this.inputLogic.selectCoord(coord);
      this.inputLogic.confirmAttack();
      return;
    }
    const selectedCoord = this.inputLogic.getSelectedCellCoord();
    if (
      pointer.rightButtonDown() &&
      selectedCoord.x === coord.x &&
      selectedCoord.y === coord.y /* right pointerdown on crosshair: start dragging */
    ) {
      this.dragstart(pointer);
      gameRadio.sendMessage('Gesture "drag crosshair" was recognized');
      return;
    }
    super.pointerdown(pointer); // right pointerdown, no crosshair: draw gesture
  }

  /** @override */
  protected pointermove(pointer: Phaser.Input.Pointer) {
    if (this.dragging) {
      const pointermoveWithinBounds = (v: number, offset: number, size: number) =>
        v - offset < 0 ? offset : v - offset - size > 0 ? offset + size : v;
      this.inputLogic.crosshairRef
        .setX(pointermoveWithinBounds(pointer.x - cellSize / 2, this.scene.offsetX, (gridSize - 1) * cellSize))
        .setY(pointermoveWithinBounds(pointer.y - cellSize / 2, this.scene.offsetY, (gridSize - 1) * cellSize));
      this.dragmove(pointer);
      return;
    }
    super.pointermove(pointer); // right pointermove: draw gesture
  }

  /** @override */
  protected pointerup(pointer: Phaser.Input.Pointer) {
    if (!pointer.rightButtonDown() && this.dragging) {
      this.crosshairSnapToCell();
      this.dragend();
      return;
    }
    super.pointerup(pointer); // right pointerup: confirm gesture
  }

  constructor(
    scene: Game,
    coord: Coord,
    width: number,
    height: number,
    private inputLogic: InputLogic,
    private opposingGrid: Grid,
    private gestureRecognition: GestureRecognition,
  ) {
    super(scene, coord, width, height);
  }

  attackCoordExt() {
    this.dragend();
  }

  selectCoordExt() {}

  reloadExt() {}
}
