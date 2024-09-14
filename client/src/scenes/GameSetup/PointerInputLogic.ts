import { Grid } from '../../elements/Grid';
import { Ship, ShipArray } from '../../elements/Ship';
import { GameSetup } from './GameSetup';
import { InputLogic, IInputLogicExtension } from './InputLogic';

/**
 * methods to interact w/ point-and-click/dragging in GameSetup
 * @implements IInputLogicExtension
 */
export class PointerInputLogic implements IInputLogicExtension {
  /** when dragging the pointer is not centered on the ship; only after first rotating activate the correction */
  private dragCorrectionActive = false;
  /** distance between pointer and center of ship  */
  private dragCorrection?: { xPx: number; yPx: number };
  /** cache the current drag to emit drag event when rotating */
  private drag?: { xPx: number; yPx: number };

  private dragging = false;

  /** get the computed drag correction */
  private getDragCorrection(): { xPx: number; yPx: number } {
    const ship = this.inputLogic.getSelectedShip();
    if (this.dragCorrectionActive && ship) {
      return {
        xPx: ship.getDefaultOriginShift('↕️') + (this.dragCorrection?.xPx ?? 0),
        yPx: ship.getDefaultOriginShift('↔️') + (this.dragCorrection?.yPx ?? 0),
      };
    }
    return { xPx: 0, yPx: 0 };
  }

  updateActiveStateExt() {}

  updateVerticalAlignExt() {}

  constructor(
    private scene: GameSetup,
    private inputLogic: InputLogic,
    private shipArray: ShipArray,
    private placingGrid: Grid,
  ) {
    // add pointer input + dragging
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) {
        const coord = this.placingGrid.getCoordToGridCell(pointer.x, pointer.y);
        const shipIndexAtCoord = this.shipArray.getShipIndexAtCoord(coord);
        if (shipIndexAtCoord === undefined || this.inputLogic.selectedCoord !== undefined /* click */) {
          inputLogic.confirmAction(coord);
          return;
        }
        const ship: Ship = this.shipArray[shipIndexAtCoord];
        if (this.inputLogic.selectedShipIndex === undefined /* drag */ && ship) {
          this.dragging = true;
          inputLogic.selectShip(shipIndexAtCoord);
          this.dragCorrectionActive = false; // drag correction is not active yet
          this.dragCorrection = {
            xPx: (ship.shipContainerRef?.x ?? 0) - pointer.x - ship.getDefaultOriginShift('↔️'), // set the drag correction according the pointer's and ship's position
            yPx: (ship.shipContainerRef?.y ?? 0) - pointer.y - ship.getDefaultOriginShift('↔️'), // todo warum ist das horizontal
          };
          return;
        }
      }
    });
    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.dragging && this.inputLogic.selectedShipIndex !== undefined) {
        const ship = this.shipArray[this.inputLogic.selectedShipIndex];
        ship.shipContainerRef.x = pointer.x - this.getDragCorrection().xPx;
        ship.shipContainerRef.y = pointer.y - this.getDragCorrection().yPx;
        this.drag = { xPx: pointer.x, yPx: pointer.y };
      }
    });
    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      console.log('alarm');
      if (pointer.leftButtonDown()) {
        return;
      }
      if (this.dragging && this.inputLogic.selectedShipIndex !== undefined) {
        const ship = this.shipArray[this.inputLogic.selectedShipIndex];
        ship.snapToCell();
        inputLogic.selectShip(undefined);
        this.drag = undefined;
        this.dragging = false;
      }
    });
  }

  confirmActionExt() {
    this.dragging = false;
  }

  selectShipExt() {}

  selectCoordExt() {}

  moveShipExt() {}

  rotateShipExt() {
    this.dragCorrectionActive = true;
    const ship = this.inputLogic.getSelectedShip();
    if (ship && this.drag) {
      ship.shipContainerRef?.emit('drag', undefined, this.drag.xPx, this.drag.yPx); // manually emit drag event because drag event is triggered only when changing the pointer's position
    }
  }

  deselectExt() {}
}
