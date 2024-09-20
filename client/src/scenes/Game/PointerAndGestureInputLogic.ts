import { Grid } from '../../elements/Grid';
import { cellSize } from '../../main';
import { DraggablePointerAndGestureInput } from '../../modalities/PointerAndGestureInput';
import { Coord } from '../../shared/models';
import { Game } from './Game';
import { IInputLogicExtension, InputLogic } from './InputLogic';

/**
 * methods to interact w/ point-and-click/dragging in Game
 * @implements IInputLogicExtension
 */
export class PointerAndGestureInputLogic extends DraggablePointerAndGestureInput implements IInputLogicExtension {
  private crosshairSnapToCell() {
    const coord = this.opposingGrid.getCoordToGridCell(
      this.inputLogic.crosshairRef.x + 35,
      this.inputLogic.crosshairRef.y + 35,
    );
    this.inputLogic.selectCoord(coord);
  }

  /** @override */
  protected evaluateGestures(gestureCoords: Coord[]) {
    console.log(gestureCoords);
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
      this.inputLogic.attackCoord(coord);
      return;
    }
    const selectedCoord = this.inputLogic.getSelectedCellCoord();
    if (
      pointer.rightButtonDown() &&
      selectedCoord.x === coord.x &&
      selectedCoord.y === coord.y /* right pointerdown on crosshair: start dragging */
    ) {
      this.dragstart(pointer);
      return;
    }
    super.pointerdown(pointer); // right pointerdown, no crosshair: draw gesture
  }

  /** @override */
  protected pointermove(pointer: Phaser.Input.Pointer) {
    if (this.dragging) {
      this.inputLogic.crosshairRef.setX(pointer.x - cellSize / 2).setY(pointer.y - cellSize / 2);
      this.dragmove(pointer);
      // this.scene.children.bringToTop(ship.shipContainerRef);
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
  ) {
    super(scene, coord, width, height);
  }

  attackCoordExt() {
    this.dragend();
  }

  selectCoordExt() {}
}
