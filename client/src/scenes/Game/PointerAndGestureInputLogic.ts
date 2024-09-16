import { PointerAndGestureInput } from '../../modalities/PointerAndGestureInput';
import { Coord } from '../../shared/models';
import { Game } from './Game';
import { IInputLogicExtension } from './InputLogic';

/**
 * methods to interact w/ point-and-click/dragging in Game
 * @implements IInputLogicExtension
 */
export class PointerAndGestureInputLogic extends PointerAndGestureInput implements IInputLogicExtension {
  /** @override */
  evaluateGestures(gestureCoords: Coord[]) {
    console.log(gestureCoords);
  }

  constructor(scene: Game, coord: Coord, width: number, height: number) {
    super(scene, coord, width, height);
  }

  attackCoordExt() {}
}
