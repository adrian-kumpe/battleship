import { Grid } from '../../elements/Grid';
import { KeyboardInput } from '../../modalities/KeyboardInput';
import { ShipArray } from '../../elements/Ship';
import { GameSetup } from './GameSetup';
import { IInputLogicExtension, InputLogic } from './InputLogic';

// todo namespace verwenden?
/**
 * methods to interact w/ keyboard in GameSetup
 * @implements IInputLogicExtension
 */
export class KeyboardInputLogic extends KeyboardInput implements IInputLogicExtension {
  /** whether the keyboard started exclusively interacting w/ a ship */
  private exclusiveInput = false;

  /** visibility of the focused cell is recalculated */
  private updateFocusCellVisibility(alpha?: 0 | 1) {
    const visible = this.inputLogic.selectedShipIndex === undefined;
    this.focusedCellRef?.setAlpha(alpha ?? (visible ? 1 : 0));
  }

  /** focused cell is relocated to the selected ships main coord */
  private centerFocusedCell() {
    const i = this.inputLogic.selectedShipIndex;
    if (i !== undefined) {
      this.focusCell(this.shipArray[i].getCoord());
    }
  }

  /**
   * navigate w/ arrow keys
   * @override
   */
  protected arrowKeyAction(shiftX: -1 | 0 | 1, shiftY: -1 | 0 | 1) {
    super.arrowKeyAction(shiftX, shiftY);
    if (this.exclusiveInput) {
      this.inputLogic.moveShip(false, this.getFocusCellCoord());
    } else {
      this.updateFocusCellVisibility(1);
    }
  }

  updateActiveStateExt() {}

  updateVerticalAlignExt() {
    if (this.focusedCellRef) {
      this.scene.children.bringToTop(this.focusedCellRef);
    }
  }

  constructor(
    scene: GameSetup,
    placingGrid: Grid,
    offsetX: number,
    offsetY: number,
    private inputLogic: InputLogic,
    private shipArray: ShipArray,
  ) {
    super(scene, placingGrid, offsetX, offsetY);
    // add keyboard inputs
    if (this.scene.input.keyboard) {
      this.scene.input.keyboard
        .on('keydown-UP', () => this.arrowKeyAction(0, -1))
        .on('keydown-DOWN', () => this.arrowKeyAction(0, 1))
        .on('keydown-LEFT', () => this.arrowKeyAction(-1, 0))
        .on('keydown-RIGHT', () => this.arrowKeyAction(1, 0))
        .on('keydown-ESC', this.deselectExt.bind(this))
        .on('keydown-ENTER', () => inputLogic.confirmAction(this.getFocusCellCoord()))
        .on('keydown-SPACE', () => inputLogic.confirmAction(this.getFocusCellCoord()))
        .on('keydown-R', () => inputLogic.rotateShip());
    }
  }

  confirmActionExt() {
    this.updateFocusCellVisibility();
    this.centerFocusedCell();
    this.exclusiveInput = this.inputLogic.selectedShipIndex !== undefined;
  }

  selectShipExt() {
    this.updateFocusCellVisibility(0);
  }

  selectCoordExt() {}

  moveShipExt() {}

  rotateShipExt() {
    this.centerFocusedCell();
  }

  deselectExt() {
    this.updateFocusCellVisibility();
  }
}
