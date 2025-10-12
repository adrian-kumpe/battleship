import { KeyboardInput } from '../../modalities/KeyboardInput';
import { Grid } from '../../elements/Grid';
import { Game } from './Game';
import { IInputLogicExtension, InputLogic } from './InputLogic';
import { layoutConfig } from '../../main';

/**
 * methods to interact w/ keyboard in Game
 * @implements IInputLogicExtension
 */
export class KeyboardInputLogic extends KeyboardInput<Game> implements IInputLogicExtension {
  /** @override */
  protected arrowKeyAction(shiftX: -1 | 0 | 1, shiftY: -1 | 0 | 1) {
    super.arrowKeyAction(shiftX, shiftY);
    const coord = this.getFocusCellCoord();
    const coordWithinGrid =
      coord && coord.x >= 0 && coord.x < layoutConfig.gridSize && coord.y >= 0 && coord.y < layoutConfig.gridSize;
    this.updateFocusCellVisibility(!coordWithinGrid || this.inputLogic.exclusiveInputInUse ? 1 : 0);
    if (coordWithinGrid && !this.inputLogic.exclusiveInputInUse) {
      this.inputLogic.selectCoord(coord);
    }
  }

  // todo bugfix in game und gamesetup für start der koordinate

  constructor(
    scene: Game,
    placingGrid: Grid,
    offsetX: number,
    offsetY: number,
    private inputLogic: InputLogic,
  ) {
    super(scene, placingGrid, offsetX, offsetY);
    // add keyboard inputs
    if (this.scene.input.keyboard) {
      this.scene.input.keyboard
        .on('keydown-UP', () => this.arrowKeyAction(0, -1))
        .on('keydown-DOWN', () => this.arrowKeyAction(0, 1))
        .on('keydown-LEFT', () => this.arrowKeyAction(-1, 0))
        .on('keydown-RIGHT', () => this.arrowKeyAction(1, 0))
        .on('keydown-ESC', () => {
          this.updateFocusCellVisibility(0);
          this.focusCell(undefined);
        })
        .on('keydown-ENTER', () => {
          const coord = this.getFocusCellCoord();
          if (coord) {
            inputLogic.selectCoord(coord);
            inputLogic.confirmAttack();
          }
        })
        .on('keydown-R', () => inputLogic.reload());
    }
  }

  attackCoordExt() {}

  selectCoordExt() {
    this.focusCell(this.inputLogic.getSelectedCellCoord());
    this.updateFocusCellVisibility(0);
  }

  reloadExt() {}
}
