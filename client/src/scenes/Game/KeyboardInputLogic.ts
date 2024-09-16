import { KeyboardInput } from '../../modalities/KeyboardInput';
import { Grid } from '../../elements/Grid';
import { Game } from './Game';
import { IInputLogicExtension, InputLogic } from './InputLogic';

/**
 * methods to interact w/ keyboard in Game
 * @implements IInputLogicExtension
 */
export class KeyboardInputLogic extends KeyboardInput implements IInputLogicExtension {
  constructor(scene: Game, placingGrid: Grid, offsetX: number, offsetY: number, inputLogic: InputLogic) {
    super(scene, placingGrid, offsetX, offsetY);
    // add keyboard inputs
    if (this.scene.input.keyboard) {
      this.scene.input.keyboard
        .on('keydown-UP', () => this.arrowKeyAction(0, -1))
        .on('keydown-DOWN', () => this.arrowKeyAction(0, 1))
        .on('keydown-LEFT', () => this.arrowKeyAction(-1, 0))
        .on('keydown-RIGHT', () => this.arrowKeyAction(1, 0))
        // .on('keydown-ESC', this.deselectExt.bind(this))
        .on('keydown-ENTER', () => inputLogic.attackCoord(this.getFocusCellCoord()))
        .on('keydown-SPACE', () => inputLogic.attackCoord(this.getFocusCellCoord()));
    }
  }

  attackCoordExt() {}
}
