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
  /** whether dragstart/pointerdown should be handled as clicking */
  private allowClick = true;
  /** whether dragstart/pointerdown should be handled as dragging */
  private allowDrag = false;

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
    // add pointer input
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) {
        if (this.allowClick) {
          const coord = this.placingGrid.getCoordToGridCell(pointer.x, pointer.y);
          inputLogic.confirmAction(coord);
        }
        this.allowClick = true;
      }
    });
    // add dragging input
    this.shipArray.forEach((s: Ship, i: number) => {
      const shipContainerRef = s.getShipContainerRef();
      if (shipContainerRef) {
        this.scene.input.setDraggable(shipContainerRef);
        shipContainerRef.on('drag', (_: Phaser.Input.Pointer, dragX: number, dragY: number) => {
          if (this.allowDrag) {
            shipContainerRef.x = dragX - this.getDragCorrection().xPx;
            shipContainerRef.y = dragY - this.getDragCorrection().yPx;
            this.drag = { xPx: dragX, yPx: dragY };
          }
        });
        shipContainerRef.on('dragstart', (pointer: Phaser.Input.Pointer) => {
          // dragstart event is called before pointerdown
          const coord = this.placingGrid.getCoordToGridCell(pointer.x, pointer.y);
          if (
            this.shipArray.getShipIndexAtCoord(coord) === undefined ||
            this.inputLogic.selectedCoord !== undefined /* click */
          ) {
            this.allowClick = true;
            return; // clicking and dragging both start w/ dragstart/pointerdown; if there is a selected coord or no ship is targeted, handle as click
          }
          this.allowClick = false;
          if (this.inputLogic.selectedShipIndex === undefined /* drag */) {
            this.allowDrag = true;
            inputLogic.selectShip(i);
            this.dragCorrectionActive = false; // drag correction is not active yet
            this.dragCorrection = {
              xPx: shipContainerRef.x - pointer.x - s.getDefaultOriginShift('↔️'), // set the drag correction according the pointer's and ship's position
              yPx: shipContainerRef.y - pointer.y - s.getDefaultOriginShift('↔️'), // todo warum ist das horizontal
            };
            return;
          }
          this.allowDrag = false;
        });
        shipContainerRef.on('dragend', () => {
          if (this.allowDrag) {
            s.snapToCell();
            inputLogic.selectShip(undefined);
            this.drag = undefined;
          }
        });
      }
    });
  }

  confirmActionExt() {
    this.allowDrag = false;
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
