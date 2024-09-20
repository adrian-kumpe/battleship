import { PointerAndGestureInput } from '../../modalities/PointerAndGestureInput';
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
  // graphics for dragging
  private draggingLastPosition?: Phaser.Math.Vector2;
  private draggingGraphicsArray: Phaser.GameObjects.Graphics[] = [];

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
    const coord = this.placingGrid.getCoordToGridCell(pointer.x, pointer.y);
    if (pointer.leftButtonDown() /* left pointerdown: click */) {
      this.inputLogic.confirmAction(coord);
      return;
    }
    const shipIndexAtCoord = this.shipArray.getShipIndexAtCoord(coord);
    if (
      pointer.rightButtonDown() &&
      shipIndexAtCoord !== undefined &&
      this.inputLogic.selectedShipIndex === undefined /* right pointerdown on a ship: start dragging */
    ) {
      const ship: Ship = this.shipArray[shipIndexAtCoord];
      if (ship) {
        this.dragging = true;
        this.inputLogic.selectShip(shipIndexAtCoord);
        this.dragCorrectionActive = false; // drag correction is not active yet
        this.dragCorrection = {
          xPx: pointer.x - (ship.shipContainerRef?.x ?? 0),
          yPx: pointer.y - (ship.shipContainerRef?.y ?? 0),
        };
        // to add dragging trail graphics
        this.draggingLastPosition = pointer.position.clone();
      }
      return;
    }
    super.pointerdown(pointer); // right pointerdown, no ship: draw gesture
  }

  /** @override */
  protected pointermove(pointer: Phaser.Input.Pointer) {
    if (
      this.dragging &&
      this.inputLogic.selectedShipIndex !== undefined &&
      this.draggingLastPosition /* right pointermove and dragging: drag ship */
    ) {
      const ship = this.inputLogic.getSelectedShip();
      if (ship && ship.shipContainerRef) {
        ship.shipContainerRef.x = pointer.x - this.getDragCorrection().xPx;
        ship.shipContainerRef.y = pointer.y - this.getDragCorrection().yPx;
        // draw dragging trail
        const graphics = this.scene.add
          .graphics()
          .lineStyle(6, 0xff7700, 1)
          .beginPath()
          .moveTo(this.draggingLastPosition.x, this.draggingLastPosition.y)
          .lineTo(pointer.position.x, pointer.position.y)
          .strokePath()
          .closePath();
        this.draggingGraphicsArray.push(graphics);
        this.draggingGraphicsArray.map((g, i) =>
          g.setAlpha(Math.max(0, 1 - (this.draggingGraphicsArray.length - i) * 0.01)),
        );
        this.scene.children.bringToTop(ship.shipContainerRef);
        this.draggingLastPosition = pointer.position.clone();
      }
      return;
    }
    super.pointermove(pointer); // right pointermove: draw gesture
  }

  /** @override */
  protected pointerup(pointer: Phaser.Input.Pointer) {
    if (
      !pointer.rightButtonDown() &&
      this.dragging &&
      this.inputLogic.selectedShipIndex !== undefined /* right pointerup and dragging: stop dragging */
    ) {
      const ship = this.inputLogic.getSelectedShip();
      if (ship) {
        ship.snapToCell();
        this.inputLogic.selectShip(undefined);
        this.dragging = false;
        this.draggingGraphicsArray.forEach((g) => g.destroy());
      }
      return;
    }
    super.pointerup(pointer); // right pointerup: confirm gesture
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
    this.draggingGraphicsArray.forEach((g) => g.destroy());
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
