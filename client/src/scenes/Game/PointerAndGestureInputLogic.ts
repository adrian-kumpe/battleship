import { Grid } from '../../elements/Grid';
import { PointerAndGestureInput } from '../../modalities/PointerAndGestureInput';
import { Coord } from '../../shared/models';
import { Game } from './Game';
import { IInputLogicExtension, InputLogic } from './InputLogic';

/**
 * methods to interact w/ point-and-click/dragging in Game
 * @implements IInputLogicExtension
 */
export class PointerAndGestureInputLogic extends PointerAndGestureInput implements IInputLogicExtension {
  /** @override */
  evaluateGestures(gestureCoords: Coord[]) {
    console.log(gestureCoords);
  }

  /** @override */
  protected pointerdown(pointer: Phaser.Input.Pointer) {
    super.pointerdown(pointer); // right pointerdown: draw gesture
    if (pointer.leftButtonDown()) {
      const coord = this.opposingGrid.getCoordToGridCell(pointer.x, pointer.y);
      this.inputLogic.attackCoord(coord);
    }
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

  attackCoordExt() {}
}
