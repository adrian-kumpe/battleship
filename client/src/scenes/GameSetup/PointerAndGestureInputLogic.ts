import { PointerAndGestureInput } from '../../elements/PointerAndGestureInput';
import { GestureRecognition, Gestures } from '../../elements/Gestures';
import { Grid } from '../../elements/Grid';
import { Ship, ShipArray } from '../../elements/Ship';
import { gameRadio } from '../../main';
import { Coord } from '../../shared/models';
import { GameSetup } from './GameSetup';
import { InputLogic, IInputLogicExtension } from './InputLogic';

/**
 * methods to interact w/ point-and-click/dragging in GameSetup
 * @implements IInputLogicExtension
 */
export class PointerAndGestureInputLogic extends PointerAndGestureInput implements IInputLogicExtension {
  /** when dragging the pointer is not centered on the ship; only after first rotating activate the correction */
  private dragCorrectionActive = false;
  /** distance between center of ship and pointer */
  private dragCorrection?: { xPx: number; yPx: number };
  /** current dragging state to use in pointer input events */
  private dragging = false;

  /** get the computed drag correction */
  private getDragCorrection(): { xPx: number; yPx: number } {
    const ship = this.inputLogic.getSelectedShip();
    if (ship) {
      const getOriginDragCorrection = (orientation: '↔️' | '↕️') => {
        return orientation === ship.getShipMetaInformation().orientation
          ? -Math.abs(ship.getDefaultOriginShift('↔️') - ship.getDefaultOriginShift('↕️'))
          : 0;
      };
      return {
        xPx: this.dragCorrectionActive ? getOriginDragCorrection('↔️') : this.dragCorrection?.xPx ?? 0,
        yPx: this.dragCorrectionActive ? getOriginDragCorrection('↕️') : this.dragCorrection?.yPx ?? 0,
      };
    }
    return { xPx: 0, yPx: 0 };
  }

  /** @override */
  evaluateGestures(gestureCoords: Coord[]) {
    // todo sollte das gameradio nicht woanders hin?
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
              this.inputLogic.rotateShip();
            },
          ],
          [
            Gestures.ARROW_UP,
            () => {
              console.log('ARROW_UP');
            },
          ],
          [
            Gestures.ARROW_DOWN,
            () => {
              console.log('ARROW_DOWN');
            },
          ],
          [
            Gestures.ARROW_LEFT,
            () => {
              console.log('ARROW_LEFT');
            },
          ],
          [
            Gestures.ARROW_RIGHT,
            () => {
              console.log('ARROW_RIGHT');
            },
          ],
        ]).get(gesture) || (() => {})
      )();
    }
  }

  /** @override */
  protected pointerdown(pointer: Phaser.Input.Pointer) {
    super.pointerdown(pointer); // right pointerdown: draw gesture
    if (pointer.leftButtonDown() && !this.dragging /* left pointerdown: start dragging */) {
      const coord = this.placingGrid.getCoordToGridCell(pointer.x, pointer.y);
      const shipIndexAtCoord = this.shipArray.getShipIndexAtCoord(coord);
      if (shipIndexAtCoord === undefined || this.inputLogic.selectedCoord !== undefined /* click */) {
        this.inputLogic.confirmAction(coord);
        return;
      }
      const ship: Ship = this.shipArray[shipIndexAtCoord];
      if (this.inputLogic.selectedShipIndex === undefined /* drag */ && ship) {
        this.dragging = true;
        this.inputLogic.selectShip(shipIndexAtCoord);
        this.dragCorrectionActive = false; // drag correction is not active yet
        this.dragCorrection = {
          xPx: pointer.x - (ship.shipContainerRef?.x ?? 0),
          yPx: pointer.y - (ship.shipContainerRef?.y ?? 0),
        };
        return;
      }
    }
  }

  /** @override */
  protected pointermove(pointer: Phaser.Input.Pointer) {
    super.pointermove(pointer); // right pointermove: draw gesture
    if (this.dragging && this.inputLogic.selectedShipIndex !== undefined /* left pointermove: drag ship */) {
      const ship = this.shipArray[this.inputLogic.selectedShipIndex];
      ship.shipContainerRef.x = pointer.x - this.getDragCorrection().xPx;
      ship.shipContainerRef.y = pointer.y - this.getDragCorrection().yPx;
    }
  }

  /** @override */
  protected pointerup(pointer: Phaser.Input.Pointer) {
    super.pointerup(pointer); // right pointerup: confirm gesture
    if (!pointer.leftButtonDown() /* left pointerup: stop dragging */) {
      if (this.dragging && this.inputLogic.selectedShipIndex !== undefined) {
        const ship = this.shipArray[this.inputLogic.selectedShipIndex];
        ship.snapToCell();
        this.inputLogic.selectShip(undefined);
        this.dragging = false;
      }
    }
  }

  updateActiveStateExt() {}

  updateVerticalAlignExt() {}

  constructor(
    scene: GameSetup,
    private inputLogic: InputLogic,
    private shipArray: ShipArray,
    private placingGrid: Grid,
    private gestureRecognition: GestureRecognition,
    coord: Coord,
    width: number,
    height: number,
  ) {
    super(scene, coord, width, height);
  }

  confirmActionExt() {
    this.dragging = false;
  }

  selectShipExt() {}

  selectCoordExt() {}

  moveShipExt() {}

  rotateShipExt() {
    this.dragCorrectionActive = true;
    // todo die funktion wird auch außerhalb des input canvas aufgerufen
    this.pointermove(this.scene.input.activePointer); // manually emit drag event because drag event is triggered only when changing the pointer's position
  }

  deselectExt() {}
}
