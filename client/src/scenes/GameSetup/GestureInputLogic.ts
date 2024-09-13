import { GestureRecognition, Gestures } from '../../elements/Gestures';
import { GestureInput } from '../../elements/GestureInput';
import { gameRadio } from '../../main';
import { Coord } from '../../shared/models';
import { GameSetup } from './GameSetup';
import { IInputLogicExtension, InputLogic } from './InputLogic';

/**
 * methods to interact w/ gestures in GameSetup
 * @implements IInputLogicExtension
 */
export class GestureInputLogic extends GestureInput implements IInputLogicExtension {
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

  updateActiveStateExt() {}
  updateVerticalAlignExt() {}

  constructor(
    scene: GameSetup,
    private inputLogic: InputLogic,
    private gestureRecognition: GestureRecognition, // todo das kann doch statisch werden
  ) {
    super(scene);
  }

  confirmActionExt() {}
  selectShipExt() {}
  selectCoordExt() {}
  moveShipExt() {}
  rotateShipExt() {}
  deselectExt() {}
}
